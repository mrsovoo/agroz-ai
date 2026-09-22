/**
 * Savat umumiy ombori (localStorage) — Agro Bozor va bosh sahifa kartochkalari
 * bitta savatga yozadi. Client tomonda ishlatiladi.
 */

export type CartStoreMedicine = {
  id: number;
  name: string;
  price: number | null;
  type: string;
  hasPhoto: boolean;
  usage: string | null;
  status: string;
};

export type CartStorePharmacy = {
  id: number;
  /** Dorixona nomi (organization yoki shaxsiy ism). */
  name: string;
  phone: string;
  address?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
};

export type CartStoreState = {
  pharmacy: CartStorePharmacy;
  lines: { medicine: CartStoreMedicine; qty: number }[];
} | null;

const CART_KEY = "agroz:cart:v1";

/** Savat o'zgarganda boshqa komponentlarga xabar berish uchun event nomi. */
export const CART_EVENT = "agroz:cart-changed";

export function loadCart(): CartStoreState {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartStoreState;
    if (!parsed || typeof parsed !== "object" || !parsed.pharmacy) return null;
    if (!Array.isArray(parsed.lines)) return null;
    const pharmacy = {
      id: Number(parsed.pharmacy.id),
      name: String(parsed.pharmacy.name ?? "").slice(0, 200),
      phone: String(parsed.pharmacy.phone ?? "").slice(0, 32),
      address: parsed.pharmacy.address ? String(parsed.pharmacy.address).slice(0, 300) : null,
    };
    if (!Number.isSafeInteger(pharmacy.id) || pharmacy.id <= 0) return null;
    const lines = parsed.lines
      .filter((l) => l && Number.isSafeInteger(Number(l?.medicine?.id)) && Number(l.medicine.id) > 0)
      .slice(0, 30)
      .map((l) => ({
        medicine: {
          id: Number(l.medicine.id),
          name: String(l.medicine.name ?? "").slice(0, 160),
          price: l.medicine.price === null ? null : Number(l.medicine.price) || null,
          type: String(l.medicine.type ?? "general"),
          hasPhoto: Boolean(l.medicine.hasPhoto),
          usage: l.medicine.usage ? String(l.medicine.usage).slice(0, 300) : null,
          status: "bor",
        },
        qty: Math.max(1, Math.min(99, Math.round(Number(l.qty)) || 1)),
      }));
    return lines.length > 0 ? { pharmacy, lines } : null;
  } catch {
    return null;
  }
}

export function saveCart(state: CartStoreState): void {
  if (typeof window === "undefined") return;
  try {
    if (!state || state.lines.length === 0) {
      window.localStorage.removeItem(CART_KEY);
    } else {
      window.localStorage.setItem(CART_KEY, JSON.stringify(state));
    }
  } catch {
    // localStorage band bo'lsa jim o'tamiz — savat faqat sessiyada saqlanadi.
  }
}

export function notifyCartChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVENT));
}
