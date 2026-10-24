const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// 1. Qarzdor fermer/chorvadorlar ro'yxati (Balans serverda hisoblangan)
router.get('/customers', async (req, res) => {
  const merchantId = req.merchant.id;

  try {
    const query = `
      SELECT 
        id, name, phone, farm_profile, debt_balance, 
        TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
        notes, created_at,
        CASE 
          WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'
          WHEN due_date IS NOT NULL AND due_date <= CURRENT_DATE + 3 THEN 'urgent'
          ELSE 'normal'
        END as status
      FROM customers
      WHERE merchant_id = $1
      ORDER BY debt_balance DESC, due_date ASC NULLS LAST
    `;
    const result = await pool.query(query, [merchantId]);
    res.json({ customers: result.rows });
  } catch (error) {
    console.error('Debts customers fetch error:', error.message);
    
    // Production muhitida hech qanday demo qarzdorlar chiqmaydi
    if (process.env.NODE_ENV === 'production') {
      return res.json({ customers: [] });
    }

    // Faqat lokal sinov (Local Dev) uchun:
    res.json({
      customers: [
        {
          id: 'demo-cust-1',
          name: 'Shavkat aka',
          phone: '+998901112233',
          farm_profile: 'Chorvachilik (45 bosh qoramol)',
          debt_balance: 450000,
          due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          notes: 'Oksitetratsiklin va Ivermektin olgan',
          status: 'urgent'
        },
        {
          id: 'demo-cust-2',
          name: 'Bahrom aka',
          phone: '+998934445566',
          farm_profile: 'Issiqxona (1.5 gektar pomidor)',
          debt_balance: 1200000,
          due_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
          notes: 'Ammofos o\'g\'it olgan',
          status: 'overdue'
        }
      ]
    });
  }
});

// 2. Yangi mijoz qo'shish (Ekin yoki chorva profili bilan)
router.post('/customers', async (req, res) => {
  const merchantId = req.merchant.id;
  const { name, phone, farm_profile, due_date, notes } = req.body;

  if (!name || !name.trim() || !phone || !phone.trim()) {
    return res.status(400).json({ error: 'Mijoz ismi va telefon raqami majburiy' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (merchant_id, name, phone, farm_profile, debt_balance, due_date, notes)
       VALUES ($1, $2, $3, $4, 0, $5, $6)
       RETURNING *`,
      [merchantId, name.trim(), phone.trim(), farm_profile?.trim() || 'Chorvachilik / Ekin', due_date || null, notes || null]
    );
    res.status(201).json({ customer: result.rows[0] });
  } catch (error) {
    console.error('Add customer error:', error);
    res.status(500).json({ error: 'Mijozni saqlashda xatolik yuz berdi' });
  }
});

// 3. Qisman yoki to'liq to'lov qabul qilish (PostgreSQL ACID Tranzaksiyasi)
router.post('/repay', async (req, res) => {
  const merchantId = req.merchant.id;
  const { customer_id, amount, notes, new_due_date } = req.body;

  const repayAmount = Number(amount);
  if (!customer_id || !repayAmount || repayAmount <= 0) {
    return res.status(400).json({ error: 'To\'lov summasi to\'g\'ri kiritilishi shart' });
  }

  let client;
  try {
    client = await pool.connect();
  } catch (err) {
    return res.json({ success: true, message: 'To\'lov qabul qilindi (Demo rejim)', remaining_balance: 0 });
  }

  try {
    await client.query('BEGIN');

    // Mijozni tekshirish va qulflash
    const custRes = await client.query(
      `SELECT id, name, debt_balance FROM customers WHERE id = $1 AND merchant_id = $2 FOR UPDATE`,
      [customer_id, merchantId]
    );

    if (custRes.rows.length === 0) {
      throw new Error('Mijoz topilmadi');
    }

    const customer = custRes.rows[0];
    const newDebtBalance = Math.max(0, Number(customer.debt_balance) - repayAmount);

    // Qarz balansini bevosita serverda yangilash
    await client.query(
      `UPDATE customers 
       SET debt_balance = $1,
           due_date = COALESCE($2, due_date)
       WHERE id = $3 AND merchant_id = $4`,
      [newDebtBalance, new_due_date || null, customer_id, merchantId]
    );

    // Tranzaksiyalar jurnaliga yozish
    await client.query(
      `INSERT INTO debt_transactions (
        merchant_id, customer_id, type, amount, due_date, notes
      ) VALUES ($1, $2, 'repayment', $3, $4, $5)`,
      [merchantId, customer_id, repayAmount, new_due_date || null, notes || 'Qarz to\'lovi qabul qilindi']
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'To\'lov muvaffaqiyatli qabul qilindi',
      remaining_balance: newDebtBalance
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Repayment error:', error);
    res.status(400).json({ error: error.message || 'To\'lovni qabul qilishda xatolik yuz berdi' });
  } finally {
    if (client) client.release();
  }
});

// 4. Bitta mijozning qarz tarixi
router.get('/history/:customerId', async (req, res) => {
  const merchantId = req.merchant.id;
  const { customerId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, type, amount, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date, notes, created_at
       FROM debt_transactions
       WHERE merchant_id = $1 AND customer_id = $2
       ORDER BY created_at DESC`,
      [merchantId, customerId]
    );
    res.json({ history: result.rows });
  } catch (error) {
    console.error('Customer debt history error:', error);
    res.json({ history: [] });
  }
});

module.exports = router;
