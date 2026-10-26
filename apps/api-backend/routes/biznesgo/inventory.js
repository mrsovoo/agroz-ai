// BiznesGO B2B Core: Inventory & Warehouse Core (Agro-Vet Pilot)
// Partiyalar (Batches), FEFO, Kirim (Goods receipt), Recall (Karantin) va Utilizatsiya (Yo'q qilish)

const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// 1. Omborlar ro'yxati
router.get('/warehouses', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  try {
    const result = await pool.query(
      `SELECT * FROM warehouses WHERE tenant_id = $1 ORDER BY is_active DESC, name ASC`,
      [tenantId]
    );
    res.json({ warehouses: result.rows });
  } catch (err) {
    console.error('Warehouses fetch error:', err.message);
    res.json({ warehouses: [] });
  }
});

// 2. Partiyalar ro'yxati va Muddat monitoringi (90/60/30/7 kun va muddati o'tganlar)
router.get('/batches', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { filter, product_id } = req.query;

  try {
    let query = `
      SELECT 
        b.id, b.product_id, p.name as product_name, p.dosage_form, p.active_ingredient,
        b.batch_number,
        TO_CHAR(b.production_date, 'YYYY-MM-DD') as production_date,
        TO_CHAR(b.expiry_date, 'YYYY-MM-DD') as expiry_date,
        b.quantity, b.cost_price, (b.quantity * b.cost_price) as total_batch_cost,
        b.is_recalled, b.recall_reason, TO_CHAR(b.recalled_at, 'YYYY-MM-DD HH24:MI') as recalled_at,
        (b.expiry_date - CURRENT_DATE) as days_to_expiry,
        CASE 
          WHEN b.is_recalled THEN 'recalled'
          WHEN b.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN (b.expiry_date - CURRENT_DATE) <= 7 THEN 'critical_7'
          WHEN (b.expiry_date - CURRENT_DATE) <= 30 THEN 'critical_30'
          WHEN (b.expiry_date - CURRENT_DATE) <= 60 THEN 'warning_60'
          WHEN (b.expiry_date - CURRENT_DATE) <= 90 THEN 'warning_90'
          ELSE 'normal'
        END as expiry_stage
      FROM stock_batches b
      JOIN products p ON b.product_id = p.id
      WHERE b.tenant_id = $1 AND b.quantity > 0
    `;
    const params = [tenantId];

    if (product_id) {
      params.push(product_id);
      query += ` AND b.product_id = $${params.length}`;
    }

    if (filter === 'expired') {
      query += ` AND b.expiry_date < CURRENT_DATE`;
    } else if (filter === 'critical_7') {
      query += ` AND b.expiry_date >= CURRENT_DATE AND (b.expiry_date - CURRENT_DATE) <= 7`;
    } else if (filter === 'critical_30') {
      query += ` AND b.expiry_date >= CURRENT_DATE AND (b.expiry_date - CURRENT_DATE) <= 30`;
    } else if (filter === 'recalled') {
      query += ` AND b.is_recalled = TRUE`;
    }

    // FEFO: Muddati eng yaqin partiya birinchi keladi
    query += ` ORDER BY b.expiry_date ASC, b.quantity DESC`;

    const result = await pool.query(query, params);
    res.json({ batches: result.rows });
  } catch (err) {
    console.error('Batches monitoring fetch error:', err.message);
    res.json({ batches: [] });
  }
});

