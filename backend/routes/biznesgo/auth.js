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
const crypto = require('crypto');
const config = require('../../config');
const { query, withTransaction } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { hashPassword, verifyPassword, issueToken, verifyTelegramInitData } = require('../../lib/security');
const { BUSINESS_TYPE_KEYS } = require('../../lib/businessTypes');
const { authenticate, requireMerchant } = require('../../middleware/auth');
const { rateLimit } = require('../../middleware/rateLimit');
const { callTelegramApi } = require('../../services/telegramBot');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: 'auth' });

const MERCHANT_COLUMNS = `id, user_id, store_name, phone, business_type, address, lat, lng,
  delivery_available, is_active, created_at, (password_hash IS NOT NULL) AS has_password`;

const JOINED_MERCHANT_COLUMNS = `m.id, m.user_id, m.store_name, m.phone, m.business_type, m.address, m.lat, m.lng,
  m.delivery_available, m.is_active, m.created_at, (m.password_hash IS NOT NULL) AS has_password`;

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
// WEB & TELEGRAM OTP AUTHENTICATION
// ---------------------------------------------------------------------------

/**
 * POST /api/biznesgo/auth/send-otp
 * Foydalanuvchi telefon raqamini kiritganda 6-xonali OTP kod generatsiya qilish
 * va Telegram bot orqali yuborish yoki Direct Confirmation Link qaytarish
 */
router.post(
  '/send-otp',
  authLimiter,
  asyncHandler(async (req, res) => {
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const phoneDigits = phone.replace(/\D/g, '');
    const last9 = phoneDigits.slice(-9);

    // 1. 6-xonali xavfsiz OTP kod generatsiya qilish
    const code = crypto.randomInt(100000, 1000000).toString();

    // 2. Ushbu telefon raqamiga bog'langan Telegram foydalanuvchisini qidirish (oxirgi 9 raqam bo'yicha)
    const [userRes, merchantRes, specRes, otpPrevRes] = await Promise.all([
      query(
        `SELECT id, name, telegram_id FROM users
          WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1
            AND telegram_id IS NOT NULL
          ORDER BY id DESC LIMIT 1`,
        [last9]
      ),
      query(
        `SELECT m.id, m.store_name, u.telegram_id
           FROM merchants m
           JOIN users u ON u.id = m.user_id
          WHERE RIGHT(regexp_replace(COALESCE(m.phone,''), '\\D', '', 'g'), 9) = $1
            AND u.telegram_id IS NOT NULL
          ORDER BY m.id DESC LIMIT 1`,
        [last9]
      ),
      query(
        `SELECT id, name, telegram_id FROM specialists
          WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1
            AND telegram_id IS NOT NULL
          ORDER BY id DESC LIMIT 1`,
        [last9]
      ),
      query(
        `SELECT telegram_id FROM otp_codes
          WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1
            AND telegram_id IS NOT NULL
          ORDER BY id DESC LIMIT 1`,
        [last9]
      ),
    ]);

    const targetTgId =
      merchantRes.rows[0]?.telegram_id ||
      userRes.rows[0]?.telegram_id ||
      specRes.rows[0]?.telegram_id ||
      otpPrevRes.rows[0]?.telegram_id ||
      null;

    // 3. Avvalgi foydalanilmagan kodlarni bekor qilish va yangi kodni saqlash (1 daqiqa = 60 soniya)
    await query(
      `UPDATE otp_codes SET used = true
        WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1 AND used = false`,
      [last9]
    );

    const insOtp = await query(
      `INSERT INTO otp_codes (phone, code, used, attempts, telegram_id, expires_at, created_at)
       VALUES ($1, $2, false, 0, $3, now() + interval '60 seconds', now())
       RETURNING id, phone, code, expires_at`,
      [phone, code, targetTgId ? Number(targetTgId) : null]
    );

    let deliveredViaTelegram = false;
    const botName = 'biznesgo_bot';

    // 4. Faqat @biznesgo_bot orqali xabar yuborish
    if (targetTgId && config.biznesgoBotToken) {
      const text =
        `🔐 <b>BiznesGO Web Kirish Kodingiz</b>:\n\n` +
        `<code>${code}</code>\n\n` +
        `⏳ Ushbu kod <b>1 daqiqa</b> davomida amal qiladi.\n\n` +
        `<i>Kodni brauzerga kiriting yoki pastdagi tugma orqali ilovani oching:</i>`;

      try {
        const tgRes = await callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
          chat_id: targetTgId,
          text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Ilovani ochish (Launch App)',
                  web_app: { url: config.miniAppUrl },
                },
              ],
            ],
          },
        });
        if (tgRes.ok) {
          deliveredViaTelegram = true;
          await query(
            `UPDATE otp_codes SET delivered_at = now() WHERE id = $1`,
            [insOtp.rows[0].id]
          );
        }
      } catch (e) {
        // biznesgo_bot orqali yuborishda xatolik bo'lsa
      }
    }

    const botUrl = `https://t.me/${config.biznesgoBotUsername || 'biznesgo_bot'}?start=otp_${code}`;

    res.json({
      ok: true,
      delivered_via_telegram: deliveredViaTelegram,
      bot_name: botName,
      phone,
      expires_in_seconds: 60,
      bot_url: botUrl,
      has_telegram_link: Boolean(targetTgId),
      message: deliveredViaTelegram
        ? "Tasdiqlash kodi @biznesgo_bot orqali yuborildi"
        : "Kodni olish uchun @biznesgo_bot ga kiring",
    });
  })
);

