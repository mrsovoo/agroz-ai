"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  MapPin,
  Newspaper,
  PawPrint,
  Pill,
  ShoppingCart,
  Sprout,
  UserRound,
  UsersRound,
} from "lucide-react";
import { loadCart, openCart, CART_EVENT } from "@/lib/cart-store";

const links = [
  { href: "/", label: "Asosiy", Icon: Sprout },
  { href: "/tashxis/crop", label: "Ekin tashxisi", Icon: Sprout },
  { href: "/tashxis/animal", label: "Chorva tashxisi", Icon: PawPrint },
  { href: "/dorilar", label: "Agro Bozor", Icon: Pill },
  { href: "/xarita", label: "Xarita", Icon: MapPin },
  { href: "/mutaxassislar", label: "Mutaxassislar", Icon: UsersRound },
  { href: "/yangiliklar", label: "Maslahatlar", Icon: Newspaper },
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
        <Link href="/" className="web-brand" aria-label="Agroz AI bosh sahifa">
          <span className="web-brand-mark">
            <Sprout size={24} />
          </span>
          <span className="web-brand-text">
            <strong>Agroz AI</strong>
            <small>Dehqon va chorvador yordamchisi</small>
          </span>
        </Link>

        <nav className="web-links" aria-label="Asosiy navigatsiya">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={isActive(href) ? "is-active" : undefined}
              aria-current={isActive(href) ? "page" : undefined}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="web-actions flex items-center gap-2.5">
          {/* Bildirishnomalar */}
          <Link
            href="/bildirishnomalar"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-black/10 text-neutral-700 hover:text-black hover:border-black/20 transition active:scale-95"
            title="Bildirishnomalar"
          >
            <Bell size={18} />
          </Link>

          {/* Savat */}
          <button
            type="button"
            onClick={() => openCart()}
            className="relative flex items-center gap-2 rounded-xl bg-white border border-black/10 px-3.5 py-2 text-[14px] font-bold text-neutral-800 hover:border-[var(--brand-green)]/40 hover:text-[var(--brand-green)] transition active:scale-95"
          >
            <ShoppingCart size={18} />
            <span>Savat</span>
            {cartCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-green)] px-1.5 text-[11px] font-black text-white">
                {cartCount}
              </span>
            )}
          </button>

          <Link href="/profil" className="web-profile-link">
            <UserRound size={18} />
            Profil
          </Link>
        </div>
      </div>
    </header>
  );
}

