/**
 * POS & SALES
 *   POST /sales        — sotuv (BEGIN ... COMMIT). Ombor kamayadi; 'debt' bo'lsa qarz yaratiladi.
 *   GET  /sales        — tarix: ?from=YYYY-MM-DD&to=&payment_type=&source=&customer_id=&limit=&offset=
 *   GET  /sales/:id    — chek (items bilan)
 *
 * POST /sales body:
 * {
 *   "items": [{ "product_id": 1, "quantity": 2, "unit_price": 15000? }],
 *   "payment_type": "cash" | "card" | "debt",
 *   "discount_amount": 0,
 *   "customer_id": 5,                                   // yoki:
 *   "customer": { "full_name": "Ali", "phone": "+998901234567" },
 *   "paid_amount": 0,          // faqat debt: oldindan to'langan qism
 *   "due_date": "2026-11-01",  // faqat debt
 *   "note": "..."
 * }
 */
const express = require('express');
const { query, withTransaction } = require('../../db/pool');
const { asyncHandler, HttpError } = require('../../lib/errors');
const v = require('../../lib/validate');
const { loadOwned } = require('../../lib/ownership');
const { createSale } = require('../../services/sales');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const paymentType = v.oneOf(b.payment_type, 'payment_type', ['cash', 'card', 'debt'], { required: true });
    let customer = null;
    if (b.customer && typeof b.customer === 'object') {
      customer = {
        full_name: v.str(b.customer.full_name, 'customer.full_name', { required: true, max: 160 }),
        phone: v.phone(b.customer.phone, 'customer.phone'),
        address: v.str(b.customer.address, 'customer.address', { max: 500 }),
      };
    } else if (b.customer_name) {
      customer = {
        full_name: v.str(b.customer_name, 'customer_name', { required: true, max: 160 }),
        phone: v.phone(b.customer_phone, 'customer_phone'),
        address: v.str(b.customer_address, 'customer_address', { max: 500 }),
      };
    }
    const input = {
      items: b.items,
      payment_type: paymentType,
      discount_amount: v.num(b.discount_amount, 'discount_amount', { min: 0, max: 1e12 }) ?? 0,
      customer_id: b.customer_id ? v.idParam(b.customer_id, 'customer_id') : null,
      customer,
      paid_amount: paymentType === 'debt' ? v.num(b.paid_amount, 'paid_amount', { min: 0, max: 1e12 }) ?? 0 : 0,
      due_date: paymentType === 'debt' ? v.date(b.due_date, 'due_date') : null,
      note: v.str(b.note, 'note', { max: 1000 }),
      source: 'pos',
      status: 'completed',
    };

    const sale = await withTransaction((client) => createSale(client, req.merchant.id, input));
    res.status(201).json({ sale });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = v.paging(req.query);
    const where = ['s.merchant_id = $1'];
    const params = [req.merchant.id];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace(/\?/g, `$${params.length}`));
    };
    const from = v.date(req.query.from, 'from');
    const to = v.date(req.query.to, 'to');
    if (from) add('s.created_at >= ?::date', from);
    if (to) add("s.created_at < (?::date + 1)", to);
    const pt = v.oneOf(req.query.payment_type, 'payment_type', ['cash', 'card', 'debt']);
    if (pt) add('s.payment_type = ?', pt);
    const source = v.oneOf(req.query.source, 'source', ['pos', 'agrozgo']);
    if (source) add('s.source = ?', source);
    if (req.query.customer_id) add('s.customer_id = ?', v.idParam(req.query.customer_id, 'customer_id'));
    const whereSql = where.join(' AND ');

    const [list, totals] = await Promise.all([
      query(
        `SELECT s.id, s.payment_type, s.total_amount, s.discount_amount, s.source, s.status, s.created_at,
                s.customer_id, COALESCE(c.full_name, s.customer_name) AS customer_name,
                (SELECT COUNT(*)::int FROM sale_items si WHERE si.sale_id = s.id) AS items_count
           FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
          WHERE ${whereSql}
          ORDER BY s.created_at DESC, s.id DESC
          LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS revenue
           FROM sales s WHERE ${whereSql}`,
        params
      ),
    ]);
    res.json({ sales: list.rows, totals: totals.rows[0], limit, offset });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = v.idParam(req.params.id);
    const sale = await loadOwned({ query }, 'sales', id, req.merchant.id);
    const [items, customer, debt] = await Promise.all([
      query(
        `SELECT si.id, si.product_id, COALESCE(si.product_name, p.name) AS product_name, p.unit,
                si.quantity, si.unit_price, (si.quantity * si.unit_price) AS line_total
           FROM sale_items si JOIN products p ON p.id = si.product_id
          WHERE si.sale_id = $1 ORDER BY si.id`,
        [id]
      ),
      sale.customer_id
        ? query('SELECT id, full_name, phone, total_debt FROM customers WHERE id = $1', [sale.customer_id])
        : { rows: [] },
      query('SELECT * FROM debts WHERE sale_id = $1', [id]),
    ]);
    if (!sale) throw new HttpError(404, 'Sotuv topilmadi');
    res.json({ sale: { ...sale, items: items.rows, customer: customer.rows[0] || null, debt: debt.rows[0] || null } });
  })
);

module.exports = router;

