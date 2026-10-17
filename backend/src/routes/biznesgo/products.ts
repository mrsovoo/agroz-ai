import { Router } from "express";
import { and, desc, eq, gt, ilike, lte, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { biznesgoProducts } from "../../db/schema.js";
import { requireBiznesGoMerchant, type BiznesGoRequest } from "./middleware.js";
import {
  isValidProductCategory,
  isValidProductStatus,
  isValidProductUnit,
  resolveProductStatusFromStock,
  validateAndPrepareProductImage,
  validateCreateProductPayload,
} from "../../lib/biznesgo-products.js";

const router = Router();

/**
 * 1. GET /api/biznesgo/products
 * - Faqat token bilan kirgan sotuvchining mahsulotlari qaytadi.
 * - Qidiruv: nom bo'yicha (?search=... yoki ?q=...).
 * - Filtr: kategoriya (?category=...), status (?status=all|active|low_stock|out_of_stock|archived), kam qolgan (?lowStock=true).
 * - Sahifalash (?page=1&limit=20).
 */
router.get(["/products", "/medicines"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;

    // Agar query orqali boshqa merchant_id so'ralgan bo'lsa -> 403
    const requestedMerchantId = req.query?.merchantId ?? req.query?.merchant_id;
    if (
      requestedMerchantId !== undefined &&
      String(requestedMerchantId).trim() !== "" &&
      Number(requestedMerchantId) !== merchant.id
    ) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mahsulotlarni ko‘rish taqiqlangan",
      });
    }

    const search = String(req.query?.search ?? req.query?.q ?? "").trim();
    const category = String(req.query?.category ?? "").trim();
    const statusFilter = String(req.query?.status ?? "all").trim().toLowerCase();
    const lowStockOnly =
      req.query?.lowStock === "true" ||
      req.query?.low_stock === "true" ||
      statusFilter === "low_stock" ||
      statusFilter === "kam";

    const page = Math.max(1, Number(req.query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(biznesgoProducts.merchantId, merchant.id)];

    if (search) {
      conditions.push(ilike(biznesgoProducts.name, `%${search}%`));
    }

    if (category && category !== "all" && isValidProductCategory(category)) {
      conditions.push(eq(biznesgoProducts.category, category));
    }

    if (statusFilter === "archived" || statusFilter === "arxiv") {
      conditions.push(eq(biznesgoProducts.status, "archived"));
    } else if (lowStockOnly) {
      conditions.push(
        ne(biznesgoProducts.status, "archived"),
        gt(biznesgoProducts.stock, 0),
        lte(biznesgoProducts.stock, biznesgoProducts.minStock),
      );
    } else if (statusFilter === "active" || statusFilter === "bor") {
      conditions.push(eq(biznesgoProducts.status, "active"), gt(biznesgoProducts.stock, 0));
    } else if (statusFilter === "out_of_stock" || statusFilter === "tugagan") {
      conditions.push(
        ne(biznesgoProducts.status, "archived"),
        or(eq(biznesgoProducts.status, "out_of_stock"), lte(biznesgoProducts.stock, 0)),
      );
    } else {
      // Oddiy ro'yxatda arxivlangan mahsulotlar ko'rinmaydi, lekin stock = 0 (out_of_stock) ko'rinadi
      conditions.push(ne(biznesgoProducts.status, "archived"));
    }

    const whereClause = and(...conditions);

    const [rows, countRows, allMerchantProducts] = await Promise.all([
      db
        .select()
        .from(biznesgoProducts)
        .where(whereClause)
        .orderBy(desc(biznesgoProducts.updatedAt), desc(biznesgoProducts.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(biznesgoProducts)
        .where(whereClause),
      db
        .select({
          stock: biznesgoProducts.stock,
          minStock: biznesgoProducts.minStock,
          status: biznesgoProducts.status,
        })
        .from(biznesgoProducts)
        .where(eq(biznesgoProducts.merchantId, merchant.id)),
    ]);

    const total = Number(countRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    let totalCount = 0;
    let activeCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let archivedCount = 0;

    for (const p of allMerchantProducts) {
      if (p.status === "archived") {
        archivedCount++;
      } else {
        totalCount++;
        if (p.stock <= 0 || p.status === "out_of_stock") {
          outOfStockCount++;
        } else {
          activeCount++;
          if (p.stock <= p.minStock) {
            lowStockCount++;
          }
        }
      }
    }

    return res.json({
      ok: true,
      products: rows,
      medicines: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      summary: {
        totalCount,
        activeCount,
        lowStockCount,
        outOfStockCount,
        archivedCount,
      },
    });
  } catch (err) {
    console.error("[biznesgo:products:get error]:", err);
    return res.status(500).json({ ok: false, error: "Mahsulotlarni yuklashda server xatosi yuz berdi" });
  }
});

/**
 * 2. POST /api/biznesgo/products
 * - Yangi mahsulot qo'shish.
 * - Validatsiya: nom, narx, birlik, qoldiq majburiy.
 * - Surat ixtiyoriy, hajmi tekshiriladi.
 */
router.post(["/products", "/medicines"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;

    const requestedMerchantId = req.body?.merchantId ?? req.body?.merchant_id;
    if (
      requestedMerchantId !== undefined &&
      String(requestedMerchantId).trim() !== "" &&
      Number(requestedMerchantId) !== merchant.id
    ) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchi nomidan mahsulot qo‘shish taqiqlangan",
      });
    }

    const validation = validateCreateProductPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ ok: false, error: validation.error });
    }

    const { name, category, description, price, unit, stock, minStock, imageUrl, status } =
      validation.data;

    const [created] = await db
      .insert(biznesgoProducts)
      .values({
        merchantId: merchant.id,
        name,
        category,
        description,
        price,
        unit,
        stock,
        minStock,
        imageUrl,
        status,
      })
      .returning();

    return res.status(201).json({
      ok: true,
      product: created,
      medicine: created,
      message: "Yangi mahsulot omborga muvaffaqiyatli qo‘shildi",
    });
  } catch (err) {
    console.error("[biznesgo:products:post error]:", err);
    return res.status(500).json({ ok: false, error: "Mahsulot qo‘shishda server xatosi yuz berdi" });
  }
});

