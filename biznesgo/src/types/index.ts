export type SectorType = 
  | 'agro_vet' 
  | 'feed_nutrition' 
  | 'seeds_seedlings' 
  | 'greenhouse_livestock_eq' 
  | 'agro_machinery';

export type BusinessType = SectorType;

export interface SectorMeta {
  id: SectorType;
  code: SectorType;
  name: string;
  subtitle: string;
  icon: string;
  defaultUnits: string[];
  categories: string[];
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  category: string;
  brand?: string;
  unit?: string;
  sector_type?: SectorType;
  sector_attributes?: Record<string, any>;
  
  // Agro-Vet & partiyalar
  active_ingredient?: string;
  dosage_form?: string;
  storage_condition?: string;
  batch_number?: string;
  production_date?: string;
  expiry_date?: string;
  image_url: string;
  
  price: number;
  cost_price?: number;
  stock: number;
  min_stock: number;
  reorder_level?: number;
  is_out_of_stock: boolean;
  days_to_expiry?: number;
  expiry_status?: 'expired' | 'critical' | 'warning' | 'normal';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  customer_type?: 'fermer' | 'dookon' | 'ferma' | 'kooperativ' | 'korxona' | 'yakka';
  farm_profile?: string;
  credit_limit?: number;
  debt_balance: number;
  due_date?: string;
  notes?: string;
  status?: 'overdue' | 'urgent' | 'normal' | 'closed';
}

export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  receipt_number: string;
  total_amount: number;
  payment_type: 'cash' | 'card' | 'debt' | 'mixed';
  cash_amount: number;
  card_amount: number;
  debt_amount: number;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  farm_profile?: string;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  type: 'main' | 'store' | 'branch' | 'transit';
  address?: string;
  is_active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  inn?: string;
  address?: string;
  debt_balance: number;
  notes?: string;
}

export interface CashAccount {
  id: string;
  name: string;
  account_type: 'cash' | 'cashier_register' | 'bank' | 'online';
  balance: number;
  currency: string;
}

export interface DashboardMetrics {
  today_revenue: number;
  cash_revenue: number;
  card_revenue: number;
  debt_revenue: number;
  today_profit?: number;
  total_receipts: number;
  expired_count?: number;
  critical_7_count?: number;
  critical_expiry_count: number;
  warning_60_count?: number;
  warning_90_count?: number;
  out_of_stock_count: number;
  low_stock_count: number;
  total_debt: number;
  debtor_count: number;
  overdue_debt?: number;
  overdue_debtors_count?: number;
  urgent_debt?: number;
  sector_type?: SectorType;
  urgent_expiry_drugs: {
    id: string;
    name: string;
    active_ingredient?: string;
    batch_number: string;
    expiry_date: string;
    stock: number;
    price: number;
    days_to_expiry: number;
  }[];
}
