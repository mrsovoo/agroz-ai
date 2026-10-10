import { requireAuth } from "../middleware/auth";
import { Router, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notificationReads } from "../db/schema.js";
import { getUserFromReq } from "../lib/user-auth.js";

const router = Router();

/**
 * GET /api/notifications/read-status
 * Joriy foydalanuvchining o'qilgan bildirishnoma kalitlari ro'yxatini qaytaradi.
 */
router.get("/read-status", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.json({ ok: true, readIds: [] });
    }

    const rows = await db
      .select({ notificationKey: notificationReads.notificationKey })
      .from(notificationReads)
      .where(eq(notificationReads.userId, user.id));

    return res.json({
      ok: true,
      readIds: rows.map((r) => r.notificationKey),
    });
  } catch (err: any) {
    console.error("[GET /api/notifications/read-status error]:", err);
    return res.status(500).json({ ok: false, error: "Bildirishnoma holatini olishda xatolik" });
  }
});

/**
 * POST /api/notifications/:id/read
 * Bitta (yoki body.ids orqali bir nechta) bildirishnomani joriy foydalanuvchi uchun o'qilgan deb belgilaydi.
 */
router.post("/:id/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Avval tizimga kiring." });
    }

    const paramId = decodeURIComponent(String(req.params.id || "")).trim();
    const bodyIds: string[] = Array.isArray(req.body?.ids)
      ? req.body.ids.map((x: unknown) => String(x || "").trim()).filter(Boolean)
      : [];

    const keysToMark: string[] = paramId && paramId !== "batch" ? [paramId, ...bodyIds] : bodyIds;
    const uniqueKeys: string[] = Array.from(new Set(keysToMark)).filter((k) => k.length > 0 && k.length <= 160);

    if (uniqueKeys.length === 0) {
      return res.status(400).json({ ok: false, error: "Bildirishnoma ID ko'rsatilmadi." });
    }

    for (const key of uniqueKeys) {
      const existing = await db
        .select({ id: notificationReads.id })
        .from(notificationReads)
        .where(
          and(
            eq(notificationReads.userId, user.id),
            eq(notificationReads.notificationKey, key)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(notificationReads).values({
          userId: user.id,
          notificationKey: key,
          readAt: new Date(),
        });
      }
    }

    return res.json({ ok: true, marked: uniqueKeys });
  } catch (err: any) {
    console.error("[POST /api/notifications/:id/read error]:", err);
    return res.status(500).json({ ok: false, error: "Bildirishnoma holatini saqlashda xatolik" });
  }
});

export default router;
