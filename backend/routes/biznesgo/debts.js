const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// 0. Qarz xulosasi va Kechikkan qarzlar statistikasi (Dashboard va qarz daftari uchun)
router.get('/summary', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;

  try {
    const summaryRes = await pool.query(
      `SELECT 
        COALESCE(SUM(debt_balance), 0) as total_debt_balance,
        COUNT(CASE WHEN debt_balance > 0 THEN 1 END) as total_debtors,
        COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN debt_balance ELSE 0 END), 0) as overdue_debt_balance,
        COUNT(CASE WHEN debt_balance > 0 AND due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 1 END) as overdue_debtors_count,
        COALESCE(SUM(CASE WHEN due_date IS NOT NULL AND due_date >= CURRENT_DATE AND due_date <= CURRENT_DATE + 3 THEN debt_balance ELSE 0 END), 0) as urgent_debt_balance
       FROM customers
       WHERE (tenant_id = $1 OR merchant_id = $1)`,
      [tenantId]
    );

    const s = summaryRes.rows[0];
    res.json({
      total_debt: Number(s.total_debt_balance),
      total_debtors: Number(s.total_debtors),
      overdue_debt: Number(s.overdue_debt_balance),
      overdue_debtors_count: Number(s.overdue_debtors_count),
      urgent_debt: Number(s.urgent_debt_balance)
    });
  } catch (err) {
    console.error('Debt summary error:', err.message);
    res.json({
      total_debt: 0,
      total_debtors: 0,
      overdue_debt: 0,
      overdue_debtors_count: 0,
      urgent_debt: 0
    });
  }
});

// 1. Qarzdor mijozlar ro'yxati (Status: overdue, urgent, normal, closed)
router.get('/customers', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { filter, search } = req.query;

  try {
    let query = `
      SELECT 
        id, name, phone, customer_type, farm_profile, credit_limit, debt_balance, 
        TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
        (CURRENT_DATE - due_date) as days_overdue,
        notes, created_at,
        CASE 
          WHEN debt_balance <= 0 THEN 'closed'
          WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'
          WHEN due_date IS NOT NULL AND due_date <= CURRENT_DATE + 3 THEN 'urgent'
          ELSE 'normal'
        END as status
      FROM customers
      WHERE (tenant_id = $1 OR merchant_id = $1)
    `;
    const params = [tenantId];

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR farm_profile ILIKE $${params.length})`;
    }

    if (filter === 'overdue') {
      query += ` AND debt_balance > 0 AND due_date IS NOT NULL AND due_date < CURRENT_DATE`;
    } else if (filter === 'active') {
      query += ` AND debt_balance > 0`;
    } else if (filter === 'closed') {
      query += ` AND debt_balance <= 0`;
    }

    query += ` ORDER BY debt_balance DESC, due_date ASC NULLS LAST`;

    const result = await pool.query(query, params);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Debts customers fetch error:', error.message);
    res.json({ customers: [] });
  }
});

// 2. Yangi mijoz qo'shish (Fermer, ferma, do'kon)
router.post('/customers', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { name, phone, customer_type = 'fermer', farm_profile, credit_limit = 10000000, due_date, notes } = req.body;

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ error: 'Mijoz ismi va telefon raqami majburiy' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (
        tenant_id, merchant_id, name, phone, customer_type, farm_profile, credit_limit, debt_balance, due_date, notes
      ) VALUES ($1, $1, $2, $3, $4, $5, $6, 0, $7, $8)
      RETURNING *`,
      [
        tenantId,
        name.trim(),
        phone.trim(),
        customer_type,
        farm_profile?.trim() || 'Fermer xo\'jaligi / Mijoz',
        Number(credit_limit) || 10000000,
        due_date || null,
        notes || null
      ]
    );
    res.status(201).json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Add customer error:', error.message);
    res.status(500).json({ error: 'Mijozni saqlashda xatolik yuz berdi' });
  }
});

