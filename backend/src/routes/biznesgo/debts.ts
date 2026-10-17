import { Router } from "express";
import { and, desc, eq, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  biznesgoCustomers,
  biznesgoDebts,
  biznesgoDebtPayments,
} from "../../db/schema.js";
import { requireBiznesGoMerchant, type BiznesGoRequest } from "./middleware.js";
import {
  computeDebtBalance,
  computeDebtStatus,
  normalizeDebtPaymentMethod,
} from "../../lib/partner-erp-logic.js";

const router = Router();

/**
 * 1. GET /api/biznesgo/debts
 * - Merchant izolyatsiyasi.
 * - Status filtri: all | open | partial | paid | cancelled | overdue
 * - Qidiruv: mijoz ismi, telefon yoki tavsif bo'yicha (?search=... yoki ?q=...)
 * - Mijoz bo'yicha filtr (?customerId=...)
 * - Sahifalash (?page=1&limit=50)
 * - Umumiy ochiq qarz summasi va hisoblagichlar (open, partial, paid, overdue, total)
 */
router.get("/debts", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;

    // Query orqali boshqa merchant_id so'ralgan bo'lsa -> 403
    const requestedMerchantId = req.query?.merchantId ?? req.query?.merchant_id;
    if (
      requestedMerchantId !== undefined &&
      String(requestedMerchantId).trim() !== "" &&
      Number(requestedMerchantId) !== merchant.id
    ) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli qarzlarni ko'rish taqiqlangan",
      });
    }

    const search = String(req.query?.search ?? req.query?.q ?? "").trim();
    const statusFilter = String(req.query?.status ?? "all").trim().toLowerCase();
    const customerId = req.query?.customerId ? Number(req.query.customerId) : null;
    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 50));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(biznesgoDebts.merchantId, merchant.id)];

    if (customerId && Number.isInteger(customerId)) {
      conditions.push(eq(biznesgoDebts.customerId, customerId));
    }

    if (search) {
      conditions.push(
        or(
          ilike(biznesgoDebts.customerName, `%${search}%`),
          ilike(biznesgoDebts.customerPhone, `%${search}%`),
          ilike(biznesgoDebts.description, `%${search}%`),
        ),
      );
    }

    const now = new Date();
    if (statusFilter === "open") {
      conditions.push(eq(biznesgoDebts.status, "open"));
    } else if (statusFilter === "partial") {
      conditions.push(eq(biznesgoDebts.status, "partial"));
    } else if (statusFilter === "paid") {
      conditions.push(eq(biznesgoDebts.status, "paid"));
    } else if (statusFilter === "cancelled") {
      conditions.push(eq(biznesgoDebts.status, "cancelled"));
    } else if (statusFilter === "overdue" || statusFilter === "muddati_otgan") {
      conditions.push(
        and(
          inArray(biznesgoDebts.status, ["open", "partial"]),
          lt(biznesgoDebts.dueDate, now),
        ),
      );
    }

    // 1. Qarz yozuvlarini olish
    const debtRows = await db
      .select()
      .from(biznesgoDebts)
      .where(and(...conditions))
      .orderBy(desc(biznesgoDebts.createdAt), desc(biznesgoDebts.id))
      .limit(limit)
      .offset(offset);

    // 2. Ushbu merchantning barcha qarzlari bo'yicha umumiy statistika
    const allMerchantDebts = await db
      .select({
        id: biznesgoDebts.id,
        status: biznesgoDebts.status,
        totalAmount: biznesgoDebts.totalAmount,
        paidAmount: biznesgoDebts.paidAmount,
        dueDate: biznesgoDebts.dueDate,
      })
      .from(biznesgoDebts)
      .where(eq(biznesgoDebts.merchantId, merchant.id));

    let totalOutstandingDebt = 0;
    const counts = {
      open: 0,
      partial: 0,
      paid: 0,
      cancelled: 0,
      overdue: 0,
      total: 0,
    };

    for (const d of allMerchantDebts) {
      counts.total += 1;
      const isOverdue =
        (d.status === "open" || d.status === "partial") &&
        Boolean(d.dueDate && new Date(d.dueDate) < now);

      if (isOverdue) {
        counts.overdue += 1;
      }

      if (d.status === "open") {
        counts.open += 1;
        totalOutstandingDebt += computeDebtBalance(d.totalAmount, d.paidAmount);
      } else if (d.status === "partial") {
        counts.partial += 1;
        totalOutstandingDebt += computeDebtBalance(d.totalAmount, d.paidAmount);
      } else if (d.status === "paid") {
        counts.paid += 1;
      } else if (d.status === "cancelled") {
        counts.cancelled += 1;
      }
    }

    // 3. To'lovlar va mijozlarni bog'lash
    const debtIds = debtRows.map((d) => d.id);
    const paymentsByDebt = new Map<number, Array<typeof biznesgoDebtPayments.$inferSelect>>();

    if (debtIds.length > 0) {
      const paymentRows = await db
        .select()
        .from(biznesgoDebtPayments)
        .where(
          and(
            eq(biznesgoDebtPayments.merchantId, merchant.id),
            inArray(biznesgoDebtPayments.debtId, debtIds),
          ),
        )
        .orderBy(desc(biznesgoDebtPayments.createdAt), desc(biznesgoDebtPayments.id));

      for (const p of paymentRows) {
        const list = paymentsByDebt.get(p.debtId) || [];
        list.push(p);
        paymentsByDebt.set(p.debtId, list);
      }
    }

    const debts = debtRows.map((d) => {
      const remainingBalance = computeDebtBalance(d.totalAmount, d.paidAmount);
      const isOverdue =
        (d.status === "open" || d.status === "partial") &&
        Boolean(d.dueDate && new Date(d.dueDate) < now);

      return {
        ...d,
        remainingBalance,
        isOverdue,
        payments: paymentsByDebt.get(d.id) || [],
      };
    });

    return res.json({
      ok: true,
      debts,
      totalOutstandingDebt,
      counts,
      pagination: {
        page,
        limit,
        total: debts.length,
      },
    });
  } catch (err) {
    console.error("[biznesgo:debts:get error]:", err);
    return res.status(500).json({ ok: false, error: "Qarzlar ro'yxatini yuklashda server xatosi yuz berdi" });
  }
});

