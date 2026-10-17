/**
 * BiznesGO — Qarz daftari va Tezkor Kassa (POS) hisob-kitob hamda validatsiya moduli.
 */

export type DebtStatus = "open" | "partial" | "paid" | "cancelled";
export type PosPaymentType = "cash" | "card" | "credit";
export type PosSaleStatus = "completed" | "cancelled";

/**
 * Qarz balansi: har doim server tomonida hisoblanadi (total_amount - paid_amount).
 */
export function computeDebtBalance(totalAmount: number, paidAmount: number): number {
  const total = Math.max(0, Math.floor(Number(totalAmount) || 0));
  const paid = Math.max(0, Math.floor(Number(paidAmount) || 0));
  return Math.max(0, total - paid);
}

/**
 * Qarz holatini avtomatik aniqlash:
 * - cancelled bo'lsa o'zgarmaydi
 * - paid_amount >= total_amount (va total_amount > 0) -> 'paid'
 * - paid_amount > 0 va paid_amount < total_amount -> 'partial'
 * - aks holda -> 'open'
 */
export function computeDebtStatus(
  totalAmount: number,
  paidAmount: number,
  currentStatus?: string | null,
): DebtStatus {
  if (currentStatus === "cancelled") return "cancelled";
  const total = Math.max(0, Math.floor(Number(totalAmount) || 0));
  const paid = Math.max(0, Math.floor(Number(paidAmount) || 0));
  if (total > 0 && paid >= total) return "paid";
  if (paid > 0 && paid < total) return "partial";
  return "open";
}

/**
 * To'lov turini normallashtirish (UI'dan 'naqd' | 'karta' | 'nasiya' yoki 'cash' | 'card' | 'credit' kelishi mumkin).
 */
export function normalizePosPaymentType(raw: unknown): PosPaymentType | null {
  const val = String(raw || "").trim().toLowerCase();
  if (val === "cash" || val === "naqd") return "cash";
  if (val === "card" || val === "karta") return "card";
  if (val === "credit" || val === "nasiya") return "credit";
  return null;
}

/**
 * Qarz to'lovi usulini normallashtirish.
 */
export function normalizeDebtPaymentMethod(raw: unknown): "cash" | "card" | "transfer" {
  const val = String(raw || "").trim().toLowerCase();
  if (val === "card" || val === "karta") return "card";
  if (val === "transfer" || val === "otkazma" || val === "o'tkazma") return "transfer";
  return "cash";
}

/**
 * Mahsulot qoldig'i o'zgarganda uning statusini ('bor' | 'yoq' | 'qoralama') aniqlash.
 * Qoldiq 0 bo'lsa mahsulot o'chib ketmaydi, faqat status='yoq' bo'ladi va ombor ro'yxatida qoladi.
 */
export function computeMedicineStatusAfterStockChange(
  nextStock: number,
  currentStatus: string,
): "bor" | "yoq" | "qoralama" {
  if (currentStatus === "qoralama") return "qoralama";
  return nextStock <= 0 ? "yoq" : "bor";
}

