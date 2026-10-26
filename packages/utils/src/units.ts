import type { Product, ProductUnit } from '@agroz/types';

export function findUnit(product: Pick<Product, 'units'>, code: string): ProductUnit | undefined {
  return product.units.find((u) => u.code === code);
}

export function primaryUnit(product: Pick<Product, 'units' | 'primaryUnit'>): ProductUnit {
  const u = findUnit(product, product.primaryUnit) ?? product.units[0];
  if (!u) throw new Error('Product has no units configured');
  return u;
}

export function toBaseQty(qty: number, unit: Pick<ProductUnit, 'factor'>): number {
  return Math.round(qty * unit.factor);
}

export function fromBaseQty(baseQty: number, unit: Pick<ProductUnit, 'factor' | 'step'>): number {
  const q = baseQty / unit.factor;
  return Number(q.toFixed(2));
}

export function formatQty(baseQty: number, unit: Pick<ProductUnit, 'factor' | 'label'>): string {
  const q = baseQty / unit.factor;
  const [i, f] = String(q).split('.');
  const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${grouped}${f ? ',' + f : ''} ${unit.label}`;
}

