import type { CurrencyCode, Money } from '@agroz/types';

export const MINOR_PER_MAJOR: Record<CurrencyCode, number> = { UZS: 100, USD: 100, RUB: 100, KZT: 100 };
const SYMBOL: Record<CurrencyCode, string> = { UZS: "so'm", USD: '$', RUB: '₽', KZT: '₸' };

export function toMinor(major: number | string, currency: CurrencyCode = 'UZS'): Money {
  const raw = typeof major === 'string' ? major.replace(/\s/g, '').replace(',', '.') : String(major);
  if (raw === '' || Number.isNaN(Number(raw))) return 0;
  const negative = raw.startsWith('-');
  const [intPart, fracPart = ''] = raw.replace('-', '').split('.');
  const digits = Math.log10(MINOR_PER_MAJOR[currency]);
  const frac = (fracPart + '0'.repeat(digits)).slice(0, digits);
  const value = Number(intPart || '0') * MINOR_PER_MAJOR[currency] + Number(frac || '0');
  return negative ? -value : value;
}

export function toMajor(minor: Money, currency: CurrencyCode = 'UZS'): number {
  return minor / MINOR_PER_MAJOR[currency];
}

export function formatMoney(minor: Money, currency: CurrencyCode = 'UZS', opts: { withSymbol?: boolean } = {}): string {
  const { withSymbol = true } = opts;
  const per = MINOR_PER_MAJOR[currency];
  const negative = minor < 0;
  const abs = Math.abs(Math.round(minor));
  const major = Math.floor(abs / per);
  const frac = abs % per;
  const grouped = String(major).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const fracStr = frac === 0 && currency === 'UZS' ? '' : `,${String(frac).padStart(2, '0')}`;
  const body = `${negative ? '−' : ''}${grouped}${fracStr}`;
  if (!withSymbol) return body;
  return currency === 'USD' ? `$${body}` : `${body}\u00a0${SYMBOL[currency]}`;
}

export function mulMoney(unitPrice: Money, qty: number): Money {
  return Math.round(unitPrice * qty);
}