/**
 * POST /api/biznesgo/auth/verify-otp
 * Web: OTP kodni tekshirish, Cross-Platform sinxronizatsiya va JWT Token berish
 */
router.post(
  '/verify-otp',
  authLimiter,
  asyncHandler(async (req, res) => {
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const code = v.str(req.body.code, 'code', { required: true, min: 4, max: 10 });
    const phoneDigits = phone.replace(/\D/g, '');
    const last9 = phoneDigits.slice(-9);

    // 1. Eng so'nggi aktiv OTP kodni tekshirish (now() bilan xavfsiz solishtirish)
    const otpRes = await query(
      `SELECT id, phone, code, used, attempts, telegram_id, expires_at,
              (expires_at > now()) AS is_valid
         FROM otp_codes
        WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1
          AND used = false
        ORDER BY id DESC
        LIMIT 1`,
      [last9]
    );

    const otpRecord = otpRes.rows[0];
    if (!otpRecord) {
      throw new HttpError(400, "Tasdiqlash kodi topilmadi. Qaytadan kod so‘rang.", 'OTP_NOT_FOUND');
    }

    if (!otpRecord.is_valid) {
      throw new HttpError(400, "Tasdiqlash kodi muddati o‘tgan (1 daqiqa). Qaytadan kod so‘rang.", 'OTP_EXPIRED');
    }

    if (otpRecord.attempts >= 5) {
      throw new HttpError(429, "Ko'p noto'g'ri urinish. Iltimos, yangi kod so'rang.", 'OTP_MAX_ATTEMPTS');
    }

    // Kodni solishtirish
    if (otpRecord.code.trim() !== code.trim()) {
      await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otpRecord.id]);
      throw new HttpError(400, "Tasdiqlash kodi noto'g'ri", 'OTP_INVALID');
    }

    // Kod to'g'ri — used holatiga o'tkazish
    await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);

    const linkedTgId = otpRecord.telegram_id;

    // 2a. Mavjud to'liq sozlangan merchant bormi?
    const mRes = await query(
      `SELECT ${JOINED_MERCHANT_COLUMNS}, u.id AS owner_user_id, u.telegram_id AS current_tg_id, u.name AS user_name
         FROM merchants m
         JOIN users u ON u.id = m.user_id
        WHERE RIGHT(regexp_replace(COALESCE(m.phone,''), '\\D', '', 'g'), 9) = $1
        ORDER BY m.id LIMIT 1`,
      [last9]
    );
    let merchant = mRes.rows[0];

    // Agar do'kon oldin to'liq ro'yxatdan o'tgan bo'lsa (Mening Do'konim emas)
    if (merchant && merchant.store_name && merchant.store_name !== "Mening Do'konim") {
      if (linkedTgId && !merchant.current_tg_id) {
        await query(
          `UPDATE users SET telegram_id = $1 WHERE id = $2`,
          [linkedTgId, merchant.owner_user_id]
        );
      }
      if (!merchant.is_active) {
        throw new HttpError(403, "Sotuvchi hisobi bloklangan", 'MERCHANT_DISABLED');
      }

      // Foydalanuvchining Telegram botiga tasdiq xabari va Launch App tugmasini yuboramiz
      const userTgId = merchant.current_tg_id || linkedTgId;
      if (userTgId && config.biznesgoBotToken) {
        callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
          chat_id: userTgId,
          text:
            `✅ <b>Hisobingizga muvaffaqiyatli kirildi!</b>\n\n` +
            `🏪 <b>${merchant.store_name}</b>\n` +
            `Telefon: <code>${phone}</code>\n\n` +
            `Siz BiznesGO tizimidan brauzerda ham, ushbu Telegram bot ichida ham to‘liq foydalanishingiz mumkin.\n\n` +
            `👇 <b>Ilovani ishga tushirish (Launch App):</b>`,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Ilovani ochish (Launch App)',
                  web_app: { url: config.miniAppUrl },
                },
              ],
            ],
          },
        }).catch(() => {});

        callTelegramApi(config.biznesgoBotToken, 'setChatMenuButton', {
          chat_id: userTgId,
          menu_button: {
            type: 'web_app',
            text: '🚀 BiznesGO',
            web_app: { url: config.miniAppUrl },
          },
        }).catch(() => {});
      }

      return res.json(sessionResponse(merchant, 'web_otp'));
    }

    // 2b. Agar merchant yo'q bo'lsa yoki nomi bo'lmasa ("Mening Do'konim"):
    // Foydalanuvchiga to'liq do'kon ochish formasini ko'rsatish uchun onboarding talab qilinadi
    const uRes = await query(
      `SELECT id, name, phone, telegram_id FROM users
        WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1
        ORDER BY id LIMIT 1`,
      [last9]
    );
    let user = uRes.rows[0];
    if (user && linkedTgId && !user.telegram_id) {
      await query(`UPDATE users SET telegram_id = $1 WHERE id = $2`, [linkedTgId, user.id]);
      user.telegram_id = linkedTgId;
    }

    return res.json({
      ok: true,
      verified: true,
      needs_onboarding: true,
      phone: phone,
      user: user || { phone },
      message: 'Tasdiqlandi! Do‘koningiz ma’lumotlarini kiriting.',
    });
  })
);

