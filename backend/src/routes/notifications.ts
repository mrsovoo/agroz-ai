import { requireAuth } from "../middleware/auth.js";
import { Router, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { broadcasts, notificationReads } from "../db/schema.js";
import { getUserFromReq } from "../lib/user-auth.js";

const router = Router();

/**
 * GET /api/notifications
 * Barcha bildirishnomalar (Super admin broadcastlari + mavsumiy / tizim xabarlari) ro'yxatini qaytaradi.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req).catch(() => null);

    // 1. Super admin broadcasts
    const broadcastRows = await db
      .select()
      .from(broadcasts)
      .orderBy(desc(broadcasts.createdAt))
      .limit(30)
      .catch(() => []);

    const items: Array<{
      id: string;
      type: "weather" | "crop" | "animal" | "order" | "system";
      severity: "critical" | "warning" | "info" | "success";
      title: string;
      body: string;
      actionUrl?: string | null;
      actionLabel?: string | null;
      createdAt: string;
      timestamp: number;
    }> = [];

    for (const b of broadcastRows) {
      const text = (b.text || "").trim();
      const firstLine = text.split("\n")[0].replace(/^[#*_\s]+/, "").trim();
      const title = firstLine.length >= 4 && firstLine.length <= 80 ? firstLine : "📢 AgrozGO xabarnomasi";
      const body = text;

      let type: "weather" | "crop" | "animal" | "order" | "system" = "system";
      const lower = text.toLowerCase();
      if (lower.includes("shamol") || lower.includes("yomg'ir") || lower.includes("ob-havo") || lower.includes("sovuq") || lower.includes("harorat")) {
        type = "weather";
      } else if (lower.includes("ekin") || lower.includes("hosil") || lower.includes("paxta") || lower.includes("bug'doy") || lower.includes("o'g'it")) {
        type = "crop";
      } else if (lower.includes("chorva") || lower.includes("mol") || lower.includes("veterinar") || lower.includes("emlash")) {
        type = "animal";
      }

      let severity: "critical" | "warning" | "info" | "success" = "info";
      if (lower.includes("xavf") || lower.includes("ogohlantirish") || lower.includes("diqqat")) {
        severity = "warning";
      }

      const createdAtDate = b.createdAt ? new Date(b.createdAt) : new Date();

      items.push({
        id: `broadcast-${b.id}`,
        type,
        severity,
        title,
        body,
        actionUrl: b.buttonUrl || null,
        actionLabel: b.buttonText || null,
        createdAt: createdAtDate.toISOString(),
        timestamp: createdAtDate.getTime(),
      });
    }

    // 2. Barqaror, o'zgarmas sana va vaqtga ega tizim xabarlari
    const baselineItems = [
      {
        id: "weather-wind-alert-12oct",
        type: "weather" as const,
        severity: "warning" as const,
        title: "💨 Kuchli shamol ogohlantirishi (6 m/s)",
        body: "Shamol tezligi yuqori bo'lgani sababli kimyoviy preparatlar purkash tavsiya etilmaydi. Dori shamolda tarqab ketib samarasiz bo'ladi.",
        createdAt: new Date("2026-10-12T14:30:00.000Z").toISOString(),
        timestamp: new Date("2026-10-12T14:30:00.000Z").getTime(),
      },
      {
        id: "season-crop-autumn-11oct",
        type: "crop" as const,
        severity: "info" as const,
        title: "🌾 Kuzgi shudgor va mevali bog'larni parvarishlash",
        body: "Hosil yig'ishtirilgach, daraxt tanalarini oqlash, quruq shoxlarni kesish va tuproqqa fosforli-kaliyli o'g'it solish lozim.",
        actionUrl: "/medicines",
        actionLabel: "Dorilar katalogi",
        createdAt: new Date("2026-10-11T10:15:00.000Z").toISOString(),
        timestamp: new Date("2026-10-11T10:15:00.000Z").getTime(),
      },
      {
        id: "season-animal-autumn-10oct",
        type: "animal" as const,
        severity: "info" as const,
        title: "🐄 Chorva mollarni sovuqqa tayyorlash va profilaktik emlash",
        body: "Kuzda havo harorati o'zgarishi sababli qoramol va qo'ylarda nafas yo'li kasalliklari ko'payadi. Molxona tirqishlarini yopib, quruq to'shama soling.",
        actionUrl: "/specialists",
        actionLabel: "Veterinarlar",
        createdAt: new Date("2026-10-10T16:45:00.000Z").toISOString(),
        timestamp: new Date("2026-10-10T16:45:00.000Z").getTime(),
      },
      {
        id: "system-status-welcome-08oct",
        type: "system" as const,
        severity: "info" as const,
        title: "📱 AgrozGO xizmatlari faol",
        body: "Dorilar yetkazib berish, veterinarlar va agronomlar chaqiruvi hamda sun'iy intellekt agro-tashxisi 24/7 ishlamoqda.",
        createdAt: new Date("2026-10-08T09:00:00.000Z").toISOString(),
        timestamp: new Date("2026-10-08T09:00:00.000Z").getTime(),
      },
    ];

    const combined = [...items, ...baselineItems].sort((a, b) => b.timestamp - a.timestamp);

    let readIds: string[] = [];
    if (user) {
      const readRows = await db
        .select({ notificationKey: notificationReads.notificationKey })
        .from(notificationReads)
        .where(eq(notificationReads.userId, user.id))
        .catch(() => []);
      readIds = readRows.map((r) => r.notificationKey);
    }

    return res.json({
      ok: true,
      notifications: combined,
      readIds,
    });
  } catch (err: any) {
    console.error("[GET /api/notifications error]:", err);
    return res.status(500).json({ ok: false, error: "Bildirishnomalarni olishda xatolik" });
  }
});

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
