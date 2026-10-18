/**
 * Super Admin Merchants Management API
 *   - GET    /api/super-adm/merchants          — do'konlar ro'yxati
 *   - GET    /api/super-adm/merchants/:id      — do'kon tafsilotlari
 *   - PATCH  /api/super-adm/merchants/:id/status — bloklash / faollashtirish va obuna
 *   - DELETE /api/super-adm/merchants/:id      — profil va ma'lumotlarni to'liq o'chirish (Cascade)
 *   - POST   /api/super-adm/merchants/:id/reset  — test savdo va qarzlarini nolga tushirish
 */
const express = require('express');
const { query, withTransaction } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');

const router = express.Router();

/**
 * GET /api/super-adm/merchants
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = (req.query.search || '').trim();
    const businessType = (req.query.business_type || '').trim();
    const status = (req.query.status || '').trim(); // 'active', 'blocked', 'all'
    const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
    const offset = Math.max(Number(req.query.offset || 0), 0);

    const where = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`(m.store_name ILIKE $${params.length} OR m.phone ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
    }

    if (businessType) {
      params.push(businessType);
      where.push(`m.business_type = $${params.length}`);
    }

    if (status === 'active') {
      where.push(`m.is_active = true`);
    } else if (status === 'blocked') {
      where.push(`m.is_active = false`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const listSql = `
      SELECT 
        m.id,
        m.user_id,
        m.store_name,
        m.phone,
        m.business_type,
        m.address,
        m.lat,
        m.lng,
        m.delivery_available,
        m.is_active,
        m.created_at,
        m.subscription_until,
        u.name AS owner_name,
        u.telegram_id,
        COALESCE(p.products_count, 0)::int AS products_count,
        COALESCE(s.sales_count, 0)::int AS sales_count,
        COALESCE(s.total_sales, 0)::float8 AS total_sales,
        COALESCE(d.open_debts_count, 0)::int AS open_debts_count,
        COALESCE(d.total_open_debt, 0)::float8 AS total_open_debt
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN (
        SELECT merchant_id, COUNT(*) AS products_count FROM products WHERE is_active = true GROUP BY merchant_id
      ) p ON p.merchant_id = m.id
      LEFT JOIN (
        SELECT merchant_id, COUNT(*) AS sales_count, SUM(total_amount) AS total_sales FROM sales GROUP BY merchant_id
      ) s ON s.merchant_id = m.id
      LEFT JOIN (
        SELECT merchant_id, COUNT(*) AS open_debts_count, SUM(total_debt - paid_amount) AS total_open_debt FROM debts WHERE status != 'paid' GROUP BY merchant_id
      ) d ON d.merchant_id = m.id
      ${whereClause}
      ORDER BY m.id DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      ${whereClause}
    `;

    const [listRes, countRes] = await Promise.all([
      query(listSql, [...params, limit, offset]),
      query(countSql, params),
    ]);

    res.json({
      ok: true,
      merchants: listRes.rows,
      total: countRes.rows[0]?.total || 0,
      limit,
      offset,
    });
  })
);

/**
 * GET /api/super-adm/merchants/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = v.int(req.params.id, 'id', { required: true, min: 1 });

    const sql = `
      SELECT 
        m.id, m.user_id, m.store_name, m.phone, m.business_type, m.address,
        m.lat, m.lng, m.delivery_available, m.is_active, m.created_at, m.subscription_until,
        u.name AS owner_name, u.telegram_id, u.created_at AS user_created_at
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      WHERE m.id = $1
    `;
    const { rows } = await query(sql, [id]);
    const merchant = rows[0];
    if (!merchant) throw new HttpError(404, "Do'kon topilmadi", 'MERCHANT_NOT_FOUND');

    res.json({ ok: true, merchant });
  })
);

/**
 * PATCH /api/super-adm/merchants/:id/status
 * Bloklash / faollashtirish va obuna muddatini belgilash
 */
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = v.int(req.params.id, 'id', { required: true, min: 1 });
    const { is_active, subscription_until } = req.body;

    const updates = [];
    const params = [id];

    if (typeof is_active === 'boolean') {
      params.push(is_active);
      updates.push(`is_active = $${params.length}`);
    }

    if (subscription_until !== undefined) {
      params.push(subscription_until ? new Date(subscription_until) : null);
      updates.push(`subscription_until = $${params.length}`);
    }

    if (!updates.length) {
      throw new HttpError(400, "O'zgartirish uchun maydonlar berilmadi", 'NO_UPDATES');
    }

    updates.push(`updated_at = (now() AT TIME ZONE 'Asia/Tashkent')`);

    const updateSql = `
      UPDATE merchants
         SET ${updates.join(', ')}
       WHERE id = $1
   RETURNING id, store_name, phone, business_type, is_active, subscription_until, updated_at
    `;

    const { rows } = await query(updateSql, params);
    if (!rows[0]) throw new HttpError(404, "Do'kon topilmadi", 'MERCHANT_NOT_FOUND');

    res.json({
      ok: true,
      message: "Do'kon holati muvaffaqiyatli yangilandi",
      merchant: rows[0],
    });
  })
);

