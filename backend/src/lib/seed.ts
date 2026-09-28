import { db } from "../db/index.js";
import {
  news,
  specialists,
  specialistMedicines,
  specialistRatings,
  orders,
  orderItems,
  advertisements,
} from "../db/schema.js";
import { sql } from "drizzle-orm";

let seeded = false;
const SEED_LOCK_KEY = 771_204;

// Barcha demo/template ma'lumotlar o'chirilgan — productionda bo'sh baza
const PHARMACIES: any[] = [];
const SPECIALISTS: any[] = [];
const MEDICINES_BY_PHARMACY: any[] = [];
const NEWS: any[] = [];

export async function ensureSeed() {
  if (seeded) return;
  try {
    await seedInTransaction();
    seeded = true;
  } catch (err: any) {
    if (err?.cause?.code === "42P01" || err?.code === "42P01") {
      console.warn(
        "[seed] Jadvallar hali yaratilmagan (migration bajarilmagan). Seed o'tkazib yuborildi."
      );
      return;
    }
    console.error("[seed] boshlang'ich ma'lumotlarni yozishda xato:", err);
  }
}

async function seedInTransaction() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${SEED_LOCK_KEY})`);

    // Yangiliklar tekshiruvi — demo ma'lumotlar yo'q
    const newsRows = await tx.execute<{ count: string }>(
      sql`select count(*)::text as count from news`
    );
    if (Number(newsRows.rows[0]?.count ?? "0") === 0) {
      console.log("  [seed] Yangiliklar jadvali bo'sh — demo ma'lumotlar kiritilmadi.");
    }

    // Dorixonalar va Mutaxassislar tekshiruvi
    const specRows = await tx.execute<{ count: string }>(
      sql`select count(*)::text as count from specialists`
    );

    if (Number(specRows.rows[0]?.count ?? "0") === 0) {
      console.log("  [seed] Dorixonalar/Mutaxassislar jadvali bo'sh — demo ma'lumotlar kiritilmadi.");
    }

    // Reklamalar tekshiruvi
    const advRows = await tx.execute<{ count: string }>(
      sql`select count(*)::text as count from advertisements`
    );
    if (Number(advRows.rows[0]?.count ?? "0") === 0) {
      console.log("  [seed] Reklamalar jadvali bo'sh — demo ma'lumotlar kiritilmadi.");
    }
  });
}