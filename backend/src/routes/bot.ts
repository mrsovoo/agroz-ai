import { Router } from "express";
import { handleAuthBotUpdate } from "../lib/auth-bot-flow.js";
import { recordDataConsent } from "../lib/consent.js";
import { db } from "../db/index.js";
import { users, specialists, orders, orderItems, specialistCalls, specialistMedicines, specialistRatings, otpCodes, sessions } from "../db/schema.js";
import { eq, and, desc, gt, isNotNull, or, ne, sql } from "drizzle-orm";
import {
  farmerBotToken,
  farmerBotUsername,
  farmerWebhookSecret,
  partnerBotToken,
  partnerBotUsername,
  partnerWebhookSecret,
  webAppUrl,
  partnerMiniappUrl,
  appStoreUrl,
  googlePlayUrl,
} from "../lib/settings.js";
import { sendToSpecialist, sendToUser } from "../lib/bot-sender.js";
import { addMedicine } from "../lib/specialists.js";
import { verifyInitData } from "../lib/tg-auth.js";
import { cleanText, normalizePhone } from "../lib/validate.js";
import { purgeUserAccount } from "../lib/user-auth.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { randomBytes } from "node:crypto";

const router = Router();
const API_BASE = "https://api.telegram.org";

async function callTelegram(token: string, method: string, payload: Record<string, unknown>): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json().catch(() => ({ ok: false }));
  } catch (err: any) {
    return { ok: false, description: err?.message };
  }
}

// ---------------------------------------------------------------------------
// 1. FERMERLAR BOTI (@agrozai_bot)
// ---------------------------------------------------------------------------

interface FarmerRegState {
  step: "name" | "phone" | "cross_otp";
  name?: string;
  pendingPhone?: string;
  attempts?: number;
  msgIds: number[];
  startedAt: number;
}

const farmerRegSessions = new Map<number, FarmerRegState>();

function cleanOldFarmerSessions() {
  const now = Date.now();
  for (const [id, s] of farmerRegSessions.entries()) {
    if (now - s.startedAt > 30 * 60 * 1000) {
      farmerRegSessions.delete(id);
    }
  }
}

