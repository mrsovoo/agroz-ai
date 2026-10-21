/**
 * Sotuv servisi — POS (POST /sales) va AgrozGO bridge (POST /bridge/orders) uchun umumiy.
 * BARCHA funksiyalar tranzaksiya client'i (`client`) bilan chaqiriladi.
 *
 * Kafolatlar:
 *   - Mahsulot qatorlari `SELECT ... FOR UPDATE` bilan id tartibida bloklanadi
 *     (parallel sotuvlarda manfiy qoldiq va deadlock bo'lmasligi uchun).
 *   - Boshqa merchant mahsuloti → 403; nofaol/yo'q → 404; qoldiq yetmasa → 409.
 *   - payment_type = 'debt' → mijoz (mavjud yoki yangi) + debts yozuvi + customers.total_debt.
 */
const { HttpError } = require('../lib/errors');
const { money } = require('../lib/validate');
const { NOW } = require('../db/pool');

/** Bir xil product_id li qatorlarni birlashtiradi. */
function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(422, "Savatcha bo'sh", 'VALIDATION_ERROR', { field: 'items' });
  }
  if (items.length > 200) throw new HttpError(422, "Bitta sotuvda 200 tadan ortiq qator bo'lmasin");
  const map = new Map();
  for (const [i, it] of items.entries()) {
    const productId = Number(it && it.product_id);
    const qty = Number(it && it.quantity);
    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpError(422, `items[${i}].product_id noto'g'ri`, 'VALIDATION_ERROR', { field: `items[${i}].product_id` });
    }
    if (!Number.isFinite(qty) || qty <= 0 || qty > 1e9) {
      throw new HttpError(422, `items[${i}].quantity 0 dan katta bo'lishi kerak`, 'VALIDATION_ERROR', { field: `items[${i}].quantity` });
    }
    let price = null;
    if (it.unit_price !== undefined && it.unit_price !== null && it.unit_price !== '') {
      price = Number(it.unit_price);
      if (!Number.isFinite(price) || price < 0) {
        throw new HttpError(422, `items[${i}].unit_price noto'g'ri`, 'VALIDATION_ERROR', { field: `items[${i}].unit_price` });
      }
    }
    const prev = map.get(productId);
    if (prev) {
      prev.quantity += qty;
      if (price !== null) prev.unit_price = price;
    } else {
      map.set(productId, { product_id: productId, quantity: qty, unit_price: price });
    }
  }
  return [...map.values()].sort((a, b) => a.product_id - b.product_id);
}

/** Mahsulotlarni bloklaydi, egalik va qoldiqni tekshiradi, narxni aniqlaydi. */
async function lockAndPriceItems(client, merchantId, items) {
  const ids = items.map((i) => i.product_id);
  const { rows } = await client.query(
    `SELECT id, merchant_id, name, price, unit, stock_quantity, is_active, wholesale_price, wholesale_min_qty, warranty_months
       FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE`,
    [ids]
  );
  const byId = new Map(rows.map((r) => [r.id, r]));
  const shortages = [];

  const priced = items.map((it) => {
    const p = byId.get(it.product_id);
    if (!p) throw new HttpError(404, `Mahsulot #${it.product_id} topilmadi`);
    if (p.merchant_id !== merchantId) throw new HttpError(403, "Bu mahsulot boshqa sotuvchiga tegishli", 'FORBIDDEN');
    if (!p.is_active) throw new HttpError(404, `"${p.name}" sotuvdan olingan`);
    if (Number(p.stock_quantity) < it.quantity) {
      shortages.push({ product_id: p.id, name: p.name, requested: it.quantity, available: Number(p.stock_quantity), unit: p.unit });
    }
    let unitPrice = it.unit_price;
    if (unitPrice === null) {
      const wholesale = p.wholesale_price !== null && p.wholesale_min_qty !== null && it.quantity >= Number(p.wholesale_min_qty);
      unitPrice = wholesale ? Number(p.wholesale_price) : Number(p.price);
    }
    return {
      ...it,
      unit_price: money(unitPrice),
      name: p.name,
      unit: p.unit,
      warranty_months: p.warranty_months || null
    };
  });

  if (shortages.length) {
    throw new HttpError(409, 'Omborda yetarli qoldiq yo\'q', 'INSUFFICIENT_STOCK', { shortages });
  }
  return priced;
}

/** Mijozni aniqlaydi: customer_id (egalik tekshiruvi bilan) yoki {full_name, phone} bo'yicha topadi/yaratadi. */
async function resolveCustomer(client, merchantId, { customerId, customer }) {
  if (customerId) {
    const { rows } = await client.query('SELECT id, merchant_id FROM customers WHERE id = $1 FOR UPDATE', [customerId]);
    if (!rows[0]) throw new HttpError(404, 'Mijoz topilmadi');
    if (rows[0].merchant_id !== merchantId) throw new HttpError(403, 'Bu mijoz boshqa sotuvchiga tegishli', 'FORBIDDEN');
    return rows[0].id;
  }
  if (customer && customer.full_name) {
    if (customer.phone) {
      const ex = await client.query(
        'SELECT id FROM customers WHERE merchant_id = $1 AND phone = $2 FOR UPDATE',
        [merchantId, customer.phone]
      );
      if (ex.rows[0]) return ex.rows[0].id;
    }
    const ins = await client.query(
      'INSERT INTO customers (merchant_id, full_name, phone, address) VALUES ($1,$2,$3,$4) RETURNING id',
      [merchantId, customer.full_name, customer.phone || null, customer.address || null]
    );
    return ins.rows[0].id;
  }
  return null;
}

