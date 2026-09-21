import { NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { and, eq, lt, or } from "drizzle-orm";
import { randomBytes, randomInt } from "crypto";
import { clientIp, normalizePhone } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { sendOtpSms, smsConfigured } from "@/lib/sms";
import {
  botChatLink,
  codeMessage,
  getBotUsername,
  isBotConfigured,
  miniAppKeyboard,
  sendMessage,
  startLink,
} from "@/lib/telegram-bot";
import { verifyInitData } from "@/lib/tg-auth";
import { BOT_OTP_TTL_MINUTES, OTP_LENGTH, OTP_TTL_MINUTES } from "@/lib/constants";
import { withApiErrors } from "@/lib/api";
import { telegramBotToken } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Faqat dev uchun yoki ataylab yoqilgan bo'lsa kodni javobda qaytaramiz. */
function devOtpEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.OTP_DEV_MODE === "true";
}

/** Mini App'dan kelgan initData imzosini tekshirib, Telegram ID ni qaytaradi. */
async function telegramIdFromInitData(initData: unknown): Promise<number | null> {
  if (typeof initData !== "string" || !initData) return null;
  const botToken = await telegramBotToken();
  if (!botToken || !verifyInitData(initData, botToken)) return null;
  const raw = new URLSearchParams(initData).get("user");
  if (!raw) return null;
  try {
    const id = Number((JSON.parse(raw) as { id?: number }).id);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/**
 * Telefon raqamni tasdiqlash kodini so'rash.
 *
 * Ustuvorlik tartibi:
 *   1. Telegram bot:
 *      a) Mini App ichida → kod to'g'ridan-to'g'ri shu Telegram chatga yuboriladi.
 *      b) Saytda → botga bir martalik havola beriladi, «Start» bosilganda kod chatda chiqadi.
 *   2. Eskiz.uz SMS — ESKIZ_EMAIL/PASSWORD bo'lsa.
 *   3. Dev rejim — kod javobda qaytadi (development yoki OTP_DEV_MODE=true).
 */
export const POST = withApiErrors(async (req: Request) => {
  const ip = clientIp(req);
  const ipLimit = rateLimit(`otp:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as { phone?: string; initData?: string };
  const phone = normalizePhone(body.phone);
  if (!phone) {
    return NextResponse.json({ error: "Telefon raqam noto'g'ri" }, { status: 400 });
  }

  const phoneLimit = rateLimit(`otp:phone:${phone}`, 3, 10 * 60 * 1000);
  if (!phoneLimit.ok) return tooManyRequests(phoneLimit.retryAfterSeconds);

  const botUsername = (await isBotConfigured()) ? await getBotUsername() : null;
  const useTelegram = Boolean(botUsername);
  const chatTelegramId = useTelegram ? await telegramIdFromInitData(body.initData) : null;
  const ttlMinutes = useTelegram ? BOT_OTP_TTL_MINUTES : OTP_TTL_MINUTES;

  const code = String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
  // Chatga to'g'ridan-to'g'ri yuborilsa havola tokeni kerak emas.
  const token = useTelegram && !chatTelegramId ? randomBytes(24).toString("hex") : null;

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
    telegramId: chatTelegramId,
    deliveredAt: chatTelegramId ? new Date() : null,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  });

  // 1a) Mini App ichida — kodni to'g'ridan-to'g'ri chatga yuboramiz.
  if (useTelegram && chatTelegramId) {
    const sent = await sendMessage(
      chatTelegramId,
      codeMessage(code, phone, ttlMinutes),
      { keyboard: miniAppKeyboard() },
    );
    if (!sent) {
      await db.delete(otpCodes).where(and(eq(otpCodes.phone, phone), eq(otpCodes.code, code)));
      return NextResponse.json(
        { error: "Kodni Telegramga yuborib bo'lmadi. Botni bloklamaganingizni tekshiring." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      phone,
      mode: "bot",
      botUsername,
      chatLink: botChatLink(botUsername),
      codeLength: OTP_LENGTH,
      expiresInMinutes: ttlMinutes,
    });
  }

  // 1b) Saytda — botga bir martalik havola beramiz.
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
  if (await smsConfigured()) {
    const delivered = await sendOtpSms(phone, code);
    if (!delivered) {
      await db.delete(otpCodes).where(and(eq(otpCodes.phone, phone), eq(otpCodes.code, code)));
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