export async function handleFarmerUpdate(update: any) {
  const token = await farmerBotToken();
  if (!token) return;

  const message = update?.message;
  const callbackQuery = update?.callback_query;

  // Callback query handling
  if (callbackQuery) {
    const fromId = callbackQuery.from?.id;
    const data = callbackQuery.data;
    const cqId = callbackQuery.id;

    if (cqId) {
      await callTelegram(token, "answerCallbackQuery", { callback_query_id: cqId });
    }

    if (data === "support:open") {
      await callTelegram(token, "sendMessage", {
        chat_id: fromId,
        text: `💬 <b>Qo'llab-quvvatlash xizmati</b>\n\nSavol yoki takliflaringiz bo'lsa, administrator bilan bog'laning:\n👉 @agroz_support`,
        parse_mode: "HTML",
      });
      return;
    }

    if (data === "farmer:orders") {
      await sendFarmerOrders(token, fromId, fromId);
      return;
    }

    if (data === "farmer:delete_account") {
      await callTelegram(token, "sendMessage", {
        chat_id: fromId,
        text: "⚠️ <b>Haqiqatan ham hisobingizni o'chirmoqchimisiz?</b>\n\nProfilingiz o'chirilsa, barcha shaxsiy ma'lumotlaringiz, buyurtmalaringiz va chaqiruvlaringiz to'liq o'chiriladi.",
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Ha, o'chirish", callback_data: "farmer:delete_account:confirm" },
              { text: "❌ Bekor qilish", callback_data: "farmer:delete_account:cancel" },
            ],
          ],
        },
      });
      return;
    }

    if (data === "farmer:delete_account:cancel") {
      if (callbackQuery.message?.message_id) {
        await callTelegram(token, "editMessageText", {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id,
          text: "Amal bekor qilindi. Profilingiz saqlanib qoldi.",
        });
      }
      return;
    }

    if (data === "farmer:delete_account:confirm") {
      const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
      if (user) {
        await purgeUserAccount(user.id);
      }
      if (callbackQuery.message?.message_id) {
        await callTelegram(token, "editMessageText", {
          chat_id: callbackQuery.message.chat.id,
          message_id: callbackQuery.message.message_id,
          text: "🗑 Profilingiz va barcha ma'lumotlaringiz muvaffaqiyatli o'chirildi.\n\nQayta foydalanish uchun /start bosing.",
        });
      }
      await callTelegram(token, "sendMessage", {
        chat_id: fromId,
        text: "Xizmatimizdan foydalanganingiz uchun rahmat!",
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return;
    }

    return;
  }

  if (!message || !message.chat) return;
  const chatId = message.chat.id;
  const fromId = message.from?.id ?? chatId;
  const firstName = message.from?.first_name || "Foydalanuvchi";

  // Faqat shaxsiy (private) chatlar
  if (message.chat.type !== "private") return;

  // Kontakt kelganda
  if (message.contact) {
    const regSession = farmerRegSessions.get(fromId);
    const contact = message.contact;
    if (contact.user_id && contact.user_id !== fromId) {
      const warnRes = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Iltimos, faqat o'zingizning telefon raqamingizni pastdagi tugma orqali yuboring.",
      });
      if (regSession) {
        regSession.msgIds.push(message.message_id);
        if (warnRes?.result?.message_id) regSession.msgIds.push(warnRes.result.message_id);
      }
      return;
    }

    const rawPhone = contact.phone_number || "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      const warnRes = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Telefon raqam formati noto'g'ri. Iltimos, qayta urinib ko'ring.",
      });
      if (regSession) {
        regSession.msgIds.push(message.message_id);
        if (warnRes?.result?.message_id) regSession.msgIds.push(warnRes.result.message_id);
      }
      return;
    }

    if (regSession) {
      regSession.msgIds.push(message.message_id);
    }

    const resolvedName =
      regSession?.name ||
      [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
      firstName ||
      "Foydalanuvchi";

    let user = (await db.select().from(users).where(or(eq(users.phone, phone), eq(users.telegramId, fromId))).limit(1))[0];
    if (user) {
      await db.update(users).set({
        telegramId: fromId,
        phone: user.phone || phone,
        name: regSession?.name || user.name || resolvedName,
        botStartedAt: new Date(),
        botBlocked: false,
      }).where(eq(users.id, user.id));
    } else {
      const [created] = await db.insert(users).values({
        phone,
        name: resolvedName,
        telegramId: fromId,
        botStartedAt: new Date(),
        botBlocked: false,
      }).returning();
      user = created;
    }

    // Ro'yxatdan o'tish jarayonidagi barcha oraliq xabarlarni o'chiramiz
    if (regSession && regSession.msgIds.length > 0) {
      for (const mid of regSession.msgIds) {
        await callTelegram(token, "deleteMessage", { chat_id: chatId, message_id: mid }).catch(() => {});
      }
      farmerRegSessions.delete(fromId);
    }

    if (user) {
      recordDataConsent({
        subjectType: "user",
        subjectId: user.id,
        telegramId: fromId,
        phone: user.phone || phone,
        fullName: user.name || resolvedName,
        consentChannel: "telegram_bot:@agrozai_bot",
      }).catch(() => {});
    }

    await sendFarmerGreeting(token, chatId, fromId, user.name || resolvedName, true);
    return;
  }

  const text = (message.text || "").trim();
  const [command, ...rest] = text.split(/\s+/);
  const payload = rest.join(" ").trim();

  // /start buyrug'i
  if (command === "/start" || command.startsWith("/start@")) {
    cleanOldFarmerSessions();

    // 1) Saytdan avtorizatsiya orqali kelgan bo'lsa (start auth_<token>)
    if (payload && payload.startsWith("auth_")) {
      const row = (await db.select().from(otpCodes).where(eq(otpCodes.token, payload)).limit(1))[0];
      if (row && !row.used && row.expiresAt.getTime() > Date.now()) {
        const cleanPhone = row.phone && row.phone !== "tg_auth" ? row.phone : null;
        let user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];

        if (!user && cleanPhone) {
          user = (await db.select().from(users).where(eq(users.phone, cleanPhone)).limit(1))[0];
        }

        if (!user && cleanPhone) {
          let prefillName: string | null = null;
          try {
            if (row.code && row.code.startsWith("{")) {
              prefillName = JSON.parse(row.code).name || null;
            }
          } catch {}
          const [created] = await db.insert(users).values({
            phone: cleanPhone,
            name: prefillName || firstName || "Foydalanuvchi",
            telegramId: fromId,
            botStartedAt: new Date(),
            botBlocked: false,
          }).returning();
          user = created;
        } else if (user) {
          await db.update(users).set({
            telegramId: fromId,
            botStartedAt: new Date(),
            botBlocked: false,
          }).where(eq(users.id, user.id));
        }

        const sessionId = randomBytes(32).toString("hex");
        if (user) {
          await db.insert(sessions).values({ id: sessionId, userId: user.id });
        }
        await db.update(otpCodes).set({
          used: true,
          code: sessionId,
          telegramId: fromId,
          deliveredAt: new Date(),
        }).where(eq(otpCodes.id, row.id));

        farmerRegSessions.delete(fromId);
        await sendFarmerGreeting(token, chatId, fromId, user?.name || firstName, false);
        return;
      }
    }

    // 2) fromId bo'yicha foydalanuvchi bazada bor-yo'qligini tekshiramiz
    const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
    if (user && user.phone) {
      await db.update(users).set({ botStartedAt: new Date(), botBlocked: false }).where(eq(users.id, user.id));
      farmerRegSessions.delete(fromId);
      await sendFarmerGreeting(token, chatId, fromId, user.name || firstName, false);
      return;
    }

    // 3) Yangi (ro'yxatdan o'tmagan) foydalanuvchi:
    // Eski chala sessiya bo'lsa xabarlarini tozalaymiz
    const oldSession = farmerRegSessions.get(fromId);
    if (oldSession) {
      for (const mid of oldSession.msgIds) {
        await callTelegram(token, "deleteMessage", { chat_id: chatId, message_id: mid }).catch(() => {});
      }
      farmerRegSessions.delete(fromId);
    }

    // AgrozGO launch menyu tugmasini sozlab qo'yamiz
    const url = webAppUrl();
    await callTelegram(token, "setChatMenuButton", {
      chat_id: chatId,
      menu_button: {
        type: "web_app",
        text: "AgrozGO",
        web_app: { url },
      },
    }).catch(() => {});

    // Sof salomlashuv va ism so'rash (tagida hech qanday kirish havolalari yo'q)
    const promptRes = await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Assalomu alaykum! AgrozGO ga xush kelibsiz 🌱\n\nRo'yxatdan o'tish uchun ism va familiyangizni kiriting:",
      reply_markup: {
        remove_keyboard: true,
      },
    });

    const msgIds: number[] = [message.message_id];
    if (promptRes?.result?.message_id) {
      msgIds.push(promptRes.result.message_id);
    }

    farmerRegSessions.set(fromId, {
      step: "name",
      msgIds,
      startedAt: Date.now(),
    });
    return;
  }

  // Ro'yxatdan o'tish jarayoni (ism kiritish bosqichi)
  const regSession = farmerRegSessions.get(fromId);
  if (regSession && regSession.step === "name") {
    const cleanName = cleanText(text, 100);
    if (!cleanName || cleanName.length < 2) {
      const errRes = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Iltimos, ism va familiyangizni to'liq kiriting:",
      });
      regSession.msgIds.push(message.message_id);
      if (errRes?.result?.message_id) regSession.msgIds.push(errRes.result.message_id);
      return;
    }

    regSession.name = cleanName;
    regSession.step = "phone";
    regSession.msgIds.push(message.message_id);

    const phonePrompt = await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: `Rahmat, <b>${escapeHtml(cleanName)}</b>! Endi pastdagi «📞 Raqamni yuborish» tugmasini bosing:`,
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    if (phonePrompt?.result?.message_id) {
      regSession.msgIds.push(phonePrompt.result.message_id);
    }
    return;
  }

  // Ro'yxatdan o'tish jarayoni (telefon raqamni matn ko'rinishida yozish bosqichi)
  if (regSession && regSession.step === "phone") {
    const phone = normalizePhone(text);
    if (!phone) {
      const invalidRes = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Iltimos, pastdagi «📞 Raqamni yuborish» tugmasini bosing yoki telefon raqamingizni to'liq formatda kiriting (masalan: +998901234567):",
        reply_markup: {
          keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
      regSession.msgIds.push(message.message_id);
      if (invalidRes?.result?.message_id) regSession.msgIds.push(invalidRes.result.message_id);
      return;
    }

    regSession.msgIds.push(message.message_id);

    // Xavfsizlik tekshiruvi: ushbu raqam @agroz_auth_bot da boshqa Telegram ID bilan ro'yxatdan o'tganmi?
    const spec = (await db.select().from(specialists).where(eq(specialists.phone, phone)).limit(1))[0];
    if (spec && spec.telegramId && Number(spec.telegramId) !== fromId) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await db.delete(otpCodes).where(and(eq(otpCodes.phone, phone), eq(otpCodes.used, false)));
      await db.insert(otpCodes).values({
        phone,
        code: otpCode,
        telegramId: fromId,
        token: `cross_auth_to_farmer_${fromId}`,
        used: false,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      const farmerBot = (await farmerBotUsername()) || "agrozai_bot";
      const partnerBot = (await partnerBotUsername()) || "agroz_auth_bot";
      await sendToSpecialist(
        { id: spec.id, telegramId: spec.telegramId },
        `⚠️ <b>Xavfsizlik ogohlantirishi!</b>\n\n` +
        `Sizning <b>${phone}</b> raqamingiz orqali <b>@${farmerBot}</b> botida yangi Telegram profilidan kirishga urinish bo'ldi.\n\n` +
        `🔑 Tasdiqlash kodi: <code>${otpCode}</code>\n\n` +
        `<i>Agar bu siz bo'lsangiz, ushbu kodni @${farmerBot} botiga kiriting.\nAgar siz bo'lmasangiz, kodni HECH KIMGA bermang! Hisobingiz xavfsiz.</i>`
      ).catch(() => {});

      regSession.step = "cross_otp";
      regSession.pendingPhone = phone;
      regSession.attempts = 0;

      const otpPrompt = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: `🔒 <b>Xavfsizlik tekshiruvi:</b>\n\nUshbu telefon raqam (<b>${phone}</b>) <b>AgrozGO | Biznes</b> (@${partnerBot}) tizimida ro'yxatdan o'tgan.\n\nRaqam haqiqatdan ham sizga tegishli ekanligini tasdiqlash uchun <b>@${partnerBot}</b> botingizga 6 xonali tasdiqlash kodi yuborildi.\n\nIltimos, o'sha kodni bu yerga kiriting:`,
        parse_mode: "HTML",
        reply_markup: {
          remove_keyboard: true,
        },
      });
      if (otpPrompt?.result?.message_id) {
        regSession.msgIds.push(otpPrompt.result.message_id);
      }
      return;
    }

    const resolvedName = regSession.name || firstName || "Foydalanuvchi";
    let user = (await db.select().from(users).where(or(eq(users.phone, phone), eq(users.telegramId, fromId))).limit(1))[0];
    if (user) {
      await db.update(users).set({
        telegramId: fromId,
        phone: user.phone || phone,
        name: regSession.name || user.name || resolvedName,
        botStartedAt: new Date(),
        botBlocked: false,
      }).where(eq(users.id, user.id));
    } else {
      const [created] = await db.insert(users).values({
        phone,
        name: resolvedName,
        telegramId: fromId,
        botStartedAt: new Date(),
        botBlocked: false,
      }).returning();
      user = created;
    }

    for (const mid of regSession.msgIds) {
      await callTelegram(token, "deleteMessage", { chat_id: chatId, message_id: mid }).catch(() => {});
    }
    farmerRegSessions.delete(fromId);

    if (user) {
      recordDataConsent({
        subjectType: "user",
        subjectId: user.id,
        telegramId: fromId,
        phone: user.phone || phone,
        fullName: user.name || resolvedName,
        consentChannel: "telegram_bot:@agrozai_bot",
      }).catch(() => {});
    }

    await sendFarmerGreeting(token, chatId, fromId, user.name || resolvedName, true);
    return;
  }

  // Ro'yxatdan o'tish jarayoni (Cross-bot OTP tasdiqlash bosqichi)
  if (regSession && regSession.step === "cross_otp") {
    regSession.msgIds.push(message.message_id);
    const cleanDigits = text.replace(/\D/g, "");

    if (command === "/bekor" || text === "Bekor qilish" || command === "/cancel") {
      farmerRegSessions.delete(fromId);
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "Bekor qilindi. Qaytadan boshlash uchun /start bosing.",
      });
      return;
    }

    const partnerBot = (await partnerBotUsername()) || "agroz_auth_bot";
    if (cleanDigits.length !== 6) {
      const errRes = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: `⚠️ Iltimos, @${partnerBot} botiga yuborilgan 6 xonali tasdiqlash kodini kiriting (masalan: 123456):`,
      });
      if (errRes?.result?.message_id) regSession.msgIds.push(errRes.result.message_id);
      return;
    }

    const pendingPhone = regSession.pendingPhone;
    if (!pendingPhone) {
      farmerRegSessions.delete(fromId);
      return;
    }

    const validOtp = (await db.select().from(otpCodes).where(
      and(
        eq(otpCodes.phone, pendingPhone),
        eq(otpCodes.code, cleanDigits),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, new Date())
      )
    ).limit(1))[0];

    if (!validOtp) {
      regSession.attempts = (regSession.attempts || 0) + 1;
      if (regSession.attempts >= 3) {
        farmerRegSessions.delete(fromId);
        await callTelegram(token, "sendMessage", {
          chat_id: chatId,
          text: "❌ Kod 3 marta noto'g'ri kiritildi. Xavfsizlik yuzasidan jarayon to'xtatildi. Qaytadan boshlash uchun /start bosing.",
        });
        return;
      }
      const remain = 3 - regSession.attempts;
      const warnRes = await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: `⚠️ Noto'g'ri kod. Iltimos, @${partnerBot} botiga borgan kodni to'g'ri kiriting (${remain} ta urinish qoldi):`,
      });
      if (warnRes?.result?.message_id) regSession.msgIds.push(warnRes.result.message_id);
      return;
    }

    // Kod to'g'ri! OTP ishlatildi
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, validOtp.id));

    const resolvedName = regSession.name || firstName || "Foydalanuvchi";
    let user = (await db.select().from(users).where(or(eq(users.phone, pendingPhone), eq(users.telegramId, fromId))).limit(1))[0];
    if (user) {
      await db.update(users).set({
        telegramId: fromId,
        phone: pendingPhone,
        name: regSession.name || user.name || resolvedName,
        botStartedAt: new Date(),
        botBlocked: false,
      }).where(eq(users.id, user.id));
    } else {
      const [created] = await db.insert(users).values({
        phone: pendingPhone,
        name: resolvedName,
        telegramId: fromId,
        botStartedAt: new Date(),
        botBlocked: false,
      }).returning();
      user = created;
    }

    // Biznes botdagi haqiqiy egasiga muvaffaqiyatli xabarnoma
    const spec = (await db.select().from(specialists).where(eq(specialists.phone, pendingPhone)).limit(1))[0];
    if (spec && spec.telegramId) {
      const farmerBot = (await farmerBotUsername()) || "agrozai_bot";
      await sendToSpecialist(
        { id: spec.id, telegramId: spec.telegramId },
        `✅ <b>Muvaffaqiyatli tasdiqlandi:</b>\n\nSizning <b>${pendingPhone}</b> raqamingiz @${farmerBot} botiga muvaffaqiyatli ulandi.`
      ).catch(() => {});
    }

    for (const mid of regSession.msgIds) {
      await callTelegram(token, "deleteMessage", { chat_id: chatId, message_id: mid }).catch(() => {});
    }
    farmerRegSessions.delete(fromId);

    if (user) {
      recordDataConsent({
        subjectType: "user",
        subjectId: user.id,
        telegramId: fromId,
        phone: pendingPhone,
        fullName: user.name || resolvedName,
        consentChannel: "telegram_bot:@agrozai_bot",
      }).catch(() => {});
    }

    await sendFarmerGreeting(token, chatId, fromId, user.name || resolvedName, true);
    return;
  }

  // /buyurtmalar buyrug'i
  if (command === "/buyurtmalar" || text === "📦 Buyurtmalar" || text === "📦 Mening buyurtmalarim" || text === "📦 Buyurtmalarim") {
    await sendFarmerOrders(token, chatId, fromId);
    return;
  }

  // /chaqiruvlar buyrug'i (Mutaxassis chaqiruvlari)
  if (command === "/chaqiruvlar" || text === "👨‍⚕️ Chaqiruvlar" || text === "Chaqiruvlar") {
    await sendFarmerCalls(token, chatId, fromId);
    return;
  }

  // /obhavo buyrug'i (Hududiy agro-ob-havo ma'lumotlari)
  if (command === "/obhavo" || text === "🌤 Ob-havo" || text === "Ob-havo" || text === "Ob havo") {
    await sendFarmerWeather(token, chatId, fromId);
    return;
  }

  // /malumotlarim buyrug'i (Profil ma'lumotlari)
  if (command === "/malumotlarim" || command === "/profil" || text === "👤 Ma'lumotlarim" || text === "Ma'lumotlarim") {
    await sendFarmerProfile(token, chatId, fromId);
    return;
  }

  // /yordam buyrug'i
  if (command === "/yordam" || text === "💬 Qo'llab-quvvatlash" || text === "Qo'llab-quvvatlash" || text === "Qo'llab quvvatlash" || text === "💬 Yordam" || text === "/help") {
    const url = webAppUrl();
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: `🌱 <b>AgrozGO — Fermer va dehqonlar uchun qulay raqamli platforma.</b>\n\n• Ilovani ochish uchun quyidagi tugmani yoki chat menyusidagi <b>«AgrozGO»</b> tugmasini bosing.\n• Dori va vositalarni buyurtma qilish, agronom va veterinar chaqirish uchun ilovadan foydalaning.\n• Savollaringiz yoki takliflaringiz bo'lsa: @agroz_support`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 AgrozGO ilovasini ochish", web_app: { url } }],
          [{ text: "💬 Qo'llab-quvvatlash", url: "https://t.me/agroz_support" }],
        ],
      },
    });
    return;
  }
}