/**
 * 2. POST /api/biznesgo/debts
 * - Yangi qarz yozuvi yaratish.
 * - customerId yoki customerName majburiy.
 * - totalAmount > 0 majburiy.
 * - Boshlang'ich to'lov bo'lsa -> biznesgoDebtPayments ga yozish.
 */
router.post("/debts", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const {
      customerId,
      customerName,
      customerPhone,
      description,
      totalAmount,
      paidAmount = 0,
      initialPayment = 0,
      dueDate,
    } = req.body ?? {};

    const parsedTotal = Math.floor(Number(totalAmount));
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      return res.status(400).json({ ok: false, error: "Qarz summasi 0 dan katta bo'lishi shart" });
    }

    const rawPaid = paidAmount !== undefined && paidAmount !== 0 ? paidAmount : initialPayment;
    const parsedPaid = Math.max(0, Math.floor(Number(rawPaid) || 0));

    if (parsedPaid > parsedTotal) {
      return res.status(400).json({
        ok: false,
        error: "Boshlang'ich to'lov qarz summasidan ko'p bo'lishi mumkin emas",
      });
    }

    let finalCustomerId: number | null = customerId ? Number(customerId) : null;
    let finalCustomerName = String(customerName || "").trim();
    let finalCustomerPhone = customerPhone ? String(customerPhone).trim().slice(0, 32) : null;

    // customerId berilgan bo'lsa, merchantga tegishliligini tekshiramiz
    if (finalCustomerId) {
      const [cust] = await db
        .select()
        .from(biznesgoCustomers)
        .where(eq(biznesgoCustomers.id, finalCustomerId))
        .limit(1);

      if (!cust) {
        return res.status(404).json({ ok: false, error: "Ko'rsatilgan mijoz topilmadi" });
      }

      if (cust.merchantId !== merchant.id) {
        return res.status(403).json({
          ok: false,
          error: "Boshqa sotuvchining mijoziga qarz yozish taqiqlangan",
        });
      }

      finalCustomerName = cust.name;
      if (!finalCustomerPhone && cust.phone) {
        finalCustomerPhone = cust.phone;
      }
    } else {
      // customerId berilmagan bo'lsa, customerName talab qilinadi
      if (!finalCustomerName) {
        return res.status(400).json({ ok: false, error: "Mijoz ismini kiriting" });
      }

      // Agar ushbu merchantda shu ism yoki telefonli mijoz mavjud bo'lsa, bog'laymiz
      let existingCustomer: typeof biznesgoCustomers.$inferSelect | undefined;
      if (finalCustomerPhone) {
        const [found] = await db
          .select()
          .from(biznesgoCustomers)
          .where(
            and(
              eq(biznesgoCustomers.merchantId, merchant.id),
              eq(biznesgoCustomers.phone, finalCustomerPhone),
              eq(biznesgoCustomers.isArchived, false),
            ),
          )
          .limit(1);
        existingCustomer = found;
      }

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
        finalCustomerName = existingCustomer.name;
      } else {
        // Yangi mijoz avtomatik ravishda mijozlar bazasiga qo'shiladi (CRM integratsiyasi)
        const [newCust] = await db
          .insert(biznesgoCustomers)
          .values({
            merchantId: merchant.id,
            name: finalCustomerName,
            phone: finalCustomerPhone,
            isArchived: false,
          })
          .returning();

        if (newCust) {
          finalCustomerId = newCust.id;
        }
      }
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : null;
    const cleanDueDate = parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate : null;
    const cleanDescription = description ? String(description).trim().slice(0, 500) : null;
    const status = computeDebtStatus(parsedTotal, parsedPaid);

    const [inserted] = await db
      .insert(biznesgoDebts)
      .values({
        merchantId: merchant.id,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        description: cleanDescription,
        totalAmount: parsedTotal,
        paidAmount: parsedPaid,
        dueDate: cleanDueDate,
        status,
      })
      .returning();

    const payments: Array<typeof biznesgoDebtPayments.$inferSelect> = [];
    if (parsedPaid > 0) {
      const [initialPaymentRow] = await db
        .insert(biznesgoDebtPayments)
        .values({
          debtId: inserted.id,
          merchantId: merchant.id,
          amount: parsedPaid,
          paymentMethod: "cash",
          note: "Boshlang'ich to'lov",
        })
        .returning();

      if (initialPaymentRow) {
        payments.push(initialPaymentRow);
      }
    }

    const remainingBalance = computeDebtBalance(inserted.totalAmount, inserted.paidAmount);
    const isOverdue =
      (inserted.status === "open" || inserted.status === "partial") &&
      Boolean(inserted.dueDate && new Date(inserted.dueDate) < new Date());

    return res.status(201).json({
      ok: true,
      debt: {
        ...inserted,
        remainingBalance,
        isOverdue,
        payments,
      },
    });
  } catch (err) {
    console.error("[biznesgo:debts:post error]:", err);
    return res.status(500).json({ ok: false, error: "Qarz yozuvini saqlashda server xatosi yuz berdi" });
  }
});