/**
 * POST /api/biznesgo/auth/check-otp
 * Web polling: Foydalanuvchi Telegram botda START bosganini avtomatik aniqlash va kirish
 */
router.post(
  '/check-otp',
  authLimiter,
  asyncHandler(async (req, res) => {
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const phoneDigits = phone.replace(/\D/g, '');
    const code = req.body.code ? String(req.body.code).trim() : null;

    if (!code || code.length < 4) {
      return res.json({ ok: false, verified: false, message: 'Tasdiqlash kodi kiritilishi shart' });
    }

    const where = [
      `regexp_replace(COALESCE(phone,''), '\\D', '', 'g') = $1`,
      `code = $2`,
      `expires_at > now()`,
    ];
    const params = [phoneDigits, code];

    const otpRes = await query(
      `SELECT id, phone, code, used, telegram_id, expires_at
         FROM otp_codes
        WHERE ${where.join(' AND ')}
        ORDER BY id DESC
        LIMIT 1`,
      params
    );

    const otpRecord = otpRes.rows[0];
    if (!otpRecord) {
      return res.json({ ok: false, verified: false, message: 'OTP topilmadi yoki muddati tugagan' });
    }

    // Agar telegram botda /start otp_... bosilgan bo'lsa (telegram_id mavjud)
    if (otpRecord.telegram_id) {
      // 1. Kodni used deb belgilaymiz
      await query(`UPDATE otp_codes SET used = true WHERE id = $1`, [otpRecord.id]);

      // 2. Ushbu telefon yoki telegram_id bo'yicha mavjud do'konni qidiramiz
      const mRes = await query(
        `SELECT ${JOINED_MERCHANT_COLUMNS}, u.id AS owner_user_id, u.telegram_id AS current_tg_id
           FROM merchants m
           JOIN users u ON u.id = m.user_id
          WHERE regexp_replace(COALESCE(m.phone,''), '\\D', '', 'g') = $1
             OR u.telegram_id = $2
          ORDER BY m.id LIMIT 1`,
        [phoneDigits, otpRecord.telegram_id]
      );

      const merchant = mRes.rows[0];
      if (merchant) {
        // Agar users jadvalida telegram_id hali bog'lanmagan bo'lsa, sinxronlashtiramiz
        if (!merchant.current_tg_id && otpRecord.telegram_id) {
          await query(`UPDATE users SET telegram_id = $1 WHERE id = $2`, [otpRecord.telegram_id, merchant.owner_user_id]);
        }

        if (!merchant.is_active) {
          throw new HttpError(403, 'Sotuvchi hisobi bloklangan', 'MERCHANT_DISABLED');
        }

        return res.json({
          ok: true,
          verified: true,
          registered: true,
          ...sessionResponse(merchant, 'web_otp_auto'),
        });
      } else {
        // Telefon va Telegram tasdiqlangan, lekin do'kon hali ochilmagan (yangi foydalanuvchi)
        return res.json({
          ok: true,
          verified: true,
          registered: false,
          phone: otpRecord.phone,
          telegram_id: otpRecord.telegram_id,
          message: 'Telegram orqali tasdiqlandi. Do‘koningizni oching.',
        });
      }
    }

    return res.json({ ok: true, verified: false, waiting_for_telegram: true });
  })
);

