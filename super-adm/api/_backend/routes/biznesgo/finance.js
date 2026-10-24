// BiznesGO B2B Core: Cash & Finance Core
// Kassalar, pul harakati (kirim/chiqim), kassir smenalari va kassa farqi

const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// 1. Kassalar ro'yxati va ulardagi qoldiq
router.get('/accounts', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT * FROM cash_accounts WHERE tenant_id = $1 ORDER BY is_active DESC, name ASC`,
      [tenantId]
    );
    res.json({ accounts: result.rows });
  } catch (err) {
    console.error('Cash accounts fetch error:', err.message);
    res.json({ accounts: [] });
  }
});

// 2. Yangi kassa ochish (Asosiy, Kassir 1, Bank)
router.post('/accounts', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { name, account_type = 'cash', initial_balance = 0 } = req.body;

  if (!name) return res.status(400).json({ error: 'Kassa nomi kiritilishi shart' });

  try {
    const result = await pool.query(
      `INSERT INTO cash_accounts (tenant_id, name, account_type, balance)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenantId, name.trim(), account_type, Number(initial_balance) || 0]
    );
    res.status(201).json({ account: result.rows[0] });
  } catch (err) {
    console.error('Account create error:', err.message);
    res.status(500).json({ error: 'Kassani saqlashda xatolik yuz berdi' });
  }
});

// 3. Moliya harakatlari tarixi
router.get('/transactions', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { account_id, transaction_type, limit = 50 } = req.query;

  try {
    let query = `
      SELECT 
        t.*,
        a.name as account_name
      FROM cash_transactions t
      JOIN cash_accounts a ON t.account_id = a.id
      WHERE t.tenant_id = $1
    `;
    const params = [tenantId];

    if (account_id) {
      params.push(account_id);
      query += ` AND t.account_id = $${params.length}`;
    }
    if (transaction_type) {
      params.push(transaction_type);
      query += ` AND t.transaction_type = $${params.length}`;
    }

    query += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit) || 50);

    const result = await pool.query(query, params);
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Transactions fetch error:', err.message);
    res.json({ transactions: [] });
  }
});

// 4. Xarajat kiritish (Chiqim)
router.post('/expense', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { account_id, amount, category, notes } = req.body;

  const numAmount = Number(amount);
  if (!account_id || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Kassa va xarajat summasi to\'g\'ri kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE cash_accounts SET balance = balance - $1 WHERE id = $2 AND tenant_id = $3`,
      [numAmount, account_id, tenantId]
    );

    await client.query(
      `INSERT INTO cash_transactions (
        tenant_id, account_id, transaction_type, amount, category, notes
      ) VALUES ($1, $2, 'expense', $3, $4, $5)`,
      [tenantId, account_id, numAmount, category || 'Operatsion xarajat', notes || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Xarajat muvaffaqiyatli saqlandi' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Expense error:', err.message);
    res.status(500).json({ error: 'Xarajatni yozishda xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

// 5. Kirim kiritish (Daromad)
router.post('/income', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { account_id, amount, category, notes } = req.body;

  const numAmount = Number(amount);
  if (!account_id || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Kassa va kirim summasi to\'g\'ri kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE cash_accounts SET balance = balance + $1 WHERE id = $2 AND tenant_id = $3`,
      [numAmount, account_id, tenantId]
    );

    await client.query(
      `INSERT INTO cash_transactions (
        tenant_id, account_id, transaction_type, amount, category, notes
      ) VALUES ($1, $2, 'income', $3, $4, $5)`,
      [tenantId, account_id, numAmount, category || 'Boshqa kirim', notes || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Kirim muvaffaqiyatli saqlandi' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Income error:', err.message);
    res.status(500).json({ error: 'Kirimni yozishda xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

// 6. Kassir smenasini ochish / yopish
router.get('/shifts/current', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT * FROM shifts WHERE tenant_id = $1 AND status = 'open' ORDER BY opened_at DESC LIMIT 1`,
      [tenantId]
    );
    res.json({ shift: result.rows[0] || null });
  } catch (err) {
    res.json({ shift: null });
  }
});

router.post('/shifts/open', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { opening_cash = 0, notes } = req.body;

  try {
    const openRes = await pool.query(
      `INSERT INTO shifts (tenant_id, opening_cash, status, notes)
       VALUES ($1, $2, 'open', $3)
       RETURNING *`,
      [tenantId, Number(opening_cash) || 0, notes || null]
    );
    res.status(201).json({ shift: openRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Smenani ochishda xatolik yuz berdi' });
  }
});

router.post('/shifts/close', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { shift_id, closing_cash = 0, notes } = req.body;

  try {
    const closeRes = await pool.query(
      `UPDATE shifts SET
        closed_at = CURRENT_TIMESTAMP,
        closing_cash = $1,
        status = 'closed',
        notes = COALESCE($2, notes)
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [Number(closing_cash) || 0, notes || null, shift_id, tenantId]
    );
    res.json({ shift: closeRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Smenani yopishda xatolik yuz berdi' });
  }
});

module.exports = router;

