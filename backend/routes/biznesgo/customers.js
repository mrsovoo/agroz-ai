/**
 * CUSTOMERS (CRM)
 *   GET  /customers       — ro'yxat + qarz balansi + xaridlar statistikasi: ?search=&has_debt=1&sort=debt|name|recent
 *   GET  /customers/:id   — mijoz kartochkasi: xaridlar tarixi va qarzlari
 *   POST /customers       — yangi mijoz
 *   PUT  /customers/:id   — tahrirlash
 */
const express = require('express');
const { query } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { loadOwned } = require('../../lib/ownership');

const router = express.Router();

let columnsChecked = false;
async function ensureCustomerColumns() {
  if (columnsChecked) return;
  try {
    await query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS crop_or_animal_profile VARCHAR(255);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS feed_frequency_days INT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(14,2) DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS planting_season VARCHAR(100);
    `);
    columnsChecked = true;
  } catch (e) {}
}

const STATS = `
  COALESCE(st.purchases_count, 0)::int AS purchases_count,
  COALESCE(st.purchases_total, 0) AS purchases_total,
  st.last_purchase_at`;
const STATS_JOIN = `
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS purchases_count, SUM(s.total_amount) AS purchases_total, MAX(s.created_at) AS last_purchase_at
      FROM sales s WHERE s.customer_id = c.id AND s.status = 'completed'
  ) st ON true`;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    await ensureCustomerColumns();
    const { limit, offset } = v.paging(req.query, { defLimit: 100, maxLimit: 500 });
    const where = ['c.merchant_id = $1'];
    const params = [req.merchant.id];
    const search = v.str(req.query.search, 'search', { max: 100 });
    if (search) {
      params.push(`%${search}%`);
      where.push(`(c.full_name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`);
    }
    if (req.query.has_debt === '1') where.push('c.total_debt > 0');
    const sorts = { debt: 'c.total_debt DESC, c.full_name', name: 'c.full_name ASC', recent: 'st.last_purchase_at DESC NULLS LAST' };
    const orderBy = sorts[req.query.sort] || sorts.name;

    const { rows } = await query(
      `SELECT c.id, c.full_name, c.phone, c.address, c.total_debt, c.created_at,
              c.crop_or_animal_profile, c.feed_frequency_days, c.credit_limit, c.planting_season,
              ${STATS}
         FROM customers c ${STATS_JOIN}
        WHERE ${where.join(' AND ')}
        ORDER BY ${orderBy}, c.id
        LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ customers: rows, limit, offset });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    await ensureCustomerColumns();
    const id = v.idParam(req.params.id);
    await loadOwned({ query }, 'customers', id, req.merchant.id, { columns: 'id' });
    const [customer, sales, debts] = await Promise.all([
      query(`SELECT c.id, c.full_name, c.phone, c.address, c.total_debt, c.created_at,
                    c.crop_or_animal_profile, c.feed_frequency_days, c.credit_limit, c.planting_season,
                    ${STATS}
               FROM customers c ${STATS_JOIN} WHERE c.id = $1`, [id]),
      query(
        `SELECT s.id, s.payment_type, s.total_amount, s.discount_amount, s.source, s.status, s.created_at,
                COALESCE(json_agg(json_build_object('product_name', si.product_name, 'quantity', si.quantity,
                         'unit_price', si.unit_price) ORDER BY si.id) FILTER (WHERE si.id IS NOT NULL), '[]') AS items
           FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
          WHERE s.customer_id = $1 AND s.merchant_id = $2
          GROUP BY s.id ORDER BY s.created_at DESC LIMIT 50`,
        [id, req.merchant.id]
      ),
      query(
        `SELECT id, sale_id, total_debt, paid_amount, (total_debt - paid_amount) AS remaining, status, due_date, created_at
           FROM debts WHERE customer_id = $1 AND merchant_id = $2 ORDER BY created_at DESC`,
        [id, req.merchant.id]
      ),
    ]);
    res.json({ customer: { ...customer.rows[0], sales: sales.rows, debts: debts.rows } });
  })
);

function parseCustomer(body, { partial = false } = {}) {
  const out = {};
  const has = (k) => !partial || k in body;
  if (has('full_name')) out.full_name = v.str(body.full_name, 'full_name', { required: true, min: 2, max: 160 });
  if (has('phone')) out.phone = v.phone(body.phone, 'phone');
  if (has('address')) out.address = v.str(body.address, 'address', { max: 500 });
  if (has('crop_or_animal_profile')) out.crop_or_animal_profile = v.str(body.crop_or_animal_profile, 'crop_or_animal_profile', { max: 255 });
  if (has('feed_frequency_days')) out.feed_frequency_days = v.int(body.feed_frequency_days, 'feed_frequency_days', { min: 1, max: 365 });
  if (has('credit_limit')) out.credit_limit = v.money(v.num(body.credit_limit, 'credit_limit', { min: 0, max: 1e12 }));
  if (has('planting_season')) out.planting_season = v.str(body.planting_season, 'planting_season', { max: 100 });
  return out;
}

router.post(
  '/',
  asyncHandler(async (req, res) => {
    await ensureCustomerColumns();
    const c = parseCustomer(req.body || {});
    const keys = Object.keys(c);
    const cols = ['merchant_id', ...keys];
    const vals = [req.merchant.id, ...Object.values(c)];
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await query(
      `INSERT INTO customers (${cols.join(', ')}) VALUES (${placeholders})
       RETURNING id, full_name, phone, address, total_debt, crop_or_animal_profile, feed_frequency_days, credit_limit, planting_season, created_at`,
      vals
    );
    res.status(201).json({ customer: rows[0] });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    await ensureCustomerColumns();
    const id = v.idParam(req.params.id);
    await loadOwned({ query }, 'customers', id, req.merchant.id, { columns: 'id' });
    const c = parseCustomer(req.body || {}, { partial: true });
    const keys = Object.keys(c);
    if (!keys.length) throw new HttpError(400, "Yangilanadigan maydon yo'q");
    const { rows } = await query(
      `UPDATE customers SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}
        WHERE id = $${keys.length + 1} AND merchant_id = $${keys.length + 2}
        RETURNING id, full_name, phone, address, total_debt, crop_or_animal_profile, feed_frequency_days, credit_limit, planting_season, created_at`,
      [...Object.values(c), id, req.merchant.id]
    );
    res.json({ customer: rows[0] });
  })
);

module.exports = router;