/**
 * 3. GET /api/biznesgo/debts/:id
 * - Qarz tafsilotlari, mijoz ma'lumotlari va barcha to'lovlar tarixi.
 * - Ownership tekshiruvi (403).
 */
router.get("/debts/:id", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const debtId = Number(req.params.id);

    if (!Number.isInteger(debtId) || debtId <= 0) {
      return res.status(400).json({ ok: false, error: "Qarz ID raqami noto'g'ri" });
    }

    const [debt] = await db
      .select()
      .from(biznesgoDebts)
      .where(eq(biznesgoDebts.id, debtId))
      .limit(1);

    if (!debt) {
      return res.status(404).json({ ok: false, error: "Qarz yozuvi topilmadi" });
    }

    if (debt.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Bu qarz yozuviga ruxsatingiz yo'q",
      });
    }

    let customer: typeof biznesgoCustomers.$inferSelect | null = null;
    if (debt.customerId) {
      const [c] = await db
        .select()
        .from(biznesgoCustomers)
        .where(eq(biznesgoCustomers.id, debt.customerId))
        .limit(1);
      customer = c || null;
    }

    const payments = await db
      .select()
      .from(biznesgoDebtPayments)
      .where(
        and(
          eq(biznesgoDebtPayments.merchantId, merchant.id),
          eq(biznesgoDebtPayments.debtId, debt.id),
        ),
      )
      .orderBy(desc(biznesgoDebtPayments.createdAt), desc(biznesgoDebtPayments.id));

    const remainingBalance = computeDebtBalance(debt.totalAmount, debt.paidAmount);
    const isOverdue =
      (debt.status === "open" || debt.status === "partial") &&
      Boolean(debt.dueDate && new Date(debt.dueDate) < new Date());

    return res.json({
      ok: true,
      debt: {
        ...debt,
        remainingBalance,
        isOverdue,
        customer,
        payments,
      },
    });
  } catch (err) {
    console.error("[biznesgo:debts:get:id error]:", err);
    return res.status(500).json({ ok: false, error: "Qarz ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

/**
 * 4. PATCH /api/biznesgo/debts/:id
 * - Qarz summasi, qaytarish muddati va tavsifini yangilash.
 * - totalAmount kamida paidAmount ga teng bo'lishi shart!
 * - Ownership tekshiruvi (403).
 */
router.patch("/debts/:id", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const debtId = Number(req.params.id);

    if (!Number.isInteger(debtId) || debtId <= 0) {
      return res.status(400).json({ ok: false, error: "Qarz ID raqami noto'g'ri" });
    }

    const [debt] = await db
      .select()
      .from(biznesgoDebts)
      .where(eq(biznesgoDebts.id, debtId))
      .limit(1);

    if (!debt) {
      return res.status(404).json({ ok: false, error: "Qarz yozuvi topilmadi" });
    }

    if (debt.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Bu qarz yozuviga ruxsatingiz yo'q",
      });
    }

    if (debt.status === "cancelled") {
      return res.status(400).json({ ok: false, error: "Bekor qilingan qarzni tahrirlab bo'lmaydi" });
    }

    const { description, dueDate, totalAmount } = req.body ?? {};
    let nextTotal = debt.totalAmount;

    if (totalAmount !== undefined) {
      const parsedTotal = Math.floor(Number(totalAmount));
      if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({ ok: false, error: "Umumiy qarz summasi 0 dan katta bo'lishi shart" });
      }

      if (parsedTotal < debt.paidAmount) {
        return res.status(400).json({
          ok: false,
          error: `Umumiy qarz summasi allaqachon to'langan summadan (${debt.paidAmount.toLocaleString()} so'm) kam bo'lishi mumkin emas`,
        });
      }

      nextTotal = parsedTotal;
    }

    const nextStatus = computeDebtStatus(nextTotal, debt.paidAmount, debt.status);
    const updates: Record<string, any> = {
      totalAmount: nextTotal,
      status: nextStatus,
      updatedAt: new Date(),
    };

    if (description !== undefined) {
      updates.description = description ? String(description).trim().slice(0, 500) : null;
    }

    if (dueDate !== undefined) {
      if (!dueDate) {
        updates.dueDate = null;
      } else {
        const parsed = new Date(dueDate);
        updates.dueDate = !Number.isNaN(parsed.getTime()) ? parsed : null;
      }
    }

    const [updated] = await db
      .update(biznesgoDebts)
      .set(updates)
      .where(eq(biznesgoDebts.id, debt.id))
      .returning();

    const payments = await db
      .select()
      .from(biznesgoDebtPayments)
      .where(
        and(
          eq(biznesgoDebtPayments.merchantId, merchant.id),
          eq(biznesgoDebtPayments.debtId, updated.id),
        ),
      )
      .orderBy(desc(biznesgoDebtPayments.createdAt), desc(biznesgoDebtPayments.id));

    const remainingBalance = computeDebtBalance(updated.totalAmount, updated.paidAmount);
    const isOverdue =
      (updated.status === "open" || updated.status === "partial") &&
      Boolean(updated.dueDate && new Date(updated.dueDate) < new Date());

    return res.json({
      ok: true,
      debt: {
        ...updated,
        remainingBalance,
        isOverdue,
        payments,
      },
    });
  } catch (err) {
    console.error("[biznesgo:debts:patch error]:", err);
    return res.status(500).json({ ok: false, error: "Qarz yozuvini yangilashda server xatosi yuz berdi" });
  }
});

