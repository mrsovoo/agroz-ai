import { Router } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { biznesgoCustomers, biznesgoDebts, biznesgoDebtPayments } from "../../db/schema.js";
import { requireBiznesGoMerchant, type BiznesGoRequest } from "./middleware.js";
import { computeDebtBalance } from "../../lib/partner-erp-logic.js";

const router = Router();

/**
 * 1. GET /api/biznesgo/customers
 * - Merchant izolyatsiyasi (faqat o'z mijozlari).
 * - Qidiruv: ism, telefon yoki manzil bo'yicha (?search=... yoki ?q=...).
 * - Sahifalash (?page=1&limit=50).
 * - Har bir mijoz uchun hisoblangan qarz balansi (debtBalance) va ochiq qarzlar soni.
 */
router.get("/customers", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
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
        error: "Boshqa sotuvchiga tegishli mijozlarni ko'rish taqiqlangan",
      });
    }

    const search = String(req.query?.search ?? req.query?.q ?? "").trim();
    const includeArchived = req.query?.includeArchived === "true";
    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 50));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(biznesgoCustomers.merchantId, merchant.id)];

    if (!includeArchived) {
      conditions.push(eq(biznesgoCustomers.isArchived, false));
    }

    if (search) {
      conditions.push(
        or(
          ilike(biznesgoCustomers.name, `%${search}%`),
          ilike(biznesgoCustomers.phone, `%${search}%`),
          ilike(biznesgoCustomers.address, `%${search}%`),
        ),
      );
    }

    // 1. Mijozlar ro'yxatini olish
    const customerList = await db
      .select()
      .from(biznesgoCustomers)
      .where(and(...conditions))
      .orderBy(desc(biznesgoCustomers.updatedAt), desc(biznesgoCustomers.id))
      .limit(limit)
      .offset(offset);

    // 2. Ushbu mijozlar uchun qarz balanslarini hisoblash
    const customerIds = customerList.map((c) => c.id);
    const debtBalanceMap = new Map<number, { balance: number; activeDebtsCount: number; totalDebtsCount: number }>();

    if (customerIds.length > 0) {
      const debtRows = await db
        .select({
          customerId: biznesgoDebts.customerId,
          totalAmount: biznesgoDebts.totalAmount,
          paidAmount: biznesgoDebts.paidAmount,
          status: biznesgoDebts.status,
        })
        .from(biznesgoDebts)
        .where(
          and(
            eq(biznesgoDebts.merchantId, merchant.id),
            inArray(biznesgoDebts.customerId, customerIds),
          ),
        );

      for (const d of debtRows) {
        if (!d.customerId) continue;
        const cur = debtBalanceMap.get(d.customerId) || { balance: 0, activeDebtsCount: 0, totalDebtsCount: 0 };
        if (d.status !== "cancelled") {
          cur.totalDebtsCount += 1;
        }
        if (d.status === "open" || d.status === "partial") {
          cur.activeDebtsCount += 1;
          cur.balance += computeDebtBalance(d.totalAmount, d.paidAmount);
        }
        debtBalanceMap.set(d.customerId, cur);
      }
    }

    // 3. Umumiy hisoblangan mijozlar ro'yxati
    const customers = customerList.map((c) => {
      const stats = debtBalanceMap.get(c.id) || { balance: 0, activeDebtsCount: 0, totalDebtsCount: 0 };
      return {
        ...c,
        debtBalance: stats.balance,
        activeDebtsCount: stats.activeDebtsCount,
        totalDebtsCount: stats.totalDebtsCount,
      };
    });

    return res.json({
      ok: true,
      customers,
      pagination: {
        page,
        limit,
        total: customers.length,
      },
    });
  } catch (err) {
    console.error("[biznesgo:customers:get error]:", err);
    return res.status(500).json({ ok: false, error: "Mijozlar ro'yxatini yuklashda server xatosi yuz berdi" });
  }
});

/**
 * 2. POST /api/biznesgo/customers
 * - Yangi mijoz qo'shish.
 * - Ism majburiy (name).
 * - Telefon takrorlanishini tekshirish.
 */
