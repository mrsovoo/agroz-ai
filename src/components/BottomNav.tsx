"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Lightbulb, UserRound, UsersRound } from "lucide-react";

const items = [
  { href: "/", label: "Asosiy", Icon: Home },
  { href: "/xarita", label: "Dorixona", Icon: Map },
  { href: "/mutaxassislar", label: "Mutaxassis", Icon: UsersRound },
  { href: "/yangiliklar", label: "Maslahat", Icon: Lightbulb },
  { href: "/profil", label: "Profil", Icon: UserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
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
                <Icon size={24} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
