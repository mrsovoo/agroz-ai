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
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_weather_push_enabled boolean DEFAULT true NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bot_started_at timestamp;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS bot_blocked boolean DEFAULT false NOT NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS consented_at timestamp;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version varchar(32) DEFAULT 'v1.0';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_channel varchar(64) DEFAULT 'telegram_farmer_bot';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_text text;
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
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS bot_started_at timestamp;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS bot_blocked boolean DEFAULT false NOT NULL;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS consented_at timestamp;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS consent_version varchar(32) DEFAULT 'v1.0';
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS consent_channel varchar(64) DEFAULT 'telegram_auth_bot';
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS consent_text text;
    `);

    // 2b. Shaxsiy ma'lumotlar rozilik jurnali (O'RQ-547 bo'yicha o'zgarmas audit log)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS data_consents (
        id serial PRIMARY KEY NOT NULL,
        subject_type varchar(32) NOT NULL,
        subject_id integer NOT NULL,
        telegram_id bigint,
        phone varchar(32) NOT NULL,
        full_name varchar(160) NOT NULL,
        policy_version varchar(32) DEFAULT 'v1.0' NOT NULL,
        consent_channel varchar(64) NOT NULL,
        consent_statement text NOT NULL,
        legal_basis text DEFAULT 'O''zbekiston Respublikasi O''RQ-547-sonli ''Shaxsiy ma''lumotlar to''g''risida''gi Qonuni' NOT NULL,
        consented_at timestamp DEFAULT now() NOT NULL,
        immutable_hash varchar(64) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS data_consents_subject_idx ON data_consents (subject_type, subject_id);
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
      WHERE (price IS NULL OR price <= 0)
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
        button_text varchar(100),
        button_url text,
        target varchar(40) DEFAULT 'all' NOT NULL,
        total integer DEFAULT 0 NOT NULL,
        sent_count integer DEFAULT 0 NOT NULL,
        failed_count integer DEFAULT 0 NOT NULL,
        status varchar(20) DEFAULT 'jarayonda' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
      ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS button_text varchar(100);
      ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS button_url text;
      UPDATE broadcasts SET status = 'toxtadi' WHERE status = 'jarayonda';

      CREATE TABLE IF NOT EXISTS broadcast_deliveries (
        id serial PRIMARY KEY NOT NULL,
        broadcast_id integer NOT NULL,
        recipient_type varchar(20) NOT NULL,
        recipient_id integer NOT NULL,
        telegram_id bigint,
        status varchar(20) DEFAULT 'sent' NOT NULL,
        error text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 9. Push bildirishnomalar tokenlari (Android / iOS)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_tokens (
        id serial PRIMARY KEY NOT NULL,
        user_id integer NOT NULL,
        token text UNIQUE NOT NULL,
        platform varchar(20) DEFAULT 'unknown' NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // 10. Dori kelganda xabar berish (waitlist) jadvali
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS medicine_waitlist (
        id serial PRIMARY KEY NOT NULL,
        medicine_id integer NOT NULL,
        telegram_id bigint,
        phone varchar(32),
        user_id integer,
        is_notified boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        notified_at timestamp
      );
      CREATE INDEX IF NOT EXISTS medicine_waitlist_med_notified_idx
        ON medicine_waitlist (medicine_id, is_notified);
    `);

    console.log("[db] ensureSchema: Barcha jadvallar va ustunlar muvaffaqiyatli tekshirildi/yaratildi.");
  } catch (err: any) {
    console.warn("[db] ensureSchema ogohlantirish (bazaga ulanish yoki migratsiya):", err?.message || err);
  }
}

