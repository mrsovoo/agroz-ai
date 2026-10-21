/**
 * BiznesGO Type-Safe API Client
 */
import { tg } from './telegram';
import type { Merchant, Product, Sale, Debt, Customer, DebtorSummary, BusinessTypeMeta, UnitType } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api/biznesgo';
const TOKEN_KEY = 'biznesgo_token';

class ApiClient {
  token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  setToken(t: string | null) {
    if (t) {
      this.token = t;
      localStorage.setItem(TOKEN_KEY, t);
    } else {
      this.clearToken();
    }
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const msg = (data && data.error) || (data && data.message) || `Xatolik: ${res.status}`;
      const err = new Error(msg) as any;
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data as T;
  }

  // Meta
  getMeta = () => this.request<{
    business_types: Record<string, BusinessTypeMeta>;
    units: UnitType[];
    payment_types: string[];
  }>('/meta');

  // Auth
  auth = {
    sendOtp: (phone: string) =>
      this.request<{
        ok: boolean;
        delivered_via_telegram: boolean;
        bot_name: string | null;
        phone: string;
        expires_in_seconds: number;
        bot_url: string;
        has_telegram_link: boolean;
        message: string;
      }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
    verifyOtp: (payload: {
      phone: string;
      code: string;
      store_name?: string;
      business_type?: string;
      full_name?: string;
      address?: string;
    }) =>
      this.request<{
        ok?: boolean;
        verified?: boolean;
        needs_onboarding?: boolean;
        phone?: string;
        user?: { id?: number; name?: string; phone?: string; telegram_id?: number };
        token?: string;
        merchant?: Merchant;
        message?: string;
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    checkOtp: (payload: { phone: string; code?: string }) =>
      this.request<{
        ok: boolean;
        verified: boolean;
        registered?: boolean;
        waiting_for_telegram?: boolean;
        token?: string;
        merchant?: Merchant;
        phone?: string;
        telegram_id?: number;
        message?: string;
      }>('/auth/check-otp', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    register: (payload: any) =>
      this.request<{ token: string; merchant: Merchant }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    login: (payload: { phone: string; password?: string } | string, pass?: string) => {
      const body = typeof payload === 'string' 
        ? { phone: payload, password: pass }
        : payload;
      return this.request<{ token: string; merchant: Merchant }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },
    telegram: (initDataOverride?: string) => {
      const initData = initDataOverride || tg.getInitData();
      return this.request<{ 
        registered?: boolean; 
        token?: string; 
        merchant?: Merchant; 
        telegram_user?: any; 
        needs_onboarding?: boolean; 
        user?: any 
      }>('/auth/telegram', {
        method: 'POST',
        body: JSON.stringify({ initData })
      });
    },
    telegramRegister: (payload: any) =>
      this.request<{ token: string; merchant: Merchant }>('/auth/telegram/register', {
        method: 'POST',
        body: JSON.stringify({ ...payload, initData: tg.getInitData() })
      }),
    telegramOnboard: (payload: any) =>
      this.request<{ token: string; merchant: Merchant }>('/auth/telegram/register', {
        method: 'POST',
        body: JSON.stringify({ ...payload, initData: tg.getInitData() })
      }),
    me: () => this.request<{ user: any; merchant: Merchant }>('/auth/me'),
    updateProfile: (payload: Partial<Merchant>) =>
      this.request<{ merchant: Merchant }>('/merchant', {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    changePassword: (payload: { old_password?: string; new_password: string; current_password?: string }) =>
      this.request<{ ok: boolean }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: payload.old_password || payload.current_password,
          new_password: payload.new_password
        })
      }),
    updatePassword: (payload: { current_password?: string; new_password: string }) =>
      this.request<{ ok: boolean }>('/auth/password', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
  };

  // Merchant
  merchant = {
    get: () => this.request<{ merchant: Merchant }>('/merchant'),
    update: (payload: Partial<Merchant>) =>
      this.request<{ merchant: Merchant }>('/merchant', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
  };

  // Products
  products = {
    list: async (params: { search?: string; category?: string; stock?: string; limit?: number; offset?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.category) q.set('category', params.category);
      if (params.stock) q.set('stock', params.stock);
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));
      const res = await this.request<any>(`/products?${q}`);
      return (res && res.products) || (Array.isArray(res) ? res : []);
    },
    get: (id: number) => this.request<{ product: Product }>(`/products/${id}`),
    create: (payload: Partial<Product>) =>
      this.request<{ product: Product }>('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    update: (id: number, payload: Partial<Product> & { stock_delta?: number }) =>
      this.request<{ product: Product }>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),
    delete: (id: number) =>
      this.request<{ ok: boolean }>(`/products/${id}`, {
        method: 'DELETE'
      }),
    expiredAlerts: (days = 30) =>
      this.request<{ days: number; expired: Product[]; expiring_soon: Product[] }>(`/products/expired-alerts?days=${days}`),
    categories: () =>
      this.request<{ categories: { category: string; count: number }[] }>('/products/categories')
  };