// 3. Kirim Qilish (Kirimda partiya raqami, ishlab chiqarilgan sana, expiry va miqdor majburiy)
router.post('/receipt', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const {
    warehouse_id,
    product_id,
    supplier_id,
    quantity,
    unit_cost,
    batch_number,
    production_date,
    expiry_date,
    document_no,
    notes
  } = req.body;

  // Qat'iy maydonlar validatsiyasi
  if (!product_id) {
    return res.status(400).json({ error: 'Mahsulot tanlanishi shart' });
  }

  const numQty = Number(quantity);
  if (isNaN(numQty) || numQty <= 0) {
    return res.status(400).json({ error: 'Kirim miqdori 0 dan katta bo\'lishi shart' });
  }

  const numCost = Number(unit_cost);
  if (isNaN(numCost) || numCost < 0) {
    return res.status(400).json({ error: 'Xarid tannarxi to\'g\'ri kiritilishi shart' });
  }

  if (!batch_number || !batch_number.trim()) {
    return res.status(400).json({ error: 'Kirim qoidasi: Partiya raqami (batch_number) kiritilishi majburiy!' });
  }

  if (!production_date) {
    return res.status(400).json({ error: 'Kirim qoidasi: Ishlab chiqarilgan sana (production_date) kiritilishi majburiy!' });
  }

  if (!expiry_date) {
    return res.status(400).json({ error: 'Kirim qoidasi: Yaroqlilik muddati (expiry_date) kiritilishi majburiy!' });
  }

  // Yaroqlilik muddatini tekshirish
  const expiryObj = new Date(expiry_date);
  const prodObj = new Date(production_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (expiryObj <= prodObj) {
    return res.status(400).json({ error: 'Xatolik: Yaroqlilik muddati ishlab chiqarilgan sanadan keyin bo\'lishi shart!' });
  }

  if (expiryObj < today) {
    return res.status(400).json({ 
      error: 'Xavfsizlik qoidasi: Muddati o\'tgan preparatni dorixonaga kirim qilib bo\'lmaydi!' 
    });
  }

  const docNo = document_no || `KIRIM-${Date.now().toString().slice(-6)}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Mahsulot qoldig'ini va tannarxini yangilash
    await client.query(
      `UPDATE products 
       SET stock = stock + $1, 
           cost_price = $2,
           is_out_of_stock = FALSE, 
           batch_number = COALESCE($3, batch_number),
           expiry_date = COALESCE($4, expiry_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND (tenant_id = $6 OR merchant_id = $6)`,
      [numQty, numCost, batch_number.trim(), expiry_date, product_id, tenantId]
    );

    // 2. Partiyani stock_batches ga qo'shish yoki mavjud partiyani to'ldirish
    const batchRes = await client.query(
      `INSERT INTO stock_batches (
        tenant_id, warehouse_id, product_id, batch_number, production_date, expiry_date, quantity, cost_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [tenantId, warehouse_id || null, product_id, batch_number.trim(), production_date, expiry_date, numQty, numCost]
    );
    const batchId = batchRes.rows[0]?.id;

    // 3. Ombor harakati (Kirim hujjati)
    await client.query(
      `INSERT INTO inventory_movements (
        tenant_id, warehouse_id, product_id, batch_id, movement_type, 
        document_no, quantity, unit_cost, notes
      ) VALUES ($1, $2, $3, $4, 'receipt', $5, $6, $7, $8)`,
      [tenantId, warehouse_id || null, product_id, batchId, docNo, numQty, numCost, notes || `Supplierdan qabul qilindi`]
    );

    // 4. Audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'inventory.receipt', 'product', $2, $3)`,
      [tenantId, product_id, JSON.stringify({ batch_number, quantity: numQty, unit_cost: numCost, expiry_date })]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Partiya muvaffaqiyatli qabul qilindi va ombor qoldig\'i yangilandi',
      document_no: docNo,
      batch_id: batchId,
      added_quantity: numQty
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Receipt error:', err.message);
    res.status(500).json({ error: 'Kirimni qabul qilishda xatolik yuz berdi: ' + err.message });
  } finally {
    client.release();
  }
});

