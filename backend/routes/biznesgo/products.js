/**
 * PRODUCTS & INVENTORY
 *   GET    /products                  — ro'yxat: ?search=&category=&stock=low|out|in&include_inactive=1&sort=&limit=&offset=
 *   GET    /products/expired-alerts   — yaroqlilik muddati o'tgan / yaqinlashayotganlar: ?days=30
 *   GET    /products/categories       — merchant ishlatgan kategoriyalar
 *   GET    /products/:id
 *   POST   /products
 *   PUT    /products/:id              — qisman yangilash; qoldiqni `stock_quantity` (o'rnatish) yoki `stock_delta` (kirim/chiqim)
 *   DELETE /products/:id              — soft delete (is_active = false)
 */
const express = require('express');
const { query, withTransaction, NOW, TODAY } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { loadOwned } = require('../../lib/ownership');
const { BUSINESS_TYPES, ALL_UNITS } = require('../../lib/businessTypes');

const router = express.Router();

const COLUMNS = `id, merchant_id, name, category, price, unit, stock_quantity, min_stock_alert, image_url,
  batch_number, expiry_date, wholesale_price, wholesale_min_qty,
  bag_weight_kg, variety, ripening_period, season, model, serial_number, warranty_months,
  is_active, created_at, updated_at,
  CASE WHEN stock_quantity <= 0 THEN 'out'
       WHEN stock_quantity <= min_stock_alert THEN 'low'
       ELSE 'in' END AS stock_status,
  CASE WHEN expiry_date IS NULL THEN NULL ELSE (expiry_date - ${TODAY}) END AS days_to_expiry`;

