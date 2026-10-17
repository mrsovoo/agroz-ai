import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { users, adminSessions, sessions, specialists } from "../db/schema.js";
import { and, eq, or } from "drizzle-orm";
import { verifyInitData as tgAuthVerifyInitData } from "../lib/tg-auth.js";
import { farmerBotToken, partnerBotToken } from "../lib/settings.js";
import { verifyBiznesGoInitData, verifyBiznesGoSession } from "../lib/biznesgo-auth.js";

// Custom wrapper to include botKind
async function verifyInitData(initData: string, botKind: "user" | "business"): Promise<boolean> {
  if (botKind === "business") {
    if (verifyBiznesGoInitData(initData)) {
      return true;
    }
  }
  const token =
    botKind === "user"
      ? (await farmerBotToken()) || process.env.TELEGRAM_BOT_TOKEN || ""
      : (await partnerBotToken()) || process.env.TELEGRAM_AUTH_BOT_TOKEN || "";
  if (!token) return false;
  return tgAuthVerifyInitData(initData, token, 24 * 60 * 60); // 24 hours expiry
}

// 1. optionalAuth: Populates req.user if present and valid, otherwise just continues
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Telegram InitData
    const initData = (req.headers["x-telegram-init-data"] as string) || req.body?.initData || req.query?.initData;
    if (initData) {
      // By default, optionalAuth expects a "user" bot token, since it's for user endpoints
      if (await verifyInitData(initData as string, "user")) {
        const params = new URLSearchParams(initData as string);
        const userStr = params.get("user");
        if (userStr) {
          const tgUser = JSON.parse(userStr);
          if (tgUser?.id) {
            const dbUsers = await db.select().from(users).where(eq(users.telegramId, tgUser.id)).limit(1);
            if (dbUsers.length > 0) {
              (req as any).user = dbUsers[0];
              (req as any).tgBot = "user";
              return next();
            } else {
              (req as any).user = { telegramId: tgUser.id, name: tgUser.first_name, role: "user" };
              (req as any).tgBot = "user";
              return next();
            }
          }
        }
      }
    }

    // 2. JWT / Session Token
    const authHeader = req.headers?.authorization;
    const cookieHeader = req.headers?.cookie;
    const cookieSession = cookieHeader
      ?.split(";")
      .find((c: string) => c.trim().startsWith("agroai_session=") || c.trim().startsWith("agroz_session="))
      ?.split("=")[1]
      ?.trim();
    const sessionId =
      authHeader?.replace("Bearer ", "")?.trim() ||
      req.headers?.["x-session-id"] ||
      req.cookies?.agroai_session ||
      req.cookies?.agroz_session ||
      cookieSession;

    if (sessionId) {
      const s = await db.select().from(sessions).where(eq(sessions.id, sessionId as string)).limit(1);
      if (s.length > 0) {
        if (s[0].expiresAt && s[0].expiresAt <= new Date()) {
          await db.delete(sessions).where(eq(sessions.id, s[0].id)).catch(() => {});
        } else {
          const u = await db.select().from(users).where(eq(users.id, s[0].userId)).limit(1);
          if (u.length > 0) {
            (req as any).user = u[0];
            return next();
          }
        }
      }
    }

    // Fallthrough: no valid auth, just continue
    return next();
  } catch (err) {
    return next();
  }
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Use optionalAuth, but enforce req.user presence
  await optionalAuth(req, res, () => {
    if ((req as any).user) {
      return next();
    }
    return res.status(401).json({ error: "Avtorizatsiya talab qilinadi" });
  });
};

