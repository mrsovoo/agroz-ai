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

/** Yaqin atrofdagi qidiruv uchun standart radius (km). */
export const NEARBY_RADIUS_KM = 5;

/**
 * Yaqin atrof qidiruvining qat'iy chegarasi (km).
 * Mutaxassis ham, dorixona ham faqat shu radius ichida ko'rsatiladi.
 */
export const MAX_NEARBY_RADIUS_KM = 5;
