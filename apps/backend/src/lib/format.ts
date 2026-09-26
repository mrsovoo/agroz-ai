/** Summani qisqa ko'rinishda formatlaydi: 45000 → "45 000". */
export function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}
