/**
 * Egalik (tenant isolation) tekshiruvi.
 *   - Yozuv umuman yo'q            → 404
 *   - Yozuv boshqa merchant'niki    → 403 Forbidden
 *   - Yozuv shu merchant'niki       → yozuvni qaytaradi
 *
 * `db` — pool yoki tranzaksiya client'i. `forUpdate` — qatorni bloklash (tranzaksiya ichida).
 */
const { HttpError } = require('./errors');

const TABLES = {
  products: 'Mahsulot',
  customers: 'Mijoz',
  sales: 'Sotuv',
  debts: 'Qarz',
};

async function loadOwned(db, table, id, merchantId, { forUpdate = false, columns = '*' } = {}) {
  if (!TABLES[table]) throw new Error(`loadOwned: ruxsat etilmagan jadval ${table}`);
  const { rows } = await db.query(
    `SELECT ${columns} , merchant_id AS __owner FROM ${table} WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [id]
  );
  const row = rows[0];
  if (!row) throw new HttpError(404, `${TABLES[table]} topilmadi`);
  if (row.__owner !== merchantId) {
    throw new HttpError(403, "Bu ma'lumot boshqa sotuvchiga tegishli", 'FORBIDDEN');
  }
  delete row.__owner;
  return row;
}

module.exports = { loadOwned };

