import { Router } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  orders,
  partnerDebts,
  posSales,
  posSaleItems,
  specialistMedicines,
} from "../../db/schema.js";
import { requireTelegramAuth, requireRole } from "../../middleware/auth.js";
import { computeDebtBalance } from "../../lib/partner-erp-logic.js";
import { ensureSamePartner } from "./helpers.js";

const router = Router();

// GET /reports — BiznesGO sodda va aniq hisobot ko'rsatkichlari
router.get(
  "/reports",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const [meds, debtRows, posRows, orderRows] = await Promise.all([
        db
          .select()
          .from(specialistMedicines)
          .where(eq(specialistMedicines.specialistId, spec.id)),
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

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      let todaySalesAmount = 0;
      const completedPosIds: number[] = [];

      for (const s of posRows) {
        if (s.status !== "completed") continue;
        completedPosIds.push(s.id);
        if (s.createdAt >= todayStart) {
          todaySalesAmount += Math.max(0, Number(s.totalAmount) || 0);
        }
      }

      let newOrdersCount = 0;
      for (const o of orderRows) {
        if (o.status === "yangi") newOrdersCount += 1;
        if (o.status === "yetkazildi" && o.createdAt >= todayStart) {
          todaySalesAmount += Math.max(0, Number(o.totalSum) || 0);
        }
      }

      let totalDebtAmount = 0;
      const debtors: Array<{
        id: number;
        customerName: string;
        customerPhone: string | null;
        balance: number;
        dueDate: string | null;
      }> = [];

      for (const d of debtRows) {
        if (d.status === "cancelled" || d.kind === "taminotchi") continue;
        const bal = computeDebtBalance(d.totalAmount, d.paidAmount);
        if (bal > 0) {
          totalDebtAmount += bal;
          debtors.push({
            id: d.id,
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            balance: bal,
            dueDate: d.dueDate ? d.dueDate.toISOString() : null,
          });
        }
      }

      // Eng ko'p sotilgan mahsulotlar
      const topProductsMap = new Map<number, { id: number; name: string; soldQty: number; revenue: number }>();
      if (completedPosIds.length > 0) {
        const items = await db
          .select()
          .from(posSaleItems)
          .where(inArray(posSaleItems.saleId, completedPosIds));

        for (const it of items) {
          const entry = topProductsMap.get(it.medicineId) || {
            id: it.medicineId,
            name: it.medicineName || `Mahsulot #${it.medicineId}`,
            soldQty: 0,
            revenue: 0,
          };
          entry.soldQty += it.quantity;
          entry.revenue += it.totalAmount;
          topProductsMap.set(it.medicineId, entry);
        }
      }

      const topProducts = Array.from(topProductsMap.values())
        .sort((a, b) => b.soldQty - a.soldQty)
        .slice(0, 10);

      const lowStockProducts = meds
        .filter((m) => m.stock <= 5)
        .map((m) => ({
          id: m.id,
          name: m.name,
          stock: m.stock,
          stockUnit: m.stockUnit,
          status: m.status,
        }));

      return res.json({
        ok: true,
        report: {
          todaySalesAmount,
          totalDebtAmount,
          newOrdersCount,
          topProducts,
          debtors,
          lowStockProducts,
        },
      });
    } catch (err) {
      console.error("[biznesgo:reports:get error]:", err);
      return res.status(500).json({ ok: false, error: "Hisobotni yuklashda xatolik yuz berdi" });
    }
  },
);

export default router;

