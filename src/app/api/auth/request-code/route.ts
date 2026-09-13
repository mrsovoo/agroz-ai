import { NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { and, eq, lt, or } from "drizzle-orm";
import { randomInt } from "crypto";
import { clientIp, normalizePhone } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { sendOtpSms, smsConfigured } from "@/lib/sms";
import { OTP_LENGTH, OTP_TTL_MINUTES } from "@/lib/constants";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Faqat dev uchun yoki ataylab yoqilgan bo'lsa kodni javobda qaytaramiz. */
function devOtpEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.OTP_DEV_MODE === "true";
}

export const POST = withApiErrors(async (req: Request) => {
  const ip = clientIp(req);
  const ipLimit = rateLimit(`otp:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as { phone?: string };
  const phone = normalizePhone(body.phone);
  if (!phone) {
    return NextResponse.json({ error: "Telefon raqam noto'g'ri" }, { status: 400 });
  }

  const phoneLimit = rateLimit(`otp:phone:${phone}`, 3, 10 * 60 * 1000);
  if (!phoneLimit.ok) return tooManyRequests(phoneLimit.retryAfterSeconds);

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");

  // Shu raqamning eski ishlatilmagan kodlarini va umuman eskirgan kodlarni tozalaymiz.
  await db
    .delete(otpCodes)
    .where(
      or(
        and(eq(otpCodes.phone, phone), eq(otpCodes.used, false)),
        lt(otpCodes.expiresAt, new Date(Date.now() - 60 * 60 * 1000)),
      ),
    );

  await db.insert(otpCodes).values({
    phone,
    code,
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
  });

  if (smsConfigured()) {
    const delivered = await sendOtpSms(phone, code);
    if (!delivered) {
      await db.delete(otpCodes).where(eq(otpCodes.phone, phone));
      return NextResponse.json(
        { error: "SMS yuborilmadi. Birozdan so'ng qayta urinib ko'ring." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, phone });
  }

  if (!devOtpEnabled()) {
    // Production'da SMS provayder yo'q — kodni javobda qaytarish xavfsizlik teshigi
    // bo'lardi, shuning uchun ochiq xato qaytaramiz.
    return NextResponse.json(
      {
        error:
          "SMS xizmati hali sozlanmagan. ESKIZ_EMAIL va ESKIZ_PASSWORD qo'shing (yoki vaqtincha OTP_DEV_MODE=true qiling).",
      },
      { status: 503 },
    );
  }

  console.warn(`[otp] dev rejim: ${phone} uchun kod ${code}`);
  return NextResponse.json({ ok: true, phone, devCode: code });
});
