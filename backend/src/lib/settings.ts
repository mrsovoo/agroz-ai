/**
 * Dinamik sozlashlar — admin panel orqali yangilanadi va `app_settings` jadvalida
 * saqlanadi. Har bir qiymat uchun ustuvorlik: **DB (admin yozgan) > env**.
 *
 * Token/parol qiymatlari hech qachon clientga chiqmaydi: admin API faqat
 * maskalangan ko'rinishni (`••••1234`) qaytaradi.
 */

import { db } from "@/db";
import { appSettings } from "@/db/schema";

export const SETTING_KEYS = {
  telegramBotToken: "telegram_bot_token",
  telegramBotUsername: "telegram_bot_username",
  telegramAuthBotToken: "telegram_auth_bot_token",
  telegramAuthBotUsername: "telegram_auth_bot_username",
  telegramWebhookSecret: "telegram_webhook_secret",
  telegramAuthWebhookSecret: "telegram_auth_webhook_secret",
  openaiApiKey: "openai_api_key",
  openaiBaseUrl: "openai_base_url",
  aiModel: "ai_model",
  asrModel: "asr_model",
  eskizEmail: "eskiz_email",
  eskizPassword: "eskiz_password",
  eskizFrom: "eskiz_from",
  adminUsername: "admin_username",
  adminPassword: "admin_password",
  defaultRadiusKm: "default_radius_km",
  deliveryEnabled: "delivery_enabled",
  deliveryMinOrderQty: "delivery_min_order_qty",
  deliveryPricePerKm: "delivery_price_per_km",
  deliveryBasePrice: "delivery_base_price",
  deliveryMaxDistanceKm: "delivery_max_distance_km",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/** Qaysi kalitlar maxfiy (admin UI'da maskalanadi). */
export const SECRET_KEYS = new Set<string>([
  SETTING_KEYS.telegramBotToken,
  SETTING_KEYS.telegramAuthBotToken,
  SETTING_KEYS.telegramWebhookSecret,
  SETTING_KEYS.telegramAuthWebhookSecret,
  SETTING_KEYS.openaiApiKey,
  SETTING_KEYS.eskizPassword,
  SETTING_KEYS.adminPassword,
]);

/** DB'dagi barcha sozlashlarni o'qiydi (ichki ishlatish uchun). */
async function readAll(): Promise<Map<string, string>> {
  try {
    const rows = await db.select().from(appSettings);
    const map = new Map<string, string>();
    for (const row of rows) {
      if (row.value !== null && row.value !== "") map.set(row.key, row.value);
      if (row.value === "") map.delete(row.key);
    }
    return map;
  } catch (err) {
    // DB hali migratsiya qilinmagan bo'lsa ham ilova yiqilmaydi.
    console.error("[settings] o'qishda xato:", err instanceof Error ? err.message : err);
    return new Map();
  }
}

/** Sozlamani DB'dan o'qiydi, bo'lmasa env'dan. */
export async function getSetting(key: SettingKey): Promise<string | null> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(eqKey(key))
    .limit(1);
  const fromDb = rows[0]?.value;
  if (fromDb !== undefined && fromDb !== null && fromDb !== "") return fromDb;
  return envFallback(key);
}

// drizzle `eq` importini kamaytirish uchun kichik yordamchi.
import { eq } from "drizzle-orm";
function eqKey(key: string) {
  return eq(appSettings.key, key);
}

