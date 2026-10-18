export function formatMoney(amount: number | string | undefined | null): string {
  const n = Math.round(Number(amount) || 0);
  return n.toLocaleString('uz-UZ').replace(/,/g, ' ') + " so'm";
}

export const formatCurrency = formatMoney;

export function formatNumber(amount: number | string | undefined | null): string {
  const n = Number(amount) || 0;
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

export function formatDate(dateStr: string | undefined | null, includeTime = false): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (!includeTime) return `${day}.${month}.${year}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}