/** Biznes turiga qarab maydonlarni validatsiya qiladi. `partial` — PUT uchun. */
function parseProduct(body, merchant, { partial = false } = {}) {
  const bt = BUSINESS_TYPES[merchant.business_type];
  const out = {};
  const has = (k) => !partial || Object.prototype.hasOwnProperty.call(body, k);

  if (has('name')) out.name = v.str(body.name, 'name', { required: true, min: 1, max: 200 });
  if (has('category')) out.category = v.str(body.category, 'category', { max: 100 });
  if (has('price')) out.price = v.money(v.num(body.price, 'price', { required: !partial, min: 0, max: 1e12 }) ?? 0);
  if (has('unit')) {
    const allowed = bt ? bt.units : ALL_UNITS;
    out.unit = v.oneOf(body.unit || (partial ? undefined : bt && bt.defaultUnit), 'unit', allowed, { required: !partial }) ;
    if (out.unit === null) delete out.unit;
  }
  if (!partial && 'stock_quantity' in body) out.stock_quantity = v.num(body.stock_quantity, 'stock_quantity', { min: 0, max: 1e12 }) ?? 0;
  if (has('min_stock_alert')) {
    const m = v.num(body.min_stock_alert, 'min_stock_alert', { min: 0, max: 1e12 });
    if (m !== null) out.min_stock_alert = m;
  }
  if (has('image_url')) {
    const url = v.str(body.image_url, 'image_url', { max: 2000 });
    if (url && !/^https?:\/\//i.test(url)) throw new HttpError(422, "image_url http(s) bilan boshlanishi kerak", 'VALIDATION_ERROR', { field: 'image_url' });
    out.image_url = url;
  }

  // Biznes turiga xos maydonlar:
  // 1) Agro-Vet va Urug'chilik uchun partiya va yaroqlilik
  if (bt && bt.fields.batch_number && has('batch_number')) out.batch_number = v.str(body.batch_number, 'batch_number', { max: 64 });
  if (bt && bt.fields.expiry_date && has('expiry_date')) out.expiry_date = v.date(body.expiry_date, 'expiry_date');

  // 2) Ulgurji savdo (Warehouse, Feed, Machinery)
  if (bt && bt.fields.wholesale) {
    if (has('wholesale_price')) out.wholesale_price = v.num(body.wholesale_price, 'wholesale_price', { min: 0, max: 1e12 });
    if (has('wholesale_min_qty')) out.wholesale_min_qty = v.num(body.wholesale_min_qty, 'wholesale_min_qty', { min: 0, max: 1e12 });
  }

  // 3) Yem-Ozuqa (Feed) — 1 qop vazni (kg da)
  if (bt && bt.fields.bag_weight_kg && has('bag_weight_kg')) {
    out.bag_weight_kg = v.num(body.bag_weight_kg, 'bag_weight_kg', { min: 0.1, max: 10000 });
  }

  // 4) Urug' va Ko'chat (Seeds) — navi, pishish muddati, mavsumiyligi
  if (bt && bt.fields.variety && has('variety')) out.variety = v.str(body.variety, 'variety', { max: 100 });
  if (bt && bt.fields.ripening_period && has('ripening_period')) out.ripening_period = v.str(body.ripening_period, 'ripening_period', { max: 50 });
  if (bt && bt.fields.season && has('season')) out.season = v.str(body.season, 'season', { max: 50 });

  // 5) Jihoz va Texnika (Machinery) — model, seriya raqami, kafolat
  if (bt && bt.fields.model && has('model')) out.model = v.str(body.model, 'model', { max: 100 });
  if (bt && bt.fields.serial_number && has('serial_number')) out.serial_number = v.str(body.serial_number, 'serial_number', { max: 100 });
  if (bt && bt.fields.warranty_months && has('warranty_months')) out.warranty_months = v.int(body.warranty_months, 'warranty_months', { min: 0, max: 120 });

  if (partial && has('is_active')) out.is_active = v.bool(body.is_active, 'is_active', { defaultValue: true });
  return out;
}

// ---------------------------------------------------------------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const mid = req.merchant.id;
    const { limit, offset } = v.paging(req.query, { defLimit: 100, maxLimit: 500 });
    const where = ['merchant_id = $1'];
    const params = [mid];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace('?', `$${params.length}`));
    };

    if (req.query.include_inactive !== '1') where.push('is_active');
    const search = v.str(req.query.search, 'search', { max: 100 });
    if (search) add("(name ILIKE ? OR category ILIKE ? OR batch_number ILIKE ?)".replace(/\?/g, `$${params.length + 1}`), `%${search}%`);
    const category = v.str(req.query.category, 'category', { max: 100 });
    if (category) add('category = ?', category);
    const stock = v.oneOf(req.query.stock, 'stock', ['low', 'out', 'in']);
    if (stock === 'out') where.push('stock_quantity <= 0');
    if (stock === 'low') where.push('stock_quantity > 0 AND stock_quantity <= min_stock_alert');
    if (stock === 'in') where.push('stock_quantity > min_stock_alert');

    const sorts = {
      name: 'name ASC',
      newest: 'created_at DESC',
      stock: 'stock_quantity ASC',
      price: 'price DESC',
      expiry: 'expiry_date ASC NULLS LAST',
    };
    const orderBy = sorts[req.query.sort] || sorts.name;

    const whereSql = where.join(' AND ');
    const [list, summary] = await Promise.all([
      query(`SELECT ${COLUMNS} FROM products WHERE ${whereSql} ORDER BY ${orderBy}, id LIMIT ${limit} OFFSET ${offset}`, params),
      query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE stock_quantity <= 0)::int AS out_of_stock,
                COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= min_stock_alert)::int AS low_stock,
                COALESCE(SUM(GREATEST(stock_quantity,0) * price), 0) AS stock_value
           FROM products WHERE ${whereSql}`,
        params
      ),
    ]);
    res.json({ products: list.rows, summary: summary.rows[0], limit, offset });
  })
);

router.get(
  '/expired-alerts',
  asyncHandler(async (req, res) => {
    const days = v.int(req.query.days, 'days', { min: 1, max: 365 }) ?? 30;
    const { rows } = await query(
      `SELECT ${COLUMNS} FROM products
        WHERE merchant_id = $1 AND is_active AND expiry_date IS NOT NULL
          AND expiry_date <= ${TODAY} + $2::int
        ORDER BY expiry_date ASC, id`,
      [req.merchant.id, days]
    );
    res.json({
      days,
      expired: rows.filter((r) => r.days_to_expiry < 0),
      expiring_soon: rows.filter((r) => r.days_to_expiry >= 0),
    });
  })
);

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT category, COUNT(*)::int AS count FROM products
        WHERE merchant_id = $1 AND is_active AND category IS NOT NULL
        GROUP BY category ORDER BY category`,
      [req.merchant.id]
    );
    res.json({ categories: rows });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await loadOwned({ query }, 'products', v.idParam(req.params.id), req.merchant.id, { columns: COLUMNS });
    res.json({ product });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const p = parseProduct(req.body || {}, req.merchant);
    const cols = ['merchant_id', ...Object.keys(p)];
    const vals = [req.merchant.id, ...Object.values(p)];
    const { rows } = await query(
      `INSERT INTO products (${cols.join(', ')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING ${COLUMNS}`,
      vals
    );
    res.status(201).json({ product: rows[0] });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = v.idParam(req.params.id);
    const body = req.body || {};
    const p = parseProduct(body, req.merchant, { partial: true });
    const stockSet = 'stock_quantity' in body ? v.num(body.stock_quantity, 'stock_quantity', { min: 0, max: 1e12 }) : null;
    const stockDelta = 'stock_delta' in body ? v.num(body.stock_delta, 'stock_delta', { min: -1e12, max: 1e12 }) : null;
    if (stockSet !== null && stockDelta !== null) {
      throw new HttpError(422, "stock_quantity va stock_delta birga yuborilmaydi");
    }

    const product = await withTransaction(async (client) => {
      const current = await loadOwned(client, 'products', id, req.merchant.id, { forUpdate: true, columns: 'id, stock_quantity' });
      const sets = [];
      const params = [];
      for (const [k, val] of Object.entries(p)) {
        params.push(val);
        sets.push(`${k} = $${params.length}`);
      }
      if (stockSet !== null) {
        params.push(stockSet);
        sets.push(`stock_quantity = $${params.length}`);
      }
      if (stockDelta !== null) {
        if (Number(current.stock_quantity) + stockDelta < 0) {
          throw new HttpError(409, "Qoldiq manfiy bo'lib qoladi", 'NEGATIVE_STOCK');
        }
        params.push(stockDelta);
        sets.push(`stock_quantity = stock_quantity + $${params.length}`);
      }
      if (!sets.length) throw new HttpError(400, "Yangilanadigan maydon yo'q");
      params.push(id, req.merchant.id);
      const { rows } = await client.query(
        `UPDATE products SET ${sets.join(', ')}, updated_at = ${NOW}
          WHERE id = $${params.length - 1} AND merchant_id = $${params.length}
          RETURNING ${COLUMNS}`,
        params
      );
      return rows[0];
    });
    res.json({ product });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = v.idParam(req.params.id);
    await loadOwned({ query }, 'products', id, req.merchant.id, { columns: 'id' });
    await query(`UPDATE products SET is_active = false, updated_at = ${NOW} WHERE id = $1 AND merchant_id = $2`, [
      id,
      req.merchant.id,
    ]);
    res.json({ ok: true, id });
  })
);

module.exports = router;

