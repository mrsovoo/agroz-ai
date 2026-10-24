import { Product, Customer, DashboardMetrics, SectorType, SectorMeta, Warehouse, Supplier, CashAccount } from '../types';
import { demoStore } from './demoStore';

// Production muhitda agar VITE_API_URL berilmagan bo'lsa, Railway backendiga murojaat qilish:
const DEFAULT_API_URL = 'https://backend-production-96bd5.up.railway.app';
const BASE_URL = (import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'http://localhost:5001' : DEFAULT_API_URL)).replace(/\/+$/, '');
const API_BASE = `${BASE_URL}/api/biznesgo`;

// Xavfsiz JSON parser: Safari "The string did not match the expected pattern" xatosini oldini olish
async function safeJsonFetch(url: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server kutilmagan javob qaytardi (${res.status}): ${text.slice(0, 100)}`);
  }
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Server xatoligi (${res.status})`);
  }
  return json;
}

export function formatUZS(val: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0)) + " so'm";
}

// O'zbekiston telefon raqamlari maskasi: doim +998 va +998 90 000 0000 formatida
export function formatUzbekPhone(val: string): string {
  if (!val) return '+998 ';
  let digits = val.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('8') && digits.length === 10) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 9);

  if (digits.length === 0) return '+998 ';
  if (digits.length <= 2) return `+998 ${digits}`;
  if (digits.length <= 5) return `+998 ${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
}

export function cleanPhone(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    return `+${digits.slice(0, 12)}`;
  }
  return `+998${digits.slice(0, 9)}`;
}

// Token va Foydalanuvchi Sessiyasini boshqarish (LocalStorage va SessionStorage)
export function getToken(): string | null {
  try {
    return localStorage.getItem('biznesgo_token') || sessionStorage.getItem('biznesgo_token');
  } catch (_) {
    return null;
  }
}

export function setToken(token: string, remember: boolean = true): void {
  try {
    if (remember) {
      localStorage.setItem('biznesgo_token', token);
      sessionStorage.removeItem('biznesgo_token');
    } else {
      sessionStorage.setItem('biznesgo_token', token);
      localStorage.removeItem('biznesgo_token');
    }
  } catch (_) {}
}

export function removeToken(): void {
  try {
    localStorage.removeItem('biznesgo_token');
    localStorage.removeItem('biznesgo_user');
    localStorage.removeItem('biznesgo_store_name');
    sessionStorage.removeItem('biznesgo_token');
    sessionStorage.removeItem('biznesgo_user');
    sessionStorage.removeItem('biznesgo_store_name');
  } catch (_) {}
}

export function getUser(): any | null {
  try {
    const raw = localStorage.getItem('biznesgo_user') || sessionStorage.getItem('biznesgo_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function setUser(user: any, remember: boolean = true): void {
  try {
    if (remember) {
      localStorage.setItem('biznesgo_user', JSON.stringify(user));
      sessionStorage.removeItem('biznesgo_user');
    } else {
      sessionStorage.setItem('biznesgo_user', JSON.stringify(user));
      localStorage.removeItem('biznesgo_user');
    }
  } catch (_) {}
}

// Barcha API so'rovlariga avtomatik Authorization Bearer token qo'shish
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('x-sector-type', 'agro_vet');
  return fetch(url, { ...options, headers });
}

export const SECTOR_LIST: SectorMeta[] = [
  {
    id: 'agro_vet',
    code: 'agro_vet',
    name: 'Agro-Vet Dorixona',
    subtitle: 'Veterinariya dorilari, premikslar va o\'simlik himoyasi',
    icon: 'Pill',
    defaultUnits: ['dona', 'flakon', 'ampula', 'litr', 'kg', 'qadoq'],
    categories: ['Antibiotiklar (Vet)', 'Antiparasitik preparatlar', 'Premikslar va vitaminlar', 'Dezinfeksiya', 'Insektitsid & Gerbitsid', 'Mineral o\'g\'itlar']
  }
];

export const api = {
  // 0. Auth & Sessiya
  async telegramAuth(initData: string): Promise<{ token: string; tenant: any }> {
    try {
      const res = await fetch(`${API_BASE}/auth/telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData, sector_type: 'agro_vet' })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.token) setToken(json.token, true);
        if (json.tenant) setUser(json.tenant, true);
        return json;
      }
    } catch (_) {}

    // Fallback: local dev
    const fallbackTenant = {
      id: 'demo-tenant-agro-vet',
      name: 'Agro-Vet Markaz',
      phone: '+998901234567',
      sector_type: 'agro_vet'
    };
    const fallbackToken = 'demo-token';
    setToken(fallbackToken, true);
    setUser(fallbackTenant, true);
    return { token: fallbackToken, tenant: fallbackTenant };
  },

  async sendOtp(phone: string): Promise<{ success: boolean; message: string; sent_to_bot?: boolean; dev_code?: string }> {
    return safeJsonFetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
  },

  async verifyOtp(phone: string, code: string, rememberDevice: boolean = true): Promise<{ token: string; tenant: any }> {
    const json = await safeJsonFetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, remember_device: rememberDevice, sector_type: 'agro_vet' })
    });
    if (json.token) setToken(json.token, rememberDevice);
    if (json.tenant) setUser(json.tenant, rememberDevice);
    return json;
  },

  async createRegisterSession(payload: { name: string; owner_name?: string; phone: string; address?: string }): Promise<{ token: string; bot_url: string }> {
    return safeJsonFetch(`${API_BASE}/auth/register-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, sector_type: 'agro_vet' })
    });
  },

  async checkSessionStatus(token: string): Promise<{ status: 'pending' | 'approved' | 'expired'; token?: string; tenant?: any }> {
    try {
      return await safeJsonFetch(`${API_BASE}/auth/session/status?token=${encodeURIComponent(token)}`);
    } catch (err) {
      return { status: 'pending' };
    }
  },

  async login(phone: string): Promise<{ token: string; tenant: any }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, sector_type: 'agro_vet' })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.token) setToken(json.token);
        if (json.tenant) setUser(json.tenant);
        return json;
      }
    } catch (_) {}

    // Local / Offline demo login
    const demoTenant = {
      id: 'demo-tenant-agro-vet',
      name: phone.includes('93') ? 'Chinoz Baraka Vet' : phone.includes('97') ? 'Zangiota Agro-Vet' : 'Agro-Vet Markaz',
      phone,
      sector_type: 'agro_vet'
    };
    const demoToken = 'demo-token';
    setToken(demoToken);
    setUser(demoTenant);
    return { token: demoToken, tenant: demoTenant };
  },

  async register(data: {
    name: string;
    phone: string;
    address?: string;
    tax_id?: string;
  }): Promise<{ token: string; tenant: any; user: any }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sector_type: 'agro_vet' })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.token) setToken(json.token);
        if (json.tenant) setUser(json.tenant);
        return json;
      }
    } catch (_) {}

    // Local fallback
    const tenant = {
      id: `tenant-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      address: data.address,
      sector_type: 'agro_vet'
    };
    const token = 'demo-token';
    setToken(token);
    setUser(tenant);
    return {
      token,
      tenant,
      user: { id: 'usr-1', name: data.name, role: 'owner' }
    };
  },

  async getMe(): Promise<any> {
    try {
      const res = await authFetch(`${API_BASE}/auth/me`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      id: 'usr-1',
      name: 'Rustam Qodirov',
      role: 'owner',
      phone: '+998901234567',
      tenant_name: 'Agro-Vet Markaz'
    };
  },

  logout(): void {
    removeToken();
  },

  // 1. Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const res = await authFetch(`${API_BASE}/dashboard/metrics`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      today_revenue: 0,
      cash_revenue: 0,
      card_revenue: 0,
      debt_revenue: 0,
      today_profit: 0,
      total_receipts: 0,
      expired_count: 0,
      critical_7_count: 0,
      critical_expiry_count: 0,
      warning_60_count: 0,
      warning_90_count: 0,
      out_of_stock_count: 0,
      low_stock_count: 0,
      total_debt: 0,
      debtor_count: 0,
      overdue_debt: 0,
      overdue_debtors_count: 0,
      sector_type: 'agro_vet',
      urgent_expiry_drugs: []
    };
  },

  async getSalesHistory(): Promise<{ sales: any[] }> {
    try {
      const res = await authFetch(`${API_BASE}/sales/history`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return { sales: [] };
  },

  // 2. Mahsulotlar (Agro-Vet Dorixona) - 0 full holatda bo'lishi ta'minlangan
  async getProducts(search?: string, filter?: string, sectorType?: SectorType): Promise<{ products: Product[]; sector_type?: string }> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filter) params.append('filter', filter);
      params.append('sector_type', sectorType || 'agro_vet');
      const res = await authFetch(`${API_BASE}/products?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.products)) return json;
      }
    } catch (_) {}
    // Agar serverda tovarlar bo'lmasa, do'kon toza 0 full holatda bo'ladi
    return { products: [], sector_type: sectorType || 'agro_vet' };
  },

  async createProduct(data: {
    name: string;
    sku?: string;
    barcode?: string;
    category: string;
    brand?: string;
    unit?: string;
    sector_type?: SectorType;
    sector_attributes?: Record<string, any>;
    active_ingredient?: string;
    dosage_form?: string;
    storage_condition?: string;
    batch_number?: string;
    production_date?: string;
    expiry_date?: string;
    image_url?: string;
    price: number;
    cost_price?: number;
    stock: number;
    min_stock?: number;
  }): Promise<{ product: Product; message: string }> {
    try {
      const res = await authFetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sector_type: 'agro_vet' })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const newProd = demoStore.addProduct(data);
    return { product: newProd, message: 'Dori vositasi saqlandi (Demo)' };
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
    try {
      const res = await authFetch(`${API_BASE}/sales/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    return demoStore.checkout(data.items, data.payment_type, data.customer_id, data.customer_name);
  },

  // 4. Qarz Daftari (CRM)
  async getCustomers(): Promise<{ customers: Customer[] }> {
    try {
      const res = await authFetch(`${API_BASE}/debts/customers`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.customers)) return json;
      }
    } catch (_) {}
    return { customers: [] };
  },

  async createCustomer(data: {
    name: string;
    phone: string;
    customer_type?: string;
    farm_profile?: string;
    debt_balance?: number;
    due_date?: string;
    notes?: string;
  }): Promise<{ customer: Customer }> {
    try {
      const res = await authFetch(`${API_BASE}/debts/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const debt = Number(data.debt_balance) || 0;
    const newCust: Customer = {
      id: `cust-demo-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      customer_type: (data.customer_type as any) || 'ferma',
      farm_profile: data.notes || data.farm_profile || 'Qarzga berilgan dori',
      debt_balance: debt,
      due_date: data.due_date,
      status: debt > 0 ? 'urgent' : 'normal',
      notes: data.notes
    };
    demoStore.customers.unshift(newCust);
    if (debt > 0) {
      demoStore.metrics.total_debt += debt;
    }
    return { customer: newCust };
  },

  async repayDebt(data: {
    customer_id: string;
    amount: number;
    payment_method?: string;
    new_due_date?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; remaining_balance: number }> {
    try {
      const res = await authFetch(`${API_BASE}/debts/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    return demoStore.repayDebt(data.customer_id, data.amount, data.new_due_date);
  },

  // 5. Ombor & Inventory
  async getWarehouses(): Promise<{ warehouses: Warehouse[] }> {
    try {
      const res = await authFetch(`${API_BASE}/inventory/warehouses`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      warehouses: [
        {
          id: 'wh-1',
          name: 'Asosiy Dorixona Ombori',
          code: 'MAIN-WH',
          type: 'main',
          is_active: true
        }
      ]
    };
  },

  async getBatches(filter?: string, productId?: string): Promise<{ batches: any[] }> {
    try {
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (productId) params.append('product_id', productId);
      const res = await authFetch(`${API_BASE}/inventory/batches?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.batches) return json;
      }
    } catch (_) {}
    return { batches: [] };
  },

  async recallBatch(data: {
    batch_number?: string;
    batch_id?: string;
    recall_reason: string;
  }): Promise<{ message: string; batch: any; affected_sales_count: number; affected_customers: any[] }> {
    try {
      const res = await authFetch(`${API_BASE}/inventory/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const b = demoStore.batches.find(x => x.batch_number === data.batch_number);
    if (b) b.status = 'quarantined';
    return {
      message: 'Partiya karantinga olindi',
      batch: b,
      affected_sales_count: 0,
      affected_customers: []
    };
  },

  async disposeStock(data: {
    batch_id?: string;
    product_id?: string;
    quantity: number;
    reason: string;
    protocol_number?: string;
    disposal_method?: string;
  }): Promise<{ message: string; loss_amount: number; remaining_stock: number }> {
    try {
      const res = await authFetch(`${API_BASE}/inventory/dispose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    return {
      message: 'Muddati o\'tgan dori utilizatsiya qilindi va dalolatnoma tuzildi',
      loss_amount: data.quantity * 35000,
      remaining_stock: 0
    };
  },

  async createReceipt(data: {
    product_id: string;
    quantity: number;
    unit_cost?: number;
    batch_number?: string;
    production_date?: string;
    expiry_date?: string;
    document_no?: string;
    notes?: string;
  }): Promise<{ message: string }> {
    try {
      const res = await authFetch(`${API_BASE}/inventory/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const prod = demoStore.products.find(p => p.id === data.product_id);
    if (prod) {
      prod.stock += data.quantity;
    }
    return { message: 'Kirim qabul qilindi va partiya shakllantirildi' };
  },

  // 6. Xaridlar & Supplierlar
  async getSuppliers(): Promise<{ suppliers: Supplier[] }> {
    try {
      const res = await authFetch(`${API_BASE}/purchasing/suppliers`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      suppliers: [
        { id: 'sup-1', name: 'FarmVet Ta\'minot MCHJ', phone: '+998712001122', debt_balance: 0, notes: 'Veterinariya preparatlari' },
        { id: 'sup-2', name: 'Bioveta Distribyutsiya', phone: '+998712334455', debt_balance: 0, notes: 'Vaktsinalar' }
      ]
    };
  },

  // 7. Moliya & Kassalar
  async getCashAccounts(): Promise<{ accounts: CashAccount[] }> {
    try {
      const res = await authFetch(`${API_BASE}/finance/accounts`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      accounts: [
        { id: 'acc-1', name: 'Asosiy Naqd Kassa', account_type: 'cash', balance: 2100000, currency: 'UZS' },
        { id: 'acc-2', name: 'Humo / Uzcard Terminal', account_type: 'bank', balance: 850000, currency: 'UZS' }
      ]
    };
  },

  // 8. Sozlamalar
  async getSettings(): Promise<any> {
    try {
      const res = await authFetch(`${API_BASE}/settings`);
      if (res.ok) return await res.json();
    } catch (_) {}
    return {
      store_name: 'Agro-Vet Markaz',
      sector: 'agro_vet',
      fefo_enabled: true,
      alert_days: [7, 30, 90]
    };
  },

  async updateSettings(data: any): Promise<any> {
    try {
      const res = await authFetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}
    return data;
  }
};
