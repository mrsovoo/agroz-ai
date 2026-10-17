-- BiznesGO 4B-Bosqich: Tezkor Kassa (POS) jadvallarini yangilash
ALTER TABLE "biznesgo_pos_sales" ADD COLUMN IF NOT EXISTS "discount_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "biznesgo_pos_sales" ADD COLUMN IF NOT EXISTS "final_amount" integer DEFAULT 0 NOT NULL;
ALTER TABLE "biznesgo_pos_sales" ADD COLUMN IF NOT EXISTS "payment_method" varchar(32) DEFAULT 'cash' NOT NULL;
ALTER TABLE "biznesgo_pos_sales" ADD COLUMN IF NOT EXISTS "debt_id" integer REFERENCES "biznesgo_debts"("id") ON DELETE SET NULL;
ALTER TABLE "biznesgo_pos_sales" ADD COLUMN IF NOT EXISTS "note" text;
ALTER TABLE "biznesgo_pos_sales" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE INDEX IF NOT EXISTS "biznesgo_pos_sales_merchant_status_idx" ON "biznesgo_pos_sales" ("merchant_id", "status");
CREATE INDEX IF NOT EXISTS "biznesgo_pos_sales_merchant_customer_idx" ON "biznesgo_pos_sales" ("merchant_id", "customer_id");

ALTER TABLE "biznesgo_pos_sale_items" ADD COLUMN IF NOT EXISTS "merchant_id" integer REFERENCES "biznesgo_merchants"("id") ON DELETE CASCADE;
ALTER TABLE "biznesgo_pos_sale_items" ADD COLUMN IF NOT EXISTS "unit" varchar(40) DEFAULT 'dona' NOT NULL;
CREATE INDEX IF NOT EXISTS "biznesgo_pos_sale_items_merchant_idx" ON "biznesgo_pos_sale_items" ("merchant_id");