router.post("/customers", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const { name, phone, address, region, district, note, notes } = req.body ?? {};

    const cleanName = String(name || "").trim();
    if (!cleanName || cleanName.length === 0) {
      return res.status(400).json({ ok: false, error: "Mijoz ismini kiritish majburiy" });
    }
    if (cleanName.length > 160) {
      return res.status(400).json({ ok: false, error: "Mijoz ismi 160 belgidan oshmasligi kerak" });
    }

    const cleanPhone = phone ? String(phone).trim().slice(0, 32) : null;
    const cleanAddress = address ? String(address).trim() : null;
    const cleanRegion = region ? String(region).trim().slice(0, 100) : null;
    const cleanDistrict = district ? String(district).trim().slice(0, 100) : null;
    const cleanNote = note ? String(note).trim() : notes ? String(notes).trim() : null;

    // Telefon raqami mavjud bo'lsa, takrorlanishni tekshirish
    if (cleanPhone) {
      const [existing] = await db
        .select()
        .from(biznesgoCustomers)
        .where(
          and(
            eq(biznesgoCustomers.merchantId, merchant.id),
            eq(biznesgoCustomers.phone, cleanPhone),
            eq(biznesgoCustomers.isArchived, false),
          ),
        )
        .limit(1);

      if (existing) {
        return res.status(400).json({
          ok: false,
          error: `Ushbu telefon raqamli mijoz allaqachon mavjud: ${existing.name}`,
          existingCustomerId: existing.id,
        });
      }
    }

    const [inserted] = await db
      .insert(biznesgoCustomers)
      .values({
        merchantId: merchant.id,
        name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        region: cleanRegion,
        district: cleanDistrict,
        note: cleanNote,
        notes: cleanNote,
        isArchived: false,
      })
      .returning();

    return res.status(201).json({
      ok: true,
      customer: {
        ...inserted,
        debtBalance: 0,
        activeDebtsCount: 0,
        totalDebtsCount: 0,
      },
    });
  } catch (err) {
    console.error("[biznesgo:customers:post error]:", err);
    return res.status(500).json({ ok: false, error: "Mijozni saqlashda server xatosi yuz berdi" });
  }
});

/**
 * 3. GET /api/biznesgo/customers/:id
 * - Mijoz tafsilotlari, faol qarzlar ro'yxati va to'lovlar tarixi.
 * - Ownership tekshiruvi (boshqa merchant bo'lsa -> 403).
 */
router.get("/customers/:id", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ ok: false, error: "Mijoz ID raqami noto'g'ri" });
    }

    const [customer] = await db
      .select()
      .from(biznesgoCustomers)
      .where(eq(biznesgoCustomers.id, customerId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ ok: false, error: "Mijoz topilmadi" });
    }

    if (customer.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mijoz ma'lumotlarini ko'rish taqiqlangan",
      });
    }

    // Mijozning barcha qarzlarini olish
    const debts = await db
      .select()
      .from(biznesgoDebts)
      .where(
        and(
          eq(biznesgoDebts.merchantId, merchant.id),
          eq(biznesgoDebts.customerId, customer.id),
        ),
      )
      .orderBy(desc(biznesgoDebts.createdAt), desc(biznesgoDebts.id));

    const debtIds = debts.map((d) => d.id);
    let payments: Array<typeof biznesgoDebtPayments.$inferSelect> = [];

    if (debtIds.length > 0) {
      payments = await db
        .select()
        .from(biznesgoDebtPayments)
        .where(
          and(
            eq(biznesgoDebtPayments.merchantId, merchant.id),
            inArray(biznesgoDebtPayments.debtId, debtIds),
          ),
        )
        .orderBy(desc(biznesgoDebtPayments.createdAt), desc(biznesgoDebtPayments.id));
    }

    let debtBalance = 0;
    let activeDebtsCount = 0;
    for (const d of debts) {
      if (d.status === "open" || d.status === "partial") {
        activeDebtsCount += 1;
        debtBalance += computeDebtBalance(d.totalAmount, d.paidAmount);
      }
    }

    return res.json({
      ok: true,
      customer: {
        ...customer,
        debtBalance,
        activeDebtsCount,
        totalDebtsCount: debts.filter((d) => d.status !== "cancelled").length,
        debts,
        payments,
      },
    });
  } catch (err) {
    console.error("[biznesgo:customers:get:id error]:", err);
    return res.status(500).json({ ok: false, error: "Mijoz ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

/**
 * 4. PATCH /api/biznesgo/customers/:id
 * - Mijoz ma'lumotlarini yangilash.
 * - Ownership tekshiruvi (403).
 */
router.patch("/customers/:id", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ ok: false, error: "Mijoz ID raqami noto'g'ri" });
    }

    const [customer] = await db
      .select()
      .from(biznesgoCustomers)
      .where(eq(biznesgoCustomers.id, customerId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ ok: false, error: "Mijoz topilmadi" });
    }

    if (customer.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mijozni tahrirlash taqiqlangan",
      });
    }

    const { name, phone, address, region, district, note, notes } = req.body ?? {};
    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (!cleanName) {
        return res.status(400).json({ ok: false, error: "Mijoz ismi bo'sh bo'lishi mumkin emas" });
      }
      if (cleanName.length > 160) {
        return res.status(400).json({ ok: false, error: "Mijoz ismi 160 belgidan oshmasligi kerak" });
      }
      updates.name = cleanName;
    }

    if (phone !== undefined) {
      const cleanPhone = phone ? String(phone).trim().slice(0, 32) : null;
      if (cleanPhone && cleanPhone !== customer.phone) {
        // boshqa mijozda bu telefon bormi?
        const [existing] = await db
          .select()
          .from(biznesgoCustomers)
          .where(
            and(
              eq(biznesgoCustomers.merchantId, merchant.id),
              eq(biznesgoCustomers.phone, cleanPhone),
              eq(biznesgoCustomers.isArchived, false),
            ),
          )
          .limit(1);

        if (existing && existing.id !== customer.id) {
          return res.status(400).json({
            ok: false,
            error: `Ushbu telefon raqamli mijoz allaqachon mavjud: ${existing.name}`,
          });
        }
      }
      updates.phone = cleanPhone;
    }

    if (address !== undefined) updates.address = address ? String(address).trim() : null;
    if (region !== undefined) updates.region = region ? String(region).trim().slice(0, 100) : null;
    if (district !== undefined) updates.district = district ? String(district).trim().slice(0, 100) : null;
    if (note !== undefined || notes !== undefined) {
      const val = note !== undefined ? note : notes;
      updates.note = val ? String(val).trim() : null;
      updates.notes = updates.note;
    }

    const [updated] = await db
      .update(biznesgoCustomers)
      .set(updates)
      .where(eq(biznesgoCustomers.id, customer.id))
      .returning();

    return res.json({
      ok: true,
      customer: updated,
    });
  } catch (err) {
    console.error("[biznesgo:customers:patch error]:", err);
    return res.status(500).json({ ok: false, error: "Mijoz ma'lumotlarini yangilashda xatolik yuz berdi" });
  }
});

