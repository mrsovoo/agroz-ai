export type AdminRole = 'super_admin' | 'admin' | 'support' | 'analyst';

export type AdminStatus = 'active' | 'suspended';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  status: AdminStatus;
  two_factor_enabled: boolean;
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

export interface ResourceConfig<T> {
  name: string;
  title: string;
  columns: ColumnDef<T>[];
  filters?: FilterDef[];
  searchKeys?: (keyof T | string)[];
  allowExport?: boolean;
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

