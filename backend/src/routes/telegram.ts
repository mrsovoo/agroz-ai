import { Router } from "express";
import { handleAuthBotUpdate, type AuthBotUpdate } from "../lib/auth-bot-flow.js";
import { isAuthBotConfigured } from "../lib/auth-bot.js";
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
} from "../lib/telegram-bot.js";
import { BOT_OTP_TTL_MINUTES } from "../lib/constants.js";
import { telegramAuthWebhookSecret, telegramWebhookSecret } from "../lib/settings.js";
import { getNewsFeed } from "../lib/news.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { db } from "../db/index.js";
import { otpCodes } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; username?: string };
  };
};

function isStart(command: string | undefined): boolean {
  if (!command) return false;
  return command === "/start" || command.startsWith("/start@");
}

type DeliveryState = "sent" | "already" | "used" | "invalid";

async function deliverCode(chatId: number, token: string, fromId: number): Promise<DeliveryState> {
  const rows = await db.select().from(otpCodes).where(eq(otpCodes.token, token)).limit(1);
  const row = rows[0];
  if (!row) return "invalid";
  if (row.used) return "already";
  if (row.expiresAt.getTime() < Date.now()) return "used";

  await db
    .update(otpCodes)
    .set({ telegramId: fromId, deliveredAt: row.deliveredAt ?? new Date() })
    .where(eq(otpCodes.id, row.id));

  await sendMessage(chatId, codeMessage(row.code, row.phone, BOT_OTP_TTL_MINUTES), {
    keyboard: miniAppKeyboard(),
  });
  return "sent";
}

// POST /api/telegram/webhook (Asosiy bot)
router.post("/webhook", async (req, res) => {
  if (!(await isBotConfigured())) {
    return res.status(503).json({ ok: false, error: "bot sozlanmagan" });
  }

  const secret = await telegramWebhookSecret();
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    return res.status(401).send("unauthorized");
  }

  const update = (req.body ?? null) as TelegramUpdate | null;
  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!chatId) return res.json({ ok: true });

  const text = message?.text?.trim() ?? "";
  const [command, ...rest] = text.split(/\s+/);
  const payload = rest.join(" ").trim();
  const fromId = message?.from?.id ?? chatId;
  const firstName = message?.from?.first_name;

  try {
    if (command === "/yangiliklar") {
      try {
        const items = await getNewsFeed(6);
        if (items.length === 0) {
          await sendMessage(
            chatId,
            "📰 Hozircha yangiliklar topilmadi. Birozdan so'ng qayta urinib ko'ring.",
            { keyboard: greetingKeyboard() }
          );
          return res.json({ ok: true });
        }
        const lines = ["📰 <b>Agro va chorvachilik yangiliklari</b>", ""];
        items.forEach((n, i) => {
          const date = new Date(n.publishedAt);
          const dateStr = Number.isFinite(date.getTime())
            ? ` · ${date.getMonth() + 1}.${date.getDate()}`
            : "";
          lines.push(
            `${i + 1}. <b>${escapeHtml(n.title.slice(0, 140))}</b>`,
            `   ${escapeHtml(n.source)}${dateStr} · ${n.tag}`
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
          "⚠️ Yangiliklarni olishda xatolik. Birozdan so'ng /yangiliklar ni qayta yuboring."
        );
      }
      return res.json({ ok: true });
    }

    if (isStart(command) && payload) {
      const state = await deliverCode(chatId, payload, fromId);
      if (state === "sent") return res.json({ ok: true });

      const fallback =
        state === "already"
          ? alreadyVerifiedMessage()
          : state === "used"
          ? expiredLinkMessage()
          : expiredLinkMessage();
      await sendMessage(chatId, fallback, { keyboard: miniAppKeyboard() });
      return res.json({ ok: true });
    }

    const greeting = greetingMessage(firstName).replace(
      "🔐 <b>Telefon raqamni tasdiqlash:</b>",
      "📰 <b>Yangiliklar:</b> /yangiliklar buyrug'i bilan agro va chorvachilik\nyangiliklarini real manbalardan o'qishingiz mumkin.\n\n🔐 <b>Telefon raqamni tasdiqlash:</b>"
    );
    await sendMessage(chatId, greeting, { keyboard: greetingKeyboard() });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[bot] webhook xatosi:", err);
    await sendMessage(chatId, errorMessage(), { keyboard: greetingKeyboard() });
    return res.json({ ok: true });
  }
});

// POST /api/telegram/auth-webhook (@agroz_auth_bot)
router.post("/auth-webhook", async (req, res) => {
  if (!(await isAuthBotConfigured())) {
    return res.status(503).json({ ok: false, error: "auth bot sozlanmagan" });
  }

  const secret = (await telegramAuthWebhookSecret()) || (await telegramWebhookSecret());
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    return res.status(401).send("unauthorized");
  }

  try {
    const update = req.body as AuthBotUpdate | null;
    if (update) await handleAuthBotUpdate(update);
  } catch (err) {
    console.error("[auth-bot webhook error]:", err);
  }

  res.json({ ok: true });
});

export default router;
