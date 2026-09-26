/**
 * Yoqtirilganlar umumiy ombori (localStorage) — client tomonda ishlatiladi.
 * Agro Bozor, bosh sahifa va tafsilot sahifasi bir xil ro'yxatga yozadi.
 */

export type FavKey = { pharmacyId: number; medicineId: number };

const FAV_KEY = "agroz:favorites:v1";

export const FAV_EVENT = "agroz:favorites-changed";

export function loadFavorites(): FavKey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        const o = x as { pharmacyId?: unknown; medicineId?: unknown };
        const pharmacyId = Number(o?.pharmacyId);
        const medicineId = Number(o?.medicineId);
        if (!Number.isSafeInteger(pharmacyId) || !Number.isSafeInteger(medicineId)) return null;
        return { pharmacyId, medicineId };
      })
      .filter((x): x is FavKey => x !== null)
      .slice(0, 200);
  } catch {
    return [];
  }
}

export function toggleFavorite(pharmacyId: number, medicineId: number): boolean {
  const prev = loadFavorites();
  const exists = prev.some((f) => f.pharmacyId === pharmacyId && f.medicineId === medicineId);
  const next = exists
    ? prev.filter((f) => !(f.pharmacyId === pharmacyId && f.medicineId === medicineId))
    : [...prev, { pharmacyId, medicineId }].slice(0, 200);
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(FAV_EVENT));
  } catch {
    // localStorage band bo'lsa jim o'tamiz.
  }
  return !exists; // yangi holat: true — endi yoqtirilgan
}

export function isFavorite(pharmacyId: number, medicineId: number): boolean {
  return loadFavorites().some((f) => f.pharmacyId === pharmacyId && f.medicineId === medicineId);
}
