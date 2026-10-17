-- 4A-BOSQICH: BiznesGO Mijozlar Bazasi va Qarz Daftari
ALTER TABLE biznesgo_customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE biznesgo_customers ADD COLUMN IF NOT EXISTS note text;
ALTER TABLE biznesgo_customers ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false NOT NULL;

ALTER TABLE biznesgo_debts ALTER COLUMN customer_name DROP NOT NULL;
CREATE INDEX IF NOT EXISTS biznesgo_debts_merchant_due_idx ON biznesgo_debts (merchant_id, due_date);
CREATE INDEX IF NOT EXISTS biznesgo_debts_customer_idx ON biznesgo_debts (merchant_id, customer_id);

ALTER TABLE biznesgo_debt_payments ADD COLUMN IF NOT EXISTS merchant_id integer REFERENCES biznesgo_merchants(id) ON DELETE CASCADE;
UPDATE biznesgo_debt_payments bdp
SET merchant_id = bd.merchant_id
FROM biznesgo_debts bd
WHERE bdp.debt_id = bd.id AND bdp.merchant_id IS NULL;

CREATE INDEX IF NOT EXISTS biznesgo_debt_payments_merchant_idx ON biznesgo_debt_payments (merchant_id);
