import { Router } from "express";
import { handleFarmerUpdate, handlePartnerUpdate } from "./bot.js";
import { handleAuthBotUpdate, type AuthBotUpdate } from "../lib/auth-bot-flow.js";
import { isAuthBotConfigured } from "../lib/auth-bot.js";
import {
  agrozGoKeyboard,
  alreadyVerifiedMessage,
  answerCallbackQuery,
  codeMessage,
  editMessageReplyMarkup,
  errorMessage,
  deleteMessage,
  expiredLinkMessage,
  greetingKeyboard,
  greetingMessage,
  isBotConfigured,
  leaveChat,
  miniAppKeyboard,
  registeredUserMenuKeyboard,
  sendMessage,
  sendMessageWithId,
  setAgrozGoMenuButton,
  startLink,
} from "../lib/telegram-bot.js";
import { BOT_OTP_TTL_MINUTES } from "../lib/constants.js";
import { telegramAuthWebhookSecret, telegramWebhookSecret } from "../lib/settings.js";
import { getNewsFeed } from "../lib/news.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { reverseGeocodeDetails } from "../lib/geocode.js";
import { db } from "../db/index.js";
import { otpCodes, sessions, users, orders, specialistCalls, specialists } from "../db/schema.js";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { createBotSupportTicket } from "./support.js";

const router = Router();

type TelegramUpdate = {
  callback_query?: {
    id: string;
    data?: string;
    from?: { id?: number; first_name?: string };
    message?: { chat?: { id?: number; type?: string }; message_id?: number };
  };
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; first_name?: string; last_name?: string; username?: string };
    contact?: { phone_number?: string; first_name?: string; last_name?: string; user_id?: number };
    location?: { latitude: number; longitude: number };
  };
};

function isStart(command: string | undefined): boolean {
  if (!command) return false;
  return command === "/start" || command.startsWith("/start@");
}

type DeliveryState = "sent" | "already" | "used" | "invalid";

export const REGIONS_LIST = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Buxoro viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Qoraqalpog'iston",
];

export function regionsKeyboard() {
  const rows: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < REGIONS_LIST.length; i += 2) {
    const row = [{ text: REGIONS_LIST[i], callback_data: `reg:reg:${i}` }];
    if (REGIONS_LIST[i + 1]) {
      row.push({ text: REGIONS_LIST[i + 1], callback_data: `reg:reg:${i + 1}` });
    }
    rows.push(row);
  }
  return { inline_keyboard: rows };
}

export function locationRequestKeyboard() {
  return {
    keyboard: [
      [{ text: "📍 Joylashuvni yuborish (GPS)", request_location: true }],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

interface UserRegState {
  step: "ask_name" | "ask_phone" | "ask_location" | "ask_region" | "ask_second_phone";
  name?: string;
  phone?: string;
  region?: string;
  district?: string;
  secondPhone?: string;
  token?: string;
  promptMessageId?: number;
  updatedAt: number;
}

const regStates = new Map<number, UserRegState>();
const supportStates = new Map<number, number>();

// Har 30 daqiqada 2 soatdan oshgan nofaol xotirani tozalash
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of regStates.entries()) {
    if (now - state.updatedAt > 2 * 60 * 60 * 1000) {
      regStates.delete(key);
    }
  }
  for (const [key, ts] of supportStates.entries()) {
    if (now - ts > 2 * 60 * 60 * 1000) {
      supportStates.delete(key);
    }
  }
}, 30 * 60 * 1000);

/** Xavfsiz foydalanuvchi qidirish (agar bazada second_phone ustuni hali yo'q bo'lsa ham yiqilmaydi) */
async function findUserByTelegramId(fromId: number): Promise<typeof users.$inferSelect | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1);
    return rows[0] || null;
  } catch (err: any) {
    console.warn("[bot] findUserByTelegramId ogohlantirish, tiklash harakati:", err?.message || err);
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
      const rows = await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1);
      return rows[0] || null;
    } catch {
      try {
        const raw = await db.execute(
          sql`SELECT id, phone, name, region, district, created_at FROM users WHERE telegram_id = ${fromId} LIMIT 1`
        );
        if (raw.rows && raw.rows.length > 0) {
          return raw.rows[0] as typeof users.$inferSelect;
        }
      } catch {}
    }
    return null;
  }
}

/** Xavfsiz telefon orqali foydalanuvchi qidirish */
async function findUserByPhone(phone: string): Promise<typeof users.$inferSelect | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return rows[0] || null;
  } catch (err: any) {
    console.warn("[bot] findUserByPhone ogohlantirish:", err?.message || err);
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
      const rows = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
      return rows[0] || null;
    } catch {
      try {
        const raw = await db.execute(
          sql`SELECT id, phone, name, region, district, created_at FROM users WHERE phone = ${phone} LIMIT 1`
        );
        if (raw.rows && raw.rows.length > 0) {
          return raw.rows[0] as typeof users.$inferSelect;
        }
      } catch {}
    }
    return null;
  }
}

