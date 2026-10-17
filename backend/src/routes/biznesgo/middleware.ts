import { Request, Response, NextFunction } from "express";
import { db } from "../../db/index.js";
import { biznesgoMerchants } from "../../db/schema.js";
import {
  findOrSyncMerchantByTelegramId,
  verifyBiznesGoInitData,
  verifyBiznesGoSession,
} from "../../lib/biznesgo-auth.js";

export interface BiznesGoRequest extends Request {
  merchant?: typeof biznesgoMerchants.$inferSelect;
  telegramUser?: {
    id: number;
    telegramId: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  };
}

/**
 * BiznesGO sotuvchisi avtorizatsiyasini tekshiruvchi middleware.
 * - Authorization header (Bearer <token>)
 * - x-session-id header
 * - x-telegram-init-data header
 */
export async function requireBiznesGoMerchant(
  req: BiznesGoRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = String(req.headers["authorization"] || req.headers["x-session-id"] || "").trim();
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (token) {
      const { merchant, error } = await verifyBiznesGoSession(token);
      if (error === "expired") {
        return res.status(401).json({
          ok: false,
          error: "Sessiya muddati tugagan. Iltimos, qaytadan kiring",
        });
      }
      if (error === "blocked") {
        return res.status(403).json({
          ok: false,
          error: "Sotuvchi profili ma'muriyat tomonidan bloklangan",
        });
      }
      if (merchant) {
        req.merchant = merchant;
        return next();
      }
    }

    // Telegram initData orqali to'g'ridan-to'g'ri tekshirish
    const initData = (req.headers["x-telegram-init-data"] as string) || req.body?.initData;
    if (initData && typeof initData === "string") {
      const verifiedUser = verifyBiznesGoInitData(initData);
      if (verifiedUser) {
        req.telegramUser = verifiedUser;
        const merchant = await findOrSyncMerchantByTelegramId(verifiedUser.id);

        if (merchant) {
          if (merchant.status === "blocked") {
            return res.status(403).json({
              ok: false,
              error: "Sotuvchi profili ma'muriyat tomonidan bloklangan",
            });
          }
          req.merchant = merchant;
          return next();
        }
      }
    }

    return res.status(401).json({
      ok: false,
      error: "Avtorizatsiya talab qilinadi. Iltimos, Telegram orqali kiring",
    });
  } catch (err) {
    console.error("[biznesgo:requireBiznesGoMerchant error]:", err);
    return res.status(401).json({ ok: false, error: "Avtorizatsiyani tekshirishda xatolik yuz berdi" });
  }
}

/**
 * Boshqa merchant_id'ga tegishli resursga kirishni taqiqlash (403).
 */
export function ensureSameMerchant(
  req: BiznesGoRequest,
  res: Response,
): typeof biznesgoMerchants.$inferSelect | null {
  const merchant = req.merchant;
  if (!merchant || !merchant.id) {
    res.status(401).json({ ok: false, error: "Avtorizatsiya talab qilinadi" });
    return null;
  }

  const requestedMerchantId =
    req.params?.merchantId ??
    req.body?.merchantId ??
    req.query?.merchantId ??
    req.params?.id ??
    req.body?.id;

  if (
    requestedMerchantId !== undefined &&
    requestedMerchantId !== null &&
    String(requestedMerchantId).trim() !== "" &&
    Number(requestedMerchantId) !== merchant.id
  ) {
    res.status(403).json({
      ok: false,
      error: "Boshqa sotuvchiga tegishli ma'lumotga kirish taqiqlangan",
    });
    return null;
  }

  return merchant;
}

