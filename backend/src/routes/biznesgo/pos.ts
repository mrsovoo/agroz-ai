import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  partnerDebts,
  posSales,
  posSaleItems,
  specialistMedicines,
} from "../../db/schema.js";
import { requireTelegramAuth, requireRole } from "../../middleware/auth.js";
import {
  computeMedicineStatusAfterStockChange,
  normalizePosPaymentType,
} from "../../lib/partner-erp-logic.js";
import { cleanStr, ensureSamePartner, serializeDebt } from "./helpers.js";

const router = Router();

// GET /pos-sales (va /pos) — POS sotuvlar tarixi
router.get(
  ["/pos-sales", "/pos"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const salesRows = await db
        .select()
        .from(posSales)
        .where(eq(posSales.partnerId, spec.id))
        .orderBy(desc(posSales.id))
        .limit(100);

      const saleIds = salesRows.map((s) => s.id);
      const itemsBySale = new Map<number, Array<typeof posSaleItems.$inferSelect>>();

      if (saleIds.length > 0) {
        const itemRows = await db
          .select()
          .from(posSaleItems)
          .where(inArray(posSaleItems.saleId, saleIds));

        for (const it of itemRows) {
          const list = itemsBySale.get(it.saleId) || [];
          list.push(it);
          itemsBySale.set(it.saleId, list);
        }
      }

      const sales = salesRows.map((s) => ({
        id: s.id,
        partnerId: s.partnerId,
        customerName: s.customerName,
        customerPhone: s.customerPhone,
        totalAmount: s.totalAmount,
        discount: s.discount,
        paymentType: s.paymentType as "cash" | "card" | "credit",
        status: s.status as "completed" | "cancelled",
        debtId: s.debtId,
        createdAt: s.createdAt.toISOString(),
        items: (itemsBySale.get(s.id) || []).map((it) => ({
          id: it.id,
          saleId: it.saleId,
          medicineId: it.medicineId,
          name: it.medicineName || `Mahsulot #${it.medicineId}`,
          qty: it.quantity,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          price: it.unitPrice,
          totalAmount: it.totalAmount,
        })),
      }));

      return res.json({ ok: true, sales });
    } catch (err) {
      console.error("[biznesgo:pos:get error]:", err);
      return res.status(500).json({ ok: false, error: "POS sotuvlar tarixini yuklashda xatolik yuz berdi" });
    }
  },
);

