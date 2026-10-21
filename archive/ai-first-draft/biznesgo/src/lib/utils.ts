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

export function formatUzbekPhone(value: string): string {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (!digits || digits === '998') return '+998 ';
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (digits.length === 0) return '+998 ';

  let res = '+998 ' + digits.slice(0, 2);
  if (digits.length > 2) res += ' ' + digits.slice(2, 5);
  if (digits.length > 5) res += ' ' + digits.slice(5, 7);
  if (digits.length > 7) res += ' ' + digits.slice(7, 9);
  return res;
}

export function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
