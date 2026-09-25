import { Router } from "express";
import { db } from "../db/index.js";
import { sessions, users, diagnoses, orders, specialistCalls, specialists, orderItems } from "../db/schema.js";
import { eq, desc, or, sql } from "drizzle-orm";
import { cleanText } from "../lib/validate.js";

const router = Router();

async function getUserFromReq(req: any) {
  const authHeader = req.headers.authorization;
  const cookieSession = req.headers.cookie
    ?.split(";")
    .find((c: string) => c.trim().startsWith("agroai_session=") || c.trim().startsWith("agroz_session="))
    ?.split("=")[1];
  const sessionId =
    authHeader?.replace("Bearer ", "") ||
    req.cookies?.agroai_session ||
    req.cookies?.agroz_session ||
    cookieSession;
  if (!sessionId) return null;

  const s = (await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1))[0];
  if (!s) return null;

  const u = (await db.select().from(users).where(eq(users.id, s.userId)).limit(1))[0];
  return u ?? null;
}

// GET /api/profile
router.get("/", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Avval tizimga kiring" });
    }

    const recentDiagnoses = await db
      .select()
      .from(diagnoses)
      .where(eq(diagnoses.userId, user.id))
      .orderBy(desc(diagnoses.id))
      .limit(10);

    res.json({ ok: true, user, diagnoses: recentDiagnoses });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/profile
router.post("/", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Avval tizimga kiring" });
    }

    const body = req.body || {};
    const name = cleanText(body.name, 120);
    const region = cleanText(body.region, 120);
    const district = cleanText(body.district, 120);

    const updated = await db
      .update(users)
      .set({
        name: name ?? user.name,
        region: region ?? user.region,
        district: district ?? user.district,
      })
      .where(eq(users.id, user.id))
      .returning();

    res.json({ ok: true, user: updated[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// DELETE /api/profile — foydalanuvchi profilini o'chirish
router.delete("/", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Avval tizimga kiring" });
    }

    // Barcha sessionlarni o'chirish
    await db.delete(sessions).where(eq(sessions.userId, user.id));

    // Foydalanuvchini o'chirish
    await db.delete(users).where(eq(users.id, user.id));

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/profile/activity — foydalanuvchining buyurtmalari va mutaxassis chaqiruvlari
router.get("/activity", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    const phoneQuery = (req.query.phone as string)?.trim();
    let targetPhone = user?.phone || phoneQuery || "";

    const { orders, orderItems, specialistCalls, specialists } = await import("../db/schema.js");
    const { or, and, sql } = await import("drizzle-orm");

    // Agar user bor lekin telefoni yo'q bo'lsa, mutaxassislar yoki buyurtmalardan telefonini aniqlaymiz
    if (user && !targetPhone && user.telegramId) {
      const [spec] = await db
        .select({ phone: specialists.phone })
        .from(specialists)
        .where(eq(specialists.telegramId, user.telegramId))
        .limit(1);
      if (spec?.phone) {
        targetPhone = spec.phone;
        await db.update(users).set({ phone: spec.phone }).where(eq(users.id, user.id));
      }
    }

    // Telefon raqamdan faqat oxirgi 9 ta raqamni olish
    let cleanDigits = targetPhone ? targetPhone.replace(/\D/g, "").slice(-9) : "";

    // Agar hali ham cleanDigits bo'lmasa lekin user.id bo'lsa, user buyurtmalaridan oxirgi telefonni olamiz
    if (!cleanDigits && user?.id) {
      const [latestOrder] = await db
        .select({ customerPhone: orders.customerPhone })
        .from(orders)
        .where(eq(orders.userId, user.id))
        .orderBy(desc(orders.id))
        .limit(1);
      if (latestOrder?.customerPhone) {
        cleanDigits = latestOrder.customerPhone.replace(/\D/g, "").slice(-9);
        await db.update(users).set({ phone: latestOrder.customerPhone }).where(eq(users.id, user.id));
      }
    }

    // Foydalanuvchi buyurtmalarini uning hisobiga (userId) bog'lab qo'yish
    if (user?.id && cleanDigits) {
      await db
        .update(orders)
        .set({ userId: user.id })
        .where(
          and(
            sql`${orders.userId} IS NULL`,
            sql`RIGHT(REPLACE(${orders.customerPhone}, ' ', ''), 9) = ${cleanDigits}`
          )
        );
    }

    if (!user && !cleanDigits) {
      return res.json({ ok: true, orders: [], specialistCalls: [] });
    }

    // 1. Buyurtmalarni olish
    let userOrders: any[] = [];
    const orderConditions = [];
    if (user?.id) orderConditions.push(eq(orders.userId, user.id));
    if (cleanDigits) {
      orderConditions.push(sql`RIGHT(REPLACE(${orders.customerPhone}, ' ', ''), 9) = ${cleanDigits}`);
    }

    if (orderConditions.length > 0) {
      const rawOrders = await db
        .select()
        .from(orders)
        .where(or(...orderConditions))
        .orderBy(desc(orders.createdAt))
        .limit(30);

      const allItems = await db.select().from(orderItems);
      const allSpecialists = await db.select().from(specialists);
      const specMap = new Map<number, (typeof allSpecialists)[0]>();
      for (const s of allSpecialists) specMap.set(s.id, s);

      const itemsMap = new Map<number, (typeof allItems)>();
      for (const it of allItems) {
        const arr = itemsMap.get(it.orderId) || [];
        arr.push(it);
        itemsMap.set(it.orderId, arr);
      }

      userOrders = rawOrders.map((o) => {
        const pharmacy = specMap.get(o.pharmacySpecialistId);
        return {
          id: o.id,
          pharmacyName: pharmacy?.organization || pharmacy?.name || "Agro Dorixona",
          pharmacyPhone: pharmacy?.phone || null,
          deliveryType: o.deliveryType,
          customerAddress: o.customerAddress,
          totalSum: o.totalSum || 0,
          status: o.status,
          createdAt: o.createdAt,
          items: (itemsMap.get(o.id) || []).map((it) => ({
            name: it.name,
            price: it.price || 0,
            qty: it.qty,
          })),
        };
      });
    }

    // 2. Mutaxassis chaqiruvlarini olish
    let userCalls: any[] = [];
    if (cleanDigits) {
      const rawCalls = await db
        .select()
        .from(specialistCalls)
        .where(sql`RIGHT(REPLACE(${specialistCalls.customerPhone}, ' ', ''), 9) = ${cleanDigits}`)
        .orderBy(desc(specialistCalls.createdAt))
        .limit(30);

      const allSpecialists = await db.select().from(specialists);
      const specMap = new Map<number, (typeof allSpecialists)[0]>();
      for (const s of allSpecialists) specMap.set(s.id, s);

      userCalls = rawCalls.map((c) => {
        const spec = specMap.get(c.specialistId);
        return {
          id: c.id,
          specialistName: spec?.name || "Mutaxassis",
          specialistPhone: spec?.phone || null,
          specialistSpecialty: spec?.specialty || (spec?.role === "pharmacy" ? "Dorixona" : "Mutaxassis"),
          problem: c.problem,
          address: c.address,
          status: c.status,
          createdAt: c.createdAt,
        };
      });
    }

    res.json({
      ok: true,
      orders: userOrders,
      specialistCalls: userCalls,
    });
  } catch (err: any) {
    console.error("[profile/activity error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
