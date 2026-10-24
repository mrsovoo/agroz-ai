-- BiznesGO B2B Core Database Schema (PostgreSQL)
-- Barcha 5 ta sektor uchun universal ko'p ijarali (Multi-tenant) ERP & Kassa arxitekturasi
-- Sektorlar:
--   1. agro_vet                (Agro-Vet Dorixona)
--   2. feed_nutrition          (Yem va Ozuqa)
--   3. seeds_seedlings         (Urug' va Ko'chat)
--   4. greenhouse_livestock_eq (Issiqxona va Chorva Jihozlari)
--   5. agro_machinery          (Agro va Chorva Texnikalari)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TENANT & ACCESS CORE (Ko'p ijarali korxonalar, filiallar, xodimlar, rollar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    phone VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(120),
    tax_id VARCHAR(50),                     -- INN / Soliq raqami
    address TEXT,
    logo_url TEXT,
    sector_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet' CHECK (
        sector_type IN ('agro_vet', 'feed_nutrition', 'seeds_seedlings', 'greenhouse_livestock_eq', 'agro_machinery')
    ),
    plan VARCHAR(30) NOT NULL DEFAULT 'standard',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_phone ON tenants(phone);
CREATE INDEX IF NOT EXISTS idx_tenants_sector ON tenants(sector_type);

-- Backward compatibility: Merchants jadvali (mavjud kodlar buzilmasligi uchun)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    phone VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    business_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet',
    address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS business_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Filiallar
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    phone VARCHAR(30),
    address TEXT,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);

-- Rollar va Ruxsatlar
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,              -- owner, manager, cashier, warehouse, accountant
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,      -- sales.create, inventory.receive, debts.manage, etc.
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Xodimlar / Foydalanuvchilar
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    phone VARCHAR(30) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_code VARCHAR(50) NOT NULL DEFAULT 'cashier' CHECK (
        role_code IN ('owner', 'manager', 'cashier', 'warehouse', 'accountant')
    ),
    password_hash VARCHAR(255),
    telegram_chat_id VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_phone ON users(tenant_id, phone);

-- ============================================================================
-- 2. MASTER DATA CORE (O'lchov birliklari, toifalar, mahsulotlar, variantlar, supplierlar)
-- ============================================================================

-- O'lchov birliklari
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,              -- dona, kg, litr, qop, metr, m2, komplekt, tonna
    code VARCHAR(20) NOT NULL,
    base_ratio NUMERIC(12, 4) DEFAULT 1.0,  -- masalan: 1 qop = 50 kg
    is_base BOOLEAN DEFAULT TRUE
);

-- Mahsulot toifalari
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sector_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet',
    name VARCHAR(150) NOT NULL,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prod_categories_tenant ON product_categories(tenant_id, sector_type);

-- Mahsulotlar (Barcha 5 sektor uchun yagona jadval)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE, -- orqaga moslik
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    category VARCHAR(100) DEFAULT 'Umumiy',
    brand VARCHAR(150),
    unit VARCHAR(30) DEFAULT 'dona',
    image_url TEXT,
    description TEXT,
    cost_price NUMERIC(15, 2) DEFAULT 0 CHECK (cost_price >= 0),
    price NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    min_stock NUMERIC(12, 2) DEFAULT 5,
    reorder_level NUMERIC(12, 2) DEFAULT 10,
    is_out_of_stock BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sector_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet',
    -- Sektorga xos xususiyatlar (JSONB)
    sector_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Agro-Vet va dori/urug' partiyalari uchun to'g'ridan-to'g'ri maydonlar
    active_ingredient VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Umumiy';
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(150);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(30) DEFAULT 'dona';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock NUMERIC(12, 2) DEFAULT 5;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level NUMERIC(12, 2) DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sector_type VARCHAR(50) NOT NULL DEFAULT 'agro_vet';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sector_attributes JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_ingredient VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage_form VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_condition VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sector ON products(sector_type);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);

