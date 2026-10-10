/** Ilova bo'ylab ishlatiladigan chegaralar va muddatlar. */

export const OTP_TTL_MINUTES = 5;
export const BOT_OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;
export const SESSION_TTL_DAYS = 90;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
export const MAX_DIAGNOSIS_TEXT = 2000;
export const NEARBY_RADIUS_KM = 5;
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_NEARBY_RADIUS_KM = 1000;
export const RADIUS_OPTIONS = [5, 15, 30, 50, 100, 1000] as const;
export const CONFIDENCE_THRESHOLD = 80;

export const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Buxoro",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Jizzax",
  "Navoiy",
  "Sirdaryo",
  "Qoraqalpog'iston",
] as const;

export const DEFAULT_AUTH_BOT_USERNAME = "agroz_auth_bot";
export const DEFAULT_USER_BOT_USERNAME = "agrozai_bot";
