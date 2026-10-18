/**
 * Super Admin Stats API — GET /api/super-adm/stats
 * Neon DB aggregatsiyalari orqali platforma tahlili
 */
const express = require('express');
const { query } = require('../../db/pool');
const { asyncHandler } = require('../../lib/errors');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // 1. Do'konlar statistikasi
    const merchantStatsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_merchants,
        COUNT(*) FILTER (WHERE is_active = true AND (is_archived IS FALSE OR is_archived IS NULL))::int AS active_merchants,
        COUNT(*) FILTER (WHERE is_active = false AND (is_archived IS FALSE OR is_archived IS NULL))::int AS blocked_merchants,
        COUNT(*) FILTER (WHERE is_archived = true)::int AS archived_merchants
      FROM merchants
    `);
    const merchantStats = merchantStatsRes.rows[0] || {
      total_merchants: 0,
      active_merchants: 0,
      blocked_merchants: 0,
      archived_merchants: 0,
    };

    // 2. Biznes turlari bo'yicha taqsimot
    const byTypeRes = await query(`
      SELECT 
        business_type,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE is_active = true)::int AS active_count
      FROM merchants
      GROUP BY business_type
      ORDER BY count DESC
    `);

    // 3. Jami savdo ko'rsatkichlari
    const salesStatsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_sales_count,
        COALESCE(SUM(total_amount), 0)::float8 AS total_sales_amount,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN total_amount ELSE 0 END), 0)::float8 AS today_sales_amount
      FROM sales
    `);
    const salesStats = salesStatsRes.rows[0] || {
      total_sales_count: 0,
      total_sales_amount: 0,
      today_sales_amount: 0,
    };

    // 4. Jami ochiq qarzlar ko'rsatkichlari
    const debtStatsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_debts_count,
        COUNT(*) FILTER (WHERE status != 'paid')::int AS open_debts_count,
        COALESCE(SUM(total_debt - paid_amount) FILTER (WHERE status != 'paid'), 0)::float8 AS total_open_debt_amount
      FROM debts
    `);
    const debtStats = debtStatsRes.rows[0] || {
      total_debts_count: 0,
      open_debts_count: 0,
      total_open_debt_amount: 0,
    };

    // 5. Mahsulotlar statistikasi
    const productStatsRes = await query(`
      SELECT 
        COUNT(*)::int AS total_products_count,
        COALESCE(SUM(stock_quantity * price), 0)::float8 AS total_inventory_value
      FROM products
      WHERE is_active = true
    `);
    const productStats = productStatsRes.rows[0] || {
      total_products_count: 0,
      total_inventory_value: 0,
    };

    // 6. Oxirgi 7 kunlik savdo trendi (chart uchun)
    const trendRes = await query(`
      SELECT 
        TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(s.total_amount), 0)::float8 AS amount,
        COUNT(s.id)::int AS sales_count
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
      LEFT JOIN sales s ON DATE(s.created_at) = DATE(d.day)
      GROUP BY d.day
      ORDER BY d.day ASC
    `);

    res.json({
      ok: true,
      stats: {
        merchants: merchantStats,
        sales: salesStats,
        debts: debtStats,
        products: productStats,
        by_business_type: byTypeRes.rows,
        daily_trend: trendRes.rows,
      },
    });
  })
);

module.exports = router;