export const requireTelegramAuth = (botKind: "user" | "business") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const initData = (req.headers["x-telegram-init-data"] as string) || req.body?.initData || req.query?.initData;
      let tgUserObj = null;
      if (initData) {
        if (await verifyInitData(initData, botKind)) {
          const params = new URLSearchParams(initData as string);
          const userStr = params.get("user");
          if (userStr) {
            tgUserObj = JSON.parse(userStr);
            (req as any).telegramUser = tgUserObj;
            (req as any).tgBot = botKind;
          }
        }
      }

      const authHeader = String(
        req.headers["authorization"] || req.headers["x-partner-token"] || req.headers["x-session-id"] || "",
      ).trim();
      const tokenStr = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (tokenStr) {
        if (botKind === "business") {
          const bizSession = await verifyBiznesGoSession(tokenStr);
          if (bizSession.error === "expired") {
            if (!(req as any).telegramUser) {
              return res.status(401).json({ ok: false, error: "Sessiya muddati tugagan. Iltimos, qaytadan kiring" });
            }
          } else if (bizSession.error === "blocked") {
            return res.status(403).json({ ok: false, error: "Sotuvchi profili ma'muriyat tomonidan bloklangan" });
          } else if (bizSession.merchant) {
            (req as any).merchant = bizSession.merchant;
            if (!(req as any).telegramUser) {
              (req as any).telegramUser = {
                id: bizSession.merchant.telegramId,
                first_name: bizSession.merchant.name,
              };
            }
          }
        }

        if (!(req as any).merchant) {
          const sessionRows = await db.select().from(sessions).where(eq(sessions.id, tokenStr)).limit(1);
          if (sessionRows[0]) {
            if (sessionRows[0].expiresAt && sessionRows[0].expiresAt <= new Date()) {
              await db.delete(sessions).where(eq(sessions.id, tokenStr)).catch(() => {});
              if (!(req as any).telegramUser) {
                return res.status(401).json({ ok: false, error: "Sessiya muddati tugagan. Iltimos, qaytadan kiring" });
              }
            } else {
              const userRows = await db.select().from(users).where(eq(users.id, sessionRows[0].userId)).limit(1);
              if (userRows[0]) {
                (req as any).webUser = userRows[0];
              }
            }
          }
        }
      }

      if (!(req as any).telegramUser && !(req as any).webUser && !(req as any).merchant) {
        return res.status(401).json({ ok: false, error: "Avtorizatsiya xatosi (Telegram/Web Token)" });
      }
      return next();
    } catch (e) {
      return res.status(401).json({ ok: false, error: "Tekshiruv xatosi" });
    }
  };
};

export const requireRole = (allowedRoles: ("specialist" | "pharmacy" | "both" | "admin")[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (allowedRoles.includes("admin")) {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.admin_session;
        if (token) {
          const rows = await db.select().from(adminSessions).where(eq(adminSessions.id, token)).limit(1);
          if (rows.length > 0 && rows[0].expiresAt > new Date()) {
            (req as any).admin = rows[0];
            return next();
          }
        }
      }

      if (allowedRoles.includes("specialist") || allowedRoles.includes("pharmacy") || allowedRoles.includes("both")) {
        const tgId = (req as any).telegramUser?.id || (req as any).webUser?.telegramId || (req as any).merchant?.telegramId;
        const webPhone = (req as any).webUser?.phone || (req as any).merchant?.phone;
        const conditions = [];
        if (tgId) conditions.push(eq(specialists.telegramId, Number(tgId)));
        if (webPhone) conditions.push(eq(specialists.phone, String(webPhone)));
        if (conditions.length > 0) {
          const specRows = await db
            .select()
            .from(specialists)
            .where(and(or(...conditions), eq(specialists.isActive, true)))
            .limit(1);
          let spec = specRows[0];

          // Agar yangi sotuvchi @biznesgo_bot orqali biznesgo_merchants ga qo'shilgan bo'lsa, specialists ga ham sinxronlaymiz
          if (!spec && (req as any).merchant) {
            const m = (req as any).merchant;
            const [createdSpec] = await db
              .insert(specialists)
              .values({
                telegramId: Number(m.telegramId),
                name: m.name,
                phone: m.phone,
                role: "pharmacy",
                specialty: m.merchantType === "veterinary_pharmacy" ? "vet_dorixona" : "agro_dorixona",
                organization: m.organizationName,
                address: m.address || m.region || "O'zbekiston",
                lat: m.latitude ?? 41.2995,
                lng: m.longitude ?? 69.2401,
                workHours: m.workingHours || "09:00 - 18:00",
                isApproved: true,
                isActive: m.status === "active",
                botBlocked: m.status === "blocked",
              })
              .returning();
            spec = createdSpec;
          }

          if (spec && !spec.botBlocked) {
            const roleAllowed =
              spec.role === "both"
                ? allowedRoles.includes("pharmacy") || allowedRoles.includes("specialist") || allowedRoles.includes("both")
                : allowedRoles.includes(spec.role as any);

            if (!roleAllowed) {
              return res.status(403).json({ ok: false, error: "Ruxsat etilmagan rol" });
            }

            // Boshqa partnerId'ga tegishli resursga kirishni 403 bilan bloklash
            const requestedPartnerId =
              req.params?.partnerId ?? req.body?.partnerId ?? req.query?.partnerId;
            if (
              requestedPartnerId !== undefined &&
              requestedPartnerId !== null &&
              String(requestedPartnerId).trim() !== "" &&
              Number(requestedPartnerId) !== spec.id
            ) {
              return res.status(403).json({
                ok: false,
                error: "Boshqa hamkorga tegishli resursga kirish taqiqlangan",
              });
            }

            (req as any).specialist = spec;
            return next();
          }
        }
      }
      return res.status(403).json({ ok: false, error: "Ruxsat etilmagan rol" });
    } catch (e) {
      return res.status(500).json({ ok: false, error: "Rol tekshiruvi xatosi" });
    }
  };
};

export const requireAdmin = requireRole(["admin"]);