// 3. Qisman yoki to'liq qarz to'lovini qabul qilish (ACID Tranzaksiya)
router.post('/repay', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { customer_id, amount, payment_method = 'cash', notes, new_due_date } = req.body;

  const repayAmount = Number(amount);
  if (!customer_id || isNaN(repayAmount) || repayAmount <= 0) {
    return res.status(400).json({ error: 'To\'lov summasi to\'g\'ri kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Mijozning joriy qarzini tekshirish (FOR UPDATE)
    const custRes = await client.query(
      `SELECT id, name, debt_balance, phone 
       FROM customers 
       WHERE id = $1 AND (tenant_id = $2 OR merchant_id = $2) FOR UPDATE`,
      [customer_id, tenantId]
    );

    if (custRes.rows.length === 0) {
      throw new Error('Mijoz topilmadi');
    }

    const currentDebt = Number(custRes.rows[0].debt_balance);
    if (currentDebt <= 0) {
      throw new Error('Ushbu mijozda to\'lanishi kerak bo\'lgan qarz mavjud emas');
    }

    const remainingBalance = Math.max(0, currentDebt - repayAmount);

    // 2. debts jadvalida eski faol qarzlarni yopib borish
    let remainingToRepay = repayAmount;
    const activeDebtsRes = await client.query(
      `SELECT id, remaining_amount FROM debts 
       WHERE customer_id = $1 AND tenant_id = $2 AND status IN ('active', 'partially_paid', 'overdue')
       ORDER BY due_date ASC, created_at ASC FOR UPDATE`,
      [customer_id, tenantId]
    );

    for (const d of activeDebtsRes.rows) {
      if (remainingToRepay <= 0) break;
      const dRem = Number(d.remaining_amount);
      if (remainingToRepay >= dRem) {
        await client.query(`UPDATE debts SET remaining_amount = 0, status = 'closed' WHERE id = $1`, [d.id]);
        remainingToRepay -= dRem;
      } else {
        await client.query(`UPDATE debts SET remaining_amount = remaining_amount - $1, status = 'partially_paid' WHERE id = $2`, [remainingToRepay, d.id]);
        remainingToRepay = 0;
      }
    }

    // 3. Qarz balansini kamaytirish
    await client.query(
      `UPDATE customers 
       SET debt_balance = $1,
           due_date = CASE WHEN $1 = 0 THEN NULL ELSE COALESCE($2, due_date) END
       WHERE id = $3`,
      [remainingBalance, new_due_date || null, customer_id]
    );

    // 4. debt_payments jadvaliga kvitansiya yozish
    const receiptNo = `QP-${Date.now().toString().slice(-6)}`;
    await client.query(
      `INSERT INTO debt_payments (tenant_id, customer_id, amount, payment_method, receipt_no, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, customer_id, repayAmount, payment_method, receiptNo, notes || null]
    );

    // 5. Orqaga moslik: debt_transactions
    await client.query(
      `INSERT INTO debt_transactions (merchant_id, customer_id, type, amount, notes)
       VALUES ($1, $2, 'repayment', $3, $4)`,
      [tenantId, customer_id, repayAmount, notes || `Qarz to'landi (Kvitansiya: ${receiptNo})`]
    );

    // 6. Kassa hisob raqamiga kirim qilish
    try {
      const accountRes = await client.query(
        `SELECT id FROM cash_accounts WHERE tenant_id = $1 LIMIT 1`,
        [tenantId]
      );
      if (accountRes.rows.length > 0) {
        await client.query(
          `UPDATE cash_accounts SET balance = balance + $1 WHERE id = $2`,
          [repayAmount, accountRes.rows[0].id]
        );
        await client.query(
          `INSERT INTO cash_transactions (tenant_id, account_id, transaction_type, amount, reference_type, reference_id, category, notes)
           VALUES ($1, $2, 'customer_debt_payment', $3, 'debt_payment', $4, 'Qarz to\'lovi', $5)`,
          [tenantId, accountRes.rows[0].id, repayAmount, customer_id, `Mijoz: ${custRes.rows[0].name}`]
        );
      }
    } catch (_) {}

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'debt.repay', 'customer', $2, $3)`,
      [tenantId, customer_id, JSON.stringify({ amount: repayAmount, remaining_balance: remainingBalance, receipt_no: receiptNo })]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      receipt_no: receiptNo,
      message: remainingBalance === 0 ? 'Qarz to\'liq yopildi!' : 'Qisman to\'lov qabul qilindi',
      paid_amount: repayAmount,
      remaining_balance: remainingBalance
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Repay error:', error.message);
    res.status(400).json({ error: error.message || 'To\'lovni qabul qilishda xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

// 4. Bitta mijozning to'liq qarz va to'lovlar tarixi
router.get('/customers/:id/history', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const customerId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT * FROM debt_transactions 
       WHERE customer_id = $1 AND (merchant_id = $2 OR tenant_id = $2)
       ORDER BY created_at DESC LIMIT 50`,
      [customerId, tenantId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    res.json({ history: [] });
  }
});

module.exports = router;
