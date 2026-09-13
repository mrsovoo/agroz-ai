"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Newspaper, PawPrint, Sprout, UserRound, UsersRound } from "lucide-react";

const links = [
  { href: "/", label: "Asosiy", Icon: Sprout },
  { href: "/tashxis/crop", label: "Ekin tashxisi", Icon: Sprout },
  { href: "/tashxis/animal", label: "Chorva tashxisi", Icon: PawPrint },
  { href: "/xarita", label: "Xarita", Icon: MapPin },
  { href: "/mutaxassislar", label: "Mutaxassislar", Icon: UsersRound },
  { href: "/yangiliklar", label: "Maslahatlar", Icon: Newspaper },
];

export default function WebTopNav() {
  const pathname = usePathname();

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

        <div className="web-actions">
          <Link href="/profil" className="web-profile-link">
            <UserRound size={18} />
            Profil
          </Link>
        </div>
      </div>
    </header>
  );
}
