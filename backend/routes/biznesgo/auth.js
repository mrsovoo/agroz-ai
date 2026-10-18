/**
 * AUTH
 *   POST /auth/register            — Web: telefon + parol bilan ro'yxatdan o'tish (sotuvchi yaratadi)
 *   POST /auth/login               — Web: telefon + parol
 *   POST /auth/telegram            — Mini App: initData (HMAC-SHA256) bilan kirish
 *   POST /auth/telegram/register   — Mini App: initData + do'kon ma'lumotlari bilan ro'yxatdan o'tish
 *   GET  /auth/me                  — joriy foydalanuvchi va sotuvchi
 *   PUT  /auth/password            — parol o'rnatish / o'zgartirish (Telegram orqali kirganlar Web uchun)
 */
const express = require('express');
const { query, withTransaction } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { hashPassword, verifyPassword, issueToken, verifyTelegramInitData } = require('../../lib/security');
const { BUSINESS_TYPE_KEYS } = require('../../lib/businessTypes');
const { authenticate, requireMerchant } = require('../../middleware/auth');
const { rateLimit } = require('../../middleware/rateLimit');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'auth' });

const MERCHANT_COLUMNS = `id, user_id, store_name, phone, business_type, address, lat, lng,
  delivery_available, is_active, created_at, (password_hash IS NOT NULL) AS has_password`;

/** Do'kon ma'lumotlarini validatsiya qilish (register uchun umumiy). */
function parseStore(body) {
  const lat = v.num(body.lat, 'lat', { min: -90, max: 90 });
  const lng = v.num(body.lng, 'lng', { min: -180, max: 180 });
  if ((lat === null) !== (lng === null)) {
    throw new HttpError(422, 'lat va lng birga yuborilishi kerak', 'VALIDATION_ERROR', { field: 'lat' });
  }
  return {
    store_name: v.str(body.store_name, 'store_name', { required: true, min: 2, max: 160 }),
    business_type: v.oneOf(body.business_type, 'business_type', BUSINESS_TYPE_KEYS, { required: true }),
    address: v.str(body.address, 'address', { max: 500 }),
    lat,
    lng,
    delivery_available: v.bool(body.delivery_available, 'delivery_available', { defaultValue: false }),
  };
}

async function insertMerchant(client, userId, phone, store, passwordHash = null) {
  const { rows } = await client.query(
    `INSERT INTO merchants (user_id, store_name, phone, business_type, address, lat, lng, location,
                            delivery_available, password_hash)
     VALUES ($1,$2,$3,$4,$5,$6::float8,$7::float8,
             CASE WHEN $6::float8 IS NULL THEN NULL ELSE point($7::float8, $6::float8) END, $8, $9)
     RETURNING ${MERCHANT_COLUMNS}`,
    [userId, store.store_name, phone, store.business_type, store.address, store.lat, store.lng,
      store.delivery_available, passwordHash]
  );
  return rows[0];
}

async function assertPhoneFree(client, phone) {
  const { rows } = await client.query('SELECT 1 FROM merchants WHERE phone = $1', [phone]);
  if (rows[0]) throw new HttpError(409, "Bu telefon raqam bilan sotuvchi allaqachon ro'yxatdan o'tgan", 'PHONE_TAKEN');
}

function sessionResponse(merchant, via) {
  const { token, expiresAt } = issueToken({ userId: merchant.user_id, merchantId: merchant.id, via });
  return { token, expires_at: expiresAt, merchant };
}

