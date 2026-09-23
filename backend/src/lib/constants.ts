/** Ilova bo'ylab ishlatiladigan chegaralar va muddatlar. */

/** SMS orqali yuborilgan kod amal qilish muddati (daqiqa). */
export const OTP_TTL_MINUTES = 5;

/** Telegram bot orqali olinadigan kod uchun ko'proq vaqt — foydalanuvchi ilovaga o'tib qaytishi kerak. */
export const BOT_OTP_TTL_MINUTES = 10;

/** Bitta kod uchun maksimal urinish soni — shundan keyin kod kuyadi. */
export const OTP_MAX_ATTEMPTS = 5;

/** OTP kod uzunligi (xonalar soni). */
export const OTP_LENGTH = 6;

/** Sessiya amal qilish muddati (kun). */
export const SESSION_TTL_DAYS = 90;

/** Tashxis uchun rasmning maksimal hajmi (bayt). Vercel body limitidan ancha kichik. */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/** Ovozli xabar maksimal hajmi (bayt). */
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

/** Tashxis tavsifi maksimal uzunligi. */
export const MAX_DIAGNOSIS_TEXT = 2000;

/** Yaqin atrofdagi qidiruv uchun yagona standart radius (km). */
export const NEARBY_RADIUS_KM = 15;
export const DEFAULT_SEARCH_RADIUS_KM = 15;

/**
 * Yaqin atrof qidiruvining chegarasi (km).
 * Admin sozlamalari orqali 100 km gacha kengaytirilishi mumkin.
 */
export const MAX_NEARBY_RADIUS_KM = 100;

/** UI'da qo'llaniladigan radius variantlari (km). */
export const RADIUS_OPTIONS = [5, 10, 15, 25, 50] as const;

/**
 * AI tashxisi shu foizdan past ishonch bilan qaytsa — foydalanuvchi
 * mutaxassisga yo'naltiriladi.
 */
export const CONFIDENCE_THRESHOLD = 80;

/**
 * `@agroz_auth_bot` — mutaxassis va dorixona egalarini ro'yxatdan o'tkazuvchi bot.
 * Client komponentlarda ham kerak, shuning uchun `NEXT_PUBLIC_` o'zgaruvchisidan
 * o'qiladi (build paytida kodga singdiriladi).
 */
export const AUTH_BOT_USERNAME = (
  process.env.NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME ?? "agroz_auth_bot"
)
  .trim()
  .replace(/^@/, "");

/** Ro'yxatdan o'tish havolasi (`t.me/...`). */
export const AUTH_BOT_URL = `https://t.me/${AUTH_BOT_USERNAME}`;
