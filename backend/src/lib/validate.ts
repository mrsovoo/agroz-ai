/** Kirishlarni tozalash va tekshirish uchun kichik yordamchilar (tashqi kutubxonasiz). */

/** Bo'sh joylarni tozalaydi, uzunlikni cheklaydi, bo'sh bo'lsa null qaytaradi. */
export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/** O'zbekiston raqamini +998XXXXXXXXX ko'rinishiga keltiradi. Yaroqsiz bo'lsa null. */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const last9 = digits.slice(-9);
  if (!/^\d{9}$/.test(last9)) return null;
  return `+998${last9}`;
}

/** data:image/...;base64,... ko'rinishidagi rasm URL'i ekanini tekshiradi. */
export function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(png|jpe?g|webp|heic|heif);base64,[a-z0-9+/=\s]+$/i.test(value);
}

/** base64 qismining hajmini baytlarda hisoblaydi. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/** So'rov yuboruvchining IP manzili (Vercel proxy header'lari bilan). */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
