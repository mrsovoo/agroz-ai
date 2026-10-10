export const AUTH_STORAGE_KEY = "agroz_session_id";
export const AUTH_UNAUTHORIZED_EVENT = "agroz:auth:unauthorized";

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) {
      localStorage.setItem(AUTH_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    /* safe fallback if storage disabled */
  }
}

export function clearStoredSession(): void {
  setStoredSessionId(null);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    } catch {}
  }
}

export function getBaseApiUrl(): string {
  // Vite env
  const envUrl = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL)
    ? String((import.meta as any).env.VITE_API_URL).trim()
    : "";

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  // Fallback production backend URL
  return "https://agroz-ai-backend-production.up.railway.app";
}

export function apiUrl(path: string): string {
  const base = getBaseApiUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = /^https?:\/\//i.test(path) ? path : apiUrl(path);
  const headers = new Headers(init?.headers);

  // 1. Bearer Token (localStorage)
  const sessionId = getStoredSessionId();
  if (sessionId && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${sessionId}`);
  }

  // 2. Telegram WebApp InitData
  if (typeof window !== "undefined") {
    const tgInitData = (window as any).Telegram?.WebApp?.initData;
    if (tgInitData && typeof tgInitData === "string" && !headers.has("x-telegram-init-data")) {
      headers.set("x-telegram-init-data", tgInitData);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  // 3. 401 Unauthorized handler
  if (response.status === 401) {
    clearStoredSession();
  }

  return response;
}