// ---------------------------------------------------------------------------
// WEB: register
// ---------------------------------------------------------------------------
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const password = v.str(req.body.password, 'password', { required: true, min: 6, max: 128 });
    const fullName = v.str(req.body.full_name, 'full_name', { max: 160 });
    const store = parseStore(req.body);

    const merchant = await withTransaction(async (client) => {
      await assertPhoneFree(client, phone);
      // Mavjud users yozuvini telefon bo'yicha qidiramiz (raqamlar bo'yicha solishtirish).
      // users jadvalining tuzilishi o'zgartirilmaydi — faqat kerak bo'lsa yangi qator qo'shiladi.
      const digits = phone.replace(/\D/g, '');
      const found = await client.query(
        `SELECT id FROM users WHERE regexp_replace(COALESCE(phone,''), '\\D', '', 'g') = $1 ORDER BY id LIMIT 1`,
        [digits]
      );
      let userId = found.rows[0] && found.rows[0].id;
      if (userId) {
        const taken = await client.query('SELECT 1 FROM merchants WHERE user_id = $1', [userId]);
        if (taken.rows[0]) throw new HttpError(409, 'Bu foydalanuvchida sotuvchi hisobi allaqachon bor', 'ALREADY_MERCHANT');
      } else {
        const ins = await client.query('INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING id', [phone, fullName]);
        userId = ins.rows[0].id;
      }
      return insertMerchant(client, userId, phone, store, hashPassword(password));
    });

    res.status(201).json(sessionResponse(merchant, 'web'));
  })
);

// ---------------------------------------------------------------------------
// WEB: login
// ---------------------------------------------------------------------------
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const password = v.str(req.body.password, 'password', { required: true, max: 128 });

    const { rows } = await query(`SELECT ${MERCHANT_COLUMNS}, password_hash FROM merchants WHERE phone = $1`, [phone]);
    const row = rows[0];
    // Bir xil xabar — telefon mavjudligini oshkor qilmaslik uchun.
    if (!row || !verifyPassword(password, row.password_hash)) {
      throw new HttpError(401, "Telefon yoki parol noto'g'ri", 'BAD_CREDENTIALS');
    }
    if (!row.is_active) throw new HttpError(403, 'Sotuvchi hisobi bloklangan', 'MERCHANT_DISABLED');
    delete row.password_hash;
    res.json(sessionResponse(row, 'web'));
  })
);

// ---------------------------------------------------------------------------
// TELEGRAM MINI APP: login
// ---------------------------------------------------------------------------
function requireInitData(body) {
  const result = verifyTelegramInitData(body && body.initData);
  if (!result.ok) throw new HttpError(401, 'Telegram maʼlumotlari tasdiqlanmadi', `TG_${result.reason}`);
  return result.user;
}

router.post(
  '/telegram',
  authLimiter,
  asyncHandler(async (req, res) => {
    const tgUser = requireInitData(req.body);
    let { rows } = await query(
      `SELECT ${MERCHANT_COLUMNS} FROM merchants
        WHERE user_id IN (SELECT id FROM users WHERE telegram_id = $1)
        ORDER BY id LIMIT 1`,
      [tgUser.id]
    );
    let merchant = rows[0];

    // LEGACY USER MIGRATION: Eski agroz_auth_bot foydalanuvchilarini avtomatik tanish
    if (!merchant) {
      // 1) specialists jadvalidan qidiramiz (eski bot orqali ro'yxatdan o'tgan dorixonalar)
      const specRes = await query(
        `SELECT s.id, s.name, s.phone, s.organization, s.address, s.lat, s.lng, u.id AS user_id
           FROM specialists s
           LEFT JOIN users u ON u.telegram_id = s.telegram_id
          WHERE s.telegram_id = $1
          LIMIT 1`,
        [tgUser.id]
      );
      const spec = specRes.rows[0];

      if (spec) {
        merchant = await withTransaction(async (client) => {
          let uId = spec.user_id;
          if (!uId) {
            const insUser = await client.query(
              `INSERT INTO users (telegram_id, phone, name) VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING RETURNING id`,
              [tgUser.id, spec.phone, spec.name]
            );
            uId = insUser.rows[0]?.id;
            if (!uId) {
              const uRow = await client.query('SELECT id FROM users WHERE telegram_id = $1 LIMIT 1', [tgUser.id]);
              uId = uRow.rows[0]?.id;
            }
          }
          const storeName = spec.organization || spec.name || 'Agro-Vet Do\'koni';
          const phone = spec.phone || (`+99890${String(tgUser.id).slice(-7)}`);
          const insM = await client.query(
            `INSERT INTO merchants (user_id, store_name, phone, business_type, address, lat, lng, location)
             VALUES ($1, $2, $3, 'agro_vet', $4, $5, $6,
                     CASE WHEN $5::float8 IS NULL THEN NULL ELSE point($6::float8, $5::float8) END)
             ON CONFLICT (user_id) DO UPDATE SET store_name = EXCLUDED.store_name
             RETURNING ${MERCHANT_COLUMNS}`,
            [uId, storeName, phone, spec.address || 'O\'zbekiston', spec.lat || null, spec.lng || null]
          );
          return insM.rows[0];
        });
      }
    }

    if (!merchant) {
      // Ro'yxatdan o'tmagan — yangi foydalanuvchi (do'kon turini o'zi tanlab ro'yxatdan o'tadi)
      return res.status(200).json({
        registered: false,
        telegram_user: { id: tgUser.id, first_name: tgUser.first_name, last_name: tgUser.last_name, username: tgUser.username },
      });
    }

    if (!merchant.is_active) throw new HttpError(403, 'Sotuvchi hisobi bloklangan', 'MERCHANT_DISABLED');
    res.json({ registered: true, ...sessionResponse(merchant, 'telegram') });
  })
);

