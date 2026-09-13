import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export type Database = NodePgDatabase<Record<string, never>>;

/**
 * Ulanish lazy yaratiladi. Sabab: Next.js build paytida route modullarini import
 * qiladi — agar biz import paytida `DATABASE_URL` yo'qligidan xato tashlasak,
 * build butunlay yiqiladi. Endi xato faqat haqiqiy query paytida chiqadi.
 */
let cachedPool: Pool | null = null;
let cachedDb: Database | null = null;

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL topilmadi. Vercel → Settings → Environment Variables ga PostgreSQL/Neon connection string qo'shing.",
    );
  }

  const needsSsl =
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("sslmode=verify-full") ||
    databaseUrl.includes(".neon.tech") ||
    databaseUrl.includes(".supabase.") ||
    process.env.PGSSL === "true";

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PGPOOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Pool'dagi kutilmagan xatolar process'ni yiqitmasligi uchun.
  pool.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  return pool;
}

function getPool(): Pool {
  if (!cachedPool) cachedPool = createPool();
  return cachedPool;
}

function getDb(): Database {
  if (!cachedDb) cachedDb = drizzle(getPool());
  return cachedDb;
}

/**
 * `db.select()` va hokazo barcha mavjud chaqiruvlar o'zgarmasdan ishlashi uchun
 * Proxy ishlatiladi — metod birinchi marta chaqirilganda drizzle yaratiladi.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const pool = {
  get instance(): Pool {
    return getPool();
  },
};