  // POS & Sales
  sales = {
    create: (payload: {
      items: { product_id: number; quantity: number; unit_price?: number }[];
      payment_type: 'cash' | 'card' | 'debt';
      discount_amount?: number;
      customer_id?: number;
      customer?: { full_name: string; phone?: string; address?: string };
      customer_name?: string;
      customer_phone?: string;
      debt_due_date?: string;
      paid_amount?: number;
      due_date?: string;
      note?: string;
    }) => {
      const formattedPayload = {
        ...payload,
        customer: payload.customer || (payload.customer_name ? {
          full_name: payload.customer_name,
          phone: payload.customer_phone
        } : undefined),
        due_date: payload.due_date || payload.debt_due_date
      };
      return this.request<{ sale: Sale }>('/sales', {
        method: 'POST',
        body: JSON.stringify(formattedPayload)
      });
    },
    list: (params: { limit?: number; offset?: number; payment_type?: string; from?: string; to?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.limit) q.set('limit', String(params.limit));
      if (params.offset) q.set('offset', String(params.offset));
      if (params.payment_type) q.set('payment_type', params.payment_type);
      return this.request<{ sales: any[]; totals: any; limit: number; offset: number }>(`/sales?${q}`);
    },
    get: (id: number) => this.request<{ sale: Sale }>(`/sales/${id}`)
  };

  // Debts
  debts = {
    list: async (params: { status?: string; overdue?: string; search?: string; customer_id?: number; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.set('status', params.status);
      if (params.overdue) q.set('overdue', params.overdue);
      if (params.search) q.set('search', params.search);
      if (params.customer_id) q.set('customer_id', String(params.customer_id));
      if (params.limit) q.set('limit', String(params.limit));
      const res = await this.request<any>(`/debts?${q}`);
      return (res && res.debts) || (Array.isArray(res) ? res : []);
    },
    create: (payload: {
      customer_id?: number;
      customer_name?: string;
      customer_phone?: string;
      customer?: { full_name: string; phone?: string; address?: string };
      amount: number;
      due_date?: string;
      notes?: string;
      note?: string;
    }) => {
      const formatted = {
        customer_id: payload.customer_id,
        customer: payload.customer || (payload.customer_name ? {
          full_name: payload.customer_name,
          phone: payload.customer_phone
        } : undefined),
        amount: payload.amount,
        due_date: payload.due_date,
        note: payload.notes || payload.note
      };
      return this.request<{ debt: Debt; customer: Customer }>('/debts/manual', {
        method: 'POST',
        body: JSON.stringify(formatted)
      });
    },
    repay: (debtId: number, payload: {
      amount: number;
      payment_type?: 'cash' | 'card';
      payment_method?: 'cash' | 'card';
      notes?: string;
      note?: string;
    }) => {
      return this.request<any>('/debts/pay', {
        method: 'POST',
        body: JSON.stringify({
          debt_id: debtId,
          amount: payload.amount,
          payment_method: payload.payment_type || payload.payment_method || 'cash',
          note: payload.notes || payload.note
        })
      });
    },
    pay: (payload: { debt_id?: number; customer_id?: number; amount: number; payment_method?: 'cash' | 'card'; note?: string }) =>
      this.request<any>('/debts/pay', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    addManual: (payload: {
      customer_id?: number;
      customer?: { full_name: string; phone?: string; address?: string };
      amount: number;
      due_date?: string;
      note?: string;
    }) =>
      this.request<{ debt: Debt; customer: Customer }>('/debts/manual', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  };

  // Customers
  customers = {
    list: (params: { search?: string; limit?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.limit) q.set('limit', String(params.limit));
      return this.request<{ customers: Customer[] }>(`/customers?${q}`);
    },
    create: (payload: { full_name: string; phone?: string; address?: string }) =>
      this.request<{ customer: Customer }>('/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  };

  // Dashboard
  dashboard = {
    get: (days = 7) =>
      this.request<any>(`/dashboard?days=${days}`),
    getStats: async (days = 7) => {
      const raw = await this.request<any>(`/dashboard?days=${days}`);
      return {
        today_revenue: raw.today?.revenue || 0,
        today_sales_count: raw.today?.sales_count || 0,
        total_products: raw.stock?.total || 0,
        low_stock_count: raw.stock?.low_stock || 0,
        total_debt: raw.debts?.outstanding || 0,
        debtor_count: raw.debts?.debtors || 0,
        sales_last_7_days: (raw.series || []).map((s: any) => ({
          date: s.date,
          amount: s.revenue,
          count: s.sales_count
        })),
        recent_sales: raw.recent_sales || [],
        expiring_products: raw.expiring_products || []
      };
    }
  };

  // Support Chat
  support = {
    list: () => this.request<{ ok: boolean; messages: any[] }>('/support'),
    send: (message: string) =>
      this.request<{ ok: boolean; message: any }>('/support', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  };
}

export const api = new ApiClient();
