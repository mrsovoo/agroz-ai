/**
 * Auth middleware.
 *
 *  authenticate     — foydalanuvchini aniqlaydi (2 usul):
 *                       1) Authorization: Bearer <token>  (Web va Mini App, login'dan keyin)
 *                       2) X-Telegram-Init-Data: <initData> (Mini App, HMAC-SHA256 tekshiruvi)
 *  requireMerchant  — users.id → merchants.user_id bo'yicha FAOL sotuvchini yuklaydi.
 *                     Yo'q bo'lsa 403 (NOT_MERCHANT), bloklangan bo'lsa 403 (MERCHANT_DISABLED).
 *
 * Har bir keyingi so'rov `req.merchant.id` bilan cheklanadi — boshqa merchant
 * ma'lumotlariga kirish lib/ownership.js orqali 403 bilan to'xtatiladi.
 */
const { query } = require('../db/pool');
const { HttpError } = require('../lib/errors');
const { verifyToken, verifyTelegramInitData } = require('../lib/security');

async function findUserIdByTelegramId(telegramId) {
  const { rows } = await query(
    `SELECT u.id FROM users u LEFT JOIN merchants m ON m.user_id = u.id
      WHERE u.telegram_id = $1 ORDER BY (m.id IS NULL), u.id LIMIT 1`,
    [telegramId]
  );
  return rows[0] ? rows[0].id : null;
}

async function authenticate(req, _res, next) {
  try {
    const header = req.get('authorization') || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (bearer) {
      const payload = verifyToken(bearer);
      if (!payload) throw new HttpError(401, 'Sessiya muddati tugagan yoki token yaroqsiz', 'INVALID_TOKEN');
      req.auth = { userId: payload.uid, via: payload.via };
      return next();
    }

    const initData = req.get('x-telegram-init-data');
    if (initData) {
      const result = verifyTelegramInitData(initData);
      if (!result.ok) throw new HttpError(401, 'Telegram maʼlumotlari tasdiqlanmadi', `TG_${result.reason}`);
      const userId = await findUserIdByTelegramId(result.user.id);
      if (!userId) throw new HttpError(403, "Foydalanuvchi ro'yxatdan o'tmagan", 'NOT_REGISTERED');
      req.auth = { userId, via: 'telegram', telegramUser: result.user };
      return next();
    }

    throw new HttpError(401, 'Avtorizatsiya talab qilinadi', 'UNAUTHORIZED');
  } catch (err) {
    next(err);
  }
}

async function requireMerchant(req, _res, next) {
  try {
    if (!req.auth) throw new HttpError(401, 'Avtorizatsiya talab qilinadi');
    const { rows } = await query(
      `SELECT id, user_id, store_name, phone, business_type, address, lat, lng,
              delivery_available, is_active, created_at
         FROM merchants WHERE user_id = $1`,
      [req.auth.userId]
    );
    const merchant = rows[0];
    if (!merchant) throw new HttpError(403, "Sizda BiznesGO sotuvchi hisobi yo'q", 'NOT_MERCHANT');
    if (!merchant.is_active) throw new HttpError(403, 'Sotuvchi hisobi bloklangan', 'MERCHANT_DISABLED');
    req.merchant = merchant;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate, requireMerchant, findUserIdByTelegramId };
