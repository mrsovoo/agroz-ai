/** Ilova bo'ylab ishlatiladigan chegaralar va muddatlar. */

/** OTP kod amal qilish muddati (daqiqa). */
export const OTP_TTL_MINUTES = 5;

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
