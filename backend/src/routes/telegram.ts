import { Router } from "express";
import { handleAuthBotUpdate, type AuthBotUpdate } from "../lib/auth-bot-flow.js";
import { isAuthBotConfigured } from "../lib/auth-bot.js";
import {
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
  sendMessage,
  sendMessageWithId,
  startLink,
} from "../lib/telegram-bot.js";
import { BOT_OTP_TTL_MINUTES } from "../lib/constants.js";
import { telegramAuthWebhookSecret, telegramWebhookSecret } from "../lib/settings.js";
import { getNewsFeed } from "../lib/news.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { reverseGeocodeDetails } from "../lib/geocode.js";
import { db } from "../db/index.js";
import { otpCodes, sessions, users } from "../db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";

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
  step: "ask_name" | "ask_phone" | "ask_region" | "ask_second_phone";
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

// Har 30 daqiqada 2 soatdan oshgan nofaol xotirani tozalash
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of regStates.entries()) {
    if (now - state.updatedAt > 2 * 60 * 60 * 1000) {
      regStates.delete(key);
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
    `🎉 <b>Tabriklaymiz, ${welcomeName}!</b>`,
    `Siz <b>Agroz AI</b> platformasidan muvaffaqiyatli ro'yxatdan o'tdingiz.`,
    "",
    `👤 <b>Ism:</b> ${welcomeName}`,
    `📞 <b>Telefon:</b> <code>${escapeHtml(user?.phone || data.phone)}</code>`,
    user?.secondPhone ? `📞 <b>Qo'shimcha:</b> <code>${escapeHtml(user.secondPhone)}</code>` : "",
    locationLabel ? `📍 <b>Hudud:</b> ${escapeHtml(locationLabel)}` : "",
    "",
    `📱 <b>Agroz AI ilovasini ochish:</b>`,
    `Ilovaga kirish uchun pastdagi <b>«🚀 Agroz AI ilovasini ochish»</b> tugmasini bosing 👇`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMessage(chatId, successText, { keyboard: greetingKeyboard() });
}

async function handleMainBotCallback(query: NonNullable<TelegramUpdate["callback_query"]>): Promise<void> {
  const chatId = query.message?.chat?.id ?? query.from?.id;
  const fromId = query.from?.id;
  const messageId = query.message?.message_id;
  const data = query.data ?? "";

  try {
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

  // 1. Agar bot guruh yoki kanalga qo'shilsa (my_chat_member)
  const myChatMember = (update as any)?.my_chat_member;
  if (myChatMember?.chat && (myChatMember.chat.type !== "private" || myChatMember.chat.id < 0)) {
    console.warn(`[bot] Bot guruhga qo'shildi (${myChatMember.chat.id}). Darhol chiqib ketilmoqda...`);
    await leaveChat(myChatMember.chat.id).catch(() => {});
    return res.json({ ok: true });
  }

  // 2. Agar callback_query guruhdan bo'lsa
  if (update?.callback_query) {
    const cbChat = update.callback_query.message?.chat;
    if (cbChat && (cbChat.type !== "private" || (cbChat.id ?? 0) < 0)) {
      console.warn(`[bot] Guruhdan callback keldi (${cbChat.id}). Chiqib ketilmoqda...`);
      if (cbChat.id) await leaveChat(cbChat.id).catch(() => {});
      return res.json({ ok: true });
    }
    await handleMainBotCallback(update.callback_query);
    return res.json({ ok: true });
  }

  const message = update?.message;
  const chatId = message?.chat?.id;
  if (!chatId) return res.json({ ok: true });

  // 3. Agar xabar guruh yoki kanaldan kelgan bo'lsa:
  // Xabarni o'chirish va bot darhol guruhdan chiqib ketishi kerak!
  if (message.chat?.type !== "private" || chatId < 0) {
    console.warn(`[bot] Guruhdan xabar keldi (${chatId}). Xabar o'chirilmoqda va bot guruhdan chiqmoqda...`);
    if (message.message_id) {
      await deleteMessage(chatId, message.message_id).catch(() => {});
    }
    await leaveChat(chatId).catch(() => {});
    return res.json({ ok: true });
  }

  const fromId = message?.from?.id ?? chatId;
  const firstName = message?.from?.first_name;

  try {
    // Agar joylashuv (location) yuborilgan bo'lsa
    if (message?.location) {
      const { latitude, longitude } = message.location;
      const { region, district } = await reverseGeocodeDetails(latitude, longitude);
      const chosenRegion = region || "Toshkent shahri";
      const chosenDistrict = district || null;

      const state = regStates.get(fromId);
      if (state && state.phone) {
        state.region = chosenRegion;
        state.district = chosenDistrict || undefined;
        await finalizeUserRegistration(fromId, chatId, {
          name: state.name || firstName || "Foydalanuvchi",
          phone: state.phone,
          region: chosenRegion,
          district: chosenDistrict || undefined,
          secondPhone: state.secondPhone,
          token: state.token,
        });
        regStates.delete(fromId);
      } else {
        const existing = await findUserByTelegramId(fromId);
        if (existing) {
          await db.update(users).set({
            region: chosenRegion,
            district: chosenDistrict,
          }).where(eq(users.id, existing.id));

          await sendMessage(
            chatId,
            `📍 Hududingiz saqlandi: <b>${escapeHtml([chosenRegion, chosenDistrict].filter(Boolean).join(", "))}</b>\n\nIlovani ochish uchun pastdagi tugmani bosing 👇`,
            { keyboard: greetingKeyboard() }
          );
        } else {
          regStates.set(fromId, {
            step: "ask_name",
            region: chosenRegion,
            district: chosenDistrict || undefined,
            updatedAt: Date.now(),
          });
          await sendMessage(
            chatId,
            `📍 Joylashuv qabul qilindi: <b>${escapeHtml([chosenRegion, chosenDistrict].filter(Boolean).join(", "))}</b>\n\n1️⃣ <b>Ism va familiyangizni yozing:</b>`,
            { keyboard: { remove_keyboard: true } }
          );
        }
      }
      return res.json({ ok: true });
    }

    // Agar foydalanuvchi kontakt ulashgan bo'lsa (ixtiyoriy)
    if (message?.contact && message.contact.phone_number) {
      const rawPhone = message.contact.phone_number.trim();
      const phone = "+" + rawPhone.replace(/\D/g, "");
      const contactName =
        [message.contact.first_name, message.contact.last_name].filter(Boolean).join(" ") ||
        firstName ||
        "Foydalanuvchi";

      const existingUser = await findUserByTelegramId(fromId);

      if (existingUser && existingUser.phone) {
        await sendMessage(
          chatId,
          `👋 <b>Assalomu alaykum, ${escapeHtml(existingUser.name || contactName)}!</b>\n\nSiz ro'yxatdan o'tgansiz. Ilovani ochish uchun pastdagi tugmani bosing 👇`,
          { keyboard: greetingKeyboard() }
        );
        return res.json({ ok: true });
      }

      const regState = regStates.get(fromId);
      const chosenName = regState?.name || existingUser?.name || contactName;

      const askRegionText = [
        `📞 Raqamingiz: <code>${escapeHtml(phone)}</code>`,
        "",
        `📍 <b>Qaysi viloyatdansiz?</b>`,
        `Pastdagi tugma orqali GPS joylashuvingizni yuboring yoki o'z viloyatingizni tanlang:`,
      ].join("\n");

      const sent = await sendMessageWithId(chatId, askRegionText, {
        keyboard: regionsKeyboard(),
      });
      await sendMessage(chatId, "Yoki pastdagi «📍 Joylashuvni yuborish (GPS)» tugmasini bosing 👇", {
        keyboard: locationRequestKeyboard(),
      });

      regStates.set(fromId, {
        ...regState,
        step: "ask_region",
        name: chosenName,
        phone,
        promptMessageId: sent.messageId,
        updatedAt: Date.now(),
      });
      return res.json({ ok: true });
    }

    const text = message?.text?.trim() ?? "";
    const [command, ...rest] = text.split(/\s+/);
    const payload = rest.join(" ").trim();

    if (command === "/yangiliklar") {
      const existingUser = await findUserByTelegramId(fromId);

      if (!existingUser || !existingUser.phone) {
        regStates.set(fromId, { step: "ask_name", updatedAt: Date.now() });
        await sendMessage(
          chatId,
          `⚠️ Foydalanish uchun avval ro'yxatdan o'ting.\n\n1️⃣ <b>Ism va familiyangizni yozing:</b>`,
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
      const existingUser = await findUserByTelegramId(fromId);

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

            await db.insert(sessions).values({
              id: sessionId,
              userId: existingUser.id,
            });
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
              `Profilingiz faollashtirildi.`,
              "",
              `Ilovani ochish uchun pastdagi tugmani bosing 👇`,
            ].join("\n");

            await sendMessage(chatId, verifiedText, { keyboard: greetingKeyboard() });
            return res.json({ ok: true });
          }

          // Ro'yxatdan o'tmagan: agar veb orqali ism va telefon kiritilgan bo'lsa
          if (targetPhone) {
            const askSecondText = [
              `👋 <b>Assalomu alaykum, ${escapeHtml(chosenName)}!</b>`,
              `📞 Raqamingiz: <code>${escapeHtml(targetPhone)}</code>`,
              "",
              `<b>Qo'shimcha ikkinchi telefon raqamingiz bormi?</b>`,
              `Bo'lsa yozing, bo'lmasa pastdagi tugmani bosing 👇`,
            ].join("\n");

            const sent = await sendMessageWithId(chatId, askSecondText, {
              keyboard: {
                inline_keyboard: [[{ text: "✅ Tasdiqlash", callback_data: "reg:confirm" }]],
              },
            });

            regStates.set(fromId, {
              step: "ask_second_phone",
              name: chosenName,
              phone: targetPhone,
              secondPhone: prefillSecondPhone || undefined,
              token: payload,
              promptMessageId: sent.messageId,
              updatedAt: Date.now(),
            });
            return res.json({ ok: true });
          } else {
            // Telefon yo'q, ismdan boshlaymiz
            regStates.set(fromId, {
              step: "ask_name",
              token: payload,
              updatedAt: Date.now(),
            });

            const askNameText = [
              `👋 <b>Assalomu alaykum!</b>`,
              `Platformadan foydalanish uchun ro'yxatdan o'ting.`,
              "",
              `1️⃣ <b>Ism va familiyangizni yozing:</b>`,
              `<i>(Masalan: Dilshod Ergashev)</i>`,
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
          `👋 <b>Assalomu alaykum, ${escapeHtml(existingUser.name || firstName || "Foydalanuvchi")}!</b>`,
          "",
          `🌱 <b>Agroz AI</b> platformasiga xush kelibsiz.`,
          `📞 Telefoningiz: <code>${escapeHtml(existingUser.phone)}</code>`,
          "",
          `Ilovani ochish uchun quyidagi <b>«🚀 Agroz AI»</b> tugmasini bosing 👇`,
        ].join("\n");
        await sendMessage(chatId, welcomeText, { keyboard: greetingKeyboard() });
        return res.json({ ok: true });
      }

      // Agar hali ro'yxatdan o'tmagan bo'lsa (MINI APP BERILMAYDI!)
      regStates.set(fromId, {
        step: "ask_name",
        updatedAt: Date.now(),
      });

      const promptText = [
        `👋 <b>Assalomu alaykum!</b>`,
        `Platformadan foydalanish uchun ro'yxatdan o'ting.`,
        "",
        `1️⃣ <b>Ism va familiyangizni yozing:</b>`,
        `<i>(Masalan: Dilshod Ergashev)</i>`,
      ].join("\n");

      await sendMessage(chatId, promptText, { keyboard: { remove_keyboard: true } });
      return res.json({ ok: true });
    }

    // Oddiy matn xabarlarini qayta ishlash
    const existingUser = await findUserByTelegramId(fromId);

    // Agar foydalanuvchi allaqachon ro'yxatdan o'tgan bo'lsa:
    if (existingUser && existingUser.phone) {
      const digits = text.replace(/\D/g, "");
      if (digits.length >= 9) {
        const newSecond = `+998${digits.slice(-9)}`;
        try {
          await db.update(users).set({ secondPhone: newSecond }).where(eq(users.id, existingUser.id));
        } catch {
          await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
          await db.update(users).set({ secondPhone: newSecond }).where(eq(users.id, existingUser.id));
        }
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

    // A) Agar viloyat kutilayotgan bo'lsa
    if (regState.step === "ask_region") {
      const clean = text.trim();
      const matched = REGIONS_LIST.find((r) => r.toLowerCase().includes(clean.toLowerCase())) || clean.slice(0, 100);

      await finalizeUserRegistration(fromId, chatId, {
        name: regState.name || firstName || "Foydalanuvchi",
        phone: regState.phone || "+998900000000",
        region: matched,
        district: regState.district,
        secondPhone: regState.secondPhone,
        token: regState.token,
      });
      regStates.delete(fromId);
      return res.json({ ok: true });
    }

    // B) Agar ikkinchi raqam kutilayotgan bo'lsa
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
          "📞 Qo'shimcha raqam bo'lsa yozing (masalan: <code>91 234 56 78</code>).\nBo'lmasa pastdagi tugmani bosing 👇",
          {
            keyboard: {
              inline_keyboard: [[{ text: "✅ Tasdiqlash", callback_data: "reg:confirm" }]],
            },
          }
        );
        return res.json({ ok: true });
      }

      // Foydalanuvchi ikkinchi raqamni yozdi, avvalgi tugmani olib tashlaymiz
      if (regState.promptMessageId && chatId) {
        await editMessageReplyMarkup(chatId, regState.promptMessageId).catch(() => {});
      }

      await finalizeUserRegistration(fromId, chatId, {
        name: regState.name || firstName || "Foydalanuvchi",
        phone: regState.phone || "+998900000000",
        region: regState.region,
        district: regState.district,
        secondPhone,
        token: regState.token,
      });
      regStates.delete(fromId);
      return res.json({ ok: true });
    }

    // C) Agar asosiy telefon raqam kutilayotgan bo'lsa
    if (regState.step === "ask_phone") {
      const digits = text.replace(/\D/g, "");
      if (digits.length < 9) {
        await sendMessage(
          chatId,
          "⚠️ Telefon raqami noto'g'ri kiritildi.\n\nIltimos, 9 xonali telefon raqamingizni yozing:\n<i>(Masalan: 90 123 45 67)</i>",
          { keyboard: { remove_keyboard: true } }
        );
        return res.json({ ok: true });
      }

      const primaryPhone = `+998${digits.slice(-9)}`;

      const askRegion = [
        `📞 Raqamingiz: <code>${escapeHtml(primaryPhone)}</code>`,
        "",
        `📍 <b>Qaysi viloyatdansiz?</b>`,
        `Pastdagi tugma orqali GPS joylashuvingizni yuboring yoki o'z viloyatingizni tanlang:`,
      ].join("\n");

      const sent = await sendMessageWithId(chatId, askRegion, {
        keyboard: regionsKeyboard(),
      });
      await sendMessage(chatId, "Yoki pastdagi «📍 Joylashuvni yuborish (GPS)» tugmasini bosing 👇", {
        keyboard: locationRequestKeyboard(),
      });

      regStates.set(fromId, {
        ...regState,
        step: "ask_region",
        phone: primaryPhone,
        promptMessageId: sent.messageId,
        updatedAt: Date.now(),
      });
      return res.json({ ok: true });
    }

    // D) Agar ism kutilayotgan bo'lsa (yoki yangi kirgan bo'lsa)
    const digits = text.replace(/\D/g, "");
    const textWithoutDigits = text.replace(/[\d\+\s\-\(\)\/\:\,]/g, " ").trim();

    // Agar foydalanuvchi birato'la raqam yoki ism + raqam yozgan bo'lsa
    if (digits.length >= 9) {
      const primaryPhone = `+998${digits.slice(-9)}`;
      const chosenName = textWithoutDigits.length >= 2 ? textWithoutDigits : (firstName || "Foydalanuvchi");

      const askRegion = [
        `👤 Ism: <b>${escapeHtml(chosenName)}</b>`,
        `📞 Telefon: <code>${escapeHtml(primaryPhone)}</code>`,
        "",
        `📍 <b>Qaysi viloyatdansiz?</b>`,
        `Pastdagi tugma orqali GPS joylashuvingizni yuboring yoki o'z viloyatingizni tanlang:`,
      ].join("\n");

      const sent = await sendMessageWithId(chatId, askRegion, {
        keyboard: regionsKeyboard(),
      });
      await sendMessage(chatId, "Yoki pastdagi «📍 Joylashuvni yuborish (GPS)» tugmasini bosing 👇", {
        keyboard: locationRequestKeyboard(),
      });

      regStates.set(fromId, {
        ...regState,
        step: "ask_region",
        name: chosenName,
        phone: primaryPhone,
        promptMessageId: sent.messageId,
        updatedAt: Date.now(),
      });
      return res.json({ ok: true });
    }

    const enteredName = text.trim();
    if (enteredName.length < 2) {
      await sendMessage(chatId, "⚠️ Iltimos, ism va familiyangizni yozing (kamida 2 ta harf):");
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
      `2️⃣ <b>Telefon raqamingizni yozing:</b>`,
      `<i>(Masalan: 90 123 45 67 yoki +998901234567)</i>`,
    ].join("\n");

    await sendMessage(chatId, askPhoneText, { keyboard: { remove_keyboard: true } });
    return res.json({ ok: true });
  } catch (err) {
    console.error("[bot] webhook xatosi:", err instanceof Error ? err.stack : err);
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
