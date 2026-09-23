/**
 * Barcha platforma ma'lumotlarini tozalash (jadvallar qoladi, yozuvlar o'chadi).
 *
 *   npm run db:clear            # so'raydi
 *   npm run db:clear -- --yes   # so'ramasdan o'chiradi
 *
 * Nima o'chadi: mutaxassislar, dorixonalar, dorilar, tashxislar, yangiliklar,
 * foydalanuvchilar, sessiyalar, OTP kodlar va bot holatlari.
 * Nima qoladi: jadval tuzilishi (migratsiyalar qayta yuritilmaydi).
 */
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import pg from "pg";

const { Pool } = pg;

const TABLES = [
  // Bog'liqlik tartibida emas — TRUNCATE CASCADE o'zi hal qiladi.
  "order_items",
  "orders",
  "specialist_calls",
  "specialist_ratings",
  "specialist_medicines",
  "specialists",
  "pharmacy_stocks",
  "medicines",
  "pharmacies",
  "diagnoses",
  "news",
  "advertisements",
  "app_settings",
  "admin_sessions",
  "otp_codes",
  "sessions",
  "users",
  "bot_states",
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✖ DATABASE_URL topilmadi — .env faylini tekshiring.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    "⚠️  Bazadagi BARCHA ma'lumot o'chiriladi (mutaxassis, dorixona, dori, tashxis...).\n" +
      "   Davom etish uchun \"ha\" yozing: ",
  );
  rl.close();
  if (answer.trim().toLowerCase() !== "ha") {
    console.log("Bekor qilindi.");
    process.exit(0);
  }
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  const existing = await pool.query(
    "select tablename from pg_tables where schemaname = 'public'",
  );
  const names = new Set(existing.rows.map((r) => r.tablename));
  const targets = TABLES.filter((t) => names.has(t));

  if (targets.length === 0) {
    console.log("✖ Jadval topilmadi — avval `npm run db:migrate` ishlating.");
    process.exit(1);
  }

  console.log("Tozalashdan oldin:");
  for (const t of targets) {
    const r = await pool.query(`select count(*)::int as n from "${t}"`);
    console.log(`  ${t.padEnd(22)} ${r.rows[0].n}`);
  }

  await pool.query(`truncate table ${targets.map((t) => `"${t}"`).join(", ")} restart identity cascade`);

  console.log("\nTozalashdan keyin:");
  for (const t of targets) {
    const r = await pool.query(`select count(*)::int as n from "${t}"`);
    console.log(`  ${t.padEnd(22)} ${r.rows[0].n}`);
  }
  console.log("\n✅ Baza tozalandi.");
} catch (err) {
  console.error("✖ Xatolik:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