// POST /pos-sales (va /pos) — Yangi POS sotuv yaratish
router.post(
  ["/pos-sales", "/pos"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const {
        customerName,
        customerPhone,
        discount = 0,
        paymentType: rawPaymentType,
        items: rawItems,
        medicineId: singleMedId,
        quantity: singleQty,
      } = req.body ?? {};

      const paymentType = normalizePosPaymentType(rawPaymentType);
      if (!paymentType) {
        return res.status(400).json({
          ok: false,
          error: "To'lov turi noto'g'ri (cash, card yoki credit bo'lishi kerak)",
        });
      }

      const normalizedItems: Array<{ medicineId: number; quantity: number; unitPrice?: number }> =
        Array.isArray(rawItems) && rawItems.length > 0
          ? rawItems
          : singleMedId
          ? [{ medicineId: Number(singleMedId), quantity: Number(singleQty) || 1 }]
          : [];

      if (normalizedItems.length === 0) {
        return res.status(400).json({ ok: false, error: "Sotilayotgan mahsulot tanlanishi shart" });
      }

      const cleanCustomerName = cleanStr(customerName, 160);
      if (paymentType === "credit" && !cleanCustomerName) {
        return res.status(400).json({
          ok: false,
          error: "Nasiya (kredit) sotuv uchun mijoz ismini kiritish shart",
        });
      }

      const parsedDiscount = Math.max(0, Math.floor(Number(discount) || 0));

      const medIds = Array.from(new Set(normalizedItems.map((i) => Number(i.medicineId))));
      if (medIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        return res.status(400).json({ ok: false, error: "Mahsulot ID raqami noto'g'ri" });
      }

      const dbMeds = await db
        .select()
        .from(specialistMedicines)
        .where(inArray(specialistMedicines.id, medIds));

      const medMap = new Map(dbMeds.map((m) => [m.id, m]));

      for (const item of normalizedItems) {
        const med = medMap.get(Number(item.medicineId));
        if (!med) {
          return res.status(404).json({ ok: false, error: "Tanlangan mahsulot omborda topilmadi" });
        }
        if (med.specialistId !== spec.id) {
          return res.status(403).json({
            ok: false,
            error: "Boshqa hamkorga tegishli mahsulotni sotish taqiqlangan",
          });
        }
        const qty = Math.floor(Number(item.quantity));
        if (!Number.isFinite(qty) || qty <= 0) {
          return res.status(400).json({ ok: false, error: "Mahsulot miqdori kamida 1 bo'lishi shart" });
        }
        if (med.stock < qty) {
          return res.status(400).json({
            ok: false,
            error: `Omborda yetarli qoldiq yo'q: ${med.name} (mavjud: ${med.stock} ${med.stockUnit})`,
          });
        }
      }

      let subtotal = 0;
      const preparedItems: Array<{
        medicineId: number;
        medicineName: string;
        stockUnit: string;
        quantity: number;
        unitPrice: number;
        totalAmount: number;
      }> = [];
      const updatedMedicines: Array<typeof specialistMedicines.$inferSelect> = [];

      for (const item of normalizedItems) {
        const med = medMap.get(Number(item.medicineId))!;
        const qty = Math.floor(Number(item.quantity));
        const unitPrice =
          item.unitPrice !== undefined && Number(item.unitPrice) >= 0
            ? Math.floor(Number(item.unitPrice))
            : Math.max(0, Number(med.price) || 0);
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;

        const nextStock = Math.max(0, med.stock - qty);
        const nextStatus = computeMedicineStatusAfterStockChange(nextStock, med.status);

        const [updatedMed] = await db
          .update(specialistMedicines)
          .set({
            stock: nextStock,
            status: nextStatus,
            updatedAt: new Date(),
          })
          .where(eq(specialistMedicines.id, med.id))
          .returning();

        med.stock = nextStock;
        med.status = nextStatus;
        if (updatedMed) updatedMedicines.push(updatedMed);

        preparedItems.push({
          medicineId: med.id,
          medicineName: med.name,
          stockUnit: med.stockUnit,
          quantity: qty,
          unitPrice,
          totalAmount: lineTotal,
        });
      }

      const finalTotal = Math.max(0, subtotal - parsedDiscount);
      const finalCustomerName = cleanCustomerName || "Do'kon mijozi (Kassa)";
      const finalCustomerPhone = cleanStr(customerPhone, 32) || null;

      let createdDebt: ReturnType<typeof serializeDebt> | null = null;
      let linkedDebtId: number | null = null;

      if (paymentType === "credit" && finalTotal > 0) {
        const itemsDescription = preparedItems
          .map((i) => `${i.medicineName} (${i.quantity} ${i.stockUnit})`)
          .join(", ");

        const [debtRow] = await db
          .insert(partnerDebts)
          .values({
            partnerId: spec.id,
            customerName: finalCustomerName,
            customerPhone: finalCustomerPhone,
            kind: "mijoz",
            creditLimit: 5000000,
            description: `POS Nasiya: ${itemsDescription}`,
            totalAmount: finalTotal,
            paidAmount: 0,
            status: "open",
          })
          .returning();

        linkedDebtId = debtRow.id;
        createdDebt = serializeDebt(debtRow, []);
      }

      const [saleRow] = await db
        .insert(posSales)
        .values({
          partnerId: spec.id,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          totalAmount: finalTotal,
          discount: parsedDiscount,
          paymentType,
          status: "completed",
          debtId: linkedDebtId,
        })
        .returning();

      const insertedItems = await db
        .insert(posSaleItems)
        .values(
          preparedItems.map((it) => ({
            saleId: saleRow.id,
            medicineId: it.medicineId,
            medicineName: it.medicineName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalAmount: it.totalAmount,
          })),
        )
        .returning();

      return res.status(201).json({
        ok: true,
        sale: {
          id: saleRow.id,
          partnerId: saleRow.partnerId,
          customerName: saleRow.customerName,
          customerPhone: saleRow.customerPhone,
          totalAmount: saleRow.totalAmount,
          discount: saleRow.discount,
          paymentType: saleRow.paymentType,
          status: saleRow.status,
          debtId: saleRow.debtId,
          createdAt: saleRow.createdAt.toISOString(),
          items: insertedItems.map((it) => ({
            id: it.id,
            saleId: it.saleId,
            medicineId: it.medicineId,
            name: it.medicineName || `Mahsulot #${it.medicineId}`,
            qty: it.quantity,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            price: it.unitPrice,
            totalAmount: it.totalAmount,
          })),
        },
        debt: createdDebt,
        updatedMedicines,
      });
    } catch (err) {
      console.error("[biznesgo:pos:post error]:", err);
      return res.status(500).json({ ok: false, error: "POS sotuvni saqlashda server xatosi yuz berdi" });
    }
  },
);

