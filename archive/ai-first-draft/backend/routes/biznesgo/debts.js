/**
 * DEBT LEDGER (Qarz daftari)
 *   GET  /debts           — qarzlar + qarzdorlar (mijoz bo'yicha) + umumiy balans
 *                           ?status=open|unpaid|partial|paid|all&customer_id=&search=&overdue=1
 *   GET  /debts/:id       — qarz + to'lovlar tarixi
 *   POST /debts           — qo'lda qarz yozish (eski daftardan ko'chirish): { customer_id, amount, due_date?, note? }
 *   POST /debts/pay       — to'lov qabul qilish (qisman yoki to'liq):
 *                           { debt_id, amount, payment_method? }  — aniq qarzga
 *                           { customer_id, amount, payment_method? } — mijozning eng eski qarzlaridan boshlab (FIFO)
 */
const express = require('express');
const { query, withTransaction, TODAY } = require('../../db/pool');
const { HttpError, asyncHandler } = require('../../lib/errors');
const v = require('../../lib/validate');
const { loadOwned } = require('../../lib/ownership');
const { recalcCustomerDebt } = require('../../services/sales');

const router = express.Router();

let debtColumnsChecked = false;
async function ensureDebtColumns() {
  if (debtColumnsChecked) return;
  try {
    await query(`
      ALTER TABLE debts ADD COLUMN IF NOT EXISTS installment_months INT;
      ALTER TABLE debts ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(14,2);
      ALTER TABLE debts ADD COLUMN IF NOT EXISTS warranty_service_date DATE;
      ALTER TABLE debts ADD COLUMN IF NOT EXISTS crop_or_animal_profile VARCHAR(255);
      ALTER TABLE debts ADD COLUMN IF NOT EXISTS note TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS crop_or_animal_profile VARCHAR(255);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS feed_frequency_days INT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(14,2) DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS planting_season VARCHAR(100);
    `);
    debtColumnsChecked = true;
  } catch (e) {}
}

const DEBT_COLUMNS = `d.id, d.customer_id, d.sale_id, d.total_debt, d.paid_amount,
  (d.total_debt - d.paid_amount) AS remaining, d.status, d.due_date, d.created_at,
  d.installment_months, d.monthly_payment, d.warranty_service_date, d.note,
  (d.status <> 'paid' AND d.due_date IS NOT NULL AND d.due_date < ${TODAY}) AS is_overdue,
  c.full_name AS customer_name, c.phone AS customer_phone,
  COALESCE(c.credit_limit, 0) AS credit_limit, c.feed_frequency_days, c.planting_season,
  COALESCE(d.crop_or_animal_profile, c.crop_or_animal_profile) AS crop_or_animal_profile`;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    await ensureDebtColumns();
    const mid = req.merchant.id;
    const { limit, offset } = v.paging(req.query, { defLimit: 100, maxLimit: 500 });
    const status = v.oneOf(req.query.status, 'status', ['open', 'unpaid', 'partial', 'paid', 'all']) || 'open';
    const where = ['d.merchant_id = $1'];
    const params = [mid];
    const add = (sql, val) => {
      params.push(val);
      where.push(sql.replace(/\?/g, `$${params.length}`));
    };
    if (status === 'open') where.push("d.status <> 'paid'");
    else if (status !== 'all') add('d.status = ?', status);
    if (req.query.customer_id) add('d.customer_id = ?', v.idParam(req.query.customer_id, 'customer_id'));
    const search = v.str(req.query.search, 'search', { max: 100 });
    if (search) add('(c.full_name ILIKE ? OR c.phone ILIKE ?)', `%${search}%`);
    if (req.query.overdue === '1') where.push(`d.status <> 'paid' AND d.due_date < ${TODAY}`);

    const [debts, debtors, summary] = await Promise.all([
      query(
        `SELECT ${DEBT_COLUMNS} FROM debts d JOIN customers c ON c.id = d.customer_id
          WHERE ${where.join(' AND ')}
          ORDER BY (d.status = 'paid'), d.due_date ASC NULLS LAST, d.created_at ASC
          LIMIT ${limit} OFFSET ${offset}`,
        params
      ),
      query(
        `SELECT c.id AS customer_id, c.full_name, c.phone, c.total_debt,
                COALESCE(c.credit_limit, 0) AS credit_limit,
                c.crop_or_animal_profile, c.feed_frequency_days, c.planting_season,
                COUNT(d.id)::int AS open_debts,
                MIN(d.due_date) AS nearest_due_date,
                BOOL_OR(d.due_date < ${TODAY}) AS has_overdue,
                MAX(d.created_at) AS last_debt_at
           FROM customers c JOIN debts d ON d.customer_id = c.id AND d.status <> 'paid'
          WHERE c.merchant_id = $1
          GROUP BY c.id
          ORDER BY c.total_debt DESC`,
        [mid]
      ),
      query(
        `SELECT COALESCE(SUM(total_debt - paid_amount) FILTER (WHERE status <> 'paid'), 0) AS total_outstanding,
                COALESCE(SUM(total_debt - paid_amount) FILTER (WHERE status <> 'paid' AND due_date < ${TODAY}), 0) AS overdue_amount,
                COUNT(DISTINCT customer_id) FILTER (WHERE status <> 'paid')::int AS debtors_count,
                COUNT(*) FILTER (WHERE status <> 'paid')::int AS open_debts,
                COALESCE((SELECT SUM(amount) FROM debt_payments
                           WHERE merchant_id = $1 AND created_at >= ${TODAY}), 0) AS collected_today
           FROM debts WHERE merchant_id = $1`,
        [mid]
      ),
    ]);
    res.json({ summary: summary.rows[0], debtors: debtors.rows, debts: debts.rows, limit, offset });
  })
);

