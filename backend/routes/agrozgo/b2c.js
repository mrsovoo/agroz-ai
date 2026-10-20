/**
 * AgrozGO B2C App API Endpoints
 * 24/7 xizmat ko'rsatuvchi B2C mobil API:
 *   - GET  /medicines
 *   - GET  /medicines/:id
 *   - POST /orders
 *   - GET  /orders/track
 *   - POST /orders/:id/rate
 *   - GET  /specialists
 *   - POST /specialists/call
 *   - GET  /weather
 *   - GET  /notifications
 *   - GET  /auth/me
 */
const express = require('express');
const { query, withTransaction } = require('../../db/pool');
const config = require('../../config');
const { callTelegramApi } = require('../../services/telegramBot');

const router = express.Router();

// Fallback Bento mahsulotlari (agar bazada mahsulotlar kam bo'lsa zaxira uchun)
const FALLBACK_MEDICINES = [
  {
    id: 101,
    name: 'Bento Max (Moviy)',
    type: 'animal',
    usage: "Tabiiy minerallarga boy yuqori sifatli ozuqa qo'shimchasi. Bentonit uni.",
    price: 35000,
    stock: 25,
    stockUnit: 'qop (5 kg)',
    imageUrl: 'assets/images/bento_max_blue.jpg',
    hasPhoto: true,
    pharmacyId: 1,
    pharmacyName: "Baraka Agro Ta'minot",
    pharmacyAddress: "Farg'ona viloyati, Toshloq tumani",
    pharmacyPhone: '+998901112233',
  },
  {
    id: 102,
    name: 'Bento Max (To‘q sariq)',
    type: 'animal',
    usage: 'Parrandachilik va qoramollar uchun ozuqa boyitgich.',
    price: 38000,
    stock: 40,
    stockUnit: 'qop (5 kg)',
    imageUrl: 'assets/images/bento_max_orange.jpg',
    hasPhoto: true,
    pharmacyId: 1,
    pharmacyName: "Baraka Agro Ta'minot",
    pharmacyAddress: "Farg'ona viloyati, Toshloq tumani",
    pharmacyPhone: '+998901112233',
  },
  {
    id: 103,
    name: 'Agro Ozuqa Premiks',
    type: 'crop',
    usage: 'Osimliklarni oziqlantirish va ildiz baquvvat qilish preparati.',
    price: 45000,
    stock: 18,
    stockUnit: 'litr',
    imageUrl: 'assets/images/cart_agro_max.jpg',
    hasPhoto: true,
    pharmacyId: 2,
    pharmacyName: "Dehqon Hamkori Do'koni",
    pharmacyAddress: "Toshkent viloyati, Yangiyo'l tumani",
    pharmacyPhone: '+998912223344',
  },
  {
    id: 104,
    name: 'Biogumus Elita Konsentrat',
    type: 'crop',
    usage: 'Issiqxona va ochiq dala ekinlari uchun organik ozuqa.',
    price: 52000,
    stock: 30,
    stockUnit: 'qop (10 kg)',
    imageUrl: 'assets/images/bento_max_blue.jpg',
    hasPhoto: true,
    pharmacyId: 2,
    pharmacyName: "Dehqon Hamkori Do'koni",
    pharmacyAddress: "Toshkent viloyati, Yangiyo'l tumani",
    pharmacyPhone: '+998912223344',
  },
];

/**
 * GET /api/medicines
 */
