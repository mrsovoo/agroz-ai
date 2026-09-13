import { createHmac, timingSafeEqual } from "crypto";

/** initData imzosi shu vaqtdan eski bo'lsa qabul qilinmaydi (replay hujumidan himoya). */
export const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

/** Telegram ma'lumotlarini ikki tomon bayt-bayt solishtirish (timing attack'ga qarshi). */
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Telegram WebApp initData imzosini tekshiradi.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = INIT_DATA_MAX_AGE_SECONDS,
): boolean {
  if (!initData || !botToken) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return false;
  params.delete("hash");

  // Telegram talab qilganidek kalitlarni bayt tartibida saralash.
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (!safeEqualHex(computed, hash)) return false;

  // Eskirgan initData qayta ishlatilishining oldini olamiz.
  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || authDate <= 0) return false;
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) return false;
  if (ageSeconds < -60) return false; // soat farqi (clock skew) uchun kichik zaxira

  return true;
}
