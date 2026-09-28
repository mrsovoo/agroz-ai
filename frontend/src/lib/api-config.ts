/**
 * Backend API manzili konfiguratsiyasi.
 * Brauzerda va SSR (Server-Side Rendering) paytida to'g'ri backend URL'ni qaytaradi.
 */
export function getApiBaseUrl(): string {
  // 1) Agar explicit NEXT_PUBLIC_API_URL berilgan bo'lsa
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // 2) Server tomonda (SSR) standart 4000 port
  if (typeof window === "undefined") {
    return "http://localhost:4000";
  }

  // 3) Brauzerda: agar frontend va backend bitta hostda (masalan reverse proxy orqasida) bo'lsa bo'sh qator
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/**
 * Telegram va sessiya avtorizatsiya sarlavhalarini qaytaradi.
 * Mini App ichida cookielar cheklangan bo'lsa ham foydalanuvchini 100% aniqlash uchun.
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    try {
      const w = window as any;
      const tg = w?.Telegram?.WebApp;
      if (tg?.initData) {
        headers["x-telegram-init-data"] = tg.initData;
      }
      const tgUserId = tg?.initDataUnsafe?.user?.id;
      if (tgUserId) {
        headers["x-telegram-user-id"] = String(tgUserId);
      }
      const savedUserStr = localStorage.getItem("agroz_user");
      if (savedUserStr) {
        try {
          const u = JSON.parse(savedUserStr);
          if (u?.telegramId && !headers["x-telegram-user-id"]) {
            headers["x-telegram-user-id"] = String(u.telegramId);
          }
        } catch {}
      }
      const session = localStorage.getItem("agroz_session");
      if (session) {
        headers["x-session-id"] = session;
        headers["authorization"] = `Bearer ${session}`;
      }
    } catch {}
  }
  return headers;
}

/**
 * Avtomatik sessiya va Telegram identifikatorlari bilan fetch qilish.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  const authHeaders = getAuthHeaders();
  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
    ...((init?.headers as Record<string, string>) || {}),
  };

  return fetch(url, {
    ...init,
    headers: mergedHeaders,
    credentials: "include",
  });
}
