/**
 * Backend API manzili konfiguratsiyasi.
 * Brauzerda va SSR (Server-Side Rendering) paytida to'g'ri backend URL'ni qaytaradi.
 */
export function getApiBaseUrl(): string {
  // 1) Agar explicit NEXT_PUBLIC_API_URL yoki BACKEND_URL berilgan bo'lsa
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/+$/, "");
  }

  // 2) Server tomonda (SSR): production'da agroz.uz, lokal dev'da localhost:4000
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production" ? "https://agroz.uz" : "http://localhost:4000";
  }

  // 3) Brauzerda: agar frontend va backend bitta hostda (masalan reverse proxy orqasida) bo'lsa bo'sh qator
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (typeof window !== "undefined") {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const tgUser = tg?.initDataUnsafe?.user;
      if (tgUser?.id) {
        headers.set("x-telegram-user-id", String(tgUser.id));
      }
      if (tg?.initData) {
        headers.set("x-telegram-init-data", tg.initData);
      }
    } catch {}
  }
  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: init?.credentials ?? "include",
  });
}

