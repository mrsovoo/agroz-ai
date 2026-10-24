const express = require('express');
const router = express.Router();
const { pool } = require('../../config');
const { getSector, isValidSector } = require('../../core/sectors');

// 0. Sektor bo'yicha toifalar va o'lchov birliklari
router.get('/meta', (req, res) => {
  const sectorType = req.query.sector_type || req.tenant?.sector_type || 'agro_vet';
  const sectorInfo = getSector(sectorType);
  res.json({
    sector: sectorInfo,
    units: sectorInfo.defaultUnits,
    categories: sectorInfo.categories,
    fields: sectorInfo.fields,
    rules: sectorInfo.rules
  });
});

// 1. Mahsulotlar ro'yxati (Agro-Vet dorixona va dori xavfsizligi maydonlari bilan)
router.get('/', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const { search, category, filter, sector_type } = req.query;
  const activeSector = sector_type || req.tenant?.sector_type || 'agro_vet';

  try {
    let query = `
      SELECT 
        id, name, sku, barcode, category, unit, brand,
        active_ingredient, dosage_form, storage_condition, batch_number, 
        TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
        image_url, price, cost_price, stock, min_stock, reorder_level,
        is_out_of_stock, sector_type, sector_attributes,
        CASE 
          WHEN expiry_date IS NOT NULL THEN (expiry_date - CURRENT_DATE)
          ELSE NULL 
        END as days_to_expiry,
        CASE 
          WHEN expiry_date IS NULL THEN 'normal'
          WHEN expiry_date < CURRENT_DATE THEN 'expired'
          WHEN (expiry_date - CURRENT_DATE) <= 7 THEN 'critical_7'
          WHEN (expiry_date - CURRENT_DATE) <= 30 THEN 'critical'
          WHEN (expiry_date - CURRENT_DATE) <= 60 THEN 'warning_60'
          WHEN (expiry_date - CURRENT_DATE) <= 90 THEN 'warning_90'
          ELSE 'normal'
        END as expiry_status
      FROM products 
      WHERE (tenant_id = $1 OR merchant_id = $1)
    `;
    const params = [tenantId];

    if (sector_type) {
      params.push(sector_type);
      query += ` AND sector_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (
        name ILIKE $${params.length} OR 
        barcode ILIKE $${params.length} OR 
        sku ILIKE $${params.length} OR 
        active_ingredient ILIKE $${params.length} OR 
        batch_number ILIKE $${params.length} OR
        brand ILIKE $${params.length}
      )`;
    }

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (filter === 'expired') {
      query += ` AND expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE`;
    } else if (filter === 'critical_7') {
      query += ` AND expiry_date IS NOT NULL AND expiry_date >= CURRENT_DATE AND (expiry_date - CURRENT_DATE) <= 7`;
    } else if (filter === 'expired_or_critical') {
      query += ` AND expiry_date IS NOT NULL AND (expiry_date - CURRENT_DATE) <= 30`;
    } else if (filter === 'warning_60') {
      query += ` AND expiry_date IS NOT NULL AND (expiry_date - CURRENT_DATE) > 30 AND (expiry_date - CURRENT_DATE) <= 60`;
    } else if (filter === 'warning_90') {
      query += ` AND expiry_date IS NOT NULL AND (expiry_date - CURRENT_DATE) > 60 AND (expiry_date - CURRENT_DATE) <= 90`;
    } else if (filter === 'low_stock') {
      query += ` AND stock <= min_stock`;
    }

    // FEFO: Muddati eng yaqin partiyalar birinchi keladi
    query += ` ORDER BY expiry_date ASC NULLS LAST, stock DESC`;

    const result = await pool.query(query, params);
    res.json({ products: result.rows, sector_type: activeSector });
  } catch (error) {
    console.error('Products fetch error:', error.message);
    res.json({ products: [], sector_type: activeSector });
  }
});

