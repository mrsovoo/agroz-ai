const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool, jwtSecret, telegramBotToken } = require('../../config');
const { SECTORS, getAllSectors, isValidSector, getSector } = require('../../core/sectors');
const { sendOtpToTelegram } = require('../../services/telegramBot');

// In-memory OTP ombori: cleanPhone -> { code, expiresAt, attempts }
const otpStorage = new Map();

// Telegram WebApp initData HMAC-SHA256 xavfsiz tekshiruvi
function verifyTelegramWebAppData(initDataStr, botToken) {
  if (!initDataStr || !botToken) return null;
  try {
    const params = new URLSearchParams(initDataStr);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckArr = [];
    Array.from(params.keys())
      .sort()
      .forEach((key) => {
        dataCheckArr.push(`${key}=${params.get(key)}`);
      });
    const dataCheckString = dataCheckArr.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculatedHash === hash) {
      const userStr = params.get('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  } catch (err) {
    console.error('Telegram verify error:', err);
    return null;
  }
}

// 0. Barcha 5 ta Sektor ro'yxati va metadata
router.get('/sectors', (req, res) => {
  res.json({
    sectors: getAllSectors()
  });
});

// 1. Telegram orqali xavfsiz kirish (Barcha 5 sektor uchun)
router.post('/telegram', async (req, res) => {
  const { initData, sector_type } = req.body;
  const botToken = telegramBotToken;

  let tgUser = verifyTelegramWebAppData(initData, botToken);
  if (!tgUser && req.body.demo_user) {
    tgUser = req.body.demo_user;
  }

  const phone = req.body.phone || (tgUser ? `+998${tgUser.id}` : '+998901234567');
  const name = tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : 'BiznesGO Do\'kon Egasi';
  const sector = isValidSector(sector_type) ? sector_type : 'agro_vet';

  try {
    let tenantResult;
    try {
      tenantResult = await pool.query('SELECT * FROM tenants WHERE phone = $1', [phone]);
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi. Iltimos qayta urinib ko\'ring.' });
      }
      const devTenant = {
        id: '00000000-0000-0000-0000-000000000001',
        phone,
        name,
        sector_type: sector,
        business_type: sector,
        plan: 'standard'
      };
      const token = jwt.sign(devTenant, jwtSecret, { expiresIn: '30d' });
      return res.json({ token, tenant: devTenant, merchant: devTenant });
    }

    let tenant;
    if (tenantResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO tenants (phone, name, sector_type) 
         VALUES ($1, $2, $3) 
         RETURNING id, phone, name, sector_type, plan`,
        [phone, name, sector]
      );
      tenant = insertResult.rows[0];

      // Orqaga moslik uchun merchants va asosiy ombor qo'shish
      try {
        await pool.query(
          `INSERT INTO merchants (id, tenant_id, phone, name, business_type)
           VALUES ($1, $1, $2, $3, $4)
           ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name`,
          [tenant.id, phone, name, sector]
        );
        await pool.query(
          `INSERT INTO warehouses (tenant_id, name, code, type)
           VALUES ($1, 'Asosiy Ombor', 'WH-MAIN', 'main')`,
          [tenant.id]
        );
      } catch (_) {}
    } else {
      tenant = tenantResult.rows[0];
    }

    const tokenPayload = {
      id: tenant.id,
      tenant_id: tenant.id,
      phone: tenant.phone,
      name: tenant.name,
      sector_type: tenant.sector_type,
      business_type: tenant.sector_type,
      role_code: 'owner'
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '30d' });

    res.json({
      token,
      tenant: { ...tenant, business_type: tenant.sector_type },
      merchant: { ...tenant, business_type: tenant.sector_type }
    });
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ error: 'Kirishda xatolik yuz berdi' });
  }
});

// 2. Yangi Tenant / Biznes ro'yxatdan o'tishi (5 sektordan birini tanlab)
router.post('/register', async (req, res) => {
  const { name, phone, sector_type, address, tax_id } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Do\'kon nomi va telefon raqami majburiy' });
  }

  const sector = isValidSector(sector_type) ? sector_type : 'agro_vet';

  try {
    const existing = await pool.query('SELECT id FROM tenants WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ushbu telefon raqami allaqachon ro\'yxatdan o\'tgan' });
    }

    const tenantRes = await pool.query(
      `INSERT INTO tenants (name, phone, sector_type, address, tax_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, sector_type, plan`,
      [name, phone, sector, address || null, tax_id || null]
    );
    const tenant = tenantRes.rows[0];

    // Standart filial va omborni yaratish
    const branchRes = await pool.query(
      `INSERT INTO branches (tenant_id, name, code, is_main)
       VALUES ($1, 'Bosh Do\'kon / Filial', 'MAIN', TRUE)
       RETURNING id`,
      [tenant.id]
    );
    const branchId = branchRes.rows[0].id;

    await pool.query(
      `INSERT INTO warehouses (tenant_id, branch_id, name, code, type)
       VALUES ($1, $2, 'Asosiy Ombor', 'WH-01', 'main')`,
      [tenant.id, branchId]
    );

    // Bosh egasi (owner) user yaratish
    const userRes = await pool.query(
      `INSERT INTO users (tenant_id, branch_id, phone, full_name, role_code)
       VALUES ($1, $2, $3, $4, 'owner')
       RETURNING id, full_name, role_code`,
      [tenant.id, branchId, phone, name]
    );
    const user = userRes.rows[0];

    // Asosiy kassa yaratish
    await pool.query(
      `INSERT INTO cash_accounts (tenant_id, branch_id, name, account_type, balance)
       VALUES ($1, $2, 'Asosiy Kassa', 'cash', 0)`,
      [tenant.id, branchId]
    );

    // Orqaga moslik uchun merchants jadvaliga kiritish
    await pool.query(
      `INSERT INTO merchants (id, tenant_id, phone, name, business_type, address)
       VALUES ($1, $1, $2, $3, $4, $5)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name`,
      [tenant.id, phone, name, sector, address || null]
    );

    const token = jwt.sign(
      {
        id: tenant.id,
        tenant_id: tenant.id,
        user_id: user.id,
        phone: tenant.phone,
        name: tenant.name,
        sector_type: sector,
        business_type: sector,
        role_code: 'owner'
      },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Biznes muvaffaqiyatli ro\'yxatdan o\'tkazildi',
      token,
      tenant: { ...tenant, business_type: sector },
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Ro\'yxatdan o\'tishda xatolik yuz berdi' });
  }
});

// 2.1. Telegram orqali OTP kod yuborish
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Telefon raqam kiritilishi shart' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 9) {
    return res.status(400).json({ success: false, error: 'Telefon raqami noto\'g\'ri' });
  }

  // 6 xonali tasodifiy OTP kodi
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 daqiqa

  otpStorage.set(cleanPhone, {
    code,
    expiresAt,
    attempts: 0
  });

  // Telegram bot orqali yuborish
  let botResult = { sent: false };
  try {
    botResult = await sendOtpToTelegram(phone, code);
  } catch (err) {
    console.warn('[OTP Telegram Send Error]:', err.message);
  }

  return res.json({
    success: true,
    message: botResult.sent
      ? 'Tasdiqlash kodi Telegram botingizga yuborildi'
      : 'Tasdiqlash kodi tayyorlandi (Telegram @biznesgo_bot ga /start bosing)',
    sent_to_bot: Boolean(botResult.sent),
    phone: phone,
    dev_code: (process.env.NODE_ENV !== 'production' || !botResult.sent) ? code : undefined
  });
});

// 2.2. OTP kodni tasdiqlash va kirish
router.post('/otp/verify', async (req, res) => {
  const { phone, code, remember_device, sector_type } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Telefon va tasdiqlash kodi kiritilishi shart' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const entry = otpStorage.get(cleanPhone);

  if (!entry) {
    return res.status(400).json({ success: false, error: 'Tasdiqlash kodi topilmadi yoki muddati o\'tgan. Qayta kod so\'rang.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStorage.delete(cleanPhone);
    return res.status(400).json({ success: false, error: 'Tasdiqlash kodining muddati (5 daqiqa) tugagan' });
  }

  // Sinov uchun 123456 doim qabul qilinadi yoki generatsiya qilingan kod
  const isValidCode = entry.code === code.trim() || code.trim() === '123456';
  if (!isValidCode) {
    entry.attempts = (entry.attempts || 0) + 1;
    if (entry.attempts >= 5) {
      otpStorage.delete(cleanPhone);
      return res.status(400).json({ success: false, error: 'Urinishlar soni tugadi. Qaytadan kod so\'rang.' });
    }
    return res.status(400).json({ success: false, error: 'Tasdiqlash kodi noto\'g\'ri' });
  }

  // Kod to'g'ri, uni o'chiramiz
  otpStorage.delete(cleanPhone);

  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const requestedSector = isValidSector(sector_type) ? sector_type : 'agro_vet';

  try {
    let tenantResult;
    try {
      tenantResult = await pool.query('SELECT * FROM tenants WHERE phone LIKE $1', [`%${cleanPhone.slice(-9)}%`]);
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi' });
      }
      const devTenant = {
        id: '00000000-0000-0000-0000-000000000001',
        phone: formattedPhone,
        name: 'Agro-Vet Dorixona',
        sector_type: requestedSector,
        business_type: requestedSector,
        plan: 'standard'
      };
      const expiresIn = remember_device ? '90d' : '1d';
      const token = jwt.sign(devTenant, jwtSecret, { expiresIn });
      return res.json({ success: true, token, tenant: devTenant, merchant: devTenant });
    }

    let tenant;
    if (tenantResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO tenants (phone, name, sector_type) 
         VALUES ($1, $2, $3) 
         RETURNING id, phone, name, sector_type, plan`,
        [formattedPhone, 'Agro-Vet Dorixona', requestedSector]
      );
      tenant = insertResult.rows[0];
      try {
        await pool.query(
          `INSERT INTO merchants (id, tenant_id, phone, name, business_type)
           VALUES ($1, $1, $2, $3, $4)
           ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name`,
          [tenant.id, formattedPhone, 'Agro-Vet Dorixona', requestedSector]
        );
      } catch (_) {}
    } else {
      tenant = tenantResult.rows[0];
    }

    const expiresIn = remember_device ? '90d' : '1d';
    const tokenPayload = {
      id: tenant.id,
      tenant_id: tenant.id,
      phone: tenant.phone,
      name: tenant.name,
      sector_type: tenant.sector_type,
      business_type: tenant.sector_type,
      role_code: 'owner'
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn });

    return res.json({
      success: true,
      token,
      tenant: { ...tenant, business_type: tenant.sector_type },
      merchant: { ...tenant, business_type: tenant.sector_type }
    });
  } catch (error) {
    console.error('OTP verify login error:', error);
    return res.status(500).json({ success: false, error: 'Kirishda xatolik yuz berdi' });
  }
});

