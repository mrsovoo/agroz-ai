import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

/**
 * Request ichidan foydalanuvchini aniqlash:
 * 1) Sessiya orqali: Authorization header, x-session-id, agroai_session / agroz_session cookielari
 * 2) Telegram Mini App orqali: x-telegram-user-id headeri, x-telegram-init-data headeri yoki ?telegramId query
 *
 * Bu Telegram Webview'da cookielar bo'lmaganda yoki bloklanganda ham
 * ro'yxatdan o'tgan foydalanuvchini aniqlash imkonini beradi.
 */
export async function getUserFromReq(req: any): Promise<typeof users.$inferSelect | null> {
  if (!req) return null;

  // 1. Sessiya tekshiruvi (Header yoki Cookie)
  const authHeader = req.headers?.authorization;
  const cookieHeader = req.headers?.cookie;
  const cookieSession = cookieHeader
    ?.split(";")
    .find((c: string) => c.trim().startsWith("agroai_session=") || c.trim().startsWith("agroz_session="))
    ?.split("=")[1]?.trim();

  const sessionId =
    authHeader?.replace("Bearer ", "")?.trim() ||
    req.headers?.["x-session-id"] ||
    req.cookies?.agroai_session ||
    req.cookies?.agroz_session ||
    cookieSession;

  if (sessionId) {
    try {
      const s = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1))[0];
      if (s) {
        const u = (await db.select().from(users).where(eq(users.id, s.userId)).limit(1))[0];
        if (u) return u;
      }
    } catch (e) {
      console.error("[user-auth] session lookup error:", e);
    }
  }

  // 2. Telegram Auth (x-telegram-user-id, x-telegram-init-data, ?telegramId)
  const tgHeaderId = req.headers?.["x-telegram-user-id"] || req.headers?.["x-telegram-id"] || req.query?.telegramId;
  let telegramId: number | null = null;
  if (tgHeaderId && Number.isSafeInteger(Number(tgHeaderId))) {
    telegramId = Number(tgHeaderId);
  }

  const initData = req.headers?.["x-telegram-init-data"];
  if (!telegramId && typeof initData === "string" && initData) {
    try {
      const rawUser = new URLSearchParams(initData).get("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.id && Number.isSafeInteger(Number(parsed.id))) {
          telegramId = Number(parsed.id);
        }
      }
    } catch {}
  }

  if (telegramId) {
    try {
      const u = (await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1))[0];
      if (u) return u;
    } catch (err) {
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
        const u = (await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1))[0];
        if (u) return u;
      } catch {}
    }
  }

  return null;
}
