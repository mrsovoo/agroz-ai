-- BiznesGO (B2B) Phase 1: Agro-Vet Sector Schema (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Merchants (Do'kon egalari - Faqat Agro-Vet)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    business_type VARCHAR(20) NOT NULL DEFAULT 'agro_vet' CHECK (business_type = 'agro_vet'),
    address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products (Agro-Vet mahsulotlar: dori, premiks, o'g'it)
-- Majburiy maydonlar: expiry_date, batch_number, active_ingredient, image_url
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Agro-Vet Dori',
    active_ingredient VARCHAR(255) NOT NULL, -- Faol moddasi va dozasi (masalan: Oksitetratsiklin 200mg/ml)
    batch_number VARCHAR(100) NOT NULL,      -- Partiya yoki seriya raqami
    expiry_date DATE NOT NULL,               -- Yaroqlilik muddati
    image_url TEXT NOT NULL,                 -- Mahsulot rasmi (Majburiy)
    barcode VARCHAR(100),
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    cost_price NUMERIC(15, 2) DEFAULT 0 CHECK (cost_price >= 0),
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock NUMERIC(12, 2) DEFAULT 5,
    is_out_of_stock BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_merchant_expiry ON products(merchant_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_merchant_stock ON products(merchant_id, stock);

-- 3. Customers (Qarzdor fermer/chorvadorlar - Ekin yoki chorva profili bilan)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    farm_profile VARCHAR(255),               -- Ekin yoki chorva profili (masalan: 50 bosh qoramol, 10 ga bug'doy)
    debt_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    due_date DATE,                           -- Qarzni qaytarish qat'iy muddati
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_merchant ON customers(merchant_id);

-- 4. Sales (Kassa tranzaksiyalari)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('cash', 'card', 'debt', 'mixed')),
    cash_amount NUMERIC(15, 2) DEFAULT 0,
    card_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_merchant_date ON sales(merchant_id, created_at DESC);

-- 5. Sale Items (Chek tarkibidagi tovarlar)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255),
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    price NUMERIC(15, 2) NOT NULL,
    total NUMERIC(15, 2) NOT NULL
);

-- 6. Debt Transactions (Qarz harakatlari tarixi)
CREATE TABLE IF NOT EXISTS debt_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('incurred', 'repayment')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_debt_tx_customer ON debt_transactions(customer_id, created_at DESC);
