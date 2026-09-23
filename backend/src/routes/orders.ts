import { Router } from "express";
import { createOrder, rateOrder, type OrderInputItem } from "../lib/orders.js";
import { normalizePhone, cleanText } from "../lib/validate.js";
import { notifyPharmacyNewOrder, notifyPharmacyStockAlert } from "../lib/orders-bot.js";
import { db } from "../db/index.js";
import { orders, orderItems, specialists, sessions, users } from "../db/schema.js";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { getDeliverySettings } from "../lib/settings.js";

const router = Router();

async function getUserFromReq(req: any) {
  const authHeader = req.headers.authorization;
  const cookieSession = req.headers.cookie
    ?.split(";")
    .find((c: string) => c.trim().startsWith("agroz_session="))
    ?.split("=")[1];
  const sessionId = authHeader?.replace("Bearer ", "") || cookieSession;
  if (!sessionId) return null;

  const s = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1))[0];
  if (!s) return null;

  const u = (await db.select().from(users).where(eq(users.id, s.userId)).limit(1))[0];
  return u ?? null;
}

// GET /api/orders/delivery-config
router.get("/delivery-config", async (_req, res) => {
  try {
    const config = await getDeliverySettings();
    res.json({ ok: true, config });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Xatolik" });
  }
});

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

    const deliveryConfig = await getDeliverySettings();
    if (deliveryType === "delivery" && !deliveryConfig.enabled) {
      return res.status(400).json({ error: "Hozirda yetkazib berish xizmati vaqtincha faol emas. Iltimos, dorixonadan olib ketishni tanlang." });
    }

    const totalQty = rawItems.reduce((acc, it) => acc + it.qty, 0);
    const isFreeDelivery = totalQty >= deliveryConfig.minOrderQty;
    let combinedNote = cleanText(body.note, 300) ?? "";
    if (deliveryType === "delivery") {
      const deliveryStatusNote = isFreeDelivery
        ? `🚚 Yetkazib berish: BEPUL (${totalQty} ta dori buyurtma qilindi)`
        : `🚚 Yetkazib berish: har 1 km uchun ${deliveryConfig.pricePerKm} so'm (bepul bo'lishi uchun kamida ${deliveryConfig.minOrderQty} ta dori kerak)`;
      combinedNote = combinedNote ? `${combinedNote}\n${deliveryStatusNote}` : deliveryStatusNote;
    }

    const user = await getUserFromReq(req);
    let userId = user?.id ?? null;
    const cleanCustomerDigits = phone.replace(/\D/g, "").slice(-9);

    if (!userId) {
      const [existingUser] = await db
        .select({ id: users.id, telegramId: users.telegramId, phone: users.phone })
        .from(users)
        .where(sql`RIGHT(REPLACE(${users.phone}, ' ', ''), 9) = ${cleanCustomerDigits}`)
        .limit(1);
      if (existingUser) {
        userId = existingUser.id;
      }
    }

    if (user && !user.phone) {
      await db.update(users).set({ phone }).where(eq(users.id, user.id));
      user.phone = phone;
    }

    const result = await createOrder({
      userId,
      pharmacySpecialistId,
      customerName: name,
      customerPhone: phone,
      note: combinedNote || null,
      deliveryType,
      customerAddress,
      items: rawItems,
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    // Telegram orqali dorixonaga xabar (@agroz_auth_bot)
    if (result.pharmacy.telegramId) {
      notifyPharmacyNewOrder(Number(result.pharmacy.telegramId), {
        id: result.orderId,
        customerName: name,
        customerPhone: phone,
        note: cleanText(body.note, 300) ?? null,
        deliveryType,
        customerAddress: deliveryType === "delivery" ? customerAddress ?? null : null,
        total: result.total,
        items: result.items,
      }).catch((err) => console.error("[orders] bot xabari yuborilmadi:", err));

      if (result.stockAlerts && result.stockAlerts.length > 0) {
        for (const alert of result.stockAlerts) {
          notifyPharmacyStockAlert(
            Number(result.pharmacy.telegramId),
            alert.medName,
            alert.remainingStock,
            alert.stockUnit,
          ).catch((err) => console.error("[orders] stock alert xatosi:", err));
        }
      }
    } else {
      console.warn(`[orders] Dorixona (#${result.pharmacy.id}) uchun telegramId mavjud emas`);
    }

    // Xaridorga Agroz AI bot (@agrozai_bot) orqali avtomatik kvitansiya xabarnomasi
    try {
      let customerTelegramId = user?.telegramId ?? null;

      if (!customerTelegramId && cleanCustomerDigits) {
        const [userRow] = await db
          .select({ telegramId: users.telegramId })
          .from(users)
          .where(sql`RIGHT(REPLACE(${users.phone}, ' ', ''), 9) = ${cleanCustomerDigits}`)
          .limit(1);
        if (userRow?.telegramId) {
          customerTelegramId = userRow.telegramId;
        }
      }

      if (customerTelegramId) {
        const { sendMessage, isBotConfigured } = await import("../lib/telegram-bot.js");
        if (await isBotConfigured()) {
          const itemsList = result.items
            .map((it: any) => `• ${it.name} — ${it.qty} dona (${(it.price || 0).toLocaleString()} so'm)`)
            .join("\n");

          const msgLines = [
            `🧾 <b>BUYURTMANGIZ QABUL QILINDI! (#${result.orderId})</b>`,
            "",
            `🏪 <b>Dorixona:</b> ${result.pharmacy.name}`,
            `📞 <b>Dorixona aloqa:</b> ${result.pharmacy.phone}`,
            "",
            `📦 <b>Buyurtma tarkibi:</b>`,
            itemsList,
            "",
            `💰 <b>Jami summa:</b> ${result.total.toLocaleString()} so'm`,
            deliveryType === "delivery"
              ? `🚚 <b>Yetkazib berish:</b> Kuryer orqali (${customerAddress || "Ko'rsatilgan manzil"})`
              : `🏬 <b>Olib ketish:</b> Dorixonadan o'zingiz olib ketasiz`,
            "",
            `<i>Dorixona tez orada buyurtmangizni tayyorlaydi va siz bilan bog'lanadi!</i>`,
          ];

          await sendMessage(Number(customerTelegramId), msgLines.join("\n"));
        }
      }
    } catch (e) {
      console.error("[orders] Customer telegram notify error:", e);
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
