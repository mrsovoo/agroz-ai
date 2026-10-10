export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const last9 = digits.slice(-9);
  if (!/^\d{9}$/.test(last9)) return null;
  return `+998${last9}`;
}

export function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/(png|jpe?g|webp|heic|heif);base64,[a-z0-9+/=\s]+$/i.test(value);
}

export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