async function sendFarmerCalls(token: string, chatId: number, fromId: number) {
  const url = webAppUrl();
  const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
  if (!user || !user.phone) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Chaqiruvlaringizni ko'rish uchun avval hisobingizni ulang yoki telefon raqamingizni yuboring:",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  const cleanDigits = user.phone.replace(/\D/g, "").slice(-9);
  const rawCalls = await db
    .select()
    .from(specialistCalls)
    .where(sql`RIGHT(REPLACE(${specialistCalls.customerPhone}, ' ', ''), 9) = ${cleanDigits}`)
    .orderBy(desc(specialistCalls.id))
    .limit(5);

  if (rawCalls.length === 0) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "📭 <b>Sizda hozircha mutaxassis chaqiruvlari mavjud emas.</b>\n\nAgrozGO ilovasi orqali tajribali agronom yoki veterinarlarni dalangizga yoki fermangizga chaqirishingiz mumkin 👇",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "👨‍⚕️ Mutaxassislarni ko'rish", web_app: { url } }],
        ],
      },
    });
    return;
  }

  const allSpecs = await db.select().from(specialists);
  const specMap = new Map<number, (typeof allSpecs)[0]>();
  for (const s of allSpecs) specMap.set(s.id, s);

  for (const call of rawCalls) {
    const spec = specMap.get(call.specialistId);
    const statusLabel =
      call.status === "yangi"
        ? "🟡 Yangi (mutaxassis ko'rib chiqmoqda)"
        : call.status === "qabul_qilindi"
        ? "🔵 Qabul qilingan (mutaxassis yo'lda yoki bog'lanadi)"
        : call.status === "bajarildi"
        ? "✅ Yakunlangan"
        : "❌ Rad etilgan";

    const text = [
      `👨‍⚕️ <b>Chaqiruv #${call.id}</b>`,
      `Mutaxassis: <b>${escapeHtml(spec?.name || "Mutaxassis")}</b> (${escapeHtml(spec?.specialty || "Agro mutaxassis")})`,
      spec?.phone ? `Telefon: <code>${escapeHtml(spec.phone)}</code>` : "",
      `Holati: <b>${statusLabel}</b>`,
      call.address ? `Manzil: ${escapeHtml(call.address)}` : "",
      `Muammo: ${escapeHtml(call.problem)}`,
    ].filter(Boolean).join("\n");

    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Ilovada ochish", web_app: { url } }],
        ],
      },
    });
  }
}

