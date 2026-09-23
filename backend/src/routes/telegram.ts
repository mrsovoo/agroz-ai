import { Router } from "express";
import { handleAuthBotUpdate, type AuthBotUpdate } from "../lib/auth-bot-flow.js";
import { isAuthBotConfigured } from "../lib/auth-bot.js";
import {
  alreadyVerifiedMessage,
  answerCallbackQuery,
  codeMessage,
  contactRequestKeyboard,
  errorMessage,
  expiredLinkMessage,
  greetingKeyboard,
  greetingMessage,
  isBotConfigured,
  miniAppKeyboard,
  sendMessage,
  startLink,
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
  callback_query?: {
    id: string;
    data?: string;
    from?: { id?: number; first_name?: string };
    message?: { chat?: { id?: number } };
  };
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

interface UserRegState {
  step: "ask_name" | "ask_phone" | "ask_second_phone";
  name?: string;
  phone?: string;
  secondPhone?: string;
  token?: string;
  updatedAt: number;
}

const regStates = new Map<number, UserRegState>();

// Har 30 daqiqada 2 soatdan oshgan nofaol xotirani tozalash
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of regStates.entries()) {
    if (now - state.updatedAt > 2 * 60 * 60 * 1000) {
      regStates.delete(key);
    }
  }
}, 30 * 60 * 1000);

async function finalizeUserRegistration(
  telegramId: number,
  chatId: number,
  data: { name: string; phone: string; secondPhone?: string; token?: string }
): Promise<void> {
  let user = (
    await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1)
  )[0];

  const trimmedSecond = data.secondPhone?.trim() || null;

  if (user) {
    await db
      .update(users)
      .set({
        name: data.name || user.name,
        phone: data.phone,
        secondPhone: trimmedSecond || user.secondPhone || null,
      })
      .where(eq(users.id, user.id));
    user.name = data.name || user.name;
    user.phone = data.phone;
    user.secondPhone = trimmedSecond || user.secondPhone || null;
  } else {
    const byPhone = (
      await db.select().from(users).where(eq(users.phone, data.phone)).limit(1)
    )[0];
    if (byPhone) {
      await db
        .update(users)
        .set({
          telegramId,
          name: data.name || byPhone.name,
          secondPhone: trimmedSecond || byPhone.secondPhone || null,
        })
        .where(eq(users.id, byPhone.id));
      user = byPhone;
    } else {
      const [created] = await db
        .insert(users)
        .values({
          telegramId,
          name: data.name,
          phone: data.phone,
          secondPhone: trimmedSecond,
        })
        .returning();
      user = created;
    }
  }

  // Agar veb-brauzer orqali auth_ token kutilayotgan bo'lsa, sessiyani avtomatik ochamiz
  if (data.token) {
    const rows = await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.token, data.token))
      .limit(1);
    const row = rows[0];
    if (row && !row.used && row.expiresAt.getTime() > Date.now()) {
      const sessionId = randomBytes(32).toString("hex");
      await db.insert(sessions).values({ id: sessionId, userId: user.id });
      await db
        .update(otpCodes)
        .set({
          used: true,
          code: sessionId,
          telegramId,
          deliveredAt: new Date(),
        })
        .where(eq(otpCodes.id, row.id));
    }
  }

  const welcomeName = escapeHtml(user.name || data.name);
  const successText = [
    `🎉 <b>Tabriklaymiz, ${welcomeName}!</b>`,
    "",
    `✅ <b>Profilingiz muvaffaqiyatli faollashtirildi!</b>`,
    `👤 <b>Ism:</b> ${welcomeName}`,
    `📞 <b>Asosiy telefon:</b> <code>${escapeHtml(user.phone || data.phone)}</code>`,
    user.secondPhone ? `📞 <b>Qo'shimcha telefon:</b> <code>${escapeHtml(user.secondPhone)}</code>` : "",
    "",
    `Endi siz <b>Agroz AI</b> platformasining barcha imkoniyatlaridan to'liq foydalanishingiz mumkin:`,
    `• 🌾 Ekin va chorva kasalliklarini AI yordamida tashxis qilish`,
    `• 💊 Yaqin dorixonalardan dori vositalarini buyurtma qilish (5 km)`,
    `• 👨‍🌾 Malakali agronom va veterinar mutaxassislarni chaqirish`,
    "",
    data.token ? `<i>(Brauzerdagi sahifangizga ham avtomatik kirdingiz)</i>\n` : "",
    `Pastdagi <b>«🚀 Agroz AI»</b> tugmasi orqali ilovani oching 👇`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMessage(chatId, successText, { keyboard: greetingKeyboard() });
}