/**
 * 5. POST /api/biznesgo/debts/:id/payments
 * - Qarzga to'lov qabul qilish (qisman yoki to'liq).
 * - Qoldiqdan ortiq to'lov qabul qilinmaydi.
 * - Yangi status avtomatik hisoblanadi (partial yoki paid).
 * - Ownership tekshiruvi (403).
 */
router.post("/debts/:id/payments", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const debtId = Number(req.params.id);

    if (!Number.isInteger(debtId) || debtId <= 0) {
      return res.status(400).json({ ok: false, error: "Qarz ID raqami noto'g'ri" });
    }

    const [debt] = await db
      .select()
      .from(biznesgoDebts)
      .where(eq(biznesgoDebts.id, debtId))
      .limit(1);

    if (!debt) {
      return res.status(404).json({ ok: false, error: "Qarz yozuvi topilmadi" });
    }

    if (debt.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Bu qarz yozuviga ruxsatingiz yo'q",
      });
    }

    if (debt.status === "cancelled") {
      return res.status(400).json({ ok: false, error: "Bekor qilingan qarzga to'lov qabul qilinmaydi" });
    }

    const currentBalance = computeDebtBalance(debt.totalAmount, debt.paidAmount);
    if (currentBalance <= 0 || debt.status === "paid") {
      return res.status(400).json({ ok: false, error: "Ushbu qarz allaqachon to'liq to'langan" });
    }

    const rawAmount = Number(req.body?.amount);
    if (!Number.isFinite(rawAmount) || Math.floor(rawAmount) <= 0) {
      return res.status(400).json({ ok: false, error: "To'lov summasi 0 dan katta bo'lishi shart" });
    }

    const payAmount = Math.floor(rawAmount);
    if (payAmount > currentBalance) {
      return res.status(400).json({
        ok: false,
        error: `To'lov summasi qarz qoldig'idan (${currentBalance.toLocaleString()} so'm) ko'p bo'lishi mumkin emas`,
      });
    }

    const paymentMethod = normalizeDebtPaymentMethod(req.body?.paymentMethod);
    const note = req.body?.note ? String(req.body.note).trim().slice(0, 300) : null;

    // To'lovni kiritish
    const [paymentRow] = await db
      .insert(biznesgoDebtPayments)
      .values({
        debtId: debt.id,
        merchantId: merchant.id,
        amount: payAmount,
        paymentMethod,
        note,
      })
      .returning();

    const nextPaid = debt.paidAmount + payAmount;
    const nextStatus = computeDebtStatus(debt.totalAmount, nextPaid);

    const [updatedDebt] = await db
      .update(biznesgoDebts)
      .set({
        paidAmount: nextPaid,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(biznesgoDebts.id, debt.id))
      .returning();

    const allPayments = await db
      .select()
      .from(biznesgoDebtPayments)
      .where(
        and(
          eq(biznesgoDebtPayments.merchantId, merchant.id),
          eq(biznesgoDebtPayments.debtId, debt.id),
        ),
      )
      .orderBy(desc(biznesgoDebtPayments.createdAt), desc(biznesgoDebtPayments.id));

    const remainingBalance = computeDebtBalance(updatedDebt.totalAmount, updatedDebt.paidAmount);
    const isOverdue =
      (updatedDebt.status === "open" || updatedDebt.status === "partial") &&
      Boolean(updatedDebt.dueDate && new Date(updatedDebt.dueDate) < new Date());

    return res.json({
      ok: true,
      debt: {
        ...updatedDebt,
        remainingBalance,
        isOverdue,
        payments: allPayments,
      },
      payment: paymentRow,
    });
  } catch (err) {
    console.error("[biznesgo:debts:payment error]:", err);
    return res.status(500).json({ ok: false, error: "To'lovni saqlashda server xatosi yuz berdi" });
  }
});

