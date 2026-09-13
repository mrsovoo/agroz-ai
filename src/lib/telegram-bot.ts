/**
 * Telegram Bot API bilan ishlash.
 *
 * Saytdan kirishda telefon raqamni tasdiqlash uchun kod SMS o'rniga bot orqali
 * yuboriladi: foydalanuvchi botga o'tadi, «Start» bosadi va kodni oladi.
 */

const API_BASE = "https://api.telegram.org";

export type InlineKeyboard = {
  inline_keyboard: { text: string; url?: string; web_app?: { url: string } }[][];
};

export function botToken(): string | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  return token ? token : null;
}

export function isBotConfigured(): boolean {
  return botToken() !== null;
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
  const token = botToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      cache: "no-store",
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
  const me = await callBot<{ username?: string }>("getMe");
  cachedUsername = me?.username ?? null;
  return cachedUsername;
}

/** Mini App tugmasi: faqat HTTPS manzilda ishlaydi. */
export function miniAppKeyboard(): InlineKeyboard | undefined {
  const url = appBaseUrl();
  if (!url || !url.startsWith("https://")) return undefined;
  return {
    inline_keyboard: [[{ text: "📱 Mini Appni ochish", web_app: { url } }]],
  };
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
    "Men <b>AgroVet AI</b> — dehqon va chorvador yordamchisiman:",
    "• 🌿 Ekin kasalligini rasm orqali aniqlash",
    "• 🐄 Chorva kasalliklari bo'yicha tavsiya",
    "• 💊 Yaqin agro/vet dorixonalar xaritasi",
    "• 🌤 Ob-havoga qarab purkash tavsiyasi",
    "",
    "Saytdan kirish uchun: saytda telefon raqamingizni kiriting va",
    "«Telegram orqali kod olish» tugmasini bosing — havola sizni shu yerga olib keladi.",
  ].join("\n");
}

export function expiredLinkMessage(): string {
  return [
    "⌛️ <b>Havola eskirgan yoki allaqachon ishlatilgan.</b>",
    "",
    "Iltimos, saytga qaytib yangi kod so'rang va botga qaytadan o'ting.",
  ].join("\n");
}

export function verifiedMessage(): string {
  return [
    "✅ <b>Raqamingiz tasdiqlandi!</b>",
    "",
    "Endi saytda ishlashda davom etishingiz yoki Mini Appni ochishingiz mumkin.",
  ].join("\n");
}

export async function sendMessage(
  chatId: number,
  text: string,
  options?: { keyboard?: InlineKeyboard },
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
