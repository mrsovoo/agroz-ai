const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// Agro-Vet Dorixona Pilot Dashboard tahlili va Xavf Bannerlari
router.get(['/', '/metrics'], async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;

  try {
    // 1. Bugungi kassa tushumi va to'lov turlari
    const todaySalesRes = await pool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(cash_amount), 0) as cash_revenue,
        COALESCE(SUM(card_amount), 0) as card_revenue,
        COALESCE(SUM(debt_amount), 0) as debt_revenue,
        COUNT(id) as total_receipts
       FROM sales 
       WHERE (tenant_id = $1 OR merchant_id = $1) AND DATE(created_at) = CURRENT_DATE`,
      [tenantId]
    );

    // 2. Muddat Monitoringi (90 / 60 / 30 / 7 kun va muddati o'tgan preparatlar)
    const expiryIntervalsRes = await pool.query(
      `SELECT 
        COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired_count,
        COUNT(CASE WHEN expiry_date >= CURRENT_DATE AND (expiry_date - CURRENT_DATE) <= 7 THEN 1 END) as critical_7_count,
        COUNT(CASE WHEN expiry_date >= CURRENT_DATE AND (expiry_date - CURRENT_DATE) <= 30 THEN 1 END) as critical_30_count,
        COUNT(CASE WHEN (expiry_date - CURRENT_DATE) > 30 AND (expiry_date - CURRENT_DATE) <= 60 THEN 1 END) as warning_60_count,
        COUNT(CASE WHEN (expiry_date - CURRENT_DATE) > 60 AND (expiry_date - CURRENT_DATE) <= 90 THEN 1 END) as warning_90_count
       FROM products 
       WHERE (tenant_id = $1 OR merchant_id = $1) AND stock > 0 AND expiry_date IS NOT NULL`,
      [tenantId]
    );

    // 3. Ombor qoldiq xavfi (Tugagan va kam qolgan dorilar)
    const lowStockRes = await pool.query(
      `SELECT 
        COUNT(CASE WHEN stock = 0 THEN 1 END) as out_of_stock_count,
        COUNT(CASE WHEN stock > 0 AND stock <= min_stock THEN 1 END) as low_stock_count
       FROM products 
       WHERE (tenant_id = $1 OR merchant_id = $1)`,
      [tenantId]
    );

    // 4. Qarz xavfi (Kechikkan qarzlar va jami nasiya balansi)
    const debtRes = await pool.query(
      `SELECT 
        COALESCE(SUM(debt_balance), 0) as total_debt_balance,
        COUNT(CASE WHEN debt_balance > 0 THEN 1 END) as debtor_count,
        COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN debt_balance ELSE 0 END), 0) as overdue_debt_balance,
        COUNT(CASE WHEN debt_balance > 0 AND due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 1 END) as overdue_debtors_count,
        COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + 3 THEN debt_balance ELSE 0 END), 0) as urgent_debt_balance
       FROM customers 
       WHERE (tenant_id = $1 OR merchant_id = $1)`,
      [tenantId]
    );

    // 5. Shoshilinch muddati kelgan 5 ta preparat (FEFO ogohlantirish ro'yxati)
    const urgentDrugsRes = await pool.query(
      `SELECT id, name, active_ingredient, batch_number, TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date, 
              stock, price, (expiry_date - CURRENT_DATE) as days_to_expiry,
              CASE 
                WHEN expiry_date < CURRENT_DATE THEN 'expired'
                WHEN (expiry_date - CURRENT_DATE) <= 7 THEN 'critical_7'
                ELSE 'critical_30'
              END as status
       FROM products
       WHERE (tenant_id = $1 OR merchant_id = $1) 
         AND stock > 0 
         AND expiry_date IS NOT NULL 
         AND (expiry_date - CURRENT_DATE) <= 30
       ORDER BY expiry_date ASC
       LIMIT 5`,
      [tenantId]
    );

    // 6. Bugungi sof foyda (Gross Profit)
    const profitRes = await pool.query(
      `SELECT 
        COALESCE(SUM((si.price - si.cost_price) * si.quantity), 0) as today_profit
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       WHERE (s.tenant_id = $1 OR s.merchant_id = $1) AND DATE(s.created_at) = CURRENT_DATE`,
      [tenantId]
    );

    const exp = expiryIntervalsRes.rows[0];
    const d = debtRes.rows[0];
    const s = todaySalesRes.rows[0];
    const l = lowStockRes.rows[0];

    res.json({
      today_revenue: Number(s.total_revenue),
      cash_revenue: Number(s.cash_revenue),
      card_revenue: Number(s.card_revenue),
      debt_revenue: Number(s.debt_revenue),
      today_profit: Number(profitRes.rows[0].today_profit),
      total_receipts: Number(s.total_receipts),
      
      // Muddat xavflari
      expired_count: Number(exp.expired_count),
      critical_7_count: Number(exp.critical_7_count),
      critical_expiry_count: Number(exp.critical_30_count),
      warning_60_count: Number(exp.warning_60_count),
      warning_90_count: Number(exp.warning_90_count),
      
      // Qoldiq xavflari
      out_of_stock_count: Number(l.out_of_stock_count),
      low_stock_count: Number(l.low_stock_count),
      
      // Qarz xavflari
      total_debt: Number(d.total_debt_balance),
      debtor_count: Number(d.debtor_count),
      overdue_debt: Number(d.overdue_debt_balance),
      overdue_debtors_count: Number(d.overdue_debtors_count),
      urgent_debt: Number(d.urgent_debt_balance),
      
      urgent_expiry_drugs: urgentDrugsRes.rows
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error.message);
    res.json({
      today_revenue: 0,
      cash_revenue: 0,
      card_revenue: 0,
      debt_revenue: 0,
      today_profit: 0,
      total_receipts: 0,
      expired_count: 0,
      critical_7_count: 0,
      critical_expiry_count: 0,
      warning_60_count: 0,
      warning_90_count: 0,
      out_of_stock_count: 0,
      low_stock_count: 0,
      total_debt: 0,
      debtor_count: 0,
      overdue_debt: 0,
      overdue_debtors_count: 0,
      urgent_debt: 0,
      urgent_expiry_drugs: []
    });
  }
});

module.exports = router;