router.get(
  '/:id(\\d+)',
  asyncHandler(async (req, res) => {
    await ensureDebtColumns();
    const id = v.idParam(req.params.id);
    await loadOwned({ query }, 'debts', id, req.merchant.id, { columns: 'id' });
    const [debt, payments] = await Promise.all([
      query(`SELECT ${DEBT_COLUMNS} FROM debts d JOIN customers c ON c.id = d.customer_id WHERE d.id = $1`, [id]),
      query('SELECT id, amount, payment_method, note, created_at FROM debt_payments WHERE debt_id = $1 ORDER BY created_at', [id]),
    ]);
    res.json({ debt: { ...debt.rows[0], payments: payments.rows } });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    await ensureDebtColumns();
    const b = req.body || {};
    const customerId = v.idParam(b.customer_id, 'customer_id');
    const amount = v.money(v.num(b.amount, 'amount', { required: true, positive: true, max: 1e12 }));
    const dueDate = v.date(b.due_date, 'due_date');
    const note = v.str(b.note, 'note', { max: 500 });
    const installmentMonths = v.int(b.installment_months, 'installment_months', { min: 1, max: 60 });
    const monthlyPayment = b.monthly_payment ? v.money(v.num(b.monthly_payment, 'monthly_payment', { min: 0, max: 1e12 })) : null;
    const warrantyServiceDate = v.date(b.warranty_service_date, 'warranty_service_date');
    const cropOrAnimalProfile = v.str(b.crop_or_animal_profile, 'crop_or_animal_profile', { max: 255 });

    const debt = await withTransaction(async (client) => {
      await loadOwned(client, 'customers', customerId, req.merchant.id, { forUpdate: true, columns: 'id' });
      const { rows } = await client.query(
        `INSERT INTO debts (
          merchant_id, customer_id, total_debt, due_date, note,
          installment_months, monthly_payment, warranty_service_date, crop_or_animal_profile
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.merchant.id, customerId, amount, dueDate, note, installmentMonths, monthlyPayment, warrantyServiceDate, cropOrAnimalProfile]
      );
      if (cropOrAnimalProfile) {
        await client.query(`UPDATE customers SET crop_or_animal_profile = COALESCE(crop_or_animal_profile, $1) WHERE id = $2`, [cropOrAnimalProfile, customerId]);
      }
      await recalcCustomerDebt(client, customerId);
      return rows[0];
    });
    res.status(201).json({ debt });
  })
);

router.post(
  '/pay',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const amount = v.money(v.num(b.amount, 'amount', { required: true, positive: true, max: 1e12 }));
    const method = v.oneOf(b.payment_method, 'payment_method', ['cash', 'card']) || 'cash';
    const note = v.str(b.note, 'note', { max: 500 });
    const debtId = b.debt_id ? v.idParam(b.debt_id, 'debt_id') : null;
    const customerId = b.customer_id ? v.idParam(b.customer_id, 'customer_id') : null;
    if (!debtId && !customerId) throw new HttpError(422, 'debt_id yoki customer_id kerak', 'VALIDATION_ERROR');

    const result = await withTransaction(async (client) => {
      let debts;
      if (debtId) {
        const d = await loadOwned(client, 'debts', debtId, req.merchant.id, { forUpdate: true });
        if (d.status === 'paid') throw new HttpError(409, "Bu qarz allaqachon to'liq to'langan", 'ALREADY_PAID');
        const remaining = v.money(d.total_debt - d.paid_amount);
        if (amount > remaining) {
          throw new HttpError(422, `To'lov qoldiq qarzdan (${remaining}) oshmasligi kerak`, 'OVERPAYMENT', { remaining });
        }
        debts = [d];
      } else {
        await loadOwned(client, 'customers', customerId, req.merchant.id, { forUpdate: true, columns: 'id' });
        const r = await client.query(
          `SELECT * FROM debts WHERE merchant_id = $1 AND customer_id = $2 AND status <> 'paid'
            ORDER BY due_date ASC NULLS LAST, created_at ASC, id ASC FOR UPDATE`,
          [req.merchant.id, customerId]
        );
        debts = r.rows;
        const remaining = v.money(debts.reduce((s, d) => s + (d.total_debt - d.paid_amount), 0));
        if (!debts.length) throw new HttpError(409, "Mijozda ochiq qarz yo'q", 'NO_OPEN_DEBT');
        if (amount > remaining) {
          throw new HttpError(422, `To'lov umumiy qarzdan (${remaining}) oshmasligi kerak`, 'OVERPAYMENT', { remaining });
        }
      }

      let left = amount;
      const applied = [];
      for (const d of debts) {
        if (left <= 0) break;
        const remaining = v.money(d.total_debt - d.paid_amount);
        const pay = v.money(Math.min(left, remaining));
        if (pay <= 0) continue;
        const newPaid = v.money(Number(d.paid_amount) + pay);
        const status = newPaid >= Number(d.total_debt) ? 'paid' : 'partial';
        const upd = await client.query(
          `UPDATE debts SET paid_amount = $1, status = $2 WHERE id = $3
           RETURNING id, total_debt, paid_amount, (total_debt - paid_amount) AS remaining, status`,
          [newPaid, status, d.id]
        );
        await client.query(
          'INSERT INTO debt_payments (merchant_id, debt_id, amount, payment_method, note) VALUES ($1,$2,$3,$4,$5)',
          [req.merchant.id, d.id, pay, method, note]
        );
        applied.push({ ...upd.rows[0], applied_amount: pay });
        left = v.money(left - pay);
      }

      const custId = debts[0].customer_id;
      await recalcCustomerDebt(client, custId);
      const c = await client.query('SELECT id, full_name, phone, total_debt FROM customers WHERE id = $1', [custId]);
      return { paid_amount: amount, payment_method: method, debts: applied, customer: c.rows[0] };
    });

    res.json(result);
  })
);

module.exports = router;

