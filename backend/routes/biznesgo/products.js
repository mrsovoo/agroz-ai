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

let columnsChecked = false;
async function ensureExtraColumns() {
  if (columnsChecked) return;
  try {
    await query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS active_ingredient VARCHAR(255);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS packaging_type VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS germination_rate_percent INT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS harvest_year INT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS part_number VARCHAR(100);
      ALTER TABLE products DROP CONSTRAINT IF EXISTS products_unit_check;
    `);
    columnsChecked = true;
  } catch (e) {}
}

const COLUMNS = `id, merchant_id, name, category, price, unit, stock_quantity, min_stock_alert, image_url,
  batch_number, expiry_date, wholesale_price, wholesale_min_qty,
  bag_weight_kg, variety, ripening_period, season, model, serial_number, warranty_months,
  COALESCE(active_ingredient, NULL) AS active_ingredient,
  COALESCE(packaging_type, NULL) AS packaging_type,
  COALESCE(germination_rate_percent, NULL) AS germination_rate_percent,
  COALESCE(harvest_year, NULL) AS harvest_year,
  COALESCE(part_number, NULL) AS part_number,
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
  if (has('category')) {
    const cat = v.str(body.category, 'category', { max: 100 });
    const allowed = bt && Array.isArray(bt.categories) ? bt.categories : [];
    if (cat && allowed.length > 0 && !allowed.includes(cat)) {
      throw new HttpError(400, `"${cat}" kategoriyasi ushbu sektor (${merchant.business_type}) uchun ruxsat etilmagan`);
    }
    out.category = cat;
  }
  if (has('price')) out.price = v.money(v.num(body.price, 'price', { required: !partial, min: 0, max: 1e12 }) ?? 0);
  if (has('unit')) {
    let rawUnit = body.unit || (partial ? undefined : bt && bt.defaultUnit) || 'dona';
    if (typeof rawUnit === 'string') {
      rawUnit = rawUnit.trim().toLowerCase();
      if (rawUnit === 'liter') rawUnit = 'litr';
    }
    const allowed = ALL_UNITS;
    out.unit = v.oneOf(rawUnit, 'unit', allowed, { required: !partial }) || 'dona';
    if (out.unit === null) delete out.unit;
  }
  if (!partial && 'stock_quantity' in body) out.stock_quantity = v.num(body.stock_quantity, 'stock_quantity', { min: 0, max: 1e12 }) ?? 0;
  if (has('min_stock_alert')) {
    const m = v.num(body.min_stock_alert, 'min_stock_alert', { min: 0, max: 1e12 });
    if (m !== null) out.min_stock_alert = m;
  }
  if (has('image_url')) {
    const url = v.str(body.image_url, 'image_url', { max: 5000000 });
    out.image_url = url;
  }

  // Biznes turiga xos maydonlar:
  // 1) Agro-Vet va Urug'chilik uchun partiya va yaroqlilik
  if (has('batch_number')) out.batch_number = v.str(body.batch_number, 'batch_number', { max: 64 });
  if (has('expiry_date')) out.expiry_date = v.date(body.expiry_date, 'expiry_date');
  if (has('active_ingredient')) out.active_ingredient = v.str(body.active_ingredient, 'active_ingredient', { max: 255 });

  // 2) Ulgurji savdo (Warehouse, Feed, Machinery)
  if (has('wholesale_price')) out.wholesale_price = v.num(body.wholesale_price, 'wholesale_price', { min: 0, max: 1e12 });
  if (has('wholesale_min_qty') || has('min_wholesale_quantity')) {
    out.wholesale_min_qty = v.num(body.wholesale_min_qty || body.min_wholesale_quantity, 'wholesale_min_qty', { min: 0, max: 1e12 });
  }
  if (has('packaging_type')) out.packaging_type = v.str(body.packaging_type, 'packaging_type', { max: 100 });

  // 3) Yem-Ozuqa (Feed) — 1 qop vazni (kg da)
  if (has('bag_weight_kg')) {
    out.bag_weight_kg = v.num(body.bag_weight_kg, 'bag_weight_kg', { min: 0.1, max: 10000 });
  }

  // 4) Urug' va Ko'chat (Seeds) — navi, pishish muddati, mavsumiyligi, unuvchanlik, hosil yili
  if (has('variety')) out.variety = v.str(body.variety, 'variety', { max: 100 });
  if (has('ripening_period')) out.ripening_period = v.str(body.ripening_period, 'ripening_period', { max: 50 });
  if (has('season')) out.season = v.str(body.season, 'season', { max: 50 });
  if (has('germination_rate_percent')) out.germination_rate_percent = v.int(body.germination_rate_percent, 'germination_rate_percent', { min: 0, max: 100 });
  if (has('harvest_year')) out.harvest_year = v.int(body.harvest_year, 'harvest_year', { min: 2000, max: 2050 });

  // 5) Jihoz va Texnika (Machinery) — model, seriya raqami, kafolat, zapchast kodi
  if (has('model')) out.model = v.str(body.model, 'model', { max: 100 });
  if (has('serial_number')) out.serial_number = v.str(body.serial_number, 'serial_number', { max: 100 });
  if (has('warranty_months')) out.warranty_months = v.int(body.warranty_months, 'warranty_months', { min: 0, max: 120 });
  if (has('part_number')) out.part_number = v.str(body.part_number, 'part_number', { max: 100 });

  if (partial && has('is_active')) out.is_active = v.bool(body.is_active, 'is_active', { defaultValue: true });
  return out;
}

// ---------------------------------------------------------------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await ensureExtraColumns();
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
    const bt = BUSINESS_TYPES[req.merchant.business_type];
    const allowed = bt && Array.isArray(bt.categories) ? bt.categories : [];
    const { rows } = await query(
      `SELECT category, COUNT(*)::int AS count FROM products
        WHERE merchant_id = $1 AND is_active AND category IS NOT NULL
        GROUP BY category ORDER BY category`,
      [req.merchant.id]
    );
    // Boshqa sektor kategoriyalari aralashib ketmasligi uchun qat'iy filtrlash
    const filteredRows = allowed.length > 0
      ? rows.filter((r) => allowed.includes(r.category))
      : rows;
    res.json({ categories: filteredRows, sector_categories: allowed });
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
    await ensureExtraColumns();
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