/**
 * 3. GET /api/biznesgo/products/:id
 * - Faqat o'z mahsulotini qaytaradi. Boshqa merchant_id bo'lsa -> 403.
 */
router.get(["/products/:id", "/medicines/:id"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, error: "Mahsulot ID raqami noto‘g‘ri" });
    }

    const [product] = await db
      .select()
      .from(biznesgoProducts)
      .where(eq(biznesgoProducts.id, productId))
      .limit(1);

    if (!product) {
      return res.status(404).json({ ok: false, error: "Mahsulot topilmadi" });
    }

    if (product.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mahsulotga kirish taqiqlangan",
      });
    }

    return res.json({ ok: true, product });
  } catch (err) {
    console.error("[biznesgo:products:getById error]:", err);
    return res.status(500).json({ ok: false, error: "Mahsulotni yuklashda server xatosi yuz berdi" });
  }
});

/**
 * 4. PATCH /api/biznesgo/products/:id
 * - Mahsulotni tahrirlash: nom, kategoriya, narx, birlik, qoldiq, min_stock, izoh, surat va status to'liq saqlanadi.
 */
router.patch(["/products/:id", "/medicines/:id"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, error: "Mahsulot ID raqami noto‘g‘ri" });
    }

    const [existing] = await db
      .select()
      .from(biznesgoProducts)
      .where(eq(biznesgoProducts.id, productId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Mahsulot topilmadi" });
    }

    if (existing.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mahsulotni tahrirlash taqiqlangan",
      });
    }

    const body = req.body || {};
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (body.name !== undefined) {
      const cleanName = typeof body.name === "string" ? body.name.trim() : "";
      if (cleanName.length < 2) {
        return res.status(400).json({
          ok: false,
          error: "Mahsulot nomi kamida 2 ta belgidan iborat bo‘lishi shart",
        });
      }
      if (cleanName.length > 200) {
        return res.status(400).json({
          ok: false,
          error: "Mahsulot nomi 200 ta belgidan oshmasligi kerak",
        });
      }
      updates.name = cleanName;
    }

    if (body.category !== undefined) {
      const cleanCat = typeof body.category === "string" ? body.category.trim() : "";
      if (!isValidProductCategory(cleanCat)) {
        return res.status(400).json({ ok: false, error: "Noto‘g‘ri mahsulot kategoriyasi tanlandi" });
      }
      updates.category = cleanCat;
    }

    if (body.price !== undefined) {
      const parsedPrice = Number(body.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({
          ok: false,
          error: "Mahsulot narxi 0 dan katta son bo‘lishi kerak",
        });
      }
      updates.price = Math.round(parsedPrice);
    }

    if (body.unit !== undefined) {
      const cleanUnit = typeof body.unit === "string" ? body.unit.trim().toLowerCase() : "";
      if (!isValidProductUnit(cleanUnit)) {
        return res.status(400).json({ ok: false, error: "Mahsulot o‘lchov birligi noto‘g‘ri" });
      }
      updates.unit = cleanUnit;
    }

    let nextStock = existing.stock;
    if (body.stock !== undefined) {
      const parsedStock = Number(body.stock);
      if (!Number.isFinite(parsedStock) || parsedStock < 0) {
        return res.status(400).json({
          ok: false,
          error: "Ombor qoldig‘i 0 yoki undan katta son bo‘lishi kerak",
        });
      }
      nextStock = Math.floor(parsedStock);
      updates.stock = nextStock;
    }

    const rawMinStock = body.minStock ?? body.min_stock;
    if (rawMinStock !== undefined) {
      const parsedMin = Number(rawMinStock);
      if (!Number.isFinite(parsedMin) || parsedMin < 0) {
        return res.status(400).json({
          ok: false,
          error: "Minimal qoldiq chegarasi 0 yoki undan katta son bo‘lishi kerak",
        });
      }
      updates.minStock = Math.floor(parsedMin);
    }

    if (body.description !== undefined) {
      updates.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim().slice(0, 1000)
          : null;
    }

    const rawImage =
      body.imageUrl !== undefined
        ? body.imageUrl
        : body.image_url !== undefined
          ? body.image_url
          : body.image;
    if (rawImage !== undefined) {
      const imgResult = validateAndPrepareProductImage(rawImage);
      if (!imgResult.ok) {
        return res.status(400).json({ ok: false, error: imgResult.error });
      }
      updates.imageUrl = imgResult.imageUrl;
    }

    if (body.status !== undefined) {
      if (!isValidProductStatus(body.status)) {
        return res.status(400).json({ ok: false, error: "Mahsulot statusi noto‘g‘ri" });
      }
      if (body.status === "archived") {
        updates.status = "archived";
      } else {
        updates.status = resolveProductStatusFromStock(nextStock, body.status);
      }
    } else if (body.stock !== undefined && existing.status !== "archived") {
      updates.status = resolveProductStatusFromStock(nextStock);
    }

    const [updated] = await db
      .update(biznesgoProducts)
      .set(updates)
      .where(and(eq(biznesgoProducts.id, productId), eq(biznesgoProducts.merchantId, merchant.id)))
      .returning();

    return res.json({
      ok: true,
      product: updated,
      medicine: updated,
      message: "Mahsulot ma‘lumotlari muvaffaqiyatli saqlandi",
    });
  } catch (err) {
    console.error("[biznesgo:products:patch error]:", err);
    return res.status(500).json({ ok: false, error: "Mahsulotni saqlashda server xatosi yuz berdi" });
  }
});

