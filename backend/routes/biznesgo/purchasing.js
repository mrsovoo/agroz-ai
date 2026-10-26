// BiznesGO B2B Core: Purchasing & Supplier Core
// Yetkazib beruvchilar, Xarid buyurtmalari (Purchase Orders) va Procure-to-pay jarayoni

const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// 1. Supplierlar (Yetkazib beruvchilar) ro'yxati
router.get('/suppliers', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT * FROM suppliers WHERE tenant_id = $1 ORDER BY name ASC`,
      [tenantId]
    );
    res.json({ suppliers: result.rows });
  } catch (err) {
    console.error('Suppliers fetch error:', err.message);
    res.json({ suppliers: [] });
  }
});

// 2. Yangi Supplier qo'shish
router.post('/suppliers', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { name, contact_person, phone, email, inn, address, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Yetkazib beruvchi nomi va telefoni majburiy' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO suppliers (tenant_id, name, contact_person, phone, email, inn, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [tenantId, name.trim(), contact_person || null, phone.trim(), email || null, inn || null, address || null, notes || null]
    );
    res.status(201).json({ supplier: result.rows[0] });
  } catch (err) {
    console.error('Supplier create error:', err.message);
    res.status(500).json({ error: 'Yetkazib beruvchini saqlashda xatolik yuz berdi' });
  }
});

// 3. Xaridlar ro'yxati (Purchases history)
router.get('/orders', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT 
        p.*,
        s.name as supplier_name,
        s.phone as supplier_phone
       FROM purchases p
       JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.tenant_id = $1
       ORDER BY p.created_at DESC`,
      [tenantId]
    );
    res.json({ purchases: result.rows });
  } catch (err) {
    console.error('Purchases fetch error:', err.message);
    res.json({ purchases: [] });
  }
});

// 4. Yangi Xarid buyurtmasi va Kirimni amalga oshirish (Procure-to-pay)
router.post('/orders', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const {
    supplier_id,
    warehouse_id,
    order_number,
    invoice_number,
    items, // [{ product_id, quantity, unit_price, batch_number, expiry_date }]
    paid_amount = 0,
    notes
  } = req.body;

  if (!supplier_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Supplier va xarid qilinayotgan tovarlar kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
    });

    const numPaid = Number(paid_amount) || 0;
    const debtAmount = Math.max(0, totalAmount - numPaid);
    const orderNo = order_number || `PO-${Date.now().toString().slice(-6)}`;

    // 1. Purchases jadvaliga yozish
    const purchaseRes = await client.query(
      `INSERT INTO purchases (
        tenant_id, warehouse_id, supplier_id, order_number, invoice_number,
        total_amount, paid_amount, debt_amount, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'received', $9)
      RETURNING id, order_number`,
      [tenantId, warehouse_id || null, supplier_id, orderNo, invoice_number || null, totalAmount, numPaid, debtAmount, notes || null]
    );
    const purchaseId = purchaseRes.rows[0].id;

    // 2. Har bir tovar uchun qoldiqni oshirish va purchase_items ga yozish
    for (const item of items) {
      const itemQty = Number(item.quantity);
      const itemPrice = Number(item.unit_price);
      const itemTotal = itemQty * itemPrice;

      await client.query(
        `INSERT INTO purchase_items (
          purchase_id, product_id, batch_number, expiry_date, quantity, unit_price, total_amount, received_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [purchaseId, item.product_id, item.batch_number || null, item.expiry_date || null, itemQty, itemPrice, itemTotal, itemQty]
      );

      // Ombor qoldig'ini oshirish
      await client.query(
        `UPDATE products 
         SET stock = stock + $1, cost_price = $2, is_out_of_stock = FALSE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND (tenant_id = $4 OR merchant_id = $4)`,
        [itemQty, itemPrice, item.product_id, tenantId]
      );

      // Partiya saqlash
      if (item.batch_number) {
        await client.query(
          `INSERT INTO stock_batches (
            tenant_id, warehouse_id, product_id, batch_number, expiry_date, quantity, cost_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tenantId, warehouse_id || null, item.product_id, item.batch_number, item.expiry_date || null, itemQty, itemPrice]
        );
      }

      // Ombor harakati
      await client.query(
        `INSERT INTO inventory_movements (
          tenant_id, warehouse_id, product_id, movement_type, document_no, quantity, unit_cost, reference_type, reference_id
        ) VALUES ($1, $2, $3, 'receipt', $4, $5, $6, 'purchase', $7)`,
        [tenantId, warehouse_id || null, item.product_id, orderNo, itemQty, itemPrice, purchaseId]
      );
    }

    // 3. Agar to'liq to'lanmagan bo'lsa, supplier qarz balansini oshirish
    if (debtAmount > 0) {
      await client.query(
        `UPDATE suppliers SET debt_balance = debt_balance + $1 WHERE id = $2`,
        [debtAmount, supplier_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Xarid buyurtmasi muvaffaqiyatli qabul qilindi va ombor qoldig\'i oshirildi',
      order_number: orderNo,
      total_amount: totalAmount,
      debt_amount: debtAmount
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Purchase order error:', err.message);
    res.status(500).json({ error: 'Xaridni saqlashda xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

// 5. Supplierga qarz to'lash
router.post('/payments', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { supplier_id, purchase_id, amount, payment_method = 'cash', notes } = req.body;

  const numAmount = Number(amount);
  if (!supplier_id || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Yetkazib beruvchi va to\'lov summasi kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO purchase_payments (tenant_id, purchase_id, supplier_id, amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, purchase_id || null, supplier_id, numAmount, payment_method, notes || null]
    );

    await client.query(
      `UPDATE suppliers SET debt_balance = GREATEST(0, debt_balance - $1) WHERE id = $2`,
      [numAmount, supplier_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Yetkazib beruvchiga to\'lov muvaffaqiyatli qabul qilindi' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Supplier payment error:', err.message);
    res.status(500).json({ error: 'To\'lovni yozishda xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

module.exports = router;

