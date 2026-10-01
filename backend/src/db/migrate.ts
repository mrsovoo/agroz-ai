import { db } from "./index.js";
import { sql } from "drizzle-orm";

/**
 * AgrozGO — Database auto-migration / synchronization helper.
 * Har safar backend ishga tushganda bazada kerakli ustun va jadvallar
 * mavjudligini avtomatik ta'minlaydi (ALTER TABLE IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).
 */
export async function ensureSchema(): Promise<void> {
  try {
    // 1. Users jadvali uchun qo'shimcha maydonlar
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS second_phone varchar(32);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS district varchar(120);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS weather_sent_date varchar(16);
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

    // 3. Specialist medicines (dorilar) uchun maydonlar va qoralama migratsiyasi
    await db.execute(sql`
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS stock integer DEFAULT 10 NOT NULL;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS stock_unit varchar(20) DEFAULT 'dona' NOT NULL;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS photo_data text;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS price integer;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS image_width integer;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS image_height integer;
      ALTER TABLE specialist_medicines ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;
      UPDATE specialist_medicines
      SET status = 'qoralama'
      WHERE (price IS NULL OR price <= 0 OR (photo_file_id IS NULL AND photo_data IS NULL))
        AND status != 'qoralama';
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

    // 6. Notification reads (bildirishnomalar o'qilgan holati) jadvali va orders.reminder_sent_at
    await db.execute(sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS reminder_sent_at timestamp;
      CREATE TABLE IF NOT EXISTS notification_reads (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        notification_key varchar(160) NOT NULL,
        read_at timestamp DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS notification_reads_user_key_idx
        ON notification_reads (user_id, notification_key);
    `);

    // 7. Support / Murojaatlar tizimi (support_tickets va support_messages)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id serial PRIMARY KEY NOT NULL,
        user_type varchar(20) DEFAULT 'user' NOT NULL,
        user_id integer,
        specialist_id integer,
        telegram_id bigint,
        category varchar(40) DEFAULT 'umumiy' NOT NULL,
        status varchar(30) DEFAULT 'yangi' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
      CREATE TABLE IF NOT EXISTS support_messages (
        id serial PRIMARY KEY NOT NULL,
        ticket_id integer NOT NULL,
        sender varchar(20) DEFAULT 'user' NOT NULL,
        text text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 8. Broadcasts (ommaviy xabarlar fon jarayoni) jadvali + yarim qolganlarni "toxtadi" deb belgilash
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS broadcasts (
        id serial PRIMARY KEY NOT NULL,
        text text NOT NULL,
        target varchar(40) DEFAULT 'all' NOT NULL,
        total integer DEFAULT 0 NOT NULL,
        sent_count integer DEFAULT 0 NOT NULL,
        failed_count integer DEFAULT 0 NOT NULL,
        status varchar(20) DEFAULT 'jarayonda' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
      UPDATE broadcasts SET status = 'toxtadi' WHERE status = 'jarayonda';
    `);

    console.log("[db] ensureSchema: Barcha jadvallar va ustunlar muvaffaqiyatli tekshirildi/yaratildi.");
  } catch (err: any) {
    console.warn("[db] ensureSchema ogohlantirish (bazaga ulanish yoki migratsiya):", err?.message || err);
  }
}

