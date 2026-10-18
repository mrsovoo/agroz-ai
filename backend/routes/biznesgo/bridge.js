/**
 * AGROZGO → BIZNESGO (server-to-server). Sarlavha: X-Bridge-Key: <BIZNESGO_BRIDGE_KEY>
 *   GET  /bridge/merchants/nearby?lat=&lng=&radius_km=10&business_type=&delivery=1&q=
 *        — AgrozGO geo-search: yaqin atrofdagi faol do'konlar (masofa bo'yicha)
 *   GET  /bridge/merchants/:id/products?q=&category=
 *        — do'konning sotuvdagi (qoldig'i bor) mahsulotlari
 *   POST /bridge/orders
 *        — AgrozGO B2C buyurtmasini qabul qilish (status='pending', qoldiq zaxiraga olinadi).
 *          external_ref bo'yicha idempotent.
 */
const crypto = require('crypto');
const express = require('express');
const config = require('../../config');
const { query, withTransaction } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { BUSINESS_TYPE_KEYS } = require('../../lib/businessTypes');
const { createSale } = require('../../services/sales');

const router = express.Router();

function requireBridgeKey(req, _res, next) {
  if (!config.bridgeKey) return next(new HttpError(503, "AgrozGO bridge sozlanmagan", 'BRIDGE_DISABLED'));
  const given = Buffer.from(req.get('x-bridge-key') || '');
  const expected = Buffer.from(config.bridgeKey);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return next(new HttpError(401, "Bridge kaliti noto'g'ri", 'BAD_BRIDGE_KEY'));
  }
  next();
}
router.use(requireBridgeKey);

router.get(
  '/merchants/nearby',
  asyncHandler(async (req, res) => {
    const lat = v.num(req.query.lat, 'lat', { required: true, min: -90, max: 90 });
    const lng = v.num(req.query.lng, 'lng', { required: true, min: -180, max: 180 });
    const radius = v.num(req.query.radius_km, 'radius_km', { min: 0.1, max: 500 }) ?? 10;
    const bt = v.oneOf(req.query.business_type, 'business_type', BUSINESS_TYPE_KEYS);
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const params = [lat, lng, radius];
    const filters = [];
    if (bt) {
      params.push(bt);
      filters.push(`AND business_type = $${params.length}`);
    }
    if (req.query.delivery === '1') filters.push('AND delivery_available');
    const q = v.str(req.query.q, 'q', { max: 100 });
    if (q) {
      params.push(`%${q}%`);
      filters.push(`AND EXISTS (SELECT 1 FROM products p WHERE p.merchant_id = m.id AND p.is_active
                     AND p.stock_quantity > 0 AND p.name ILIKE $${params.length})`);
    }

    // Haversine (km). Bounding-box avval indeks bo'yicha filtrlaydi.
    const { rows } = await query(
      `SELECT * FROM (
         SELECT m.id, m.store_name, m.phone, m.business_type, m.address, m.lat, m.lng, m.delivery_available,
                6371 * 2 * ASIN(SQRT(
                  POWER(SIN(RADIANS(m.lat - $1) / 2), 2) +
                  COS(RADIANS($1)) * COS(RADIANS(m.lat)) * POWER(SIN(RADIANS(m.lng - $2) / 2), 2)
                )) AS distance_km
           FROM merchants m
          WHERE m.is_active AND m.lat IS NOT NULL
            AND m.lat BETWEEN $1 - ($3 / 111.0) AND $1 + ($3 / 111.0)
            AND m.lng BETWEEN $2 - ($3 / (111.0 * GREATEST(COS(RADIANS($1)), 0.01)))
                          AND $2 + ($3 / (111.0 * GREATEST(COS(RADIANS($1)), 0.01)))
            ${filters.join(' ')}
       ) x WHERE distance_km <= $3
       ORDER BY distance_km LIMIT ${limit}`,
      params
    );
    res.json({ merchants: rows.map((r) => ({ ...r, distance_km: Math.round(r.distance_km * 100) / 100 })) });
  })
);

router.get(
  '/merchants/:id/products',
  asyncHandler(async (req, res) => {
    const id = v.idParam(req.params.id);
    const m = await query('SELECT id, store_name, business_type FROM merchants WHERE id = $1 AND is_active', [id]);
    if (!m.rows[0]) throw new HttpError(404, 'Do\'kon topilmadi');
    const params = [id];
    let filter = '';
    const q = v.str(req.query.q, 'q', { max: 100 });
    if (q) {
      params.push(`%${q}%`);
      filter += ` AND name ILIKE $${params.length}`;
    }
    const cat = v.str(req.query.category, 'category', { max: 100 });
    if (cat) {
      params.push(cat);
      filter += ` AND category = $${params.length}`;
    }
    const { rows } = await query(
      `SELECT id, name, category, price, unit, stock_quantity, image_url, expiry_date
         FROM products
        WHERE merchant_id = $1 AND is_active AND stock_quantity > 0
          AND (expiry_date IS NULL OR expiry_date >= (now() AT TIME ZONE 'Asia/Tashkent')::date) ${filter}
        ORDER BY name LIMIT 500`,
      params
    );
    res.json({ merchant: m.rows[0], products: rows });
  })
);

router.post(
  '/orders',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const merchantId = v.idParam(b.merchant_id, 'merchant_id');
    const externalRef = v.str(b.external_ref, 'external_ref', { required: true, max: 64 });
    const input = {
      items: b.items,
      payment_type: v.oneOf(b.payment_type, 'payment_type', ['cash', 'card']) || 'cash',
      discount_amount: 0,
      source: 'agrozgo',
      status: 'pending',
      external_ref: externalRef,
      customer_name: v.str(b.customer_name, 'customer_name', { required: true, max: 160 }),
      customer_phone: v.phone(b.customer_phone, 'customer_phone', { required: true }),
      delivery_address: v.str(b.delivery_address, 'delivery_address', { max: 500 }),
      note: v.str(b.note, 'note', { max: 1000 }),
    };
    // AgrozGO narxni belgilay olmaydi — narx har doim BiznesGO katalogidan olinadi.
    if (Array.isArray(input.items)) input.items = input.items.map((it) => ({ product_id: it.product_id, quantity: it.quantity }));

    const result = await withTransaction(async (client) => {
      const m = await client.query('SELECT id FROM merchants WHERE id = $1 AND is_active FOR SHARE', [merchantId]);
      if (!m.rows[0]) throw new HttpError(404, "Do'kon topilmadi yoki faol emas");
      const dup = await client.query(
        'SELECT id, status, total_amount FROM sales WHERE merchant_id = $1 AND external_ref = $2',
        [merchantId, externalRef]
      );
      if (dup.rows[0]) return { duplicate: true, order: dup.rows[0] };
      const sale = await createSale(client, merchantId, input);
      return { duplicate: false, order: sale };
    });

    res.status(result.duplicate ? 200 : 201).json(result);
  })
);

module.exports = router;

