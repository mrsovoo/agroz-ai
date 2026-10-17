import { Router } from "express";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { biznesgoMerchants, biznesgoSessions } from "../../db/schema.js";
import {
  BIZNESGO_MERCHANT_TYPES,
  BiznesGoMerchantType,
  createBiznesGoSession,
  findOrSyncMerchantByTelegramId,
  hashSessionToken,
  verifyBiznesGoInitData,
} from "../../lib/biznesgo-auth.js";
import { isPartnerDemoAllowed } from "../../lib/security-flags.js";
import { BiznesGoRequest, requireBiznesGoMerchant } from "./middleware.js";
import { cleanStr } from "./helpers.js";

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 30, // 1 daqiqada maksimal 30 ta auth urinishi
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Juda ko'p urinish. Iltimos, 1 daqiqadan so'ng qaytadan urinib ko'ring.",
  },
});

router.use("/auth", authRateLimiter);

/**
 * POST /api/biznesgo/auth/telegram
 * - Telegram initData server tomonida HMAC-SHA256 bilan tekshiriladi.
 * - Bot tokeni faqat BIZNESGO_BOT_TOKEN (yoki mavjud bot tokeni) orqali olinadi.
 * - initData tekshirilmasa, 401 qaytariladi.
 * - telegramId faqat tekshirilgan initData'dan olinadi, req.body'dan emas.
 */
