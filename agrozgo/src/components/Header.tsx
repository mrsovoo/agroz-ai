import React, { useEffect, useState } from 'react';
import { Menu, X, Store, Search, ShoppingBag } from 'lucide-react';
import { Logo } from './ui';
import { NAV_LINKS, BIZNESGO_URL } from '../data/content';

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-3 sm:pt-4 transition-all">
      <div className="container-x flex items-center justify-between gap-3">
        {/* Chap: Logo Pill */}
        <div className="flex items-center rounded-full bg-white/90 border border-charcoal/10 px-4 py-2 shadow-card backdrop-blur-md">
          <Logo className="h-6 sm:h-7" />
        </div>

        {/* Markaziy suzuvchi Pill menyu */}
        <nav className="hidden items-center gap-1 rounded-full bg-white/90 border border-charcoal/10 p-1.5 shadow-card backdrop-blur-md lg:flex">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                i === 0
                  ? 'bg-forest-dark text-white shadow-sm'
                  : 'text-charcoal/70 hover:bg-agroGreen-50 hover:text-agroGreen-900'
              }`}
            >
              {l.label}
            </a>
          ))}

          {/* Qidiruv pill */}
          <a
            href="#top"
            className="ml-2 flex items-center gap-2 rounded-full bg-cream-soft border border-charcoal/10 px-3.5 py-1.5 text-xs text-charcoal/60 transition hover:border-agroGreen/40 hover:bg-white"
          >
            <Search className="h-3.5 w-3.5 text-charcoal/40" />
            <span className="font-medium">Qidirish...</span>
          </a>

          <a
            href="#products"
            className="grid h-8 w-8 place-items-center rounded-full bg-cream-soft text-charcoal/70 transition hover:bg-agroGreen-50 hover:text-agroGreen-900"
            title="Mahsulotlar"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </a>
        </nav>

        {/* O'ng: Bog'lanish / B2B do'konlar tugmasi */}
        <div className="flex items-center gap-2">
          <a
            href={BIZNESGO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-forest-dark border border-forest-border hover:border-agroGreen/40 px-4 py-2 text-xs font-extrabold text-white transition shadow-sm hover:shadow-soft sm:inline-flex active:scale-95"
          >
            <Store className="h-3.5 w-3.5 text-agroGreen" />
            BiznesGO (B2B)
          </a>
          <a
            href="#contact"
            className="rounded-full bg-white/90 border border-charcoal/10 px-4 py-2 text-xs font-extrabold text-charcoal hover:bg-agroGreen hover:text-forest-dark transition shadow-card backdrop-blur-md"
          >
            Bog‘lanish
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white border border-charcoal/10 shadow-card lg:hidden cursor-pointer"
            aria-label="Menyu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="container-x pb-4 md:hidden">
          <nav className="space-y-1 rounded-2xl bg-white border border-charcoal/5 p-2 shadow-soft">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-charcoal hover:bg-agroGreen-50 hover:text-agroGreen-900 transition"
              >
                {l.label}
              </a>
            ))}
            <a
              href={BIZNESGO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-forest-dark border border-forest-border px-4 py-3 text-sm font-semibold text-white"
            >
              <Store className="h-4 w-4 text-agroGreen" />
              BiznesGO (B2B) Do‘konlar uchun
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

