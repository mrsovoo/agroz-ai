-- BiznesGO toza sxemasi (10 ta jadval) — idempotent migratsiya

-- 1. Sotuvchilar (biznesgo_merchants)
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

-- 2. Xavfsiz sessiyalar (biznesgo_sessions)
CREATE TABLE IF NOT EXISTS biznesgo_sessions (
  id varchar(64) PRIMARY KEY NOT NULL,
  merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS biznesgo_sessions_merchant_idx ON biznesgo_sessions (merchant_id);
CREATE INDEX IF NOT EXISTS biznesgo_sessions_expires_idx ON biznesgo_sessions (expires_at);

-- 3. Mahsulotlar katalogi (biznesgo_products)
CREATE TABLE IF NOT EXISTS biznesgo_products (
  id serial PRIMARY KEY NOT NULL,
  merchant_id integer NOT NULL REFERENCES biznesgo_merchants(id) ON DELETE CASCADE,
  name varchar(200) NOT NULL,
  category varchar(100),
  unit varchar(40) DEFAULT 'dona' NOT NULL,
  price integer DEFAULT 0 NOT NULL,
  cost_price integer DEFAULT 0,
  stock_quantity integer DEFAULT 0 NOT NULL,
  min_stock_level integer DEFAULT 5,
  barcode varchar(64),
  description text,
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS biznesgo_products_merchant_idx ON biznesgo_products (merchant_id);

-- 4. Doimiy mijozlar (biznesgo_customers)
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

-- 5. Qarz daftari (biznesgo_debts)
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

-- 6. Qarz to'lovlari tarixi (biznesgo_debt_payments)
CREATE TABLE IF NOT EXISTS biznesgo_debt_payments (
  id serial PRIMARY KEY NOT NULL,
  debt_id integer NOT NULL REFERENCES biznesgo_debts(id) ON DELETE CASCADE,
  amount integer DEFAULT 0 NOT NULL,
  payment_method varchar(32) DEFAULT 'cash' NOT NULL,
  note text,
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS biznesgo_debt_payments_debt_idx ON biznesgo_debt_payments (debt_id);

-- 7. Tezkor Kassa / POS sotuvlari (biznesgo_pos_sales)
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

-- 8. POS sotuv tarkibidagi mahsulotlar (biznesgo_pos_sale_items)
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

-- 9. Onlayn buyurtmalar (biznesgo_orders)
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

-- 10. Buyurtma tarkibidagi mahsulotlar (biznesgo_order_items)
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
