import { db } from "../db/index.js";
import {
  sessions,
  users,
  pushTokens,
  diagnoses,
  notificationReads,
  supportTickets,
  supportMessages,
  specialistCalls,
  specialists,
  orders,
} from "../db/schema.js";
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
      const s = (await db.select().from(specialists).where(eq(specialists.telegramId, telegramId)).limit(1))[0];
      if (s) {
        return {
          id: s.id,
          name: s.organization || s.name,
          phone: s.phone,
          region: s.address,
          district: null,
          secondPhone: null,
          telegramId: s.telegramId,
          role: s.role,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        } as any;
      }
    } catch (err) {
      try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
        const u = (await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1))[0];
        if (u) return u;
        const s = (await db.select().from(specialists).where(eq(specialists.telegramId, telegramId)).limit(1))[0];
        if (s) {
          return {
            id: s.id,
            name: s.organization || s.name,
            phone: s.phone,
            region: s.address,
            district: null,
            secondPhone: null,
            telegramId: s.telegramId,
            role: s.role,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          } as any;
        }
      } catch {}
    }
  }

  return null;
}

/**
 * Apple App Store (Guideline 5.1.1(v)) va Google Play talablari bo'yicha
 * foydalanuvchiga tegishli barcha ma'lumotlarni to'liq tozalash va anonimlashtirish.
 */
export async function purgeUserAccount(userId: number): Promise<void> {
  try {
    // 1. Push bildirishnoma tokenlari
    await db.delete(pushTokens).where(eq(pushTokens.userId, userId)).catch(() => {});

    // 2. AI tashxis tarixi
    await db.delete(diagnoses).where(eq(diagnoses.userId, userId)).catch(() => {});

    // 3. Bildirishnomalar o'qilganlik holatlari
    await db.delete(notificationReads).where(eq(notificationReads.userId, userId)).catch(() => {});

    // 4. Qo'llab-quvvatlash ticketlari va xabarlari
    const userTickets = await db
      .select({ id: supportTickets.id })
      .from(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .catch(() => []);
    for (const t of userTickets) {
      await db.delete(supportMessages).where(eq(supportMessages.ticketId, t.id)).catch(() => {});
    }
    await db.delete(supportTickets).where(eq(supportTickets.userId, userId)).catch(() => {});

    // 5. Mutaxassis chaqiruvlari (foydalanuvchi telefoni orqali bog'langan bo'lsa)
    const [u] = await db.select({ phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1);
    if (u?.phone) {
      await db.delete(specialistCalls).where(eq(specialistCalls.customerPhone, u.phone)).catch(() => {});
    }

    // 6. Buyurtmalar: Qonuniy hisob-kitob/buxgalteriya audit talablari sababli tranzaksiya
    // kvitansiyasi saqlanadi, biroq foydalanuvchining shaxsiy ma'lumotlari butunlay anonimlashtiriladi.
    await db
      .update(orders)
      .set({
        userId: null,
        customerName: "O'chirilgan hisob",
        customerPhone: "000000000",
        customerAddress: null,
        note: null,
      })
      .where(eq(orders.userId, userId))
      .catch(() => {});

    // 7. Barcha aktiv sessiyalar
    await db.delete(sessions).where(eq(sessions.userId, userId)).catch(() => {});

    // 8. Foydalanuvchi hisobining o'zi
    await db.delete(users).where(eq(users.id, userId)).catch(() => {});
  } catch (err) {
    console.error(`[purgeUserAccount] Error deleting user #${userId}:`, err);
    throw err;
  }
}
