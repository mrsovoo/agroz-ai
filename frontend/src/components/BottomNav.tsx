"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Pill, UserRound, UsersRound } from "lucide-react";
import { loadCart, CART_EVENT } from "@/lib/cart-store";

const items = [
  { href: "/", label: "Asosiy", Icon: Home },
  { href: "/dorilar", label: "Bozor", Icon: Pill },
  { href: "/xarita", label: "Xarita", Icon: Map },
  { href: "/mutaxassislar", label: "Mutaxassis", Icon: UsersRound },
  { href: "/profil", label: "Profil", Icon: UserRound },
];

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

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-1/2 z-50 w-full max-w-[520px] -translate-x-1/2"
      style={{
        background: "rgba(255,255,255,0.86)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderTop: "1px solid rgba(0,0,0,0.07)",
      }}
    >
      <ul className="grid grid-cols-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-0.5 text-[11px] font-semibold transition-colors ${
                  active ? "text-[var(--brand-green)]" : "text-[var(--brand-muted)]"
                }`}
              >
                <div className="relative">
                  <Icon size={24} strokeWidth={active ? 2.4 : 1.8} />
                  {href === "/dorilar" && cartCount > 0 && (
                    <span className="absolute -top-1 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9.5px] font-black text-white shadow-xs">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