async function sendFarmerWeather(token: string, chatId: number, fromId: number) {
  const url = webAppUrl();
  const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
  const userRegion = user?.region || "Toshkent";

  const { findRegionCoords, getAgroWeatherSnapshot, formatDailyMorningWeatherTelegram } = await import("../lib/weather-alerts.js");
  const coords = findRegionCoords(userRegion);
  const snapshot = await getAgroWeatherSnapshot(coords.lat, coords.lng, coords.matchedRegion);
  const messageText = formatDailyMorningWeatherTelegram(snapshot, user?.name);

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: messageText,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌤 AgrozGO da to'liq ko'rish", web_app: { url } }],
      ],
    },
  });
}

async function sendFarmerOrders(token: string, chatId: number, fromId: number) {
  const url = webAppUrl();
  const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
  if (!user) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Buyurtmalaringizni ko'rish uchun avval hisobingizni ulang yoki telefon raqamingizni yuboring:",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.id))
    .limit(5);

  if (userOrders.length === 0) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "📭 <b>Sizda hozircha faol buyurtmalar mavjud emas.</b>\n\nAgrozGO ilovasi orqali yaqin agro-do'konlardan dori va vositalarni buyurtma qilishingiz mumkin 👇",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 AgrozGO ilovasiga o'tish", web_app: { url } }],
        ],
      },
    });
    return;
  }

  const items = await db.select().from(orderItems);
  const itemsMap = new Map<number, any[]>();
  for (const it of items) {
    const arr = itemsMap.get(it.orderId) || [];
    arr.push(it);
    itemsMap.set(it.orderId, arr);
  }

  for (const ord of userOrders) {
    const ordItems = itemsMap.get(ord.id) || [];
    const itemsText = ordItems.map((it) => `• <b>${escapeHtml(it.name)}</b> × ${it.qty} ta`).join("\n") || "Mahsulot ko'rsatilmagan";

    const statusLabel =
      ord.status === "yangi"
        ? "🟡 Yangi (ko'rib chiqilmoqda)"
        : ord.status === "tasdiqlandi"
        ? "🔵 Do'kon tomonidan tasdiqlandi"
        : ord.status === "tayyor"
        ? "📦 Do'konda tayyor, olib ketishingiz mumkin"
        : ord.status === "yetkazildi"
        ? "✅ Qabul qilindi"
        : "❌ Bekor qilingan";

    const text = [
      `📦 <b>Buyurtma #${ord.id}</b>`,
      `Holati: <b>${statusLabel}</b>`,
      `Summa: <b>${ord.totalSum ? ord.totalSum.toLocaleString("uz-UZ") + " so'm" : "kelishiladi"}</b>`,
      "",
      "<b>Mahsulotlar:</b>",
      itemsText,
    ].join("\n");

    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Ilovada ko'rish", web_app: { url } }],
        ],
      },
    });
  }
}

async function sendFarmerGreeting(
  token: string,
  chatId: number,
  fromId: number,
  name: string,
  isJustRegistered: boolean = false
) {
  const url = webAppUrl();

  // Telegram Menu tugmasini "AgrozGO" deb sozlaymiz (foydalanuvchi so'raganidek bitta toza launch menu)
  await callTelegram(token, "setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "AgrozGO",
      web_app: { url },
    },
  }).catch(() => {});

  const text = isJustRegistered
    ? `Muvaffaqiyatli ro'yxatdan o'tdingiz, <b>${escapeHtml(name)}</b>! 🌱\n\nIlovani ochish uchun quyidagi kirish tugmasini bosing:`
    : `Assalomu alaykum, <b>${escapeHtml(name)}</b>! AgrozGO ga xush kelibsiz 🌱\n\nIlovani ochish uchun quyidagi kirish tugmasini bosing:`;

  // Xabardagi tugma: sof ilovaga kirish tugmasi
  const inlineMarkup = {
    inline_keyboard: [
      [{ text: "🚀 Kirish (AgrozGO ilovasi)", web_app: { url } }],
    ],
  };

  // Reply keyboard: Buyurtmalar, Chaqiruvlar, Ob-havo, Ma'lumotlarim, Qo'llab-quvvatlash
  const replyKeyboard = {
    keyboard: [
      [{ text: "📦 Buyurtmalar" }, { text: "👨‍⚕️ Chaqiruvlar" }],
      [{ text: "🌤 Ob-havo" }, { text: "👤 Ma'lumotlarim" }],
      [{ text: "💬 Qo'llab-quvvatlash" }],
    ],
    resize_keyboard: true,
  };

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: inlineMarkup,
  });

  // Reply menyuni ham faollashtirib qo'yamiz
  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: "Kerakli bo'limni tanlang yoki pastki chap burchakdagi <b>AgrozGO</b> menyusidan ilovani oching 👇",
    parse_mode: "HTML",
    reply_markup: replyKeyboard,
  });
}

async function sendFarmerProfile(token: string, chatId: number, fromId: number) {
  const url = webAppUrl();
  const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
  if (!user) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Ma'lumotlaringizni ko'rish uchun avval ro'yxatdan o'ting. Buning uchun /start buyrug'ini bosing.",
    });
    return;
  }

  const regionDistrict = [user.region, user.district].filter(Boolean).join(", ") || "Kiritilmagan";
  const profileDetails = [
    `👤 <b>Sizning ma'lumotlaringiz:</b>`,
    ``,
    `📛 <b>Ism:</b> ${escapeHtml(user.name || "Kiritilmagan")}`,
    `📞 <b>Telefon:</b> <code>${escapeHtml(user.phone || "Kiritilmagan")}</code>`,
    user.secondPhone ? `📞 <b>Qo'shimcha tel:</b> <code>${escapeHtml(user.secondPhone)}</code>` : "",
    `📍 <b>Hudud:</b> ${escapeHtml(regionDistrict)}`,
  ].filter(Boolean).join("\n");

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: profileDetails,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "✏️ Tahrirlash", web_app: { url: `${url}/profil` } }],
        [{ text: "🗑 Profilni o'chirish", callback_data: "farmer:delete_account" }],
      ],
    },
  });
}

// ---------------------------------------------------------------------------
// 2. HAMKORLAR BOTI (@agroz_auth_bot)
// ---------------------------------------------------------------------------

export async function handlePartnerUpdate(update: any) {
  return handleAuthBotUpdate(update);
}

