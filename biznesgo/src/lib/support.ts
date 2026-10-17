export const SUPPORT_TELEGRAM =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ||
  process.env.SUPPORT_TELEGRAM ||
  "agroz_support";

export const SUPPORT_TELEGRAM_URL = `https://t.me/${SUPPORT_TELEGRAM.replace(/^@/, "")}`;

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
  process.env.SUPPORT_EMAIL ||
  "info@agroz.uz";

