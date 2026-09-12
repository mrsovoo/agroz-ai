import Link from "next/link";
import { MapPin, Newspaper, Sprout, Stethoscope, UserRound } from "lucide-react";

const links = [
  { href: "/tashxis/crop", label: "Ekin tashxisi", Icon: Sprout },
  { href: "/tashxis/animal", label: "Chorva tashxisi", Icon: Stethoscope },
  { href: "/xarita", label: "Xarita", Icon: MapPin },
  { href: "/yangiliklar", label: "Maslahatlar", Icon: Newspaper },
];

export default function WebTopNav() {
  return (
    <header className="web-top-nav">
      <div className="web-top-nav-inner">
        <Link href="/" className="web-brand" aria-label="AgroVet AI bosh sahifa">
          <span className="web-brand-mark">
            <Sprout size={22} />
          </span>
          <span>
            <strong>AgroVet AI</strong>
            <small>Dehqon va chorvador yordamchisi</small>
          </span>
        </Link>

        <nav className="web-links" aria-label="Web navigatsiya">
          {links.map(({ href, label, Icon }) => (
            <Link key={href} href={href}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <Link href="/profil" className="web-profile-link">
          <UserRound size={17} />
          Profil
        </Link>
      </div>
    </header>
  );
}
