import React, { useEffect, useState } from 'react';
import { Menu, X, Store } from 'lucide-react';
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
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${
        scrolled ? 'bg-cream/90 shadow-card backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 rounded-full bg-white/80 border border-charcoal/5 p-1 shadow-card backdrop-blur-md md:flex">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                i === 0 ? 'bg-forest-dark text-white shadow-sm' : 'text-charcoal/75 hover:bg-agroGreen-50 hover:text-agroGreen-900'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={BIZNESGO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-forest-dark border border-forest-border hover:border-agroGreen/40 px-4 py-2 text-xs font-bold text-white transition shadow-sm hover:shadow-soft sm:inline-flex active:scale-95"
          >
            <Store className="h-4 w-4 text-agroGreen" />
            BiznesGO (B2B) Do‘konlar uchun
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white border border-charcoal/5 shadow-card md:hidden cursor-pointer"
            aria-label="Menyu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

