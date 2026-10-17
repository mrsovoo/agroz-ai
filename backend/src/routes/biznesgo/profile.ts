import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { biznesgoMerchants } from "../../db/schema.js";
import {
  BIZNESGO_MERCHANT_TYPES,
  BiznesGoMerchantType,
} from "../../lib/biznesgo-auth.js";
import {
  BiznesGoRequest,
  ensureSameMerchant,
  requireBiznesGoMerchant,
} from "./middleware.js";
import { cleanStr } from "./helpers.js";

const router = Router();

/**
 * GET /api/biznesgo/profile
 * Sotuvchi faqat o'z profilini ko'radi.
 */
router.get("/profile", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = ensureSameMerchant(req, res);
    if (!merchant) return;

    const [fresh] = await db
      .select()
      .from(biznesgoMerchants)
      .where(eq(biznesgoMerchants.id, merchant.id))
      .limit(1);

    if (!fresh) {
      return res.status(404).json({ ok: false, error: "Sotuvchi profili topilmadi" });
    }

    return res.json({
      ok: true,
      merchant: {
        id: fresh.id,
        telegramId: fresh.telegramId,
        phone: fresh.phone,
        name: fresh.name,
        organizationName: fresh.organizationName,
        merchantType: fresh.merchantType,
        region: fresh.region,
        district: fresh.district,
        address: fresh.address,
        latitude: fresh.latitude,
        longitude: fresh.longitude,
        workingHours: fresh.workingHours,
        deliveryAvailable: fresh.deliveryAvailable,
        status: fresh.status,
        createdAt: fresh.createdAt.toISOString(),
        updatedAt: fresh.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[biznesgo:profile:get error]:", err);
    return res.status(500).json({ ok: false, error: "Profilni yuklashda xatolik yuz berdi" });
  }
});

/**
 * PATCH /api/biznesgo/profile
 * Sotuvchi faqat o'z profilini tahrirlaydi.
 * Boshqa merchant_id ko'rsatilsa 403 qaytariladi.
 */
router.patch("/profile", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const merchant = ensureSameMerchant(req, res);
    if (!merchant) return;

    const {
      name,
      organizationName,
      phone,
      merchantType,
      region,
      district,
      address,
      workingHours,
      deliveryAvailable,
      latitude,
      longitude,
    } = req.body || {};

    const updates: Record<string, any> = { updatedAt: new Date() };

    if (name !== undefined) {
      const cleanN = cleanStr(name, 120);
      if (!cleanN) {
        return res.status(400).json({ ok: false, error: "Ism bo'sh bo'lishi mumkin emas" });
      }
      updates.name = cleanN;
    }

    if (organizationName !== undefined) {
      const cleanO = cleanStr(organizationName, 200);
      if (!cleanO) {
        return res.status(400).json({ ok: false, error: "Tashkilot nomi bo'sh bo'lishi mumkin emas" });
      }
      updates.organizationName = cleanO;
    }

    if (phone !== undefined) {
      const cleanP = cleanStr(phone, 32);
      if (!cleanP || cleanP.replace(/\D/g, "").length < 9) {
        return res.status(400).json({ ok: false, error: "Telefon raqami noto'g'ri" });
      }
      updates.phone = cleanP;
    }

    if (merchantType !== undefined) {
      const cleanType = String(merchantType || "").trim() as BiznesGoMerchantType;
      if (!BIZNESGO_MERCHANT_TYPES.includes(cleanType)) {
        return res.status(400).json({ ok: false, error: "Do'kon turi noto'g'ri tanlandi" });
      }
      updates.merchantType = cleanType;
    }

    if (region !== undefined) updates.region = cleanStr(region, 100) || null;
    if (district !== undefined) updates.district = cleanStr(district, 100) || null;
    if (address !== undefined) updates.address = cleanStr(address, 500) || null;
    if (workingHours !== undefined) updates.workingHours = cleanStr(workingHours, 100) || null;
    if (deliveryAvailable !== undefined) updates.deliveryAvailable = Boolean(deliveryAvailable);
    if (latitude !== undefined) updates.latitude = typeof latitude === "number" ? latitude : null;
    if (longitude !== undefined) updates.longitude = typeof longitude === "number" ? longitude : null;

    const [updated] = await db
      .update(biznesgoMerchants)
      .set(updates)
      .where(eq(biznesgoMerchants.id, merchant.id))
      .returning();

    return res.json({
      ok: true,
      merchant: {
        id: updated.id,
        telegramId: updated.telegramId,
        phone: updated.phone,
        name: updated.name,
        organizationName: updated.organizationName,
        merchantType: updated.merchantType,
        region: updated.region,
        district: updated.district,
        address: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
        workingHours: updated.workingHours,
        deliveryAvailable: updated.deliveryAvailable,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[biznesgo:profile:patch error]:", err);
    return res.status(500).json({ ok: false, error: "Profilni yangilashda xatolik yuz berdi" });
  }
});

export default router;