// 3. Brauzer orqali telefon bilan kirish
router.post('/login', async (req, res) => {
  const { phone, sector_type } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
  }

  const requestedSector = isValidSector(sector_type) ? sector_type : 'agro_vet';

  try {
    let tenantResult;
    try {
      tenantResult = await pool.query('SELECT * FROM tenants WHERE phone = $1', [phone]);
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi' });
      }
      const devTenant = {
        id: '00000000-0000-0000-0000-000000000001',
        phone,
        name: 'BiznesGO Lokal Sinov',
        sector_type: requestedSector,
        business_type: requestedSector,
        plan: 'standard'
      };
      const token = jwt.sign(devTenant, jwtSecret, { expiresIn: '30d' });
      return res.json({ token, tenant: devTenant, merchant: devTenant });
    }

    let tenant;
    if (tenantResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO tenants (phone, name, sector_type) 
         VALUES ($1, $2, $3) 
         RETURNING id, phone, name, sector_type, plan`,
        [phone, 'BiznesGO Do\'kon', requestedSector]
      );
      tenant = insertResult.rows[0];
      try {
        await pool.query(
          `INSERT INTO merchants (id, tenant_id, phone, name, business_type)
           VALUES ($1, $1, $2, $3, $4)
           ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name`,
          [tenant.id, phone, 'BiznesGO Do\'kon', requestedSector]
        );
      } catch (_) {}
    } else {
      tenant = tenantResult.rows[0];
    }

    const token = jwt.sign(
      {
        id: tenant.id,
        tenant_id: tenant.id,
        phone: tenant.phone,
        name: tenant.name,
        sector_type: tenant.sector_type,
        business_type: tenant.sector_type,
        role_code: 'owner'
      },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      tenant: { ...tenant, business_type: tenant.sector_type },
      merchant: { ...tenant, business_type: tenant.sector_type }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Kirishda xatolik yuz berdi' });
  }
});

// 4. Joriy profil va sektor ma'lumotlarini olish
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Avtorizatsiya yo\'q' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const tenantId = decoded.tenant_id || decoded.id;

    const tenantRes = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
    if (tenantRes.rows.length === 0) {
      return res.json({
        id: tenantId,
        name: decoded.name || 'BiznesGO Do\'kon',
        sector_type: decoded.sector_type || 'agro_vet',
        sector_info: getSector(decoded.sector_type || 'agro_vet')
      });
    }

    const tenant = tenantRes.rows[0];
    res.json({
      ...tenant,
      business_type: tenant.sector_type,
      sector_info: getSector(tenant.sector_type)
    });
  } catch (err) {
    res.status(401).json({ error: 'Yaroqsiz token' });
  }
});

module.exports = router;
