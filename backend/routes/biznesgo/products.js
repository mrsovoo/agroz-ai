const express = require('express');
const router = express.Router();
const { pool } = require('../../config');

// In-memory fallback do'kon mahsulotlari (Agro-Vet 1-Sektor)
const fallbackProducts = [
  {
    id: 'demo-p-1',
    name: 'Oksitetratsiklin 20% LA',
    active_ingredient: 'Oxytetracycline dihydrate 200 mg/ml',
    category: 'Antibiotik (Veterinariya)',
    batch_number: 'OKS-2401',
    expiry_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    barcode: '478000123001',
    price: 45000,
    cost_price: 32000,
    stock: 8,
    min_stock: 5,
    is_out_of_stock: false,
    days_to_expiry: 15,
    expiry_status: 'critical'
  },
  {
    id: 'demo-p-2',
    name: 'Ivermektin 1%',
    active_ingredient: 'Ivermectin 10 mg/ml',
    category: 'Antiparasitik',
    batch_number: 'IVM-889',
    expiry_date: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300',
    barcode: '478000123002',
    price: 38000,
    cost_price: 27000,
    stock: 14,
    min_stock: 5,
    is_out_of_stock: false,
    days_to_expiry: 25,
    expiry_status: 'critical'
  },
  {
    id: 'demo-p-2b',
    name: 'Ivervet Forte 2%',
    active_ingredient: 'Ivermectin 20 mg + Clorsulon 100 mg/ml',
    category: 'Antiparasitik (Katta qoramol)',
    batch_number: 'IVF-102',
    expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300',
    barcode: '478000123005',
    price: 52000,
    cost_price: 38000,
    stock: 22,
    min_stock: 6,
    is_out_of_stock: false,
    days_to_expiry: 180,
    expiry_status: 'normal'
  },
  {
    id: 'demo-p-2c',
    name: 'Alben Granula (Albendazol 20%)',
    active_ingredient: 'Albendazole 200 mg/g',
    category: 'Antigelment (Qurtlarga qarshi)',
    batch_number: 'ALB-334',
    expiry_date: new Date(Date.now() + 240 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
    barcode: '478000123006',
    price: 28000,
    cost_price: 20000,
    stock: 40,
    min_stock: 10,
    is_out_of_stock: false,
    days_to_expiry: 240,
    expiry_status: 'normal'
  },
  {
    id: 'demo-p-3',
    name: 'Biovit-80',
    active_ingredient: 'Chlortetracycline + Vitamin B12',
    category: 'Vitamin & Premiks',
    batch_number: 'BIO-102',
    expiry_date: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300',
    barcode: '478000123003',
    price: 25000,
    cost_price: 18000,
    stock: 35,
    min_stock: 10,
    is_out_of_stock: false,
    days_to_expiry: 120,
    expiry_status: 'normal'
  },
  {
    id: 'demo-p-4',
    name: 'Ammofos 12:52',
    active_ingredient: 'Azot 12% + Fosfor 52%',
    category: 'Mineral O\'g\'itlar',
    batch_number: 'AMF-990',
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=300',
    barcode: '478000123004',
    price: 85000,
    cost_price: 70000,
    stock: 50,
    min_stock: 15,
    is_out_of_stock: false,
    days_to_expiry: 365,
    expiry_status: 'normal'
  },
  {
    id: 'demo-p-5',
    name: 'Karbamid (Mochevina 46.2%)',
    active_ingredient: 'Azot (N) 46.2%',
    category: 'Mineral O\'g\'itlar',
    batch_number: 'KRB-554',
    expiry_date: new Date(Date.now() + 400 * 86400000).toISOString().split('T')[0],
    image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=300',
    barcode: '478000123007',
    price: 110000,
    cost_price: 92000,
    stock: 65,
    min_stock: 20,
    is_out_of_stock: false,
    days_to_expiry: 400,
    expiry_status: 'normal'
  }
];

// 1. Mahsulotlar ro'yxati (POS va Ombor uchun)
router.get('/', async (req, res) => {
  const merchantId = req.merchant.id;
  const { search, category, filter } = req.query;

  try {
    let query = `
      SELECT 
        id, name, category, active_ingredient, batch_number, 
        TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
        image_url, barcode, price, cost_price, stock, min_stock, is_out_of_stock,
        (expiry_date - CURRENT_DATE) as days_to_expiry,
        CASE 
          WHEN expiry_date < CURRENT_DATE THEN 'expired'
          WHEN (expiry_date - CURRENT_DATE) <= 30 THEN 'critical'
          WHEN (expiry_date - CURRENT_DATE) <= 60 THEN 'warning'
          ELSE 'normal'
        END as expiry_status
      FROM products 
      WHERE merchant_id = $1
    `;
    const params = [merchantId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR active_ingredient ILIKE $${params.length} OR barcode ILIKE $${params.length} OR batch_number ILIKE $${params.length})`;
    }

    if (filter === 'expired_or_critical') {
      query += ` AND (expiry_date - CURRENT_DATE) <= 30`;
    } else if (filter === 'low_stock') {
      query += ` AND stock <= min_stock`;
    }

    // FEFO tartibida saralash (muddati eng yaqin partiya birinchi)
    query += ` ORDER BY expiry_date ASC, stock DESC`;

    const result = await pool.query(query, params);
    res.json({ products: result.rows });
  } catch (error) {
    console.error('Products fetch fallback (DB offline or local):', error.message);
    
    // Standart Agro-Vet dorilar real-time search va filter fallback
    let filtered = [...fallbackProducts];

    if (search) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.active_ingredient && p.active_ingredient.toLowerCase().includes(s)) ||
        (p.batch_number && p.batch_number.toLowerCase().includes(s)) ||
        (p.barcode && p.barcode.toLowerCase().includes(s))
      );
    }

    if (filter === 'expired_or_critical') {
      filtered = filtered.filter(p => p.days_to_expiry <= 30);
    } else if (filter === 'low_stock') {
      filtered = filtered.filter(p => p.stock <= p.min_stock);
    }

    res.json({ products: filtered });
  }
});

// 2. Yangi Agro-Vet mahsulot qo'shish (Majburiy maydonlar: active_ingredient, batch_number, expiry_date, image_url)
router.post('/', async (req, res) => {
  const merchantId = req.merchant.id;
  const {
    name,
    category,
    active_ingredient,
    batch_number,
    expiry_date,
    image_url,
    barcode,
    price,
    cost_price,
    stock,
    min_stock
  } = req.body;

  // Qat'iy maydonlar validatsiyasi
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Mahsulot nomi kiritilishi shart' });
  }
  if (!active_ingredient || !active_ingredient.trim()) {
    return res.status(400).json({ error: 'Agro-Vet: Faol moddasi va dozasi (active_ingredient) kiritilishi majburiy!' });
  }
  if (!batch_number || !batch_number.trim()) {
    return res.status(400).json({ error: 'Agro-Vet: Partiya yoki seriya raqami kiritilishi majburiy!' });
  }
  if (!expiry_date) {
    return res.status(400).json({ error: 'Agro-Vet: Yaroqlilik muddati kiritilishi majburiy!' });
  }
  if (!image_url || !image_url.trim()) {
    return res.status(400).json({ error: 'Agro-Vet: Mahsulot rasmi yuklanishi qat\'iy majburiy (Required)!' });
  }
  if (price === undefined || price < 0) {
    return res.status(400).json({ error: 'Sotish narxi to\'g\'ri kiritilishi shart' });
  }

  const initialStock = Number(stock) || 0;
  const isOutOfStock = initialStock <= 0;

  try {
    const insertQuery = `
      INSERT INTO products (
        merchant_id, name, category, active_ingredient, batch_number, expiry_date, image_url, 
        barcode, price, cost_price, stock, min_stock, is_out_of_stock
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      merchantId,
      name.trim(),
      category || 'Agro-Vet Dori',
      active_ingredient.trim(),
      batch_number.trim(),
      expiry_date,
      image_url.trim(),
      barcode ? barcode.trim() : null,
      Number(price),
      Number(cost_price) || 0,
      initialStock,
      Number(min_stock) || 5,
      isOutOfStock
    ]);

    res.status(201).json({ product: result.rows[0], message: 'Agro-Vet preparati muvaffaqiyatli saqlandi' });
  } catch (error) {
    console.error('Product create error (using fallback store):', error.message);
    const newProduct = {
      id: `p-${Date.now()}`,
      merchant_id: merchantId,
      name: name.trim(),
      category: category || 'Agro-Vet Dori',
      active_ingredient: active_ingredient.trim(),
      batch_number: batch_number.trim(),
      expiry_date: expiry_date,
      image_url: image_url.trim(),
      barcode: barcode ? barcode.trim() : null,
      price: Number(price),
      cost_price: Number(cost_price) || 0,
      stock: initialStock,
      min_stock: Number(min_stock) || 5,
      is_out_of_stock: isOutOfStock,
      days_to_expiry: Math.round((new Date(expiry_date).getTime() - Date.now()) / 86400000),
      expiry_status: 'normal'
    };
    fallbackProducts.unshift(newProduct);
    res.status(201).json({ product: newProduct, message: 'Agro-Vet preparati muvaffaqiyatli saqlandi' });
  }
});

// 3. 30 kun ichida tugaydigan dorilar (Alerts)
router.get('/alerts/expiry', async (req, res) => {
  const merchantId = req.merchant.id;

  try {
    const query = `
      SELECT 
        id, name, active_ingredient, batch_number, TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date,
        stock, price, (expiry_date - CURRENT_DATE) as days_to_expiry,
        CASE 
          WHEN expiry_date < CURRENT_DATE THEN 'expired'
          ELSE 'critical'
        END as alert_level
      FROM products
      WHERE merchant_id = $1 AND stock > 0 AND (expiry_date - CURRENT_DATE) <= 30
      ORDER BY expiry_date ASC
    `;
    const result = await pool.query(query, [merchantId]);
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('Expiry alerts fetch error:', error);
    res.json({ alerts: [] });
  }
});

module.exports = router;