async function finalizeUserRegistration(
  telegramId: number,
  chatId: number,
  data: { name: string; phone: string; region?: string; district?: string; secondPhone?: string; token?: string }
): Promise<void> {
  let user: typeof users.$inferSelect | undefined;
  const trimmedSecond = data.secondPhone?.trim() || null;
  const region = data.region?.trim() || null;
  const district = data.district?.trim() || null;

  try {
    user = (await findUserByTelegramId(telegramId)) ?? undefined;

    if (user) {
      try {
        await db
          .update(users)
          .set({
            name: data.name || user.name,
            phone: data.phone,
            secondPhone: trimmedSecond || user.secondPhone || null,
            region: region || user.region || null,
            district: district || user.district || null,
          })
          .where(eq(users.id, user.id));
      } catch {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
        await db
          .update(users)
          .set({
            name: data.name || user.name,
            phone: data.phone,
            secondPhone: trimmedSecond || user.secondPhone || null,
            region: region || user.region || null,
            district: district || user.district || null,
          })
          .where(eq(users.id, user.id));
      }
      user.name = data.name || user.name;
      user.phone = data.phone;
      user.secondPhone = trimmedSecond || user.secondPhone || null;
      if (region) user.region = region;
      if (district) user.district = district;
    } else {
      const byPhone = (await findUserByPhone(data.phone)) ?? undefined;
      if (byPhone) {
        try {
          await db
            .update(users)
            .set({
              telegramId,
              name: data.name || byPhone.name,
              secondPhone: trimmedSecond || byPhone.secondPhone || null,
              region: region || byPhone.region || null,
              district: district || byPhone.district || null,
            })
            .where(eq(users.id, byPhone.id));
        } catch {
          await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
          await db
            .update(users)
            .set({
              telegramId,
              name: data.name || byPhone.name,
              secondPhone: trimmedSecond || byPhone.secondPhone || null,
              region: region || byPhone.region || null,
              district: district || byPhone.district || null,
            })
            .where(eq(users.id, byPhone.id));
        }
        user = byPhone;
      } else {
        try {
          const [created] = await db
            .insert(users)
            .values({
              telegramId,
              name: data.name,
              phone: data.phone,
              secondPhone: trimmedSecond,
              region,
              district,
            })
            .returning();
          user = created;
        } catch {
          await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
          const [created] = await db
            .insert(users)
            .values({
              telegramId,
              name: data.name,
              phone: data.phone,
              secondPhone: trimmedSecond,
              region,
              district,
            })
            .returning();
          user = created;
        }
      }
    }
  } catch (err: any) {
    console.error("[bot] finalizeUserRegistration DB xatosi:", err);
  }

  // Agar veb-brauzer orqali auth_ token kutilayotgan bo'lsa, sessiyani avtomatik ochamiz
  if (data.token && user?.id) {
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

  const welcomeName = escapeHtml(user?.name || data.name);
  const userRegion = user?.region || region;
  const userDistrict = user?.district || district;
  const locationLabel = [userRegion, userDistrict].filter(Boolean).join(", ");

  const successText = [
    `🎉 <b>Siz muvaffaqiyatli ro'yxatdan o'tdingiz!</b>`,
    "",
    `👤 <b>Ism-familiya:</b> ${welcomeName}`,
    `📞 <b>Telefon:</b> <code>${escapeHtml(user?.phone || data.phone)}</code>`,
    user?.secondPhone ? `📞 <b>Qo'shimcha raqam:</b> <code>${escapeHtml(user.secondPhone)}</code>` : "",
    locationLabel ? `📍 <b>Manzil:</b> ${escapeHtml(locationLabel)}` : "",
    "",
    `Ilovani ochish uchun pastki chap burchakdagi <b>«AgrozGO»</b> menyu tugmasini bosing 👇`,
  ]
    .filter(Boolean)
    .join("\n");

  await setAgrozGoMenuButton(chatId).catch(() => {});
  await setAgrozGoMenuButton().catch(() => {});
  await sendMessage(chatId, successText, { keyboard: agrozGoKeyboard() || registeredUserMenuKeyboard() });
}

async function handleMainBotCallback(query: NonNullable<TelegramUpdate["callback_query"]>): Promise<void> {
  const chatId = query.message?.chat?.id ?? query.from?.id;
  const fromId = query.from?.id;
  const messageId = query.message?.message_id;
  const data = query.data ?? "";

  try {
    if (data === "user:del_confirm") {
      await answerCallbackQuery(query.id, "Profilingiz o'chirildi");
      if (chatId && messageId) {
        await editMessageReplyMarkup(chatId, messageId).catch(() => {});
      }
      if (!fromId || !chatId) return;

      try {
        const u = await findUserByTelegramId(fromId);
        if (u) {
          await db.delete(sessions).where(eq(sessions.userId, u.id)).catch(() => {});
          await db.delete(users).where(eq(users.id, u.id)).catch(() => {});
        }
      } catch (e) {
        console.error("[bot] Profilni o'chirish xatosi:", e);
      }

      await sendMessage(
        chatId,
        `🗑 <b>Siz profilingizni o'chirdingiz.</b>\n\nPlatformadan qayta foydalanish uchun /start bosib ro'yxatdan o'ting.`,
        { keyboard: { remove_keyboard: true } }
      );
      return;
    }

    if (data === "user:del_cancel") {
      await answerCallbackQuery(query.id, "Bekor qilindi");
      if (chatId && messageId) {
        await editMessageReplyMarkup(chatId, messageId).catch(() => {});
      }
      if (chatId) {
        await sendMessage(chatId, `Profilni o'chirish bekor qilindi.`, {
          keyboard: registeredUserMenuKeyboard(),
        });
      }
      return;
    }
    if (data.startsWith("reg:reg:")) {
      await answerCallbackQuery(query.id);
      if (chatId && messageId) {
        await editMessageReplyMarkup(chatId, messageId).catch(() => {});
      }
      if (!fromId || !chatId) return;

      const idx = Number(data.split(":")[2]);
      const selectedRegion = REGIONS_LIST[idx] || "Toshkent shahri";

      const state = regStates.get(fromId) || { step: "ask_region", updatedAt: Date.now() };
      state.region = selectedRegion;

      await finalizeUserRegistration(fromId, chatId, {
        name: state.name || query.from?.first_name || "Foydalanuvchi",
        phone: state.phone || "+998900000000",
        region: selectedRegion,
        district: state.district,
        secondPhone: state.secondPhone,
        token: state.token,
      });
      regStates.delete(fromId);
      return;
    }

    if (data === "reg:confirm") {
      await answerCallbackQuery(query.id, "Tasdiqlandi!");
      // Amaliyot bajarilgach, ortiqcha qolib chalg'itmasligi uchun inline tugmani darhol olib tashlaymiz
      if (chatId && messageId) {
        await editMessageReplyMarkup(chatId, messageId).catch(() => {});
      }
      if (!fromId || !chatId) return;

      const state = regStates.get(fromId);
      if (state && state.phone) {
        await finalizeUserRegistration(fromId, chatId, {
          name: state.name || query.from?.first_name || "Foydalanuvchi",
          phone: state.phone,
          region: state.region,
          district: state.district,
          secondPhone: state.secondPhone,
          token: state.token,
        });
        regStates.delete(fromId);
      } else {
        const existing = await findUserByTelegramId(fromId);
        if (existing && existing.phone) {
          await sendMessage(
            chatId,
            `✅ <b>Siz ro'yxatdan o'tgansiz!</b>\n\nIlovani ochish uchun pastdagi tugmani bosing 👇`,
            { keyboard: greetingKeyboard() }
          );
        } else {
          regStates.set(fromId, { step: "ask_name", updatedAt: Date.now() });
          await sendMessage(
            chatId,
            `👋 Assalomu alaykum!\n\n1️⃣ <b>Ism va familiyangizni yozing:</b>`,
            { keyboard: { remove_keyboard: true } }
          );
        }
      }
      return;
    }

    if (data.startsWith("cr:rate:")) {
      await answerCallbackQuery(query.id);
      // Baholash tugmalarini olib tashlaymiz
      if (chatId && messageId) {
        await editMessageReplyMarkup(chatId, messageId).catch(() => {});
      }
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
          medReviewUrl ? "Dorilar bo'yicha fikrlarni ko'rish uchun pastdagi tugmadan foydalanishingiz mumkin." : "",
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

// POST /api/telegram va POST /api/telegram/webhook (Asosiy / Fermerlar boti)
router.post(["/", "/webhook"], async (req, res) => {
  const secret = await telegramWebhookSecret();
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    return res.status(401).send("unauthorized");
  }

  const update = req.body;
  if (update) {
    await handleFarmerUpdate(update).catch((err) => console.error("[farmer webhook error]:", err));
  }
  return res.json({ ok: true });
});

// POST /api/telegram/auth-webhook (@agroz_auth_bot / Hamkorlar boti)
router.post("/auth-webhook", async (req, res) => {
  const secret = (await telegramAuthWebhookSecret()) || (await telegramWebhookSecret());
  if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
    return res.status(401).send("unauthorized");
  }

  try {
    const update = req.body;
    if (update) await handleAuthBotUpdate(update);
  } catch (err) {
    console.error("[auth-bot webhook error]:", err);
  }

  res.json({ ok: true });
});

export default router;
