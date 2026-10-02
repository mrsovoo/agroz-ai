import { Router } from "express";
import { db } from "../db/index.js";
import { pushTokens, sessions, users } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

const router = Router();

async function getUserFromReq(req: any) {
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie || "";
  const cookieSession = cookieHeader
    .split(";")
    .find((c: string) => c.trim().startsWith("agroai_session=") || c.trim().startsWith("agroz_session="))
    ?.split("=")[1];

  const sessionId =
    req.cookies?.["agroai_session"] ||
    req.cookies?.["agroz_session"] ||
    authHeader?.replace("Bearer ", "") ||
    req.headers["x-session-id"] ||
    cookieSession;

  if (sessionId && typeof sessionId === "string") {
    const [row] = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, sessionId))
      .limit(1);
    if (row?.user) return row.user;
  }
  return null;
}

// POST /api/push/register — Tokenni ro'yxatdan o'tkazish / yangilash (upsert)
router.post("/register", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Avval tizimga kiring" });
    }

    const { token, platform } = req.body || {};
    if (!token || typeof token !== "string" || token.trim().length < 10) {
      return res.status(400).json({ error: "Yaroqsiz push token" });
    }

    const cleanToken = token.trim();
    const cleanPlatform = String(platform || "unknown").toLowerCase().slice(0, 20);

    // Token allaqachon bormi tekshirish
    const [existing] = await db
      .select({ id: pushTokens.id, userId: pushTokens.userId })
      .from(pushTokens)
      .where(eq(pushTokens.token, cleanToken))
      .limit(1);

    if (existing) {
      // Agar boshqa foydalanuvchiga tegishli bo'lsa yoki platformasi o'zgargan bo'lsa yangilash
      await db
        .update(pushTokens)
        .set({
          userId: user.id,
          platform: cleanPlatform,
          updatedAt: new Date(),
        })
        .where(eq(pushTokens.id, existing.id));
    } else {
      await db.insert(pushTokens).values({
        userId: user.id,
        token: cleanToken,
        platform: cleanPlatform,
      });
    }

    res.json({ ok: true, message: "Push token muvaffaqiyatli saqlandi" });
  } catch (err: any) {
    console.error("[push:register error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// DELETE /api/push/unregister — Tokenni o'chirish (chiqishda)
router.post("/unregister", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (token && typeof token === "string") {
      await db.delete(pushTokens).where(eq(pushTokens.token, token.trim())).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

router.delete("/unregister", async (req, res) => {
  try {
    const { token } = req.body || {};
    if (token && typeof token === "string") {
      await db.delete(pushTokens).where(eq(pushTokens.token, token.trim())).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