router.post(
  '/telegram/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const tgUser = requireInitData(req.body);
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const store = parseStore(req.body);
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null;

    const merchant = await withTransaction(async (client) => {
      await assertPhoneFree(client, phone);
      const found = await client.query('SELECT id FROM users WHERE telegram_id = $1 ORDER BY id LIMIT 1', [tgUser.id]);
      let userId = found.rows[0] && found.rows[0].id;
      if (userId) {
        const taken = await client.query('SELECT 1 FROM merchants WHERE user_id = $1', [userId]);
        if (taken.rows[0]) throw new HttpError(409, 'Siz allaqachon sotuvchi sifatida ro\'yxatdan o\'tgansiz', 'ALREADY_MERCHANT');
      } else {
        const ins = await client.query(
          'INSERT INTO users (phone, telegram_id, name) VALUES ($1, $2, $3) RETURNING id',
          [phone, tgUser.id, fullName]
        );
        userId = ins.rows[0].id;
      }
      return insertMerchant(client, userId, phone, store, null);
    });

    res.status(201).json({ registered: true, ...sessionResponse(merchant, 'telegram') });
  })
);

// ---------------------------------------------------------------------------
// ME / PASSWORD
// ---------------------------------------------------------------------------
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const u = await query('SELECT id, phone, name, telegram_id FROM users WHERE id = $1', [req.auth.userId]);
    if (!u.rows[0]) throw new HttpError(401, 'Foydalanuvchi topilmadi', 'INVALID_TOKEN');
    const m = await query(`SELECT ${MERCHANT_COLUMNS} FROM merchants WHERE user_id = $1`, [req.auth.userId]);
    res.json({ user: u.rows[0], merchant: m.rows[0] || null, via: req.auth.via });
  })
);

router.put(
  '/password',
  authenticate,
  requireMerchant,
  authLimiter,
  asyncHandler(async (req, res) => {
    const newPassword = v.str(req.body.new_password, 'new_password', { required: true, min: 6, max: 128 });
    const { rows } = await query('SELECT password_hash FROM merchants WHERE id = $1', [req.merchant.id]);
    const current = rows[0] && rows[0].password_hash;
    if (current) {
      const old = v.str(req.body.current_password, 'current_password', { required: true, max: 128 });
      if (!verifyPassword(old, current)) throw new HttpError(401, "Joriy parol noto'g'ri", 'BAD_CREDENTIALS');
    }
    await query(
      "UPDATE merchants SET password_hash = $1, updated_at = (now() AT TIME ZONE 'Asia/Tashkent') WHERE id = $2",
      [hashPassword(newPassword), req.merchant.id]
    );
    res.json({ ok: true });
  })
);

module.exports = router;