// 2. Yangi Mahsulot qo'shish (Dori xavfsizligi qat'iy tekshiriladi)
router.post('/', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const {
    name,
    sku,
    barcode,
    category = 'Antibiotiklar (Vet)',
    brand,
    unit = 'dona',
    image_url,
    price,
    cost_price = 0,
    stock = 0,
    min_stock = 5,
    reorder_level = 10,
    sector_type = 'agro_vet',
    sector_attributes = {},
    // 1-Sektor Dori xavfsizligi majburiy maydonlari:
    active_ingredient,
    dosage_form,
    storage_condition,
    batch_number,
    expiry_date
  } = req.body;

  // 1. Mahsulot nomi majburiy
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Dori / preparat nomi kiritilishi shart' });
  }

  // 2. Narx tekshiruvi
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({ error: 'Sotish narxi 0 dan katta bo\'lishi shart' });
  }

  // 3. 1-Sektor: Dori Xavfsizligi Qat'iy Validatsiyasi
  if (sector_type === 'agro_vet') {
    if (!active_ingredient || !active_ingredient.trim()) {
      return res.status(400).json({ 
        error: 'Dori xavfsizligi qoidasi: Faol moddasi va dozasi (active_ingredient) kiritilishi majburiy!' 
      });
    }
    if (!dosage_form || !dosage_form.trim()) {
      return res.status(400).json({ 
        error: 'Dori xavfsizligi qoidasi: Dori shakli (dosage_form: inyeksiya, granula, premiks, tabletka va h.k.) kiritilishi majburiy!' 
      });
    }
    if (!storage_condition || !storage_condition.trim()) {
      return res.status(400).json({ 
        error: 'Dori xavfsizligi qoidasi: Saqlash sharti (storage_condition: +2°C...+8°C sovutgichda yoki +15°C...+25°C quruq joyda) kiritilishi majburiy!' 
      });
    }
    if (!batch_number || !batch_number.trim()) {
      return res.status(400).json({ 
        error: 'Partiya nazorati qoidasi: Partiya yoki seriya raqami (batch_number) kiritilishi majburiy!' 
      });
    }
    if (!expiry_date) {
      return res.status(400).json({ 
        error: 'FEFO qoidasi: Yaroqlilik muddati (expiry_date) kiritilishi majburiy!' 
      });
    }
    if (!image_url || !image_url.trim()) {
      return res.status(400).json({ 
        error: 'Dori xavfsizligi qoidasi: Mahsulot rasmi yuklanishi shart (noto\'g\'ri dori berilishining oldini olish uchun)!' 
      });
    }
  }

  const numStock = Number(stock) || 0;
  const numCost = Number(cost_price) || 0;
  const numMin = Number(min_stock) || 5;
  const numReorder = Number(reorder_level) || 10;
  const isOutOfStock = numStock <= 0;

  const mergedAttributes = {
    ...sector_attributes,
    active_ingredient: active_ingredient?.trim() || null,
    dosage_form: dosage_form?.trim() || null,
    storage_condition: storage_condition?.trim() || null,
    batch_number: batch_number?.trim() || null,
    expiry_date: expiry_date || null
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO products (
        tenant_id, merchant_id, name, sku, barcode, category, brand, unit,
        active_ingredient, dosage_form, storage_condition, batch_number, expiry_date, image_url,
        price, cost_price, stock, min_stock, reorder_level, is_out_of_stock,
        sector_type, sector_attributes
      ) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *, TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date`,
      [
        tenantId,
        name.trim(),
        sku || null,
        barcode || null,
        category,
        brand || null,
        unit,
        active_ingredient?.trim(),
        dosage_form?.trim(),
        storage_condition?.trim(),
        batch_number?.trim(),
        expiry_date,
        image_url?.trim(),
        numPrice,
        numCost,
        numStock,
        numMin,
        numReorder,
        isOutOfStock,
        sector_type,
        JSON.stringify(mergedAttributes)
      ]
    );

    const createdProduct = result.rows[0];

    // Partiyani stock_batches jadvaliga ham ro'yxatdan o'tkazish
    if (batch_number && numStock > 0) {
      await client.query(
        `INSERT INTO stock_batches (
          tenant_id, product_id, batch_number, production_date, expiry_date, quantity, cost_price
        ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)`,
        [tenantId, createdProduct.id, batch_number.trim(), expiry_date, numStock, numCost]
      );

      // Ombor harakati audit logi
      await client.query(
        `INSERT INTO inventory_movements (
          tenant_id, product_id, movement_type, document_no, quantity, unit_cost, notes
        ) VALUES ($1, $2, 'receipt', $3, $4, $5, 'Dastlabki qoldiq kiritildi')`,
        [tenantId, createdProduct.id, `INIT-${batch_number}`, numStock, numCost]
      );
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (tenant_id, action, entity_type, entity_id, new_values)
       VALUES ($1, 'product.create', 'product', $2, $3)`,
      [tenantId, createdProduct.id, JSON.stringify({ name: createdProduct.name, batch_number, expiry_date, stock: numStock })]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Preparat muvaffaqiyatli saqlandi',
      product: createdProduct
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Product create error:', error.message);
    res.status(500).json({ error: 'Mahsulotni saqlashda xatolik yuz berdi: ' + error.message });
  } finally {
    client.release();
  }
});

