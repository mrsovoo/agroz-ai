/**
 * MERCHANT PROFILE & META
 *   GET /meta       — biznes turlari, birliklar, kategoriyalar (public)
 *   GET /merchant   — joriy do'kon profili
 *   PUT /merchant   — profilni yangilash
 */
const express = require('express');
const { query, NOW } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { BUSINESS_TYPES, BUSINESS_TYPE_KEYS, ALL_UNITS } = require('../../lib/businessTypes');
const { authenticate, requireMerchant } = require('../../middleware/auth');

const router = express.Router();

router.get('/meta', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ business_types: BUSINESS_TYPES, units: ALL_UNITS, payment_types: ['cash', 'card', 'debt'] });
});

router.get('/merchant', authenticate, requireMerchant, (req, res) => {
  res.json({ merchant: req.merchant });
});

router.put(
  '/merchant',
  authenticate,
  requireMerchant,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const sets = [];
    const params = [];
    const add = (col, val) => {
      params.push(val);
      sets.push(`${col} = $${params.length}`);
    };

    if ('store_name' in b) add('store_name', v.str(b.store_name, 'store_name', { required: true, min: 2, max: 160 }));
    if ('business_type' in b && b.business_type !== req.merchant.business_type) {
      throw new HttpError(400, "Biznes yo'nalishi ro'yxatdan o'tishda belgilangan va uni o'zgartirib bo'lmaydi");
    }
    if ('address' in b) add('address', v.str(b.address, 'address', { max: 500 }));
    if ('delivery_available' in b) add('delivery_available', v.bool(b.delivery_available, 'delivery_available', { defaultValue: false }));
    if ('lat' in b || 'lng' in b) {
      const lat = v.num(b.lat, 'lat', { min: -90, max: 90 });
      const lng = v.num(b.lng, 'lng', { min: -180, max: 180 });
      if ((lat === null) !== (lng === null)) throw new HttpError(422, 'lat va lng birga yuborilishi kerak');
      add('lat', lat);
      add('lng', lng);
      sets.push(lat === null ? 'location = NULL' : `location = point($${params.length}::float8, $${params.length - 1}::float8)`);
    }
    if (!sets.length) throw new HttpError(400, "Yangilanadigan maydon yo'q");

    params.push(req.merchant.id);
    const { rows } = await query(
      `UPDATE merchants SET ${sets.join(', ')}, updated_at = ${NOW}
        WHERE id = $${params.length}
        RETURNING id, user_id, store_name, phone, business_type, address, lat, lng, delivery_available, is_active, created_at`,
      params
    );
    res.json({ merchant: rows[0] });
  })
);

module.exports = router;

