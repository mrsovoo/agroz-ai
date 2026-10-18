-- ===========================================================================
-- BiznesGO B2B — sxema (idempotent, xavfsiz)
--
-- QOIDALAR:
--   * Mavjud `users`, `orders` va boshqa jadvallarga TEGILMAYDI.
--   * Faqat CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS ishlatiladi.
--   * DROP / TRUNCATE / DELETE yo'q. Qayta-qayta ishga tushirish xavfsiz.
-- ===========================================================================

-- 1) MERCHANTS — sotuvchi (do'kon egasi). users(id) bilan 1:1 bog'langan.
CREATE TABLE IF NOT EXISTS merchants (
  id                 SERIAL PRIMARY KEY,
  user_id            INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  store_name         VARCHAR(160) NOT NULL,
  phone              VARCHAR(32)  NOT NULL,
  business_type      VARCHAR(20)  NOT NULL
                     CHECK (business_type IN ('agro_vet','feed','warehouse','seeds','machinery')),
  address            TEXT,
  lat                DOUBLE PRECISION CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng                DOUBLE PRECISION CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  location           POINT,                       -- (lng, lat) — AgrozGO geo-search
  delivery_available BOOLEAN   NOT NULL DEFAULT false,
  is_active          BOOLEAN   NOT NULL DEFAULT true,
  password_hash      TEXT,                        -- Web login (scrypt). Telegram uchun shart emas
  created_at         TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent'),
  updated_at         TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent'),
  subscription_until TIMESTAMP,
  is_archived        BOOLEAN   NOT NULL DEFAULT false,
  archived_at        TIMESTAMP
);
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMP;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS merchants_phone_uq  ON merchants (phone);
CREATE INDEX        IF NOT EXISTS merchants_geo_idx   ON merchants (lat, lng) WHERE is_active;
CREATE INDEX        IF NOT EXISTS merchants_archived_idx ON merchants (is_archived);

-- 2) PRODUCTS — ombor / katalog
CREATE TABLE IF NOT EXISTS products (
  id                SERIAL PRIMARY KEY,
  merchant_id       INT NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  name              VARCHAR(200) NOT NULL,
  category          VARCHAR(100),
  price             DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  unit              VARCHAR(16)  NOT NULL DEFAULT 'dona'
                    CHECK (unit IN ('dona','kg','liter','qop','tonna','pachka','metr')),
  stock_quantity    DECIMAL(14,3) NOT NULL DEFAULT 0,
  min_stock_alert   DECIMAL(14,3) NOT NULL DEFAULT 5,
  image_url         TEXT,
  batch_number      VARCHAR(64),                  -- agro_vet / seeds
  expiry_date       DATE,                         -- agro_vet / seeds
  wholesale_price   DECIMAL(14,2) CHECK (wholesale_price IS NULL OR wholesale_price >= 0), -- warehouse
  wholesale_min_qty DECIMAL(14,3),                -- shu miqdordan boshlab ulgurji narx
  bag_weight_kg     DECIMAL(10,2),                -- feed: 1 qopning vazni (kg)
  variety           VARCHAR(100),                 -- seeds: navi (sort)
  ripening_period   VARCHAR(50),                  -- seeds: pishish muddati
  season            VARCHAR(50),                  -- seeds: mavsumiylik
  model             VARCHAR(100),                 -- machinery: modeli
  serial_number     VARCHAR(100),                 -- machinery: seriya raqami (S/N)
  warranty_months   INT,                          -- machinery: kafolat muddati (oylarda)
  is_active         BOOLEAN   NOT NULL DEFAULT true,
  created_at        TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent'),
  updated_at        TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')
);
CREATE INDEX IF NOT EXISTS products_merchant_idx ON products (merchant_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS products_expiry_idx   ON products (merchant_id, expiry_date)
  WHERE is_active AND expiry_date IS NOT NULL;

-- 3) CUSTOMERS — CRM
CREATE TABLE IF NOT EXISTS customers (
  id          SERIAL PRIMARY KEY,
  merchant_id INT NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  full_name   VARCHAR(160) NOT NULL,
  phone       VARCHAR(32),
  address     TEXT,
  total_debt  DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')
);
CREATE INDEX        IF NOT EXISTS customers_merchant_idx ON customers (merchant_id);
CREATE UNIQUE INDEX IF NOT EXISTS customers_merchant_phone_uq
  ON customers (merchant_id, phone) WHERE phone IS NOT NULL;

