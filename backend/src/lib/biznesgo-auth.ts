import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { biznesgoMerchants, biznesgoSessions, specialists } from "../db/schema.js";
import { extractVerifiedTelegramUser } from "./tg-auth.js";
import { isAllowUnverifiedTelegramAllowed } from "./security-flags.js";

export const BIZNESGO_MERCHANT_TYPES = [
  "agro_shop",
  "veterinary_pharmacy",
  "feed_store",
  "warehouse",
  "seed_seedling_store",
  "equipment_store",
] as const;

export type BiznesGoMerchantType = (typeof BIZNESGO_MERCHANT_TYPES)[number];

/**
 * Specialty/role matnidan BiznesGO merchant_type ni aniqlash.
 */
export function resolveMerchantTypeFromSpecialty(specialty?: string | null): BiznesGoMerchantType {
  const s = (specialty || "").toLowerCase();
  if (s.includes("vet") || s.includes("chorva") || s.includes("animal")) {
    return "veterinary_pharmacy";
  }
  if (s.includes("yem") || s.includes("ozuqa")) {
    return "feed_store";
  }
  if (s.includes("urug") || s.includes("ko'chat") || s.includes("kochat")) {
    return "seed_seedling_store";
  }
  if (s.includes("ombor") || s.includes("ulgurji")) {
    return "warehouse";
  }
  if (s.includes("texnik") || s.includes("jihoz") || s.includes("uskuna")) {
    return "equipment_store";
  }
  return "agro_shop";
}

/**
 * Sotuvchini telegramId orqali biznesgo_merchants'dan qidiradi.
 * Agar u yerda topilmasa, @agroz_auth_bot orqali ro'yxatdan o'tgan `specialists` jadvalidan
 * qidirib, avtomatik ravishda `biznesgo_merchants` ga ko'chirib (sync qilib) qaytaradi.
 */
export async function findOrSyncMerchantByTelegramId(
  telegramId: number
): Promise<typeof biznesgoMerchants.$inferSelect | null> {
  const [existing] = await db
    .select()
    .from(biznesgoMerchants)
    .where(eq(biznesgoMerchants.telegramId, telegramId))
    .limit(1);

  if (existing) return existing;

  try {
    const [legacySpec] = await db
      .select()
      .from(specialists)
      .where(eq(specialists.telegramId, telegramId))
      .limit(1);

    if (!legacySpec) return null;

    const orgName =
      legacySpec.organization?.trim() ||
      `${legacySpec.name} (${legacySpec.role === "pharmacy" ? "Agro-dorixona" : legacySpec.specialty || "Mutaxassis"})`;

    const [inserted] = await db
      .insert(biznesgoMerchants)
      .values({
        telegramId: legacySpec.telegramId,
        phone: legacySpec.phone,
        name: legacySpec.name,
        organizationName: orgName.slice(0, 200),
        merchantType: resolveMerchantTypeFromSpecialty(legacySpec.specialty),
        address: legacySpec.address || null,
        latitude: legacySpec.lat ?? null,
        longitude: legacySpec.lng ?? null,
        workingHours: legacySpec.workHours || "08:00 - 18:00",
        deliveryAvailable: true,
        status: legacySpec.isActive === false ? "blocked" : "active",
      })
      .onConflictDoUpdate({
        target: biznesgoMerchants.telegramId,
        set: { updatedAt: new Date() },
      })
      .returning();

    return inserted ?? null;
  } catch {
    return null;
  }
}

/**
 * BiznesGO Bot Tokenini olish.
 * BIZNESGO_BOT_TOKEN environment o'zgaruvchisidan olinadi (bo'lmasa TELEGRAM_AUTH_BOT_TOKEN fallback).
 */
export function getBiznesGoBotToken(): string {
  return (
    process.env.BIZNESGO_BOT_TOKEN?.trim() ||
    process.env.TELEGRAM_AUTH_BOT_TOKEN?.trim() ||
    ""
  );
}

/**
 * Tokenni sha256 orqali hash qilish (bazada faqat hash saqlanadi).
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * 30 kunlik xavfsiz merchant sessiyasini yaratish.
 */
export async function createBiznesGoSession(merchantId: number): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const sessionId = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 kun

  await db.insert(biznesgoSessions).values({
    id: sessionId,
    merchantId,
    tokenHash,
    expiresAt,
  });

  return {
    token: rawToken,
    expiresAt,
  };
}

/**
 * Sessiya tokenini tekshirish.
 * Token muddati tugagan bo'lsa yoki topilmasa null qaytaradi.
 */
export async function verifyBiznesGoSession(rawToken: string): Promise<{
  merchant?: typeof biznesgoMerchants.$inferSelect;
  error?: "invalid" | "expired" | "blocked";
}> {
  if (!rawToken || typeof rawToken !== "string") return { error: "invalid" };
  const cleanToken = rawToken.replace(/^Bearer\s+/i, "").trim();
  if (!cleanToken) return { error: "invalid" };

  const tokenHash = hashSessionToken(cleanToken);
  const [session] = await db
    .select()
    .from(biznesgoSessions)
    .where(eq(biznesgoSessions.tokenHash, tokenHash))
    .limit(1);

  if (!session) {
    return { error: "invalid" };
  }

  if (session.expiresAt && session.expiresAt <= new Date()) {
    // Muddati tugagan sessiyani tozalash
    await db.delete(biznesgoSessions).where(eq(biznesgoSessions.id, session.id)).catch(() => {});
    return { error: "expired" };
  }

  const [merchant] = await db
    .select()
    .from(biznesgoMerchants)
    .where(eq(biznesgoMerchants.id, session.merchantId))
    .limit(1);

  if (!merchant) {
    return { error: "invalid" };
  }

  if (merchant.status === "blocked") {
    return { error: "blocked" };
  }

  return { merchant };
}

/**
 * Telegram Mini App initData'sini HMAC-SHA256 orqali @biznesgo_bot (BIZNESGO_BOT_TOKEN)
 * va @agroz_auth_bot (TELEGRAM_AUTH_BOT_TOKEN) tokenlari bilan tekshirish.
 */
export function verifyBiznesGoInitData(initData: string): ReturnType<typeof extractVerifiedTelegramUser> {
  if (!initData || typeof initData !== "string") return null;
  const clean = initData.trim();
  if (!clean) return null;

  const candidateTokens = Array.from(
    new Set(
      [
        process.env.BIZNESGO_BOT_TOKEN?.trim(),
        process.env.TELEGRAM_AUTH_BOT_TOKEN?.trim(),
      ].filter(Boolean) as string[]
    )
  );

  for (const token of candidateTokens) {
    const user = extractVerifiedTelegramUser(clean, token);
    if (user) return user;
  }

  // Faqat development muhitida ALLOW_UNVERIFIED_TELEGRAM=true bo'lsa (lokal sinovlar uchun)
  if (isAllowUnverifiedTelegramAllowed()) {
    try {
      const params = new URLSearchParams(clean);
      const userStr = params.get("user");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        const id = Number(parsed?.id);
        if (Number.isSafeInteger(id) && id > 0) {
          return {
            id,
            telegramId: String(id),
            first_name: parsed.first_name,
            last_name: parsed.last_name,
            username: parsed.username,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

