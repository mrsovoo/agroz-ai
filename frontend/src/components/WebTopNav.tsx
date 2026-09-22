"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ShoppingCart, Sprout } from "lucide-react";
import { loadCart, closeCart, toggleCart, CART_EVENT } from "@/lib/cart-store";

const links = [
  { href: "/", label: "Asosiy" },
  { href: "/dorilar", label: "Dorilar" },
  { href: "/mutaxassislar", label: "Mutaxassislar" },
  { href: "/xarita", label: "Xarita" },
  { href: "/yangiliklar", label: "Maslahatlar" },
];

export default function WebTopNav() {
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  return (
    <header className="web-top-nav">
      <div className="web-top-nav-inner">
        <Link
          href="/"
          prefetch={true}
          onClick={() => closeCart()}
          className="web-brand"
          aria-label="Agroz AI bosh sahifa"
        >
          <span className="web-brand-mark">
            <Sprout size={24} />
          </span>
          <span className="web-brand-text">
            <strong>Agroz AI</strong>
            <small>Dehqon va chorvador yordamchisi</small>
          </span>
        </Link>

        {/* Faqat matnli toza navigatsiya havolalari — tezkor prefetch bilan */}
        <nav className="web-links" aria-label="Asosiy navigatsiya">
          {links.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                onClick={() => closeCart()}
                className={`relative px-3.5 py-2 rounded-xl text-[14px] font-bold transition-all duration-150 ${
                  active
                    ? "bg-[var(--brand-green-soft)] text-[var(--brand-green)]"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-black/5"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="web-actions flex items-center gap-2.5">
          {/* Bildirishnomalar */}
          <Link
            href="/bildirishnomalar"
            prefetch={true}
            onClick={() => closeCart()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-black/10 text-neutral-700 hover:text-black hover:border-black/20 hover:bg-black/5 transition-all active:scale-95 shadow-2xs"
            title="Bildirishnomalar"
          >
            <Bell size={18} />
          </Link>

          {/* Savat — ochadi / yopadi */}
          <button
            type="button"
            onClick={() => toggleCart()}
            className="relative flex items-center gap-2 rounded-xl bg-white border border-black/10 px-3.5 py-2 text-[14px] font-bold text-neutral-800 hover:border-[var(--brand-green)]/50 hover:text-[var(--brand-green)] hover:bg-[var(--brand-green-soft)]/50 transition-all active:scale-95 shadow-2xs"
          >
            <ShoppingCart size={18} />
            <span>Savat</span>
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-green)] px-1.5 text-[11px] font-black text-white shadow-2xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profil */}
          <Link
            href="/profil"
            prefetch={true}
            onClick={() => closeCart()}
            className={`web-profile-link px-4 py-2 rounded-xl text-[14px] font-bold transition-all ${
              pathname.startsWith("/profil")
                ? "bg-[var(--brand-green)] text-white shadow-xs"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            Profil
          </Link>
        </div>
      </div>
    </header>
  );
}