async function _legacyHandlePartnerUpdate(update: any) {
  const token = await partnerBotToken();
  if (!token) return;

  const message = update?.message;
  const callbackQuery = update?.callback_query;

  // Callback query handling (Bronlar va Chaqiruvlar harakatlari)
  if (callbackQuery) {
    const cqId = callbackQuery.id;
    const fromId = callbackQuery.from?.id;
    const data = String(callbackQuery.data || "");
    const msg = callbackQuery.message;

    if (cqId) {
      await callTelegram(token, "answerCallbackQuery", { callback_query_id: cqId });
    }

    // 0) Tezkor ko'rish callbacklari
    if (data === "o:view:recent") {
      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (spec && spec.role === "pharmacy") {
        const recentOrders = await db.select().from(orders).where(eq(orders.pharmacySpecialistId, spec.id)).orderBy(desc(orders.id)).limit(5);
        if (recentOrders.length === 0) {
          await callTelegram(token, "sendMessage", { chat_id: fromId, text: "📭 Hozircha do'koningizga yangi bronlar tushmagan." });
        } else {
          for (const ord of recentOrders) {
            await sendPartnerOrderCard(token, fromId, ord);
          }
        }
      }
      return;
    }

    if (data === "c:view:recent") {
      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (spec) {
        const recentCalls = await db.select().from(specialistCalls).where(eq(specialistCalls.specialistId, spec.id)).orderBy(desc(specialistCalls.id)).limit(5);
        if (recentCalls.length === 0) {
          await callTelegram(token, "sendMessage", { chat_id: fromId, text: "📭 Hozircha chaqiruvlar mavjud emas." });
        } else {
          for (const c of recentCalls) {
            await sendPartnerCallCard(token, fromId, c);
          }
        }
      }
      return;
    }

    // 1) Buyurtma / Bron amallari (o:confirm, o:cancel, o:ready, o:done)
    if (data.startsWith("o:")) {
      const parts = data.split(":");
      const action = parts[1]; // confirm | cancel | ready | done | view
      const orderId = Number(parts[2]);

      if (!orderId) return;

      const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
      if (!order) return;

      // XAVFSIZLIK: bosgan odam shu dorixona/buyurtma egasimi?
      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (!spec || spec.id !== order.pharmacySpecialistId) {
        if (cqId) {
          await callTelegram(token, "answerCallbackQuery", {
            callback_query_id: cqId,
            text: "⛔️ Siz faqat o'zingizning agro-do'koningiz bronlarini boshqara olasiz!",
            show_alert: true,
          });
        }
        return;
      }

      let newStatus: string | null = null;
      if (action === "confirm") {
        if (order.status === "yangi") newStatus = "tasdiqlandi";
      } else if (action === "cancel") {
        if (order.status === "yangi" || order.status === "tasdiqlandi") newStatus = "bekor";
      } else if (action === "ready") {
        if (order.status === "tasdiqlandi") newStatus = "tayyor";
      } else if (action === "done") {
        if (order.status === "tayyor" || order.status === "tasdiqlandi") newStatus = "yetkazildi"; // yoki olib ketildi
      }

      if (newStatus && newStatus !== order.status) {
        await db.update(orders).set({ status: newStatus }).where(eq(orders.id, orderId));

        // Mijozga xabar yuborish
        if (order.userId) {
          let notifyText = "";
          if (newStatus === "tasdiqlandi") {
            notifyText = `✅ Sizning #${order.id} raqamli broningiz agro-do'kon tomonidan tasdiqlandi!`;
          } else if (newStatus === "tayyor") {
            notifyText = `📦 Sizning #${order.id} raqamli buyurtmangiz do'konda tayyorlandi, olib ketishingiz mumkin!`;
          } else if (newStatus === "yetkazildi") {
            notifyText = `🏪 #${order.id} raqamli buyurtma muvaffaqiyatli topshirildi / olib ketildi!`;
          } else if (newStatus === "bekor") {
            notifyText = `❌ Kechirasiz, #${order.id} raqamli buyurtma agro-do'konda mahsulot yo'qligi sababli bekor qilindi.`;
          }
          if (notifyText) {
            await sendToUser(order.userId, notifyText);
          }
        }

        // Xabarni yangilab qo'yamiz
        if (msg && msg.message_id && msg.chat) {
          const updatedOrder = { ...order, status: newStatus };
          await sendPartnerOrderCard(token, msg.chat.id, updatedOrder, msg.message_id);
        }
      }
      return;
    }

    // 2) Chaqiruv amallari (c:accept, c:reject, c:done)
    if (data.startsWith("c:")) {
      const parts = data.split(":");
      const action = parts[1];
      const callId = Number(parts[2]);
      if (!callId) return;

      const call = (await db.select().from(specialistCalls).where(eq(specialistCalls.id, callId)).limit(1))[0];
      if (!call) return;

      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (!spec || spec.id !== call.specialistId) {
        if (cqId) {
          await callTelegram(token, "answerCallbackQuery", {
            callback_query_id: cqId,
            text: "⛔️ Siz faqat o'z chaqiruvlaringizni boshqara olasiz!",
            show_alert: true,
          });
        }
        return;
      }

      let newStatus: string | null = null;
      if (action === "accept" && call.status === "yangi") newStatus = "qabul_qilindi";
      if (action === "reject" && call.status === "yangi") newStatus = "bekor";
      if (action === "done" && call.status === "qabul_qilindi") newStatus = "bajarildi";

      if (newStatus && newStatus !== call.status) {
        await db.update(specialistCalls).set({ status: newStatus, updatedAt: new Date() }).where(eq(specialistCalls.id, callId));

        if (msg && msg.message_id && msg.chat) {
          const updatedCall = { ...call, status: newStatus };
          await sendPartnerCallCard(token, msg.chat.id, updatedCall, msg.message_id);
        }
      }
      return;
    }

    return;
  }

  if (!message || !message.chat) return;
  const chatId = message.chat.id;
  const fromId = message.from?.id ?? chatId;
  const firstName = message.from?.first_name || "Hamkor";

  if (message.chat.type !== "private") return;

  // Kontakt kelganda
  if (message.contact) {
    const contact = message.contact;
    if (contact.user_id && contact.user_id !== fromId) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Iltimos, faqat o'zingizning telefon raqamingizni pastdagi tugma orqali yuboring.",
      });
      return;
    }

    const rawPhone = contact.phone_number || "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Telefon raqam formati noto'g'ri.",
      });
      return;
    }

    // specialists jadvalidan qidiramiz
    const spec = (await db.select().from(specialists).where(eq(specialists.phone, phone)).limit(1))[0];
    if (spec) {
      if (!spec.isActive || !spec.isApproved) {
        await callTelegram(token, "sendMessage", {
          chat_id: chatId,
          text: "⏳ Sizning arizangiz ko'rib chiqilmoqda. Admin tasdiqlagach, botdan to'liq foydalanishingiz mumkin.",
        });
        return;
      }

      await db.update(specialists).set({
        telegramId: fromId,
        botStartedAt: new Date(),
        botBlocked: false,
      }).where(eq(specialists.id, spec.id));

      await sendPartnerGreeting(token, chatId, spec);
      return;
    }

    // Agar specialists'da yo'q, lekin users'da bo'lsa:
    const user = (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
    const farmerUser = await farmerBotUsername();

    if (user) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: `Bu bot agro-do'konlar va mutaxassislar uchun. Fermer sifatida @${farmerUser} dan foydalaning.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: `🌱 Fermerlar boti (@${farmerUser})`, url: `https://t.me/${farmerUser}` }],
          ],
        },
      });
      return;
    }

    // Hech qaysi jadvalda yo'q bo'lsa: hech narsa yaratilmaydi!
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Siz hali ro'yxatdan o'tmagansiz, qo'llab-quvvatlashga murojaat qiling.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "💬 Qo'llab-quvvatlash", url: "https://t.me/agroz_support" }],
        ],
      },
    });
    return;
  }

  const text = (message.text || "").trim();
  const [command] = text.split(/\s+/);

  // /start buyrug'i
  if (command === "/start" || command.startsWith("/start@")) {
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
    if (spec) {
      if (!spec.isActive || !spec.isApproved) {
        await callTelegram(token, "sendMessage", {
          chat_id: chatId,
          text: "⏳ Sizning arizangiz ko'rib chiqilmoqda. Admin tasdiqlagach, botdan to'liq foydalanishingiz mumkin.",
        });
        return;
      }

      await db.update(specialists).set({ botStartedAt: new Date(), botBlocked: false }).where(eq(specialists.id, spec.id));
      await sendPartnerGreeting(token, chatId, spec);
      return;
    }

    // Topilmasa: Raqam so'raymiz
    const askContactText = `Assalomu alaykum, <b>${escapeHtml(firstName)}</b>!\n\nUshbu bot agro-do'konlar va mutaxassislar (agronom, veterinar) uchun mo'ljallangan.\n\nProfilingizni aniqlash uchun telefon raqamingizni yuboring:`;
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: askContactText,
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // Hamkor komandalari (faqat ro'yxatdan o'tganlar uchun)
  const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
  if (!spec || !spec.isActive || !spec.isApproved) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "⚠️ Ushbu buyruqlardan foydalanish uchun avval telefon raqamingiz orqali tizimga ulaning.",
    });
    return;
  }

  // /bronlar (faqat agro-do'konlar uchun)
  if (command === "/bronlar" || text === "📦 Bronlar" || text === "/orders") {
    if (spec.role !== "pharmacy") {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "ℹ️ Bronlar boshqaruvi faqat agro-do'kon egalari uchun mo'ljallangan.",
      });
      return;
    }

    const recentOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.pharmacySpecialistId, spec.id))
      .orderBy(desc(orders.id))
      .limit(5);

    if (recentOrders.length === 0) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "📭 Hozircha do'koningizga yangi bronlar tushmagan.",
      });
      return;
    }

    for (const ord of recentOrders) {
      await sendPartnerOrderCard(token, chatId, ord);
    }
    return;
  }

  // /chaqiruvlar (mutaxassislar uchun)
  if (command === "/chaqiruvlar" || text === "👨‍⚕️ Chaqiruvlar" || text === "/calls") {
    const recentCalls = await db
      .select()
      .from(specialistCalls)
      .where(eq(specialistCalls.specialistId, spec.id))
      .orderBy(desc(specialistCalls.id))
      .limit(5);

    if (recentCalls.length === 0) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "📭 Hozircha chaqiruvlar mavjud emas.",
      });
      return;
    }

    for (const c of recentCalls) {
      await sendPartnerCallCard(token, chatId, c);
    }
    return;
  }

  // /band va /bosh
  if (command === "/band" || text === "🔴 Bandman") {
    await db.update(specialists).set({ isBusy: true }).where(eq(specialists.id, spec.id));
    const kabinetUrl = partnerMiniappUrl();
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "🔴 <b>Holatingiz: Band</b> deb belgilandi. Yangi chaqiruvlar qabul qilinmaydi.",
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          [{ text: "📋 Mutaxassis kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "👨‍⚕️ Chaqiruvlar" }, { text: "🟢 Bo'shman" }],
          [{ text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      },
    });
    return;
  }

  if (command === "/bosh" || text === "🟢 Bo'shman") {
    await db.update(specialists).set({ isBusy: false }).where(eq(specialists.id, spec.id));
    const kabinetUrl = partnerMiniappUrl();
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "🟢 <b>Holatingiz: Bo'sh</b> deb belgilandi. Yangi chaqiruvlarni qabul qilishingiz mumkin.",
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          [{ text: "📋 Mutaxassis kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "👨‍⚕️ Chaqiruvlar" }, { text: "🔴 Bandman" }],
          [{ text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      },
    });
    return;
  }

  // /yordam
  if (command === "/yordam" || text === "💬 Yordam") {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: `🤝 <b>AgrozGO Hamkorlar xizmati</b>\n\nSavollaringiz bo'lsa, administrator bilan bog'laning: @agroz_support\n\nBuyruqlar:\n/bronlar — bron qilingan mahsulotlar\n/chaqiruvlar — chaqiruvlar ro'yxati\n/band yoki /bosh — ish holatini o'zgartirish`,
      parse_mode: "HTML",
    });
    return;
  }
}