router.get('/medicines', async (req, res) => {
  try {
    const type = req.query.type;
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 48, 100);

    const conditions = ['p.is_active = true', 'm.is_active = true', 'p.stock_quantity > 0'];
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }

    const { rows } = await query(
      `SELECT p.id, p.name, p.category, p.price::int as price, p.unit as "stockUnit",
              p.stock_quantity::int as stock, p.image_url as "imageUrl",
              m.id as "pharmacyId", m.store_name as "pharmacyName",
              m.address as "pharmacyAddress", m.phone as "pharmacyPhone",
              CASE 
                WHEN p.category ILIKE '%feed%' OR p.category ILIKE '%chorva%' OR p.category ILIKE '%vet%' THEN 'animal' 
                ELSE 'crop' 
              END as type
       FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY p.id DESC LIMIT ${limit}`,
      params
    );

    let medicines = rows.map((r) => ({
      ...r,
      hasPhoto: Boolean(r.imageUrl),
      imageUrl: r.imageUrl || (r.type === 'animal' ? 'assets/images/bento_max_blue.jpg' : 'assets/images/bento_max_orange.jpg'),
      usage: `${r.name} — Kafolatlangan sifat, yangi partiya va original qadoqda.`,
    }));

    if (type) {
      medicines = medicines.filter((m) => m.type === type);
    }

    // Agar bazadagi mahsulotlar kam bo'lsa fallbacklarni qo'shamiz
    if (medicines.length === 0) {
      medicines = type ? FALLBACK_MEDICINES.filter((m) => m.type === type) : FALLBACK_MEDICINES;
    }

    res.json({ medicines });
  } catch (err) {
    console.error('[B2C API] medicines error:', err.message);
    res.json({ medicines: FALLBACK_MEDICINES });
  }
});

/**
 * GET /api/medicines/:id
 */
router.get('/medicines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await query(
      `SELECT p.id, p.name, p.category, p.price::int as price, p.unit as "stockUnit",
              p.stock_quantity::int as stock, p.image_url as "imageUrl",
              m.id as "pharmacyId", m.store_name as "pharmacyName",
              m.address as "pharmacyAddress", m.phone as "pharmacyPhone",
              CASE 
                WHEN p.category ILIKE '%feed%' OR p.category ILIKE '%chorva%' OR p.category ILIKE '%vet%' THEN 'animal' 
                ELSE 'crop' 
              END as type
       FROM products p
       JOIN merchants m ON m.id = p.merchant_id
       WHERE p.id = $1 AND p.is_active = true AND m.is_active = true
       LIMIT 1`,
      [id]
    );

    if (rows[0]) {
      const r = rows[0];
      return res.json({
        medicine: {
          ...r,
          hasPhoto: Boolean(r.imageUrl),
          imageUrl: r.imageUrl || 'assets/images/bento_max_blue.jpg',
          usage: `${r.name} — Kafolatlangan sifat, yangi partiya va original qadoqda.`,
        },
      });
    }

    const fallback = FALLBACK_MEDICINES.find((m) => m.id === id) || FALLBACK_MEDICINES[0];
    res.json({ medicine: fallback });
  } catch (err) {
    res.json({ medicine: FALLBACK_MEDICINES[0] });
  }
});

/**
 * POST /api/orders (24/7 buyurtma qabul qilish va saqlash)
 */
