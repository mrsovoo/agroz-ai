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

// Vaqt zonasi: Toshkent (UTC+5)
export const TZ_OFFSET_H = 5;
export const EXPIRY_WARN_DAYS = 60;

export const fmt = (n: number): string =>
  Math.round(n || 0).toLocaleString("en-US").replace(/,/g, " ");

export const money = (n: number): string => `${fmt(n)} so'm`;

export const compact = (n: number): string => {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1).replace(".", ",") + " mlrd";
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " mln";
  if (a >= 1e4) return Math.round(n / 1000) + " ming";
  return fmt(n);
};

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const MONTHS_FULL = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export const tzDate = (d: Date | string | number): Date =>
  new Date(new Date(d).getTime() + TZ_OFFSET_H * 3600e3);

export const tzDayKey = (d: Date | string | number): string => tzDate(d).toISOString().slice(0, 10);
export const todayKey = (): string => tzDayKey(new Date());

export const shortDay = (key: string): string => {
  const parts = key.split("-").map(Number);
  if (parts.length >= 3) {
    const [, m, d] = parts;
    return `${d} ${MONTHS[m - 1]}`;
  }
  return key;
};

export const dateTime = (iso: string): string => {
  try {
    const d = tzDate(iso);
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(
      d.getUTCMinutes()
    ).padStart(2, "0")}`;
  } catch {
    return iso;
  }
};

export const todayLabel = (): string => {
  const d = tzDate(new Date());
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const qtyLabel = (n: number, unit: string): string => `${+n.toFixed(2)} ${unit}`;


