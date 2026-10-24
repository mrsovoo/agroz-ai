const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// Kassa sotuvini amalga oshirish (PostgreSQL ACID Tranzaksiyasi + Avtomatik FEFO + Muddat Blokirovkasi)
router.post('/checkout', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
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
    return res.status(503).json({ error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi. To\'lov amalga oshirilmadi.' });
  }

  try {
    await client.query('BEGIN'); // ACID Tranzaksiya boshlanishi

    const todayStr = new Date().toISOString().split('T')[0];
    let calculatedTotal = 0;
    const validatedItems = [];
    const batchDeductions = [];

    // 1. Har bir mahsulotni qulflash (FOR UPDATE - Race condition va noto'g'ri qoldiqni 100% oldini oladi)
    for (const item of items) {
      const prodRes = await client.query(
        `SELECT id, name, unit, active_ingredient, batch_number, 
                TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date, price, cost_price, stock 
         FROM products 
         WHERE id = $1 AND (tenant_id = $2 OR merchant_id = $2) FOR UPDATE`,
        [item.product_id, tenantId]
      );

      if (prodRes.rows.length === 0) {
        throw new Error(`Mahsulot topilmadi: ${item.product_id}`);
      }

      const product = prodRes.rows[0];
      const requestedQty = Number(item.quantity);

      if (isNaN(requestedQty) || requestedQty <= 0) {
        throw new Error(`"${product.name}" uchun noto'g'ri miqdor ko'rsatilgan`);
      }

      if (Number(product.stock) < requestedQty) {
        throw new Error(`"${product.name}" dan omborda yetarli qoldiq yo'q. Mavjud: ${product.stock}, so'ralgan: ${requestedQty}`);
      }

      // 2. FEFO: Ushbu mahsulotning partiyalarini tekshirish (FOR UPDATE)
      const batchesRes = await client.query(
        `SELECT id, batch_number, TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date, quantity, is_recalled, recall_reason
         FROM stock_batches
         WHERE product_id = $1 AND tenant_id = $2 AND quantity > 0
         ORDER BY expiry_date ASC FOR UPDATE`,
        [product.id, tenantId]
      );

      let allocatedBatchNumber = product.batch_number;
      let allocatedExpiryDate = product.expiry_date;
      let remainingQtyToAllocate = requestedQty;

      if (batchesRes.rows.length > 0) {
        for (const batch of batchesRes.rows) {
          if (remainingQtyToAllocate <= 0) break;

          // Xavfsizlik 1: Qaytarib olingan (Recall) partiyani sotish taqiqlanadi
          if (batch.is_recalled) {
            throw new Error(
              `Karantin qoidasi: "${product.name}" preparatining "${batch.batch_number}" partiyasi karantinga olingan (Sabab: ${batch.recall_reason || 'Recall'})! Kassadan sotish taqiqlanadi.`
            );
          }

          // Xavfsizlik 2: Muddati o'tgan partiya sotilishi QAT'IYAN BLOKLANADI!
          if (batch.expiry_date && batch.expiry_date < todayStr) {
            throw new Error(
              `Dori xavfsizligi qoidasi: "${product.name}" preparatining "${batch.batch_number}" partiyasining yaroqlilik muddati o'tgan (${batch.expiry_date})! Kassadan sotish qat'iyan man etiladi. Iltimos, utilizatsiya qiling.`
            );
          }

          const currentBatchQty = Number(batch.quantity);
          const takeFromThisBatch = Math.min(currentBatchQty, remainingQtyToAllocate);

          batchDeductions.push({
            batchId: batch.id,
            deductQty: takeFromThisBatch
          });

          allocatedBatchNumber = batch.batch_number;
          allocatedExpiryDate = batch.expiry_date;
          remainingQtyToAllocate -= takeFromThisBatch;
        }

        if (remainingQtyToAllocate > 0) {
          throw new Error(`"${product.name}" preparatining yaroqli partiyalarida yetarli qoldiq yo'q.`);
        }
      } else {
        // Asosiy kartochkadagi muddatni tekshirish
        if (product.expiry_date && product.expiry_date < todayStr) {
          throw new Error(
            `Dori xavfsizligi qoidasi: "${product.name}" preparatining yaroqlilik muddati o'tgan (${product.expiry_date})! Sotish taqiqlanadi.`
          );
        }
      }

      const itemTotal = Number(product.price) * requestedQty;
      calculatedTotal += itemTotal;

      validatedItems.push({
        ...product,
        quantity: requestedQty,
        total: itemTotal,
        allocatedBatchNumber,
        allocatedExpiryDate
      });
    }

    // 3. Nasiya (Qarz) tekshiruvi: Mijoz ismi, telefoni, qaytarish muddati va qarz limiti
    const isDebt = payment_type === 'debt' || Number(debt_amount) > 0;
    let finalCustomerId = customer_id;
    let actualDebt = 0;

    if (isDebt) {
      actualDebt = payment_type === 'debt' ? calculatedTotal : Number(debt_amount);

      if (!finalCustomerId) {
        if (!customer_name || !customer_name.trim() || !customer_phone || !customer_phone.trim()) {
          throw new Error('Nasiya savdo qoidasi: Mijoz ismi va telefon raqami kiritilishi majburiy!');
        }
        if (!due_date) {
          throw new Error('Nasiya savdo qoidasi: Qarzni qaytarish muddati (due_date) ko\'rsatilishi shart!');
        }

        const newCustRes = await client.query(
          `INSERT INTO customers (tenant_id, merchant_id, name, phone, customer_type, farm_profile, credit_limit, debt_balance, due_date, notes)
           VALUES ($1, $1, $2, $3, 'fermer', $4, 10000000, $5, $6, $7)
           RETURNING id`,
          [
            tenantId,
            customer_name.trim(),
            customer_phone.trim(),
            farm_profile?.trim() || 'Fermer / Xaridor',
            actualDebt,
            due_date,
            notes || 'Kassadan yangi ochilgan nasiyador'
          ]
        );
        finalCustomerId = newCustRes.rows[0].id;
      } else {
        // Mavjud mijozni tekshirish va qarz limitini nazorat qilish
        const custRes = await client.query(
          `SELECT id, name, debt_balance, credit_limit FROM customers WHERE id = $1 AND (tenant_id = $2 OR merchant_id = $2) FOR UPDATE`,
          [finalCustomerId, tenantId]
        );

        if (custRes.rows.length === 0) {
          throw new Error('Nasiyachi mijoz topilmadi');
        }

        const currentDebt = Number(custRes.rows[0].debt_balance);
        const creditLimit = Number(custRes.rows[0].credit_limit || 10000000);

        if (currentDebt + actualDebt > creditLimit) {
          throw new Error(
            `Qarz limiti nazorati: Ushbu mijozning qarz limiti (${creditLimit.toLocaleString('uz-UZ')} so'm) dan oshib ketmoqda! Joriy qarz: ${currentDebt.toLocaleString('uz-UZ')} so'm.`
          );
        }

        await client.query(
          `UPDATE customers 
           SET debt_balance = debt_balance + $1,
               due_date = COALESCE($2, due_date),
               farm_profile = COALESCE($3, farm_profile)
           WHERE id = $4`,
          [actualDebt, due_date || null, farm_profile || null, finalCustomerId]
        );
      }
    }

    // 4. Chek (Sale) hujjatini yaratish
    const receiptNumber = 'CHK-' + Math.floor(100000 + Math.random() * 900000);
    const saleRes = await client.query(
      `INSERT INTO sales (
        tenant_id, merchant_id, receipt_number, total_amount, payment_type,
        cash_amount, card_amount, debt_amount, customer_id, notes
      ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, receipt_number, created_at`,
      [
        tenantId,
        receiptNumber,
        calculatedTotal,
        payment_type,
        Number(cash_amount) || (payment_type === 'cash' ? calculatedTotal : 0),
        Number(card_amount) || (payment_type === 'card' ? calculatedTotal : 0),
        actualDebt,
        finalCustomerId || null,
        notes || null
      ]
    );
    const saleId = saleRes.rows[0].id;

    // 5. Partiyalardan qoldiqni kamaytirish (FEFO ijrosi)
    for (const bDeduct of batchDeductions) {
      await client.query(
        `UPDATE stock_batches SET quantity = quantity - $1 WHERE id = $2`,
        [bDeduct.deductQty, bDeduct.batchId]
      );
    }

    // 6. Chek tarkibidagi tovarlarni saqlash va mahsulot umumiy qoldig'ini kamaytirish
    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO sale_items (
          sale_id, product_id, product_name, active_ingredient, batch_number, expiry_date, quantity, unit, price, cost_price, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          saleId,
          item.id,
          item.name,
          item.active_ingredient || null,
          item.allocatedBatchNumber || item.batch_number || null,
          item.allocatedExpiryDate || item.expiry_date || null,
          item.quantity,
          item.unit || 'dona',
          item.price,
          item.cost_price || 0,
          item.total
        ]
      );

      await client.query(
        `UPDATE products 
         SET stock = stock - $1,
             is_out_of_stock = CASE WHEN (stock - $1) <= 0 THEN TRUE ELSE FALSE END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [item.quantity, item.id]
      );

      // Ombor harakati
      await client.query(
        `INSERT INTO inventory_movements (
          tenant_id, product_id, movement_type, document_no, quantity, unit_cost, reference_type, reference_id
        ) VALUES ($1, $2, 'issue', $3, $4, $5, 'sale', $6)`,
        [tenantId, item.id, receiptNumber, item.quantity, item.cost_price || 0, saleId]
      );
    }

    // 7. Agar Nasiya bo'lsa, debts va debt_transactions ga yozish
    if (isDebt) {
      await client.query(
        `INSERT INTO debts (
          tenant_id, customer_id, sale_id, initial_amount, remaining_amount, due_date, status, notes
        ) VALUES ($1, $2, $3, $4, $4, $5, 'active', $6)`,
        [tenantId, finalCustomerId, saleId, actualDebt, due_date || null, `Kassa cheki: ${receiptNumber}`]
      );

      await client.query(
        `INSERT INTO debt_transactions (
          merchant_id, customer_id, sale_id, type, amount, due_date, notes
        ) VALUES ($1, $2, $3, 'incurred', $4, $5, $6)`,
        [tenantId, finalCustomerId, saleId, actualDebt, due_date || null, `Kassa cheki: ${receiptNumber}`]
      );
    }

    // 8. Kassa harakatini yozish (Naqd yoki Karta tushumi)
    const paidCashOrCard = Number(cash_amount) || (payment_type === 'cash' ? calculatedTotal : 0);
    if (paidCashOrCard > 0) {
      try {
        const cashAcc = await client.query(`SELECT id FROM cash_accounts WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
        if (cashAcc.rows.length > 0) {
          await client.query(`UPDATE cash_accounts SET balance = balance + $1 WHERE id = $2`, [paidCashOrCard, cashAcc.rows[0].id]);
          await client.query(
            `INSERT INTO cash_transactions (tenant_id, account_id, transaction_type, amount, reference_type, reference_id, category, notes)
             VALUES ($1, $2, 'income', $3, 'sale', $4, 'Kassa savdosi', $5)`,
            [tenantId, cashAcc.rows[0].id, paidCashOrCard, saleId, `Chek: ${receiptNumber}`]
          );
        }
      } catch (_) {}
    }

    await client.query('COMMIT'); // Tranzaksiya muvaffaqiyatli yakunlandi

    res.json({
      success: true,
      sale_id: saleId,
      receipt_number: receiptNumber,
      total_amount: calculatedTotal,
      debt_amount: actualDebt,
      message: 'Sotuv muvaffaqiyatli yakunlandi, FEFO partiyalari va ombor qoldig\'i yangilandi'
    });
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Checkout error:', error.message);
    res.status(400).json({ error: error.message || 'Sotuvni yakunlashda xatolik yuz berdi' });
  } finally {
    if (client) client.release();
  }
});

// So'nggi sotuvlar tarixi
router.get('/history', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as customer_name, c.phone as customer_phone, c.farm_profile
       FROM sales s
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE (s.tenant_id = $1 OR s.merchant_id = $1)
       ORDER BY s.created_at DESC LIMIT 50`,
      [tenantId]
    );
    res.json({ sales: result.rows });
  } catch (err) {
    console.error('Sales history error:', err.message);
    res.json({ sales: [] });
  }
});

module.exports = router;
