export type AdminRole = 'super_admin' | 'admin' | 'support' | 'analyst';

export type AdminStatus = 'active' | 'suspended';

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  role: AdminRole;
  status: AdminStatus;
  two_factor_enabled: boolean;
  is_2fa_enabled?: boolean;
  last_login_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  reason?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SensitiveField {
  resource: string;
  resourceId: string;
  fieldName: string;
  maskedValue: string;
  realValue?: string;
}

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  isSensitive?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  options?: { label: string; value: string }[];
}

export type TenantSource = 'telegram_bot' | 'web_browser';

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  masked_phone: string;
  address: string;
  region: string;
  source: TenantSource;
  source_label: string;
  total_revenue: number;
  sales_count: number;
  is_active: boolean;
  status: 'active' | 'suspended';
  created_at: string;
  archive_data?: {
    tenant_id: string;
    store_name: string;
    owner_name?: string;
    phone: string;
    masked_phone: string;
    telegram_chat_id?: string | null;
    source: TenantSource;
    source_label: string;
    sector_type: string;
    address: string;
    region: string;
    registered_at: string;
    is_active: boolean;
    raw_neon_record?: any;
  };
  stats?: {
    total_revenue: number;
    sales_count: number;
    products_count: number;
    average_check: number;
  };
  recent_sales?: Array<{
    id: string;
    receipt_number: string;
    total_amount: number;
    payment_type: string;
    status: string;
    created_at: string;
  }>;
}

export interface DashboardData {
  summary: {
    total_tenants: number;
    active_tenants: number;
    total_revenue: number;
    today_revenue: number;
    total_sales_count: number;
    average_check: number;
  };
  sources: {
    telegram_bot: number;
    web_browser: number;
    telegram_percentage: number;
    web_percentage: number;
  };
  regions: Array<{
    region: string;
    tenant_count: number;
    total_revenue: number;
  }>;
  top_tenants: Array<{
    id: string;
    name: string;
    phone: string;
    masked_phone: string;
    region: string;
    source: TenantSource;
    total_revenue: number;
    sales_count: number;
    created_at: string;
  }>;
  recent_tenants: Array<{
    id: string;
    name: string;
    phone: string;
    masked_phone: string;
    region: string;
    source: TenantSource;
    total_revenue: number;
    created_at: string;
  }>;
}

export interface ResourceConfig<T> {
  name: string;
  title: string;
  columns: ColumnDef<T>[];
  filters?: FilterDef[];
  searchKeys?: (keyof T | string)[];
  allowExport?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