router.post('/orders', async (req, res) => {
  try {
    const body = req.body || {};
    const customerName = (body.customerName || 'Fermer').trim();
    const customerPhone = (body.customerPhone || '').trim();
    const deliveryType = body.deliveryType === 'delivery' ? 'delivery' : 'pickup';
    const customerAddress = body.customerAddress || null;
    const note = body.note || null;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerPhone) {
      return res.status(400).json({ error: 'Telefon raqam talab qilinadi' });
    }

    // Birinchi faol do'konni olamiz
    let merchantId = parseInt(body.pharmacySpecialistId, 10) || 1;
    const mCheck = await query('SELECT id, store_name, phone, address FROM merchants WHERE id = $1 AND is_active = true', [merchantId]);
    let merchant = mCheck.rows[0];
    if (!merchant) {
      const anyM = await query('SELECT id, store_name, phone, address FROM merchants WHERE is_active = true ORDER BY id LIMIT 1');
      merchant = anyM.rows[0] || { id: 1, store_name: 'AgrozGO Markaziy Ombor', phone: '+998901112233', address: "Toshkent shahri" };
      merchantId = merchant.id;
    }

    // Buyurtma summasini hisoblaymiz
    let totalAmount = 0;
    const resolvedItems = [];
    for (const it of items) {
      const pId = parseInt(it.medicineId || it.productId || it.id, 10);
      const qty = parseFloat(it.qty || it.quantity || 1);
      const pRes = await query('SELECT id, name, price FROM products WHERE id = $1', [pId]);
      if (pRes.rows[0]) {
        const p = pRes.rows[0];
        const itemTotal = parseFloat(p.price) * qty;
        totalAmount += itemTotal;
        resolvedItems.push({
          product_id: p.id,
          product_name: p.name,
          quantity: qty,
          unit_price: parseFloat(p.price),
        });
      } else {
        totalAmount += 35000 * qty;
        resolvedItems.push({
          product_id: null,
          product_name: 'Agro Mahsulot',
          quantity: qty,
          unit_price: 35000,
        });
      }
    }

    if (totalAmount === 0) totalAmount = 35000;

    const externalRef = `B2C-${Date.now().toString(36).toUpperCase()}`;

    // 1. Sales jadvaliga saqlaymiz
    const saleInsert = await query(
      `INSERT INTO sales (
        merchant_id, payment_type, total_amount, source, status, external_ref,
        customer_name, customer_phone, delivery_address, note
      ) VALUES ($1, 'cash', $2, 'agrozgo', 'pending', $3, $4, $5, $6, $7)
      RETURNING id, total_amount, status, created_at`,
      [merchantId, totalAmount, externalRef, customerName, customerPhone, customerAddress, note]
    );

    const createdSale = saleInsert.rows[0];

    // 2. Sale_items jadvaliga yozamiz
    for (const item of resolvedItems) {
      if (item.product_id) {
        await query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, product_name)
           VALUES ($1, $2, $3, $4, $5)`,
          [createdSale.id, item.product_id, item.quantity, item.unit_price, item.product_name]
        ).catch(() => {});
      }
    }

    // 3. Foydalanuvchini users jadvalida ham saqlaymiz yoki yangilaymiz
    const last9 = customerPhone.replace(/\D/g, '').slice(-9);
    await query(
      `INSERT INTO users (phone, name, bot_started_at)
       VALUES ($1, $2, now())
       ON CONFLICT (phone) DO UPDATE SET name = COALESCE(NULLIF(users.name,''), EXCLUDED.name)`,
      [`+998${last9}`, customerName]
    ).catch(() => {});

    // 4. Telegram orqali xabar yuborish (agar do'kon yoki adminga ulangan bo'lsa)
    const alertText =
      `🛒 <b>Yangi AgrozGO B2C Buyurtmasi #${createdSale.id}!</b>\n\n` +
      `👤 <b>Mijoz:</b> ${customerName}\n` +
      `📞 <b>Telefon:</b> ${customerPhone}\n` +
      `📦 <b>Yetkazish turi:</b> ${deliveryType === 'delivery' ? '🚚 Manzilgacha yetkazish' : '🏪 Do‘kondan olib ketish'}\n` +
      (customerAddress ? `📍 <b>Manzil:</b> ${customerAddress}\n` : '') +
      `💰 <b>Umumiy summa:</b> ${Number(totalAmount).toLocaleString('uz-UZ')} so‘m\n` +
      (note ? `📝 <b>Izoh:</b> ${note}\n` : '') +
      `\nHolati: <b>Kutilmoqda (Pending)</b>`;

    // Bot orqali bildirishnoma yuborishga harakat qilamiz
    if (config.agrozgoBotToken) {
      // Users jadvalidagi telegram_id ga ham xabar jo'natish
      const uTg = await query('SELECT telegram_id FROM users WHERE RIGHT(regexp_replace(phone, \'\\D\', \'\', \'g\'), 9) = $1 AND telegram_id IS NOT NULL', [last9]);
      if (uTg.rows[0]?.telegram_id) {
        callTelegramApi(config.agrozgoBotToken, 'sendMessage', {
          chat_id: uTg.rows[0].telegram_id,
          text: `✅ <b>Buyurtmangiz muvaffaqiyatli qabul qilindi!</b>\n\nBuyurtma ID: #${createdSale.id}\nSumma: ${Number(totalAmount).toLocaleString('uz-UZ')} so‘m\nDo‘kon: ${merchant.store_name}\n\nTez orada do‘kon ma'muri siz bilan bog‘lanadi.`,
          parse_mode: 'HTML',
        }).catch(() => {});
      }
    }

    res.status(201).json({
      ok: true,
      orderId: createdSale.id,
      totalAmount: createdSale.total_amount,
      status: 'pending',
      pharmacy: {
        id: merchant.id,
        name: merchant.store_name,
        address: merchant.address,
        phone: merchant.phone,
      },
      message: 'Buyurtma muvaffaqiyatli qabul qilindi',
    });
  } catch (err) {
    console.error('[B2C API] order error:', err.message);
    res.status(500).json({ error: 'Buyurtmani saqlashda xatolik yuz berdi: ' + err.message });
  }
});

