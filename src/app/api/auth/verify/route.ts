import { NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    phone?: string;
    code?: string;
    name?: string;
    region?: string;
  };
  const phone = body.phone ?? "";
  const code = (body.code ?? "").trim();
  if (!phone || !code) {
    return NextResponse.json({ error: "Ma'lumot yetarli emas" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.code, code), eq(otpCodes.used, false)))
    .orderBy(desc(otpCodes.id))
    .limit(1);

  const otp = rows[0];
  if (!otp || otp.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Kod noto'g'ri yoki eskirgan" }, { status: 400 });
  }
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));

  const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  let user = existing[0];
  if (!user) {
    const inserted = await db
      .insert(users)
      .values({ phone, name: body.name ?? null, region: body.region ?? null })
      .returning();
    user = inserted[0];
  } else if (body.name || body.region) {
    const updated = await db
      .update(users)
      .set({ name: body.name ?? user.name, region: body.region ?? user.region })
      .where(eq(users.id, user.id))
      .returning();
    user = updated[0];
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, user });
}