/**
 * 5. DELETE /api/biznesgo/products/:id
 * - Mahsulotni butunlay o'chirmasdan status = 'archived' qiladi.
 */
router.delete(["/products/:id", "/medicines/:id"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, error: "Mahsulot ID raqami noto‘g‘ri" });
    }

    const [existing] = await db
      .select()
      .from(biznesgoProducts)
      .where(eq(biznesgoProducts.id, productId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Mahsulot topilmadi" });
    }

    if (existing.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mahsulotni o‘chirish taqiqlangan",
      });
    }

    const [archived] = await db
      .update(biznesgoProducts)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(and(eq(biznesgoProducts.id, productId), eq(biznesgoProducts.merchantId, merchant.id)))
      .returning();

    return res.json({
      ok: true,
      product: archived,
      message: "Mahsulot arxivga o‘tkazildi",
    });
  } catch (err) {
    console.error("[biznesgo:products:delete error]:", err);
    return res.status(500).json({ ok: false, error: "Mahsulotni arxivlashda server xatosi yuz berdi" });
  }
});

/**
 * 6. PATCH /api/biznesgo/products/:id/stock
 * - Qoldiqni tez o'zgartirish (stock yoki delta/adjustment orqali).
 * - Qoldiq 0 bo'lsa status = 'out_of_stock' bo'ladi va mahsulot ro'yxatdan yo'qolmaydi.
 * - Qoldiq 0 dan kattaga o'tsa status = 'active' bo'ladi.
 */
