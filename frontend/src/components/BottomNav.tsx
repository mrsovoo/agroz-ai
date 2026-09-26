"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Pill, ShoppingCart, UsersRound, UserRound } from "lucide-react";
import { loadCart, closeCart, toggleCart, CART_EVENT } from "@/lib/cart-store";
import { haptic } from "@/lib/telegram";

export default function BottomNav() {
  const pathname = usePathname();
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

  const isHome = pathname === "/";
  const isDorilar = pathname.startsWith("/dorilar") || pathname.startsWith("/dori/");
  const isSpecialists = pathname.startsWith("/mutaxassislar");
  const isProfile = pathname.startsWith("/profil") || pathname.startsWith("/kirish");

  // Har qanday boshqa bo'limga o'tganda savatni darhol yopish
  const handleNavClick = () => {
    haptic("light");
    closeCart();
  };

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 transition-all"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        WebkitBackdropFilter: "blur(24px) saturate(190%)",
        backdropFilter: "blur(24px) saturate(190%)",
        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      <ul className="grid grid-cols-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
        {/* 1. Asosiy */}
        <li>
          <Link
            href="/"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isHome ? "text-[var(--brand-green)]" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Home size={23} strokeWidth={isHome ? 2.5 : 1.8} />
            <span>Asosiy</span>
          </Link>
        </li>

        {/* 2. Dorilar */}
        <li>
          <Link
            href="/dorilar"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isDorilar ? "text-[var(--brand-green)]" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <Pill size={23} strokeWidth={isDorilar ? 2.5 : 1.8} />
            <span>Dorilar</span>
          </Link>
        </li>

        {/* 3. Savat — bosilganda ochiladi, qayta bosilsa yopiladi */}
        <li>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              toggleCart();
            }}
            className="flex w-full flex-col items-center gap-1 py-1 text-[11px] font-bold text-neutral-500 hover:text-[var(--brand-green)] active:scale-90 transition-all"
            aria-label="Savat"
          >
            <div className="relative">
              <ShoppingCart
                size={23}
                strokeWidth={cartCount > 0 ? 2.4 : 1.8}
                className={cartCount > 0 ? "text-[var(--brand-green)]" : ""}
              />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-xs animate-in zoom-in-50">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            <span className={cartCount > 0 ? "text-[var(--brand-green)]" : ""}>Savat</span>
          </button>
        </li>

        {/* 4. Mutaxassislar — bosilganda savat yopiladi va mutaxassislar ochiladi */}
        <li>
          <Link
            href="/mutaxassislar"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isSpecialists ? "text-[var(--brand-green)]" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <UsersRound size={23} strokeWidth={isSpecialists ? 2.5 : 1.8} />
            <span>Mutaxassis</span>
          </Link>
        </li>

        {/* 5. Profil */}
        <li>
          <Link
            href="/profil"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isProfile ? "text-[var(--brand-green)]" : "text-neutral-500 hover:text-neutral-900"
            }`}
          >
            <UserRound size={23} strokeWidth={isProfile ? 2.5 : 1.8} />
            <span>Profil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