// PATCH /pos-sales/:id (va /pos/:id) — POS sotuvni bekor qilish va qoldiqni qaytarish
router.patch(
  ["/pos-sales/:id", "/pos/:id"],
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const saleId = Number(req.params.id);
      if (!Number.isInteger(saleId) || saleId <= 0) {
        return res.status(400).json({ ok: false, error: "Sotuv ID raqami noto'g'ri" });
      }

      const [sale] = await db
        .select()
        .from(posSales)
        .where(eq(posSales.id, saleId))
        .limit(1);

      if (!sale) {
        return res.status(404).json({ ok: false, error: "Sotuv topilmadi" });
      }

      if (sale.partnerId !== spec.id) {
        return res.status(403).json({
          ok: false,
          error: "Boshqa hamkorga tegishli sotuvni o'zgartirish taqiqlangan",
        });
      }

      const requestedStatus = req.body?.status;
      if (requestedStatus !== "cancelled") {
        return res.status(400).json({ ok: false, error: "Faqat 'cancelled' holatiga o'tkazish mumkin" });
      }

      if (sale.status === "cancelled") {
        return res.status(400).json({ ok: false, error: "Ushbu sotuv allaqachon bekor qilingan" });
      }

      const saleItems = await db
        .select()
        .from(posSaleItems)
        .where(eq(posSaleItems.saleId, sale.id));

      const restoredMedicines: Array<typeof specialistMedicines.$inferSelect> = [];
      for (const item of saleItems) {
        const [med] = await db
          .select()
          .from(specialistMedicines)
          .where(eq(specialistMedicines.id, item.medicineId))
          .limit(1);

        if (med && med.specialistId === spec.id) {
          const restoredStock = Math.max(0, med.stock + item.quantity);
          const nextStatus = computeMedicineStatusAfterStockChange(restoredStock, med.status);
          const [updatedMed] = await db
            .update(specialistMedicines)
            .set({
              stock: restoredStock,
              status: nextStatus,
              updatedAt: new Date(),
            })
            .where(eq(specialistMedicines.id, med.id))
            .returning();
          if (updatedMed) restoredMedicines.push(updatedMed);
        }
      }

      const [updatedSale] = await db
        .update(posSales)
        .set({ status: "cancelled" })
        .where(eq(posSales.id, sale.id))
        .returning();

      if (sale.debtId) {
        await db
          .update(partnerDebts)
          .set({ status: "cancelled", updatedAt: new Date() })
          .where(and(eq(partnerDebts.id, sale.debtId), eq(partnerDebts.partnerId, spec.id)));
      }

      return res.json({
        ok: true,
        sale: updatedSale,
        restoredMedicines,
        updatedMedicines: restoredMedicines,
      });
    } catch (err) {
      console.error("[biznesgo:pos:patch error]:", err);
      return res.status(500).json({ ok: false, error: "Sotuvni bekor qilishda server xatosi yuz berdi" });
    }
  },
);

export default router;

