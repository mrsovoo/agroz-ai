/**
 * Idempotent migratsiya: db/schema.sql ni ishga tushiradi.
 *   npm run migrate
 * Faqat CREATE ... IF NOT EXISTS — mavjud jadvallar (users va h.k.) buzilmaydi.
 * Advisory lock bir vaqtda ikki instansiya migratsiya qilishining oldini oladi.
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

const LOCK_KEY = 728_451_903; // ixtiyoriy doimiy son

async function migrate({ log = console.log } = {}) {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Xavfsizlik: sxema faylida buzuvchi buyruqlar bo'lmasligi kerak.
  const forbidden = /\b(DROP\s+(TABLE|SCHEMA|DATABASE|COLUMN)|TRUNCATE|DELETE\s+FROM|ALTER\s+TABLE\s+users)\b/i;
  const sqlNoComments = sql.replace(/--.*$/gm, '');
  if (forbidden.test(sqlNoComments)) {
    throw new Error('schema.sql da taqiqlangan buyruq topildi — migratsiya to\'xtatildi.');
  }

  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    log('[migrate] BiznesGO sxemasi tayyor.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    client.release();
  }
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('[migrate] xato:', err.message);
      pool.end().finally(() => process.exit(1));
    });
}

