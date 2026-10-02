import { Router } from "express";
import { db } from "../db/index.js";
import {
  users,
  specialists,
  specialistMedicines,
  orders,
  orderItems,
  specialistRatings,
  specialistCalls,
  diagnoses,
  appSettings,
  adminSessions,
  sessions,
  botStates,
  supportTickets,
  supportMessages,
  broadcasts,
  broadcastDeliveries,
  dataConsents,
} from "../db/schema.js";
import { sql, eq, desc, asc, isNotNull, and, or, inArray } from "drizzle-orm";
import { sendOrderStatusPush, sendSpecialistCallPush } from "../lib/push.js";
import { sendToSpecialist, sendToUser } from "../lib/bot-sender.js";
import {
  adminEnabled,
  adminLogin,
  adminLogout,
  isAdminAuthenticated,
  ADMIN_COOKIE,
  credentials,
} from "../lib/admin-auth.js";
import {
  SETTING_KEYS,
  SECRET_KEYS,
  getSetting,
  setSetting,
  defaultRadiusKmSetting,
  adminUsernameSetting,
} from "../lib/settings.js";
import {
  sendAuthMessage,
  sendAuthPhoto,
  approvedPharmacyMenuKeyboard,
  approvedSpecialistMenuKeyboard,
  pendingApprovalMenuKeyboard,
  applicationApprovedNotification,
  applicationRejectedNotification,
} from "../lib/auth-bot.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { sendMessage, sendPhoto } from "../lib/telegram-bot.js";

const router = Router();

function getAdminSid(req: any): string | undefined {
  return (
    req.cookies?.[ADMIN_COOKIE] ||
    req.headers["x-admin-session"] ||
    (typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "")
      : undefined)
  );
}

