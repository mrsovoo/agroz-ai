-- 3-BOSQICH: BiznesGO Mahsulot Katalogi va Ombor Qoldig'i (biznesgo_products)
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

