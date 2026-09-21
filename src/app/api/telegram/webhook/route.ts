import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  alreadyVerifiedMessage,
  codeMessage,
  errorMessage,
  expiredLinkMessage,
  greetingKeyboard,
  greetingMessage,
  isBotConfigured,
  miniAppKeyboard,
  sendMessage,
} from "@/lib/telegram-bot";
import { BOT_OTP_TTL_MINUTES } from "@/lib/constants";
import { telegramWebhookSecret } from "@/lib/settings";
import { getNewsFeed } from "@/lib/news";
import { escapeHtml } from "@/lib/tg-escape";

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
 *
 * Saytdan kelgan havola: `https://t.me/<bot>?start=<token>`
 * Foydalanuvchi «Start» bosganda kod shu chatga yuboriladi.
 * Webhook `npm run telegram:setup` bilan ulanadi.
 */
export async function POST(req: Request) {
  if (!(await isBotConfigured())) {
    return Response.json({ ok: false, error: "bot sozlanmagan" }, { status: 503 });
  }

  // Telegram `secret_token` bilan kelganini tekshiramiz (soxta so'rovlardan himoya).
  // Kalit admin panel orqali ham sozlanadi (DB > env).
  const secret = await telegramWebhookSecret();
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }
  if (!secret) {
    console.warn("[bot] webhook secret o'rnatilmagan — webhook himoyasiz.");
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!chatId) return Response.json({ ok: true });

  const text = message?.text?.trim() ?? "";
  const [command, ...rest] = text.split(/\s+/);
  const payload = rest.join(" ").trim();
  const fromId = message?.from?.id ?? chatId;
  const firstName = message?.from?.first_name;

  try {
    // /yangiliklar — real manbalardan agro/chorvachilik yangiliklari.
    if (command === "/yangiliklar") {
      try {
        const items = await getNewsFeed(6);
        if (items.length === 0) {
          await sendMessage(
            chatId,
            "📰 Hozircha yangiliklar topilmadi. Birozdan so'ng qayta urinib ko'ring.",
            { keyboard: greetingKeyboard() },
          );
          return Response.json({ ok: true });
        }
        const lines = ["📰 <b>Agro va chorvachilik yangiliklari</b>", ""];
        items.forEach((n, i) => {
          const date = new Date(n.publishedAt);
          const dateStr = Number.isFinite(date.getTime())
            ? ` · ${date.getMonth() + 1}.${date.getDate()}`
            : "";
          lines.push(
            `${i + 1}. <b>${escapeHtml(n.title.slice(0, 140))}</b>`,
            `   ${escapeHtml(n.source)}${dateStr} · ${n.tag}`,
          );
          if (n.link) lines.push(`   ${n.link}`);
          lines.push("");
        });
        lines.push("🔄 Manbalar: AgroWorld, EastFruit, Kun.uz, Gazeta.uz");
        await sendMessage(chatId, lines.join("\n"), { keyboard: greetingKeyboard() });
      } catch (newsErr) {
        console.error("[bot] yangiliklar xatosi:", newsErr);
        await sendMessage(
          chatId,
          "⚠️ Yangiliklarni olishda xatolik. Birozdan so'ng /yangiliklar ni qayta yuboring.",
        );
      }
      return Response.json({ ok: true });
    }

    // /start <token> — sayt so'ragan kodni yuboramiz.
    if (isStart(command) && payload) {
      const state = await deliverCode(chatId, payload, fromId);
      if (state === "sent") return Response.json({ ok: true });

      const fallback =
        state === "already"
          ? alreadyVerifiedMessage()
          : state === "used"
            ? expiredLinkMessage()
            : expiredLinkMessage();
      await sendMessage(chatId, fallback, { keyboard: miniAppKeyboard() });
      return Response.json({ ok: true });
    }

    // Oddiy /start yoki boshqa matn — salomlashish va Mini App tugmasi.
    const greeting = greetingMessage(firstName).replace(
      "🔐 <b>Telefon raqamni tasdiqlash:</b>",
      "📰 <b>Yangiliklar:</b> /yangiliklar buyrug'i bilan agro va chorvachilik\nyangiliklarini real manbalardan o'qishingiz mumkin.\n\n🔐 <b>Telefon raqamni tasdiqlash:</b>",
    );
    await sendMessage(chatId, greeting, { keyboard: greetingKeyboard() });
    return Response.json({ ok: true });
  } catch (err) {
    // Bot hech qachon jim qolmasligi kerak — xato bo'lsa ham javob yuboramiz.
    console.error("[bot] webhook xatosi:", err);
    await sendMessage(chatId, errorMessage(), { keyboard: greetingKeyboard() });
    return Response.json({ ok: true });
  }
}

function isStart(command: string | undefined): boolean {
  if (!command) return false;
  // /start yoki /start@botusername
  return command === "/start" || command.startsWith("/start@");
}

type DeliveryState = "sent" | "already" | "used" | "invalid";

/** Bir martalik token bo'yicha kodni Telegram foydalanuvchisiga yuboradi. */
async function deliverCode(chatId: number, token: string, fromId: number): Promise<DeliveryState> {
  const rows = await db.select().from(otpCodes).where(eq(otpCodes.token, token)).limit(1);
  const row = rows[0];
  if (!row) return "invalid";
  if (row.used) return "already";
  if (row.expiresAt.getTime() < Date.now()) return "used";

  // Kim so'raganini yozib qo'yamiz: tasdiqlangandan keyin shu Telegram hisobini
  // foydalanuvchi profiliga ulaymiz va "tasdiqlandi" xabarini yuboramiz.
  await db
    .update(otpCodes)
    .set({ telegramId: fromId, deliveredAt: row.deliveredAt ?? new Date() })
    .where(eq(otpCodes.id, row.id));

  await sendMessage(chatId, codeMessage(row.code, row.phone, BOT_OTP_TTL_MINUTES), {
    keyboard: miniAppKeyboard(),
  });
  return "sent";
}
