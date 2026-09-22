import Link from "next/link";
import { Sprout } from "lucide-react";

const columns = [
  {
    title: "Xizmatlar",
    links: [
      { href: "/dorilar", label: "Dorilar" },
      { href: "/xarita", label: "Xarita" },
      { href: "/mutaxassislar", label: "Mutaxassislar" },
      { href: "/yangiliklar", label: "Maslahatlar" },
    ],
  },
  {
    title: "Hisob",
    links: [
      { href: "/profil", label: "Profil va tarix" },
      { href: "/kirish", label: "Kirish" },
      { href: "/api/health", label: "Tizim holati" },
    ],
  },
];

export default function WebFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="web-footer">
      <div className="web-footer-inner">
        <div className="web-footer-brand">
          <span className="web-brand-mark">
            <Sprout size={20} />
          </span>
          <div>
            <strong>Agroz AI</strong>
            <p>
              Ekin va chorva kasalliklariga AI tashxis, yaqin dorixonalar va ob-havoga mos
              tavsiyalar.
            </p>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} className="web-footer-col" aria-label={col.title}>
            <h2>{col.title}</h2>
            <ul>
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="web-footer-bottom">
        <span>© {year} Agroz AI</span>
        <span>Tavsiyalar maslahat xarakterida — jiddiy holatlarda mutaxassisga murojaat qiling.</span>
      </div>
    </footer>
  );
}
