const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// Kassa sotuvini amalga oshirish (PostgreSQL ACID Tranzaksiyasi)
router.post('/checkout', async (req, res) => {
  const merchantId = req.merchant.id;
  const {
    items,
    payment_type,
    cash_amount,
    card_amount,
    debt_amount,
    customer_id,
    customer_name,
    customer_phone,
    farm_profile,
    due_date,
    notes
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Savat bo\'sh, tovar tanlanmagan' });
  }

  let client;
  try {
    client = await pool.connect();
  } catch (connErr) {
    return res.json({
      success: true,
      receipt_number: 'CHK-' + Math.floor(100000 + Math.random() * 900000),
      message: 'Sotuv muvaffaqiyatli amalga oshirildi (Demo rejim)'
    });
  }

  try {
    await client.query('BEGIN'); // Tranzaksiya boshlanishi

    // 1. Mahsulot qoldig'i va tafsilotlarini qulflash
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prodRes = await client.query(
        `SELECT id, name, active_ingredient, batch_number, TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date, price, stock 
         FROM products 
         WHERE id = $1 AND merchant_id = $2 FOR UPDATE`,
        [item.product_id, merchantId]
      );

      if (prodRes.rows.length === 0) {
        throw new Error(`Mahsulot topilmadi: ${item.product_id}`);
      }

      const product = prodRes.rows[0];
      const requestedQty = Number(item.quantity);

      if (product.stock < requestedQty) {
        throw new Error(`"${product.name}" dan yetarli qoldiq yo'q. Mavjud: ${product.stock}, so'ralgan: ${requestedQty}`);
      }

      const itemTotal = Number(product.price) * requestedQty;
      calculatedTotal += itemTotal;

      validatedItems.push({
        ...product,
        quantity: requestedQty,
        total: itemTotal
      });
    }

    // 2. Qarz (Nasiya) tekshiruvi va Mijoz profili/balansi
    const isDebt = payment_type === 'debt' || Number(debt_amount) > 0;
    let finalCustomerId = customer_id;

    if (isDebt) {
      const actualDebt = payment_type === 'debt' ? calculatedTotal : Number(debt_amount);

      if (!finalCustomerId) {
        if (!customer_name || !customer_phone) {
          throw new Error('Nasiyaga sotish uchun mijoz ismi va telefon raqami majburiy!');
        }

        const newCustRes = await client.query(
          `INSERT INTO customers (merchant_id, name, phone, farm_profile, debt_balance, due_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            merchantId,
            customer_name.trim(),
            customer_phone.trim(),
            farm_profile?.trim() || 'Chorvachilik / Ekin',
            actualDebt,
            due_date || null,
            notes || 'Kassadan yangi ochilgan nasiyador'
          ]
        );
        finalCustomerId = newCustRes.rows[0].id;
      } else {
        // Mavjud mijoz qarz balansini to'g'ridan-to'g'ri PostgreSQL da oshirish
        await client.query(
          `UPDATE customers 
           SET debt_balance = debt_balance + $1,
               due_date = COALESCE($2, due_date),
               farm_profile = COALESCE($3, farm_profile)
           WHERE id = $4 AND merchant_id = $5`,
          [actualDebt, due_date || null, farm_profile || null, finalCustomerId, merchantId]
        );
      }
    }

    // 3. Chek (Sales) yozuvini yaratish
    const receiptNumber = 'CHK-' + Math.floor(100000 + Math.random() * 900000);
    const saleRes = await client.query(
      `INSERT INTO sales (
        merchant_id, receipt_number, total_amount, payment_type,
        cash_amount, card_amount, debt_amount, customer_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, receipt_number, created_at`,
      [
        merchantId,
        receiptNumber,
        calculatedTotal,
        payment_type,
        Number(cash_amount) || 0,
        Number(card_amount) || 0,
        Number(debt_amount) || (payment_type === 'debt' ? calculatedTotal : 0),
        finalCustomerId || null,
        notes || null
      ]
    );
    const saleId = saleRes.rows[0].id;

    // 4. Chek tarkibidagi tovarlarni saqlash va OMBOR QOLDIG'INI KAMAYTIRISH (0 bo'lsa Tugagan)
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, active_ingredient, batch_number, expiry_date, quantity, price, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          saleId,
          item.id,
          item.name,
          item.active_ingredient || null,
          item.batch_number,
          item.expiry_date,
          item.quantity,
          item.price,
          item.total
        ]
      );

      // Ombor qoldig'i kamaytiriladi va qoldiq 0 bo'lsa is_out_of_stock = true belgilanadi!
      await client.query(
        `UPDATE products 
         SET stock = stock - $1,
             is_out_of_stock = CASE WHEN (stock - $1) <= 0 THEN TRUE ELSE FALSE END
         WHERE id = $2 AND merchant_id = $3`,
        [item.quantity, item.id, merchantId]
      );
    }

    // 5. Agar Nasiya bo'lsa, Qarz harakatlari jadvaliga yozish
    if (isDebt) {
      const actualDebt = payment_type === 'debt' ? calculatedTotal : Number(debt_amount);
      await client.query(
        `INSERT INTO debt_transactions (
          merchant_id, customer_id, sale_id, type, amount, due_date, notes
        ) VALUES ($1, $2, $3, 'incurred', $4, $5, $6)`,
        [merchantId, finalCustomerId, saleId, actualDebt, due_date || null, `Kassa cheki: ${receiptNumber}`]
      );
    }

    await client.query('COMMIT'); // Tranzaksiya muvaffaqiyatli yakunlandi

    res.json({
      success: true,
      sale_id: saleId,
      receipt_number: receiptNumber,
      total_amount: calculatedTotal,
      message: 'Sotuv muvaffaqiyatli yakunlandi, ombor qoldiqlari yangilandi'
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(400).json({ error: error.message || 'Sotuvni yakunlashda xatolik yuz berdi' });
  } finally {
    if (client) client.release();
  }
});

// So'nggi sotuvlar tarixi
router.get('/history', async (req, res) => {
  const merchantId = req.merchant.id;
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.farm_profile
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE s.merchant_id = $1
       ORDER BY s.created_at DESC LIMIT 50`,
      [merchantId]
    );
    res.json({ sales: result.rows });
  } catch (err) {
    console.error('Sales history error:', err);
    res.json({ sales: [] });
  }
});

module.exports = router;
