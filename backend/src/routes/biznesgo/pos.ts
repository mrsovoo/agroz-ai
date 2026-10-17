import { Router } from "express";
import { and, desc, eq, gte, ilike, inArray, lte, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  biznesgoCustomers,
  biznesgoDebts,
  biznesgoMerchants,
  biznesgoPosSales,
  biznesgoPosSaleItems,
  biznesgoProducts,
} from "../../db/schema.js";
import { requireBiznesGoMerchant, type BiznesGoRequest } from "./middleware.js";

const router = Router();

/**
 * 1. GET /api/biznesgo/pos/products
 * - Faqat token bilan kirgan sotuvchining mahsulotlari.
 * - Arxivlanganlar kirmaydi (status != 'archived').
 * - Qoldiq 0 bo'lsa ham ko'rinadi (out_of_stock), lekin sotuvda bloklanadi yoki ogohlantiradi.
 * - Qidiruv: nom bo'yicha (?search=... yoki ?q=...).
 * - Kategoriya filtri: (?category=...).
 */
router.get("/pos/products", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;

    // Boshqa merchant_id so'ralgan bo'lsa -> 403
    const requestedMerchantId = req.query?.merchantId ?? req.query?.merchant_id;
    if (
      requestedMerchantId !== undefined &&
      String(requestedMerchantId).trim() !== "" &&
      Number(requestedMerchantId) !== merchant.id
    ) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mahsulotlarni ko'rish taqiqlangan",
      });
    }

    const search = String(req.query?.search ?? req.query?.q ?? "").trim();
    const category = String(req.query?.category ?? "").trim();

    const conditions: any[] = [
      eq(biznesgoProducts.merchantId, merchant.id),
      ne(biznesgoProducts.status, "archived"),
    ];

    if (search) {
      conditions.push(ilike(biznesgoProducts.name, `%${search}%`));
    }

    if (category && category !== "all") {
      conditions.push(eq(biznesgoProducts.category, category));
    }

    const products = await db
      .select()
      .from(biznesgoProducts)
      .where(and(...conditions))
      .orderBy(desc(biznesgoProducts.stock), desc(biznesgoProducts.updatedAt));

    return res.json({
      ok: true,
      products,
    });
  } catch (err) {
    console.error("[biznesgo:pos:products error]:", err);
    return res.status(500).json({ ok: false, error: "Mahsulotlarni yuklashda xatolik yuz berdi" });
  }
});

/**
 * 2. POST /api/biznesgo/pos/sales
 * - Yangi POS sotuv yaratish.
 * - Kirish ma'lumotlari:
 *   - items: array of { productId, quantity, unitPrice? }
 *   - customerId — ixtiyoriy
 *   - customerName — ixtiyoriy
 *   - customerPhone — ixtiyoriy
 *   - discountAmount — ixtiyoriy (default 0)
 *   - paymentMethod: cash | card | credit
 *   - note — ixtiyoriy
 * - Server tomonida tekshirish:
 *   - Mahsulot sotuvchining o'ziga tegishli va arxivlanmagan
 *   - quantity > 0
 *   - Qoldiq yetarli bo'lishi shart (kam bo'lsa sotuv bloklanadi)
 *   - Qoldiq kamaytiriladi
 *   - paymentMethod === 'credit' bo'lsa:
 *     - Mijoz tanlangan bo'lishi shart!
 *     - biznesgo_debts ga avtomatik qarz yaratiladi
 */
