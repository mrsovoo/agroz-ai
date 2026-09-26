"use client";

/**
 * Bosh sahifa kartochkasidagi «Savatga» tugmasi — umumiy localStorage
 * savatiga yozadi (Agro Bozor bilan bir xil savat, event orqali sinxron).
 * Boshqa dorixona dorilari savatda bo'lsa tasdiqlash so'raydi.
 */

import { useEffect, useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStoreMedicine,
  type CartStorePharmacy,
} from "@/lib/cart-store";

export default function AddToCartButton({
  medicine,
  pharmacy,
}: {
  medicine: CartStoreMedicine;
  pharmacy: CartStorePharmacy;
}) {
  const [qty, setQty] = useState(0);

  useEffect(() => {
    const sync = () => {
      const cart = loadCart();
      setQty(
        cart && cart.pharmacy.id === pharmacy.id
          ? (cart.lines.find((l) => l.medicine.id === medicine.id)?.qty ?? 0)
          : 0,
      );
    };
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pharmacy.id, medicine.id]);

  function add() {
    const cart = loadCart();
    if (cart && cart.pharmacy.id !== pharmacy.id) {
      if (
        !confirm(`Savatda boshqa dorixona (${cart.pharmacy.name}) dorilari bor. Yangi dorixona dorilari savatni almashtiradi. Davom etamizmi?`)
      ) {
        return;
      }
    }
    if (!cart || cart.pharmacy.id !== pharmacy.id) {
      saveCart({ pharmacy, lines: [{ medicine, qty: 1 }] });
    } else {
      const existing = cart.lines.find((l) => l.medicine.id === medicine.id);
      const lines = existing
        ? cart.lines.map((l) =>
            l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
          )
        : [...cart.lines, { medicine, qty: 1 }];
      saveCart({ ...cart, lines });
    }
    notifyCartChanged();
  }

  return (
    <button
      onClick={add}
      className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold transition active:scale-[0.97] ${
        qty > 0 ? "text-[var(--brand-green)]" : "text-white"
      }`}
      style={qty > 0 ? { background: "var(--brand-green-soft)" } : { background: "var(--brand-green)" }}
    >
      {qty > 0 ? <Check size={13} /> : <ShoppingCart size={13} />}
      {qty > 0 ? `Savatda (${qty})` : "Savatga"}
    </button>
  );
}
