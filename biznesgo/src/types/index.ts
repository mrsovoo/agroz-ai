export type BusinessType = 'agro_vet' | 'feed' | 'warehouse' | 'seeds' | 'machinery';

export type UnitType = 'dona' | 'kg' | 'liter' | 'qop' | 'tonna' | 'pachka' | 'metr' | 'gram' | 'tup';

export type ViewType = 'dashboard' | 'pos' | 'products' | 'debts' | 'settings';

export interface Merchant {
  id: number;
  user_id: number;
  store_name: string;
  phone: string;
  business_type: BusinessType;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  delivery_available?: boolean;
  is_active: boolean;
  created_at: string;
  has_password?: boolean;
}

export interface Product {
  id: number;
  merchant_id: number;
  name: string;
  category?: string;
  price: number;
  cost_price?: number;
  unit: string;
  stock_quantity: number;
  min_stock_alert?: number;
  image_url?: string;
  barcode?: string;
  sku?: string;
  batch_number?: string;
  expiry_date?: string;
  wholesale_price?: number;
  wholesale_min_qty?: number;
  min_wholesale_quantity?: number;
  bag_weight_kg?: number;
  variety?: string;
  germination_rate_percent?: number;
  harvest_year?: number;
  ripening_period?: string;
  season?: string;
  model?: string;
  part_number?: string;
  serial_number?: string;
  warranty_months?: number;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  stock_status?: 'in' | 'low' | 'out';
  days_to_expiry?: number | null;
}

export interface Customer {
  id: number;
  merchant_id: number;
  full_name: string;
  phone?: string;
  address?: string;
  total_debt: number;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  unit?: string;
  warranty_months?: number | null;
}

export interface Sale {
  id: number;
  merchant_id: number;
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  payment_type: 'cash' | 'card' | 'debt';
  total_amount: number;
  discount_amount?: number;
  source?: 'pos' | 'agrozgo';
  status?: 'completed' | 'pending' | 'accepted' | 'rejected' | 'cancelled';
  note?: string;
  created_at: string;
  items?: SaleItem[];
  debt?: Debt | null;
}

export interface Debt {
  id: number;
  merchant_id: number;
  customer_id?: number;
  sale_id?: number | null;
  total_amount: number;
  total_debt?: number;
  paid_amount: number;
  remaining_amount: number;
  remaining?: number;
  status: 'unpaid' | 'partial' | 'paid';
  due_date?: string | null;
  created_at: string;
  is_overdue?: boolean;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

export interface DebtorSummary {
  customer_id: number;
  full_name: string;
  phone?: string;
  total_debt: number;
  open_debts: number;
  nearest_due_date?: string | null;
  has_overdue: boolean;
  last_debt_at: string;
}

export interface CartItem {
  product_id: number;
  product: Product;
  quantity: number;
  unit_price: number;
  is_wholesale?: boolean;
}

export interface BusinessTypeMeta {
  label: string;
  icon: string;
  units: UnitType[];
  defaultUnit: UnitType;
  categories: string[];
  fields: {
    batch_number?: boolean;
    expiry_date?: boolean;
    wholesale?: boolean;
    bag_weight_kg?: boolean;
    variety?: boolean;
    ripening_period?: boolean;
    season?: boolean;
    model?: boolean;
    serial_number?: boolean;
    warranty_months?: boolean;
  };
  expiryLabel?: string;
}