/**
 * 6. PATCH /api/biznesgo/debts/:id/cancel
 * - Qarzni bekor qilish.
 * - Faqat open yoki partial qarzlarni bekor qilish mumkin.
 * - To'liq to'langan qarzni bekor qilib bo'lmaydi.
 * - Ownership tekshiruvi (403).
 */
router.patch("/debts/:id/cancel", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const debtId = Number(req.params.id);

    if (!Number.isInteger(debtId) || debtId <= 0) {
      return res.status(400).json({ ok: false, error: "Qarz ID raqami noto'g'ri" });
    }

    const [debt] = await db
      .select()
      .from(biznesgoDebts)
      .where(eq(biznesgoDebts.id, debtId))
      .limit(1);

    if (!debt) {
      return res.status(404).json({ ok: false, error: "Qarz yozuvi topilmadi" });
    }

    if (debt.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Bu qarz yozuviga ruxsatingiz yo'q",
      });
    }

    if (debt.status === "cancelled") {
      return res.json({ ok: true, message: "Qarz allaqachon bekor qilingan", debt });
    }

    if (debt.status === "paid") {
      return res.status(400).json({
        ok: false,
        error: "To'liq to'langan qarzni bekor qilib bo'lmaydi",
      });
    }

    const [updatedDebt] = await db
      .update(biznesgoDebts)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(biznesgoDebts.id, debt.id))
      .returning();

    return res.json({
      ok: true,
      message: "Qarz muvaffaqiyatli bekor qilindi",
      debt: updatedDebt,
    });
  } catch (err) {
    console.error("[biznesgo:debts:cancel error]:", err);
    return res.status(500).json({ ok: false, error: "Qarzni bekor qilishda xatolik yuz berdi" });
  }
});

export default router;