// 3. Mahsulotni yangilash
router.put('/:id', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const productId = req.params.id;
  const {
    name,
    price,
    cost_price,
    stock,
    min_stock,
    category,
    unit,
    active_ingredient,
    dosage_form,
    storage_condition,
    batch_number,
    expiry_date
  } = req.body;

  try {
    const existingRes = await pool.query(
      `SELECT * FROM products WHERE id = $1 AND (tenant_id = $2 OR merchant_id = $2)`,
      [productId, tenantId]
    );
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Mahsulot topilmadi' });
    }

    const current = existingRes.rows[0];
    const newStock = stock !== undefined ? Number(stock) : current.stock;
    const isOutOfStock = newStock <= 0;

    const updateRes = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        price = COALESCE($2, price),
        cost_price = COALESCE($3, cost_price),
        stock = COALESCE($4, stock),
        min_stock = COALESCE($5, min_stock),
        category = COALESCE($6, category),
        unit = COALESCE($7, unit),
        active_ingredient = COALESCE($8, active_ingredient),
        dosage_form = COALESCE($9, dosage_form),
        storage_condition = COALESCE($10, storage_condition),
        batch_number = COALESCE($11, batch_number),
        expiry_date = COALESCE($12, expiry_date),
        is_out_of_stock = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND (tenant_id = $15 OR merchant_id = $15)
      RETURNING *, TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date`,
      [
        name,
        price !== undefined ? Number(price) : null,
        cost_price !== undefined ? Number(cost_price) : null,
        newStock,
        min_stock !== undefined ? Number(min_stock) : null,
        category,
        unit,
        active_ingredient,
        dosage_form,
        storage_condition,
        batch_number,
        expiry_date,
        isOutOfStock,
        productId,
        tenantId
      ]
    );

    res.json({
      message: 'Mahsulot muvaffaqiyatli yangilandi',
      product: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Product update error:', error.message);
    res.status(500).json({ error: 'Mahsulotni yangilashda xatolik yuz berdi' });
  }
});

// 4. Mahsulot partiyalari (Multi-batch ko'rish)
router.get('/:id/batches', async (req, res) => {
  const tenantId = req.tenant?.id || req.merchant?.id;
  const productId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT 
        b.id, b.batch_number, 
        TO_CHAR(b.production_date, 'YYYY-MM-DD') as production_date,
        TO_CHAR(b.expiry_date, 'YYYY-MM-DD') as expiry_date,
        b.quantity, b.cost_price, b.is_recalled, b.recall_reason,
        (b.expiry_date - CURRENT_DATE) as days_to_expiry,
        CASE 
          WHEN b.is_recalled THEN 'recalled'
          WHEN b.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN (b.expiry_date - CURRENT_DATE) <= 7 THEN 'critical_7'
          WHEN (b.expiry_date - CURRENT_DATE) <= 30 THEN 'critical'
          ELSE 'valid'
        END as status
      FROM stock_batches b
      WHERE b.product_id = $1 AND b.tenant_id = $2
      ORDER BY b.expiry_date ASC, b.quantity DESC`,
      [productId, tenantId]
    );

    res.json({ batches: result.rows });
  } catch (err) {
    console.error('Batches fetch error:', err.message);
    res.status(500).json({ error: 'Partiyalarni yuklashda xatolik yuz berdi' });
  }
});

module.exports = router;
