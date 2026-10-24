export type BusinessType = 'agro_vet';

export interface Product {
  id: string;
  name: string;
  category: string;
  active_ingredient: string; // Majburiy: Faol moddasi va dozasi
  batch_number: string;      // Majburiy: Partiya yoki seriya
  expiry_date: string;       // Majburiy: YYYY-MM-DD
  image_url: string;         // Majburiy: Rasm URL
  barcode?: string;
  price: number;
  cost_price?: number;
  stock: number;
  min_stock: number;
  is_out_of_stock: boolean;
  days_to_expiry?: number;
  expiry_status?: 'expired' | 'critical' | 'warning' | 'normal';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  farm_profile?: string;     // Ekin yoki chorva profili (fermer/chorvador)
  debt_balance: number;      // Serverda PostgreSQL da hisoblanadi
  due_date?: string;         // Qarzni qaytarish qat'iy muddati
  notes?: string;
  status?: 'overdue' | 'urgent' | 'normal';
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

export interface DashboardMetrics {
  today_revenue: number;
  cash_revenue: number;
  card_revenue: number;
  debt_revenue: number;
  total_receipts: number;
  critical_expiry_count: number;
  out_of_stock_count: number;
  low_stock_count: number;
  total_debt: number;
  debtor_count: number;
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