/**
 * DELETE /api/super-adm/merchants/:id
 * Test profil va unga tegishli barcha ma'lumotlarni to'liq o'chirish (Cascade Delete)
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = v.int(req.params.id, 'id', { required: true, min: 1 });

    const result = await withTransaction(async (client) => {
      // 1. Do'kon mavjudligini tekshirish
      const mRes = await client.query('SELECT id, store_name, user_id FROM merchants WHERE id = $1', [id]);
      const merchant = mRes.rows[0];
      if (!merchant) throw new HttpError(404, "Do'kon topilmadi", 'MERCHANT_NOT_FOUND');

      // 2. Savdolar va chek detallarini o'chirish
      await client.query(`
        DELETE FROM sale_items
        WHERE sale_id IN (SELECT id FROM sales WHERE merchant_id = $1)
      `, [id]);
      await client.query('DELETE FROM sales WHERE merchant_id = $1', [id]);

      // 3. Qarzlar va qarz to'lovlarini o'chirish
      await client.query(`
        DELETE FROM debt_payments
        WHERE debt_id IN (SELECT id FROM debts WHERE merchant_id = $1)
      `, [id]);
      await client.query('DELETE FROM debts WHERE merchant_id = $1', [id]);

      // 4. Mahsulotlar (ombor) ni o'chirish
      await client.query('DELETE FROM products WHERE merchant_id = $1', [id]);

      // 5. Mijozlar ro'yxatini o'chirish
      await client.query('DELETE FROM customers WHERE merchant_id = $1', [id]);

      // 6. Merchant profilining o'zini o'chirish
      await client.query('DELETE FROM merchants WHERE id = $1', [id]);

      return merchant;
    });

    res.json({
      ok: true,
      message: `Do'kon ("${result.store_name}") va unga tegishli barcha ma'lumotlar o'chirildi`,
      deleted_merchant_id: id,
    });
  })
);

/**
 * POST /api/super-adm/merchants/:id/reset
 * Do'kon profilini o'chirmay, test savdolari, cheklari va qarzlarini nolga tushirish
 */
router.post(
  '/:id/reset',
  asyncHandler(async (req, res) => {
    const id = v.int(req.params.id, 'id', { required: true, min: 1 });

    const result = await withTransaction(async (client) => {
      // 1. Do'kon mavjudligini tekshirish
      const mRes = await client.query('SELECT id, store_name FROM merchants WHERE id = $1', [id]);
      const merchant = mRes.rows[0];
      if (!merchant) throw new HttpError(404, "Do'kon topilmadi", 'MERCHANT_NOT_FOUND');

      // 2. Savdolarni tozalash
      await client.query(`
        DELETE FROM sale_items
        WHERE sale_id IN (SELECT id FROM sales WHERE merchant_id = $1)
      `, [id]);
      const salesDel = await client.query('DELETE FROM sales WHERE merchant_id = $1', [id]);

      // 3. Qarzlarni tozalash
      await client.query(`
        DELETE FROM debt_payments
        WHERE debt_id IN (SELECT id FROM debts WHERE merchant_id = $1)
      `, [id]);
      const debtsDel = await client.query('DELETE FROM debts WHERE merchant_id = $1', [id]);

      // 4. Mijozlar qarzdorlik hisobini 0 qilish
      await client.query('UPDATE customers SET total_debt = 0 WHERE merchant_id = $1', [id]);

      return {
        merchant,
        deleted_sales: salesDel.rowCount || 0,
        deleted_debts: debtsDel.rowCount || 0,
      };
    });

    res.json({
      ok: true,
      message: `Do'kon ("${result.merchant.store_name}") test savdolari va qarzlari nolga tushirildi`,
      merchant_id: id,
      reset_stats: {
        deleted_sales: result.deleted_sales,
        deleted_debts: result.deleted_debts,
      },
    });
  })
);

module.exports = router;
