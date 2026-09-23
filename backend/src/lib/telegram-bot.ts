/**
 * Telegram Bot API bilan ishlash.
 *
 * Saytdan kirishda telefon raqamni tasdiqlash uchun kod SMS o'rniga bot orqali
 * yuboriladi: foydalanuvchi botga o'tadi, «Start» bosadi va kodni oladi.
 *
 * Token admin panel (`/admin/panel`) orqali ham sozlanadi — DB'da yozuv bo'lsa
 * env'dagi qiymatdan ustun turadi.
 */

import { telegramBotToken } from "@/lib/settings";

const API_BASE = "https://api.telegram.org";

export type InlineKeyboard = {
  inline_keyboard: { text: string; url?: string; web_app?: { url: string }; callback_data?: string }[][];
};

export type ReplyKeyboard = {
  keyboard: { text: string; request_contact?: boolean; request_location?: boolean }[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  remove_keyboard?: boolean;
};

/** Token: DB (admin panel) > env. */
export async function resolveBotToken(): Promise<string | null> {
  return telegramBotToken();
}

/** Sinxron env tokeni — faqat tez tekshiruvlar uchun (webhook guard). */
export function botToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token ? token : null;
}

/** Ilova sozlanganmi: DB'da yoki env'da token bormi. */
export async function isBotConfigured(): Promise<boolean> {
  return (await resolveBotToken()) !== null;
}

/** Ilovaning tashqi manzili (Mini App tugmasi va deep linklar uchun). */
export function appBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/** Telegram botda `/start <token>` havolasini yasaydi. */
export function startLink(botUsername: string, payload?: string): string {
  const base = `https://t.me/${botUsername}`;
  return payload ? `${base}?start=${encodeURIComponent(payload)}` : base;
}

export async function callBot<T>(
  method: string,
  payload?: Record<string, unknown>,
): Promise<T | null> {
  const token = await resolveBotToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    const json = (await res.json()) as { ok?: boolean; result?: T; description?: string };
    if (!json.ok) {
      console.error(`[bot] ${method} xatosi:`, json.description ?? res.status);
      return null;
    }
    return json.result ?? null;
  } catch (err) {
    console.error(`[bot] ${method} so'rovi bajarilmadi:`, err);
    return null;
  }
}

let cachedUsername: string | null | undefined;

export async function getBotUsername(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  if (fromEnv) return fromEnv;
  if (cachedUsername !== undefined) return cachedUsername;
  if (!(await isBotConfigured())) return null;
  const me = await callBot<{ username?: string }>("getMe");
  cachedUsername = me?.username ?? null;
  return cachedUsername;
}

/** Bot chatiga o'tish havolasi (kod shu chatda chiqadi). */
export function botChatLink(botUsername: string | null): string | null {
  return botUsername ? `https://t.me/${botUsername}` : null;
}

/** Mini App tugmasi: faqat HTTPS manzilda ishlaydi. */
export function miniAppKeyboard(): InlineKeyboard | undefined {
  const url = appBaseUrl();
  if (!url || !url.startsWith("https://")) return undefined;
  return {
    inline_keyboard: [[{ text: "🚀 Agroz AI", web_app: { url } }]],
  };
}

/** `@agroz_auth_bot` username (ro'yxatdan o'tish havolasi uchun). */
export function authBotUsername(): string {
  const fromEnv = process.env.TELEGRAM_AUTH_BOT_USERNAME?.trim().replace(/^@/, "");
  return fromEnv || "agroz_auth_bot";
}

/** Salomlashish uchun: Mini App + sayt + ro'yxatdan o'tish tugmalari. */
export function greetingKeyboard(): InlineKeyboard | undefined {
  const url = appBaseUrl();
  if (!url) return undefined;
  const rows: InlineKeyboard["inline_keyboard"] = [];
  if (url.startsWith("https://")) rows.push([{ text: "🚀 Agroz AI", web_app: { url } }]);
  rows.push([{ text: "🌐 Saytni ochish", url }]);
  rows.push([
    { text: "📋 Mutaxassis bo'lib ro'yxatdan o'tish", url: `https://t.me/${authBotUsername()}` },
  ]);
  return { inline_keyboard: rows };
}