// 4. Recall & Karantin (Partiya bo'yicha qidirish, karantinga olish va sotilgan xaridorlarni aniqlash)
router.post('/recall', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { batch_number, batch_id, recall_reason } = req.body;

  if (!batch_number && !batch_id) {
    return res.status(400).json({ error: 'Partiya raqami yoki ID kiritilishi shart' });
  }
  if (!recall_reason || !recall_reason.trim()) {
    return res.status(400).json({ error: 'Qaytarib olish (Recall) sababi kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Partiyani topish va karantinga olish
    let batchQuery = `
      SELECT b.*, p.name as product_name
      FROM stock_batches b
      JOIN products p ON b.product_id = p.id
      WHERE b.tenant_id = $1
    `;
    const params = [tenantId];
    if (batch_id) {
      params.push(batch_id);
      batchQuery += ` AND b.id = $${params.length}`;
    } else {
      params.push(batch_number.trim());
      batchQuery += ` AND b.batch_number = $${params.length}`;
    }

    const batchRes = await client.query(batchQuery, params);
    if (batchRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Partiya topilmadi' });
    }

    const targetBatch = batchRes.rows[0];

    // Partiyani karantinga o'tkazish
    await client.query(
      `UPDATE stock_batches SET 
        is_recalled = TRUE, 
        recall_reason = $1,
        recalled_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [recall_reason.trim(), targetBatch.id]
    );

    // 2. Ushbu partiyadan dori sotib olgan barcha xaridorlarni va cheklarni aniqlash
    const salesRes = await client.query(
      `SELECT 
        s.receipt_number,
        TO_CHAR(s.created_at, 'YYYY-MM-DD HH24:MI') as sale_date,
        si.quantity as sold_quantity,
        si.price as sold_price,
        c.name as customer_name,
        c.phone as customer_phone,
        c.farm_profile
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.id
       LEFT JOIN customers c ON s.customer_id = c.id
       WHERE si.batch_number = $1 AND (s.tenant_id = $2 OR s.merchant_id = $2)
       ORDER BY s.created_at DESC`,
      [targetBatch.batch_number, tenantId]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'inventory.recall', 'stock_batches', $2, $3)`,
      [tenantId, targetBatch.id, JSON.stringify({ batch_number: targetBatch.batch_number, reason: recall_reason })]
    );

    await client.query('COMMIT');

    res.json({
      message: `Partiya karantinga olindi! Ushbu partiyadan ${salesRes.rows.length} ta sotuv amalga oshirilgan.`,
      batch: {
        id: targetBatch.id,
        batch_number: targetBatch.batch_number,
        product_name: targetBatch.product_name,
        quarantine_stock: targetBatch.quantity,
        recall_reason
      },
      affected_sales_count: salesRes.rows.length,
      affected_customers: salesRes.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Recall error:', err.message);
    res.status(500).json({ error: 'Recall jarayonida xatolik yuz berdi: ' + err.message });
  } finally {
    client.release();
  }
});

// 5. Utilizatsiya (Muddati o'tgan yoki yaroqsiz dorilarni rasmiy dalolatnoma bilan yo'q qilish)
router.post('/dispose', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const {
    product_id,
    batch_number,
    quantity,
    reason = 'muddati_otgan', // 'muddati_otgan', 'yaroqsiz', 'shikastlangan', 'recall_utilizatsiya'
    disposal_method = 'Komissiya nazoratida yoqish / zararsizlantirish',
    protocol_number,
    notes
  } = req.body;

  const numQty = Number(quantity);
  if (!product_id || isNaN(numQty) || numQty <= 0) {
    return res.status(400).json({ error: 'Mahsulot va yo\'q qilinadigan miqdor kiritilishi shart' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Mahsulotni tekshirish
    const prodRes = await client.query(
      `SELECT id, name, stock, cost_price FROM products WHERE id = $1 AND (tenant_id = $2 OR merchant_id = $2) FOR UPDATE`,
      [product_id, tenantId]
    );
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mahsulot topilmadi' });
    }

    const prod = prodRes.rows[0];
    const currentStock = Number(prod.stock);
    if (currentStock < numQty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Omborda yetarli qoldiq mavjud emas (Mavjud: ${currentStock})` });
    }

    const lossValue = numQty * Number(prod.cost_price || 0);
    const protocolNo = protocol_number || `DALOLATNOMA-${Date.now().toString().slice(-6)}`;

    // 1. products.stock kamaytirish
    await client.query(
      `UPDATE products 
       SET stock = stock - $1, 
           is_out_of_stock = CASE WHEN (stock - $1) <= 0 THEN TRUE ELSE FALSE END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [numQty, product_id]
    );

    // 2. Partiyani (stock_batches) kamaytirish
    let batchId = null;
    if (batch_number) {
      const bRes = await client.query(
        `SELECT id, quantity FROM stock_batches WHERE product_id = $1 AND batch_number = $2 AND tenant_id = $3 LIMIT 1 FOR UPDATE`,
        [product_id, batch_number.trim(), tenantId]
      );
      if (bRes.rows.length > 0) {
        batchId = bRes.rows[0].id;
        await client.query(
          `UPDATE stock_batches SET quantity = GREATEST(0, quantity - $1) WHERE id = $2`,
          [numQty, batchId]
        );
      }
    }

    // 3. inventory_movements jadvaliga utilizatsiya hujjati yozish
    await client.query(
      `INSERT INTO inventory_movements (
        tenant_id, product_id, batch_id, movement_type, document_no, quantity, unit_cost, 
        disposal_method, protocol_number, notes
      ) VALUES ($1, $2, $3, 'loss_writeoff', $4, $5, $6, $7, $8, $9)`,
      [
        tenantId,
        product_id,
        batchId,
        protocolNo,
        numQty,
        prod.cost_price || 0,
        disposal_method,
        protocolNo,
        notes || `Utilizatsiya sababi: ${reason}`
      ]
    );

    // 4. Audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'inventory.dispose', 'product', $2, $3)`,
      [tenantId, product_id, JSON.stringify({ protocol_number: protocolNo, quantity: numQty, loss_value: lossValue, reason })]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Preparat muvaffaqiyatli utilizatsiya qilindi va ombor qoldig\'idan chiqarildi',
      protocol_number: protocolNo,
      disposed_quantity: numQty,
      loss_value: lossValue,
      remaining_stock: currentStock - numQty
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Dispose error:', err.message);
    res.status(500).json({ error: 'Utilizatsiya qilishda xatolik yuz berdi: ' + err.message });
  } finally {
    client.release();
  }
});

// 6. Ombor harakatlari tarixi
router.get('/movements', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { movement_type, product_id, limit = 50 } = req.query;

  try {
    let query = `
      SELECT 
        m.*,
        p.name as product_name,
        p.unit as product_unit,
        b.batch_number,
        TO_CHAR(b.expiry_date, 'YYYY-MM-DD') as batch_expiry
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      LEFT JOIN stock_batches b ON m.batch_id = b.id
      WHERE m.tenant_id = $1
    `;
    const params = [tenantId];

    if (movement_type) {
      params.push(movement_type);
      query += ` AND m.movement_type = $${params.length}`;
    }
    if (product_id) {
      params.push(product_id);
      query += ` AND m.product_id = $${params.length}`;
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit) || 50);

    const result = await pool.query(query, params);
    res.json({ movements: result.rows });
  } catch (err) {
    console.error('Movements fetch error:', err.message);
    res.json({ movements: [] });
  }
});

module.exports = router;