export async function requireAdmin(req: any, res: any, next: any) {
  const sid = getAdminSid(req);
  if (sid && (await isAdminAuthenticated(sid))) {
    return next();
  }

  return res.status(401).json({ error: "Admin ruxsati talab qilinadi" });
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & SESSION
// -------------------------------------------------------------

// GET /api/admin/me
router.get("/me", async (req, res) => {
  try {
    const enabled = await adminEnabled();
    const sid = getAdminSid(req);
    const authenticated = sid ? await isAdminAuthenticated(sid) : false;
    const creds = await credentials();

    res.json({
      ok: true,
      enabled,
      authenticated,
      username: authenticated ? creds.username : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// Admin login brute-force himoyasi: 5 marta xato urinishdan keyin 15 daqiqaga bloklash
const ADMIN_MAX_FAILED_ATTEMPTS = 5;
const ADMIN_LOCKOUT_MS = 15 * 60 * 1000;
const adminLoginAttempts = new Map<string, { failedCount: number; lockedUntil: number }>();

function getClientIp(req: any): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown-ip";
}

// POST /api/admin/login & POST /api/admin/session
async function handleLogin(req: any, res: any) {
  if (!(await adminEnabled())) {
    return res.status(503).json({ error: "Admin panel o'chirilgan" });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Login va parol kiritilishi shart" });
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const attemptKey = `${ip}:${String(username).trim().toLowerCase()}`;
  const ipState = adminLoginAttempts.get(ip);
  const userState = adminLoginAttempts.get(attemptKey);

  const activeLockUntil = Math.max(ipState?.lockedUntil ?? 0, userState?.lockedUntil ?? 0);
  if (activeLockUntil > now) {
    const remainingMinutes = Math.ceil((activeLockUntil - now) / 60_000);
    return res.status(429).json({
      error: `5 marta xato urinish tufayli kirish 15 daqiqaga bloklandi. (${remainingMinutes} daqiqadan so'ng qayta urinib ko'ring)`,
      retryAfterMs: activeLockUntil - now,
    });
  }

  const result = await adminLogin(username, password);
  if (!result.ok) {
    const nextIpCount = ((ipState && ipState.lockedUntil <= now && ipState.lockedUntil > 0) ? 0 : (ipState?.failedCount ?? 0)) + 1;
    const nextUserCount = ((userState && userState.lockedUntil <= now && userState.lockedUntil > 0) ? 0 : (userState?.failedCount ?? 0)) + 1;
    const maxCount = Math.max(nextIpCount, nextUserCount);
    const lockedUntil = maxCount >= ADMIN_MAX_FAILED_ATTEMPTS ? now + ADMIN_LOCKOUT_MS : 0;

    adminLoginAttempts.set(ip, { failedCount: nextIpCount, lockedUntil });
    adminLoginAttempts.set(attemptKey, { failedCount: nextUserCount, lockedUntil });

    if (lockedUntil > now) {
      return res.status(429).json({
        error: "5 marta xato urinish tufayli kirish 15 daqiqaga bloklandi",
        retryAfterMs: ADMIN_LOCKOUT_MS,
      });
    }

    return res.status(401).json({
      error: `Login yoki parol noto'g'ri (qolgan urinishlar: ${ADMIN_MAX_FAILED_ATTEMPTS - maxCount})`,
    });
  }

  // Muvaffaqiyatli kirishda xato urinishlar hisoblagichini tozalaymiz
  adminLoginAttempts.delete(ip);
  adminLoginAttempts.delete(attemptKey);

  res.cookie(ADMIN_COOKIE, result.sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60 * 1000,
  });

  res.json({ ok: true, sessionId: result.sessionId });
}

router.post("/login", handleLogin);
router.post("/session", handleLogin);

// POST /api/admin/logout
router.post("/logout", async (req, res) => {
  try {
    const sid = getAdminSid(req);
    await adminLogout(sid);
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 2. DASHBOARD STATS
// -------------------------------------------------------------

// GET /api/admin/stats
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const [u, uTg, specOnly, pharmOnly, m, o, oDone, oSum, oAvgRating, d, radius] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(users),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(isNotNull(users.telegramId)),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(specialists)
          .where(eq(specialists.role, "specialist")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(specialists)
          .where(eq(specialists.role, "pharmacy")),
        db.select({ count: sql<number>`count(*)::int` }).from(specialistMedicines),
        db.select({ count: sql<number>`count(*)::int` }).from(orders),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(eq(orders.status, "yetkazildi")),
        db
          .select({ sum: sql<number>`coalesce(sum(${orders.totalSum}), 0)::int` })
          .from(orders)
          .where(eq(orders.status, "yetkazildi")),
        db
          .select({ avg: sql<number>`coalesce(avg(${orders.ratingStars}), 0)::float` })
          .from(orders)
          .where(isNotNull(orders.ratingStars)),
        db.select({ count: sql<number>`count(*)::int` }).from(diagnoses),
        defaultRadiusKmSetting(),
      ]);

    // Oxirgi 5 ta buyurtma to'liq ma'lumotlari (mahsulotlar va manzil) bilan
    const recentOrdersRows = await db
      .select({
        id: orders.id,
        pharmacySpecialistId: orders.pharmacySpecialistId,
        pharmacyName: specialists.name,
        pharmacyOrg: specialists.organization,
        pharmacyPhone: specialists.phone,
        pharmacyAddress: specialists.address,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        note: orders.note,
        deliveryType: orders.deliveryType,
        customerAddress: orders.customerAddress,
        totalSum: orders.totalSum,
        status: orders.status,
        ratingStars: orders.ratingStars,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(specialists, eq(specialists.id, orders.pharmacySpecialistId))
      .orderBy(desc(orders.id))
      .limit(5);

    const recentOrderIds = recentOrdersRows.map((r) => r.id);
    const recentItems =
      recentOrderIds.length > 0
        ? await db
            .select({
              orderId: orderItems.orderId,
              name: orderItems.name,
              price: orderItems.price,
              qty: orderItems.qty,
            })
            .from(orderItems)
            .where(inArray(orderItems.orderId, recentOrderIds))
        : [];

    const recentOrders = recentOrdersRows.map((o) => ({
      ...o,
      items: recentItems.filter((it) => it.orderId === o.id),
    }));

    res.json({
      ok: true,
      stats: {
        users: u[0]?.count ?? 0,
        telegramUsers: uTg[0]?.count ?? 0,
        phoneUsers: (u[0]?.count ?? 0) - (uTg[0]?.count ?? 0),
        specialists: specOnly[0]?.count ?? 0,
        pharmacies: pharmOnly[0]?.count ?? 0,
        medicines: m[0]?.count ?? 0,
        orders: o[0]?.count ?? 0,
        ordersDelivered: oDone[0]?.count ?? 0,
        totalSalesSum: oSum[0]?.sum ?? 0,
        averageRating: Number((oAvgRating[0]?.avg ?? 0).toFixed(1)),
        diagnoses: d[0]?.count ?? 0,
        defaultRadiusKm: radius,
      },
      recentOrders,
    });
  } catch (err: any) {
    console.error("[admin stats error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 3. VILOYATLAR TAHLILI (REGIONS STATS)
// -------------------------------------------------------------

const UZBEKISTAN_REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand viloyati",
  "Farg'ona viloyati",
  "Andijon viloyati",
  "Namangan viloyati",
  "Buxoro viloyati",
  "Qashqadaryo viloyati",
  "Surxondaryo viloyati",
  "Xorazm viloyati",
  "Navoiy viloyati",
  "Jizzax viloyati",
  "Sirdaryo viloyati",
  "Qoraqalpog'iston Respublikasi",
];

// GET /api/admin/regions
router.get("/regions", requireAdmin, async (_req, res) => {
  try {
    // 1. Foydalanuvchilar viloyatlar kesimida
    const userRows = await db
      .select({
        region: users.region,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .groupBy(users.region);

    // 2. Dorixona va mutaxassislar viloyat/manzil bo'yicha
    const specRows = await db
      .select({
        address: specialists.address,
        role: specialists.role,
      })
      .from(specialists);

    // 3. Buyurtmalar viloyat/manzil bo'yicha
    const orderRows = await db
      .select({
        address: orders.customerAddress,
        totalSum: orders.totalSum,
        status: orders.status,
      })
      .from(orders);

    // 4. Mutaxassis chaqiruvlari viloyat/manzil bo'yicha
    const callRows = await db
      .select({
        address: specialistCalls.address,
        status: specialistCalls.status,
      })
      .from(specialistCalls);

    const userCountByRegion: Record<string, number> = {};
    for (const r of userRows) {
      if (r.region) {
        const key = findMatchingRegion(r.region);
        userCountByRegion[key] = (userCountByRegion[key] || 0) + r.count;
      }
    }

    const pharmaciesByRegion: Record<string, number> = {};
    const specialistsByRegion: Record<string, number> = {};
    for (const s of specRows) {
      const reg = findMatchingRegion(s.address || "");
      if (s.role === "pharmacy") {
        pharmaciesByRegion[reg] = (pharmaciesByRegion[reg] || 0) + 1;
      } else {
        specialistsByRegion[reg] = (specialistsByRegion[reg] || 0) + 1;
      }
    }

    const ordersByRegion: Record<string, { count: number; totalSum: number }> = {};
    for (const o of orderRows) {
      const reg = findMatchingRegion(o.address || "");
      const cur = ordersByRegion[reg] || { count: 0, totalSum: 0 };
      cur.count += 1;
      if (o.status === "yetkazildi" && o.totalSum) {
        cur.totalSum += o.totalSum;
      }
      ordersByRegion[reg] = cur;
    }

    const callsByRegion: Record<string, number> = {};
    for (const c of callRows) {
      const reg = findMatchingRegion(c.address || "");
      callsByRegion[reg] = (callsByRegion[reg] || 0) + 1;
    }

    const totalUsers = Object.values(userCountByRegion).reduce((a, b) => a + b, 0) || 1;

    const result = UZBEKISTAN_REGIONS.map((regionName) => {
      const uCount = userCountByRegion[regionName] || 0;
      const pCount = pharmaciesByRegion[regionName] || 0;
      const sCount = specialistsByRegion[regionName] || 0;
      const ord = ordersByRegion[regionName] || { count: 0, totalSum: 0 };
      const cCount = callsByRegion[regionName] || 0;

      return {
        region: regionName,
        users: uCount,
        pharmacies: pCount,
        specialists: sCount,
        orders: ord.count,
        calls: cCount,
        totalSales: ord.totalSum,
        sharePercent: Math.round((uCount / totalUsers) * 100),
      };
    });

    // Eng faol viloyatlar bo'yicha saralash
    result.sort((a, b) => b.users + b.orders * 2 - (a.users + a.orders * 2));

    res.json({
      ok: true,
      regions: result,
      summary: {
        totalRegionsCount: UZBEKISTAN_REGIONS.length,
        activeRegionsCount: result.filter((r) => r.users > 0 || r.pharmacies > 0 || r.orders > 0).length,
      },
    });
  } catch (err: any) {
    console.error("[admin regions error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

function findMatchingRegion(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("samarqand")) return "Samarqand viloyati";
  if (lower.includes("toshkent sh") || lower.includes("chilonzor") || lower.includes("yunusobod") || lower.includes("mirzo")) return "Toshkent shahri";
  if (lower.includes("toshkent vil") || lower.includes("chirchiq") || lower.includes("angren") || lower.includes("olmaliq") || lower.includes("qibray")) return "Toshkent viloyati";
  if (lower.includes("farg'ona") || lower.includes("qo'qon") || lower.includes("fargona")) return "Farg'ona viloyati";
  if (lower.includes("andijon") || lower.includes("asaka")) return "Andijon viloyati";
  if (lower.includes("namangan") || lower.includes("chust")) return "Namangan viloyati";
  if (lower.includes("buxoro") || lower.includes("g'ijduvon")) return "Buxoro viloyati";
  if (lower.includes("qashqadaryo") || lower.includes("qarshi") || lower.includes("shahrisabz")) return "Qashqadaryo viloyati";
  if (lower.includes("surxondaryo") || lower.includes("termiz") || lower.includes("denov")) return "Surxondaryo viloyati";
  if (lower.includes("xorazm") || lower.includes("urganch") || lower.includes("xiva")) return "Xorazm viloyati";
  if (lower.includes("navoiy") || lower.includes("zarafshon")) return "Navoiy viloyati";
  if (lower.includes("jizzax") || lower.includes("zaamin") || lower.includes("zomin")) return "Jizzax viloyati";
  if (lower.includes("sirdaryo") || lower.includes("guliston")) return "Sirdaryo viloyati";
  if (lower.includes("qoraqalpog'") || lower.includes("nukus") || lower.includes("karakalpak")) return "Qoraqalpog'iston Respublikasi";

  return "Toshkent shahri";
}

// -------------------------------------------------------------
// 4. FIKRLAR VA SHARHLAR MODERATSIYASI (REVIEWS)
// -------------------------------------------------------------

// GET /api/admin/reviews
router.get("/reviews", requireAdmin, async (_req, res) => {
  try {
    // 1. Buyurtmalar bo'yicha baholashlar va izohlar
    const orderRatings = await db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        pharmacyName: specialists.organization,
        pharmacyContact: specialists.name,
        ratingStars: orders.ratingStars,
        ratingNote: orders.ratingNote,
        ratedAt: orders.ratedAt,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(specialists, eq(specialists.id, orders.pharmacySpecialistId))
      .where(isNotNull(orders.ratingStars))
      .orderBy(desc(orders.ratedAt))
      .limit(50);

    // 2. Mutaxassislarga berilgan reytinglar
    const specRatings = await db
      .select({
        id: specialistRatings.id,
        specialistId: specialistRatings.specialistId,
        specialistName: specialists.name,
        specialistRole: specialists.role,
        organization: specialists.organization,
        stars: specialistRatings.stars,
        raterKey: specialistRatings.raterKey,
        createdAt: specialistRatings.createdAt,
      })
      .from(specialistRatings)
      .leftJoin(specialists, eq(specialists.id, specialistRatings.specialistId))
      .orderBy(desc(specialistRatings.id))
      .limit(50);

    res.json({
      ok: true,
      orderReviews: orderRatings.map((r) => ({
        id: r.id,
        type: "order",
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        targetName: r.pharmacyName || r.pharmacyContact || "Dorixona",
        stars: r.ratingStars ?? 5,
        comment: r.ratingNote || "Izohsiz baholangan",
        date: r.ratedAt || r.createdAt,
      })),
      specialistReviews: specRatings.map((r) => ({
        id: r.id,
        type: "specialist",
        specialistId: r.specialistId,
        targetName: r.organization || r.specialistName || "Mutaxassis",
        role: r.specialistRole === "pharmacy" ? "Dorixona" : "Mutaxassis",
        stars: r.stars,
        raterKey: r.raterKey,
        date: r.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("[admin reviews error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// DELETE /api/admin/reviews/:type/:id
router.delete("/reviews/:type/:id", requireAdmin, async (req, res) => {
  try {
    const { type, id } = req.params;
    const numId = Number(id);
    if (!Number.isInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: "Noto'g'ri ID" });
    }

    if (type === "order") {
      await db
        .update(orders)
        .set({ ratingStars: null, ratingNote: null, ratedAt: null })
        .where(eq(orders.id, numId));
      return res.json({ ok: true, message: "Buyurtma bahosi olib tashlandi" });
    }

    if (type === "specialist") {
      await db
        .delete(specialistRatings)
        .where(eq(specialistRatings.id, numId));
      return res.json({ ok: true, message: "Mutaxassis bahosi o'chirildi" });
    }

    return res.status(400).json({ error: "Noma'lum sharh turi" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 5. TIZIM VA RADIUS SOZLAMALARI (SETTINGS)
// -------------------------------------------------------------

// GET /api/admin/settings
router.get("/settings", requireAdmin, async (_req, res) => {
  try {
    const rows = await db.select().from(appSettings);
    const settings: Record<string, string | null> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    // Default radius agar belgilanmagan bo'lsa 5
    if (!settings[SETTING_KEYS.defaultRadiusKm]) {
      settings[SETTING_KEYS.defaultRadiusKm] = "5";
    }

    // Barcha kalitlar ro'yxatini to'liq ko'rsatamiz
    const list = Object.entries(SETTING_KEYS).map(([name, key]) => {
      const val = settings[key] ?? null;
      const isSecret = SECRET_KEYS.has(key);
      const preview = isSecret && val ? `••••${val.slice(-4)}` : val;
      return {
        key,
        name,
        label: getSettingLabel(key),
        secret: isSecret,
        value: val,
        preview,
      };
    });

    res.json({ ok: true, settings, list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/settings
router.post("/settings", requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    for (const [key, value] of Object.entries(body)) {
      if (typeof key === "string" && key.length > 0) {
        await setSetting(key as any, String(value ?? ""));
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/admin/telegram
router.get("/telegram", requireAdmin, async (_req, res) => {
  try {
    const botToken = await getSetting(SETTING_KEYS.telegramBotToken);
    const authBotToken = await getSetting(SETTING_KEYS.telegramAuthBotToken);
    const botUsername = await getSetting(SETTING_KEYS.telegramBotUsername);
    const authBotUsername = await getSetting(SETTING_KEYS.telegramAuthBotUsername);

    // Telegram API orqali bot holatini tekshirish
    async function checkBot(token: string | null) {
      if (!token) return { configured: false, name: null, username: null };
      try {
        const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const data: any = await resp.json();
        if (data?.ok) {
          return {
            configured: true,
            name: data.result.first_name,
            username: data.result.username,
            canJoinGroups: data.result.can_join_groups,
          };
        }
        return { configured: false, error: data?.description || "Yaroqsiz token" };
      } catch (err: any) {
        return { configured: false, error: err.message || "Ulanishda xatolik" };
      }
    }

    const [mainStatus, authStatus] = await Promise.all([
      checkBot(botToken),
      checkBot(authBotToken),
    ]);

    res.json({
      ok: true,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || null,
      main: {
        ...mainStatus,
        configuredUsername: botUsername || mainStatus.username || "agrozai_bot",
      },
      auth: {
        ...authStatus,
        configuredUsername: authBotUsername || authStatus.username || "agroz_auth_bot",
      },
      secrets: { main: Boolean(botToken), auth: Boolean(authBotToken) },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/telegram/test-token
router.post("/telegram/test-token", requireAdmin, async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Token ko'rsatilmadi" });
    }
    const resp = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
    const data: any = await resp.json();
    if (data?.ok) {
      return res.json({
        ok: true,
        bot: {
          id: data.result.id,
          name: data.result.first_name,
          username: data.result.username,
        },
      });
    }
    return res.status(400).json({
      ok: false,
      error: data?.description || "Telegram token yaroqsiz",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Telegram bilan bog'lanib bo'lmadi" });
  }
});

function getSettingLabel(key: string): string {
  switch (key) {
    case SETTING_KEYS.defaultRadiusKm:
      return "Qidiruv radiusi (km) — Standart: 5 km";
    case SETTING_KEYS.telegramBotToken:
      return "Fermerlar boti tokeni (FARMER_BOT_TOKEN / TELEGRAM_BOT_TOKEN)";
    case SETTING_KEYS.telegramBotUsername:
      return "Fermerlar boti username (@agrozai_bot)";
    case SETTING_KEYS.telegramAuthBotToken:
      return "Hamkorlar boti tokeni (PARTNER_BOT_TOKEN / TELEGRAM_AUTH_BOT_TOKEN)";
    case SETTING_KEYS.telegramAuthBotUsername:
      return "Mutaxassis va dorixona boti username (@agroz_auth_bot)";
    case SETTING_KEYS.openaiApiKey:
      return "AI API kaliti (Google Gemini yoki OpenAI)";
    case SETTING_KEYS.aiModel:
      return "Agro AI modeli (gemini-2.5-flash / gemini-3.8-flash)";
    case SETTING_KEYS.adminUsername:
      return "Admin login (username)";
    case SETTING_KEYS.adminPassword:
      return "Admin paroli";
    case SETTING_KEYS.eskizEmail:
      return "Eskiz SMS email";
    case SETTING_KEYS.eskizPassword:
      return "Eskiz SMS parol";
    case SETTING_KEYS.deliveryEnabled:
      return "Yetkazib berish xizmati faolligi (true / false)";
    case SETTING_KEYS.deliveryMinOrderQty:
      return "Yetkazib berish bepul bo'ladigan minimal buyurtma soni (dona) — Masalan: 5";
    case SETTING_KEYS.deliveryPricePerKm:
      return "Yetkazib berish: har 1 km uchun narx (so'm) — Masalan: 3000";
    case SETTING_KEYS.deliveryBasePrice:
      return "Yetkazib berish: bazaviy boshlang'ich narx (so'm) — Masalan: 10000";
    case SETTING_KEYS.deliveryMaxDistanceKm:
      return "Maksimal yetkazib berish masofasi (km) — Masalan: 50";
    default:
      return key;
  }
}

// -------------------------------------------------------------
// 6. ARIZALAR VA DORIXONALAR / MUTAXASSISLAR BOSHQARUVI
// -------------------------------------------------------------

// GET /api/admin/specialists
router.get("/specialists", requireAdmin, async (req, res) => {
  try {
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    // Barcha mutaxassis va dorixonalar avtomatik tasdiqlangan
    await db.update(specialists).set({ isApproved: true }).where(eq(specialists.isApproved, false)).catch(() => {});

    const allSpecs = await db
      .select({
        id: specialists.id,
        telegramId: specialists.telegramId,
        name: specialists.name,
        phone: specialists.phone,
        role: specialists.role,
        specialty: specialists.specialty,
        organization: specialists.organization,
        address: specialists.address,
        lat: specialists.lat,
        lng: specialists.lng,
        workHours: specialists.workHours,
        isActive: specialists.isActive,
        isApproved: specialists.isApproved,
        isBusy: specialists.isBusy,
        botStartedAt: specialists.botStartedAt,
        botBlocked: specialists.botBlocked,
        consentedAt: specialists.consentedAt,
        consentVersion: specialists.consentVersion,
        consentChannel: specialists.consentChannel,
        consentText: specialists.consentText,
        createdAt: specialists.createdAt,
        updatedAt: specialists.updatedAt,
      })
      .from(specialists)
      .orderBy(desc(specialists.id));

    // Dori, buyurtma, chaqiruv va reytinglarni bir yo'la hisoblash
    const [medCounts, orderCounts, callCounts, ratingStats] = await Promise.all([
      db
        .select({
          specialistId: specialistMedicines.specialistId,
          count: sql<number>`count(*)::int`,
        })
        .from(specialistMedicines)
        .groupBy(specialistMedicines.specialistId),
      db
        .select({
          specialistId: orders.pharmacySpecialistId,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .where(isNotNull(orders.pharmacySpecialistId))
        .groupBy(orders.pharmacySpecialistId),
      db
        .select({
          specialistId: specialistCalls.specialistId,
          count: sql<number>`count(*)::int`,
        })
        .from(specialistCalls)
        .groupBy(specialistCalls.specialistId),
      db
        .select({
          specialistId: specialistRatings.specialistId,
          avg: sql<number>`avg(${specialistRatings.stars})::float`,
          count: sql<number>`count(*)::int`,
        })
        .from(specialistRatings)
        .groupBy(specialistRatings.specialistId),
    ]);

    const medMap = new Map<number, number>();
    for (const m of medCounts) {
      medMap.set(m.specialistId, m.count);
    }
    const orderMap = new Map<number, number>();
    for (const o of orderCounts) {
      if (o.specialistId) orderMap.set(o.specialistId, o.count);
    }
    const callMap = new Map<number, number>();
    for (const c of callCounts) {
      callMap.set(c.specialistId, c.count);
    }
    const ratingMap = new Map<number, { avg: number; count: number }>();
    for (const r of ratingStats) {
      ratingMap.set(r.specialistId, { avg: r.avg, count: r.count });
    }

    let result = allSpecs.map((s) => {
      const r = ratingMap.get(s.id);
      const botStatus: "active" | "never_started" | "blocked" | "no_telegram" = !s.telegramId
        ? "no_telegram"
        : s.botBlocked
        ? "blocked"
        : s.botStartedAt
        ? "active"
        : "never_started";

      return {
        ...s,
        medicinesCount: medMap.get(s.id) ?? 0,
        ordersCount: orderMap.get(s.id) ?? 0,
        callsCount: callMap.get(s.id) ?? 0,
        ratingAvg: r ? Math.round(r.avg * 10) / 10 : null,
        ratingCount: r?.count ?? 0,
        isBusy: s.isBusy ?? false,
        botStatus,
      };
    });

    if (role && (role === "pharmacy" || role === "specialist")) {
      result = result.filter((s) => s.role === role);
    }

    if (status === "pending") {
      result = result.filter((s) => !s.isApproved);
    } else if (status === "approved") {
      result = result.filter((s) => s.isApproved);
    }

    const pendingCount = allSpecs.filter((s) => !s.isApproved).length;
    const approvedCount = allSpecs.filter((s) => s.isApproved).length;

    const botStats = {
      active: allSpecs.filter((s) => Boolean(s.telegramId) && !s.botBlocked && Boolean(s.botStartedAt)).length,
      neverStarted: allSpecs.filter((s) => Boolean(s.telegramId) && !s.botBlocked && !s.botStartedAt).length,
      blocked: allSpecs.filter((s) => Boolean(s.telegramId) && Boolean(s.botBlocked)).length,
      noTelegram: allSpecs.filter((s) => !s.telegramId).length,
    };

    res.json({
      ok: true,
      specialists: result,
      summary: {
        total: allSpecs.length,
        pending: pendingCount,
        approved: approvedCount,
        botStats,
      },
    });
  } catch (err: any) {
    console.error("[admin specialists list error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/admin/pharmacies/:id/medicines
router.get("/pharmacies/:id/medicines", requireAdmin, async (req, res) => {
  try {
    const pharmacyId = Number(req.params.id);
    if (!pharmacyId) return res.status(400).json({ error: "Dorixona ID noto'g'ri" });

    const pharmacy = await db
      .select()
      .from(specialists)
      .where(eq(specialists.id, pharmacyId))
      .limit(1);

    const items = await db
      .select()
      .from(specialistMedicines)
      .where(eq(specialistMedicines.specialistId, pharmacyId))
      .orderBy(desc(specialistMedicines.id));

    res.json({
      ok: true,
      pharmacy: pharmacy[0] ? {
        id: pharmacy[0].id,
        name: pharmacy[0].name,
        organization: pharmacy[0].organization,
        phone: pharmacy[0].phone,
        address: pharmacy[0].address,
      } : null,
      items: items.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        usage: m.usage,
        price: m.price,
        stock: m.stock,
        status: m.status,
        photoFileId: m.photoFileId,
        createdAt: m.createdAt,
      })),
      totalCount: items.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/specialists/:id/approve
router.post("/specialists/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri ID" });
    }

    const updated = await db
      .update(specialists)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(specialists.id, id))
      .returning();

    const spec = updated[0];
    if (!spec) {
      return res.status(404).json({ error: "Mutaxassis yoki dorixona topilmadi" });
    }

    // Foydalanuvchiga Telegram orqali xabarnoma yuborish va Panel tugmalarini faollashtirish
    if (spec.telegramId) {
      const keyboard =
        spec.role === "pharmacy"
          ? approvedPharmacyMenuKeyboard()
          : approvedSpecialistMenuKeyboard();
      await sendAuthMessage(
        spec.telegramId,
        applicationApprovedNotification(spec.name, spec.role),
        { replyKeyboard: keyboard },
      ).catch((err) => console.error("[admin approve telegram notification error]:", err));
    }

    res.json({ ok: true, message: "Ariza tasdiqlandi va panel faollashtirildi", specialist: spec });
  } catch (err: any) {
    console.error("[admin approve error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/specialists/:id/reject
router.post("/specialists/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri ID" });
    }
    const { reason } = req.body || {};

    const updated = await db
      .update(specialists)
      .set({ isApproved: false, updatedAt: new Date() })
      .where(eq(specialists.id, id))
      .returning();

    const spec = updated[0];
    if (!spec) {
      return res.status(404).json({ error: "Mutaxassis yoki dorixona topilmadi" });
    }

    if (spec.telegramId) {
      await sendAuthMessage(
        spec.telegramId,
        applicationRejectedNotification(spec.name, spec.role, reason),
        { replyKeyboard: pendingApprovalMenuKeyboard() },
      ).catch((err) => console.error("[admin reject telegram notification error]:", err));
    }

    res.json({ ok: true, message: "Ariza rad etildi", specialist: spec });
  } catch (err: any) {
    console.error("[admin reject error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// DELETE /api/admin/specialists/:id
router.delete("/specialists/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri ID" });
    }

    const [spec] = await db.select().from(specialists).where(eq(specialists.id, id)).limit(1);
    if (!spec) {
      return res.status(404).json({ error: "Mutaxassis topilmadi" });
    }

    // 1. Chaqiruvlar va so'rovlarni o'chirish
    await db.delete(specialistCalls).where(eq(specialistCalls.specialistId, id));

    // 2. Baholarni o'chirish
    await db.delete(specialistRatings).where(eq(specialistRatings.specialistId, id));

    // 3. Dorilarni o'chirish
    await db.delete(specialistMedicines).where(eq(specialistMedicines.specialistId, id));

    // 4. Dorixona bo'lsa, tushgan buyurtmalar va orderItems ni tozalash
    const phOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.pharmacySpecialistId, id));
    for (const o of phOrders) {
      await db.delete(orderItems).where(eq(orderItems.orderId, o.id));
    }
    if (phOrders.length > 0) {
      await db.delete(orders).where(eq(orders.pharmacySpecialistId, id));
    }

    // 5. Bot holatini tozalash
    if (spec.telegramId) {
      await db.delete(botStates).where(eq(botStates.telegramId, spec.telegramId));
    }

    // 6. Mutaxassisning o'zini o'chirish
    await db.delete(specialists).where(eq(specialists.id, id));

    res.json({ ok: true, message: "Mutaxassis va barcha bog'liq ma'lumotlar to'liq o'chirildi" });
  } catch (err: any) {
    console.error("[admin delete specialist error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 10. ORDERS MANAGEMENT
// -------------------------------------------------------------

// GET /api/admin/orders
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const statusFilter = (req.query.status as string) || null;
    const search = (req.query.search as string)?.trim().toLowerCase() || null;

    const allOrders = await db
      .select({
        id: orders.id,
        pharmacySpecialistId: orders.pharmacySpecialistId,
        pharmacyName: specialists.name,
        pharmacyOrg: specialists.organization,
        pharmacyPhone: specialists.phone,
        pharmacyAddress: specialists.address,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        note: orders.note,
        deliveryType: orders.deliveryType,
        customerAddress: orders.customerAddress,
        totalSum: orders.totalSum,
        status: orders.status,
        ratingStars: orders.ratingStars,
        ratingNote: orders.ratingNote,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(specialists, eq(specialists.id, orders.pharmacySpecialistId))
      .orderBy(desc(orders.id));

    const allItems = await db.select().from(orderItems);
    const itemsByOrderId = new Map<number, typeof allItems>();
    for (const item of allItems) {
      const list = itemsByOrderId.get(item.orderId) || [];
      list.push(item);
      itemsByOrderId.set(item.orderId, list);
    }

    let result = allOrders.map((o) => ({
      ...o,
      items: itemsByOrderId.get(o.id) || [],
    }));

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search) {
      result = result.filter(
        (o) =>
          o.customerName?.toLowerCase().includes(search) ||
          o.customerPhone?.toLowerCase().includes(search) ||
          o.pharmacyName?.toLowerCase().includes(search) ||
          o.pharmacyOrg?.toLowerCase().includes(search) ||
          String(o.id).includes(search),
      );
    }

    res.json({ ok: true, orders: result });
  } catch (err: any) {
    console.error("[admin/orders error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/orders/:id/status
router.post("/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body || {};
    if (!Number.isSafeInteger(orderId) || !["yangi", "tasdiqlandi", "yolda", "yetkazildi", "bekor"].includes(status)) {
      return res.status(400).json({ error: "Holat noto'g'ri" });
    }
    const [existingOrder] = await db
      .select({ userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    await db.update(orders).set({ status }).where(eq(orders.id, orderId));

    if (existingOrder?.userId) {
      sendOrderStatusPush(existingOrder.userId, orderId, status).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 11. SPECIALIST CALLS MANAGEMENT
// -------------------------------------------------------------

// GET /api/admin/specialist-calls
router.get("/specialist-calls", requireAdmin, async (req, res) => {
  try {
    const callsRaw = await db
      .select({
        id: specialistCalls.id,
        specialistId: specialistCalls.specialistId,
        specialistName: specialists.name,
        specialistSpecialty: specialists.specialty,
        specialistPhone: specialists.phone,
        specialistRole: specialists.role,
        customerName: specialistCalls.customerName,
        customerPhone: specialistCalls.customerPhone,
        problem: specialistCalls.problem,
        address: specialistCalls.address,
        status: specialistCalls.status,
        assignedOrderId: specialistCalls.assignedOrderId,
        createdAt: specialistCalls.createdAt,
        updatedAt: specialistCalls.updatedAt,
      })
      .from(specialistCalls)
      .leftJoin(specialists, eq(specialists.id, specialistCalls.specialistId))
      .orderBy(desc(specialistCalls.id));

    const calls = callsRaw.map((c) => ({
      ...c,
      specialistName: c.specialistName,
      specialistSpecialty: c.specialistSpecialty,
      specialistPhone: c.specialistPhone,
      specialistRole: c.specialistRole,
    }));

    res.json({ ok: true, calls });
  } catch (err: any) {
    console.error("[admin/specialist-calls error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/admin/specialist-calls/:id/status
router.post("/specialist-calls/:id/status", requireAdmin, async (req, res) => {
  try {
    const callId = Number(req.params.id);
    const { status } = req.body || {};
    if (!Number.isSafeInteger(callId) || !["yangi", "qabul_qilindi", "bajarildi", "bekor"].includes(status)) {
      return res.status(400).json({ error: "Holat noto'g'ri" });
    }
    const [existingCall] = await db
      .select({ customerPhone: specialistCalls.customerPhone })
      .from(specialistCalls)
      .where(eq(specialistCalls.id, callId))
      .limit(1);

    await db.update(specialistCalls).set({ status, updatedAt: new Date() }).where(eq(specialistCalls.id, callId));

    if (existingCall?.customerPhone) {
      sendSpecialistCallPush(existingCall.customerPhone, callId, status).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 12. SUPER ADMIN ANALYTICS & STATS (Foydalanuvchilar, Kasalliklar va Dorilar)
// -------------------------------------------------------------
router.get("/analytics", requireAdmin, async (_req, res) => {
  try {
    // 1. Foydalanuvchilar, agronomlar, veterinarlar va dorixonalar sonlari
    const [
      uCount,
      uTgCount,
      agronomistsCount,
      veterinariansCount,
      pharmaciesCount,
      totalSpecialistsCount,
      busyCount,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(isNotNull(users.telegramId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(
          and(
            eq(specialists.role, "specialist"),
            or(eq(specialists.helpsWith, "crop"), eq(specialists.helpsWith, "both")),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(
          and(
            eq(specialists.role, "specialist"),
            or(eq(specialists.helpsWith, "animal"), eq(specialists.helpsWith, "both")),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(eq(specialists.role, "pharmacy")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(eq(specialists.role, "specialist")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(eq(specialists.isBusy, true)),
    ]);

    // 2. Chaqiruvlar tahlili: Hayvonlar va Ekinlar bo'yicha eng ko'p uchrayotgan kasalliklar
    const allCalls = await db
      .select({
        id: specialistCalls.id,
        problem: specialistCalls.problem,
        helpsWith: specialists.helpsWith,
        specialty: specialists.specialty,
        createdAt: specialistCalls.createdAt,
      })
      .from(specialistCalls)
      .leftJoin(specialists, eq(specialists.id, specialistCalls.specialistId));

    // Hayvonlar kasalliklari / muammolari lug'ati va hisobi
    const ANIMAL_DISEASE_KEYWORDS = [
      { key: "oqsoqlik", label: "Oqsoqlik va tuyoq kasalligi (Nekrobakterioz)", icon: "🐄" },
      { key: "mastit", label: "Yelin shamollashi (Mastit)", icon: "🥛" },
      { key: "qorason", label: "Qorason (Emkar)", icon: "⚠️" },
      { key: "brutsell", label: "Brutsellyoz", icon: "🔬" },
      { key: "isitma", label: "Yuqori isitma va holsizlik", icon: "🌡️" },
      { key: "qurt", label: "Gelmintoz (Gijja / Qurt tushishi)", icon: "🪱" },
      { key: "ich", label: "Oshqozon-ichak buzilishi (Diareya)", icon: "💧" },
      { key: "tuxum", label: "Parrandalarda tuxum tug'ish pasayishi", icon: "🐔" },
      { key: "o'lat", label: "Parranda o'lati / Vabo", icon: "🚨" },
      { key: "tug'ruq", label: "Tug'ruq asoratlari va yordam", icon: "🩺" },
    ];

    const CROP_DISEASE_KEYWORDS = [
      { key: "zang", label: "Zang kasalligi (Bug'doy va g'alla)", icon: "🌾" },
      { key: "shira", label: "Shira (Tlya zararkunandasi)", icon: "🐛" },
      { key: "fitoftor", label: "Fitoftoroz (Pomidor va kartoshka)", icon: "🍅" },
      { key: "un shudring", label: "Un shudring kasalligi", icon: "⚪" },
      { key: "bujmay", label: "Barg bujmayishi / Mozaika virusi", icon: "🍃" },
      { key: "qurt", label: "Meva va poya qurtlari (Tunlam / Kolorado)", icon: "🐛" },
      { key: "ildiz", label: "Ildiz chirishi kasalligi", icon: "🌱" },
      { key: "sarg'ay", label: "Barglar sarg'ayishi (Xloroz)", icon: "🍂" },
      { key: "qurish", label: "Qurish va so'lish (Fuzarioz)", icon: "🥀" },
      { key: "kanasi", label: "O'rgimchakkana zarari", icon: "🕷️" },
    ];

    const animalStatsMap: Record<string, { label: string; icon: string; count: number }> = {};
    for (const d of ANIMAL_DISEASE_KEYWORDS) {
      animalStatsMap[d.key] = { label: d.label, icon: d.icon, count: 0 };
    }
    const cropStatsMap: Record<string, { label: string; icon: string; count: number }> = {};
    for (const d of CROP_DISEASE_KEYWORDS) {
      cropStatsMap[d.key] = { label: d.label, icon: d.icon, count: 0 };
    }

    let otherAnimalCount = 0;
    let otherCropCount = 0;

    for (const c of allCalls) {
      const prob = (c.problem || "").toLowerCase();
      const isAnimal =
        c.helpsWith === "animal" ||
        (!c.helpsWith &&
          (prob.includes("mol") ||
            prob.includes("sigir") ||
            prob.includes("buzoq") ||
            prob.includes("qo'y") ||
            prob.includes("echki") ||
            prob.includes("ot") ||
            prob.includes("tovuq")));

      if (isAnimal) {
        let matched = false;
        for (const item of ANIMAL_DISEASE_KEYWORDS) {
          if (prob.includes(item.key) || (item.key === "oqsoqlik" && prob.includes("tuyoq"))) {
            animalStatsMap[item.key].count++;
            matched = true;
            break;
          }
        }
        if (!matched && prob.length > 0) otherAnimalCount++;
      } else {
        let matched = false;
        for (const item of CROP_DISEASE_KEYWORDS) {
          if (prob.includes(item.key) || (item.key === "un shudring" && prob.includes("kul"))) {
            cropStatsMap[item.key].count++;
            matched = true;
            break;
          }
        }
        if (!matched && prob.length > 0) otherCropCount++;
      }
    }

    const topAnimalDiseases = Object.values(animalStatsMap)
      .filter((a) => a.count > 0)
      .sort((a, b) => b.count - a.count);
    if (otherAnimalCount > 0) {
      topAnimalDiseases.push({
        label: "Boshqa chorva murojaatlari",
        icon: "🐄",
        count: otherAnimalCount,
      });
    }

    const topCropDiseases = Object.values(cropStatsMap)
      .filter((a) => a.count > 0)
      .sort((a, b) => b.count - a.count);
    if (otherCropCount > 0) {
      topCropDiseases.push({
        label: "Boshqa ekin kasalliklari va zararkunandalari",
        icon: "🌱",
        count: otherCropCount,
      });
    }

    // 3. Eng ko'p sotilayotgan va talab yuqori bo'lgan dorilar (Marketplace Top Demanded Medicines)
    const topMedicinesQuery = await db
      .select({
        medicineId: orderItems.medicineId,
        name: orderItems.name,
        totalSoldQty: sql<number>`coalesce(sum(${orderItems.qty}), 0)::int`,
        ordersCount: sql<number>`count(distinct ${orderItems.orderId})::int`,
        totalRevenue: sql<number>`coalesce(sum(${orderItems.qty} * coalesce(${orderItems.price}, 0)), 0)::int`,
      })
      .from(orderItems)
      .groupBy(orderItems.medicineId, orderItems.name)
      .orderBy(desc(sql`sum(${orderItems.qty})`))
      .limit(10);

    const topMedicineIds = topMedicinesQuery.map((m) => m.medicineId).filter(Boolean);
    const medStockMap = new Map<
      number,
      { stock: number | null; status: string; pharmacyName: string | null }
    >();
    if (topMedicineIds.length > 0) {
      const stockRows = await db
        .select({
          id: specialistMedicines.id,
          stock: specialistMedicines.stock,
          status: specialistMedicines.status,
          pharmacyName: specialists.organization,
        })
        .from(specialistMedicines)
        .leftJoin(specialists, eq(specialists.id, specialistMedicines.specialistId))
        .where(inArray(specialistMedicines.id, topMedicineIds));
      for (const s of stockRows) {
        medStockMap.set(s.id, {
          stock: s.stock,
          status: s.status,
          pharmacyName: s.pharmacyName,
        });
      }
    }

    const topMedicines = topMedicinesQuery.map((m) => {
      const stockInfo = medStockMap.get(m.medicineId);
      return {
        ...m,
        stock: stockInfo?.stock ?? null,
        status: stockInfo?.status ?? "bor",
        pharmacyName: stockInfo?.pharmacyName ?? "Dorixona",
      };
    });

    res.json({
      ok: true,
      counts: {
        totalUsers: uCount[0]?.count ?? 0,
        telegramUsers: uTgCount[0]?.count ?? 0,
        phoneUsers: (uCount[0]?.count ?? 0) - (uTgCount[0]?.count ?? 0),
        agronomists: agronomistsCount[0]?.count ?? 0,
        veterinarians: veterinariansCount[0]?.count ?? 0,
        pharmacies: pharmaciesCount[0]?.count ?? 0,
        totalSpecialists: totalSpecialistsCount[0]?.count ?? 0,
        busySpecialists: busyCount[0]?.count ?? 0,
      },
      topAnimalDiseases,
      topCropDiseases,
      topMedicines,
      totalCallsCount: allCalls.length,
    });
  } catch (err: any) {
    console.error("[admin analytics error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// -------------------------------------------------------------
// 13. WEATHER & AGRO ALERTS BROADCAST (Telegram Xabarnoma)
// -------------------------------------------------------------
router.post("/weather-alerts/broadcast", requireAdmin, async (req, res) => {
  try {
    const { region, alertType, customTitle, customMessage, buttonText, buttonUrl } = req.body || {};

    const effectiveButtonText = (buttonText || "").trim() || "🌐 AgrozGO platformasi";
    const effectiveButtonUrl =
      (buttonUrl || "").trim() ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://agroz.uz";

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: effectiveButtonText,
            url: effectiveButtonUrl,
          },
        ],
      ],
    };

    const typeIcon = alertType === "frost" ? "❄️" : alertType === "heavy_rain" ? "🌧️" : "⚠️";
    const title =
      customTitle ||
      (alertType === "frost"
        ? `Diqqat: ${region || "Hudud"}da sovuq urishi xavfi!`
        : `Diqqat: ${region || "Hudud"}da kuchli yog'ingarchilik va sel xavfi!`);

    const messageLines = [
      `🚨 <b>SHOSHILINCH AGRO-OGOHLANTIRISH</b>`,
      `📍 <b>Hudud:</b> ${region || "O'zbekiston"}`,
      "",
      `${typeIcon} <b>${title}</b>`,
    ];

    if (customMessage) {
      messageLines.push("", `📝 <b>Tavsiya:</b>`, customMessage);
    } else {
      if (alertType === "frost") {
        messageLines.push(
          "",
          "❄️ Tunda harorat keskin pasayishi kutilmoqda. Ko'chatlar va issiqxonalarni himoyalang, parniklarni mahkam yoping, chorvani issiq joyga oling."
        );
      } else {
        messageLines.push(
          "",
          "🌧️ Kuchli yog'ingarchilik kutilmoqda. Kimyoviy dori sepish va o'g'itlashni to'xtating, ochiq ariqlarni tozalab suv to'planishini oldini oling."
        );
      }
    }

    messageLines.push("", "📱 <i>AgrozGO — Ekin va chorva uchun aqlli tizim</i>");
    const broadcastText = messageLines.join("\n");

    // Maqsadli Telegram foydalanuvchilarini topish
    const allTgUsers = await db
      .select({ telegramId: users.telegramId, region: users.region })
      .from(users)
      .where(isNotNull(users.telegramId));

    let targetUsers = allTgUsers;
    if (region && region !== "Barcha viloyatlar") {
      targetUsers = allTgUsers.filter(
        (u) => u.region && u.region.toLowerCase().includes(region.toLowerCase()),
      );
      if (targetUsers.length === 0) {
        targetUsers = allTgUsers;
      }
    }

    const { sendMessage } = await import("../lib/telegram-bot.js");

    let sentCount = 0;
    for (const u of targetUsers) {
      if (!u.telegramId) continue;
      try {
        const ok = await sendMessage(u.telegramId, broadcastText, {
          keyboard: inlineKeyboard,
        });
        if (ok) sentCount++;
      } catch (e) {
        console.error(`Broadcast to ${u.telegramId} error:`, e);
      }
    }

    res.json({
      ok: true,
      note: `Xabar ${sentCount} ta foydalanuvchiga muvaffaqiyatli yetkazildi!`,
      totalTargetUsers: targetUsers.length,
      sentCount,
      previewMessage: broadcastText,
    });
  } catch (err: any) {
    console.error("[weather-alerts broadcast error]:", err);
    res.status(500).json({ error: err.message || "Xabar tarqatishda xatolik yuz berdi" });
  }
});

// POST /api/admin/weather/send-daily (Kunlik ertalabki agro-ob-havo xabarnomasini yuborish / test qilish)
router.post("/weather/send-daily", requireAdmin, async (req, res) => {
  try {
    const force = Boolean(req.body?.force);
    const testTelegramId = req.body?.testTelegramId ? Number(req.body.testTelegramId) : undefined;
    const { sendDailyMorningAgroWeatherBroadcast } = await import("../lib/weather-alerts.js");
    const result = await sendDailyMorningAgroWeatherBroadcast(force, testTelegramId);
    res.json({
      ok: true,
      message: `Ertalabki ob-havo xabari yuborildi. Yuborildi: ${result.sent}, O'tkazildi: ${result.skipped}, Xatolar: ${result.failed}`,
      ...result,
    });
  } catch (err: any) {
    console.error("[admin send-daily weather error]:", err);
    res.status(500).json({ error: err.message || "Xabar yuborishda xatolik" });
  }
});

// -------------------------------------------------------------
// 14. ADMIN CUSTOM MESSAGING & BROADCASTS (Dorixona, Mutaxassis, Foydalanuvchilar)
// -------------------------------------------------------------

router.get("/messages/recipients-count", requireAdmin, async (_req, res) => {
  try {
    const [pharmacyRows, specialistRows, userRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(
          and(
            eq(specialists.role, "pharmacy"),
            isNotNull(specialists.telegramId),
            eq(specialists.isActive, true)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(
          and(
            eq(specialists.role, "specialist"),
            isNotNull(specialists.telegramId),
            eq(specialists.isActive, true)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(isNotNull(users.telegramId)),
    ]);

    const pharmaciesCount = Number(pharmacyRows[0]?.count || 0);
    const specialistsCount = Number(specialistRows[0]?.count || 0);
    const usersCount = Number(userRows[0]?.count || 0);

    res.json({
      ok: true,
      pharmacies: pharmaciesCount,
      specialists: specialistsCount,
      users: usersCount,
      total: pharmaciesCount + specialistsCount + usersCount,
    });
  } catch (err: any) {
    console.error("[admin recipients count error]:", err);
    res.status(500).json({ error: err.message || "Qabul qiluvchilar sonini hisoblashda xatolik" });
  }
});

async function handleAdminSendBroadcast(req: any, res: any) {
  try {
    const {
      targetType, // "pharmacies" | "specialists" | "users" | "all" | "direct"
      title,
      message,
      buttonText,
      buttonUrl,
      region,
      imageUrl,
      signature,
      directRecipient, // { recipientType: "pharmacy" | "specialist" | "user", id?: number, telegramId?: number }
    } = req.body || {};

    const testTelegramId = req.body?.testTelegramId ? Number(req.body.testTelegramId) : undefined;

    if (!message || typeof message !== "string" || !message.trim()) {
      if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
        return res.status(400).json({ error: "Xabar matnini yoki rasm URL-ni kiriting" });
      }
    }

    const textLines: string[] = [];
    if (title && title.trim()) {
      textLines.push(`📢 <b>${escapeHtml(title.trim())}</b>`);
      textLines.push("");
    }
    if (message && message.trim()) {
      textLines.push(escapeHtml(message.trim()));
    }

    // Pastki imzo (signature): agar berilgan bo'lsa, trim qilingan matn qo'yiladi. Bo'sh bo'lsa imzo qo'yilmaydi.
    // Agar umuman yuborilmagan bo'lsa, standart "AgrozGO" qo'yiladi.
    const customSig = signature !== undefined ? String(signature).trim() : "AgrozGO";
    if (customSig) {
      textLines.push("");
      textLines.push(`<i>${escapeHtml(customSig)}</i>`);
    }
    const fullText = textLines.join("\n");

    const photoUrl: string | undefined =
      imageUrl && typeof imageUrl === "string" && /^https?:\/\//i.test(imageUrl.trim())
        ? imageUrl.trim()
        : undefined;

    // Uzunlik chegaralari tekshiruvi (Telegram qoidasi: rasm sarlavhasi <= 1024, oddiy xabar <= 4096)
    if (photoUrl && fullText.length > 1024) {
      return res.status(400).json({
        error: `Rasm bilan yuboriladigan xabar 1024 belgidan oshmasligi kerak (hozirda: ${fullText.length} ta belgi)`,
      });
    }
    if (!photoUrl && fullText.length > 4096) {
      return res.status(400).json({
        error: `Xabar matni 4096 belgidan oshmasligi kerak (hozirda: ${fullText.length} ta belgi)`,
      });
    }

    let inlineKeyboard: any = undefined;
    if (buttonText && buttonText.trim() && buttonUrl && buttonUrl.trim()) {
      let validUrl = buttonUrl.trim();
      if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = `https://${validUrl}`;
      }
      inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: buttonText.trim(),
              url: validUrl,
            },
          ],
        ],
      };
    }

    async function sendToTg(tgId: number, useAuth: boolean): Promise<{ ok: boolean; error?: string }> {
      try {
        let ok = false;
        if (photoUrl) {
          if (useAuth) {
            ok = await sendAuthPhoto(
              tgId,
              photoUrl,
              fullText,
              inlineKeyboard ? { inline: inlineKeyboard } : undefined
            );
          } else {
            ok = await sendPhoto(
              tgId,
              photoUrl,
              fullText,
              inlineKeyboard ? { keyboard: inlineKeyboard } : undefined
            );
          }
        } else {
          if (useAuth) {
            ok = await sendAuthMessage(
              tgId,
              fullText,
              inlineKeyboard ? { inline: inlineKeyboard } : undefined
            );
          } else {
            ok = await sendMessage(
              tgId,
              fullText,
              inlineKeyboard ? { keyboard: inlineKeyboard } : undefined
            );
          }
        }
        return { ok };
      } catch (err: any) {
        return { ok: false, error: err?.message };
      }
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let sentCount = 0;
    let failedCount = 0;

    // SINOV YUBORISH (TEST SEND)
    if (testTelegramId) {
      const isAuthTarget = targetType === "pharmacies" || targetType === "specialists";
      const sendResult = await sendToTg(testTelegramId, isAuthTarget);
      if (sendResult.ok) {
        return res.json({
          ok: true,
          isTest: true,
          message: `Sinov xabari muvaffaqiyatli yuborildi (${isAuthTarget ? "@agroz_auth_bot" : "@agrozai_bot"} orqali ID: ${testTelegramId})`,
        });
      } else {
        return res.status(400).json({
          ok: false,
          isTest: true,
          error: `Sinov xabarini yuborib bo'lmadi: ${sendResult.error || "Telegram xatosi"}`,
        });
      }
    }

    // DIRECT 1-to-1 MESSAGE
    if (targetType === "direct") {
      if (!directRecipient) {
        return res.status(400).json({ error: "Qabul qiluvchi ko'rsatilmadi" });
      }

      let tgId = directRecipient.telegramId ? Number(directRecipient.telegramId) : null;
      const recType = directRecipient.recipientType;

      if (!tgId && directRecipient.id) {
        if (recType === "pharmacy" || recType === "specialist") {
          const [sp] = await db
            .select({ telegramId: specialists.telegramId })
            .from(specialists)
            .where(eq(specialists.id, Number(directRecipient.id)))
            .limit(1);
          tgId = sp?.telegramId ? Number(sp.telegramId) : null;
        } else {
          const [u] = await db
            .select({ telegramId: users.telegramId })
            .from(users)
            .where(eq(users.id, Number(directRecipient.id)))
            .limit(1);
          tgId = u?.telegramId ? Number(u.telegramId) : null;
        }
      }

      if (!tgId) {
        return res.status(400).json({
          error: "Foydalanuvchining Telegram profili (@agroz_auth_bot yoki @agrozai_bot) ulanmagan.",
        });
      }

      try {
        const resSend = await sendToTg(tgId, recType === "pharmacy" || recType === "specialist");

        if (resSend.ok) {
          sentCount = 1;
        } else {
          failedCount = 1;
        }
      } catch (err) {
        console.error(`Direct message to ${tgId} failed:`, err);
        failedCount = 1;
      }

      return res.json({
        ok: sentCount > 0,
        sentCount,
        failedCount,
        totalTarget: 1,
        message: sentCount > 0 ? "Xabar muvaffaqiyatli yetkazildi!" : "Xabarni yetkazib bo'lmadi",
      });
    }

    // BROADCAST BY AUDIENCE
    const targetPharmacies: number[] = [];
    const targetSpecialists: number[] = [];
    const targetUsers: number[] = [];

    if (targetType === "pharmacies" || targetType === "all") {
      const rows = await db
        .select({ telegramId: specialists.telegramId })
        .from(specialists)
        .where(
          and(
            eq(specialists.role, "pharmacy"),
            isNotNull(specialists.telegramId),
            eq(specialists.isActive, true)
          )
        );
      for (const r of rows) {
        if (r.telegramId) targetPharmacies.push(Number(r.telegramId));
      }
    }

    if (targetType === "specialists" || targetType === "all") {
      const rows = await db
        .select({ telegramId: specialists.telegramId })
        .from(specialists)
        .where(
          and(
            eq(specialists.role, "specialist"),
            isNotNull(specialists.telegramId),
            eq(specialists.isActive, true)
          )
        );
      for (const r of rows) {
        if (r.telegramId) targetSpecialists.push(Number(r.telegramId));
      }
    }

    if (targetType === "users" || targetType === "all") {
      const allTgUsers = await db
        .select({ telegramId: users.telegramId, region: users.region })
        .from(users)
        .where(isNotNull(users.telegramId));

      let matched = allTgUsers;
      if (region && region !== "Barcha viloyatlar") {
        matched = allTgUsers.filter(
          (u) => u.region && u.region.toLowerCase().includes(region.toLowerCase())
        );
      }
      for (const r of matched) {
        if (r.telegramId) targetUsers.push(Number(r.telegramId));
      }
    }

    const totalTarget = targetPharmacies.length + targetSpecialists.length + targetUsers.length;
    if (totalTarget === 0) {
      return res.status(400).json({
        error: "Tanlangan guruhda Telegramga ulangan faol foydalanuvchilar topilmadi",
      });
    }

    const [createdBroadcast] = await db
      .insert(broadcasts)
      .values({
        text: fullText,
        target: String(targetType || "all"),
        buttonText: buttonText ? buttonText.trim() : null,
        buttonUrl: buttonUrl ? buttonUrl.trim() : null,
        total: totalTarget,
        sentCount: 0,
        failedCount: 0,
        status: "jarayonda",
      })
      .returning();

    const broadcastId = createdBroadcast.id;

    // Return immediately so HTTP request does not time out on large broadcasts
    res.json({
      ok: true,
      broadcastId,
      status: "jarayonda",
      sentCount: 0,
      failedCount: 0,
      remaining: totalTarget,
      total: totalTarget,
      totalTarget,
      message: `Yuborish boshlandi (${totalTarget} ta qabul qiluvchi)`,
    });

    // Background job execution (~18 msg/sec = 55ms delay to stay well within Telegram 20-30 msg/sec limit)
    setImmediate(async () => {
      try {
        const recipients: Array<{ tgId: number; useAuth: boolean }> = [
          ...targetPharmacies.map((tgId) => ({ tgId, useAuth: true })),
          ...targetSpecialists.map((tgId) => ({ tgId, useAuth: true })),
          ...targetUsers.map((tgId) => ({ tgId, useAuth: false })),
        ];

        for (let i = 0; i < recipients.length; i++) {
          const item = recipients[i];
          let deliveryOk = false;
          let deliveryError: string | null = null;
          try {
            const sendRes = await sendToTg(item.tgId, item.useAuth);
            deliveryOk = sendRes.ok;
            deliveryError = sendRes.error || null;
            if (deliveryOk) sentCount++;
            else failedCount++;
          } catch (err: any) {
            deliveryOk = false;
            deliveryError = err?.message || "Xatolik";
            failedCount++;
          }

          // Yetkazilganlik tarixiga yozish
          await db
            .insert(broadcastDeliveries)
            .values({
              broadcastId,
              recipientType: item.useAuth ? "specialist" : "user",
              recipientId: item.tgId,
              telegramId: item.tgId,
              status: deliveryOk ? "sent" : "failed",
              error: deliveryError,
              createdAt: new Date(),
            })
            .catch(() => {});

          if ((i + 1) % 5 === 0 || i === recipients.length - 1) {
            await db
              .update(broadcasts)
              .set({ sentCount, failedCount })
              .where(eq(broadcasts.id, broadcastId))
              .catch(() => {});
          }

          if (i < recipients.length - 1) {
            await sleep(55);
          }
        }

        await db
          .update(broadcasts)
          .set({
            sentCount,
            failedCount,
            status: "tugadi",
          })
          .where(eq(broadcasts.id, broadcastId));
      } catch (bgErr) {
        console.error(`[admin broadcast background job #${broadcastId} error]:`, bgErr);
        await db
          .update(broadcasts)
          .set({
            sentCount,
            failedCount,
            status: "toxtadi",
          })
          .where(eq(broadcasts.id, broadcastId))
          .catch(() => {});
      }
    });
  } catch (err: any) {
    console.error("[admin custom message broadcast error]:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Xabar yuborishda xatolik yuz berdi" });
    }
  }
}

router.post("/messages/send", requireAdmin, handleAdminSendBroadcast);
router.post("/broadcast/send", requireAdmin, handleAdminSendBroadcast);

router.get("/broadcasts", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(broadcasts)
      .orderBy(desc(broadcasts.createdAt))
      .limit(20);
    return res.json({
      ok: true,
      broadcasts: rows.map((row) => ({
        ...row,
        remaining: Math.max(0, (row.total || 0) - (row.sentCount || 0) - (row.failedCount || 0)),
      })),
    });
  } catch (err: any) {
    console.error("[admin list broadcasts error]:", err);
    return res.status(500).json({ ok: false, error: "Ommaviy xabarlar tarixini olishda xatolik" });
  }
});

router.get("/broadcasts/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: "Broadcast ID noto'g'ri" });
    }
    const [row] = await db
      .select()
      .from(broadcasts)
      .where(eq(broadcasts.id, id))
      .limit(1);

    if (!row) {
      return res.status(404).json({ ok: false, error: "Ommaviy xabar topilmadi" });
    }

    const remaining = Math.max(0, (row.total || 0) - (row.sentCount || 0) - (row.failedCount || 0));
    return res.json({
      ok: true,
      broadcast: {
        ...row,
        remaining,
      },
    });
  } catch (err: any) {
    console.error("[admin get broadcast status error]:", err);
    return res.status(500).json({ ok: false, error: "Broadcast holatini olishda xatolik" });
  }
});

// -------------------------------------------------------------
// 10. USERS (FOYDALANUVCHILAR VA ULARNING BUYURTMALARI / CHAQIRUVLARI)
// -------------------------------------------------------------

router.get("/users", requireAdmin, async (req, res) => {
  try {
    const { search, filter } = req.query as { search?: string; filter?: string };

    // 1. Foydalanuvchilarni olish
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    // 2. Buyurtmalarni va ularning tovarlarini olish
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const allItems = await db.select().from(orderItems);
    const allSpecialists = await db.select().from(specialists);

    // Dorixonalar xaritasi
    const specMap = new Map<number, (typeof allSpecialists)[0]>();
    for (const s of allSpecialists) {
      specMap.set(s.id, s);
    }

    // Buyurtma itemlari xaritasi
    const itemsMap = new Map<number, (typeof allItems)>();
    for (const item of allItems) {
      const arr = itemsMap.get(item.orderId) || [];
      arr.push(item);
      itemsMap.set(item.orderId, arr);
    }

    // 3. Mutaxassis chaqiruvlarini olish
    const allCalls = await db.select().from(specialistCalls).orderBy(desc(specialistCalls.createdAt));

    // Telefon raqamlarni tozalash (solishtirish uchun: faqat raqamlar)
    const cleanPhone = (p?: string | null) => (p || "").replace(/\D/g, "");

    // Mavjud foydalanuvchilar telefonlari
    const existingPhones = new Set<string>();
    for (const u of allUsers) {
      if (u.phone) existingPhones.add(cleanPhone(u.phone));
    }

    // Har bir user uchun to'liq ma'lumotlarni yig'amiz
    const enrichedUsers: any[] = allUsers.map((u) => {
      const uPhone = cleanPhone(u.phone);

      // Userga tegishli buyurtmalar
      const userOrders = allOrders
        .filter((o) => {
          if (o.userId && o.userId === u.id) return true;
          if (uPhone && cleanPhone(o.customerPhone) === uPhone) return true;
          return false;
        })
        .map((o) => {
          const pharmacy = specMap.get(o.pharmacySpecialistId);
          return {
            id: o.id,
            pharmacyName: pharmacy?.organization || pharmacy?.name || "Dorixona",
            pharmacyPhone: pharmacy?.phone || null,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            customerAddress: o.customerAddress || null,
            deliveryType: o.deliveryType,
            status: o.status,
            totalSum: o.totalSum || 0,
            note: o.note || null,
            createdAt: o.createdAt,
            items: (itemsMap.get(o.id) || []).map((it) => ({
              id: it.id,
              name: it.name,
              price: it.price || 0,
              qty: it.qty,
            })),
          };
        });

      // Userga tegishli mutaxassis chaqiruvlari
      const userCalls = allCalls
        .filter((c) => uPhone && cleanPhone(c.customerPhone) === uPhone)
        .map((c) => {
          const spec = specMap.get(c.specialistId);
          return {
            id: c.id,
            specialistName: spec?.name || "Mutaxassis",
            specialistPhone: spec?.phone || null,
            specialistRole: spec?.role || "specialist",
            specialistSpecialty: spec?.specialty || null,
            customerName: c.customerName,
            customerPhone: c.customerPhone,
            problem: c.problem,
            address: c.address || null,
            status: c.status,
            createdAt: c.createdAt,
          };
        });

      const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalSum || 0), 0);
      const ordersCount = userOrders.length;
      const callsCount = userCalls.length;

      // Aniq manzil: agar user.region/district bo'lmasa yoki qisqa bo'lsa, oxirgi buyurtma yoki chaqiruvdagi to'liq manzil
      let lastAddress = u.region ? (u.district ? `${u.region}, ${u.district}` : u.region) : "";
      if (userOrders.length > 0 && userOrders[0].customerAddress) {
        lastAddress = userOrders[0].customerAddress;
      } else if (userCalls.length > 0 && userCalls[0].address) {
        lastAddress = userCalls[0].address;
      }

      const botStatus: "active" | "never_started" | "blocked" | "no_telegram" = !u.telegramId
        ? "no_telegram"
        : u.botBlocked
        ? "blocked"
        : u.botStartedAt
        ? "active"
        : "never_started";

      return {
        id: u.id,
        name: u.name || "Noma'lum foydalanuvchi",
        phone: u.phone,
        telegramId: u.telegramId ? Number(u.telegramId) : null,
        region: u.region,
        district: u.district,
        address: lastAddress,
        createdAt: u.createdAt,
        consentedAt: u.consentedAt,
        consentVersion: u.consentVersion,
        consentChannel: u.consentChannel,
        consentText: u.consentText,
        isRegistered: true,
        ordersCount,
        totalSpent,
        callsCount,
        botStatus,
        orders: userOrders,
        specialistCalls: userCalls,
      };
    });

    // Saytda ro'yxatdan o'tmasdan buyurtma yoki mutaxassis chaqirgan mijozlarni ham aniqlab qo'shamiz
    const anonClientsMap = new Map<string, {
      name: string;
      phone: string;
      address: string;
      orders: any[];
      calls: any[];
      createdAt: any;
    }>();

    for (const o of allOrders) {
      const cPhone = cleanPhone(o.customerPhone);
      if (cPhone && !existingPhones.has(cPhone)) {
        let entry = anonClientsMap.get(cPhone);
        if (!entry) {
          entry = {
            name: o.customerName,
            phone: o.customerPhone,
            address: o.customerAddress || "",
            orders: [],
            calls: [],
            createdAt: o.createdAt,
          };
          anonClientsMap.set(cPhone, entry);
        }
        const pharmacy = specMap.get(o.pharmacySpecialistId);
        entry.orders.push({
          id: o.id,
          pharmacyName: pharmacy?.organization || pharmacy?.name || "Dorixona",
          pharmacyPhone: pharmacy?.phone || null,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerAddress: o.customerAddress || null,
          deliveryType: o.deliveryType,
          status: o.status,
          totalSum: o.totalSum || 0,
          note: o.note || null,
          createdAt: o.createdAt,
          items: (itemsMap.get(o.id) || []).map((it) => ({
            id: it.id,
            name: it.name,
            price: it.price || 0,
            qty: it.qty,
          })),
        });
      }
    }

    for (const c of allCalls) {
      const cPhone = cleanPhone(c.customerPhone);
      if (cPhone && !existingPhones.has(cPhone)) {
        let entry = anonClientsMap.get(cPhone);
        if (!entry) {
          entry = {
            name: c.customerName,
            phone: c.customerPhone,
            address: c.address || "",
            orders: [],
            calls: [],
            createdAt: c.createdAt,
          };
          anonClientsMap.set(cPhone, entry);
        }
        const spec = specMap.get(c.specialistId);
        entry.calls.push({
          id: c.id,
          specialistName: spec?.name || "Mutaxassis",
          specialistPhone: spec?.phone || null,
          specialistRole: spec?.role || "specialist",
          specialistSpecialty: spec?.specialty || null,
          customerName: c.customerName,
          customerPhone: c.customerPhone,
          problem: c.problem,
          address: c.address || null,
          status: c.status,
          createdAt: c.createdAt,
        });
      }
    }

    // Anonim mijozlarni asosiy ro'yxatga qo'shish
    let anonIndex = 900000;
    for (const [phone, data] of anonClientsMap.entries()) {
      anonIndex++;
      const totalSpent = data.orders.reduce((sum, o) => sum + (o.totalSum || 0), 0);
      enrichedUsers.push({
        id: anonIndex,
        name: data.name,
        phone: data.phone,
        telegramId: null,
        region: null,
        district: null,
        address: data.address,
        createdAt: data.createdAt,
        isRegistered: false,
        ordersCount: data.orders.length,
        totalSpent,
        callsCount: data.calls.length,
        botStatus: "no_telegram",
        orders: data.orders,
        specialistCalls: data.calls,
      });
    }

    // Qidiruv va filtrlash
    let results = enrichedUsers;

    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      results = results.filter(
        (u) =>
          u.name?.toLowerCase().includes(s) ||
          u.phone?.toLowerCase().includes(s) ||
          u.address?.toLowerCase().includes(s) ||
          u.region?.toLowerCase().includes(s) ||
          u.district?.toLowerCase().includes(s) ||
          (u.telegramId && String(u.telegramId).includes(s)),
      );
    }

    if (filter === "with_orders") {
      results = results.filter((u) => u.ordersCount > 0);
    } else if (filter === "with_calls") {
      results = results.filter((u) => u.callsCount > 0);
    } else if (filter === "telegram") {
      results = results.filter((u) => Boolean(u.telegramId));
    }

    // Statistika
    const stats = {
      totalUsers: enrichedUsers.length,
      registeredCount: enrichedUsers.filter((u) => u.isRegistered).length,
      telegramCount: enrichedUsers.filter((u) => Boolean(u.telegramId)).length,
      activeBuyersCount: enrichedUsers.filter((u) => u.ordersCount > 0).length,
      activeCallersCount: enrichedUsers.filter((u) => u.callsCount > 0).length,
      totalOrdersSum: enrichedUsers.reduce((sum, u) => sum + u.totalSpent, 0),
      botStats: {
        active: enrichedUsers.filter((u) => u.botStatus === "active").length,
        neverStarted: enrichedUsers.filter((u) => u.botStatus === "never_started").length,
        blocked: enrichedUsers.filter((u) => u.botStatus === "blocked").length,
        noTelegram: enrichedUsers.filter((u) => u.botStatus === "no_telegram").length,
      },
    };

    res.json({
      ok: true,
      stats,
      users: results,
    });
  } catch (err: any) {
    console.error("[admin/users error]:", err);
    res.status(500).json({ error: err.message || "Foydalanuvchilarni yuklashda xatolik" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri foydalanuvchi ID" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    // 1. Sessiyalarni o'chirish
    await db.delete(sessions).where(eq(sessions.userId, id));

    // 2. Diagnostika natijalarini o'chirish
    await db.delete(diagnoses).where(eq(diagnoses.userId, id));

    // 3. Foydalanuvchi buyurtmalarini tozalash
    const userOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, id));
    for (const o of userOrders) {
      await db.delete(orderItems).where(eq(orderItems.orderId, o.id));
    }
    if (userOrders.length > 0) {
      await db.delete(orders).where(eq(orders.userId, id));
    }

    // 4. Foydalanuvchi chaqiruvlarini tozalash (telefon raqami orqali)
    if (user.phone) {
      const cleanDigits = user.phone.replace(/\D/g, "").slice(-9);
      if (cleanDigits) {
        await db
          .delete(specialistCalls)
          .where(sql`RIGHT(REPLACE(${specialistCalls.customerPhone}, ' ', ''), 9) = ${cleanDigits}`);
      }
    }

    // 5. Bot holatini tozalash
    if (user.telegramId) {
      await db.delete(botStates).where(eq(botStates.telegramId, user.telegramId));
    }

    // 6. Foydalanuvchini o'chirish
    await db.delete(users).where(eq(users.id, id));

    res.json({ ok: true, message: "Foydalanuvchi profili va barcha so'rovlari muvaffaqiyatli o'chirildi" });
  } catch (err: any) {
    console.error("[admin delete user error]:", err);
    res.status(500).json({ error: err.message || "Foydalanuvchini o'chirishda xatolik" });
  }
});

// -------------------------------------------------------------
// 12. SHAXSIY MA'LUMOTLAR ROZILIK JURNALI (O'RQ-547 AUDIT LOG)
// -------------------------------------------------------------

// GET /api/admin/consents
router.get("/consents", requireAdmin, async (req, res) => {
  try {
    const { type, search } = req.query as { type?: string; search?: string };

    let rows = await db.select().from(dataConsents).orderBy(desc(dataConsents.consentedAt));

    if (type && type !== "all") {
      rows = rows.filter((r) => r.subjectType === type);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.telegramId && String(r.telegramId).includes(q)) ||
        r.immutableHash.toLowerCase().includes(q)
      );
    }

    res.json({
      ok: true,
      total: rows.length,
      consents: rows,
    });
  } catch (err: any) {
    console.error("[admin/consents error]:", err);
    res.status(500).json({ error: err.message || "Roziliklar jurnalini yuklashda xatolik" });
  }
});

// DELETE /api/admin/orders/:id
router.delete("/orders/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri buyurtma ID" });
    }

    // Biriktirilgan chaqiruv bo'lsa, mutaxassisni bo'shatish va chaqiruvni o'chirish
    const calls = await db
      .select()
      .from(specialistCalls)
      .where(eq(specialistCalls.assignedOrderId, id));
    for (const c of calls) {
      await db
        .update(specialists)
        .set({ isBusy: false, currentCallId: null })
        .where(eq(specialists.currentCallId, c.id));
      await db.delete(specialistCalls).where(eq(specialistCalls.id, c.id));
    }

    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.delete(orders).where(eq(orders.id, id));

    res.json({ ok: true, message: "Buyurtma o'chirildi" });
  } catch (err: any) {
    console.error("[admin delete order error]:", err);
    res.status(500).json({ error: err.message || "Buyurtmani o'chirishda xatolik" });
  }
});

// DELETE /api/admin/specialist-calls/:id
router.delete("/specialist-calls/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri chaqiruv ID" });
    }

    const [call] = await db.select().from(specialistCalls).where(eq(specialistCalls.id, id)).limit(1);
    if (call) {
      await db
        .update(specialists)
        .set({ isBusy: false, currentCallId: null })
        .where(eq(specialists.currentCallId, id));
      await db.delete(specialistCalls).where(eq(specialistCalls.id, id));
    }

    res.json({ ok: true, message: "Chaqiruv o'chirildi" });
  } catch (err: any) {
    console.error("[admin delete specialist call error]:", err);
    res.status(500).json({ error: err.message || "Chaqiruvni o'chirishda xatolik" });
  }
});

// POST /api/admin/cleanup-orphans
// Qolib ketgan, yetim yoki bekor bo'lgan chaqiruv/so'rovlarni platformadan to'liq tozalash
router.post("/cleanup-orphans", requireAdmin, async (_req, res) => {
  try {
    let cleanedCalls = 0;
    let freedSpecs = 0;
    let cleanedOrderItems = 0;

    // 1. Mutaxassisi yo'q chaqiruvlarni tozalash
    const orphanCalls = await db.execute(
      sql`DELETE FROM specialist_calls WHERE specialist_id NOT IN (SELECT id FROM specialists) RETURNING id`
    );
    cleanedCalls = (orphanCalls.rows?.length as number) || 0;

    // 2. Buyurtmasi yo'q dori bandlarini tozalash
    const orphanItems = await db.execute(
      sql`DELETE FROM order_items WHERE order_id NOT IN (SELECT id FROM orders) RETURNING id`
    );
    cleanedOrderItems = (orphanItems.rows?.length as number) || 0;

    // 3. is_busy = true bo'lib band qolib ketgan mutaxassislarni bo'shatish
    const stuckSpecs = await db.execute(
      sql`UPDATE specialists
          SET is_busy = false, current_call_id = null, updated_at = NOW()
          WHERE is_busy = true
            AND (
              current_call_id IS NULL
              OR current_call_id NOT IN (
                SELECT id FROM specialist_calls WHERE status IN ('yangi', 'qabul_qilindi')
              )
            )
          RETURNING id`
    );
    freedSpecs = (stuckSpecs.rows?.length as number) || 0;

    res.json({
      ok: true,
      cleanedCalls,
      cleanedOrderItems,
      freedSpecialists: freedSpecs,
      message: "Yetim va qolib ketgan barcha so'rovlar muvaffaqiyatli tozalandi.",
    });
  } catch (err: any) {
    console.error("[admin cleanup error]:", err);
    res.status(500).json({ error: err.message || "Tozalashda xatolik" });
  }
});

// -------------------------------------------------------------
// 15. SUPPORT / MUROJAATLAR BOSHQARUVI
// -------------------------------------------------------------

// GET /api/admin/support/tickets
router.get("/support/tickets", requireAdmin, async (req, res) => {
  try {
    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "";

    const allTickets = await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.updatedAt));

    const filteredTickets =
      statusFilter && statusFilter !== "all"
        ? allTickets.filter((t) => t.status === statusFilter)
        : allTickets;

    if (filteredTickets.length === 0) {
      return res.json({
        ok: true,
        items: [],
        counts: {
          total: allTickets.length,
          yangi: allTickets.filter((t) => t.status === "yangi").length,
          javob_berildi: allTickets.filter((t) => t.status === "javob_berildi").length,
          yopiq: allTickets.filter((t) => t.status === "yopiq").length,
        },
      });
    }

    const ticketIds = filteredTickets.map((t) => t.id);
    const [allMessages, allUsers, allSpecs] = await Promise.all([
      db
        .select()
        .from(supportMessages)
        .where(inArray(supportMessages.ticketId, ticketIds))
        .orderBy(asc(supportMessages.createdAt)),
      db.select().from(users),
      db.select().from(specialists),
    ]);

    const userById = new Map<number, (typeof allUsers)[0]>();
    const userByTg = new Map<number, (typeof allUsers)[0]>();
    for (const u of allUsers) {
      userById.set(u.id, u);
      if (u.telegramId) userByTg.set(Number(u.telegramId), u);
    }

    const specById = new Map<number, (typeof allSpecs)[0]>();
    const specByTg = new Map<number, (typeof allSpecs)[0]>();
    for (const s of allSpecs) {
      specById.set(s.id, s);
      if (s.telegramId) specByTg.set(Number(s.telegramId), s);
    }

    const msgMap = new Map<number, typeof allMessages>();
    for (const m of allMessages) {
      const list = msgMap.get(m.ticketId) ?? [];
      list.push(m);
      msgMap.set(m.ticketId, list);
    }

    const items = filteredTickets.map((t) => {
      const spec =
        (t.specialistId ? specById.get(t.specialistId) : undefined) ||
        (t.telegramId ? specByTg.get(Number(t.telegramId)) : undefined);
      const usr =
        (t.userId ? userById.get(t.userId) : undefined) ||
        (t.telegramId ? userByTg.get(Number(t.telegramId)) : undefined);

      const senderName =
        t.userType === "specialist"
          ? spec?.organization || spec?.name || usr?.name || `Mutaxassis #${t.specialistId || t.telegramId || t.id}`
          : usr?.name || spec?.name || `Foydalanuvchi #${t.userId || t.telegramId || t.id}`;
      const senderPhone =
        t.userType === "specialist" ? spec?.phone || usr?.phone || null : usr?.phone || spec?.phone || null;
      const chatId = t.telegramId ?? spec?.telegramId ?? usr?.telegramId ?? null;

      return {
        ...t,
        senderName,
        senderPhone,
        chatId: chatId ? Number(chatId) : null,
        messages: msgMap.get(t.id) ?? [],
      };
    });

    res.json({
      ok: true,
      items,
      counts: {
        total: allTickets.length,
        yangi: allTickets.filter((t) => t.status === "yangi").length,
        javob_berildi: allTickets.filter((t) => t.status === "javob_berildi").length,
        yopiq: allTickets.filter((t) => t.status === "yopiq").length,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/support/tickets error]:", err);
    res.status(500).json({ error: err.message || "Murojaatlarni yuklashda xatolik" });
  }
});

// POST /api/admin/support/tickets/:id/reply
router.post("/support/tickets/:id/reply", requireAdmin, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ error: "Noto'g'ri murojaat ID" });
    }

    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Javob matnini kiriting" });
    }

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return res.status(404).json({ error: "Murojaat topilmadi" });
    }

    const [createdMsg] = await db
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        sender: "admin",
        text,
        createdAt: new Date(),
      })
      .returning();

    const nextStatus = req.body?.closeTicket ? "yopiq" : "javob_berildi";
    await db
      .update(supportTickets)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticket.id));

    // Telegram chat_id (telegram_id) ni bazadan aniqlaymiz va sendMessage yuboramiz
    let chatId: number | null = ticket.telegramId ? Number(ticket.telegramId) : null;
    if (!chatId && ticket.userId) {
      const [u] = await db
        .select({ telegramId: users.telegramId })
        .from(users)
        .where(eq(users.id, ticket.userId))
        .limit(1);
      if (u?.telegramId) chatId = Number(u.telegramId);
    }
    if (!chatId && ticket.specialistId) {
      const [s] = await db
        .select({ telegramId: specialists.telegramId })
        .from(specialists)
        .where(eq(specialists.id, ticket.specialistId))
        .limit(1);
      if (s?.telegramId) chatId = Number(s.telegramId);
    }

    let telegramDelivered = false;
    if (chatId) {
      const tgText = [
        `💬 <b>AgrozGO Qo'llab-quvvatlash xizmati (Murojaat #${ticket.id})</b>`,
        "",
        escapeHtml(text),
      ].join("\n");

      try {
        if (ticket.userType === "specialist") {
          telegramDelivered = await sendAuthMessage(chatId, tgText);
          if (!telegramDelivered) {
            telegramDelivered = await sendMessage(chatId, tgText);
          }
        } else {
          telegramDelivered = await sendMessage(chatId, tgText);
          if (!telegramDelivered) {
            telegramDelivered = await sendAuthMessage(chatId, tgText);
          }
        }
      } catch (tgErr) {
        console.warn("[admin support reply telegram error]:", tgErr);
      }
    }

    res.json({
      ok: true,
      message: createdMsg,
      status: nextStatus,
      telegramDelivered,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/support/tickets/:id/reply error]:", err);
    res.status(500).json({ error: err.message || "Javob yuborishda xatolik" });
  }
});

// PATCH /api/admin/support/tickets/:id/status
router.patch("/support/tickets/:id/status", requireAdmin, async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const status = String(req.body?.status || "").trim();
    if (!Number.isSafeInteger(ticketId) || !["yangi", "javob_berildi", "yopiq"].includes(status)) {
      return res.status(400).json({ error: "Noto'g'ri holat yoki ID" });
    }

    await db
      .update(supportTickets)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTickets.id, ticketId));

    res.json({ ok: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Holatni yangilashda xatolik" });
  }
});

export default router;

