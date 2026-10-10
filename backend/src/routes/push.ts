import { pushRegisterLimiter } from "./auth-rate-limits.js";
import { requireAuth } from "../middleware/auth.js";
import { Router } from "express";
import { db } from "../db/index.js";
import { pushTokens } from "../db/schema.js";
import { and, eq } from "drizzle-orm";

const router = Router();

// POST /api/push/register — Tokenni ro'yxatdan o'tkazish / yangilash (upsert)
router.post("/register", requireAuth, pushRegisterLimiter, async (req: any, res: any) => {
  try {
    const user = req.user;
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

// POST /api/push/unregister — Tokenni o'chirish (chiqishda)
router.post("/unregister", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const { token } = req.body || {};
    if (token && typeof token === "string" && user?.id) {
      // Faqat o'ziga tegishli tokenni o'chirishi mumkin
      await db.delete(pushTokens).where(and(eq(pushTokens.token, token.trim()), eq(pushTokens.userId, user.id))).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

router.delete("/unregister", requireAuth, async (req: any, res: any) => {
  try {
    const user = req.user;
    const { token } = req.body || {};
    if (token && typeof token === "string" && user?.id) {
      await db.delete(pushTokens).where(and(eq(pushTokens.token, token.trim()), eq(pushTokens.userId, user.id))).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
