import { Router } from "express";
import { handleAuthBotUpdate, type AuthBotUpdate } from "../lib/auth-bot-flow.js";
import { isAuthBotConfigured } from "../lib/auth-bot.js";
import {
  alreadyVerifiedMessage,
  codeMessage,
  contactRequestKeyboard,
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
import { otpCodes, sessions, users } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

const router = Router();

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; last_name?: string; username?: string };
    contact?: { phone_number?: string; first_name?: string; last_name?: string; user_id?: number };
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

  const fromId = message?.from?.id ?? chatId;
  const firstName = message?.from?.first_name;

  try {
    // 1. Foydalanuvchi "Telefon raqamni yuborish" tugmasini bosganda (contact)
    if (message?.contact && message.contact.phone_number) {
      const rawPhone = message.contact.phone_number.trim();
      const phone = "+" + rawPhone.replace(/\D/g, "");
      const contactName =
        [message.contact.first_name, message.contact.last_name].filter(Boolean).join(" ") ||
        firstName ||
        "Foydalanuvchi";

      let user = (
        await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1)
      )[0];

      if (user) {
        await db
          .update(users)
          .set({ phone, name: user.name || contactName })
          .where(eq(users.id, user.id));
        user.phone = phone;
      } else {
        const byPhone = (
          await db.select().from(users).where(eq(users.phone, phone)).limit(1)
        )[0];
        if (byPhone) {
          await db
            .update(users)
            .set({ telegramId: fromId, name: byPhone.name || contactName })
            .where(eq(users.id, byPhone.id));
          user = byPhone;
        } else {
          const created = await db
            .insert(users)
            .values({
              telegramId: fromId,
              phone,
              name: contactName,
            })
            .returning();
          user = created[0];
        }
      }

      // Agar veb-brauzer orqali auth_ token kutilayotgan bo'lsa, sessiya ochamiz
      const pendingCodes = await db
        .select()
        .from(otpCodes)
        .where(and(eq(otpCodes.telegramId, fromId), eq(otpCodes.used, false)))
        .limit(1);

      if (pendingCodes[0] && pendingCodes[0].expiresAt.getTime() > Date.now()) {
        const sessionId = randomBytes(32).toString("hex");
        await db.insert(sessions).values({ id: sessionId, userId: user.id });
        await db
          .update(otpCodes)
          .set({
            used: true,
            code: sessionId,
            deliveredAt: new Date(),
          })
          .where(eq(otpCodes.id, pendingCodes[0].id));
      }

      const successText = [
        `✅ <b>Telefon raqamingiz muvaffaqiyatli tasdiqlandi!</b>`,
        "",
        `👤 <b>Ism:</b> ${escapeHtml(user.name || contactName)}`,
        `📞 <b>Telefon:</b> <code>${escapeHtml(phone)}</code>`,
        "",
        `🎉 <b>Agroz AI</b> platformasiga xush kelibsiz!`,
        `Endi siz ekin va chorva kasalliklarini tashxis qilish, dorilarni 5 km atrofdagi dorixonalardan buyurtma berish va agronom mutaxassislar xizmatidan to'liq foydalanishingiz mumkin.`,
        "",
        `Pastdagi <b>«🚀 Agroz AI»</b> tugmasi orqali ilovani oching 👇`,
      ].join("\n");

      await sendMessage(chatId, successText, { keyboard: greetingKeyboard() });
      return res.json({ ok: true });
    }

    const text = message?.text?.trim() ?? "";
    const [command, ...rest] = text.split(/\s+/);
    const payload = rest.join(" ").trim();

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

    if (isStart(command)) {
      if (payload && payload.startsWith("auth_")) {
        const rows = await db
          .select()
          .from(otpCodes)
          .where(eq(otpCodes.token, payload))
          .limit(1);

        const row = rows[0];
        if (row && !row.used && row.expiresAt.getTime() > Date.now()) {
          // Tokenni ushbu telegramId ga bog'laymiz
          await db.update(otpCodes).set({ telegramId: fromId }).where(eq(otpCodes.id, row.id));

          let user = (
            await db
              .select()
              .from(users)
              .where(eq(users.telegramId, fromId))
              .limit(1)
          )[0];

          // Agar foydalanuvchida telefon raqami allaqachon bo'lsa - darhol login
          if (user && user.phone) {
            const sessionId = randomBytes(32).toString("hex");
            await db.insert(sessions).values({ id: sessionId, userId: user.id });

            await db
              .update(otpCodes)
              .set({
                used: true,
                code: sessionId,
                telegramId: fromId,
                deliveredAt: new Date(),
              })
              .where(eq(otpCodes.id, row.id));

            const welcomeName = escapeHtml(user.name || firstName || "Do'stim");
            const verifiedText = [
              `✅ <b>Salom, ${welcomeName}!</b>`,
              "",
              "🎉 <b>Profilingiz muvaffaqiyatli tasdiqlandi!</b>",
              `📞 Telefoningiz: <code>${escapeHtml(user.phone)}</code>`,
              "",
              "Siz brauzerdagi sahifada avtomatik ravishda profilingizga kirdingiz.",
              "Yoki quyidagi tugma orqali ilovani to'g'ridan-to'g'ri ochishingiz mumkin 👇",
            ].join("\n");

            await sendMessage(chatId, verifiedText, { keyboard: greetingKeyboard() });
            return res.json({ ok: true });
          } else {
            // Telefon raqami yo'q bo'lsa, kontaktni yuborishni so'raymiz
            const askContactText = [
              `👋 <b>Salom, ${escapeHtml(firstName || "Do'stim")}!</b>`,
              "",
              "Agroz AI tizimiga kirish va profilingizni faollashtirish uchun, iltimos, pastdagi tugma orqali <b>telefon raqamingizni yuboring</b> 👇",
            ].join("\n");

            await sendMessage(chatId, askContactText, {
              keyboard: contactRequestKeyboard(),
            });
            return res.json({ ok: true });
          }
        }
      }

      // Agar start tokeni OTP bo'lsa (veb sahifadan telefon orqali so'ralgan)
      if (payload && !payload.startsWith("auth_")) {
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

      // Oddiy /start: Agar foydalanuvchida telefon bo'lsa, xush kelibsiz xabari
      const existingUser = (
        await db
          .select()
          .from(users)
          .where(eq(users.telegramId, fromId))
          .limit(1)
      )[0];

      if (existingUser && existingUser.phone) {
        const welcomeText = [
          `👋 <b>Assalomu alaykum, ${escapeHtml(existingUser.name || firstName || "Do'stim")}!</b>`,
          "",
          `🌱 <b>Agroz AI</b> — dehqon va chorvadorlar uchun aqlli yordamchi platforma.`,
          `📞 Tasdiqlangan raqamingiz: <code>${escapeHtml(existingUser.phone)}</code>`,
          "",
          `Ilovadan foydalanish uchun quyidagi <b>«🚀 Agroz AI»</b> tugmasini bosing 👇`,
        ].join("\n");
        await sendMessage(chatId, welcomeText, { keyboard: greetingKeyboard() });
        return res.json({ ok: true });
      }

      // Agar hali telefon raqami kiritilmagan bo'lsa, kontakt so'raymiz!
      const promptText = [
        `👋 <b>Assalomu alaykum, ${escapeHtml(firstName || "Do'stim")}!</b>`,
        "",
        `🌱 <b>Agroz AI</b> platformasiga xush kelibsiz!`,
        "",
        `Dehqon va chorvadorlar uchun barcha xizmatlar, ekin tashxisi va dorixona buyurtmalaridan foydalanish uchun, iltimos, <b>telefon raqamingizni tasdiqlang</b>.`,
        "",
        `👇 Pastdagi <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing:`,
      ].join("\n");

      await sendMessage(chatId, promptText, { keyboard: contactRequestKeyboard() });
      return res.json({ ok: true });
    }

    const greeting = greetingMessage(firstName);
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

