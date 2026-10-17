import { Router } from "express";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders, orderItems, specialistCalls, specialists, users } from "../../db/schema.js";
import { requireTelegramAuth, requireRole } from "../../middleware/auth.js";
import { ensureSamePartner } from "./helpers.js";

const router = Router();

// GET /orders — AgrozGO'dan kelgan buyurtmalar ro'yxati
router.get(
  "/orders",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const rows = await db
        .select()
        .from(orders)
        .where(eq(orders.pharmacySpecialistId, spec.id))
        .orderBy(desc(orders.id))
        .limit(50);

      const items = await db.select().from(orderItems);
      const itemsMap = new Map<number, any[]>();
      for (const it of items) {
        const arr = itemsMap.get(it.orderId) || [];
        arr.push(it);
        itemsMap.set(it.orderId, arr);
      }

      const orderUserIds = Array.from(new Set(rows.map((r) => r.userId).filter(Boolean))) as number[];
      const orderUsersMap = new Map<number, string>();
      if (orderUserIds.length > 0) {
        const dbUsers = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(or(...orderUserIds.map((uid) => eq(users.id, uid))));
        for (const u of dbUsers) {
          if (u.name) orderUsersMap.set(u.id, u.name.trim());
        }
      }

      const enriched = rows.map((r) => {
        const registeredName = (r.userId && orderUsersMap.get(r.userId)) || r.customerName;
        return {
          ...r,
          customerName: registeredName,
          items: itemsMap.get(r.id) || [],
          customerPhone: r.customerPhone,
        };
      });

      return res.json({ ok: true, orders: enriched });
    } catch (err) {
      console.error("[biznesgo:orders:get error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

// POST /orders/:id/action — Buyurtma holatini o'zgartirish (confirm | cancel | ready | done)
router.post(
  "/orders/:id/action",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const orderId = Number(req.params.id);
      const { action } = req.body || {};

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order || order.pharmacySpecialistId !== spec.id) {
        return res.status(403).json({
          ok: false,
          error: "Ushbu bron sizning do'koningizga tegishli emas",
        });
      }

      let nextStatus: string | null = null;
      if (action === "confirm" && order.status === "yangi") nextStatus = "tasdiqlandi";
      if (action === "cancel" && (order.status === "yangi" || order.status === "tasdiqlandi")) nextStatus = "bekor";
      if (action === "ready" && order.status === "tasdiqlandi") nextStatus = "tayyor";
      if (action === "done" && (order.status === "tayyor" || order.status === "tasdiqlandi")) nextStatus = "yetkazildi";

      if (nextStatus) {
        await db.update(orders).set({ status: nextStatus }).where(eq(orders.id, orderId));
      }

      return res.json({ ok: true, status: nextStatus || order.status });
    } catch (err) {
      console.error("[biznesgo:orders:action error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

// GET /calls — Mutaxassis chaqiruvlari
router.get(
  "/calls",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res, false);
      if (!spec) return;
      if (spec.role !== "specialist" && spec.role !== "both") {
        return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });
      }

      const rows = await db
        .select()
        .from(specialistCalls)
        .where(eq(specialistCalls.specialistId, spec.id))
        .orderBy(desc(specialistCalls.id))
        .limit(50);

      const phoneSuffixes = Array.from(
        new Set(
          rows
            .map((r) => (r.customerPhone ? r.customerPhone.replace(/\D/g, "").slice(-9) : ""))
            .filter((s) => s.length === 9),
        ),
      );

      const userMap = new Map<string, string>();
      if (phoneSuffixes.length > 0) {
        const orConditions = phoneSuffixes.map(
          (sfx) => sql`RIGHT(REGEXP_REPLACE(${users.phone}, '\\D', '', 'g'), 9) = ${sfx}`,
        );
        const matchedUsers = await db
          .select({ phone: users.phone, name: users.name })
          .from(users)
          .where(or(...orConditions));

        for (const u of matchedUsers) {
          if (u.phone && u.name) {
            const sfx = u.phone.replace(/\D/g, "").slice(-9);
            userMap.set(sfx, u.name.trim());
          }
        }
      }

      const enriched = rows.map((c) => {
        const sfx = c.customerPhone ? c.customerPhone.replace(/\D/g, "").slice(-9) : "";
        const registeredName = sfx && userMap.get(sfx) ? userMap.get(sfx)! : c.customerName;
        return {
          ...c,
          customerName: registeredName,
          customerPhone: c.customerPhone,
        };
      });

      return res.json({ ok: true, calls: enriched });
    } catch (err) {
      console.error("[biznesgo:calls:get error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

// POST /calls/:id/action — Mutaxassis chaqiruv holatini o'zgartirish
router.post(
  "/calls/:id/action",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res, false);
      if (!spec) return;

      const callId = Number(req.params.id);
      const { action } = req.body || {};

      const [call] = await db
        .select()
        .from(specialistCalls)
        .where(eq(specialistCalls.id, callId))
        .limit(1);

      if (!call || call.specialistId !== spec.id) {
        return res.status(403).json({ ok: false, error: "Chaqiruv sizga tegishli emas" });
      }

      let nextStatus: string | null = null;
      if (action === "accept" && call.status === "yangi") nextStatus = "qabul_qilindi";
      if (action === "reject" && call.status === "yangi") nextStatus = "bekor";
      if (action === "done" && call.status === "qabul_qilindi") nextStatus = "bajarildi";

      if (nextStatus) {
        await db
          .update(specialistCalls)
          .set({ status: nextStatus, updatedAt: new Date() })
          .where(eq(specialistCalls.id, callId));

        if (nextStatus === "qabul_qilindi") {
          await db.update(specialists).set({ isBusy: true }).where(eq(specialists.id, spec.id));
        } else if (nextStatus === "bajarildi" || nextStatus === "bekor") {
          const remaining = await db
            .select({ id: specialistCalls.id })
            .from(specialistCalls)
            .where(
              and(
                eq(specialistCalls.specialistId, spec.id),
                eq(specialistCalls.status, "qabul_qilindi"),
                ne(specialistCalls.id, callId),
              ),
            )
            .limit(1);
          if (remaining.length === 0) {
            await db.update(specialists).set({ isBusy: false }).where(eq(specialists.id, spec.id));
          }
        }
      }

      return res.json({ ok: true, status: nextStatus || call.status });
    } catch (err) {
      console.error("[biznesgo:calls:action error]:", err);
      return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
    }
  },
);

export default router;