async function sendPartnerGreeting(token: string, chatId: number, spec: typeof specialists.$inferSelect) {
  let greeting = "";
  const name = spec.name;
  const org = spec.organization || "Agro-do'kon";
  const kabinetUrl = partnerMiniappUrl();

  const isPharmacy = spec.role === "pharmacy";

  if (isPharmacy) {
    greeting = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! Siz <b>${escapeHtml(org)}</b> agro-do'koni egasi sifatida ulandingiz ✅ Bronlarni shu yerda va kabinetda boshqarasiz.`;
  } else if (spec.specialty?.toLowerCase().includes("veterinar") || spec.role === "veterinarian") {
    greeting = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! Siz veterinar sifatida ulandingiz ✅ Chaqiruvlarni shu yerda va kabinetda qabul qilasiz.`;
  } else {
    greeting = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! Siz agronom sifatida ulandingiz ✅ Chaqiruvlarni shu yerda va kabinetda qabul qilasiz.`;
  }

  const inlineRows = [
    [{ text: isPharmacy ? "📋 Do'kon kabinetini ochish" : "📋 Mutaxassis kabinetini ochish", web_app: { url: kabinetUrl } }],
    [{ text: isPharmacy ? "📦 Yangi bronlar" : "👨‍⚕️ Chaqiruvlar", callback_data: isPharmacy ? "o:view:recent" : "c:view:recent" }],
  ];

  const replyMenu = isPharmacy
    ? {
        keyboard: [
          [{ text: "📋 Do'kon kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "📦 Bronlar" }, { text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      }
    : {
        keyboard: [
          [{ text: "📋 Mutaxassis kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "👨‍⚕️ Chaqiruvlar" }, { text: spec.isBusy ? "🟢 Bo'shman" : "🔴 Bandman" }],
          [{ text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      };

  await callTelegram(token, "setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "Kabinet",
      web_app: { url: kabinetUrl },
    },
  }).catch(() => {});

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: greeting,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: inlineRows,
    },
  });

  // Reply menyuni o'rnatamiz
  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: "Menyudan kerakli bo'limni tanlang 👇",
    reply_markup: replyMenu,
  });
}

async function sendPartnerOrderCard(token: string, chatId: number, order: typeof orders.$inferSelect, editMessageId?: number) {
  const isConfirmed = order.status !== "yangi";
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const itemsList = items.map((it) => `• <b>${escapeHtml(it.name)}</b> × ${it.qty} ta`).join("\n") || "Mahsulot ko'rsatilmagan";

  const phoneText = isConfirmed
    ? `<code>${escapeHtml(order.customerPhone)}</code>`
    : `<i>(Tasdiqlangandan so'ng ko'rinadi)</i>`;

  const statusLabel =
    order.status === "yangi"
      ? "🆕 Yangi bron"
      : order.status === "tasdiqlandi"
      ? "🔵 Tasdiqlangan"
      : order.status === "tayyor"
      ? "📦 Olib ketishga tayyor"
      : order.status === "yetkazildi"
      ? "✅ Olib ketildi"
      : "❌ Bekor qilingan";

  const text = [
    `🔔 <b>Bron #${order.id}</b> [${statusLabel}]`,
    `👤 <b>Mijoz:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Telefon:</b> ${phoneText}`,
    `💰 <b>Summa:</b> ${order.totalSum ? order.totalSum.toLocaleString("uz-UZ") + " so'm" : "kelishiladi"}`,
    "",
    "📦 <b>Mahsulotlar:</b>",
    itemsList,
  ].join("\n");

  const rows: any[] = [];
  if (order.status === "yangi") {
    rows.push([
      { text: "✅ Tasdiqlash", callback_data: `o:confirm:${order.id}` },
      { text: "❌ Mahsulot yo'q", callback_data: `o:cancel:${order.id}` },
    ]);
  } else if (order.status === "tasdiqlandi") {
    rows.push([
      { text: "📦 Tayyor", callback_data: `o:ready:${order.id}` },
      { text: "❌ Bekor qilish", callback_data: `o:cancel:${order.id}` },
    ]);
  } else if (order.status === "tayyor") {
    rows.push([
      { text: "🏪 Olib ketildi", callback_data: `o:done:${order.id}` },
    ]);
  }

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length > 0 ? { inline_keyboard: rows } : undefined,
  };

  if (editMessageId) {
    payload.message_id = editMessageId;
    await callTelegram(token, "editMessageText", payload);
  } else {
    await callTelegram(token, "sendMessage", payload);
  }
}

async function sendPartnerCallCard(token: string, chatId: number, call: typeof specialistCalls.$inferSelect, editMessageId?: number) {
  const isAccepted = call.status !== "yangi";
  const phoneText = isAccepted
    ? `<code>${escapeHtml(call.customerPhone)}</code>`
    : `<i>(Qabul qilingandan so'ng ko'rinadi)</i>`;

  const statusLabel =
    call.status === "yangi"
      ? "🆕 Yangi chaqiruv"
      : call.status === "qabul_qilindi"
      ? "🔵 Qabul qilingan"
      : call.status === "bajarildi"
      ? "✅ Yakunlangan"
      : "❌ Rad etilgan";

  const text = [
    `👨‍⚕️ <b>Chaqiruv #${call.id}</b> [${statusLabel}]`,
    `👤 <b>Mijoz:</b> ${escapeHtml(call.customerName)}`,
    `📞 <b>Telefon:</b> ${phoneText}`,
    call.address ? `📍 <b>Manzil:</b> ${escapeHtml(call.address)}` : "",
    `📝 <b>Muammo:</b> ${escapeHtml(call.problem)}`,
  ].filter(Boolean).join("\n");

  const rows: any[] = [];
  if (call.status === "yangi") {
    rows.push([
      { text: "✅ Qabul qilish", callback_data: `c:accept:${call.id}` },
      { text: "❌ Rad etish", callback_data: `c:reject:${call.id}` },
    ]);
  } else if (call.status === "qabul_qilindi") {
    rows.push([
      { text: "✅ Yakunlandi", callback_data: `c:done:${call.id}` },
    ]);
  }

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length > 0 ? { inline_keyboard: rows } : undefined,
  };

  if (editMessageId) {
    payload.message_id = editMessageId;
    await callTelegram(token, "editMessageText", payload);
  } else {
    await callTelegram(token, "sendMessage", payload);
  }
}

