import { NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { createSession } from "@/lib/session";
import { cleanText, clientIp, normalizePhone } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { OTP_MAX_ATTEMPTS } from "@/lib/constants";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = withApiErrors(async (req: Request) => {
  const ip = clientIp(req);
  const ipLimit = rateLimit(`verify:ip:${ip}`, 20, 10 * 60 * 1000);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as {
    phone?: string;
    code?: string;
    name?: string;
    region?: string;
    district?: string;
  };

  const phone = normalizePhone(body.phone);
  const code = (body.code ?? "").trim();
  if (!phone || !code) {
    return NextResponse.json({ error: "Ma'lumot yetarli emas" }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), eq(otpCodes.used, false)))
    .orderBy(desc(otpCodes.id))
    .limit(1);

  const otp = rows[0];
  if (!otp) {
    return NextResponse.json({ error: "Kod topilmadi. Yangi kod so'rang." }, { status: 400 });
  }
  if (otp.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Kod eskirgan. Yangi kod so'rang." }, { status: 400 });
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));
    return NextResponse.json(
      { error: "Urinishlar soni tugadi. Yangi kod so'rang." },
      { status: 429 },
    );
  }

  if (otp.code !== code) {
    // Bitta kodni cheksiz sinab ko'rishning oldini olamiz.
    await db
      .update(otpCodes)
      .set({ attempts: sql`${otpCodes.attempts} + 1` })
      .where(eq(otpCodes.id, otp.id));
    const left = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
    return NextResponse.json(
      { error: left > 0 ? `Kod noto'g'ri. Yana ${left} ta urinish qoldi.` : "Kod bloklandi." },
      { status: 400 },
    );
  }

  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, otp.id));

  const name = cleanText(body.name, 120);
  const region = cleanText(body.region, 120);
  const district = cleanText(body.district, 120);

  const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  let user = existing[0];
  if (!user) {
    const inserted = await db
      .insert(users)
      .values({ phone, name, region, district })
      .returning();
    user = inserted[0];
  } else if (name || region || district) {
    const updated = await db
      .update(users)
      .set({
        name: user.name ?? name,
        region: user.region ?? region,
        district: user.district ?? district,
      })
      .where(eq(users.id, user.id))
      .returning();
    user = updated[0];
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
});
