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
      className="mobile-bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2 transition-all bg-white border-t border-neutral-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
    >
      <ul className="grid grid-cols-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
        {/* 1. Asosiy */}
        <li>
          <Link
            href="/"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isHome ? "text-[#0ba324]" : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <Home size={22} strokeWidth={isHome ? 2.6 : 2} />
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
              isDorilar ? "text-[#0ba324]" : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <Pill size={22} strokeWidth={isDorilar ? 2.6 : 2} />
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
            className="flex w-full flex-col items-center gap-1 py-1 text-[11px] font-bold text-neutral-400 hover:text-neutral-700 active:scale-90 transition-all"
            aria-label="Savat"
          >
            <div className="relative">
              <ShoppingCart
                size={22}
                strokeWidth={2}
                className="text-neutral-400"
              />
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-black text-white shadow-xs">
                {cartCount > 0 ? (cartCount > 9 ? "9+" : cartCount) : 1}
              </span>
            </div>
            <span>Savat</span>
          </button>
        </li>

        {/* 4. Mutaxassislar */}
        <li>
          <Link
            href="/mutaxassislar"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isSpecialists ? "text-[#0ba324]" : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <UsersRound size={22} strokeWidth={isSpecialists ? 2.6 : 2} />
            <span>Mutaxasislar</span>
          </Link>
        </li>

        {/* 5. Profil */}
        <li>
          <Link
            href="/profil"
            prefetch={true}
            onClick={handleNavClick}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isProfile ? "text-[#0ba324]" : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            <UserRound size={22} strokeWidth={isProfile ? 2.6 : 2} />
            <span>Profil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
