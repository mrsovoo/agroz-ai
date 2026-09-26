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

