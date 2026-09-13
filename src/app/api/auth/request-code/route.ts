import { NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { and, eq, lt, or } from "drizzle-orm";
import { randomBytes, randomInt } from "crypto";
import { clientIp, normalizePhone } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { sendOtpSms, smsConfigured } from "@/lib/sms";
import { getBotUsername, isBotConfigured, startLink } from "@/lib/telegram-bot";
import { BOT_OTP_TTL_MINUTES, OTP_LENGTH, OTP_TTL_MINUTES } from "@/lib/constants";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Faqat dev uchun yoki ataylab yoqilgan bo'lsa kodni javobda qaytaramiz. */
function devOtpEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.OTP_DEV_MODE === "true";
}

/**
 * Telefon raqamni tasdiqlash kodini so'rash.
 *
 * Ustuvorlik tartibi:
 *   1. Telegram bot — kod botda chiqadi (bepul, SMS kerak emas).
 *   2. Eskiz.uz SMS — ESKIZ_EMAIL/PASSWORD bo'lsa.
 *   3. Dev rejim — kod javobda qaytadi (faqat development yoki OTP_DEV_MODE=true).
 */
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

  const botUsername = isBotConfigured() ? await getBotUsername() : null;
  const useTelegram = Boolean(botUsername);
  const ttlMinutes = useTelegram ? BOT_OTP_TTL_MINUTES : OTP_TTL_MINUTES;

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  const token = useTelegram ? randomBytes(24).toString("hex") : null;

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
    token,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  });

  // 1) Telegram bot orqali
  if (useTelegram && token && botUsername) {
    return NextResponse.json({
      ok: true,
      phone,
      mode: "telegram",
      token,
      botUsername,
      deepLink: startLink(botUsername, token),
      codeLength: OTP_LENGTH,
      expiresInMinutes: ttlMinutes,
    });
  }

  // 2) SMS orqali
  if (smsConfigured()) {
    const delivered = await sendOtpSms(phone, code);
    if (!delivered) {
      await db.delete(otpCodes).where(eq(otpCodes.phone, phone));
      return NextResponse.json(
        { error: "SMS yuborilmadi. Birozdan so'ng qayta urinib ko'ring." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      phone,
      mode: "sms",
      codeLength: OTP_LENGTH,
      expiresInMinutes: ttlMinutes,
    });
  }

  // 3) Hech qanday kanal yo'q
  if (!devOtpEnabled()) {
    return NextResponse.json(
      {
        error:
          "Kod yuborish kanali sozlanmagan. TELEGRAM_BOT_TOKEN qo'shing (tavsiya) yoki ESKIZ_EMAIL/ESKIZ_PASSWORD.",
      },
      { status: 503 },
    );
  }

  console.warn(`[otp] dev rejim: ${phone} uchun kod ${code}`);
  return NextResponse.json({
    ok: true,
    phone,
    mode: "dev",
    devCode: code,
    codeLength: OTP_LENGTH,
    expiresInMinutes: ttlMinutes,
  });
});
