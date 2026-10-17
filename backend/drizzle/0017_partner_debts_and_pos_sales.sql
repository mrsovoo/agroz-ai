-- 0017_partner_debts_and_pos_sales.sql
-- BiznesGO: Qarz daftari (partner_debts, partner_debt_payments) va Tezkor Kassa (pos_sales, pos_sale_items) jadvallari

CREATE TABLE IF NOT EXISTS "partner_debts" (
  "id" serial PRIMARY KEY NOT NULL,
  "partner_id" integer NOT NULL,
  "customer_name" varchar(160) NOT NULL,
  "customer_phone" varchar(32),
  "customer_address" text,
  "kind" varchar(20) DEFAULT 'mijoz' NOT NULL,
  "credit_limit" integer DEFAULT 5000000 NOT NULL,
  "description" text,
  "total_amount" integer DEFAULT 0 NOT NULL,
  "paid_amount" integer DEFAULT 0 NOT NULL,
  "due_date" timestamp,
  "status" varchar(20) DEFAULT 'open' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "partner_debts_partner_idx" ON "partner_debts" ("partner_id", "status");

CREATE TABLE IF NOT EXISTS "partner_debt_payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "debt_id" integer NOT NULL,
  "amount" integer NOT NULL,
  "payment_method" varchar(20) DEFAULT 'cash' NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "partner_debt_payments_debt_idx" ON "partner_debt_payments" ("debt_id");

CREATE TABLE IF NOT EXISTS "pos_sales" (
  "id" serial PRIMARY KEY NOT NULL,
  "partner_id" integer NOT NULL,
  "customer_name" varchar(160) NOT NULL,
  "customer_phone" varchar(32),
  "total_amount" integer DEFAULT 0 NOT NULL,
  "discount" integer DEFAULT 0 NOT NULL,
  "payment_type" varchar(20) DEFAULT 'cash' NOT NULL,
  "status" varchar(20) DEFAULT 'completed' NOT NULL,
  "debt_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pos_sales_partner_idx" ON "pos_sales" ("partner_id", "created_at");

CREATE TABLE IF NOT EXISTS "pos_sale_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "sale_id" integer NOT NULL,
  "medicine_id" integer NOT NULL,
  "medicine_name" varchar(160),
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit_price" integer DEFAULT 0 NOT NULL,
  "total_amount" integer DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS "pos_sale_items_sale_idx" ON "pos_sale_items" ("sale_id");

