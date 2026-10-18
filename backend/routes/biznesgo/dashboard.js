/**
 * DASHBOARD / ANALITIKA
 *   GET /dashboard?days=7  — bugungi tushum, to'lov turlari, kunlik grafik, top mahsulotlar,
 *                            kam qoldiq, muddati yaqin, qarz balansi, yangi buyurtmalar
 */
const express = require('express');
const { query, TODAY } = require('../../db/pool');
const { asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const mid = req.merchant.id;
    const days = v.int(req.query.days, 'days', { min: 1, max: 90 }) ?? 7;

    const [today, series, top, stock, debts, orders, recent] = await Promise.all([
      query(
        `SELECT COUNT(*)::int AS sales_count,
                COALESCE(SUM(total_amount), 0) AS revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE payment_type = 'cash'), 0) AS cash,
                COALESCE(SUM(total_amount) FILTER (WHERE payment_type = 'card'), 0) AS card,
                COALESCE(SUM(total_amount) FILTER (WHERE payment_type = 'debt'), 0) AS debt,
                COALESCE(SUM(discount_amount), 0) AS discounts
           FROM sales WHERE merchant_id = $1 AND status = 'completed' AND created_at >= ${TODAY}`,
        [mid]
      ),
      query(
        `SELECT to_char(d, 'YYYY-MM-DD') AS date,
                COALESCE(SUM(s.total_amount), 0) AS revenue,
                COUNT(s.id)::int AS sales_count
           FROM generate_series(${TODAY} - ($2::int - 1), ${TODAY}, interval '1 day') d
           LEFT JOIN sales s ON s.merchant_id = $1 AND s.status = 'completed'
                            AND s.created_at >= d AND s.created_at < d + interval '1 day'
          GROUP BY d ORDER BY d`,
        [mid, days]
      ),
      query(
        `SELECT si.product_id, COALESCE(MAX(si.product_name), MAX(p.name)) AS name, MAX(p.unit) AS unit,
                SUM(si.quantity) AS quantity, SUM(si.quantity * si.unit_price) AS revenue
           FROM sale_items si
           JOIN sales s ON s.id = si.sale_id
           JOIN products p ON p.id = si.product_id
          WHERE s.merchant_id = $1 AND s.status = 'completed' AND s.created_at >= ${TODAY} - 29
          GROUP BY si.product_id ORDER BY revenue DESC LIMIT 5`,
        [mid]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE stock_quantity <= 0)::int AS out_of_stock,
                COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= min_stock_alert)::int AS low_stock,
                COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date < ${TODAY})::int AS expired,
                COUNT(*) FILTER (WHERE expiry_date IS NOT NULL AND expiry_date >= ${TODAY}
                                   AND expiry_date <= ${TODAY} + 30)::int AS expiring_30d,
                COUNT(*)::int AS products_total,
                COALESCE(SUM(GREATEST(stock_quantity, 0) * price), 0) AS stock_value
           FROM products WHERE merchant_id = $1 AND is_active`,
        [mid]
      ),
      query(
        `SELECT COALESCE(SUM(total_debt - paid_amount), 0) AS outstanding,
                COUNT(DISTINCT customer_id)::int AS debtors,
                COALESCE(SUM(total_debt - paid_amount) FILTER (WHERE due_date < ${TODAY}), 0) AS overdue
           FROM debts WHERE merchant_id = $1 AND status <> 'paid'`,
        [mid]
      ),
      query(
        `SELECT COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
                COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted
           FROM sales WHERE merchant_id = $1 AND source = 'agrozgo'`,
        [mid]
      ),
      query(
        `SELECT s.id, s.total_amount, s.payment_type, s.source, s.status, s.created_at,
                COALESCE(c.full_name, s.customer_name) AS customer_name
           FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
          WHERE s.merchant_id = $1 ORDER BY s.created_at DESC LIMIT 8`,
        [mid]
      ),
    ]);

    res.json({
      today: today.rows[0],
      series: series.rows,
      top_products: top.rows,
      stock: stock.rows[0],
      debts: debts.rows[0],
      orders: orders.rows[0],
      recent_sales: recent.rows,
    });
  })
);

module.exports = router;

