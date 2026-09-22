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

export type CartStoreLine = {
  medicine: CartStoreMedicine;
  pharmacy?: CartStorePharmacy;
  qty: number;
};

export type CartStoreState = {
  pharmacy: CartStorePharmacy;
  lines: CartStoreLine[];
} | null;

const CART_KEY = "agroz:cart:v1";

/** Savat o'zgarganda boshqa komponentlarga xabar berish uchun event nomi. */
export const CART_EVENT = "agroz:cart-changed";

export function loadCart(): CartStoreState {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.lines)) return null;

    const fallbackPharmacy: CartStorePharmacy = {
      id: Number(parsed.pharmacy?.id || 1),
      name: String(parsed.pharmacy?.name ?? "Agro Dorixona").slice(0, 200),
      phone: String(parsed.pharmacy?.phone ?? "+998 90 123 45 67").slice(0, 32),
      address: parsed.pharmacy?.address ? String(parsed.pharmacy.address).slice(0, 300) : null,
    };

    const lines: CartStoreLine[] = parsed.lines
      .filter((l: any) => l && Number.isSafeInteger(Number(l?.medicine?.id)) && Number(l.medicine.id) > 0)
      .slice(0, 50)
      .map((l: any) => {
        const ph: CartStorePharmacy = l.pharmacy
          ? {
              id: Number(l.pharmacy.id || fallbackPharmacy.id),
              name: String(l.pharmacy.name ?? fallbackPharmacy.name).slice(0, 200),
              phone: String(l.pharmacy.phone ?? fallbackPharmacy.phone).slice(0, 32),
              address: l.pharmacy.address ? String(l.pharmacy.address).slice(0, 300) : fallbackPharmacy.address,
            }
          : fallbackPharmacy;

        return {
          medicine: {
            id: Number(l.medicine.id),
            name: String(l.medicine.name ?? "").slice(0, 160),
            price: l.medicine.price === null ? null : Number(l.medicine.price) || null,
            type: String(l.medicine.type ?? "general"),
            hasPhoto: Boolean(l.medicine.hasPhoto),
            usage: l.medicine.usage ? String(l.medicine.usage).slice(0, 300) : null,
            status: "bor",
          },
          pharmacy: ph,
          qty: Math.max(1, Math.min(99, Math.round(Number(l.qty)) || 1)),
        };
      });

    return lines.length > 0 ? { pharmacy: lines[0]?.pharmacy || fallbackPharmacy, lines } : null;
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

/** Global savat oynasini ochish, yopish va almashtirish hodisalari. */
export const OPEN_CART_EVENT = "agroz:open-cart";
export const CLOSE_CART_EVENT = "agroz:close-cart";
export const TOGGLE_CART_EVENT = "agroz:toggle-cart";

export function openCart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_CART_EVENT));
}

export function closeCart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CLOSE_CART_EVENT));
}

export function toggleCart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(TOGGLE_CART_EVENT));
}