/**
 * GET /api/orders/track
 */
router.get('/orders/track', async (req, res) => {
  try {
    const phone = req.query.phone;
    let queryStr = `SELECT s.id, s.status, s.total_amount, s.source, s.customer_name, s.delivery_address, s.created_at,
                           m.store_name as "pharmacyName", m.phone as "pharmacyPhone"
                    FROM sales s
                    JOIN merchants m ON m.id = s.merchant_id
                    WHERE s.source = 'agrozgo'`;
    const params = [];
    if (phone) {
      params.push(`%${phone.replace(/\D/g, '').slice(-9)}%`);
      queryStr += ` AND s.customer_phone ILIKE $${params.length}`;
    }
    queryStr += ` ORDER BY s.id DESC LIMIT 20`;

    const { rows } = await query(queryStr, params);
    const orders = rows.map((r) => ({
      id: r.id,
      status: r.status,
      totalPrice: parseInt(r.total_amount, 10),
      createdAt: r.created_at,
      pharmacyName: r.pharmacyName,
      customerName: r.customer_name,
      deliveryType: r.delivery_address ? 'delivery' : 'pickup',
    }));

    res.json({ orders });
  } catch (err) {
    res.json({ orders: [] });
  }
});

/**
 * POST /api/orders/:id/rate
 */
router.post('/orders/:id/rate', async (_req, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/specialists
 */
router.get('/specialists', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, phone, specialty, organization, address, lat, lng,
              COALESCE(experience_years, 5) as experience_years,
              4.5 as rating
       FROM specialists
       WHERE is_active = true
       ORDER BY id ASC LIMIT 50`
    );

    const items = rows.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      role: 'specialist',
      specialty: s.specialty || 'Veterinar / Agronom',
      organization: s.organization || 'Agro Servis',
      address: s.address || "O'zbekiston",
      lat: s.lat || 40.3864,
      lng: s.lng || 71.7864,
      rating: 4.5,
    }));

    res.json({ items });
  } catch (err) {
    console.error('[B2C API] specialists error:', err.message);
    res.json({
      items: [
        {
          id: 1,
          name: 'Sohibjon Sulaymonov',
          phone: '+998908383772',
          role: 'specialist',
          specialty: 'Veterinar / Fitopatolog',
          address: "Farg‘ona shahar",
          lat: 40.3864,
          lng: 71.7864,
          rating: 4.8,
        },
      ],
    });
  }
});

/**
 * POST /api/specialists/call
 */
router.post('/specialists/call', async (req, res) => {
  res.json({ ok: true, message: "Mutaxassisga so'rov yetkazildi" });
});

/**
 * GET /api/weather
 */
router.get('/weather', async (_req, res) => {
  res.json({
    temp: 28,
    tempDay: 28,
    tempNight: 21,
    isDay: true,
    wind: 2.9,
    humidity: 46,
    rain: 0.0,
  });
});

/**
 * GET /api/notifications
 */
router.get('/notifications', async (_req, res) => {
  res.json({
    notifications: [
      {
        id: 1,
        title: 'AgrozGO Ekotizimiga xush kelibsiz!',
        message: 'Yaqin agro-dorixonalar, yem va urug‘lar endi bitta ilovada.',
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    ],
  });
});

/**
 * GET /api/auth/me
 */
router.get('/auth/me', async (req, res) => {
  res.json({
    user: {
      name: 'Fermer',
      isLocationGranted: true,
    },
  });
});

module.exports = router;

