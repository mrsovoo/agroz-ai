import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import {
  codeMessage,
  expiredLinkMessage,
  greetingMessage,
  isBotConfigured,
  miniAppKeyboard,
  sendMessage,
} from "@/lib/telegram-bot";
import { BOT_OTP_TTL_MINUTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; username?: string };
  };
};

/**
 * Telegram bot webhook.
 * Telegram bu manzilga yangilanishlarni yuboradi (`npm run telegram:setup` bilan ulanadi).
 */
export async function POST(req: Request) {
  if (!isBotConfigured()) {
    return Response.json({ ok: false, error: "bot sozlanmagan" }, { status: 503 });
  }

  // Telegram `secret_token` bilan kelganini tekshiramiz (soxta so'rovlardan himoya).
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!secret) {
    console.warn("[bot] TELEGRAM_WEBHOOK_SECRET o'rnatilmagan — webhook himoyasiz.");
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!chatId) return Response.json({ ok: true });

  const text = message?.text?.trim() ?? "";
  const [command, ...rest] = text.split(/\s+/);
  const payload = rest.join(" ").trim();
  const firstName = message?.from?.first_name;

  // /start <token> — sayt so'ragan kodni yuboramiz.
  if (isStart(command) && payload) {
    const delivered = await deliverCode(chatId, payload, message?.from?.id ?? chatId);
    if (delivered) return Response.json({ ok: true });
    await sendMessage(chatId, expiredLinkMessage(), { keyboard: miniAppKeyboard() });
    return Response.json({ ok: true });
  }

  await sendMessage(chatId, greetingMessage(firstName), { keyboard: miniAppKeyboard() });
  return Response.json({ ok: true });
}

function isStart(command: string | undefined): boolean {
  if (!command) return false;
  // /start yoki /start@botusername
  return command === "/start" || command.startsWith("/start@");
}

/** Bir martalik token bo'yicha kodni Telegram foydalanuvchisiga yuboradi. */
async function deliverCode(chatId: number, token: string, fromId: number): Promise<boolean> {
  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(eq(otpCodes.token, token), eq(otpCodes.used, false), gt(otpCodes.expiresAt, new Date())),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return false;

  // Kim so'raganini yozib qo'yamiz: tasdiqlangandan keyin shu Telegram hisobini
  // foydalanuvchiga ulaymiz va "tasdiqlandi" xabarini yuboramiz.
  await db
    .update(otpCodes)
    .set({ telegramId: fromId, deliveredAt: row.deliveredAt ?? new Date() })
    .where(eq(otpCodes.id, row.id));

  await sendMessage(chatId, codeMessage(row.code, row.phone, BOT_OTP_TTL_MINUTES), {
    keyboard: miniAppKeyboard(),
  });
  return true;
}
