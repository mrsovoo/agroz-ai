import { Router } from "express";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { partnerDebts, partnerDebtPayments } from "../../db/schema.js";
import { requireTelegramAuth, requireRole } from "../../middleware/auth.js";
import {
  computeDebtBalance,
  computeDebtStatus,
  normalizeDebtPaymentMethod,
} from "../../lib/partner-erp-logic.js";
import { cleanStr, ensureSamePartner, serializeDebt } from "./helpers.js";

const router = Router();

// GET /debts — Sotuvchining qarzlar ro'yxati va to'lovlar tarixi
router.get(
  "/debts",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const rows = await db
        .select()
        .from(partnerDebts)
        .where(eq(partnerDebts.partnerId, spec.id))
        .orderBy(desc(partnerDebts.updatedAt), desc(partnerDebts.id));

      const activeRows =
        req.query?.includeCancelled === "true"
          ? rows
          : rows.filter((r) => r.status !== "cancelled");

      const debtIds = activeRows.map((r) => r.id);
      const paymentsByDebt = new Map<number, Array<typeof partnerDebtPayments.$inferSelect>>();

      if (debtIds.length > 0) {
        const paymentRows = await db
          .select()
          .from(partnerDebtPayments)
          .where(inArray(partnerDebtPayments.debtId, debtIds))
          .orderBy(desc(partnerDebtPayments.createdAt), desc(partnerDebtPayments.id));

        for (const p of paymentRows) {
          const list = paymentsByDebt.get(p.debtId) || [];
          list.push(p);
          paymentsByDebt.set(p.debtId, list);
        }
      }

      const debts = activeRows.map((r) => serializeDebt(r, paymentsByDebt.get(r.id) || []));
      return res.json({ ok: true, debts });
    } catch (err) {
      console.error("[biznesgo:debts:get error]:", err);
      return res.status(500).json({ ok: false, error: "Qarzlar ro'yxatini yuklashda server xatosi yuz berdi" });
    }
  },
);

// POST /debts — Yangi qarz yozuvi yaratish
router.post(
  "/debts",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const {
        customerName,
        customerPhone,
        customerAddress,
        kind,
        creditLimit,
        description,
        totalAmount,
        paidAmount = 0,
        dueDate,
      } = req.body ?? {};

      const cleanName = cleanStr(customerName, 160);
      if (!cleanName) {
        return res.status(400).json({ ok: false, error: "Mijoz yoki ta'minotchi ismini kiriting" });
      }

      const parsedTotal = Math.floor(Number(totalAmount));
      if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({ ok: false, error: "Qarz summasi 0 dan katta bo'lishi shart" });
      }

      const parsedPaid = Math.max(0, Math.floor(Number(paidAmount) || 0));
      if (parsedPaid > parsedTotal) {
        return res.status(400).json({ ok: false, error: "Boshlang'ich to'lov qarz summasidan ko'p bo'lishi mumkin emas" });
      }

      const parsedLimit = Math.max(0, Math.floor(Number(creditLimit) || 5000000));
      const cleanKind = kind === "taminotchi" ? "taminotchi" : "mijoz";
      const parsedDueDate = dueDate ? new Date(dueDate) : null;
      const status = computeDebtStatus(parsedTotal, parsedPaid);

      const [inserted] = await db
        .insert(partnerDebts)
        .values({
          partnerId: spec.id,
          customerName: cleanName,
          customerPhone: cleanStr(customerPhone, 32) || null,
          customerAddress: cleanStr(customerAddress, 300) || null,
          kind: cleanKind,
          creditLimit: parsedLimit,
          description: cleanStr(description, 500) || null,
          totalAmount: parsedTotal,
          paidAmount: parsedPaid,
          dueDate: parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate : null,
          status,
        })
        .returning();

      const payments: Array<typeof partnerDebtPayments.$inferSelect> = [];
      if (parsedPaid > 0) {
        const [initialPayment] = await db
          .insert(partnerDebtPayments)
          .values({
            debtId: inserted.id,
            amount: parsedPaid,
            paymentMethod: "cash",
            note: "Boshlang'ich to'lov",
          })
          .returning();
        if (initialPayment) payments.push(initialPayment);
      }

      return res.status(201).json({
        ok: true,
        debt: serializeDebt(inserted, payments),
      });
    } catch (err) {
      console.error("[biznesgo:debts:post error]:", err);
      return res.status(500).json({ ok: false, error: "Qarz yozuvini saqlashda server xatosi yuz berdi" });
    }
  },
);

