const { Pool, types } = require('pg');
const config = require('../config');

// NUMERIC/DECIMAL (1700) — pg standart holatda string qaytaradi. So'm summalari
// uchun Number yetarli (2^53 dan ancha kichik).
types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));
// DATE (1082) — vaqt mintaqasi siljishining oldini olish uchun "YYYY-MM-DD" string.
types.setTypeParser(1082, (v) => v);
// TIMESTAMP WITHOUT TIME ZONE (1114) — BiznesGO jadvallarida Toshkent vaqti saqlanadi
// (schema.sql: DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')). ISO + "+05:00" qilib beramiz.
types.setTypeParser(1114, (v) => (v === null ? null : `${v.replace(' ', 'T')}+05:00`));

/** SQL ifodalari: Toshkent bo'yicha hozirgi vaqt va bugungi sana. */
const NOW = "(now() AT TIME ZONE 'Asia/Tashkent')";
const TODAY = "((now() AT TIME ZONE 'Asia/Tashkent')::date)";

function sanitizeConnectionString(url) {
  // pg 'sslmode=require' + 'channel_binding' ogohlantirishlarini olib tashlaymiz;
  // SSL ni quyida aniq sozlaymiz.
  try {
    const u = new URL(url);
    u.searchParams.delete('sslmode');
    u.searchParams.delete('channel_binding');
    return u.toString();
  } catch {
    return url;
  }
}

const pool = new Pool({
  connectionString: sanitizeConnectionString(config.databaseUrl),
  ssl: config.pgSsl ? { rejectUnauthorized: false } : false,
  max: config.pgPoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (err) => {
  console.error('[pg] idle client error:', err.message);
});

/** Oddiy so'rov. */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Tranzaksiya: BEGIN ... COMMIT, xatoda ROLLBACK.
 *   await withTransaction(async (client) => { await client.query(...) })
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[pg] rollback failed:', rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction, NOW, TODAY };
