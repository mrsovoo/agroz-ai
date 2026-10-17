import { db } from "../db/index.js";
import { biznesgoMerchants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { findOrSyncMerchantByTelegramId, getBiznesGoBotToken } from "./biznesgo-auth.js";
import { biznesGoMiniAppUrl, setBiznesGoMenuButton } from "./telegram-bot.js";
import { escapeHtml } from "./tg-escape.js";

const API_BASE = "https://api.telegram.org";

export const BIZNESGO_MERCHANT_TYPE_LABELS: Record<string, string> = {
  agro_shop: "Agro-do'kon",
  veterinary_pharmacy: "Veterinar dorixona",
  feed_store: "Yem-ozuqa do'koni",
  warehouse: "Ulgurji ombor",
  seed_seedling_store: "Urug' va ko'chatlar",
  equipment_store: "Qishloq xo'jaligi uskunalari",
};

/**
 * Telegram Mini App tugmasini yasash.
 * Telegram Bot API faqat HTTPS URL'larni `web_app` sifatida qabul qiladi.
 * Agar lokal testda HTTPS bo'lmasa, Telegram 400 Bad Request bermasligi uchun standart havola tugmasi qilinadi.
 */
export function buildMiniAppButton(text: string, rawUrl: string): {
  text: string;
  web_app?: { url: string };
  url?: string;
} {
  const url = (rawUrl || "").trim();
  if (url.startsWith("https://")) {
    return { text, web_app: { url } };
  }
  return { text: `🌐 ${text}`, url: url.startsWith("http") ? url : `http://${url}` };
}

export async function callBiznesGoBot<T = any>(
  method: string,
  payload?: Record<string, unknown>
): Promise<T | null> {
  const token = getBiznesGoBotToken();
  if (!token) {
    console.warn(`[biznesgo_bot] Token mavjud emas, ${method} chaqirilmadi`);
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    const json = (await res.json()) as { ok?: boolean; result?: T; description?: string };
    if (!json.ok) {
      console.error(`[biznesgo_bot] ${method} xatosi:`, json.description || res.status);
      return null;
    }
    return json.result ?? null;
  } catch (err) {
    console.error(`[biznesgo_bot] ${method} so'rovi bajarilmadi:`, err);
    return null;
  }
}

export async function sendBiznesGoMessage(
  chatId: number,
  text: string,
  options?: {
    inlineKeyboard?: Array<Array<{ text: string; url?: string; web_app?: { url: string }; callback_data?: string }>>;
    removeKeyboard?: boolean;
  }
): Promise<boolean> {
  const payload: Record<string, any> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (options?.inlineKeyboard) {
    payload.reply_markup = { inline_keyboard: options.inlineKeyboard };
  } else if (options?.removeKeyboard) {
    payload.reply_markup = { remove_keyboard: true };
  }
  const res = await callBiznesGoBot("sendMessage", payload);
  return res !== null;
}

export async function handleBiznesGoBotUpdate(update: any): Promise<void> {
  if (!update) return;

  const miniAppUrl = biznesGoMiniAppUrl();

  // 1. Callback query
  if (update.callback_query) {
    const cq = update.callback_query;
    const fromId = cq.from?.id;
    const chatId = cq.message?.chat?.id || fromId;
    const data = String(cq.data || "");

    if (cq.id) {
      await callBiznesGoBot("answerCallbackQuery", { callback_query_id: cq.id }).catch(() => {});
    }

    if (data === "biznesgo:info") {
      await sendBiznesGoMessage(
        chatId,
        [
          "🏢 <b>BiznesGO — Agro-biznesni avtomatlashtirish platformasi</b>",
          "",
          "BiznesGO quyidagi qulayliklarni taqdim etadi:",
          "📦 <b>Mahsulotlar katalogi:</b> Tovar narxi, qoldig'i, o'lchov birligi va rasmlari.",
          "⚡️ <b>Tezkor kassa (POS):</b> Naqd, karta yoki nasiyaga soniyalar ichida savdo qilish.",
          "📒 <b>Qarz daftari:</b> Mijozlar qarzi, to'lovlar tarixi va eslatmalar.",
          "🛒 <b>AgrozGO integratsiyasi:</b> AgrozGO ilovasidagi minglab fermer va xaridorlardan buyurtmalar qabul qilish.",
          "📊 <b>Hisobotlar:</b> Kunlik va oylik tushum hamda sof foyda ko'rsatkichlari.",
          "",
          "Ilovani ishga tushirish uchun pastdagi tugmani bosing 👇",
        ].join("\n"),
        {
          inlineKeyboard: [
            [buildMiniAppButton("🏪 BiznesGO’ni ochish", miniAppUrl)],
            [{ text: "💬 Aloqa / Administrator", url: "https://t.me/agroz_support" }],
          ],
        }
      );
      return;
    }

    return;
  }

  // 2. Oddiy xabarlar (Message)
  const message = update.message;
  if (!message || !message.chat?.id) return;

  const chatId = message.chat.id;
  const fromId = message.from?.id;
  const firstName = message.from?.first_name || "Foydalanuvchi";
  const text = (message.text || "").trim();

  // Chat ochilganda avtomatik doimiy pastki burchakdagi Menyu tugmasini BiznesGO ga moslaymiz
  setBiznesGoMenuButton(chatId).catch(() => {});

  if (text.startsWith("/start")) {
    let merchant: any = null;
    if (fromId) {
      merchant = await findOrSyncMerchantByTelegramId(fromId);
    }

    if (merchant) {
      const typeLabel = BIZNESGO_MERCHANT_TYPE_LABELS[merchant.merchantType] || merchant.merchantType;
      await sendBiznesGoMessage(
        chatId,
        [
          `👋 <b>Assalomu alaykum, ${escapeHtml(firstName)}!</b>`,
          "",
          "🏪 <b>Sizning do'koningiz BiznesGO tizimiga ulangan:</b>",
          `🏢 Do'kon nomi: <b>${escapeHtml(merchant.organizationName)}</b>`,
          `👤 Mas'ul shaxs: <b>${escapeHtml(merchant.name)}</b>`,
          `🏷 Faoliyat turi: <b>${escapeHtml(typeLabel)}</b>`,
          `📱 Telefon: <code>${escapeHtml(merchant.phone)}</code>`,
          merchant.address ? `📍 Manzil: ${escapeHtml(merchant.address)}` : "",
          `🕒 Ish vaqti: ${escapeHtml(merchant.workingHours || "08:00 - 18:00")}`,
          "",
          "Savdo va inventarni boshqarish uchun pastdagi tugmani bosing 👇",
        ]
          .filter(Boolean)
          .join("\n"),
        {
          inlineKeyboard: [
            [buildMiniAppButton("🏪 BiznesGO Boshqaruv Panelini Ochish", miniAppUrl)],
            [{ text: "💬 Qo'llab-quvvatlash", url: "https://t.me/agroz_support" }],
          ],
        }
      );
      return;
    }

    // Ro'yxatdan o'tmagan bo'lsa
    await sendBiznesGoMessage(
      chatId,
      [
        `👋 <b>Assalomu alaykum, ${escapeHtml(firstName)}!</b>`,
        "",
        "🏢 <b>BiznesGO</b> — agro-do'konlar, veterinar dorixonalar, ozuqa omborlari va qishloq xo'jaligi savdosi uchun biznes boshqaruv tizimi.",
        "",
        "🔹 <b>Siz uchun tayyorlangan imkoniyatlar:</b>",
        "• 📦 Mahsulotlar katalogi va inventar nazorati",
        "• ⚡️ Tezkor kassa (POS) savdosi",
        "• 📒 Nasiya va qarz daftari",
        "• 🛒 AgrozGO ilovasidagi fermer va xaridorlardan yangi buyurtmalar qabuli",
        "",
        "Do'koningizni tizimga ulash va qulay boshqarish uchun pastdagi tugmani bosing va 1 daqiqada ro'yxatdan o'ting 👇",
      ].join("\n"),
      {
        inlineKeyboard: [
          [buildMiniAppButton("🚀 BiznesGO’ni ochish / Ro'yxatdan o'tish", miniAppUrl)],
          [{ text: "ℹ️ Imkoniyatlar haqida", callback_data: "biznesgo:info" }],
          [{ text: "💬 Qo'llab-quvvatlash", url: "https://t.me/agroz_support" }],
        ],
      }
    );
    return;
  }

  if (text.startsWith("/profil") || text.startsWith("/status")) {
    let merchant: any = null;
    if (fromId) {
      merchant = await findOrSyncMerchantByTelegramId(fromId);
    }

    if (merchant) {
      const typeLabel = BIZNESGO_MERCHANT_TYPE_LABELS[merchant.merchantType] || merchant.merchantType;
      await sendBiznesGoMessage(
        chatId,
        [
          "📋 <b>Sizning BiznesGO profilingiz:</b>",
          "",
          `🏢 Do'kon: <b>${escapeHtml(merchant.organizationName)}</b>`,
          `👤 Egasi: <b>${escapeHtml(merchant.name)}</b>`,
          `🏷 Toifa: <b>${escapeHtml(typeLabel)}</b>`,
          `📱 Telefon: <code>${escapeHtml(merchant.phone)}</code>`,
          merchant.region ? `📍 Viloyat: ${escapeHtml(merchant.region)}` : "",
          merchant.address ? `🏠 Manzil: ${escapeHtml(merchant.address)}` : "",
          `🕒 Ish vaqti: ${escapeHtml(merchant.workingHours || "08:00 - 18:00")}`,
          `🚚 Yetkazib berish: ${merchant.deliveryAvailable ? "Mavjud ✅" : "Yo'q ❌"}`,
          `⭐️ Status: <b>${escapeHtml(merchant.status || "active")}</b>`,
          "",
          "Profilni tahrirlash yoki mahsulotlarni ko'rish uchun ilovani oching 👇",
        ]
          .filter(Boolean)
          .join("\n"),
        {
          inlineKeyboard: [[buildMiniAppButton("🏪 Profilni ochish", miniAppUrl)]],
        }
      );
    } else {
      await sendBiznesGoMessage(
        chatId,
        "⚠️ Siz hali BiznesGO tizimida ro'yxatdan o'tmagansiz.\n\nRo'yxatdan o'tish uchun quyidagi tugmani bosing 👇",
        {
          inlineKeyboard: [[buildMiniAppButton("🚀 Ro'yxatdan o'tish", miniAppUrl)]],
        }
      );
    }
    return;
  }

  if (text.startsWith("/yordam") || text.startsWith("/help")) {
    await sendBiznesGoMessage(
      chatId,
      [
        "ℹ️ <b>BiznesGO Yordam Markazi</b>",
        "",
        "BiznesGO — agro-biznesingizni telefoningiz orqali boshqarish imkonini beradi.",
        "",
        "📌 <b>Asosiy buyruqlar:</b>",
        "/start — Botni yangilash va bosh menyuni ochish",
        "/profil — Do'kon ma'lumotlarini tekshirish",
        "/yordam — Qo'llanma va qo'llab-quvvatlash",
        "",
        "Texnik yordam yoki savollar uchun: @agroz_support",
      ].join("\n"),
      {
        inlineKeyboard: [
          [buildMiniAppButton("🏪 BiznesGO’ni ochish", miniAppUrl)],
          [{ text: "💬 Administratorga yozish", url: "https://t.me/agroz_support" }],
        ],
      }
    );
    return;
  }

  // Boshqa har qanday xabar
  await sendBiznesGoMessage(
    chatId,
    "BiznesGO boshqaruv paneliga o'tish uchun quyidagi tugmadan foydalaning 👇",
    {
      inlineKeyboard: [[buildMiniAppButton("🏪 BiznesGO’ni ochish", miniAppUrl)]],
    }
  );
}