// POST /debts/:id/payments — Qarzga to'lov (qisman yoki to'liq) qo'shish
router.post(
  "/debts/:id/payments",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const debtId = Number(req.params.id);
      if (!Number.isInteger(debtId) || debtId <= 0) {
        return res.status(400).json({ ok: false, error: "Qarz ID raqami noto'g'ri" });
      }

      const [debt] = await db
        .select()
        .from(partnerDebts)
        .where(eq(partnerDebts.id, debtId))
        .limit(1);

      if (!debt) {
        return res.status(404).json({ ok: false, error: "Qarz yozuvi topilmadi" });
      }

      if (debt.partnerId !== spec.id) {
        return res.status(403).json({
          ok: false,
          error: "Bu qarz yozuviga ruxsatingiz yo'q",
        });
      }

      if (debt.status === "cancelled") {
        return res.status(400).json({ ok: false, error: "Bekor qilingan qarzga to'lov qabul qilinmaydi" });
      }

      const currentBalance = computeDebtBalance(debt.totalAmount, debt.paidAmount);
      if (currentBalance <= 0) {
        return res.status(400).json({ ok: false, error: "Ushbu qarz allaqachon to'liq yopilgan" });
      }

      const rawAmount = Number(req.body?.amount);
      if (!Number.isFinite(rawAmount) || Math.floor(rawAmount) <= 0) {
        return res.status(400).json({ ok: false, error: "To'lov summasi 0 dan katta bo'lishi shart" });
      }

      const payAmount = Math.min(Math.floor(rawAmount), currentBalance);
      const paymentMethod = normalizeDebtPaymentMethod(req.body?.paymentMethod);
      const note = cleanStr(req.body?.note, 300) || null;

      await db.insert(partnerDebtPayments).values({
        debtId: debt.id,
        amount: payAmount,
        paymentMethod,
        note,
      });

      const nextPaid = debt.paidAmount + payAmount;
      const nextStatus = computeDebtStatus(debt.totalAmount, nextPaid);

      const [updatedDebt] = await db
        .update(partnerDebts)
        .set({
          paidAmount: nextPaid,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(partnerDebts.id, debt.id))
        .returning();

      const allPayments = await db
        .select()
        .from(partnerDebtPayments)
        .where(eq(partnerDebtPayments.debtId, debt.id))
        .orderBy(desc(partnerDebtPayments.createdAt), desc(partnerDebtPayments.id));

      return res.json({
        ok: true,
        debt: serializeDebt(updatedDebt, allPayments),
      });
    } catch (err) {
      console.error("[biznesgo:debts:payment error]:", err);
      return res.status(500).json({ ok: false, error: "To'lovni saqlashda server xatosi yuz berdi" });
    }
  },
);

