import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { partnerDebts, posSales, orders } from "../../db/schema.js";
import { requireTelegramAuth, requireRole } from "../../middleware/auth.js";
import { computeDebtBalance } from "../../lib/partner-erp-logic.js";
import { ensureSamePartner } from "./helpers.js";

const router = Router();

// GET /customers — Sotuvchining mijozlar bazasi (POS, buyurtmalar va qarz daftaridan jamlangan)
router.get(
  "/customers",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const [debtRows, posRows, orderRows] = await Promise.all([
        db
          .select()
          .from(partnerDebts)
          .where(eq(partnerDebts.partnerId, spec.id))
          .orderBy(desc(partnerDebts.updatedAt)),
        db
          .select()
          .from(posSales)
          .where(eq(posSales.partnerId, spec.id))
          .orderBy(desc(posSales.createdAt)),
        db
          .select()
          .from(orders)
          .where(eq(orders.pharmacySpecialistId, spec.id))
          .orderBy(desc(orders.createdAt)),
      ]);

      const customerMap = new Map<
        string,
        {
          key: string;
          name: string;
          phone: string;
          address: string;
          debtBalance: number;
          totalPurchases: number;
          ordersCount: number;
          lastActivityAt: string;
        }
      >();

      const makeKey = (name?: string | null, phone?: string | null) => {
        const cleanDigits = String(phone || "").replace(/\D/g, "").slice(-9);
        if (cleanDigits.length === 9) return `p:${cleanDigits}`;
        return `n:${String(name || "Mijoz").trim().toLowerCase()}`;
      };

      for (const d of debtRows) {
        if (d.status === "cancelled" || d.kind === "taminotchi") continue;
        const key = makeKey(d.customerName, d.customerPhone);
        const bal = computeDebtBalance(d.totalAmount, d.paidAmount);
        const existing = customerMap.get(key) || {
          key,
          name: d.customerName,
          phone: d.customerPhone || "",
          address: d.customerAddress || "",
          debtBalance: 0,
          totalPurchases: 0,
          ordersCount: 0,
          lastActivityAt: d.updatedAt.toISOString(),
        };
        existing.debtBalance += bal;
        if (!existing.address && d.customerAddress) existing.address = d.customerAddress;
        customerMap.set(key, existing);
      }

      for (const s of posRows) {
        if (s.status === "cancelled") continue;
        const key = makeKey(s.customerName, s.customerPhone);
        const existing = customerMap.get(key) || {
          key,
          name: s.customerName || "Do'kon mijozi (Kassa)",
          phone: s.customerPhone || "",
          address: "",
          debtBalance: 0,
          totalPurchases: 0,
          ordersCount: 0,
          lastActivityAt: s.createdAt.toISOString(),
        };
        existing.totalPurchases += Math.max(0, Number(s.totalAmount) || 0);
        existing.ordersCount += 1;
        customerMap.set(key, existing);
      }

      for (const o of orderRows) {
        if (o.status === "bekor" || o.status === "bekor_qilindi") continue;
        const key = makeKey(o.customerName, o.customerPhone);
        const existing = customerMap.get(key) || {
          key,
          name: o.customerName || "Mijoz",
          phone: o.customerPhone || "",
          address: o.customerAddress || "",
          debtBalance: 0,
          totalPurchases: 0,
          ordersCount: 0,
          lastActivityAt: o.createdAt.toISOString(),
        };
        if (o.status === "yetkazildi") {
          existing.totalPurchases += Math.max(0, Number(o.totalSum) || 0);
        }
        existing.ordersCount += 1;
        if (!existing.address && o.customerAddress) existing.address = o.customerAddress;
        customerMap.set(key, existing);
      }

      return res.json({
        ok: true,
        customers: Array.from(customerMap.values()),
      });
    } catch (err) {
      console.error("[biznesgo:customers:get error]:", err);
      return res.status(500).json({ ok: false, error: "Mijozlar bazasini yuklashda xatolik yuz berdi" });
    }
  },
);

export default router;

