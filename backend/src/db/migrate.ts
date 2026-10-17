import { db } from "./index.js";
import { sql } from "drizzle-orm";

/**
 * BiznesGO toza sxemasi (10 ta jadval).
 * Yangi bo'sh Neon database'da eski pharmacies/medicines jadvallarini yaratmasdan,
 * faqat BiznesGO uchun kerakli jadvallarni idempotent (CREATE TABLE IF NOT EXISTS) yaratadi.
 */
export async function ensureBiznesGoSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key varchar(64) PRIMARY KEY NOT NULL,
      value text,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id varchar(64) PRIMARY KEY NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      expires_at timestamp NOT NULL
    );

    CREATE TABLE IF NOT EXISTS biznesgo_merchants (
      id serial PRIMARY KEY NOT NULL,
      telegram_id bigint UNIQUE,
      phone varchar(32) NOT NULL,
      name varchar(120) NOT NULL,
      organization_name varchar(200) NOT NULL,
      merchant_type varchar(40) NOT NULL,
      region varchar(100),
      district varchar(100),
      address text,
      latitude double precision,
      longitude double precision,
      working_hours varchar(100) DEFAULT '08:00 - 18:00',
      delivery_available boolean DEFAULT false NOT NULL,
      status varchar(20) DEFAULT 'active' NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_merchants_tg_idx ON biznesgo_merchants (telegram_id);
    CREATE INDEX IF NOT EXISTS biznesgo_merchants_phone_idx ON biznesgo_merchants (phone);
    CREATE INDEX IF NOT EXISTS biznesgo_merchants_type_idx ON biznesgo_merchants (merchant_type);

    CREATE TABLE IF NOT EXISTS biznesgo_sessions (
      id varchar(64) PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
      token_hash text NOT NULL,
      expires_at timestamp NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_sessions_merchant_idx ON biznesgo_sessions (merchant_id);
    CREATE INDEX IF NOT EXISTS biznesgo_sessions_expires_idx ON biznesgo_sessions (expires_at);

    CREATE TABLE IF NOT EXISTS biznesgo_products (
      id serial PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
      name varchar(200) NOT NULL,
      category varchar(64) DEFAULT 'general' NOT NULL,
      description text,
      price integer DEFAULT 0 NOT NULL,
      unit varchar(40) DEFAULT 'dona' NOT NULL,
      stock integer DEFAULT 0 NOT NULL,
      min_stock integer DEFAULT 5 NOT NULL,
      image_url text,
      status varchar(32) DEFAULT 'active' NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    ALTER TABLE biznesgo_products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0 NOT NULL;
    ALTER TABLE biznesgo_products ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 5 NOT NULL;
    ALTER TABLE biznesgo_products ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'active' NOT NULL;
    ALTER TABLE biznesgo_products ALTER COLUMN category SET DEFAULT 'general';
    CREATE INDEX IF NOT EXISTS biznesgo_products_merchant_idx ON biznesgo_products (merchant_id);
    CREATE INDEX IF NOT EXISTS biznesgo_products_merchant_status_idx ON biznesgo_products (merchant_id, status);
    CREATE INDEX IF NOT EXISTS biznesgo_products_merchant_category_idx ON biznesgo_products (merchant_id, category);

    CREATE TABLE IF NOT EXISTS biznesgo_customers (
      id serial PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
      name varchar(160) NOT NULL,
      phone varchar(32) NOT NULL,
      region varchar(100),
      district varchar(100),
      address text,
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_customers_merchant_idx ON biznesgo_customers (merchant_id);

    CREATE TABLE IF NOT EXISTS biznesgo_debts (
      id serial PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
      customer_id integer REFERENCES biznesgo_customers(id) ON DELETE SET NULL,
      customer_name varchar(160) NOT NULL,
      customer_phone varchar(32),
      description text,
      total_amount integer DEFAULT 0 NOT NULL,
      paid_amount integer DEFAULT 0 NOT NULL,
      due_date timestamp,
      status varchar(32) DEFAULT 'open' NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_debts_merchant_idx ON biznesgo_debts (merchant_id, status);

    CREATE TABLE IF NOT EXISTS biznesgo_debt_payments (
      id serial PRIMARY KEY NOT NULL,
      debt_id integer NOT NULL REFERENCES biznesgo_debts(id) ON DELETE CASCADE,
      amount integer DEFAULT 0 NOT NULL,
      payment_method varchar(32) DEFAULT 'cash' NOT NULL,
      note text,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_debt_payments_debt_idx ON biznesgo_debt_payments (debt_id);

    CREATE TABLE IF NOT EXISTS biznesgo_pos_sales (
      id serial PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
      customer_id integer REFERENCES biznesgo_customers(id) ON DELETE SET NULL,
      customer_name varchar(160),
      customer_phone varchar(32),
      total_amount integer DEFAULT 0 NOT NULL,
      discount integer DEFAULT 0 NOT NULL,
      payment_type varchar(32) DEFAULT 'cash' NOT NULL,
      status varchar(32) DEFAULT 'completed' NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_pos_sales_merchant_idx ON biznesgo_pos_sales (merchant_id, created_at);

    CREATE TABLE IF NOT EXISTS biznesgo_pos_sale_items (
      id serial PRIMARY KEY NOT NULL,
      sale_id integer NOT NULL REFERENCES biznesgo_pos_sales(id) ON DELETE CASCADE,
      product_id integer REFERENCES biznesgo_products(id) ON DELETE SET NULL,
      product_name varchar(200) NOT NULL,
      quantity integer DEFAULT 1 NOT NULL,
      unit_price integer DEFAULT 0 NOT NULL,
      total_amount integer DEFAULT 0 NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_pos_sale_items_sale_idx ON biznesgo_pos_sale_items (sale_id);

    CREATE TABLE IF NOT EXISTS biznesgo_orders (
      id serial PRIMARY KEY NOT NULL,
      merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
      customer_name varchar(160) NOT NULL,
      customer_phone varchar(32) NOT NULL,
      customer_telegram_id bigint,
      delivery_address text,
      total_amount integer DEFAULT 0 NOT NULL,
      status varchar(32) DEFAULT 'new' NOT NULL,
      notes text,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_orders_merchant_idx ON biznesgo_orders (merchant_id, status);

    CREATE TABLE IF NOT EXISTS biznesgo_order_items (
      id serial PRIMARY KEY NOT NULL,
      order_id integer NOT NULL REFERENCES biznesgo_orders(id) ON DELETE CASCADE,
      product_id integer REFERENCES biznesgo_products(id) ON DELETE SET NULL,
      product_name varchar(200) NOT NULL,
      quantity integer DEFAULT 1 NOT NULL,
      unit_price integer DEFAULT 0 NOT NULL,
      total_amount integer DEFAULT 0 NOT NULL
    );
    CREATE INDEX IF NOT EXISTS biznesgo_order_items_order_idx ON biznesgo_order_items (order_id);
  `);

  // Agar bazada @agroz_auth_bot orqali ro'yxatdan o'tgan specialists jadvali bo'lsa,
  // barcha ro'yxatdan o'tgan dorixona va mutaxassislarni avtomatik ravishda biznesgo_merchants ga ko'chiramiz:
  try {
    const specCheck = await db.execute(sql`SELECT to_regclass('public.specialists') AS spec_tbl`);
    const hasSpecialists = Boolean((specCheck as any)?.rows?.[0]?.spec_tbl);
    if (hasSpecialists) {
      await db.execute(sql`
        INSERT INTO biznesgo_merchants (
          telegram_id,
          phone,
          name,
          organization_name,
          merchant_type,
          address,
          latitude,
          longitude,
          working_hours,
          delivery_available,
          status,
          created_at,
          updated_at
        )
        SELECT
          s.telegram_id,
          s.phone,
          s.name,
          LEFT(COALESCE(NULLIF(TRIM(s.organization), ''), s.name || ' (' || CASE WHEN s.role = 'pharmacy' THEN 'Agro-dorixona' ELSE COALESCE(s.specialty, 'Mutaxassis') END || ')'), 200),
          CASE
            WHEN s.specialty ILIKE '%vet%' OR s.specialty ILIKE '%animal%' OR s.specialty ILIKE '%chorva%' OR s.organization ILIKE '%vet%' THEN 'veterinary_pharmacy'
            WHEN s.specialty ILIKE '%yem%' OR s.specialty ILIKE '%ozuqa%' OR s.organization ILIKE '%yem%' THEN 'feed_store'
            WHEN s.specialty ILIKE '%urug%' OR s.specialty ILIKE '%kochat%' THEN 'seed_seedling_store'
            WHEN s.specialty ILIKE '%ombor%' THEN 'warehouse'
            WHEN s.specialty ILIKE '%texnik%' OR s.specialty ILIKE '%jihoz%' THEN 'equipment_store'
            ELSE 'agro_shop'
          END,
          s.address,
          s.lat,
          s.lng,
          COALESCE(s.work_hours, '08:00 - 18:00'),
          true,
          CASE WHEN s.is_active = false THEN 'blocked' ELSE 'active' END,
          COALESCE(s.created_at, now()),
          COALESCE(s.updated_at, now())
        FROM specialists s
        WHERE s.telegram_id IS NOT NULL
        ON CONFLICT (telegram_id) DO UPDATE SET
          merchant_type = CASE
            WHEN EXCLUDED.organization_name ILIKE '%vet%' THEN 'veterinary_pharmacy'
            ELSE biznesgo_merchants.merchant_type
          END;
      `);

      // Eski ustunlar (stock_quantity, min_stock_level) mavjud bo'lsa, yangi stock, min_stock, status ustunlariga ko'chirish
      await db.execute(sql`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'biznesgo_products' AND column_name = 'stock_quantity'
          ) THEN
            ALTER TABLE biznesgo_products ALTER COLUMN stock_quantity SET DEFAULT 0;
            ALTER TABLE biznesgo_products ALTER COLUMN stock_quantity DROP NOT NULL;
            UPDATE biznesgo_products
            SET stock = COALESCE(stock_quantity, 0)
            WHERE stock = 0 AND COALESCE(stock_quantity, 0) > 0;
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'biznesgo_products' AND column_name = 'min_stock_level'
          ) THEN
            UPDATE biznesgo_products
            SET min_stock = COALESCE(min_stock_level, 5)
            WHERE min_stock IS NULL;
          END IF;
        END $$;

        UPDATE biznesgo_products
        SET category = CASE
          WHEN category = 'crop' THEN 'agro_chemicals'
          WHEN category = 'animal' THEN 'veterinary_products'
          WHEN category IS NULL OR category = '' THEN 'general'
          ELSE category
        END;

        UPDATE biznesgo_products
        SET status = CASE
          WHEN status = 'archived' THEN 'archived'
          WHEN stock <= 0 THEN 'out_of_stock'
          ELSE 'active'
        END;
      `);

      // specialist_medicines jadvalidan dorilarni biznesgo_products jadvaliga ko'chirish (agar hali ko'chirilmagan bo'lsa)
      await db.execute(sql`
        INSERT INTO biznesgo_products (
          merchant_id,
          name,
          category,
          unit,
          price,
          stock,
          min_stock,
          description,
          image_url,
          status,
          created_at,
          updated_at
        )
        SELECT
          bm.id,
          sm.name,
          CASE
            WHEN sm.type = 'crop' THEN 'agro_chemicals'
            WHEN sm.type = 'animal' THEN 'veterinary_products'
            ELSE 'general'
          END,
          COALESCE(NULLIF(sm.stock_unit, ''), 'dona'),
          COALESCE(sm.price, 0),
          COALESCE(sm.stock, 10),
          5,
          sm.usage,
          CASE WHEN length(COALESCE(sm.photo_data, '')) <= 300000 THEN sm.photo_data ELSE NULL END,
          CASE
            WHEN sm.status = 'yoq' OR COALESCE(sm.stock, 10) <= 0 THEN 'out_of_stock'
            ELSE 'active'
          END,
          COALESCE(sm.created_at, now()),
          COALESCE(sm.updated_at, now())
        FROM specialist_medicines sm
        JOIN specialists s ON s.id = sm.specialist_id
        JOIN biznesgo_merchants bm ON bm.telegram_id = s.telegram_id
        WHERE NOT EXISTS (
          SELECT 1 FROM biznesgo_products bp
          WHERE bp.merchant_id = bm.id AND bp.name = sm.name
        );
      `);
    }
  } catch (syncErr: any) {
    console.warn("[db] specialists -> biznesgo_merchants sinxronlash ogohlantirishi:", syncErr?.message || syncErr);
  }
}

/**
 * AgrozGO + BiznesGO — Database auto-migration / synchronization helper.
 * 1) Avvalo BiznesGO'ning 10 ta toza jadvalini (ensureBiznesGoSchema) yaratadi va mavjud specialists'ni ko'chiradi.
 * 2) Agar bazada AgrozGO'ning mavjud jadvallari (users, specialists) bo'lsa, ularning ustunlarini yangilaydi.
 */
export async function ensureSchema(): Promise<void> {
  try {
    // 0. BiznesGO toza jadvallarini yaratish va mavjud ro'yxatdan o'tganlarni ko'chirish
    await ensureBiznesGoSchema();

    // Agar yangi bo'sh BiznesGO bazasi bo'lsa (users jadvali yo'q bo'lsa), eski jadvallarni ko'chirmaymiz
    const legacyCheck = await db.execute(sql`SELECT to_regclass('public.users') AS users_table`);
    const hasLegacyTables = Boolean((legacyCheck as any)?.rows?.[0]?.users_table);
    if (!hasLegacyTables || process.env.BIZNESGO_CLEAN_DB === "true") {
      console.log("[db] ensureSchema: Toza BiznesGO sxemasi (10 ta jadval) muvaffaqiyatli tekshirildi/yaratildi.");
      return;
    }

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

    // 1b. Sessions jadvali uchun expires_at ustuni va eski muddatsiz/demo tokenlarni bekor qilish
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'sessions' AND column_name = 'expires_at'
        ) THEN
          ALTER TABLE sessions ADD COLUMN expires_at timestamp;
          DELETE FROM sessions WHERE expires_at IS NULL;
          ALTER TABLE sessions ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');
          ALTER TABLE sessions ALTER COLUMN expires_at SET NOT NULL;
        END IF;
      END $$;
      DELETE FROM sessions
      WHERE expires_at IS NULL
         OR expires_at <= now()
         OR id IN ('biz_demo_pharmacy', 'biz_demo_specialist');
      CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
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
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS contract_accepted_at timestamp;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS trial_ends_at timestamp;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS subscription_status varchar(32) DEFAULT 'trial' NOT NULL;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS paid_until timestamp;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS trial_warning_sent_at timestamp;
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS password_hash varchar(255);
      ALTER TABLE specialists ADD COLUMN IF NOT EXISTS login varchar(64);
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



