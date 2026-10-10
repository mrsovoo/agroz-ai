export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL.replace(/\/+$/, "");
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production" ? "https://agroz-ai-backend-production.up.railway.app" : "http://localhost:4000";
  }
  return "";
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (typeof window !== "undefined") {
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initData) {
        headers.set("x-telegram-init-data", tg.initData);
      }
    } catch {}
  }
  
  // If we are in business/admin with a local token, we might have it passed explicitly in headers, or we can read from localStorage
  if (typeof window !== "undefined" && !headers.has("Authorization")) {
     const bizToken = localStorage.getItem("agroz_business_token");
     if (bizToken) headers.set("Authorization", `Bearer ${bizToken}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: init?.credentials ?? "include", // Zaxira uchun cookie
  });
}
