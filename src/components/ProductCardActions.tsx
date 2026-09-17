"use client";

/**
 * Tafsilot sahifasi uchun harakatlar: 🛒 Savatga (umumiy savat) va ❤️ yoqtirish.
 * ProductCard bilan bir xil omborlarga yozadi — barcha sahifada sinxron.
 */

import { useEffect, useState } from "react";
import { Check, Heart, ShoppingCart } from "lucide-react";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStoreMedicine,
  type CartStorePharmacy,
} from "@/lib/cart-store";
import { isFavorite, toggleFavorite, FAV_EVENT } from "@/lib/favorites-store";

export default function ProductCardActions({
  medicine,
  pharmacy,
}: {
  medicine: CartStoreMedicine;
  pharmacy: CartStorePharmacy;
}) {
  const [liked, setLiked] = useState(false);
  const [qty, setQty] = useState(0);

  useEffect(() => {
    const sync = () => {
      setLiked(isFavorite(pharmacy.id, medicine.id));
      const cart = loadCart();
      setQty(
        cart && cart.pharmacy.id === pharmacy.id
          ? (cart.lines.find((l) => l.medicine.id === medicine.id)?.qty ?? 0)
          : 0,
      );
    };
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pharmacy.id, medicine.id]);

  function add() {
    const cart = loadCart();
    if (cart && cart.pharmacy.id !== pharmacy.id) {
      if (
        !confirm(
          `Savatda boshqa dorixona (${cart.pharmacy.name}) dorilari bor. Yangi dorixona dorilari savatni almashtiradi. Davom etamizmi?`,
        )
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
    <div className="mt-3 flex items-center gap-2">
      <button
        onClick={add}
        className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold transition active:scale-[0.98] ${
          qty > 0 ? "text-[var(--brand-green)]" : "text-white"
        }`}
        style={qty > 0 ? { background: "var(--brand-green-soft)" } : { background: "var(--brand-green)" }}
      >
        {qty > 0 ? <Check size={18} /> : <ShoppingCart size={18} />}
        {qty > 0 ? `Savatda (${qty}) — yana qo'shish` : "Savatga qo'shish"}
      </button>
      <button
        onClick={() => setLiked(toggleFavorite(pharmacy.id, medicine.id))}
        aria-label={liked ? "Yoqtirilganlardan olib tashlash" : "Yoqtirilganlarga qo'shish"}
        aria-pressed={liked}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm transition active:scale-90"
      >
        <Heart
          size={20}
          className={liked ? "text-[#e0245e]" : "text-[var(--brand-muted)]"}
          fill={liked ? "#e0245e" : "none"}
        />
      </button>
    </div>
  );
}
