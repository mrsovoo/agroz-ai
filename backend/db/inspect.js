/**
 * Faqat O'QISH rejimidagi diagnostika: mavjud jadvallar va ustunlarini ko'rsatadi.
 * Hech narsa yozmaydi / o'zgartirmaydi.
 *   npm run inspect-db
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query('SET TRANSACTION READ ONLY').catch(() => {});
    const { rows } = await client.query(`
      SELECT c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default
        FROM information_schema.columns c
        JOIN information_schema.tables t
          ON t.table_name = c.table_name AND t.table_schema = c.table_schema
       WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
       ORDER BY c.table_name, c.ordinal_position`);
    const byTable = {};
    for (const r of rows) {
      (byTable[r.table_name] ||= []).push(
        `${r.column_name} ${r.data_type}${r.is_nullable === 'NO' ? ' NOT NULL' : ''}`
      );
    }
    for (const [t, cols] of Object.entries(byTable)) {
      console.log(`\n== ${t}\n  ${cols.join('\n  ')}`);
    }
  } finally {
    await client.end();
  }
})().catch((e) => {
  console.error('Inspect failed:', e.message);
  process.exit(1);
});

