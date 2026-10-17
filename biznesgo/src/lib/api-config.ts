export function getApiBaseUrl(): string {
  // Brauzerda (client-side): Next.js rewrites orqali bir xil origin bo'yicha proxy qilinadi
  if (typeof window !== "undefined") {
    const custom = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (custom && custom.startsWith("https://") && !custom.includes("localhost")) {
      return custom.replace(/\/+$/, "").replace(/\/api$/, "");
    }
    return "";
  }
  // Server-side (SSR / Node.js):
  const ssrBase = (
    process.env.BACKEND_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    ""
  ).trim();
  if (ssrBase) return ssrBase.replace(/\/+$/, "").replace(/\/api$/, "");
  return process.env.NODE_ENV === "production"
    ? "https://agroz-ai-backend-production.up.railway.app"
    : "http://localhost:4000";
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
  
  // If we are in business/biznesgo with a local token, read from localStorage
  if (typeof window !== "undefined" && !headers.has("Authorization")) {
    const bizToken =
      localStorage.getItem("agroz_biznesgo_token") ||
      localStorage.getItem("agroz_business_token");
    if (bizToken) headers.set("Authorization", `Bearer ${bizToken}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: init?.credentials ?? "include", // Zaxira uchun cookie
  });
}
