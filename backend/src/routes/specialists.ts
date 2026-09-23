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
    const { specialistId, customerName, customerPhone, problem, address } = req.body || {};
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

    // Mutaxassisning Telegram hisobiga xabar yuborish
    if (spec.telegramId) {
      const cleanPhone = customerPhone.replace(/[^\d+]/g, "");
      const msg = [
        `🔔 <b>YANGI MUTAXASSIS CHAQIRUVI! (#${call.id})</b>`,
        "",
        `👤 <b>Mijoz:</b> ${escapeHtml(customerName.trim())}`,
        `📞 <b>Telefon:</b> <code>${escapeHtml(customerPhone.trim())}</code>`,
        address ? `📍 <b>Manzil:</b> ${escapeHtml(address.trim())}` : "",
        `📝 <b>Muammo:</b> <i>${escapeHtml(problem.trim())}</i>`,
        "",
        `⚠️ <b>DIQQAT:</b> Buyurtmani tasdiqlashdan oldin mijoz bilan bog'lanish talab qilinadi va masalaga to'liq oydinlik kiritilishi shart!`,
      ]
        .filter(Boolean)
        .join("\n");

      const rows: any[] = [];
      if (cleanPhone) {
        rows.push([{ text: `📞 Mijozga qo'ng'iroq`, url: `tel:${cleanPhone}` }]);
      }
      rows.push([
        { text: "✅ Qabul qilish", callback_data: `sc:accept:${call.id}` },
        { text: "❌ Bekor qilish", callback_data: `sc:reject:${call.id}` },
      ]);

      if (await isAuthBotConfigured()) {
        try {
          await sendAuthMessage(spec.telegramId, msg, { inline: { inline_keyboard: rows } });
        } catch (err) {
          console.error("[specialists/call] Telegram xabar yuborishda xato:", err);
        }
      }
    }

    res.json({ ok: true, callId: call.id, specialistName: spec.name });
  } catch (err: any) {
    console.error("[specialists/call error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;

