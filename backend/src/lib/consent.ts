import { db } from "../db/index.js";
import { dataConsents, specialists, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";

export const DEFAULT_CONSENT_STATEMENT =
  "Men shaxsiy ma'lumotlarim (ism, familiya, telefon raqam, manzil va kasbiy ma'lumotlarim) AgrozGO axborot tizimida xavfsiz saqlanishi, qayta ishlanishi hamda xizmatlardan foydalanish maqsadida foydalanilishiga ixtiyoriy ravishda to'liq rozilik bildiraman.";

export const DEFAULT_LEGAL_BASIS =
  "O'zbekiston Respublikasining 02.07.2019 yildagi O'RQ-547-sonli 'Shaxsiy ma'lumotlar to'g'risida'gi Qonuni 13, 14 va 15-moddalari talablari.";

export const CURRENT_POLICY_VERSION = "v1.0 (2026)";

export interface RecordConsentParams {
  subjectType: "specialist" | "pharmacy" | "user";
  subjectId: number;
  telegramId?: number | null;
  phone: string;
  fullName: string;
  consentChannel: string;
  consentStatement?: string;
  policyVersion?: string;
}

/**
 * Shaxsiy ma'lumotlarni saqlashga rozilikni o'zgarmas (immutable) audit jadvaliga yozish.
 * Bu yozuv hatto admin panel orqali ham tahrirlanmaydi yoki soxtalashtirilmaydi.
 */
export async function recordDataConsent(params: RecordConsentParams) {
  const consentedAt = new Date();
  const statement = params.consentStatement || DEFAULT_CONSENT_STATEMENT;
  const version = params.policyVersion || CURRENT_POLICY_VERSION;

  // Kriptografik SHA-256 isboti (Hash)
  const rawHashPayload = [
    params.subjectType,
    params.subjectId,
    params.phone,
    params.telegramId ?? 0,
    consentedAt.toISOString(),
    version,
    statement,
  ].join("|");

  const immutableHash = createHash("sha256").update(rawHashPayload).digest("hex");

  // 1. Audit logiga yozish
  const [created] = await db
    .insert(dataConsents)
    .values({
      subjectType: params.subjectType,
      subjectId: params.subjectId,
      telegramId: params.telegramId ? Number(params.telegramId) : null,
      phone: params.phone,
      fullName: params.fullName,
      policyVersion: version,
      consentChannel: params.consentChannel,
      consentStatement: statement,
      legalBasis: DEFAULT_LEGAL_BASIS,
      consentedAt,
      immutableHash,
    })
    .returning();

  // 2. Tegishli jadvalga (specialists yoki users) ham rozilik vaqtini yozish
  if (params.subjectType === "user") {
    await db
      .update(users)
      .set({
        consentedAt,
        consentVersion: version,
        consentChannel: params.consentChannel,
        consentText: statement,
      })
      .where(eq(users.id, params.subjectId))
      .catch((err) => console.error("[consent] update users error:", err));
  } else {
    await db
      .update(specialists)
      .set({
        consentedAt,
        consentVersion: version,
        consentChannel: params.consentChannel,
        consentText: statement,
      })
      .where(eq(specialists.id, params.subjectId))
      .catch((err) => console.error("[consent] update specialists error:", err));
  }

  return created;
}
