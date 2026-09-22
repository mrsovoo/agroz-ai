import { Router } from "express";
import { createOrder, rateOrder, type OrderInputItem } from "../lib/orders.js";
import { normalizePhone, cleanText } from "../lib/validate.js";
import { notifyPharmacyNewOrder } from "../lib/orders-bot.js";
import { db } from "../db/index.js";
import { orders, orderItems, specialists } from "../db/schema.js";
import { eq, desc, and, or, sql } from "drizzle-orm";

const router = Router();

// POST /api/orders
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const pharmacySpecialistId = Number(body.pharmacySpecialistId);
    if (!Number.isInteger(pharmacySpecialistId) || pharmacySpecialistId <= 0) {
      return res.status(400).json({ error: "Dorixona tanlanmagan" });
    }

    const name = cleanText(body.customerName, 120);
    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Ismingizni kiriting" });
    }

    const phone = normalizePhone(body.customerPhone);
    if (!phone) {
      return res.status(400).json({ error: "Telefon raqami noto'g'ri (+998...)" });
    }

    const deliveryType = body.deliveryType === "delivery" ? "delivery" : "pickup";
    const customerAddress = deliveryType === "delivery" ? cleanText(body.customerAddress, 300) : null;
    if (deliveryType === "delivery" && (!customerAddress || customerAddress.length < 3)) {
      return res.status(400).json({ error: "Yetkazib berish manzilini kiriting" });
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: "Savat bo'sh" });
    }

    const rawItems: OrderInputItem[] = [];
    for (const it of body.items) {
      const medicineId = Number(it?.medicineId);
      const qty = Math.max(1, Math.min(99, Math.round(Number(it?.qty)) || 1));
      if (Number.isInteger(medicineId) && medicineId > 0) {
        rawItems.push({ medicineId, qty });
      }
    }
    if (rawItems.length === 0) {
      return res.status(400).json({ error: "Savatda yaroqli dori yo'q" });
    }

    const result = await createOrder({
      userId: null,
      pharmacySpecialistId,
      customerName: name,
      customerPhone: phone,
      note: cleanText(body.note, 300) ?? null,
      deliveryType,
      customerAddress,
      items: rawItems,
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    // Telegram orqali dorixonaga xabar
    if (result.pharmacy.telegramId) {
      notifyPharmacyNewOrder(result.pharmacy.telegramId, {
        id: result.orderId,
        customerName: name,
        customerPhone: phone,
        note: cleanText(body.note, 300) ?? null,
        deliveryType,
        customerAddress: deliveryType === "delivery" ? customerAddress ?? null : null,
        total: result.total,
        items: result.items,
      }).catch((err) => console.error("[orders] bot xabari yuborilmadi:", err));
    } else {
      console.warn(`[orders] Dorixona (#${result.pharmacy.id}) uchun telegramId mavjud emas`);
    }

    res.json({
      ok: true,
      orderId: result.orderId,
      total: result.total,
      deliveryType,
      customerAddress: deliveryType === "delivery" ? customerAddress : undefined,
      pharmacy: {
        id: result.pharmacy.id,
        name: result.pharmacy.name,
        phone: result.pharmacy.phone,
        address: result.pharmacy.address,
      },
    });
  } catch (err: any) {
    console.error("[orders error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/orders/track
router.get("/track", async (req, res) => {
  try {
    const raw = (req.query.phone as string) || "";
    const clean = raw.replace(/\D/g, "");
    if (!clean || clean.length < 7) {
      return res.status(400).json({ error: "Telefon raqamni to'liq kiriting" });
    }

    const suffix = clean.slice(-9);

    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        totalSum: orders.totalSum,
        createdAt: orders.createdAt,
        pharmacySpecialistId: orders.pharmacySpecialistId,
        pharmacyName: specialists.organization,
        pharmacyContact: specialists.name,
        pharmacyPhone: specialists.phone,
        ratingStars: orders.ratingStars,
      })
      .from(orders)
      .leftJoin(specialists, eq(specialists.id, orders.pharmacySpecialistId))
      .where(sql`replace(replace(${orders.customerPhone}, '+', ''), ' ', '') like ${'%' + suffix}`)
      .orderBy(desc(orders.id))
      .limit(10);

    if (orderRows.length === 0) {
      return res.json({ orders: [] });
    }

    const orderIds = orderRows.map((o) => o.id);
    const itemRows = await db
      .select({
        orderId: orderItems.orderId,
        medicineId: orderItems.medicineId,
        name: orderItems.name,
        qty: orderItems.qty,
        price: orderItems.price,
      })
      .from(orderItems)
      .where(sql`${orderItems.orderId} in (${sql.join(orderIds.map((id) => sql`${id}`), sql`, `)})`);

    const itemsByOrder = new Map<number, { medicineId: number; name: string; qty: number; price: number | null }[]>();
    for (const it of itemRows) {
      const arr = itemsByOrder.get(it.orderId) ?? [];
      arr.push({ medicineId: it.medicineId, name: it.name, qty: it.qty, price: it.price });
      itemsByOrder.set(it.orderId, arr);
    }

    const result = orderRows.map((o) => ({
      id: o.id,
      status: o.status,
      totalSum: o.totalSum,
      pharmacyName: o.pharmacyName || o.pharmacyContact || "Dorixona",
      pharmacyPhone: o.pharmacyPhone,
      createdAt: o.createdAt,
      ratingStars: o.ratingStars,
      items: itemsByOrder.get(o.id) ?? [],
    }));

    res.json({ orders: result });
  } catch (err: any) {
    console.error("[track error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/orders/rate
router.post("/rate", async (req, res) => {
  try {
    const body = req.body || {};
    const orderId = Number(body.orderId);
    const customerPhone = normalizePhone(body.customerPhone);
    const stars = Number(body.stars);
    const note = cleanText(body.note, 300);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: "Buyurtma ID noto'g'ri" });
    }
    if (!customerPhone) {
      return res.status(400).json({ error: "Telefon raqami kiritilmagan" });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Baho 1 dan 5 gacha bo'lishi kerak" });
    }

    const result = await rateOrder(orderId, customerPhone, stars, note ?? null);
    if (!result.ok) {
      return res.status(400).json({ error: result.error || "Buyurtma topilmadi yoki bu raqamga tegishli emas" });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[order rate error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
