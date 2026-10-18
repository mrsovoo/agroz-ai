/**
 * AGROZGO ORDERS BRIDGE (merchant tomoni)
 *   GET   /orders              — AgrozGO B2C dan tushgan buyurtmalar: ?status=pending|accepted|completed|rejected|cancelled|active|all
 *   GET   /orders/:id
 *   PATCH /orders/:id/status   — { status: 'accepted' | 'rejected' | 'completed' | 'cancelled', note? }
 *
 * Holat o'tishlari:
 *   pending  → accepted | rejected | cancelled
 *   accepted → completed | cancelled
 * Buyurtma kelganda (POST /bridge/orders) ombor qoldig'i zaxiraga olinadi (kamayadi);
 * rejected / cancelled bo'lsa qoldiq QAYTARILADI — hammasi bitta tranzaksiyada.
 */
const express = require('express');
const { query, withTransaction, NOW } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { restoreStock } = require('../../services/sales');
const { notifyAgrozgo } = require('../../services/agrozgo');

const router = express.Router();

const TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};
const RESTORE_ON = new Set(['rejected', 'cancelled']);

const ORDER_COLUMNS = `s.id, s.external_ref, s.status, s.payment_type, s.total_amount, s.discount_amount,
  s.customer_name, s.customer_phone, s.delivery_address, s.note, s.created_at, s.updated_at`;

async function loadOrder(db, id, merchantId, forUpdate = false) {
  const { rows } = await db.query(
    `SELECT ${ORDER_COLUMNS}, s.merchant_id, s.source FROM sales s WHERE s.id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [id]
  );
  const o = rows[0];
  if (!o || o.source !== 'agrozgo') throw new HttpError(404, 'Buyurtma topilmadi');
  if (o.merchant_id !== merchantId) throw new HttpError(403, 'Bu buyurtma boshqa sotuvchiga tegishli', 'FORBIDDEN');
  delete o.merchant_id;
  delete o.source;
  return o;
}

async function loadItems(db, saleId) {
  const { rows } = await db.query(
    `SELECT si.product_id, COALESCE(si.product_name, p.name) AS product_name, p.unit, si.quantity, si.unit_price,
            p.stock_quantity AS current_stock
       FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = $1 ORDER BY si.id`,
    [saleId]
  );
  return rows;
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { limit, offset } = v.paging(req.query);
    const status = v.oneOf(req.query.status, 'status', ['pending', 'accepted', 'completed', 'rejected', 'cancelled', 'active', 'all']) || 'all';
    const params = [req.merchant.id];
    let filter = '';
    if (status === 'active') filter = "AND s.status IN ('pending','accepted')";
    else if (status !== 'all') {
      params.push(status);
      filter = `AND s.status = $${params.length}`;
    }
    const [list, counts] = await Promise.all([
      query(
        `SELECT ${ORDER_COLUMNS},
                COALESCE(json_agg(json_build_object('product_id', si.product_id, 'product_name', si.product_name,
                         'quantity', si.quantity, 'unit_price', si.unit_price) ORDER BY si.id)
                         FILTER (WHERE si.id IS NOT NULL), '[]') AS items
           FROM sales s LEFT JOIN sale_items si ON si.sale_id = s.id
          WHERE s.merchant_id = $1 AND s.source = 'agrozgo' ${filter}
          GROUP BY s.id
          ORDER BY (s.status = 'pending') DESC, s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      query(
        `SELECT status, COUNT(*)::int AS n FROM sales WHERE merchant_id = $1 AND source = 'agrozgo' GROUP BY status`,
        [req.merchant.id]
      ),
    ]);
    res.json({
      orders: list.rows,
      counts: Object.fromEntries(counts.rows.map((r) => [r.status, r.n])),
      limit,
      offset,
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = v.idParam(req.params.id);
    const order = await loadOrder({ query }, id, req.merchant.id);
    res.json({ order: { ...order, items: await loadItems({ query }, id) } });
  })
);

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = v.idParam(req.params.id);
    const next = v.oneOf(req.body && req.body.status, 'status', ['accepted', 'rejected', 'completed', 'cancelled'], { required: true });
    const note = v.str(req.body && req.body.note, 'note', { max: 500 });

    const order = await withTransaction(async (client) => {
      const current = await loadOrder(client, id, req.merchant.id, true);
      if (!TRANSITIONS[current.status].includes(next)) {
        throw new HttpError(409, `"${current.status}" holatidan "${next}" ga o'tib bo'lmaydi`, 'BAD_TRANSITION', {
          from: current.status,
          allowed: TRANSITIONS[current.status],
        });
      }
      if (RESTORE_ON.has(next)) await restoreStock(client, req.merchant.id, id);
      const { rows } = await client.query(
        `UPDATE sales s SET status = $1, note = COALESCE($2, s.note), updated_at = ${NOW}
          WHERE s.id = $3 AND s.merchant_id = $4 RETURNING ${ORDER_COLUMNS}`,
        [next, note, id, req.merchant.id]
      );
      return { ...rows[0], items: await loadItems(client, id), stock_restored: RESTORE_ON.has(next) };
    });

    notifyAgrozgo('order.status_changed', {
      order_id: order.id,
      external_ref: order.external_ref,
      merchant_id: req.merchant.id,
      status: order.status,
    });
    res.json({ order });
  })
);

module.exports = router;

