import { Router } from "express";
import { listSpecialists, rateSpecialist } from "../lib/specialists.js";
import { clampRadiusKm, parseCoords } from "../lib/geo.js";
import { db } from "../db/index.js";
import { specialists, specialistCalls, orders, users } from "../db/schema.js";
import { and, eq, or, sql } from "drizzle-orm";
import { sendAuthMessage, isAuthBotConfigured } from "../lib/auth-bot.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { pharmacyRadiusKmSetting, specialistRadiusKmSetting } from "../lib/settings.js";
import { getUserFromReq } from "../lib/user-auth.js";

const router = Router();

function getUserPhoneSuffixes(user: typeof users.$inferSelect): string[] {
  const list: string[] = [];
  const p1 = (user.phone || "").replace(/\D/g, "").slice(-9);
  const p2 = (user.secondPhone || "").replace(/\D/g, "").slice(-9);
  if (p1.length === 9) list.push(p1);
  if (p2.length === 9 && !list.includes(p2)) list.push(p2);
  return list;
}

// GET /api/specialists
router.get("/", async (req, res) => {
  try {
    const latRaw = req.query.lat as string | undefined;
    const lngRaw = req.query.lng as string | undefined;
    const coords = parseCoords(latRaw, lngRaw);
    const roleParam = (req.query.role as string) || undefined;
    const role = (!roleParam || roleParam === "all") ? null : roleParam;
    const defaultRadius = role === "pharmacy" 
      ? await pharmacyRadiusKmSetting() 
      : await specialistRadiusKmSetting();
    const radiusKm = clampRadiusKm(req.query.radius, defaultRadius);

    const medsQuery = req.query.med;
    const meds = Array.isArray(medsQuery)
      ? (medsQuery as string[])
      : typeof medsQuery === "string"
      ? [medsQuery]
      : [];

    const region = typeof req.query.region === "string" ? req.query.region.trim() : null;

    const items = await listSpecialists({
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      radiusKm,
      role,
      meds,
      region,
    });

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({ items, radiusKm });
  } catch (err: any) {
    console.error("[specialists route error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/specialists/rate & POST /api/specialists/:id/rate
async function handleRateSpecialist(req: any, res: any) {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Baholash uchun tizimga kiring" });
    }

    const body = req.body || {};
    const specialistId = Number(req.params?.id || body.specialistId);
    const stars = Number(body.stars);

    if (!Number.isInteger(specialistId) || specialistId <= 0) {
      return res.status(400).json({ error: "Mutaxassis ID noto'g'ri" });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Baho 1 dan 5 gacha bo'lishi kerak" });
    }

    const suffixes = getUserPhoneSuffixes(user);
    if (suffixes.length === 0) {
      return res.status(403).json({ error: "Telefon raqamingiz tasdiqlanmagan" });
    }

    const rawCallId = typeof body.callId === "string" || typeof body.callId === "number" ? String(body.callId).trim() : null;
    let verifiedRaterKey: string | null = null;
    let verifiedCallId: number | null = null;

    if (rawCallId && /^\d+$/.test(rawCallId)) {
      const numCallId = Number(rawCallId);
      const [callRow] = await db
        .select()
        .from(specialistCalls)
        .where(and(eq(specialistCalls.id, numCallId), eq(specialistCalls.specialistId, specialistId)))
        .limit(1);

      const callSuffix = (callRow?.customerPhone || "").replace(/\D/g, "").slice(-9);
      if (!callRow || !suffixes.includes(callSuffix)) {
        return res.status(403).json({ error: "Ruxsat yo'q: bu chaqiruv sizga tegishli emas" });
      }
      verifiedCallId = numCallId;
      verifiedRaterKey = `call:${numCallId}`;
    } else {
      // Foydalanuvchining shu mutaxassisda chaqiruvi yoki buyurtmasi borligini tekshiramiz
      const phoneConds = suffixes.map(
        (sfx) => sql`RIGHT(REGEXP_REPLACE(${specialistCalls.customerPhone}, '\\D', '', 'g'), 9) = ${sfx}`,
      );
      const [matchingCall] = await db
        .select({ id: specialistCalls.id })
        .from(specialistCalls)
        .where(and(eq(specialistCalls.specialistId, specialistId), or(...phoneConds)))
        .limit(1);

      if (matchingCall) {
        verifiedCallId = matchingCall.id;
        verifiedRaterKey = `call:${matchingCall.id}`;
      } else {
        const orderPhoneConds = [
          eq(orders.userId, user.id),
          ...suffixes.map((sfx) => sql`RIGHT(REGEXP_REPLACE(${orders.customerPhone}, '\\D', '', 'g'), 9) = ${sfx}`),
        ];
        const [matchingOrder] = await db
          .select({ id: orders.id })
          .from(orders)
          .where(and(eq(orders.pharmacySpecialistId, specialistId), or(...orderPhoneConds)))
          .limit(1);

        if (!matchingOrder) {
          return res.status(403).json({
            error: "Faqat tegishli chaqiruv yoki buyurtma egasi mutaxassisni baholay oladi",
          });
        }
        verifiedRaterKey = `order:${matchingOrder.id}`;
      }
    }

    const result = await rateSpecialist(specialistId, verifiedRaterKey, stars);
    if (!result) {
      return res.status(404).json({ error: "Mutaxassis topilmadi" });
    }

    if (verifiedCallId) {
      await db
        .update(specialistCalls)
        .set({ status: "bajarildi", updatedAt: new Date() })
        .where(eq(specialistCalls.id, verifiedCallId))
        .catch(() => {});
      await db
        .update(specialists)
        .set({ isBusy: false, currentCallId: null, updatedAt: new Date() })
        .where(eq(specialists.currentCallId, verifiedCallId))
        .catch(() => {});
    }

    res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[rate error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
}

router.post("/rate", handleRateSpecialist);
router.post("/:id/rate", handleRateSpecialist);

// POST /api/specialists/call
router.post("/call", async (req, res) => {
  try {
    const { specialistId, customerName, customerPhone, problem, address, userLat, userLng } = req.body || {};
    const specId = Number(specialistId);

    if (!Number.isInteger(specId) || specId <= 0) {
      return res.status(400).json({ error: "Mutaxassis tanlanmagan" });
    }
    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
      return res.status(400).json({ error: "Ismingizni to'liq kiriting" });
    }
    if (!customerPhone || typeof customerPhone !== "string") {
      return res.status(400).json({ error: "Telefon raqam kiritilishi shart" });
    }
    if (!problem || typeof problem !== "string" || problem.trim().length < 3) {
      return res.status(400).json({ error: "Muammo yoki so'rovingizni yozing" });
    }

    const [spec] = await db
      .select()
      .from(specialists)
      .where(eq(specialists.id, specId))
      .limit(1);

    if (!spec) {
      return res.status(404).json({ error: "Mutaxassis topilmadi" });
    }

    const [call] = await db
      .insert(specialistCalls)
      .values({
        specialistId: specId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        problem: problem.trim(),
        address: address && typeof address === "string" ? address.trim() : null,
        status: "yangi",
      })
      .returning();

    const user = await getUserFromReq(req);
    if (user && (!user.phone || user.phone !== customerPhone.trim())) {
      await db.update(users).set({ phone: customerPhone.trim() }).where(eq(users.id, user.id));
      user.phone = customerPhone.trim();
    }

    // Masofani hisoblash (agar mijoz va mutaxassis koordinatasi bo'lsa)
    let distanceText = "";
    if (userLat && userLng && spec.lat && spec.lng) {
      const { distanceKm } = await import("../lib/geo.js");
      const km = distanceKm(Number(userLat), Number(userLng), spec.lat, spec.lng);
      distanceText = `taxminan ${km.toFixed(1)} km`;
    }

    // Mutaxassisning Telegram hisobiga xabar yuborish (@agroz_auth_bot)
    if (spec.telegramId) {
      const cleanPhone = customerPhone.replace(/[^\d+]/g, "");
      const msg = [
        `🔔 <b>YANGI MUTAXASSIS CHAQIRUVI! (#${call.id})</b>`,
        "",
        `👤 <b>Mijoz:</b> ${escapeHtml(customerName.trim())}`,
        `📞 <b>Telefon:</b> <code>${escapeHtml(customerPhone.trim())}</code>`,
        address ? `📍 <b>Manzil:</b> ${escapeHtml(address.trim())}` : "",
        distanceText ? `📏 <b>Masofa:</b> ${distanceText}` : "",
        `📝 <b>Nima uchun / Izoh:</b> <i>${escapeHtml(problem.trim())}</i>`,
        "",
        `⚠️ <b>DIQQAT:</b> Mijoz javobingizni kutmoqda. Iltimos, chaqiruvni qabul qiling va mijoz bilan bog'laning!`,
      ]
        .filter(Boolean)
        .join("\n");

      const rows: any[] = [
        [
          { text: "✅ Qabul qilish", callback_data: `sc:accept:${call.id}` },
          { text: "❌ O'tkazib yuborish / Rad etish", callback_data: `sc:reject:${call.id}` },
        ],
      ];

      let sentToSpec = false;
      if (await isAuthBotConfigured()) {
        try {
          sentToSpec = await sendAuthMessage(Number(spec.telegramId), msg, { inline: { inline_keyboard: rows } });
        } catch (err) {
          console.error("[specialists/call] Auth bot xabar yuborishda xato:", err);
        }
      }

      // Fallback: Agar auth bot orqali bormasa, asosiy bot orqali yuborish
      if (!sentToSpec) {
        try {
          const { sendMessage, isBotConfigured } = await import("../lib/telegram-bot.js");
          if (await isBotConfigured()) {
            await sendMessage(
              Number(spec.telegramId),
              `${msg}\n\n⚠️ Qabul qilish/rad etish tugmalari faqat @agroz_auth_bot orqali ishlaydi. Iltimos, auth bot webhook/token sozlamalarini tekshiring.`,
            );
          }
        } catch (err) {
          console.error("[specialists/call] Asosiy bot fallback xatosi:", err);
        }
      }
    }

    // Mijozga AgrozGO bot (@agroz_bot) orqali avtomatik bildirishnoma
    try {
      const cleanCustomerDigits = customerPhone.replace(/\D/g, "").slice(-9);
      let customerTelegramId = user?.telegramId ?? null;

      if (!customerTelegramId && cleanCustomerDigits) {
        const [userRow] = await db
          .select({ telegramId: users.telegramId })
          .from(users)
          .where(sql`RIGHT(REGEXP_REPLACE(${users.phone}, '\\D', '', 'g'), 9) = ${cleanCustomerDigits}`)
          .limit(1);
        if (userRow?.telegramId) {
          customerTelegramId = userRow.telegramId;
        } else {
          // Fallback: otpCodes dan ham izlaymiz
          const { otpCodes } = await import("../db/schema.js");
          const [otpRow] = await db
            .select({ telegramId: otpCodes.telegramId })
            .from(otpCodes)
            .where(sql`RIGHT(REGEXP_REPLACE(${otpCodes.phone}, '\\D', '', 'g'), 9) = ${cleanCustomerDigits} AND ${otpCodes.telegramId} IS NOT NULL`)
            .orderBy(sql`${otpCodes.createdAt} DESC`)
            .limit(1);
          if (otpRow?.telegramId) {
            customerTelegramId = otpRow.telegramId;
          }
        }
      }

      if (customerTelegramId) {
        const msg =
          `👨‍⚕️ <b>Hozirda ${escapeHtml(spec.name)}ga chaqiruv yuborildi, tez orada siz bilan bog'lanadi. (#${call.id})</b>\n\n` +
          `<b>Xizmat turi:</b> ${escapeHtml(problem.trim())}\n` +
          (spec.phone ? `<b>Mutaxassis raqami:</b> <code>${escapeHtml(spec.phone)}</code>\n` : "") +
          `\nMutaxassis chaqiruvni tasdiqlashi bilan sizga yana xabar yetkaziladi!`;

        let sent = false;
        try {
          const { sendMessage, isBotConfigured } = await import("../lib/telegram-bot.js");
          if (await isBotConfigured()) {
            await sendMessage(Number(customerTelegramId), msg);
            sent = true;
          }
        } catch (botErr) {
          console.error("[specialists/call] Main bot send error:", botErr);
        }

        if (!sent && (await isAuthBotConfigured())) {
          try {
            await sendAuthMessage(Number(customerTelegramId), msg);
          } catch (authErr) {
            console.error("[specialists/call] Auth bot fallback send error:", authErr);
          }
        }
      }
    } catch (e) {
      console.error("[specialists/call] Customer notify error:", e);
    }

    res.json({ ok: true, callId: call.id, specialistName: spec.name });
  } catch (err: any) {
    console.error("[specialists/call error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/specialists/call/:id/status
router.get("/call/:id/status", async (req, res) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: "Chaqiruv holatini ko'rish uchun tizimga kiring" });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Noto'g'ri chaqiruv ID" });
    }

    const [call] = await db
      .select()
      .from(specialistCalls)
      .where(eq(specialistCalls.id, id))
      .limit(1);

    if (!call) {
      return res.status(404).json({ error: "Chaqiruv topilmadi" });
    }

    const suffixes = getUserPhoneSuffixes(user);
    const callPhoneSuffix = (call.customerPhone || "").replace(/\D/g, "").slice(-9);
    if (!callPhoneSuffix || !suffixes.includes(callPhoneSuffix)) {
      return res.status(403).json({ error: "Ruxsat yo'q: bu chaqiruv sizga tegishli emas" });
    }

    const [spec] = await db
      .select()
      .from(specialists)
      .where(eq(specialists.id, call.specialistId))
      .limit(1);

    res.json({
      ok: true,
      id: call.id,
      status: call.status, // yangi | qabul_qilindi | bajarildi | bekor
      specialistId: call.specialistId,
      specialistName: spec?.organization || spec?.name || "Mutaxassis",
      specialistPhone: spec?.phone || null,
      isBusy: spec?.isBusy ?? false,
      updatedAt: call.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