/** Env fallback — DB'da yozuv bo'lmasa ishlatiladi. */
export function envFallback(key: SettingKey): string | null {
  const envMap: Record<SettingKey, string | undefined> = {
    [SETTING_KEYS.telegramBotToken]: process.env.TELEGRAM_BOT_TOKEN,
    [SETTING_KEYS.telegramBotUsername]: process.env.TELEGRAM_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "agroz_bot",
    [SETTING_KEYS.telegramAuthBotToken]: process.env.TELEGRAM_AUTH_BOT_TOKEN,
    [SETTING_KEYS.telegramAuthBotUsername]: process.env.TELEGRAM_AUTH_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME || "agroz_auth_bot",
    [SETTING_KEYS.telegramWebhookSecret]: process.env.TELEGRAM_WEBHOOK_SECRET,
    [SETTING_KEYS.telegramAuthWebhookSecret]: process.env.TELEGRAM_AUTH_WEBHOOK_SECRET,
    [SETTING_KEYS.openaiApiKey]: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
    [SETTING_KEYS.openaiBaseUrl]: process.env.OPENAI_BASE_URL || (process.env.GEMINI_API_KEY ? "https://generativelanguage.googleapis.com/v1beta/openai/" : undefined),
    [SETTING_KEYS.aiModel]: process.env.AI_MODEL,
    [SETTING_KEYS.asrModel]: process.env.ASR_MODEL,
    [SETTING_KEYS.eskizEmail]: process.env.ESKIZ_EMAIL,
    [SETTING_KEYS.eskizPassword]: process.env.ESKIZ_PASSWORD,
    [SETTING_KEYS.eskizFrom]: process.env.ESKIZ_FROM,
    [SETTING_KEYS.adminUsername]: process.env.ADMIN_USERNAME,
    [SETTING_KEYS.adminPassword]: process.env.ADMIN_PASSWORD,
    [SETTING_KEYS.defaultRadiusKm]: process.env.DEFAULT_RADIUS_KM || "5",
    [SETTING_KEYS.deliveryEnabled]: process.env.DELIVERY_ENABLED || "true",
    [SETTING_KEYS.deliveryMinOrderQty]: process.env.DELIVERY_MIN_ORDER_QTY || "5",
    [SETTING_KEYS.deliveryPricePerKm]: process.env.DELIVERY_PRICE_PER_KM || "3000",
    [SETTING_KEYS.deliveryBasePrice]: process.env.DELIVERY_BASE_PRICE || "10000",
    [SETTING_KEYS.deliveryMaxDistanceKm]: process.env.DELIVERY_MAX_DISTANCE_KM || "50",
  };
  const raw = envMap[key]?.trim();
  return raw ? raw : null;
}

export async function getDeliverySettings() {
  const enabledStr = await getSetting(SETTING_KEYS.deliveryEnabled);
  const minQtyStr = await getSetting(SETTING_KEYS.deliveryMinOrderQty);
  const pricePerKmStr = await getSetting(SETTING_KEYS.deliveryPricePerKm);
  const basePriceStr = await getSetting(SETTING_KEYS.deliveryBasePrice);
  const maxDistanceStr = await getSetting(SETTING_KEYS.deliveryMaxDistanceKm);

  return {
    enabled: enabledStr !== "false",
    minOrderQty: Math.max(1, Number(minQtyStr) || 5),
    pricePerKm: Math.max(0, Number(pricePerKmStr) || 3000),
    basePrice: Math.max(0, Number(basePriceStr) || 10000),
    maxDistanceKm: Math.max(1, Number(maxDistanceStr) || 50),
  };
}

/**
 * Sozlamani yozadi. Bo'sh satr yuborilsa — yozuv o'chiriladi (env fallback'ga qaytadi).
 */
export async function setSetting(key: SettingKey, value: string): Promise<void> {
  const trimmed = value.trim();
  if (!trimmed) {
    await db.delete(appSettings).where(eqKey(key));
    return;
  }
  await db
    .insert(appSettings)
    .values({ key, value: trimmed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: trimmed, updatedAt: new Date() },
    });
}

export async function setSettings(entries: { key: SettingKey; value: string }[]): Promise<void> {
  for (const entry of entries) {
    await setSetting(entry.key, entry.value);
  }
}

/**
 * Sozlamalar holati — admin UI va tashxis uchun. Har bir kalit uchun:
 * `source` — qiymat qayerdan olinadi (db / env / none), `masked` — maxfiy maydonlar uchun.
 */
export type SettingsStatus = {
  key: SettingKey;
  label: string;
  secret: boolean;
  source: "db" | "env" | "none";
  /** Maxfiy maydonlar uchun `••••1234` ko'rinishi; qolganlarda to'liq qiymat. */
  preview: string | null;
  updatedAt: string | null;
};