// PATCH /debts/:id — Qarz yozuvini tahrirlash, to'liq yopish yoki bekor qilish
router.patch(
  "/debts/:id",
  requireTelegramAuth("business"),
  requireRole(["specialist", "pharmacy"]),
  async (req: any, res: any) => {
    try {
      const spec = ensureSamePartner(req, res);
      if (!spec) return;

      const debtId = Number(req.params.id);
      if (!Number.isInteger(debtId) || debtId <= 0) {
        return res.status(400).json({ ok: false, error: "Qarz ID raqami noto'g'ri" });
      }

      const [debt] = await db
        .select()
        .from(partnerDebts)
        .where(eq(partnerDebts.id, debtId))
        .limit(1);

      if (!debt) {
        return res.status(404).json({ ok: false, error: "Qarz yozuvi topilmadi" });
      }

      if (debt.partnerId !== spec.id) {
        return res.status(403).json({
          ok: false,
          error: "Bu qarz yozuviga ruxsatingiz yo'q",
        });
      }

      const {
        customerName,
        customerPhone,
        customerAddress,
        description,
        creditLimit,
        totalAmount,
        paidAmount,
        addAmount,
        dueDate,
        status,
      } = req.body ?? {};

      let nextTotal = debt.totalAmount;
      let nextPaid = debt.paidAmount;

      if (addAmount !== undefined) {
        const extra = Math.floor(Number(addAmount));
        if (!Number.isFinite(extra) || extra <= 0) {
          return res.status(400).json({ ok: false, error: "Qo'shimcha nasiya summasi 0 dan katta bo'lishi kerak" });
        }
        nextTotal += extra;
      } else if (totalAmount !== undefined) {
        const parsedTotal = Math.floor(Number(totalAmount));
        if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
          return res.status(400).json({ ok: false, error: "Umumiy qarz summasi noto'g'ri" });
        }
        nextTotal = parsedTotal;
      }

      if (paidAmount !== undefined) {
        const parsedPaid = Math.floor(Number(paidAmount));
        if (!Number.isFinite(parsedPaid) || parsedPaid < 0 || parsedPaid > nextTotal) {
          return res.status(400).json({ ok: false, error: "To'langan summa noto'g'ri" });
        }
        nextPaid = parsedPaid;
      }

      let nextStatus = computeDebtStatus(nextTotal, nextPaid, debt.status);
      if (status !== undefined) {
        if (!["open", "partial", "paid", "cancelled"].includes(status)) {
          return res.status(400).json({ ok: false, error: "Qarz statusi noto'g'ri" });
        }
        if (status === "cancelled") {
          nextStatus = "cancelled";
        } else if (status === "paid") {
          nextPaid = nextTotal;
          nextStatus = "paid";
        } else {
          nextStatus = computeDebtStatus(nextTotal, nextPaid);
        }
      }

      const updates: Record<string, any> = {
        totalAmount: nextTotal,
        paidAmount: nextPaid,
        status: nextStatus,
        updatedAt: new Date(),
      };

      if (customerName !== undefined) {
        const cleanN = cleanStr(customerName, 160);
        if (!cleanN) {
          return res.status(400).json({ ok: false, error: "Mijoz ismi bo'sh bo'lishi mumkin emas" });
        }
        updates.customerName = cleanN;
      }
      if (customerPhone !== undefined) updates.customerPhone = cleanStr(customerPhone, 32) || null;
      if (customerAddress !== undefined) updates.customerAddress = cleanStr(customerAddress, 300) || null;
      if (description !== undefined) updates.description = cleanStr(description, 500) || null;
      if (creditLimit !== undefined) {
        updates.creditLimit = Math.max(0, Math.floor(Number(creditLimit) || 0));
      }
      if (dueDate !== undefined) {
        updates.dueDate = dueDate ? new Date(dueDate) : null;
      }

      const [updated] = await db
        .update(partnerDebts)
        .set(updates)
        .where(eq(partnerDebts.id, debt.id))
        .returning();

      const allPayments = await db
        .select()
        .from(partnerDebtPayments)
        .where(eq(partnerDebtPayments.debtId, debt.id))
        .orderBy(desc(partnerDebtPayments.createdAt), desc(partnerDebtPayments.id));

      return res.json({
        ok: true,
        debt: serializeDebt(updated, allPayments),
      });
    } catch (err) {
      console.error("[biznesgo:debts:patch error]:", err);
      return res.status(500).json({ ok: false, error: "Qarz yozuvini yangilashda server xatosi yuz berdi" });
    }
  },
);

export default router;

