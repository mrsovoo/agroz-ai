export type BusinessType = 'agro_vet' | 'feed' | 'warehouse' | 'seeds' | 'machinery';

export interface Merchant {
  id: number;
  user_id: number;
  store_name: string;
  phone: string;
  business_type: BusinessType;
  address: string | null;
  lat: number | null;
  lng: number | null;
  delivery_available: boolean;
  is_active: boolean;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  subscription_until: string | null;
  owner_name: string | null;
  telegram_id: number | null;
  products_count: number;
  sales_count: number;
  total_sales: number;
  open_debts_count: number;
  total_open_debt: number;
}

export interface ArchiveItem {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  telegram_id: string | null;
  business_type: string;
  role: 'merchant' | 'specialist' | 'user';
  source: 'biznesgo_bot' | 'agroz_auth_bot';
  status: 'active' | 'archived' | 'blocked' | 'inactive';
  is_archived: boolean;
  merchant_id: number | null;
  created_at: string;
  archived_at: string | null;
}

export interface ArchiveStats {
  total_all: number;
  total_archived: number;
  total_merchants: number;
  total_specialists: number;
  total_users: number;
  total_biznesgo: number;
  total_agroz_auth: number;
}

export interface PlatformStats {
  merchants: {
    total_merchants: number;
    active_merchants: number;
    blocked_merchants: number;
  };
  sales: {
    total_sales_count: number;
    total_sales_amount: number;
    today_sales_amount: number;
  };
  debts: {
    total_debts_count: number;
    open_debts_count: number;
    total_open_debt_amount: number;
  };
  products: {
    total_products_count: number;
    total_inventory_value: number;
  };
  by_business_type: Array<{
    business_type: BusinessType;
    count: number;
    active_count: number;
  }>;
  daily_trend: Array<{
    date: string;
    amount: number;
    sales_count: number;
  }>;
}

export interface BroadcastPayload {
  text: string;
  photo_url?: string;
  target_bots?: string[];
  target_ids?: number[];
}

export interface BroadcastResult {
  ok: boolean;
  message: string;
  total: number;
  sent_via_biznesgo: number;
  sent_via_agroz_auth: number;
  failed: number;
  details: Array<{
    telegram_id: number;
    success: boolean;
    via: string | null;
  }>;
}