-- Mahsulot variantlari (Qadoq 1kg/5kg/25kg, model, hajm)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    variant_name VARCHAR(150) NOT NULL,
    attribute_type VARCHAR(50) NOT NULL,    -- package_size, volume, model, color
    attribute_value VARCHAR(100) NOT NULL,
    cost_price NUMERIC(15, 2) DEFAULT 0,
    price NUMERIC(15, 2) NOT NULL,
    stock NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Yetkazib beruvchilar (Suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120),
    inn VARCHAR(50),
    address TEXT,
    debt_balance NUMERIC(15, 2) DEFAULT 0,  -- Bizning supplierdan qarzimiz
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);

-- Omborlar
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    type VARCHAR(30) NOT NULL DEFAULT 'main' CHECK (type IN ('main', 'store', 'branch', 'transit')),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON warehouses(tenant_id);

-- ============================================================================
-- 3. INVENTORY & WAREHOUSE CORE (Partiyalar, qoldiqlar, harakatlar)
-- ============================================================================

-- Partiyalar (FEFO va Recall uchun alohida)
CREATE TABLE IF NOT EXISTS stock_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    production_date DATE,
    expiry_date DATE,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    cost_price NUMERIC(15, 2) DEFAULT 0,
    is_recalled BOOLEAN DEFAULT FALSE,
    recall_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_batches_expiry ON stock_batches(product_id, expiry_date);

-- Ombor harakatlari (Kirim, Chiqim, Ko'chirish, Inventarizatsiya, Qaytarish, Yo'qotish)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    target_warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES stock_batches(id) ON DELETE SET NULL,
    movement_type VARCHAR(30) NOT NULL CHECK (
        movement_type IN ('receipt', 'issue', 'transfer_in', 'transfer_out', 'inventory_adj', 'customer_return', 'supplier_return', 'loss_writeoff')
    ),
    document_no VARCHAR(100),
    quantity NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(15, 2) DEFAULT 0,
    reference_type VARCHAR(50),             -- 'sale', 'purchase', 'manual', 'audit'
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_movements_tenant ON inventory_movements(tenant_id, created_at DESC);

-- Omborlardagi aniq qoldiqlar
CREATE TABLE IF NOT EXISTS stock_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reserved_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id)
);

-- ============================================================================
-- 4. CUSTOMER & DEBT CORE (Fermerlar, do'konlar, qarz daftari)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE, -- orqaga moslik
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    customer_type VARCHAR(30) DEFAULT 'fermer' CHECK (
        customer_type IN ('fermer', 'dookon', 'ferma', 'kooperativ', 'korxona', 'yakka')
    ),
    farm_profile VARCHAR(255),               -- Chorva, issiqxona, ekin maydoni
    credit_limit NUMERIC(15, 2) DEFAULT 10000000,
    debt_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type VARCHAR(30) DEFAULT 'fermer';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS farm_profile VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(15, 2) DEFAULT 10000000;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS debt_balance NUMERIC(15, 2) NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID,
    initial_amount NUMERIC(15, 2) NOT NULL CHECK (initial_amount > 0),
    remaining_amount NUMERIC(15, 2) NOT NULL CHECK (remaining_amount >= 0),
    due_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'partially_paid', 'overdue', 'closed', 'written_off')
    ),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_debts_customer ON debts(customer_id, status);

CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    debt_id UUID REFERENCES debts(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) DEFAULT 'cash',
    receipt_no VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orqaga moslik uchun debt_transactions