router.post(["/pos/sales", "/pos-sales", "/pos"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const {
      items: rawItems,
      customerId,
      customerName,
      customerPhone,
      discountAmount = 0,
      discount = 0,
      paymentMethod: rawPaymentMethod,
      paymentType: rawPaymentType,
      note,
    } = req.body ?? {};

    // 1. Mahsulotlar ro'yxatini tekshirish
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({ ok: false, error: "Savatda kamida 1 ta mahsulot bo'lishi shart" });
    }

    // 2. To'lov turini normallashtirish
    const rawMethod = String(rawPaymentMethod || rawPaymentType || "cash").trim().toLowerCase();
    let paymentMethod: "cash" | "card" | "credit" = "cash";
    if (rawMethod === "card" || rawMethod === "karta") paymentMethod = "card";
    else if (rawMethod === "credit" || rawMethod === "nasiya" || rawMethod === "qarz") paymentMethod = "credit";
    else paymentMethod = "cash";

    // 3. Nasiya bo'lsa, mijoz majburiy
    let finalCustomerId = customerId ? Number(customerId) : null;
    let finalCustomerName = customerName ? String(customerName).trim() : null;
    let finalCustomerPhone = customerPhone ? String(customerPhone).trim().slice(0, 32) : null;

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
          error: "Boshqa sotuvchiga tegishli mijozga sotuv amalga oshirib bo'lmaydi",
        });
      }

      finalCustomerName = cust.name;
      if (!finalCustomerPhone && cust.phone) {
        finalCustomerPhone = cust.phone;
      }
    } else if (finalCustomerName) {
      // Ism kiritilgan bo'lsa, mavjud mijozni qidiramiz yoki yangi mijoz yaratamiz
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

    if (paymentMethod === "credit" && !finalCustomerId && !finalCustomerName) {
      return res.status(400).json({
        ok: false,
        error: "Nasiya savdosi uchun mijoz tanlanishi shart",
      });
    }

    // 4. Mahsulotlar mavjudligi, qoldig'i va narxlarini tekshirish
    const productIds = rawItems.map((it: any) => Number(it.productId ?? it.product_id ?? it.id));
    if (productIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ ok: false, error: "Mahsulotlar identifikatori noto'g'ri" });
    }

    const dbProducts = await db
      .select()
      .from(biznesgoProducts)
      .where(
        and(
          eq(biznesgoProducts.merchantId, merchant.id),
          inArray(biznesgoProducts.id, productIds),
        ),
      );

    const productMap = new Map<number, typeof biznesgoProducts.$inferSelect>();
    for (const p of dbProducts) {
      productMap.set(p.id, p);
    }

    const preparedItems: Array<{
      productId: number;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      currentStock: number;
    }> = [];

    let calculatedTotal = 0;

    for (const item of rawItems) {
      const pid = Number(item.productId ?? item.product_id ?? item.id);
      const product = productMap.get(pid);

      if (!product) {
        return res.status(400).json({
          ok: false,
          error: `Mahsulot (#${pid}) topilmadi yoki do'koningizga tegishli emas`,
        });
      }

      if (product.status === "archived") {
        return res.status(400).json({
          ok: false,
          error: `"${product.name}" mahsuloti arxivlangan, uni sotish mumkin emas`,
        });
      }

      const qty = Math.floor(Number(item.quantity ?? item.qty ?? 1));
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({
          ok: false,
          error: `"${product.name}" mahsuloti miqdori 0 dan katta bo'lishi kerak`,
        });
      }

      // Qoldiq yetarliligini tekshirish
      if (product.stock < qty) {
        return res.status(400).json({
          ok: false,
          error: `"${product.name}" mahsulotidan omborda yetarli qoldiq mavjud emas (Mavjud: ${product.stock} ${product.unit}, so'ralgan: ${qty} ${product.unit})`,
        });
      }

      const price =
        item.unitPrice !== undefined && item.unitPrice !== null
          ? Math.max(0, Math.floor(Number(item.unitPrice)))
          : product.price;

      const itemTotal = qty * price;
      calculatedTotal += itemTotal;

      preparedItems.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit || "dona",
        quantity: qty,
        unitPrice: price,
        totalAmount: itemTotal,
        currentStock: product.stock,
      });
    }

    // 5. Chegirma va Yakuniy summa hisob-kitobi
    const rawDiscount = discountAmount !== undefined && discountAmount !== 0 ? discountAmount : discount;
    const parsedDiscount = Math.max(0, Math.floor(Number(rawDiscount) || 0));

    if (parsedDiscount > calculatedTotal) {
      return res.status(400).json({
        ok: false,
        error: "Chegirma summasi umumiy savdo summasidan katta bo'lishi mumkin emas",
      });
    }

    const finalAmount = Math.max(0, calculatedTotal - parsedDiscount);
    const cleanNote = note ? String(note).trim().slice(0, 500) : null;

    // 6. DB tranzaksiya / amallar
    // 6.1. Sotuv yozuvini kiritish
    const [sale] = await db
      .insert(biznesgoPosSales)
      .values({
        merchantId: merchant.id,
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        totalAmount: calculatedTotal,
        discount: parsedDiscount,
        discountAmount: parsedDiscount,
        finalAmount,
        paymentType: paymentMethod,
        paymentMethod,
        status: "completed",
        note: cleanNote,
      })
      .returning();

    // 6.2. Sotuv tarkibidagi har bir mahsulotni yozish va qoldiqni kamaytirish
    const insertedItems: Array<typeof biznesgoPosSaleItems.$inferSelect> = [];

    for (const item of preparedItems) {
      const [saleItem] = await db
        .insert(biznesgoPosSaleItems)
        .values({
          saleId: sale.id,
          merchantId: merchant.id,
          productId: item.productId,
          productName: item.productName,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
        })
        .returning();

      if (saleItem) insertedItems.push(saleItem);

      const nextStock = Math.max(0, item.currentStock - item.quantity);
      const nextStatus = nextStock <= 0 ? "out_of_stock" : "active";

      await db
        .update(biznesgoProducts)
        .set({
          stock: nextStock,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(biznesgoProducts.id, item.productId));
    }

    // 6.3. Agar Nasiya (credit) bo'lsa -> avtomatik qarz yaratish
    let createdDebt: typeof biznesgoDebts.$inferSelect | null = null;
    if (paymentMethod === "credit" && finalAmount > 0) {
      const [debtRow] = await db
        .insert(biznesgoDebts)
        .values({
          merchantId: merchant.id,
          customerId: finalCustomerId,
          customerName: finalCustomerName || "Do'kon mijozi",
          customerPhone: finalCustomerPhone,
          description: `POS sotuv — #${sale.id}`,
          totalAmount: finalAmount,
          paidAmount: 0,
          status: "open",
        })
        .returning();

      if (debtRow) {
        createdDebt = debtRow;
        // Sotuv yozuviga debtId ni bog'laymiz
        await db
          .update(biznesgoPosSales)
          .set({ debtId: debtRow.id })
          .where(eq(biznesgoPosSales.id, sale.id));
      }
    }

    return res.status(201).json({
      ok: true,
      sale: {
        ...sale,
        debtId: createdDebt?.id || null,
        items: insertedItems,
        debt: createdDebt,
      },
    });
  } catch (err) {
    console.error("[biznesgo:pos:sales:post error]:", err);
    return res.status(500).json({ ok: false, error: "Sotuvni saqlashda server xatosi yuz berdi" });
  }
});

