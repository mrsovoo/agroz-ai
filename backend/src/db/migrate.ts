import { db } from "./index.js";
import { sql } from "drizzle-orm";

/**
 * Agroz AI — Database auto-migration / synchronization helper.
 * Har safar backend ishga tushganda bazada kerakli ustun va jadvallar
 * mavjudligini avtomatik ta'minlaydi (ALTER TABLE IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).
 */
export async function ensureSchema(): Promise<void> {
  try {
    // 1. Users jadvali uchun qo'shimcha telefon raqami
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);
    `);

    // 2. Specialists jadvalidagi maydonlar
    await db.execute(sql`
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT true NOT NULL;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS is_busy boolean DEFAULT false NOT NULL;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS current_call_id integer;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS helps_with varchar(20) DEFAULT 'both';
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS experience_years integer;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS education varchar(300);
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS bio varchar(500);
    `);

    // 3. Specialist medicines (dorilar) uchun maydonlar
    await db.execute(sql`
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS stock integer DEFAULT 10 NOT NULL;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS stock_unit varchar(20) DEFAULT 'dona' NOT NULL;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS photo_data text;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS price integer;
    `);

    // 4. Specialist calls (chaqiruvlar) jadvali
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS specialist_calls (
        id serial PRIMARY KEY NOT NULL,
        specialist_id integer NOT NULL,
        customer_name varchar(120) NOT NULL,
        customer_phone varchar(32) NOT NULL,
        problem text NOT NULL,
        address text,
        status varchar(20) DEFAULT 'yangi' NOT NULL,
        assigned_order_id integer,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 5. Advertisements (reklamalar) jadvali
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS advertisements (
        id serial PRIMARY KEY NOT NULL,
        title varchar(200) NOT NULL,
        description text,
        image_url varchar(500),
        link_url varchar(500),
        start_date timestamp DEFAULT now() NOT NULL,
        end_date timestamp,
        priority integer DEFAULT 0 NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("[db] ensureSchema: Barcha jadvallar va ustunlar muvaffaqiyatli tekshirildi/yaratildi.");
  } catch (err: any) {
    console.warn("[db] ensureSchema ogohlantirish (bazaga ulanish yoki migratsiya):", err?.message || err);
  }
}