const LABELS: Record<SettingKey, string> = {
  [SETTING_KEYS.telegramBotToken]: "Asosiy bot tokeni (TELEGRAM_BOT_TOKEN)",
  [SETTING_KEYS.telegramBotUsername]: "Mijoz boti username (@agroz_bot)",
  [SETTING_KEYS.telegramAuthBotToken]: "Auth bot tokeni (@agroz_auth_bot)",
  [SETTING_KEYS.telegramAuthBotUsername]: "Auth bot username (@agroz_auth_bot)",
  [SETTING_KEYS.telegramWebhookSecret]: "Webhook maxfiy kaliti (asosiy bot)",
  [SETTING_KEYS.telegramAuthWebhookSecret]: "Webhook maxfiy kaliti (auth bot)",
  [SETTING_KEYS.openaiApiKey]: "AI kaliti (OpenAI/Gemini/Groq/...)",
  [SETTING_KEYS.openaiBaseUrl]: "AI endpoint (OPENAI_BASE_URL)",
  [SETTING_KEYS.aiModel]: "AI model nomi",
  [SETTING_KEYS.asrModel]: "Ovoz modeli (ASR_MODEL)",
  [SETTING_KEYS.eskizEmail]: "Eskiz.uz email",
  [SETTING_KEYS.eskizPassword]: "Eskiz.uz parol",
  [SETTING_KEYS.eskizFrom]: "Eskiz.uz sender nomi",
  [SETTING_KEYS.adminUsername]: "Admin login",
  [SETTING_KEYS.adminPassword]: "Admin parol",
  [SETTING_KEYS.defaultRadiusKm]: "Qidiruv radiusi (km) — Standart: 5 km",
  [SETTING_KEYS.deliveryEnabled]: "Yetkazib berish xizmati (true / false)",
  [SETTING_KEYS.deliveryMinOrderQty]: "Bepul yetkazib berish chegarasi (dori soni)",
  [SETTING_KEYS.deliveryPricePerKm]: "1 km uchun yetkazib berish narxi (so'm)",
  [SETTING_KEYS.deliveryBasePrice]: "Bazaviy boshlang'ich yetkazib berish narxi (so'm)",
  [SETTING_KEYS.deliveryMaxDistanceKm]: "Maksimal yetkazib berish masofasi (km)",
};

function mask(value: string): string {
  if (value.length <= 4) return "••••";
  return `••••${value.slice(-4)}`;
}

export async function getSettingsStatus(): Promise<SettingsStatus[]> {
  const all = await readAll();
  const updatedAtRows = await db
    .select({ key: appSettings.key, updatedAt: appSettings.updatedAt })
    .from(appSettings);
  const updatedAtMap = new Map(updatedAtRows.map((r) => [r.key, r.updatedAt]));

  return (Object.keys(LABELS) as SettingKey[]).map((key) => {
    const dbValue = all.get(key);
    const secret = SECRET_KEYS.has(key);
    const source: SettingsStatus["source"] = dbValue ? "db" : envFallback(key) ? "env" : "none";
    const effective = dbValue ?? envFallback(key);
    return {
      key,
      label: LABELS[key],
      secret,
      source,
      preview: effective ? (secret ? mask(effective) : effective) : null,
      updatedAt: updatedAtMap.get(key)?.toISOString() ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Tez yordamchilar — har bir xizmat uchun samarali qiymat (DB > env)
// ---------------------------------------------------------------------------

export async function telegramBotToken(): Promise<string | null> {
  return getSetting(SETTING_KEYS.telegramBotToken);
}
export async function telegramAuthBotToken(): Promise<string | null> {
  return getSetting(SETTING_KEYS.telegramAuthBotToken);
}
export async function telegramWebhookSecret(): Promise<string | null> {
  return getSetting(SETTING_KEYS.telegramWebhookSecret);
}
export async function telegramAuthWebhookSecret(): Promise<string | null> {
  return getSetting(SETTING_KEYS.telegramAuthWebhookSecret);
}
export async function aiApiKey(): Promise<string | null> {
  return getSetting(SETTING_KEYS.openaiApiKey);
}
export async function aiBaseUrl(): Promise<string | null> {
  return getSetting(SETTING_KEYS.openaiBaseUrl);
}
export async function aiModel(): Promise<string | null> {
  return getSetting(SETTING_KEYS.aiModel);
}
export async function asrModel(): Promise<string | null> {
  return getSetting(SETTING_KEYS.asrModel);
}
export async function defaultRadiusKmSetting(): Promise<number> {
  const val = await getSetting(SETTING_KEYS.defaultRadiusKm);
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : 5;
}

export async function adminUsernameSetting(): Promise<string | null> {
  return getSetting(SETTING_KEYS.adminUsername);
}
export async function adminPasswordSetting(): Promise<string | null> {
  return getSetting(SETTING_KEYS.adminPassword);
}
