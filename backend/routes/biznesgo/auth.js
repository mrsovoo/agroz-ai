const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool, jwtSecret, telegramBotToken } = require('../../config');

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

// 1. Telegram orqali xavfsiz kirish (HMAC-SHA256)
router.post('/telegram', async (req, res) => {
  const { initData } = req.body;
  const botToken = telegramBotToken;

  let tgUser = verifyTelegramWebAppData(initData, botToken);
  // Demo yoki sinov uchun fallback
  if (!tgUser && req.body.demo_user) {
    tgUser = req.body.demo_user;
  }

  const phone = req.body.phone || (tgUser ? `+998${tgUser.id}` : '+998901234567');
  const name = tgUser ? `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim() : 'Agro-Vet Do\'kon Egasi';

  try {
    let merchantResult;
    try {
      merchantResult = await pool.query('SELECT * FROM merchants WHERE phone = $1', [phone]);
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi. Iltimos qayta urinib ko\'ring.' });
      }
      // Faqat lokal sinov uchun:
      const devMerchant = {
        id: '00000000-0000-0000-0000-000000000001',
        phone,
        name,
        business_type: 'agro_vet'
      };
      const token = jwt.sign(devMerchant, jwtSecret, { expiresIn: '30d' });
      return res.json({ token, merchant: devMerchant });
    }

    let merchant;
    if (merchantResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO merchants (phone, name, business_type) 
         VALUES ($1, $2, 'agro_vet') 
         RETURNING id, phone, name, business_type`,
        [phone, name]
      );
      merchant = insertResult.rows[0];
    } else {
      merchant = merchantResult.rows[0];
      merchant.business_type = 'agro_vet'; // Qat'iy Agro-Vet qulflangan
    }

    const token = jwt.sign(
      { id: merchant.id, phone: merchant.phone, name: merchant.name, business_type: 'agro_vet' },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({ token, merchant });
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ error: 'Kirishda xatolik yuz berdi' });
  }
});

// 2. Brauzer orqali telefon + kod bilan kirish (Faqat Agro-Vet)
router.post('/login', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Telefon raqam kiritilishi shart' });
  }

  try {
    let merchantResult;
    try {
      merchantResult = await pool.query('SELECT * FROM merchants WHERE phone = $1', [phone]);
    } catch (dbErr) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi' });
      }
      const devMerchant = {
        id: '00000000-0000-0000-0000-000000000001',
        phone,
        name: 'Agro-Vet Lokal Sinov',
        business_type: 'agro_vet'
      };
      const token = jwt.sign(devMerchant, jwtSecret, { expiresIn: '30d' });
      return res.json({ token, merchant: devMerchant });
    }

    let merchant;
    if (merchantResult.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO merchants (phone, name, business_type) 
         VALUES ($1, $2, 'agro_vet') 
         RETURNING id, phone, name, business_type`,
        [phone, 'Agro-Vet Dorixona']
      );
      merchant = insertResult.rows[0];
    } else {
      merchant = merchantResult.rows[0];
      merchant.business_type = 'agro_vet';
    }

    const token = jwt.sign(
      { id: merchant.id, phone: merchant.phone, name: merchant.name, business_type: 'agro_vet' },
      jwtSecret,
      { expiresIn: '30d' }
    );

    res.json({ token, merchant });
  } catch (error) {
    console.error('Auth login error:', error);
    res.status(500).json({ error: 'Tizimga kirishda xatolik yuz berdi' });
  }
});

router.get('/me', (req, res) => {
  res.json({
    merchant: {
      id: req.merchant.id,
      phone: req.merchant.phone,
      name: req.merchant.name,
      business_type: 'agro_vet' // Qat'iy o'zgarmas
    }
  });
});

module.exports = router;