/** customers.total_debt ni debts jadvalidan qayta hisoblaydi (denormalizatsiya izchilligi). */
async function recalcCustomerDebt(client, customerId) {
  await client.query(
    `UPDATE customers SET total_debt = COALESCE(
        (SELECT SUM(total_debt - paid_amount) FROM debts WHERE customer_id = $1 AND status <> 'paid'), 0)
      WHERE id = $1`,
    [customerId]
  );
}

/**
 * Sotuv yaratish.
 * @param input { items, payment_type, discount_amount, customer_id, customer, paid_amount, due_date,
 *                source, status, external_ref, customer_name, customer_phone, delivery_address, note }
 */
async function createSale(client, merchantId, input) {
  const items = await lockAndPriceItems(client, merchantId, normalizeItems(input.items));
  const subtotal = money(items.reduce((s, it) => s + it.quantity * it.unit_price, 0));
  const discount = money(input.discount_amount || 0);
  if (discount < 0 || discount > subtotal) {
    throw new HttpError(422, "Chegirma jami summadan oshmasligi kerak", 'VALIDATION_ERROR', { field: 'discount_amount' });
  }
  const total = money(subtotal - discount);
  const paymentType = input.payment_type;

  const customerId = await resolveCustomer(client, merchantId, { customerId: input.customer_id, customer: input.customer });

  let debtAmount = 0;
  if (paymentType === 'debt') {
    if (!customerId) {
      throw new HttpError(422, 'Qarzga sotish uchun mijoz tanlanishi shart', 'CUSTOMER_REQUIRED', { field: 'customer_id' });
    }
    const paidNow = money(input.paid_amount || 0);
    if (paidNow < 0 || paidNow >= total) {
      throw new HttpError(422, "Oldindan to'lov jami summadan kichik bo'lishi kerak", 'VALIDATION_ERROR', { field: 'paid_amount' });
    }
    debtAmount = money(total - paidNow);
  }

  const saleRes = await client.query(
    `INSERT INTO sales (merchant_id, customer_id, payment_type, total_amount, discount_amount, source, status,
                        external_ref, customer_name, customer_phone, delivery_address, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [merchantId, customerId, paymentType, total, discount, input.source || 'pos', input.status || 'completed',
      input.external_ref || null, input.customer_name || (input.customer && input.customer.full_name) || null,
      input.customer_phone || (input.customer && input.customer.phone) || null, input.delivery_address || null, input.note || null]
  );
  const sale = saleRes.rows[0];

  // sale_items — bitta multi-row INSERT
  const values = [];
  const params = [];
  items.forEach((it, i) => {
    const o = i * 6;
    values.push(`($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6})`);
    params.push(sale.id, it.product_id, it.quantity, it.unit_price, it.name, it.warranty_months || null);
  });
  const itemRes = await client.query(
    `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, product_name, warranty_months) VALUES ${values.join(',')}
     RETURNING id, product_id, quantity, unit_price, product_name, warranty_months`,
    params
  );

  // Ombor qoldig'ini kamaytirish — bitta UPDATE
  await client.query(
    `UPDATE products p SET stock_quantity = p.stock_quantity - x.qty, updated_at = ${NOW}
       FROM (SELECT unnest($1::int[]) AS id, unnest($2::numeric[]) AS qty) x
      WHERE p.id = x.id AND p.merchant_id = $3`,
    [items.map((i) => i.product_id), items.map((i) => i.quantity), merchantId]
  );

  let debt = null;
  if (debtAmount > 0) {
    const d = await client.query(
      `INSERT INTO debts (merchant_id, customer_id, sale_id, total_debt, paid_amount, status, due_date)
       VALUES ($1,$2,$3,$4,0,'unpaid',$5) RETURNING *`,
      [merchantId, customerId, sale.id, debtAmount, input.due_date || null]
    );
    debt = d.rows[0];
    await recalcCustomerDebt(client, customerId);
  }

  return {
    ...sale,
    subtotal,
    items: itemRes.rows.map((r) => ({ ...r, unit: items.find((i) => i.product_id === r.product_id).unit })),
    debt,
  };
}

/** Bekor qilingan / rad etilgan sotuv uchun ombor qoldig'ini qaytaradi. */
async function restoreStock(client, merchantId, saleId) {
  await client.query(
    `UPDATE products p SET stock_quantity = p.stock_quantity + x.qty, updated_at = ${NOW}
       FROM (SELECT product_id, SUM(quantity) AS qty FROM sale_items WHERE sale_id = $1 GROUP BY product_id) x
      WHERE p.id = x.product_id AND p.merchant_id = $2`,
    [saleId, merchantId]
  );
}

module.exports = { createSale, restoreStock, recalcCustomerDebt, normalizeItems };

