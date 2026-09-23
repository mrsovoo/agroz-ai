import { Router } from "express";
import { listSpecialists } from "../lib/specialists.js";
import { clampRadiusKm, parseCoords } from "../lib/geo.js";
import { rateSpecialist } from "../lib/specialists.js";
import crypto from "node:crypto";
import { db } from "../db/index.js";
import { specialists, specialistCalls } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { sendAuthMessage, isAuthBotConfigured } from "../lib/auth-bot.js";
import { escapeHtml } from "../lib/tg-escape.js";

const router = Router();

// GET /api/specialists
router.get("/", async (req, res) => {
  try {
    const latRaw = req.query.lat as string | undefined;
    const lngRaw = req.query.lng as string | undefined;
    const coords = parseCoords(latRaw, lngRaw);
    const radiusKm = clampRadiusKm(req.query.radius);

    const medsQuery = req.query.med;
    const meds = Array.isArray(medsQuery)
      ? (medsQuery as string[])
      : typeof medsQuery === "string"
      ? [medsQuery]
      : [];

    const items = await listSpecialists({
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      radiusKm,
      role: (req.query.role as string) || null,
      meds,
    });

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({ items, radiusKm });
  } catch (err: any) {
    console.error("[specialists route error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/specialists/rate
router.post("/rate", async (req, res) => {
  try {
    const body = req.body || {};
    const specialistId = Number(body.specialistId);
    const stars = Number(body.stars);

    if (!Number.isInteger(specialistId) || specialistId <= 0) {
      return res.status(400).json({ error: "Mutaxassis ID noto'g'ri" });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Baho 1 dan 5 gacha bo'lishi kerak" });
    }

    const callId = typeof body.callId === "string" ? body.callId.trim() : null;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "anon";
    const raterKey = callId ? `call:${callId.slice(0, 24)}` : crypto.createHash("sha256").update(`${ip}:specialist_rating`).digest("hex").slice(0, 32);

    const result = await rateSpecialist(specialistId, raterKey, stars);
    if (!result) {
      return res.status(404).json({ error: "Mutaxassis topilmadi" });
    }

    res.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[rate error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

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

    if (spec.isBusy) {
      return res.status(400).json({
        error: "Mutaxassis ayni vaqtda boshqa buyurtma ustida ishlamoqda. Iltimos, boshqa mutaxassisni tanlang.",
      });
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
        `⚠️ <b>DIQQAT:</b> Mijoz javobingizni kutmoqda. Iltimos, buyurtmani qabul qiling va mijoz bilan bog'laning!`,
      ]
        .filter(Boolean)
        .join("\n");

      const rows: any[] = [];
      if (cleanPhone) {
        rows.push([{ text: `📞 Mijozga qo'ng'iroq`, url: `tel:${cleanPhone}` }]);
      }
      rows.push([
        { text: "✅ Qabul qilish", callback_data: `sc:accept:${call.id}` },
        { text: "❌ O'tkazib yuborish / Rad etish", callback_data: `sc:reject:${call.id}` },
      ]);

      if (await isAuthBotConfigured()) {
        try {
          await sendAuthMessage(spec.telegramId, msg, { inline: { inline_keyboard: rows } });
        } catch (err) {
          console.error("[specialists/call] Telegram xabar yuborishda xato:", err);
        }
      }
    }

    // Mijozga Agroz AI bot (@agrozai_bot) orqali avtomatik bildirishnoma
    try {
      const { users } = await import("../db/schema.js");
      const { sql } = await import("drizzle-orm");
      const cleanCustomerDigits = customerPhone.replace(/\D/g, "").slice(-9);

      const [userRow] = await db
        .select({ telegramId: users.telegramId })
        .from(users)
        .where(sql`RIGHT(REPLACE(${users.phone}, ' ', ''), 9) = ${cleanCustomerDigits}`)
        .limit(1);

      if (userRow?.telegramId) {
        const { sendMessage } = await import("../lib/telegram-bot.js");
        await sendMessage(
          userRow.telegramId,
          `👨‍⚕️ <b>Mutaxassis chaqiruvi yuborildi! (#${call.id})</b>\n\n` +
            `<b>Mutaxassis:</b> ${escapeHtml(spec.name)} (${escapeHtml(spec.specialty || "Mutaxassis")})\n` +
            `<b>Holat:</b> ⏳ <i>Mutaxassis javobi kutilmoqda...</i>\n\n` +
            `Mutaxassis chaqiruvni qabul qilishi bilan sizga darhol xabar yetkaziladi!`,
        );
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