CREATE TABLE IF NOT EXISTS debt_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    sale_id UUID,
    type VARCHAR(20) NOT NULL CHECK (type IN ('incurred', 'repayment')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. SALES & POS CORE (Kassa, smenalar, sotuvlar, to'lovlar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_cash NUMERIC(15, 2) DEFAULT 0,
    closing_cash NUMERIC(15, 2) DEFAULT 0,
    system_cash NUMERIC(15, 2) DEFAULT 0,
    cash_difference NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE, -- orqaga moslik
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('cash', 'card', 'debt', 'mixed')),
    cash_amount NUMERIC(15, 2) DEFAULT 0,
    card_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS card_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS debt_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES stock_batches(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(30) DEFAULT 'dona',
    price NUMERIC(15, 2) NOT NULL,
    cost_price NUMERIC(15, 2) DEFAULT 0,
    discount NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL,
    sector_attributes JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS batch_id UUID;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS active_ingredient VARCHAR(255);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100);
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS unit VARCHAR(30) DEFAULT 'dona';
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS discount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS sector_attributes JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'success',
    transaction_ref VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 6. PURCHASING & SUPPLIER CORE (Procure-to-pay xaridlar, kirimlar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    order_number VARCHAR(100) NOT NULL,
    invoice_number VARCHAR(100),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(15, 2) DEFAULT 0,
    debt_amount NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'received' CHECK (
        status IN ('ordered', 'received', 'partially_received', 'cancelled')
    ),
    purchase_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100),
    expiry_date DATE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(15, 2) NOT NULL,
    received_quantity NUMERIC(12, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 7. CASH & FINANCE CORE (Kassalar, pul harakati, hisobotlar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,              -- Asosiy kassa, Kassir 1, Bank hisob raqami
    account_type VARCHAR(30) NOT NULL DEFAULT 'cash' CHECK (
        account_type IN ('cash', 'cashier_register', 'bank', 'online')
    ),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'UZS',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(40) NOT NULL CHECK (
        transaction_type IN ('income', 'expense', 'transfer_in', 'transfer_out', 'customer_debt_payment', 'supplier_payment')
    ),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    related_account_id UUID REFERENCES cash_accounts(id) ON DELETE SET NULL,
    reference_type VARCHAR(50),             -- 'sale', 'debt_payment', 'purchase', 'operational_expense'
    reference_id UUID,
    category VARCHAR(100),                  -- Ijara, Oylik, Kommunal, Logistika
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. NOTIFICATION CORE (Ogohlantirishlar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL CHECK (
        type IN ('stock_out', 'low_stock', 'fefo_expiry', 'debt_due', 'debt_overdue', 'goods_receipt', 'shift_closed', 'system')
    ),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_read ON notifications(tenant_id, is_read, created_at DESC);

-- ============================================================================
-- 9. SETTINGS & AUDIT CORE (Sozlamalar va Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,           -- 'product.created', 'sale.checkout', 'debt.repay', 'price.updated'
    entity_type VARCHAR(50) NOT NULL,       -- 'product', 'sale', 'customer', 'inventory'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);

-- Idempotent migrations for Agro-Vet Pilot fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS dosage_form VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS storage_condition VARCHAR(255);
ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS recalled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE stock_batches ADD COLUMN IF NOT EXISTS production_date DATE;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS disposal_method VARCHAR(100);
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS protocol_number VARCHAR(100);

-- Neon DB'da oldindan merchants jadvalida ro'yxatdan o'tgan foydalanuvchilarni tenants jadvaliga ko'chirish va bog'lash
INSERT INTO tenants (id, name, phone, address, sector_type, created_at)
SELECT id, name, phone, address, 
       CASE WHEN business_type IN ('agro_vet', 'feed_nutrition', 'seeds_seedlings', 'greenhouse_livestock_eq', 'agro_machinery') THEN business_type ELSE 'agro_vet' END,
       COALESCE(created_at, CURRENT_TIMESTAMP)
FROM merchants
ON CONFLICT (phone) DO NOTHING;

UPDATE merchants m
SET tenant_id = t.id
FROM tenants t
WHERE m.phone = t.phone AND m.tenant_id IS NULL;

UPDATE products p
SET tenant_id = m.tenant_id
FROM merchants m
WHERE p.merchant_id = m.id AND p.tenant_id IS NULL;

UPDATE customers c
SET tenant_id = m.tenant_id
FROM merchants m
WHERE c.merchant_id = m.id AND c.tenant_id IS NULL;

UPDATE sales s
SET tenant_id = m.tenant_id
FROM merchants m
WHERE s.merchant_id = m.id AND s.tenant_id IS NULL;