// ---------------------------------------------------------------------------
// WEB: register
// ---------------------------------------------------------------------------
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const phone = v.phone(req.body.phone, 'phone', { required: true });
    const password = req.body.password ? v.str(req.body.password, 'password', { min: 6, max: 128 }) : null;
    const fullName = v.str(req.body.full_name, 'full_name', { max: 160 });
    const store = parseStore(req.body);

    const merchant = await withTransaction(async (client) => {
      const digits = phone.replace(/\D/g, '');
      const last9 = digits.slice(-9);

      // Mavjud users yozuvini oxirgi 9 raqam bo'yicha qidiramiz
      const found = await client.query(
        `SELECT id, name FROM users
          WHERE RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $1
          ORDER BY id LIMIT 1`,
        [last9]
      );
      let userId = found.rows[0]?.id;
      if (userId) {
        if (fullName) {
          await client.query(`UPDATE users SET name = $1 WHERE id = $2`, [fullName, userId]);
        }
      } else {
        const ins = await client.query('INSERT INTO users (phone, name) VALUES ($1, $2) RETURNING id', [phone, fullName || 'Sotuvchi']);
        userId = ins.rows[0].id;
      }

      // Ushbu user yoki telefon uchun mavjud merchant borligini tekshiramiz
      const existingM = await client.query(
        `SELECT id, store_name FROM merchants
          WHERE user_id = $1 OR RIGHT(regexp_replace(COALESCE(phone,''), '\\D', '', 'g'), 9) = $2
          ORDER BY id LIMIT 1`,
        [userId, last9]
      );

      if (existingM.rows[0]) {
        const mRow = existingM.rows[0];
        // Agar bu avval yaratilgan dummy do'kon ("Mening Do'konim") bo'lsa yoki nomi bo'lmasa, yangilaymiz
        if (mRow.store_name === "Mening Do'konim" || !mRow.store_name) {
          const updated = await client.query(
            `UPDATE merchants
                SET store_name = $1, business_type = $2, address = $3, phone = $4,
                    lat = $5::float8, lng = $6::float8,
                    delivery_available = $7,
                    location = CASE WHEN $5::float8 IS NULL THEN NULL ELSE point($6::float8, $5::float8) END,
                    is_active = true
              WHERE id = $8
              RETURNING ${MERCHANT_COLUMNS}`,
            [store.store_name, store.business_type, store.address || null, phone, store.lat, store.lng, store.delivery_available, mRow.id]
          );
          return updated.rows[0];
        } else {
          throw new HttpError(409, 'Bu telefon raqam bilan sotuvchi allaqachon ro‘yxatdan o‘tgan', 'PHONE_TAKEN');
        }
      }

      return insertMerchant(client, userId, phone, store, password ? hashPassword(password) : null);
    });

    // Foydalanuvchining Telegram botiga tabrik va Launch App tugmasini yuboramiz
    if (config.biznesgoBotToken) {
      query(`SELECT telegram_id FROM users WHERE id = $1`, [merchant.user_id])
        .then((tgUserRes) => {
          const userTgId = tgUserRes.rows[0]?.telegram_id;
          if (userTgId) {
            callTelegramApi(config.biznesgoBotToken, 'sendMessage', {
              chat_id: userTgId,
              text:
                `🎉 <b>Do‘koningiz muvaffaqiyatli ochildi!</b>\n\n` +
                `🏪 <b>${merchant.store_name}</b>\n` +
                `Telefon: <code>${merchant.phone}</code>\n\n` +
                `Boshqaruv paneli to‘liq tayyor. Kassa, ombor va qarz daftaridan Telegram ichida ham bevosita foydalanishingiz mumkin.\n\n` +
                `👇 <b>Ilovani ishga tushirish (Launch App):</b>`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Ilovani ochish (Launch App)',
                      web_app: { url: config.miniAppUrl },
                    },
                  ],
                ],
              },
            }).catch(() => {});

            callTelegramApi(config.biznesgoBotToken, 'setChatMenuButton', {
              chat_id: userTgId,
              menu_button: {
                type: 'web_app',
                text: '🚀 BiznesGO',
                web_app: { url: config.miniAppUrl },
              },
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

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
        needs_onboarding: true,
        user: { telegram_id: tgUser.id, first_name: tgUser.first_name, last_name: tgUser.last_name, username: tgUser.username },
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
      const digits = phone.replace(/\D/g, '');
      const existingM = await client.query(
        `SELECT ${JOINED_MERCHANT_COLUMNS}, u.id AS owner_user_id
           FROM merchants m
           JOIN users u ON u.id = m.user_id
          WHERE regexp_replace(COALESCE(m.phone,''), '\\D', '', 'g') = $1
          ORDER BY m.id LIMIT 1`,
        [digits]
      );
      if (existingM.rows[0]) {
        // CROSS-PLATFORM DATA SYNC:
        // Webda ro'yxatdan o'tgan do'konga Telegram hisobini biriktiramiz
        await client.query(`UPDATE users SET telegram_id = $1 WHERE id = $2`, [tgUser.id, existingM.rows[0].owner_user_id]);
        return existingM.rows[0];
      }

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