router.patch(["/products/:id/stock", "/medicines/:id/stock"], requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = req.merchant!;
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ ok: false, error: "Mahsulot ID raqami noto‘g‘ri" });
    }

    const [existing] = await db
      .select()
      .from(biznesgoProducts)
      .where(eq(biznesgoProducts.id, productId))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ ok: false, error: "Mahsulot topilmadi" });
    }

    if (existing.merchantId !== merchant.id) {
      return res.status(403).json({
        ok: false,
        error: "Boshqa sotuvchiga tegishli mahsulot qoldig‘ini o‘zgartirish taqiqlangan",
      });
    }

    const body = req.body || {};
    let nextStock: number;

    if (body.stock !== undefined && body.stock !== null && body.stock !== "") {
      const parsed = Number(body.stock);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({
          ok: false,
          error: "Ombor qoldig‘i 0 yoki undan katta son bo‘lishi kerak",
        });
      }
      nextStock = Math.floor(parsed);
    } else if (body.delta !== undefined || body.adjustment !== undefined) {
      const delta = Number(body.delta ?? body.adjustment);
      if (!Number.isFinite(delta)) {
        return res.status(400).json({
          ok: false,
          error: "Qoldiq o‘zgarishi son bo‘lishi kerak",
        });
      }
      nextStock = existing.stock + Math.trunc(delta);
      if (nextStock < 0) {
        return res.status(400).json({
          ok: false,
          error: "Ombor qoldig‘i 0 dan kam bo‘lishi mumkin emas",
        });
      }
    } else {
      return res.status(400).json({
        ok: false,
        error: "Yangi qoldiq (stock) yoki o‘zgarish miqdori (delta) kiritilishi shart",
      });
    }

    const nextStatus = resolveProductStatusFromStock(nextStock);

    const [updated] = await db
      .update(biznesgoProducts)
      .set({
        stock: nextStock,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(biznesgoProducts.id, productId), eq(biznesgoProducts.merchantId, merchant.id)))
      .returning();

    return res.json({
      ok: true,
      product: updated,
      message:
        nextStock === 0
          ? "Mahsulot qoldig‘i 0 ga tushdi (Tugagan)"
          : "Mahsulot qoldig‘i muvaffaqiyatli yangilandi",
    });
  } catch (err) {
    console.error("[biznesgo:products:stock error]:", err);
    return res.status(500).json({ ok: false, error: "Qoldiqni yangilashda server xatosi yuz berdi" });
  }
});

export default router;