// ---------------------------------------------------------------------------
// Bot xabarlari (HTML formatida)
// ---------------------------------------------------------------------------

/**
 * Telegram parse_mode=HTML — foydalanuvchi kiritgan matnni ekranlash kerak,
 * aks holda `<` yoki `&` bo'lsa Telegram xabarni rad etadi va bot jim qoladi.
 */
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function codeMessage(code: string, phone: string, ttlMinutes: number): string {
  return [
    "🔐 <b>Tasdiqlash kodi</b>",
    "",
    `<code>${escapeHtml(code)}</code>`,
    "",
    "☝️ Kodni bosing — nusxa olinadi (yoki uzoq bosib «Copy»ni tanlang).",
    "So'ngra saytga qaytib shu kodni kiriting.",
    "",
    `📞 Raqam: <b>${escapeHtml(phone)}</b>`,
    `⏳ Kod ${ttlMinutes} daqiqa amal qiladi.`,
  ].join("\n");
}

export function greetingMessage(name?: string): string {
  return [
    `👋 Salom${name ? `, ${escapeHtml(name)}` : ""}!`,
    "",
    "Men <b>Agroz AI</b> — dehqon va chorvador yordamchisiman:",
    "• 💊 Ekin va chorva dori vositalari katalogi",
    "• 📍 Yaqin agro va vet dorixonalar xaritasi (5 km)",
    "• 👨‍🌾 Malakali agronom va veterinarlar",
    "• 🌤 Ob-havo ma'lumotlari va purkash tavsiyalari",
    "",
    "<b>👇 «Agroz AI» tugmasini bosing — ilova shu yerda ochiladi.</b>",
    "",
    "🔐 <b>Telefon raqamni tasdiqlash:</b> saytda raqamingizni kiriting va",
    "«Tasdiqlash kodini olish»ni bosing. Havola sizni shu chatga olib keladi va",
    "tasdiqlash kodi shu yerda chiqadi.",
    "",
    "📋 <b>Mutaxassis yoki dorixona egasimisiz?</b> Pastdagi tugma orqali",
    `<b>@${escapeHtml(authBotUsername())}</b> botida ro'yxatdan o'ting — profilingiz Agroz AI`,
    "xaritasida 5 km radius ichida ko'rinadi.",
  ].join("\n");
}

export function expiredLinkMessage(): string {
  return [
    "⌛️ <b>Havola eskirgan yoki allaqachon ishlatilgan.</b>",
    "",
    "Iltimos, saytga qaytib yangi kod so'rang va botga qaytadan o'ting.",
  ].join("\n");
}

export function alreadyVerifiedMessage(): string {
  return [
    "✅ Bu havola allaqachon ishlatilgan.",
    "",
    "Agar yana tasdiqlash kerak bo'lsa, saytda yangi kod so'rang.",
    "Ilovani ochish uchun pastdagi tugmani bosing.",
  ].join("\n");
}

export function verifiedMessage(): string {
  return [
    "✅ <b>Raqamingiz tasdiqlandi!</b>",
    "",
    "Endi saytda ishlashda davom etishingiz yoki Mini Appni ochishingiz mumkin.",
  ].join("\n");
}

/** Bot ichida kutilmagan xato bo'lganda yuboriladigan xabar. */
export function errorMessage(): string {
  return [
    "⚠️ <b>Xatolik yuz berdi.</b>",
    "",
    "Iltimos, bir ozdan so'ng botga qaytadan <b>/start</b> yuboring yoki saytda yangi kod so'rang.",
  ].join("\n");
}

export function contactRequestKeyboard(): ReplyKeyboard {
  return {
    keyboard: [[{ text: "📱 Telefon raqamni yuborish", request_contact: true }]],
    resize_keyboard: true,
    one_time_keyboard: true,
  };
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: { keyboard?: InlineKeyboard | ReplyKeyboard | { remove_keyboard: true } },
): Promise<boolean> {
  const keyboard = options?.keyboard;
  const result = await callBot<{ message_id?: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(keyboard ? { reply_markup: keyboard } : {}),
  });
  return result !== null;
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
  await callBot("answerCallbackQuery", {
    callback_query_id: id,
    ...(text ? { text } : {}),
  });
}
