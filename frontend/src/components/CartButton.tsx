"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { loadCart, openCart, CART_EVENT } from "@/lib/cart-store";

export default function CartButton({ className = "" }: { className?: string }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const c = loadCart();
      setCartCount(c?.lines?.reduce((s, l) => s + l.qty, 0) ?? 0);
    };
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => openCart()}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-ink)] shadow-sm hover:bg-neutral-50 active:scale-95 transition ${className}`}
      aria-label="Savatni ochish"
    >
      <ShoppingCart size={20} className={cartCount > 0 ? "text-[var(--brand-green)]" : "text-neutral-700"} />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10.5px] font-black text-white shadow-xs animate-in zoom-in-50">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}