/**
 * 3. GET /api/biznesgo/pos/sales
 * - Sotuvchining POS sotuvlar tarixi.
 * - Vaqt filtri: today | 7days | 30days | custom
 * - To'lov turi filtri: all | cash | card | credit
 * - Qidiruv: mijoz ismi yoki telefon raqami bo'yicha
 * - Sahifalash (?page=1&limit=50)
 */
router.get(["/pos/sales", "/pos-sales", "/pos"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;

    // Boshqa merchant_id so'ralgan bo'lsa -> 403
    const requestedMerchantId = req.query?.merchantId ?? req.query?.merchant_id;
    if (
      requestedMerchantId !== undefined &&
      String(requestedMerchantId).trim() !== "" &&
      Number(requestedMerchantId) !== merchant.id
    ) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli sotuvlarni ko'rish taqiqlangan",
      });
    }

    const search = String(req.query?.search ?? req.query?.q ?? "").trim();
    const paymentMethodFilter = String(req.query?.paymentMethod ?? req.query?.paymentType ?? "all").trim().toLowerCase();
    const period = String(req.query?.period ?? req.query?.dateFilter ?? "all").trim().toLowerCase();
    const customerId = req.query?.customerId ? Number(req.query.customerId) : null;

    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 50));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(biznesgoPosSales.merchantId, merchant.id)];

    if (customerId && Number.isInteger(customerId)) {
      conditions.push(eq(biznesgoPosSales.customerId, customerId));
    }

    if (paymentMethodFilter && paymentMethodFilter !== "all") {
      conditions.push(
        or(
          eq(biznesgoPosSales.paymentMethod, paymentMethodFilter),
          eq(biznesgoPosSales.paymentType, paymentMethodFilter),
        ),
      );
    }

    if (search) {
      conditions.push(
        or(
          ilike(biznesgoPosSales.customerName, `%${search}%`),
          ilike(biznesgoPosSales.customerPhone, `%${search}%`),
        ),
      );
    }

    const now = new Date();
    if (period === "today" || period === "bugun") {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      conditions.push(gte(biznesgoPosSales.createdAt, startOfDay));
    } else if (period === "7days" || period === "hafta") {
      const past7 = new Date(Date.now() - 7 * 86400000);
      conditions.push(gte(biznesgoPosSales.createdAt, past7));
    } else if (period === "30days" || period === "oy") {
      const past30 = new Date(Date.now() - 30 * 86400000);
      conditions.push(gte(biznesgoPosSales.createdAt, past30));
    } else if (req.query?.startDate && req.query?.endDate) {
      const start = new Date(String(req.query.startDate));
      const end = new Date(String(req.query.endDate));
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        conditions.push(gte(biznesgoPosSales.createdAt, start), lte(biznesgoPosSales.createdAt, end));
      }
    }

    // 1. Sotuvlarni olish
    const salesRows = await db
      .select()
      .from(biznesgoPosSales)
      .where(and(...conditions))
      .orderBy(desc(biznesgoPosSales.createdAt), desc(biznesgoPosSales.id))
      .limit(limit)
      .offset(offset);

    // 2. Ushbu sotuvlar tarkibidagi mahsulotlarni olish
    const saleIds = salesRows.map((s) => s.id);
    const itemsBySale = new Map<number, Array<typeof biznesgoPosSaleItems.$inferSelect>>();

    if (saleIds.length > 0) {
      const itemRows = await db
        .select()
        .from(biznesgoPosSaleItems)
        .where(inArray(biznesgoPosSaleItems.saleId, saleIds));

      for (const it of itemRows) {
        const list = itemsBySale.get(it.saleId) || [];
        list.push(it);
        itemsBySale.set(it.saleId, list);
      }
    }

    const sales = salesRows.map((s) => ({
      ...s,
      finalAmount: s.finalAmount || Math.max(0, s.totalAmount - (s.discountAmount || s.discount || 0)),
      paymentMethod: s.paymentMethod || s.paymentType,
      items: itemsBySale.get(s.id) || [],
    }));

    return res.json({
      ok: true,
      sales,
      pagination: {
        page,
        limit,
        total: sales.length,
      },
    });
  } catch (err) {
    console.error("[biznesgo:pos:sales:get error]:", err);
    return res.status(500).json({ ok: false, error: "Sotuvlar ro'yxatini yuklashda server xatosi yuz berdi" });
  }
});