// ---------------------------------------------------------------------------
// 3. WEBHOOK ROUTELARI
// ---------------------------------------------------------------------------

// POST /api/bot/farmer (Fermerlar boti webhooki)
router.post("/farmer", async (req, res) => {
  const secret = await farmerWebhookSecret();
  if (secret) {
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const update = req.body;
  if (update) {
    await handleFarmerUpdate(update).catch((err) => console.error("[bot:farmer error]:", err));
  }
  res.json({ ok: true });
});

// POST /api/bot/partner (Hamkorlar boti webhooki)
router.post("/partner", async (req, res) => {
  const secret = await partnerWebhookSecret();
  if (secret) {
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const update = req.body;
  if (update) {
    await handlePartnerUpdate(update).catch((err) => console.error("[bot:partner error]:", err));
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// 4. MINI APP (HAMKOR KABINETI) BACKEND API
// ---------------------------------------------------------------------------

// POST /api/bot/partner/init
router.post("/partner/init", async (req, res) => {
  try {
    const { initData } = req.body || {};
    const token = await partnerBotToken();
    if (!token || !initData) {
      return res.status(401).json({ ok: false, error: "Token yoki initData mavjud emas" });
    }

    // HMAC verification (24 soatlik limit bilan)
    const valid = verifyInitData(initData, token, 24 * 60 * 60);
    if (!valid) {
      return res.status(401).json({ ok: false, error: "Telegram ma'lumotlari haqiqiy emas yoki muddati o'tgan" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const telegramId = Number(tgUser.id);
    if (!telegramId) {
      return res.status(401).json({ ok: false, error: "Telegram foydalanuvchi aniqlanmadi" });
    }

    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, telegramId)).limit(1))[0];
    if (!spec || !spec.isActive) {
      return res.status(404).json({ ok: false, error: "Hamkor profili topilmadi yoki faol emas" });
    }

    if (!spec.isApproved) {
      return res.json({
        ok: true,
        partner: {
          id: spec.id,
          name: spec.name,
          role: spec.role,
          organization: spec.organization,
          specialty: spec.specialty,
          phone: spec.phone,
          address: spec.address,
          workHours: spec.workHours,
          experienceYears: spec.experienceYears,
          bio: spec.bio,
          education: spec.education,
          helpsWith: spec.helpsWith,
          lat: spec.lat,
          lng: spec.lng,
          isBusy: spec.isBusy,
          isApproved: false,
          consentedAt: spec.consentedAt,
          consentVersion: spec.consentVersion,
          rating: { avg: null, count: 0 },
          stats: { totalOrders: 0, totalCalls: 0, pendingOrders: 0, pendingCalls: 0, activeCalls: 0, completedCalls: 0 },
        },
      });
    }

    // Rating
    const ratingRes = await db
      .select({
        avg: sql<number | null>`avg(${specialistRatings.stars})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(specialistRatings)
      .where(eq(specialistRatings.specialistId, spec.id));
    const ratingAvg = ratingRes[0]?.avg ? Number(ratingRes[0].avg) : null;
    const ratingCount = ratingRes[0]?.count ? Number(ratingRes[0].count) : 0;

    // Stats
    const totalOrdersRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.pharmacySpecialistId, spec.id));
    const pendingOrdersRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(and(eq(orders.pharmacySpecialistId, spec.id), eq(orders.status, "yangi")));

    const totalCallsRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(specialistCalls)
      .where(eq(specialistCalls.specialistId, spec.id));
    const pendingCallsRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(specialistCalls)
      .where(and(eq(specialistCalls.specialistId, spec.id), eq(specialistCalls.status, "yangi")));
    const activeCallsRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(specialistCalls)
      .where(and(eq(specialistCalls.specialistId, spec.id), eq(specialistCalls.status, "qabul_qilindi")));
    const completedCallsRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(specialistCalls)
      .where(and(eq(specialistCalls.specialistId, spec.id), eq(specialistCalls.status, "bajarildi")));

    return res.json({
      ok: true,
      partner: {
        id: spec.id,
        name: spec.name,
        role: spec.role,
        organization: spec.organization,
        specialty: spec.specialty,
        phone: spec.phone,
        address: spec.address,
        workHours: spec.workHours,
        experienceYears: spec.experienceYears,
        bio: spec.bio,
        education: spec.education,
        helpsWith: spec.helpsWith,
        lat: spec.lat,
        lng: spec.lng,
        isBusy: spec.isBusy,
        isApproved: true,
        consentedAt: spec.consentedAt,
        consentVersion: spec.consentVersion,
        rating: {
          avg: ratingAvg,
          count: ratingCount,
        },
        stats: {
          totalOrders: Number(totalOrdersRes[0]?.count || 0),
          pendingOrders: Number(pendingOrdersRes[0]?.count || 0),
          totalCalls: Number(totalCallsRes[0]?.count || 0),
          pendingCalls: Number(pendingCallsRes[0]?.count || 0),
          activeCalls: Number(activeCallsRes[0]?.count || 0),
          completedCalls: Number(completedCallsRes[0]?.count || 0),
        },
      },
    });
  } catch (err: any) {
    console.error("[partner:init error]:", err);
    res.status(500).json({ ok: false, error: "Server xatosi" });
  }
});

// GET /api/bot/partner/orders
router.get("/partner/orders", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.query.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec || spec.role !== "pharmacy") {
      return res.status(403).json({ ok: false, error: "Faqat agro-do'kon egalari uchun" });
    }

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.pharmacySpecialistId, spec.id))
      .orderBy(desc(orders.id))
      .limit(50);

    const items = await db.select().from(orderItems);
    const itemsMap = new Map<number, any[]>();
    for (const it of items) {
      const arr = itemsMap.get(it.orderId) || [];
      arr.push(it);
      itemsMap.set(it.orderId, arr);
    }

    const orderUserIds = Array.from(new Set(rows.map((r) => r.userId).filter(Boolean))) as number[];
    const orderUsersMap = new Map<number, string>();
    if (orderUserIds.length > 0) {
      const dbUsers = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(or(...orderUserIds.map((uid) => eq(users.id, uid))));
      for (const u of dbUsers) {
        if (u.name) orderUsersMap.set(u.id, u.name.trim());
      }
    }

    const enriched = rows.map((r) => {
      const registeredName = (r.userId && orderUsersMap.get(r.userId)) || r.customerName;
      return {
        ...r,
        customerName: registeredName,
        items: itemsMap.get(r.id) || [],
        customerPhone: r.customerPhone,
      };
    });

    res.json({ ok: true, orders: enriched });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/bot/partner/medicines (dorixona dorilari)
router.get("/partner/medicines", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.query.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec || spec.role !== "pharmacy") {
      return res.status(403).json({ ok: false, error: "Faqat agro-do'kon egalari uchun" });
    }

    const rows = await db
      .select()
      .from(specialistMedicines)
      .where(and(eq(specialistMedicines.specialistId, spec.id), ne(specialistMedicines.status, "yoq")))
      .orderBy(desc(specialistMedicines.id));

    res.json({ ok: true, medicines: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/medicines (yangi dori qo'shish)
router.post("/partner/medicines", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec || spec.role !== "pharmacy") {
      return res.status(403).json({ ok: false, error: "Faqat dorixona rahbarlari dori qo'sha oladi" });
    }

    const { name, type, usage, price, stock, stockUnit } = req.body || {};
    const cleanName = cleanText(name, 150);
    if (!cleanName) {
      return res.status(400).json({ ok: false, error: "Dori nomi kiritilishi shart" });
    }

    const medicine = await addMedicine({
      specialistId: spec.id,
      name: cleanName,
      photoFileId: null,
      type: type === "animal" || type === "crop" ? type : "general",
      usage: usage ? cleanText(usage, 300) : null,
      price: Number(price) > 0 ? Number(price) : null,
      stock: Number(stock) >= 0 ? Number(stock) : 10,
      stockUnit: cleanText(stockUnit, 20) || "dona",
    });

    res.json({ ok: true, medicine });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// PATCH /api/bot/partner/medicines/:id (tahrirlash yoki mavjudligini o'zgartirish)
router.patch("/partner/medicines/:id", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const medId = Number(req.params.id);
    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Hamkor topilmadi" });

    const med = (await db.select().from(specialistMedicines).where(eq(specialistMedicines.id, medId)).limit(1))[0];
    if (!med || med.specialistId !== spec.id) {
      return res.status(403).json({ ok: false, error: "Dori topilmadi yoki sizga tegishli emas" });
    }

    const { status, price, stock, usage } = req.body || {};
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (status === "bor" || status === "yoq") updates.status = status;
    if (price !== undefined) updates.price = Number(price) > 0 ? Number(price) : null;
    if (stock !== undefined) updates.stock = Number(stock) >= 0 ? Number(stock) : 0;
    if (usage !== undefined) updates.usage = usage ? cleanText(usage, 300) : null;

    await db.update(specialistMedicines).set(updates).where(eq(specialistMedicines.id, medId));
    res.json({ ok: true, medicine: { ...med, ...updates } });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE /api/bot/partner/medicines/:id (dorini o'chirish)
router.delete("/partner/medicines/:id", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.query.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const medId = Number(req.params.id);
    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Hamkor topilmadi" });

    await db.delete(specialistMedicines).where(and(eq(specialistMedicines.id, medId), eq(specialistMedicines.specialistId, spec.id)));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/orders/:id/action
router.post("/partner/orders/:id/action", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const orderId = Number(req.params.id);
    const { action } = req.body || {}; // confirm | cancel | ready | done

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Hamkor topilmadi" });

    const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
    if (!order || order.pharmacySpecialistId !== spec.id) {
      return res.status(403).json({ ok: false, error: "Ushbu bron sizning do'koningizga tegishli emas" });
    }

    let nextStatus: string | null = null;
    if (action === "confirm" && order.status === "yangi") nextStatus = "tasdiqlandi";
    if (action === "cancel" && (order.status === "yangi" || order.status === "tasdiqlandi")) nextStatus = "bekor";
    if (action === "ready" && order.status === "tasdiqlandi") nextStatus = "tayyor";
    if (action === "done" && (order.status === "tayyor" || order.status === "tasdiqlandi")) nextStatus = "yetkazildi";

    if (nextStatus) {
      await db.update(orders).set({ status: nextStatus }).where(eq(orders.id, orderId));

      if (order.userId) {
        let msg = "";
        if (nextStatus === "tasdiqlandi") msg = `✅ Sizning #${order.id} raqamli broningiz agro-do'kon tomonidan tasdiqlandi!`;
        if (nextStatus === "tayyor") msg = `📦 Sizning #${order.id} raqamli buyurtmangiz do'konda tayyorlandi, olib ketishingiz mumkin!`;
        if (nextStatus === "yetkazildi") msg = `🏪 #${order.id} raqamli buyurtma topshirildi!`;
        if (nextStatus === "bekor") msg = `❌ Kechirasiz, #${order.id} raqamli buyurtma agro-do'konda mahsulot yo'qligi sababli bekor qilindi.`;
        if (msg) await sendToUser(order.userId, msg);
      }
    }

    res.json({ ok: true, status: nextStatus || order.status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/bot/partner/calls
router.get("/partner/calls", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.query.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });

    const rows = await db
      .select()
      .from(specialistCalls)
      .where(eq(specialistCalls.specialistId, spec.id))
      .orderBy(desc(specialistCalls.id))
      .limit(50);

    const phoneSuffixes = Array.from(
      new Set(
        rows
          .map((r) => (r.customerPhone ? r.customerPhone.replace(/\D/g, "").slice(-9) : ""))
          .filter((s) => s.length === 9)
      )
    );

    const userMap = new Map<string, string>();
    if (phoneSuffixes.length > 0) {
      const orConditions = phoneSuffixes.map(
        (sfx) => sql`RIGHT(REGEXP_REPLACE(${users.phone}, '\\D', '', 'g'), 9) = ${sfx}`
      );
      const matchedUsers = await db
        .select({ phone: users.phone, name: users.name })
        .from(users)
        .where(or(...orConditions));

      for (const u of matchedUsers) {
        if (u.phone && u.name) {
          const sfx = u.phone.replace(/\D/g, "").slice(-9);
          userMap.set(sfx, u.name.trim());
        }
      }
    }

    const enriched = rows.map((c) => {
      const sfx = c.customerPhone ? c.customerPhone.replace(/\D/g, "").slice(-9) : "";
      const registeredName = sfx && userMap.get(sfx) ? userMap.get(sfx)! : c.customerName;
      return {
        ...c,
        customerName: registeredName,
        customerPhone: c.customerPhone,
      };
    });

    res.json({ ok: true, calls: enriched });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/calls/:id/action
router.post("/partner/calls/:id/action", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const callId = Number(req.params.id);
    const { action } = req.body || {}; // accept | reject | done

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });

    const call = (await db.select().from(specialistCalls).where(eq(specialistCalls.id, callId)).limit(1))[0];
    if (!call || call.specialistId !== spec.id) {
      return res.status(403).json({ ok: false, error: "Chaqiruv sizga tegishli emas" });
    }

    let nextStatus: string | null = null;
    if (action === "accept" && call.status === "yangi") nextStatus = "qabul_qilindi";
    if (action === "reject" && call.status === "yangi") nextStatus = "bekor";
    if (action === "done" && call.status === "qabul_qilindi") nextStatus = "bajarildi";

    if (nextStatus) {
      await db.update(specialistCalls).set({ status: nextStatus, updatedAt: new Date() }).where(eq(specialistCalls.id, callId));
    }

    res.json({ ok: true, status: nextStatus || call.status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/busy
router.post("/partner/busy", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const { isBusy } = req.body || {};
    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });

    await db.update(specialists).set({ isBusy: Boolean(isBusy) }).where(eq(specialists.id, spec.id));
    res.json({ ok: true, isBusy: Boolean(isBusy) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