router.post("/auth/telegram", async (req, res) => {
  try {
    const { initData } = req.body || {};
    if (!initData || typeof initData !== "string") {
      return res.status(401).json({
        ok: false,
        error: "Telegram initData yuborilmadi. Telegram ilovasi orqali kiring.",
      });
    }

    const verifiedUser = verifyBiznesGoInitData(initData);
    if (!verifiedUser || !verifiedUser.id) {
      return res.status(401).json({
        ok: false,
        error: "Telegram initData tasdiqlanmadi yoki muddati tugagan.",
      });
    }

    const telegramId = verifiedUser.id;

    // Sotuvchini bazadan qidirish (yoki @agroz_auth_bot specialists jadvalidan avtomatik ko'chirish)
    const merchant = await findOrSyncMerchantByTelegramId(telegramId);

    if (!merchant) {
      // Sotuvchi hali ro'yxatdan o'tmagan -> onboarding oqimini ochish uchun
      return res.json({
        ok: true,
        registered: false,
        telegramUser: {
          id: verifiedUser.id,
          firstName: verifiedUser.first_name || "",
          lastName: verifiedUser.last_name || "",
          username: verifiedUser.username || "",
        },
      });
    }

    if (merchant.status === "blocked") {
      return res.status(403).json({
        ok: false,
        error: "Sotuvchi profili ma'muriyat tomonidan bloklangan.",
      });
    }

    // 30 kunlik xavfsiz sessiya yaratish
    const session = await createBiznesGoSession(merchant.id);

    return res.json({
      ok: true,
      registered: true,
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      merchant: {
        id: merchant.id,
        telegramId: merchant.telegramId,
        phone: merchant.phone,
        name: merchant.name,
        organizationName: merchant.organizationName,
        merchantType: merchant.merchantType,
        region: merchant.region,
        district: merchant.district,
        address: merchant.address,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        workingHours: merchant.workingHours,
        deliveryAvailable: merchant.deliveryAvailable,
        status: merchant.status,
        createdAt: merchant.createdAt.toISOString(),
        updatedAt: merchant.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[biznesgo:auth:telegram error]:", err);
    return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
  }
});

/**
 * POST /api/biznesgo/auth/register
 * - Yangi sotuvchini Telegram orqali ro'yxatdan o'tkazish.
 * - telegramId faqat tasdiqlangan initData'dan olinadi.
 */
router.post("/auth/register", async (req, res) => {
  try {
    const {
      initData,
      merchantType,
      phone,
      name,
      organizationName,
      region,
      district,
      address,
      workingHours,
      deliveryAvailable,
      latitude,
      longitude,
    } = req.body || {};

    let telegramId: number;

    if (!initData || typeof initData !== "string") {
      if (isPartnerDemoAllowed() && req.body?.isDevDemo) {
        telegramId = 999888777;
      } else {
        return res.status(401).json({
          ok: false,
          error: "Telegram initData yuborilmadi. Telegram ilovasi orqali kiring.",
        });
      }
    } else {
      const verifiedUser = verifyBiznesGoInitData(initData);
      if (!verifiedUser || !verifiedUser.id) {
        return res.status(401).json({
          ok: false,
          error: "Telegram initData tasdiqlanmadi yoki eskirgan.",
        });
      }
      telegramId = verifiedUser.id;
    }

    const cleanName = cleanStr(name, 120);
    if (!cleanName) {
      return res.status(400).json({ ok: false, error: "Ism-familiyangizni kiriting" });
    }

    const cleanOrg = cleanStr(organizationName, 200);
    if (!cleanOrg) {
      return res.status(400).json({ ok: false, error: "Tashkilot yoki do'kon nomini kiriting" });
    }

    const cleanPhone = cleanStr(phone, 32);
    if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 9) {
      return res.status(400).json({ ok: false, error: "Telefon raqamini to'g'ri kiriting" });
    }

    const cleanType = String(merchantType || "").trim() as BiznesGoMerchantType;
    if (!BIZNESGO_MERCHANT_TYPES.includes(cleanType)) {
      return res.status(400).json({
        ok: false,
        error: "Do'kon turi noto'g'ri tanlandi",
      });
    }
    // Mavjud sotuvchini tekshirish
    const [existing] = await db
      .select()
      .from(biznesgoMerchants)
      .where(eq(biznesgoMerchants.telegramId, telegramId))
      .limit(1);

    let merchant = existing;
    if (existing) {
      // Mavjud bo'lsa ma'lumotlarini yangilash
      const [updated] = await db
        .update(biznesgoMerchants)
        .set({
          name: cleanName,
          organizationName: cleanOrg,
          phone: cleanPhone,
          merchantType: cleanType,
          region: cleanStr(region, 100) || null,
          district: cleanStr(district, 100) || null,
          address: cleanStr(address, 500) || null,
          workingHours: cleanStr(workingHours, 100) || "08:00 - 18:00",
          deliveryAvailable: Boolean(deliveryAvailable),
          latitude: typeof latitude === "number" ? latitude : null,
          longitude: typeof longitude === "number" ? longitude : null,
          updatedAt: new Date(),
        })
        .where(eq(biznesgoMerchants.id, existing.id))
        .returning();
      merchant = updated;
    } else {
      // Yangi merchant yaratish
      const [inserted] = await db
        .insert(biznesgoMerchants)
        .values({
          telegramId,
          name: cleanName,
          organizationName: cleanOrg,
          phone: cleanPhone,
          merchantType: cleanType,
          region: cleanStr(region, 100) || null,
          district: cleanStr(district, 100) || null,
          address: cleanStr(address, 500) || null,
          workingHours: cleanStr(workingHours, 100) || "08:00 - 18:00",
          deliveryAvailable: Boolean(deliveryAvailable),
          latitude: typeof latitude === "number" ? latitude : null,
          longitude: typeof longitude === "number" ? longitude : null,
          status: "active",
        })
        .returning();
      merchant = inserted;
    }

    if (!merchant) {
      return res.status(500).json({ ok: false, error: "Sotuvchi profilini yaratib bo'lmadi" });
    }

    const session = await createBiznesGoSession(merchant.id);

    return res.status(201).json({
      ok: true,
      registered: true,
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      merchant: {
        id: merchant.id,
        telegramId: merchant.telegramId,
        phone: merchant.phone,
        name: merchant.name,
        organizationName: merchant.organizationName,
        merchantType: merchant.merchantType,
        region: merchant.region,
        district: merchant.district,
        address: merchant.address,
        latitude: merchant.latitude,
        longitude: merchant.longitude,
        workingHours: merchant.workingHours,
        deliveryAvailable: merchant.deliveryAvailable,
        status: merchant.status,
        createdAt: merchant.createdAt.toISOString(),
        updatedAt: merchant.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[biznesgo:auth:register error]:", err);
    return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
  }
});

/**
 * GET /api/biznesgo/auth/me
 * Joriy sotuvchi va sessiyani tekshirish
 */
router.get("/auth/me", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  const merchant = req.merchant!;
  return res.json({
    ok: true,
    merchant: {
      id: merchant.id,
      telegramId: merchant.telegramId,
      phone: merchant.phone,
      name: merchant.name,
      organizationName: merchant.organizationName,
      merchantType: merchant.merchantType,
      region: merchant.region,
      district: merchant.district,
      address: merchant.address,
      latitude: merchant.latitude,
      longitude: merchant.longitude,
      workingHours: merchant.workingHours,
      deliveryAvailable: merchant.deliveryAvailable,
      status: merchant.status,
      createdAt: merchant.createdAt.toISOString(),
      updatedAt: merchant.updatedAt.toISOString(),
    },
  });
});

/**
 * POST /api/biznesgo/auth/logout
 * Joriy sessiyani yakunlash
 */
router.post("/auth/logout", requireBiznesGoMerchant, async (req: BiznesGoRequest, res) => {
  try {
    const authHeader = String(req.headers["authorization"] || req.headers["x-session-id"] || "").trim();
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      const tokenHash = hashSessionToken(token);
      await db.delete(biznesgoSessions).where(eq(biznesgoSessions.tokenHash, tokenHash)).catch(() => {});
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("[biznesgo:auth:logout error]:", err);
    return res.status(500).json({ ok: false, error: "Server xatosi yuz berdi" });
  }
});

/**
 * POST /api/biznesgo/auth/dev-demo
 * Faqat NODE_ENV=development va ALLOW_PARTNER_DEMO=true bo'lganda lokal sinov uchun ishlaydi.
 * Production'da qat'iy bloklangan (403).
 */
router.post("/auth/dev-demo", async (_req, res) => {
  if (!isPartnerDemoAllowed()) {
    return res.status(403).json({
      ok: false,
      error: "Demo rejim faqat development muhitida ALLOW_PARTNER_DEMO=true bilan ruxsat etilgan",
    });
  }

  const demoTgId = 999888777;
  let [demoMerchant] = await db
    .select()
    .from(biznesgoMerchants)
    .where(eq(biznesgoMerchants.telegramId, demoTgId))
    .limit(1);

  if (!demoMerchant) {
    [demoMerchant] = await db
      .insert(biznesgoMerchants)
      .values({
        telegramId: demoTgId,
        phone: "+998901234567",
        name: "Lokal Sinov Sotuvchi",
        organizationName: "AgroTest Do'kon",
        merchantType: "agro_shop",
        region: "Toshkent shahri",
        district: "Yunusobod tumani",
        address: "Amir Temur shoh ko'chasi, 1-uy",
        workingHours: "08:00 - 20:00",
        deliveryAvailable: true,
        status: "active",
      })
      .returning();
  }

  const session = await createBiznesGoSession(demoMerchant.id);
  return res.json({
    ok: true,
    registered: true,
    token: session.token,
    expiresAt: session.expiresAt.toISOString(),
    merchant: {
      id: demoMerchant.id,
      telegramId: demoMerchant.telegramId,
      phone: demoMerchant.phone,
      name: demoMerchant.name,
      organizationName: demoMerchant.organizationName,
      merchantType: demoMerchant.merchantType,
      region: demoMerchant.region,
      district: demoMerchant.district,
      address: demoMerchant.address,
      latitude: demoMerchant.latitude,
      longitude: demoMerchant.longitude,
      workingHours: demoMerchant.workingHours,
      deliveryAvailable: demoMerchant.deliveryAvailable,
      status: demoMerchant.status,
      createdAt: demoMerchant.createdAt.toISOString(),
      updatedAt: demoMerchant.updatedAt.toISOString(),
    },
  });
});

export default router;
