import { Product, Customer, DashboardMetrics } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_BASE = `${BASE_URL}/api/biznesgo`;

export function formatUZS(val: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0)) + " so'm";
}

export const api = {
  // 1. Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/dashboard/metrics`);
    if (!res.ok) throw new Error('Dashboard ma\'lumotlarini yuklab bo\'lmadi');
    return res.json();
  },

  async getSalesHistory(): Promise<{ sales: any[] }> {
    const res = await fetch(`${API_BASE}/sales/history`);
    if (!res.ok) throw new Error('Sotuvlar tarixini yuklab bo\'lmadi');
    return res.json();
  },

  // 2. Mahsulotlar (Agro-Vet)
  async getProducts(search?: string, filter?: string): Promise<{ products: Product[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (filter) params.append('filter', filter);
    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    if (!res.ok) throw new Error('Mahsulotlarni yuklab bo\'lmadi');
    return res.json();
  },

  async createProduct(data: {
    name: string;
    category: string;
    active_ingredient: string; // Majburiy
    batch_number: string;      // Majburiy
    expiry_date: string;       // Majburiy
    image_url: string;         // Majburiy
    barcode?: string;
    price: number;
    cost_price?: number;
    stock: number;
    min_stock?: number;
  }): Promise<{ product: Product; message: string }> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Mahsulotni qo\'shib bo\'lmadi');
    return json;
  },

  // 3. Kassa (POS Checkout)
  async checkout(data: {
    items: { product_id: string; quantity: number }[];
    payment_type: 'cash' | 'card' | 'debt';
    cash_amount?: number;
    card_amount?: number;
    debt_amount?: number;
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    farm_profile?: string;
    due_date?: string;
    notes?: string;
  }): Promise<{ success: boolean; receipt_number: string; message: string }> {
    const res = await fetch(`${API_BASE}/sales/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Sotuvni yakunlab bo\'lmadi');
    return json;
  },

  // 4. Qarz Daftari (CRM)
  async getCustomers(): Promise<{ customers: Customer[] }> {
    const res = await fetch(`${API_BASE}/debts/customers`);
    if (!res.ok) throw new Error('Qarzdorlarni yuklab bo\'lmadi');
    return res.json();
  },

  async createCustomer(data: {
    name: string;
    phone: string;
    farm_profile?: string;
    due_date?: string;
    notes?: string;
  }): Promise<{ customer: Customer }> {
    const res = await fetch(`${API_BASE}/debts/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Mijozni saqlab bo\'lmadi');
    return json;
  },

  async repayDebt(data: {
    customer_id: string;
    amount: number;
    new_due_date?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; remaining_balance: number }> {
    const res = await fetch(`${API_BASE}/debts/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'To\'lovni qabul qilib bo\'lmadi');
    return json;
  }
};
