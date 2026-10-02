import { db } from "../db/index.js";
import { users, specialists } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { partnerBotToken, farmerBotToken } from "./settings.js";

const API_BASE = "https://api.telegram.org";

async function postTelegram(token: string, method: string, payload: Record<string, unknown>): Promise<{ ok: boolean; description?: string; error_code?: number }> {
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({ ok: false }))) as { ok: boolean; description?: string; error_code?: number };
    return data;
  } catch (err: any) {
    return { ok: false, description: err?.message || "Network error" };
  }
}

/**
 * Hamkor (mutaxassis yoki agro-do'kon egasi)ga xabar yuborish.
 * Har doim PARTNER_BOT_TOKEN (@agroz_auth_bot) orqali yuboriladi.
 * Agar 403 bo'lsa (botni bloklagan bo'lsa), specialists.bot_blocked=true qilinadi.
 */
export async function sendToSpecialist(
  target: number | { id: number; telegramId?: number | bigint | null },
  text: string,
  options?: { reply_markup?: unknown; parse_mode?: string }
): Promise<{ ok: boolean; blocked?: boolean }> {
  const token = await partnerBotToken();
  if (!token) return { ok: false };

  let specId: number;
  let tgId: number | bigint | null = null;

  if (typeof target === "number") {
    specId = target;
    const spec = (await db.select({ id: specialists.id, telegramId: specialists.telegramId, botBlocked: specialists.botBlocked }).from(specialists).where(eq(specialists.id, specId)).limit(1))[0];
    if (!spec || !spec.telegramId) return { ok: false };
    tgId = spec.telegramId;
  } else {
    specId = target.id;
    tgId = target.telegramId ?? null;
    if (!tgId) {
      const spec = (await db.select({ telegramId: specialists.telegramId }).from(specialists).where(eq(specialists.id, specId)).limit(1))[0];
      tgId = spec?.telegramId ?? null;
    }
  }

  if (!tgId) return { ok: false };

  const payload: Record<string, unknown> = {
    chat_id: Number(tgId),
    text,
    parse_mode: options?.parse_mode ?? "HTML",
  };
  if (options?.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

  const res = await postTelegram(token, "sendMessage", payload);

  if (!res.ok && (res.error_code === 403 || res.description?.toLowerCase().includes("blocked"))) {
    await db.update(specialists).set({ botBlocked: true }).where(eq(specialists.id, specId)).catch(() => {});
    return { ok: false, blocked: true };
  }

  if (res.ok) {
    // Agar muvaffaqiyatli borsa, unblock qilamiz
    await db.update(specialists).set({ botBlocked: false }).where(eq(specialists.id, specId)).catch(() => {});
  }

  return { ok: res.ok };
}

/**
 * Fermer / mijozga Telegram orqali xabar yuborish.
 * Har doim FARMER_BOT_TOKEN (@agrozai_bot) orqali yuboriladi.
 * Agar 403 bo'lsa (botni bloklagan bo'lsa), users.bot_blocked=true qilinadi.
 */
export async function sendToUser(
  target: number | { id: number; telegramId?: number | bigint | null },
  text: string,
  options?: { reply_markup?: unknown; parse_mode?: string }
): Promise<{ ok: boolean; blocked?: boolean }> {
  const token = await farmerBotToken();
  if (!token) return { ok: false };

  let userId: number;
  let tgId: number | bigint | null = null;

  if (typeof target === "number") {
    userId = target;
    const u = (await db.select({ id: users.id, telegramId: users.telegramId, botBlocked: users.botBlocked }).from(users).where(eq(users.id, userId)).limit(1))[0];
    if (!u || !u.telegramId) return { ok: false };
    tgId = u.telegramId;
  } else {
    userId = target.id;
    tgId = target.telegramId ?? null;
    if (!tgId) {
      const u = (await db.select({ telegramId: users.telegramId }).from(users).where(eq(users.id, userId)).limit(1))[0];
      tgId = u?.telegramId ?? null;
    }
  }

  if (!tgId) return { ok: false };

  const payload: Record<string, unknown> = {
    chat_id: Number(tgId),
    text,
    parse_mode: options?.parse_mode ?? "HTML",
  };
  if (options?.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

  const res = await postTelegram(token, "sendMessage", payload);

  if (!res.ok && (res.error_code === 403 || res.description?.toLowerCase().includes("blocked"))) {
    await db.update(users).set({ botBlocked: true }).where(eq(users.id, userId)).catch(() => {});
    return { ok: false, blocked: true };
  }

  if (res.ok) {
    await db.update(users).set({ botBlocked: false }).where(eq(users.id, userId)).catch(() => {});
  }

  return { ok: res.ok };
}
