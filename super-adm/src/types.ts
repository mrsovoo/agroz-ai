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
  recent_sales?: RecentSaleItem[];
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

export interface SupportConversation {
  thread_id: string;
  merchant_id: number | null;
  telegram_id: number | null;
  sender_type: 'merchant' | 'admin' | 'bot_user';
  sender_name: string;
  sender_phone: string;
  business_type: string;
  last_message: string;
  last_message_at: string;
  source: 'web' | 'telegram_bot';
  unread_count: number;
  total_messages: number;
  store_name?: string | null;
  owner_name?: string | null;
  current_phone?: string | null;
  resolved_business_type?: string | null;
}

export interface SupportChatMessage {
  id: number;
  merchant_id: number | null;
  telegram_id: number | null;
  sender_type: 'merchant' | 'admin' | 'bot_user';
  sender_name: string;
  sender_phone?: string;
  business_type?: string;
  message: string;
  source: 'web' | 'telegram_bot';
  is_read: boolean;
  reply_to_id?: number | null;
  created_at: string;
}

export interface RecentSaleItem {
  id: number;
  amount: number;
  payment_type: string;
  created_at: string;
  merchant_id: number;
  store_name: string;
  business_type: BusinessType;
}

export interface RegionMerchant {
  id: number;
  store_name: string;
  phone: string;
  owner_name: string | null;
  business_type: BusinessType;
  address: string | null;
  lat: number | null;
  lng: number | null;
  is_active: boolean;
  total_sales: number;
  products_count: number;
}

export interface RegionData {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  merchants_count: number;
  active_count: number;
  total_sales: number;
  total_products: number;
  by_business_type: Record<BusinessType, number>;
  merchants: RegionMerchant[];
}

export interface RegionsSummary {
  total_merchants: number;
  total_regions: number;
  covered_regions: number;
  top_region: { id: string; name: string; count: number } | null;
  geocoded_pins_count: number;
}

export interface RegionsResponse {
  ok: boolean;
  summary: RegionsSummary;
  regions: RegionData[];
  general_merchants: RegionData;
  pins: Array<{
    id: number;
    name: string;
    phone: string;
    business_type: BusinessType;
    lat: number;
    lng: number;
    region_name: string;
  }>;
}


