/**
 * BiznesGO — Toza sxema migratsiyasi va @agroz_auth_bot -> @biznesgo_bot sinxronizatsiyasi.
 * Ishlatish: npm --workspace=backend run db:migrate:biznesgo
 */
import "dotenv/config";
import { ensureBiznesGoSchema } from "../src/db/migrate.js";
import { pool } from "../src/db/index.js";

const EXPECTED_TABLES = [
  "biznesgo_merchants",
  "biznesgo_sessions",
  "biznesgo_products",
  "biznesgo_customers",
  "biznesgo_debts",
  "biznesgo_debt_payments",
  "biznesgo_pos_sales",
  "biznesgo_pos_sale_items",
  "biznesgo_orders",
  "biznesgo_order_items",
];

async function main() {
  console.log("🚀 BiznesGO database migratsiyasi va ro'yxatdan o'tganlarni ko'chirish boshlanmoqda...");
  await ensureBiznesGoSchema();

  const res = await pool.instance.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'biznesgo_%' ORDER BY table_name`
  );
  const foundTables = res.rows.map((r) => r.table_name);

  console.log(`✅ Yaratilgan/tasdiqlangan BiznesGO jadvallari (${foundTables.length}/${EXPECTED_TABLES.length}):`);
  for (const tbl of EXPECTED_TABLES) {
    const ok = foundTables.includes(tbl);
    console.log(`   ${ok ? "✓" : "✗"} ${tbl}`);
    if (!ok) {
      throw new Error(`Jadval topilmadi: ${tbl}`);
    }
  }

  const merchantsRes = await pool.instance.query(
    `SELECT id, telegram_id, name, organization_name, phone, merchant_type FROM biznesgo_merchants ORDER BY id ASC`
  );
  console.log(`\n🏪 biznesgo_merchants jadvalidagi sotuvchilar soni: ${merchantsRes.rows.length} ta`);
  for (const m of merchantsRes.rows) {
    console.log(`   - [#${m.id}] ${m.organization_name} | ${m.name} | ${m.phone} | tg:${m.telegram_id} (${m.merchant_type})`);
  }

  const productsRes = await pool.instance.query(
    `SELECT count(*)::int AS cnt FROM biznesgo_products`
  );
  console.log(`📦 biznesgo_products jadvalidagi mahsulotlar soni: ${productsRes.rows[0]?.cnt ?? 0} ta`);

  await pool.instance.end().catch(() => {});
  console.log("\n🎉 BiznesGO database migratsiyasi va sinxronizatsiyasi muvaffaqiyatli yakunlandi!");
}

main().catch((err) => {
  console.error("✗ Migratsiya xatosi:", err.message || err);
  process.exit(1);
});
