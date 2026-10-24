import { AdminUser, AuditLog, AdminRole, Tenant, DashboardData } from '../types';

const TOKEN_KEY = 'biznesgo_admin_token';
const USER_KEY = 'biznesgo_admin_user';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: (): AdminUser | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: AdminUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = BASE_URL ? `${BASE_URL}${endpoint}` : endpoint;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Server xatosi ro\'y berdi');
  }

  return data;
}

export const adminApi = {
  // Auth
  async login(email: string, password: string) {
    return apiRequest<{
      success: boolean;
      require_2fa: boolean;
      temp_token?: string;
      token?: string;
      user?: AdminUser;
    }>('/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async verify2FA(tempToken: string, code: string) {
    return apiRequest<{
      success: boolean;
      token: string;
      user: AdminUser;
    }>('/v1/admin/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ temp_token: tempToken, code })
    });
  },

  async getMe() {
    return apiRequest<{
      success: boolean;
      user: AdminUser;
      permissions: string[];
    }>('/v1/admin/auth/me');
  },

  // Admins Management
  async listAdmins() {
    return apiRequest<{
      success: boolean;
      admins: AdminUser[];
    }>('/v1/admin/admins');
  },

  async createAdmin(payload: { email: string; password: string; full_name: string; role: AdminRole }) {
    return apiRequest<{
      success: boolean;
      admin: AdminUser;
    }>('/v1/admin/admins', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateAdminRole(id: string, role: AdminRole) {
    return apiRequest<{
      success: boolean;
      admin: AdminUser;
    }>(`/v1/admin/admins/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  async toggleAdminStatus(id: string, status: 'active' | 'suspended') {
    return apiRequest<{
      success: boolean;
      admin: AdminUser;
    }>(`/v1/admin/admins/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Audit Logs & Masking
  async getAuditLogs(params?: { action?: string; resource?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.action) query.set('action', params.action);
    if (params?.resource) query.set('resource', params.resource);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{
      success: boolean;
      logs: AuditLog[];
    }>(`/v1/admin/audit${qs}`);
  },

  async revealSensitive(resource: string, resourceId: string, fieldName: string, reason: string) {
    return apiRequest<{
      success: boolean;
      revealed_value: string;
    }>('/v1/admin/audit/reveal', {
      method: 'POST',
      body: JSON.stringify({
        resource,
        resource_id: resourceId,
        field_name: fieldName,
        reason
      })
    });
  },

  // Dashboard Katta Data Metrikalari
  async getDashboardMetrics() {
    return apiRequest<{
      success: boolean;
      summary: DashboardData['summary'];
      sources: DashboardData['sources'];
      regions: DashboardData['regions'];
      top_tenants: DashboardData['top_tenants'];
      recent_tenants: DashboardData['recent_tenants'];
    }>('/v1/admin/dashboard/metrics');
  },

  // B2B Dorixonalar va Bizneslar
  async listTenants(params?: { search?: string; source?: string; status?: string; region?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.source) query.set('source', params.source);
    if (params?.status) query.set('status', params.status);
    if (params?.region) query.set('region', params.region);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{
      success: boolean;
      tenants: Tenant[];
    }>(`/v1/admin/tenants${qs}`);
  },

  async getTenantDetail(id: string) {
    return apiRequest<{
      success: boolean;
      tenant: Tenant;
    }>(`/v1/admin/tenants/${id}`);
  },

  async toggleTenantStatus(id: string, status: 'active' | 'suspended', reason?: string) {
    return apiRequest<{
      success: boolean;
      message: string;
      is_active: boolean;
      status: 'active' | 'suspended';
    }>(`/v1/admin/tenants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason })
    });
  },

  // System
  async getVersion() {
    return apiRequest<{
      success: boolean;
      name: string;
      version: string;
      phase: string;
      timestamp: string;
    }>('/v1/admin/version');
  }
};