async function handleMainBotCallback(query: NonNullable<TelegramUpdate["callback_query"]>): Promise<void> {
  const chatId = query.message?.chat?.id ?? query.from?.id;
  const fromId = query.from?.id;
  const data = query.data ?? "";

  try {
    if (data === "reg:confirm") {
      await answerCallbackQuery(query.id, "Tasdiqlandi!");
      if (!fromId || !chatId) return;

      const state = regStates.get(fromId);
      if (state && state.phone) {
        await finalizeUserRegistration(fromId, chatId, {
          name: state.name || query.from?.first_name || "Foydalanuvchi",
          phone: state.phone,
          secondPhone: state.secondPhone,
          token: state.token,
        });
        regStates.delete(fromId);
      } else {
        const existing = (
          await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1)
        )[0];
        if (existing && existing.phone) {
          await sendMessage(
            chatId,
            `✅ <b>Siz allaqachon ro'yxatdan o'tgansiz!</b>\n\nIlovadan foydalanish uchun quyidagi tugmani bosing 👇`,
            { keyboard: greetingKeyboard() }
          );
        } else {
          regStates.set(fromId, { step: "ask_name", updatedAt: Date.now() });
          await sendMessage(
            chatId,
            `👋 Assalomu alaykum! Agroz AI platformasidan foydalanish uchun, iltimos, <b>Ism va familiyangizni</b> kiriting:`,
            { keyboard: { remove_keyboard: true } }
          );
        }
      }
      return;
    }

    if (data.startsWith("cr:rate:")) {
      await answerCallbackQuery(query.id);
      const [, , orderIdStr, starsStr] = data.split(":");
      const orderId = Number(orderIdStr);
      const stars = Number(starsStr);
      if (!chatId || !Number.isSafeInteger(orderId) || !Number.isSafeInteger(stars)) return;

      const { rateOrderDirectly, listOrders } = await import("../lib/orders.js");
      const result = await rateOrderDirectly(orderId, stars);
      if (!result.ok) {
        await sendMessage(
          chatId,
          `⚠️ ${escapeHtml(result.error || "Ushbu buyurtma allaqachon baholangan yoki mavjud emas.")}`,
          { keyboard: greetingKeyboard() },
        );
        return;
      }

      const orders = await listOrders({ orderId });
      const order = orders[0];
      const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
      const firstMed = order?.items?.[0];
      const medReviewUrl =
        firstMed && rawAppUrl
          ? `${rawAppUrl}/dori/${firstMed.medicineId ?? firstMed.id}`
          : rawAppUrl
            ? `${rawAppUrl}/dorilar`
            : "";

      await sendMessage(
        chatId,
        [
          "✅ <b>Rahmat! Bahoyingiz qabul qilindi.</b>",
          "",
          "Sizning fikringiz dorixona reytingini shakllantirishga yordam beradi.",
          medReviewUrl ? "Dorilar bo'yicha fikrlarni ko'rish yoki izoh qoldirish uchun pastdagi tugmadan foydalanishingiz mumkin." : "",
        ]
          .filter(Boolean)
          .join("\n"),
        medReviewUrl
          ? {
              keyboard: {
                inline_keyboard: [[{ text: "💬 Dorilar fikrlariga o'tish", url: medReviewUrl }]],
              },
            }
          : { keyboard: greetingKeyboard() },
      );
      return;
    }

    await answerCallbackQuery(query.id, "Bu tugma hozir asosiy botda ishlamaydi.");
  } catch (err) {
    console.error("[bot] callback xatosi:", err);
    await answerCallbackQuery(query.id, "Xatolik yuz berdi.");
    if (chatId) await sendMessage(chatId, errorMessage(), { keyboard: greetingKeyboard() });
  }
}

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
  if (update?.callback_query) {
    await handleMainBotCallback(update.callback_query);
    return res.json({ ok: true });
  }

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

      const existingUser = (
        await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1)
      )[0];

      // Agar allaqachon to'liq ro'yxatdan o'tgan bo'lsa
      if (existingUser && existingUser.phone) {
        await sendMessage(
          chatId,
          `👋 <b>Assalomu alaykum, ${escapeHtml(existingUser.name || contactName)}!</b>\n\nSiz allaqachon ro'yxatdan o'tgansiz. Ilovani ochish uchun pastdagi tugmani bosing 👇`,
          { keyboard: greetingKeyboard() }
        );
        return res.json({ ok: true });
      }

      // Ro'yxatdan o'tish jarayonida: asosiy raqam olindi, endi qo'shimcha raqam so'raymiz
      const regState = regStates.get(fromId);
      const chosenName = regState?.name || existingUser?.name || contactName;

      regStates.set(fromId, {
        ...regState,
        step: "ask_second_phone",
        name: chosenName,
        phone,
        updatedAt: Date.now(),
      });

      const askSecondPhoneText = [
        `📞 Asosiy telefon raqamingiz: <code>${escapeHtml(phone)}</code> qabul qilindi!`,
        "",
        `Sizda <b>qo'shimcha ikkinchi telefon raqamingiz</b> bormi?`,
        `Agar bo'lsa, ikkinchi raqamingizni yozib yuboring (masalan: <code>91 234 56 78</code>).`,
        `Agar bo'lmasa, quyidagi <b>«✅ Raqamni tasdiqlash»</b> tugmasini bosing 👇`,
      ].join("\n");

      await sendMessage(chatId, askSecondPhoneText, {
        keyboard: {
          inline_keyboard: [[{ text: "✅ Raqamni tasdiqlash", callback_data: "reg:confirm" }]],
        },
      });
      return res.json({ ok: true });
    }

    const text = message?.text?.trim() ?? "";
    const [command, ...rest] = text.split(/\s+/);
    const payload = rest.join(" ").trim();

    if (command === "/yangiliklar") {
      const existingUser = (
        await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1)
      )[0];

      if (!existingUser || !existingUser.phone) {
        regStates.set(fromId, { step: "ask_name", updatedAt: Date.now() });
        await sendMessage(
          chatId,
          `⚠️ Yangiliklar va platformadan foydalanish uchun avval ro'yxatdan o'ting.\n\n1️⃣ Iltimos, <b>Ism va familiyangizni</b> kiriting:`,
          { keyboard: { remove_keyboard: true } }
        );
        return res.json({ ok: true });
      }

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
      const existingUser = (
        await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1)
      )[0];

      if (payload && payload.startsWith("auth_")) {
        const rows = await db
          .select()
          .from(otpCodes)
          .where(eq(otpCodes.token, payload))
          .limit(1);

        const row = rows[0];
        if (row && !row.used && row.expiresAt.getTime() > Date.now()) {
          await db.update(otpCodes).set({ telegramId: fromId }).where(eq(otpCodes.id, row.id));

          let prefillName: string | null = null;
          let prefillSecondPhone: string | null = null;
          if (row.code) {
            if (row.code.startsWith("{")) {
              try {
                const parsed = JSON.parse(row.code);
                prefillName = parsed.name || null;
                prefillSecondPhone = parsed.secondPhone || null;
              } catch {}
            } else if (row.code.startsWith("name:")) {
              prefillName = row.code.slice(5);
            }
          }

          const prefillPhone = row.phone && row.phone !== "tg_auth" ? row.phone : null;
          const targetPhone = prefillPhone || (existingUser?.phone ? existingUser.phone : null);
          const chosenName = prefillName || existingUser?.name || firstName || "Foydalanuvchi";

          // Agar foydalanuvchi allaqachon to'liq ro'yxatdan o'tgan bo'lsa
          if (existingUser && existingUser.phone) {
            const sessionId = randomBytes(32).toString("hex");
            await db.insert(sessions).values({ id: sessionId, userId: existingUser.id });
            await db
              .update(otpCodes)
              .set({
                used: true,
                code: sessionId,
                telegramId: fromId,
                deliveredAt: new Date(),
              })
              .where(eq(otpCodes.id, row.id));

            const verifiedText = [
              `✅ <b>Salom, ${escapeHtml(existingUser.name || chosenName)}!</b>`,
              "",
              "🎉 <b>Profilingiz muvaffaqiyatli faollashtirildi!</b>",
              `📞 Tasdiqlangan telefoningiz: <code>${escapeHtml(existingUser.phone)}</code>`,
              "",
              "Siz brauzerdagi sahifada avtomatik ravishda profilingizga kirdingiz.",
              "Yoki quyidagi tugma orqali ilovani ochishingiz mumkin 👇",
            ].join("\n");

            await sendMessage(chatId, verifiedText, { keyboard: greetingKeyboard() });
            return res.json({ ok: true });
          }

          // Ro'yxatdan o'tmagan: agar veb orqali ism va telefon kiritilgan bo'lsa
          if (targetPhone) {
            regStates.set(fromId, {
              step: "ask_second_phone",
              name: chosenName,
              phone: targetPhone,
              secondPhone: prefillSecondPhone || undefined,
              token: payload,
              updatedAt: Date.now(),
            });

            const askSecondText = [
              `👋 <b>Assalomu alaykum, ${escapeHtml(chosenName)}!</b>`,
              "",
              `📞 Asosiy telefon raqamingiz: <code>${escapeHtml(targetPhone)}</code>`,
              "",
              `Sizda <b>qo'shimcha ikkinchi telefon raqamingiz</b> bormi?`,
              `Agar bo'lsa, ikkinchi raqamingizni yuboring (masalan: <code>91 234 56 78</code>).`,
              `Agar bo'lmasa, quyidagi <b>«✅ Raqamni tasdiqlash»</b> tugmasini bosing 👇`,
            ].join("\n");

            await sendMessage(chatId, askSecondText, {
              keyboard: {
                inline_keyboard: [[{ text: "✅ Raqamni tasdiqlash", callback_data: "reg:confirm" }]],
              },
            });
            return res.json({ ok: true });
          } else {
            // Telefon ham yo'q, ismdan boshlaymiz
            regStates.set(fromId, {
              step: "ask_name",
              token: payload,
              updatedAt: Date.now(),
            });

            const askNameText = [
              `👋 <b>Assalomu alaykum, ${escapeHtml(firstName || "Do'stim")}!</b>`,
              "",
              `🌱 <b>Agroz AI</b> platformasiga xush kelibsiz!`,
              `Platforma va Mini App imkoniyatlaridan to'liq foydalanish uchun ro'yxatdan o'tishingiz lozim.`,
              "",
              `1️⃣ Iltimos, <b>Ism va familiyangizni</b> kiriting:`,
              `<i>(Masalan: Rustam Olimov)</i>`,
            ].join("\n");

            await sendMessage(chatId, askNameText, { keyboard: { remove_keyboard: true } });
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
            : expiredLinkMessage();
        await sendMessage(chatId, fallback, { keyboard: miniAppKeyboard() });
        return res.json({ ok: true });
      }

      // Oddiy /start: Agar allaqachon to'liq ro'yxatdan o'tgan bo'lsa
      if (existingUser && existingUser.phone) {
        const welcomeText = [
          `👋 <b>Assalomu alaykum, ${escapeHtml(existingUser.name || firstName || "Do'stim")}!</b>`,
          "",
          `🌱 <b>Agroz AI</b> — dehqon va chorvadorlar uchun aqlli yordamchi platforma.`,
          `📞 Tasdiqlangan faol raqamingiz: <code>${escapeHtml(existingUser.phone)}</code>`,
          existingUser.secondPhone ? `📞 Qo'shimcha raqam: <code>${escapeHtml(existingUser.secondPhone)}</code>` : "",
          "",
          `Ilovadan foydalanish uchun quyidagi <b>«🚀 Agroz AI»</b> tugmasini bosing 👇`,
        ]
          .filter(Boolean)
          .join("\n");
        await sendMessage(chatId, welcomeText, { keyboard: greetingKeyboard() });
        return res.json({ ok: true });
      }

      // Agar hali telefon kiritilmagan bo'lsa, ro'yxatdan o'tkazishni boshlaymiz (MINI APP BERILMAYDI!)
      regStates.set(fromId, {
        step: "ask_name",
        updatedAt: Date.now(),
      });

      const promptText = [
        `👋 <b>Assalomu alaykum, ${escapeHtml(firstName || "Do'stim")}!</b>`,
        "",
        `🌱 <b>Agroz AI</b> platformasiga xush kelibsiz!`,
        `Platforma va Mini App imkoniyatlaridan to'liq foydalanish uchun, iltimos, ro'yxatdan o'ting.`,
        "",
        `1️⃣ Iltimos, <b>Ism va familiyangizni</b> kiriting:`,
        `<i>(Masalan: Dilshod Ergashev)</i>`,
      ].join("\n");

      await sendMessage(chatId, promptText, { keyboard: { remove_keyboard: true } });
      return res.json({ ok: true });
    }

    // Oddiy matn xabarlarini qayta ishlash
    const existingUser = (
      await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1)
    )[0];

    // Agar foydalanuvchi allaqachon ro'yxatdan o'tgan bo'lsa:
    if (existingUser && existingUser.phone) {
      const digits = text.replace(/\D/g, "");
      if (digits.length >= 9) {
        const newSecond = `+998${digits.slice(-9)}`;
        await db.update(users).set({ secondPhone: newSecond }).where(eq(users.id, existingUser.id));
        await sendMessage(
          chatId,
          `✅ Qo'shimcha telefon raqamingiz yangilandi: <code>${escapeHtml(newSecond)}</code>`,
          { keyboard: greetingKeyboard() }
        );
        return res.json({ ok: true });
      }

      const greeting = greetingMessage(existingUser.name || firstName);
      await sendMessage(chatId, greeting, { keyboard: greetingKeyboard() });
      return res.json({ ok: true });
    }

    // RO'YXATDAN O'TMAGAN FOYDALANUVCHI BOSQICHLARI:
    const regState = regStates.get(fromId) || { step: "ask_name", updatedAt: Date.now() };

    // A) Agar ikkinchi raqam kutilayotgan bo'lsa
    if (regState.step === "ask_second_phone") {
      const digits = text.replace(/\D/g, "");
      let secondPhone: string | undefined;
      if (digits.length >= 9) {
        secondPhone = `+998${digits.slice(-9)}`;
      } else if (/yo['`ʻ]?q|mavjud\s*emas|bitta|kerakmas|yoq/i.test(text)) {
        secondPhone = undefined;
      } else {
        await sendMessage(
          chatId,
          "📞 Agar qo'shimcha ikkinchi raqamingiz bo'lsa, 9 xonali raqam yuboring (masalan: <code>91 234 56 78</code>).\n\nAgar bo'lmasa, pastdagi <b>«✅ Raqamni tasdiqlash»</b> tugmasini bosing 👇",
          {
            keyboard: {
              inline_keyboard: [[{ text: "✅ Raqamni tasdiqlash", callback_data: "reg:confirm" }]],
            },
          }
        );
        return res.json({ ok: true });
      }

      await finalizeUserRegistration(fromId, chatId, {
        name: regState.name || firstName || "Foydalanuvchi",
        phone: regState.phone || "+998900000000",
        secondPhone,
        token: regState.token,
      });
      regStates.delete(fromId);
      return res.json({ ok: true });
    }

    // B) Agar asosiy telefon raqam kutilayotgan bo'lsa
    if (regState.step === "ask_phone") {
      const digits = text.replace(/\D/g, "");
      if (digits.length < 9) {
        await sendMessage(
          chatId,
          "⚠️ Telefon raqami noto'g'ri kiritildi.\n\nIltimos, 9 xonali faol telefon raqamingizni yozing (masalan: <code>90 123 45 67</code>) yoki pastdagi tugmani bosing 👇",
          { keyboard: contactRequestKeyboard() }
        );
        return res.json({ ok: true });
      }

      const primaryPhone = `+998${digits.slice(-9)}`;
      regStates.set(fromId, {
        ...regState,
        step: "ask_second_phone",
        phone: primaryPhone,
        updatedAt: Date.now(),
      });

      const askSecond = [
        `📞 Asosiy telefon: <code>${escapeHtml(primaryPhone)}</code> qabul qilindi!`,
        "",
        `Sizda <b>qo'shimcha ikkinchi telefon raqamingiz</b> bormi?`,
        `Agar bo'lsa, ikkinchi raqamingizni yuboring (masalan: <code>91 234 56 78</code>).`,
        `Agar bo'lmasa, quyidagi <b>«✅ Raqamni tasdiqlash»</b> tugmasini bosing 👇`,
      ].join("\n");

      await sendMessage(chatId, askSecond, {
        keyboard: {
          inline_keyboard: [[{ text: "✅ Raqamni tasdiqlash", callback_data: "reg:confirm" }]],
        },
      });
      return res.json({ ok: true });
    }

    // C) Agar ism kutilayotgan bo'lsa (yoki yangi kirgan bo'lsa)
    const digits = text.replace(/\D/g, "");
    const textWithoutDigits = text.replace(/[\d\+\s\-\(\)\/\:\,]/g, " ").trim();

    // Agar foydalanuvchi birato'la raqam yoki ism + raqam yuborgan bo'lsa
    if (digits.length >= 9) {
      const primaryPhone = `+998${digits.slice(-9)}`;
      const chosenName = textWithoutDigits.length >= 2 ? textWithoutDigits : (firstName || "Foydalanuvchi");

      regStates.set(fromId, {
        ...regState,
        step: "ask_second_phone",
        name: chosenName,
        phone: primaryPhone,
        updatedAt: Date.now(),
      });

      const askSecond = [
        `👤 Ism: <b>${escapeHtml(chosenName)}</b>`,
        `📞 Asosiy telefon: <code>${escapeHtml(primaryPhone)}</code>`,
        "",
        `Sizda <b>qo'shimcha ikkinchi telefon raqamingiz</b> bormi?`,
        `Agar bo'lsa, ikkinchi raqamingizni yuboring (masalan: <code>91 234 56 78</code>).`,
        `Agar bo'lmasa, quyidagi <b>«✅ Raqamni tasdiqlash»</b> tugmasini bosing 👇`,
      ].join("\n");

      await sendMessage(chatId, askSecond, {
        keyboard: {
          inline_keyboard: [[{ text: "✅ Raqamni tasdiqlash", callback_data: "reg:confirm" }]],
        },
      });
      return res.json({ ok: true });
    }

    const enteredName = text.trim();
    if (enteredName.length < 2) {
      await sendMessage(chatId, "⚠️ Iltimos, ism va familiyangizni to'liqroq kiriting (kamida 2 ta harf):");
      return res.json({ ok: true });
    }

    regStates.set(fromId, {
      ...regState,
      step: "ask_phone",
      name: enteredName,
      updatedAt: Date.now(),
    });

    const askPhoneText = [
      `Rahmat, <b>${escapeHtml(enteredName)}</b>!`,
      "",
      `2️⃣ Endi, iltimos, <b>ishlab turgan asosiy telefon raqamingizni</b> yozing:`,
      `⚠️ <i>Eslatma: Ko'p odamlarning Telegram raqami o'chgan yoki ishlamaydi. Mutaxassislar va dorixonalar siz bilan bog'lana olishi uchun faol ishlayotgan raqamingizni kiriting!</i>`,
      "",
      `✍️ Masalan: <code>90 123 45 67</code> yoki <code>+998901234567</code>`,
      `<i>(Yoki pastdagi «📱 Telefon raqamni yuborish» tugmasini bosing)</i> 👇`,
    ].join("\n");

    await sendMessage(chatId, askPhoneText, { keyboard: contactRequestKeyboard() });
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
