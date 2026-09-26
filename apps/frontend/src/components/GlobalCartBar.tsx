"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import {
  loadCart,
  openCart,
  CART_EVENT,
  type CartStoreState,
} from "@/lib/cart-store";

function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

export default function GlobalCartBar() {
  const [cart, setCart] = useState<CartStoreState>(null);

  useEffect(() => {
    const sync = () => setCart(loadCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!cart || !cart.lines || cart.lines.length === 0) {
    return null;
  }

  const totalQty = cart.lines.reduce((s, l) => s + l.qty, 0);
  const totalSum = cart.lines.reduce((s, l) => s + (l.medicine.price ?? 0) * l.qty, 0);

  return (
    <aside
      aria-label="Savatdagi mahsulotlar"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(65px+max(10px,env(safe-area-inset-bottom)))] z-40 flex justify-center px-4 web:bottom-6 web:left-auto web:right-6 web:px-0"
    >
      <button
        onClick={() => openCart()}
        className="pointer-events-auto flex w-full max-w-[480px] items-center justify-between gap-3 rounded-2xl bg-neutral-950/95 px-4 py-3.5 text-white shadow-2xl backdrop-blur-md transition hover:bg-black active:scale-[0.98] web:w-auto web:min-w-[340px]"
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-green)] text-white shadow-xs">
            <ShoppingCart size={19} />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white shadow-xs">
              {totalQty}
            </span>
          </div>
          <div className="text-left">
            <p className="text-[14px] font-extrabold leading-tight">
              {totalQty} ta dori savatda
            </p>
            <p className="text-[12px] font-medium text-neutral-300">
              {totalSum > 0 ? `${shortSum(totalSum)} so'm` : "Narx kelishiladi"} • {cart.pharmacy.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl bg-[var(--brand-green)] px-3.5 py-2 text-[13px] font-bold text-white shadow-sm">
          <span>Buyurtma</span>
          <ArrowRight size={15} />
        </div>
      </button>
    </aside>
  );
}