/**
 * 4. GET /api/biznesgo/pos/sales/:id
 * - Sotuv tafsilotlari, mahsulotlar ro'yxati, mijoz ma'lumotlari va bog'langan qarz.
 * - Ownership tekshiruvi (403).
 */
router.get("/pos/sales/:id", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const saleId = Number(req.params.id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return res.status(400).json({ ok: false, error: "Sotuv ID raqami noto'g'ri" });
    }

    const [sale] = await db
      .select()
      .from(biznesgoPosSales)
      .where(eq(biznesgoPosSales.id, saleId))
      .limit(1);

    if (!sale) {
      return res.status(404).json({ ok: false, error: "Sotuv topilmadi" });
    }

    if (sale.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli sotuvni ko'rish taqiqlangan",
      });
    }

    const items = await db
      .select()
      .from(biznesgoPosSaleItems)
      .where(eq(biznesgoPosSaleItems.saleId, sale.id));

    let customer: typeof biznesgoCustomers.$inferSelect | null = null;
    if (sale.customerId) {
      const [c] = await db
        .select()
        .from(biznesgoCustomers)
        .where(eq(biznesgoCustomers.id, sale.customerId))
        .limit(1);
      customer = c || null;
    }

    let debt: typeof biznesgoDebts.$inferSelect | null = null;
    if (sale.debtId) {
      const [d] = await db
        .select()
        .from(biznesgoDebts)
        .where(eq(biznesgoDebts.id, sale.debtId))
        .limit(1);
      debt = d || null;
    }

    return res.json({
      ok: true,
      sale: {
        ...sale,
        finalAmount: sale.finalAmount || Math.max(0, sale.totalAmount - (sale.discountAmount || sale.discount || 0)),
        paymentMethod: sale.paymentMethod || sale.paymentType,
        items,
        customer,
        debt,
      },
    });
  } catch (err) {
    console.error("[biznesgo:pos:sales:get:id error]:", err);
    return res.status(500).json({ ok: false, error: "Sotuv ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

/**
 * 5. PATCH /api/biznesgo/pos/sales/:id/cancel
 * - Sotuvni bekor qilish.
 * - Faqat completed sotuv bekor qilinishi mumkin.
 * - Bekor qilinganda har bir mahsulot qoldig'i qaytariladi.
 * - Nasiya bo'lsa va bog'langan qarz hali to'lanmagan bo'lsa:
 *   - Qarz cancelled qilinadi.
 *   - Agar qarzga to'lov qilingan bo'lsa: bekor qilish bloklanadi (400).
 * - Ownership tekshiruvi (403).
 */
router.patch("/pos/sales/:id/cancel", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const saleId = Number(req.params.id);

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return res.status(400).json({ ok: false, error: "Sotuv ID raqami noto'g'ri" });
    }

    const [sale] = await db
      .select()
      .from(biznesgoPosSales)
      .where(eq(biznesgoPosSales.id, saleId))
      .limit(1);

    if (!sale) {
      return res.status(404).json({ ok: false, error: "Sotuv topilmadi" });
    }

    if (sale.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli sotuvni bekor qilish taqiqlangan",
      });
    }

    if (sale.status === "cancelled") {
      return res.status(400).json({ ok: false, error: "Ushbu sotuv allaqachon bekor qilingan" });
    }

    // Agar Nasiya savdosi bo'lsa va qarz bog'langan bo'lsa:
    if (sale.debtId) {
      const [debt] = await db
        .select()
        .from(biznesgoDebts)
        .where(eq(biznesgoDebts.id, sale.debtId))
        .limit(1);

      if (debt) {
        if (debt.paidAmount > 0) {
          return res.status(400).json({
            ok: false,
            error: `Ushbu nasiya sotuviga ${debt.paidAmount.toLocaleString()} so'm to'lov qabul qilingan. Sotuvni bekor qilishdan avval to'lovlarni tekshiring yoki bekor qiling`,
          });
        }

        // Qarzni bekor qilamiz
        await db
          .update(biznesgoDebts)
          .set({
            status: "cancelled",
            updatedAt: new Date(),
          })
          .where(eq(biznesgoDebts.id, debt.id));
      }
    }

    // Mahsulotlar qoldig'ini qaytarish
    const items = await db
      .select()
      .from(biznesgoPosSaleItems)
      .where(eq(biznesgoPosSaleItems.saleId, sale.id));

    for (const item of items) {
      if (item.productId) {
        const [prod] = await db
          .select({ id: biznesgoProducts.id, stock: biznesgoProducts.stock, status: biznesgoProducts.status })
          .from(biznesgoProducts)
          .where(eq(biznesgoProducts.id, item.productId))
          .limit(1);

        if (prod) {
          const restoredStock = prod.stock + item.quantity;
          const restoredStatus = prod.status === "archived" ? "archived" : restoredStock > 0 ? "active" : "out_of_stock";

          await db
            .update(biznesgoProducts)
            .set({
              stock: restoredStock,
              status: restoredStatus,
              updatedAt: new Date(),
            })
            .where(eq(biznesgoProducts.id, prod.id));
        }
      }
    }

    // Sotuvni cancelled qilish
    const [updatedSale] = await db
      .update(biznesgoPosSales)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(biznesgoPosSales.id, sale.id))
      .returning();

    return res.json({
      ok: true,
      message: "Sotuv muvaffaqiyatli bekor qilindi va ombor qoldig'i qaytarildi",
      sale: updatedSale,
    });
  } catch (err) {
    console.error("[biznesgo:pos:sales:cancel error]:", err);
    return res.status(500).json({ ok: false, error: "Sotuvni bekor qilishda server xatosi yuz berdi" });
  }
});

export default router;
