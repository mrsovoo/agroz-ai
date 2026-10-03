"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Pill, ShoppingCart, UsersRound, UserRound } from "lucide-react";
import {
  loadCart,
  closeCart,
  toggleCart,
  CART_EVENT,
  OPEN_CART_EVENT,
  CLOSE_CART_EVENT,
  TOGGLE_CART_EVENT,
} from "@/lib/cart-store";
import { haptic } from "@/lib/telegram";

export default function BottomNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const c = loadCart();
      setCartCount(c?.lines?.reduce((s, l) => s + l.qty, 0) ?? 0);
    };
    sync();

    const handleOpen = () => setIsCartOpen(true);
    const handleClose = () => setIsCartOpen(false);
    const handleToggle = () => setIsCartOpen((prev) => !prev);
    const handleSpecialistModal = (e: any) => {
      setIsSpecialistModalOpen(Boolean(e.detail?.open));
    };

    window.addEventListener(CART_EVENT, sync);
    window.addEventListener(OPEN_CART_EVENT, handleOpen);
    window.addEventListener(CLOSE_CART_EVENT, handleClose);
    window.addEventListener(TOGGLE_CART_EVENT, handleToggle);
    window.addEventListener("SPECIALIST_MODAL_TOGGLE", handleSpecialistModal);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener(OPEN_CART_EVENT, handleOpen);
      window.removeEventListener(CLOSE_CART_EVENT, handleClose);
      window.removeEventListener(TOGGLE_CART_EVENT, handleToggle);
      window.removeEventListener("SPECIALIST_MODAL_TOGGLE", handleSpecialistModal);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Boshqa sahifaga o'tganda (agar /savat bo'lmasa) savat modalini yopish
  useEffect(() => {
    if (pathname !== "/savat") {
      setIsCartOpen(false);
    }
  }, [pathname]);

  // Ob-havo ichki sahifasida, mutaxassis chaqirish modalida yoki savat ochiqligida pastki nav bar ko'rinmasligi kerak
  if (
    pathname === "/ob-havo" ||
    pathname?.startsWith("/ob-havo") ||
    isSpecialistModalOpen ||
    isCartOpen
  ) {
    return null;
  }

  // Qaysi bo'limda bo'lsa, o'sha yashil (#0ba324), qolganlari och kulrang
  const isSavat = pathname === "/savat" || isCartOpen;
  const isDorilar = !isSavat && Boolean(pathname?.startsWith("/dorilar") || pathname?.startsWith("/dori") || pathname?.startsWith("/agro-mahsulot"));
  const isSpecialists = !isSavat && Boolean(pathname?.startsWith("/mutaxassislar"));
  const isProfile = !isSavat && Boolean(pathname?.startsWith("/profil") || pathname?.startsWith("/kirish"));
  const isHome = !isSavat && !isDorilar && !isSpecialists && !isProfile && (pathname === "/" || !pathname || pathname === "");

  const handleNavClick = () => {
    haptic("light");
    closeCart();
    setIsCartOpen(false);
  };

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-1/2 z-[50] w-full max-w-[520px] -translate-x-1/2 transition-all bg-white border-t border-neutral-100 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]"
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
            <Home size={22} strokeWidth={isHome ? 2.6 : 2} className={isHome ? "text-[#0ba324]" : "text-neutral-400"} />
            <span className={isHome ? "text-[#0ba324] font-bold" : "text-neutral-400"}>Asosiy</span>
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
            <Pill size={22} strokeWidth={isDorilar ? 2.6 : 2} className={isDorilar ? "text-[#0ba324]" : "text-neutral-400"} />
            <span className={isDorilar ? "text-[#0ba324] font-bold" : "text-neutral-400"}>Dorilar</span>
          </Link>
        </li>

        {/* 3. Savat */}
        <li>
          <button
            type="button"
            onClick={() => {
              haptic("medium");
              toggleCart();
            }}
            className={`flex w-full flex-col items-center gap-1 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isSavat ? "text-[#0ba324]" : "text-neutral-400 hover:text-neutral-700"
            }`}
            aria-label="Savat"
          >
            <div className="relative">
              <ShoppingCart
                size={22}
                strokeWidth={isSavat ? 2.6 : 2}
                className={isSavat ? "text-[#0ba324]" : "text-neutral-400"}
              />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-black text-white shadow-xs">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            <span className={isSavat ? "text-[#0ba324] font-bold" : "text-neutral-400"}>Savat</span>
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
            <UsersRound size={22} strokeWidth={isSpecialists ? 2.6 : 2} className={isSpecialists ? "text-[#0ba324]" : "text-neutral-400"} />
            <span className={isSpecialists ? "text-[#0ba324] font-bold" : "text-neutral-400"}>Mutaxassislar</span>
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
            <UserRound size={22} strokeWidth={isProfile ? 2.6 : 2} className={isProfile ? "text-[#0ba324]" : "text-neutral-400"} />
            <span className={isProfile ? "text-[#0ba324] font-bold" : "text-neutral-400"}>Profil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