-- 4) SALES — POS sotuvlari va AgrozGO buyurtmalari (source='agrozgo')
CREATE TABLE IF NOT EXISTS sales (
  id               SERIAL PRIMARY KEY,
  merchant_id      INT NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  customer_id      INT REFERENCES customers(id) ON DELETE SET NULL,
  payment_type     VARCHAR(10) NOT NULL CHECK (payment_type IN ('cash','card','debt')),
  total_amount     DECIMAL(14,2) NOT NULL CHECK (total_amount >= 0),
  discount_amount  DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  source           VARCHAR(10) NOT NULL DEFAULT 'pos' CHECK (source IN ('pos','agrozgo')),
  -- AgrozGO bridge uchun qo'shimcha maydonlar:
  status           VARCHAR(12) NOT NULL DEFAULT 'completed'
                   CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  external_ref     VARCHAR(64),                   -- AgrozGO tomonidagi buyurtma ID
  customer_name    VARCHAR(160),
  customer_phone   VARCHAR(32),
  delivery_address TEXT,
  note             TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent'),
  updated_at       TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')
);
CREATE INDEX        IF NOT EXISTS sales_merchant_created_idx ON sales (merchant_id, created_at DESC);
CREATE INDEX        IF NOT EXISTS sales_customer_idx         ON sales (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS sales_external_ref_uq
  ON sales (merchant_id, external_ref) WHERE external_ref IS NOT NULL;

-- 5) SALE_ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
  id           SERIAL PRIMARY KEY,
  sale_id      INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity     DECIMAL(14,3) NOT NULL CHECK (quantity > 0),
  unit_price   DECIMAL(14,2) NOT NULL CHECK (unit_price >= 0),
  product_name VARCHAR(200)                       -- sotuv paytidagi nom (snapshot)
);
CREATE INDEX IF NOT EXISTS sale_items_sale_idx    ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS sale_items_product_idx ON sale_items (product_id);

-- 6) DEBTS — Qarz daftari
CREATE TABLE IF NOT EXISTS debts (
  id          SERIAL PRIMARY KEY,
  merchant_id INT NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  sale_id     INT REFERENCES sales(id) ON DELETE SET NULL,
  total_debt  DECIMAL(14,2) NOT NULL CHECK (total_debt > 0),
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  status      VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','partial','paid')),
  due_date    DATE,
  created_at  TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent'),
  CONSTRAINT debts_paid_le_total CHECK (paid_amount <= total_debt)
);
CREATE INDEX IF NOT EXISTS debts_merchant_status_idx ON debts (merchant_id, status);
CREATE INDEX IF NOT EXISTS debts_customer_idx        ON debts (customer_id);

-- 7) DEBT_PAYMENTS — to'lovlar tarixi (audit uchun)
CREATE TABLE IF NOT EXISTS debt_payments (
  id             SERIAL PRIMARY KEY,
  merchant_id    INT NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
  debt_id        INT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount         DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(10) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card')),
  note           TEXT,
  created_at     TIMESTAMP NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')
);
CREATE INDEX IF NOT EXISTS debt_payments_debt_idx ON debt_payments (debt_id);

-- Mavjud jadvallarga yangi ustunlar (idempotent patch)
ALTER TABLE products ADD COLUMN IF NOT EXISTS bag_weight_kg DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variety VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ripening_period VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS season VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_months INT;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS warranty_months INT;
