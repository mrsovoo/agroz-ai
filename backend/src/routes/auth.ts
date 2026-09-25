import { Router } from "express";
import { db } from "../db/index.js";
import { otpCodes, sessions, users } from "../db/schema.js";
import { and, eq, lt, or, sql } from "drizzle-orm";
import { randomBytes, randomInt } from "node:crypto";
import { normalizePhone } from "../lib/validate.js";
import { sendOtpSms, smsConfigured } from "../lib/sms.js";
import {
  botChatLink,
  codeMessage,
  getBotUsername,
  isBotConfigured,
  miniAppKeyboard,
  sendMessage,
  startLink,
} from "../lib/telegram-bot.js";
import { verifyInitData } from "../lib/tg-auth.js";
import { BOT_OTP_TTL_MINUTES, OTP_LENGTH, OTP_TTL_MINUTES } from "../lib/constants.js";
import { telegramBotToken } from "../lib/settings.js";
import { rateLimit, RATE_LIMITS } from "../lib/rate-limit.js";

const router = Router();

function devOtpEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.OTP_DEV_MODE === "true";
}

async function telegramIdFromInitData(initData: unknown): Promise<number | null> {
  if (typeof initData !== "string" || !initData) return null;
  const botToken = await telegramBotToken();
  if (!botToken || !verifyInitData(initData, botToken)) return null;
  const raw = new URLSearchParams(initData).get("user");
  if (!raw) return null;
  try {
    const id = Number((JSON.parse(raw) as { id?: number }).id);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

async function findUserByTelegramId(fromId: number): Promise<typeof users.$inferSelect | null> {
  try {
    const rows = await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1);
    return rows[0] || null;
  } catch (err: any) {
    try {
      await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);`);
      const rows = await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1);
      return rows[0] || null;
    } catch {
      return null;
    }
  }
}

// POST /api/auth/request-code
router.post("/request-code", async (req, res) => {
  try {
    const body = req.body || {};
    const phone = normalizePhone(body.phone ?? "");
    if (!phone) {
      return res.status(400).json({ error: "Telefon raqami noto'g'ri (namuna: +998 90 123 45 67)" });
    }

    // Rate limit: 3 requests per minute per phone
    const rl = await rateLimit(`auth:request-code:${phone}`, RATE_LIMITS.authRequestCode.limit, RATE_LIMITS.authRequestCode.windowMs);
    if (!rl.allowed) {
      return res.status(429).json({
        error: "Juda ko'p so'rov. Biroz kuting.",
        retryAfterMs: rl.resetMs - Date.now(),
      });
    }

    const min = 10 ** (OTP_LENGTH - 1);
    const max = 10 ** OTP_LENGTH - 1;
    const code = String(randomInt(min, max + 1));
    const token = randomBytes(24).toString("hex");

    const directTelegramId = await telegramIdFromInitData(body.initData);
    const useBot = !directTelegramId && (await isBotConfigured());
    const ttlMinutes = useBot ? BOT_OTP_TTL_MINUTES : OTP_TTL_MINUTES;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await db
      .delete(otpCodes)
      .where(and(eq(otpCodes.phone, phone), or(eq(otpCodes.used, true), lt(otpCodes.expiresAt, new Date()))));

    await db.insert(otpCodes).values({
      phone,
      code,
      token,
      telegramId: directTelegramId,
      expiresAt,
    });

    if (directTelegramId) {
      await sendMessage(directTelegramId, codeMessage(code, phone, OTP_TTL_MINUTES), {
        keyboard: miniAppKeyboard(),
      });
      const botUser = await getBotUsername();
      return res.json({
        ok: true,
        method: "telegram_direct",
        chatLink: botChatLink(botUser),
      });
    }

    if (useBot) {
      const link = await startLink(token);
      return res.json({
        ok: true,
        method: "telegram_bot",
        botUsername: await getBotUsername(),
        startLink: link,
      });
    }

    if (await smsConfigured()) {
      const ok = await sendOtpSms(phone, code);
      if (ok) {
        return res.json({ ok: true, method: "sms" });
      }
    }

    if (devOtpEnabled()) {
      return res.json({ ok: true, method: "dev", devCode: code });
    }

    res.status(503).json({ error: "SMS xizmati vaqtincha mavjud emas" });
  } catch (err: any) {
    console.error("[request-code error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/auth/verify
router.post("/verify", async (req, res) => {
  try {
    const body = req.body || {};
    const phone = normalizePhone(body.phone ?? "");
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!phone || !code) {
      return res.status(400).json({ error: "Telefon va kod kiritilishi shart" });
    }

    // Rate limit: 5 attempts per minute per phone
    const rl = await rateLimit(`auth:verify:${phone}`, RATE_LIMITS.authVerifyCode.limit, RATE_LIMITS.authVerifyCode.windowMs);
    if (!rl.allowed) {
      return res.status(429).json({
        error: "Juda ko'p urinish. Biroz kuting.",
        retryAfterMs: rl.resetMs - Date.now(),
      });
    }

    const rows = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), eq(otpCodes.used, false)))
      .orderBy(otpCodes.id);

    const match = rows.reverse().find((r) => r.code === code && r.expiresAt > new Date());
    if (!match) {
      return res.status(400).json({ error: "Kod noto'g'ri yoki muddati o'tgan" });
    }

    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, match.id));

    let user = (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
    if (!user) {
      const created = await db
        .insert(users)
        .values({
          phone,
          name: body.name || null,
          region: body.region || null,
        })
        .returning();
      user = created[0];
    }

    const sessionId = randomBytes(32).toString("hex");
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
    });

    res.cookie("agroai_session", sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ ok: true, sessionId, user });
  } catch (err: any) {
    console.error("[verify error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/auth/telegram/check — Mini App ochilganda botda ro'yxatdan o'tganligini tekshirish va ma'lumotlarini olish
router.post("/telegram/check", async (req, res) => {
  try {
    const body = req.body || {};
    const initData = body.initData;
    const botToken = await telegramBotToken();

    if (!botToken || !initData || !verifyInitData(initData, botToken)) {
      return res.status(401).json({ error: "Telegram ma'lumotlari haqiqiy emas" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const telegramId = Number(tgUser.id);

    if (!telegramId) {
      return res.status(400).json({ error: "Telegram ID topilmadi" });
    }

    const user = await findUserByTelegramId(telegramId);
    if (user && user.phone) {
      return res.json({
        ok: true,
        registered: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          secondPhone: user.secondPhone,
          region: user.region,
          district: user.district,
        },
      });
    }

    return res.json({
      ok: true,
      registered: false,
      tgUser: {
        id: telegramId,
        firstName: tgUser.first_name || "",
        lastName: tgUser.last_name || "",
        username: tgUser.username || "",
      },
    });
  } catch (err: any) {
    console.error("[telegram check error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/auth/telegram
router.post("/telegram", async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const rl = await rateLimit(`auth:telegram:${ip}`, RATE_LIMITS.authTelegram.limit, RATE_LIMITS.authTelegram.windowMs);
    if (!rl.allowed) {
      return res.status(429).json({
        error: "Juda ko'p so'rov. Biroz kuting.",
        retryAfterMs: rl.resetMs - Date.now(),
      });
    }

    const body = req.body || {};
    const initData = body.initData;
    const botToken = await telegramBotToken();

    if (!botToken || !initData || !verifyInitData(initData, botToken)) {
      return res.status(401).json({ error: "Telegram ma'lumotlari haqiqiy emas" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const telegramId = Number(tgUser.id);

    if (!telegramId) {
      return res.status(400).json({ error: "Telegram ID topilmadi" });
    }

    const rawName = typeof body.name === "string" ? body.name.trim() : "";
    const phone = body.phone ? normalizePhone(body.phone) : null;
    const secondPhone = body.secondPhone ? normalizePhone(body.secondPhone) : null;
    const region = typeof body.region === "string" ? body.region.trim() : null;

    let user = await findUserByTelegramId(telegramId);

    if (!user) {
      if (phone) {
        const byPhone = (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
        if (byPhone) {
          const finalName = rawName || byPhone.name || [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
          await db
            .update(users)
            .set({ telegramId, name: finalName, secondPhone: secondPhone || byPhone.secondPhone, region: region || byPhone.region })
            .where(eq(users.id, byPhone.id));
          user = { ...byPhone, telegramId, name: finalName, secondPhone: secondPhone || byPhone.secondPhone, region: region || byPhone.region };
        } else {
          const finalName = rawName || [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || "Foydalanuvchi";
          const created = await db
            .insert(users)
            .values({ telegramId, name: finalName, phone, secondPhone, region })
            .returning();
          user = created[0];
        }
      } else {
        return res.status(400).json({
          error: "Foydalanuvchi topilmadi. Avval bot orqali ro'yxatdan o'ting yoki telefon raqamingizni kiriting.",
          registered: false,
        });
      }
    } else {
      // Foydalanuvchi bot orqali avval ro'yxatdan o'tgan
      const updateData: any = {};
      if (rawName && rawName !== user.name) updateData.name = rawName;
      if (region && region !== user.region) updateData.region = region;
      if (phone && (!user.phone || phone !== user.phone)) {
        updateData.phone = phone;
      }
      if (secondPhone && (!user.secondPhone || secondPhone !== user.secondPhone)) {
        updateData.secondPhone = secondPhone;
      }
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, user.id));
        user = { ...user, ...updateData };
      }
    }

    if (!user) {
      return res.status(400).json({ error: "Foydalanuvchi ma'lumotlari topilmadi", registered: false });
    }

    const sessionId = randomBytes(32).toString("hex");
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
    });

    res.cookie("agroai_session", sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ ok: true, sessionId, user, registered: Boolean(user.phone) });
  } catch (err: any) {
    console.error("[auth telegram error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/auth/start-telegram-login
router.post("/start-telegram-login", async (req, res) => {
  try {
    const body = req.body || {};
    const rawPhone = body.phone ? normalizePhone(body.phone) : null;
    const rawSecondPhone = body.secondPhone ? normalizePhone(body.secondPhone) : null;
    const rawName = typeof body.name === "string" ? body.name.trim() : null;

    const token = "auth_" + randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const botUser = (await getBotUsername()) || process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || "agroz_ai_bot";

    const payloadObj = {
      name: rawName,
      secondPhone: rawSecondPhone,
    };

    await db.insert(otpCodes).values({
      phone: rawPhone || "tg_auth",
      code: JSON.stringify(payloadObj),
      token,
      expiresAt,
    });

    res.json({
      ok: true,
      token,
      botUsername: botUser,
      startLink: `https://t.me/${botUser}?start=${token}`,
    });
  } catch (err: any) {
    console.error("[start-telegram-login error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// GET /api/auth/poll-telegram-login
router.get("/poll-telegram-login", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ error: "Token kiritilmadi" });
    }

    const rows = await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.token, token))
      .limit(1);

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "Token topilmadi" });
    }

    if (row.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ error: "Token muddati tugagan" });
    }

    if (row.used && row.code && row.code !== "pending") {
      const sessionId = row.code;
      const sessionRows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (sessionRows[0]) {
        const userRows = await db
          .select()
          .from(users)
          .where(eq(users.id, sessionRows[0].userId))
          .limit(1);

        return res.json({
          ok: true,
          authenticated: true,
          sessionId,
          user: userRows[0] || null,
        });
      }
    }

    res.json({ ok: true, authenticated: false });
  } catch (err: any) {
    console.error("[poll-telegram-login error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/auth/quick-login (Foydalanuvchi ism va viloyat bilan tezkor kirishi uchun)
router.post("/quick-login", async (req, res) => {
  try {
    const body = req.body || {};
    const rawName = String(body.name || "").trim().slice(0, 100);
    const rawRegion = String(body.region || "Toshkent").trim().slice(0, 100);
    const rawPhone = normalizePhone(body.phone ?? "");

    const name = rawName || "Foydalanuvchi";

    let user: any = null;
    if (rawPhone) {
      user = (await db.select().from(users).where(eq(users.phone, rawPhone)).limit(1))[0];
    }

    if (!user) {
      const created = await db
        .insert(users)
        .values({
          name,
          region: rawRegion,
          phone: rawPhone || null,
        })
        .returning();
      user = created[0];
    } else {
      await db
        .update(users)
        .set({ name, region: rawRegion })
        .where(eq(users.id, user.id));
    }

    const sessionId = randomBytes(32).toString("hex");
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
    });

    res.cookie("agroai_session", sessionId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ ok: true, sessionId, user });
  } catch (err: any) {
    console.error("[quick-login error]:", err);
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const sessionId = req.cookies?.["agroai_session"] || req.headers["x-session-id"];
    if (sessionId && typeof sessionId === "string") {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
    res.clearCookie("agroai_session", { path: "/" });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Server xatosi" });
  }
});

export default router;
