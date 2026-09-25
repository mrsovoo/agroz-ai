/** Summani qisqa ko'rinishda formatlaydi: 45000 → "45 000". */
export function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

/**
 * Buyurtma raqamini #000000 formatida ko'rsatadi.
 * Agar 999 999 dan oshsa, #000000-1, #000000-2 shaklida davom etadi.
 */
export function formatOrderNumber(orderId: number | string): string {
  const num = typeof orderId === "string" ? parseInt(orderId, 10) : orderId;
  if (!Number.isFinite(num) || num <= 0) return "#000001";

  if (num <= 999999) {
    return `#${String(num).padStart(6, "0")}`;
  }

  const overflow = num - 999999;
  return `#000000-${overflow}`;
}

