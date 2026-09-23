import "dotenv/config";
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

function createMockDb(): Database {
  console.warn("[AI Studio] Database not connected — using mock");

  const createChainable = (targetVal: any = []): any => {
    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        if (prop === "then") {
          return (resolve: (val: any) => void) => resolve(targetVal);
        }
        if (prop === "catch") {
          return () => Promise.resolve(targetVal);
        }
        if (prop === "finally") {
          return (cb: () => void) => {
            cb();
            return Promise.resolve(targetVal);
          };
        }
        if (prop === "rows") {
          return [];
        }
        return (...args: any[]) => {
          if (prop === "transaction") {
            const callback = args[0];
            if (typeof callback === "function") {
              return Promise.resolve().then(() => callback(createMockDb()));
            }
            return Promise.resolve([]);
          }
          if (prop === "execute") {
            return Promise.resolve({ rows: [] });
          }
          return createChainable(targetVal);
        };
      },
      apply() {
        return createChainable(targetVal);
      },
    };
    return new Proxy(() => {}, handler);
  };

  return createChainable([]);
}

const mockPool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({
    query: async () => ({ rows: [] }),
    release: () => {},
  }),
  on: () => {},
  end: async () => {},
} as unknown as Pool;

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return mockPool;
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
  if (!cachedPool) {
    if (!process.env.DATABASE_URL) {
      return mockPool;
    }
    try {
      cachedPool = createPool();
    } catch (err) {
      console.warn("[AI Studio] Failed to create database pool, using mock:", err);
      return mockPool;
    }
  }
  return cachedPool;
}

function getDb(): Database {
  if (!cachedDb) {
    if (!process.env.DATABASE_URL) {
      cachedDb = createMockDb();
      return cachedDb;
    }
    try {
      const p = getPool();
      if (p === mockPool) {
        cachedDb = createMockDb();
      } else {
        cachedDb = drizzle(p);
      }
    } catch (err) {
      console.warn("[AI Studio] Failed to initialize drizzle, using mock:", err);
      cachedDb = createMockDb();
    }
  }
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
