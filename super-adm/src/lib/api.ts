import type { PlatformStats, Merchant, BroadcastPayload, BroadcastResult, ArchiveItem, ArchiveStats, SupportConversation, SupportChatMessage } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'https://backend-production-96bd5.up.railway.app/api/super-adm';
const ADMIN_KEY_STORAGE = 'super_adm_key';

class SuperAdminApi {
  private key: string = localStorage.getItem(ADMIN_KEY_STORAGE) || (import.meta.env.VITE_ADMIN_KEY as string) || 'AgrozAdmin_2026_Prod_9f3b8c';

  setKey(key: string) {
    this.key = key.trim();
    localStorage.setItem(ADMIN_KEY_STORAGE, this.key);
  }

  getKey(): string {
    return this.key;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (this.key) {
      headers.set('X-Admin-Key', this.key);
    }

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `So'rov xatosi: HTTP ${response.status}`);
    }

    return data;
  }

  async getStats(): Promise<PlatformStats> {
    const res = await this.request<{ ok: boolean; stats: PlatformStats }>('/stats');
    return res.stats;
  }

  async getMerchants(params: { search?: string; business_type?: string; status?: string } = {}): Promise<{ merchants: Merchant[]; total: number }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.business_type) query.set('business_type', params.business_type);
    if (params.status) query.set('status', params.status);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<{ ok: boolean; merchants: Merchant[]; total: number }>(`/merchants${qs}`);
    return { merchants: res.merchants, total: res.total };
  }

  async updateMerchantStatus(id: number, updates: { is_active?: boolean; subscription_until?: string | null }): Promise<Merchant> {
    const res = await this.request<{ ok: boolean; merchant: Merchant }>(`/merchants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.merchant;
  }

  async archiveMerchant(id: number): Promise<Merchant> {
    const res = await this.request<{ ok: boolean; merchant: Merchant }>(`/merchants/${id}/archive`, {
      method: 'PATCH',
    });
    return res.merchant;
  }

  async restoreMerchant(id: number): Promise<Merchant> {
    const res = await this.request<{ ok: boolean; merchant: Merchant }>(`/merchants/${id}/restore`, {
      method: 'PATCH',
    });
    return res.merchant;
  }

  async getArchive(params: {
    search?: string;
    type?: string;
    source?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ items: ArchiveItem[]; total: number; stats: ArchiveStats }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.type) query.set('type', params.type);
    if (params.source) query.set('source', params.source);
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset) query.set('offset', String(params.offset));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await this.request<{ ok: boolean; items: ArchiveItem[]; total: number; stats: ArchiveStats }>(`/archive${qs}`);
    return { items: res.items, total: res.total, stats: res.stats };
  }

  async deleteMerchant(id: number): Promise<{ deleted_merchant_id: number }> {
    return this.request<{ ok: boolean; deleted_merchant_id: number }>(`/merchants/${id}`, {
      method: 'DELETE',
    });
  }

  async resetMerchant(id: number): Promise<{ deleted_sales: number; deleted_debts: number }> {
    const res = await this.request<{ ok: boolean; reset_stats: { deleted_sales: number; deleted_debts: number } }>(`/merchants/${id}/reset`, {
      method: 'POST',
    });
    return res.reset_stats;
  }

  async sendBroadcast(payload: BroadcastPayload): Promise<BroadcastResult> {
    return this.request<BroadcastResult>('/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getSupportConversations(): Promise<{ conversations: SupportConversation[]; unread_total: number }> {
    const res = await this.request<{ ok: boolean; conversations: SupportConversation[]; unread_total: number }>('/support');
    return { conversations: res.conversations, unread_total: res.unread_total };
  }

  async getSupportThread(params: { merchant_id?: number | null; telegram_id?: number | null }): Promise<{ messages: SupportChatMessage[] }> {
    const query = new URLSearchParams();
    if (params.merchant_id) query.set('merchant_id', String(params.merchant_id));
    if (params.telegram_id) query.set('telegram_id', String(params.telegram_id));

    const res = await this.request<{ ok: boolean; messages: SupportChatMessage[] }>(`/support/thread?${query.toString()}`);
    return { messages: res.messages };
  }

  async sendSupportReply(payload: {
    merchant_id?: number | null;
    telegram_id?: number | null;
    message: string;
    admin_name?: string;
  }): Promise<{ message: SupportChatMessage; telegram_sent: boolean }> {
    return this.request<{ ok: boolean; message: SupportChatMessage; telegram_sent: boolean }>('/support/reply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new SuperAdminApi();

