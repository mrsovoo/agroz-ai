import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export const SESSION_COOKIE = "agroai_session";

export async function createSession(userId: number) {
  const id = randomBytes(24).toString("hex");
  await db.insert(sessions).values({ id, userId });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return id;
}

export async function getCurrentUser() {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const rows = await db
    .select({
      id: users.id,
      phone: users.phone,
      name: users.name,
      region: users.region,
      district: users.district,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sid))
    .limit(1);
  return rows[0] ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (sid) {
    await db.delete(sessions).where(eq(sessions.id, sid));
    store.delete(SESSION_COOKIE);
  }
}
