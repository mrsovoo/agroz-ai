import { cookies } from "next/headers";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { SESSION_TTL_DAYS } from "@/lib/constants";

export const SESSION_COOKIE = "agroai_session";

const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

/** HTTPS bo'lmagan (masalan lokal `next start`) holatlarda o'chirish imkoniyati. */
const secureCookie =
  process.env.COOKIE_SECURE === "false" ? false : process.env.NODE_ENV === "production";

export async function createSession(userId: number) {
  const id = randomBytes(24).toString("hex");
  await db.insert(sessions).values({ id, userId });

  // Eskirgan sessiyalarni tozalab turamiz (jadval cheksiz o'smasligi uchun).
  await db
    .delete(sessions)
    .where(lt(sessions.createdAt, new Date(Date.now() - SESSION_TTL_MS)))
    .catch(() => undefined);

  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookie,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
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
    .where(
      and(
        eq(sessions.id, sid),
        // Muddati o'tgan sessiyalar server tomonda ham qabul qilinmaydi.
        gt(sessions.createdAt, new Date(Date.now() - SESSION_TTL_MS)),
      ),
    )
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