/**
 * 5. DELETE /api/biznesgo/customers/:id
 * - Agar ochiq qarz (balance > 0) bo'lsa -> 400 xatolik bilan to'xtatish.
 * - Aks holda arxivlash (soft-delete: isArchived = true).
 * - Ownership tekshiruvi (403).
 */
router.delete("/customers/:id", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      return res.status(400).json({ ok: false, error: "Mijoz ID raqami noto'g'ri" });
    }

    const [customer] = await db
      .select()
      .from(biznesgoCustomers)
      .where(eq(biznesgoCustomers.id, customerId))
      .limit(1);

    if (!customer) {
      return res.status(404).json({ ok: false, error: "Mijoz topilmadi" });
    }

    if (customer.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mijozni o'chirish taqiqlangan",
      });
    }

    // Faol / ochiq qarzlar mavjudligini tekshirish
    const activeDebts = await db
      .select({
        id: biznesgoDebts.id,
        totalAmount: biznesgoDebts.totalAmount,
        paidAmount: biznesgoDebts.paidAmount,
        status: biznesgoDebts.status,
      })
      .from(biznesgoDebts)
      .where(
        and(
          eq(biznesgoDebts.merchantId, merchant.id),
          eq(biznesgoDebts.customerId, customer.id),
        ),
      );

    let unpaidBalance = 0;
    for (const d of activeDebts) {
      if (d.status === "open" || d.status === "partial") {
        unpaidBalance += computeDebtBalance(d.totalAmount, d.paidAmount);
      }
    }

    if (unpaidBalance > 0) {
      return res.status(400).json({
        ok: false,
        error: `Mijozda to'lanmagan ochiq qarzlar mavjud (${unpaidBalance.toLocaleString()} so'm). Avval qarzni to'lang yoki bekor qiling`,
      });
    }

    // Arxivlash (soft-delete)
    await db
      .update(biznesgoCustomers)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(eq(biznesgoCustomers.id, customer.id));

    return res.json({
      ok: true,
      message: "Mijoz muvaffaqiyatli arxivlandi",
    });
  } catch (err) {
    console.error("[biznesgo:customers:delete error]:", err);
    return res.status(500).json({ ok: false, error: "Mijozni o'chirishda xatolik yuz berdi" });
  }
});

export default router;
