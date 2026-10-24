const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool, jwtSecret, telegramBotToken } = require('../../config');
const { SECTORS, getAllSectors, isValidSector, getSector } = require('../../core/sectors');

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
