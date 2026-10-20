import React, { useEffect, useState, useRef } from 'react';
import { Menu, X, Store, ChevronDown, Globe, Sparkles, Smartphone, ArrowRight, Leaf, Wheat, Warehouse, Sprout, Wrench } from 'lucide-react';
import { Logo } from './ui';
import { BIZNESGO_URL } from '../data/content';

export const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sectorDropdown, setSectorDropdown] = useState(false);
  const [currentLang, setCurrentLang] = useState<'UZ' | 'RU'>('UZ');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tashqariga bosilganda dropdownni yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSectorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const SECTOR_SUBMENU = [
    { label: 'O‘g‘itlar va Vet-Dorilar', tag: 'Agro-Vet', icon: Leaf, href: '#sectors' },
    { label: 'Yem va Ozuqalar', tag: 'Feed', icon: Wheat, href: '#sectors' },
    { label: 'Ombor va Qadoqlash', tag: 'Warehouse', icon: Warehouse, href: '#sectors' },
    { label: 'Urug‘lar va Ko‘chatlar', tag: 'Seeds', icon: Sprout, href: '#sectors' },
    { label: 'Jihozlar va Agro-Texnika', tag: 'Machinery', icon: Wrench, href: '#sectors' },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-cream/90 backdrop-blur-md shadow-card border-b border-charcoal/5 py-2.5'
          : 'bg-cream/60 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container-x flex items-center justify-between gap-4">
        {/* Chap: Rasmiy Logo */}
        <div className="flex items-center">
          <Logo className="h-7 sm:h-8" />
        </div>

        {/* Markaz: Asosiy Desktop Navigatsiya */}
        <nav className="hidden items-center gap-1 rounded-full bg-white/95 border border-charcoal/10 p-1.5 shadow-card backdrop-blur-md lg:flex">
          {/* Biz Haqimizda */}
          <a
            href="#about"
            className="rounded-full px-3.5 py-1.5 text-xs font-bold text-charcoal/80 transition hover:bg-agroGreen-50 hover:text-agroGreen-900"
          >
            Biz Haqimizda
          </a>

          {/* Sektorlar (Interactive Dropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setSectorDropdown((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                sectorDropdown
                  ? 'bg-forest-dark text-white'
                  : 'text-charcoal/80 hover:bg-agroGreen-50 hover:text-agroGreen-900'
              }`}
            >
              Sektorlar
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  sectorDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {sectorDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-soft border border-charcoal/10 animate-fade-up">
                <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-charcoal/40">
                  Agro-Yo‘nalishlar
                </p>
                {SECTOR_SUBMENU.map((item) => (
                  <a
                    key={item.tag}
                    href={item.href}
                    onClick={() => setSectorDropdown(false)}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-charcoal hover:bg-agroGreen-50 hover:text-agroGreen-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-agroGreen-50 text-agroGreen-800">
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] font-bold text-agroGreen-800 bg-agroGreen-100/60 px-1.5 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Mahsulotlar */}
          <a
            href="#products"
            className="rounded-full px-3.5 py-1.5 text-xs font-bold text-charcoal/80 transition hover:bg-agroGreen-50 hover:text-agroGreen-900"
          >
            Mahsulotlar
          </a>

          {/* Imkoniyatlar */}
          <a
            href="#technology"
            className="rounded-full px-3.5 py-1.5 text-xs font-bold text-charcoal/80 transition hover:bg-agroGreen-50 hover:text-agroGreen-900 flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 text-amber" />
            Imkoniyatlar
          </a>

          {/* Bog'lanish */}
          <a
            href="#contact"
            className="rounded-full px-3.5 py-1.5 text-xs font-bold text-charcoal/80 transition hover:bg-agroGreen-50 hover:text-agroGreen-900"
          >
            Bog‘lanish
          </a>
        </nav>

        {/* O'ng tomon: Til tanlash (UZ/RU) + BiznesGO CTA Button */}
        <div className="flex items-center gap-2.5">
          {/* Til Tanlagich (UZ / RU) */}
          <div className="flex items-center rounded-full bg-white/90 border border-charcoal/10 p-1 shadow-card text-[11px] font-black">
            <button
              type="button"
              onClick={() => setCurrentLang('UZ')}
              className={`rounded-full px-2.5 py-1 transition cursor-pointer ${
                currentLang === 'UZ'
                  ? 'bg-forest-dark text-white shadow-sm'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              UZ
            </button>
            <button
              type="button"
              onClick={() => setCurrentLang('RU')}
              className={`rounded-full px-2.5 py-1 transition cursor-pointer ${
                currentLang === 'RU'
                  ? 'bg-forest-dark text-white shadow-sm'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              RU
            </button>
          </div>

          {/* BiznesGO (B2B) Do'konlar Uchun CTA Tugmasi */}
          <a
            href={BIZNESGO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-forest-dark border border-forest-border hover:border-agroGreen/40 px-4 py-2 text-xs font-extrabold text-white transition shadow-sm hover:shadow-soft sm:inline-flex active:scale-95 group"
          >
            <Store className="h-3.5 w-3.5 text-agroGreen group-hover:scale-110 transition-transform" />
            <span>BiznesGO (B2B) Do‘konlar Uchun</span>
            <ArrowRight className="h-3 w-3 text-white/50 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {/* Mobil Menyu Gamburger Tugmasi */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white border border-charcoal/10 shadow-card lg:hidden cursor-pointer active:scale-95 text-charcoal"
            aria-label="Menyu"
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* MOBIL MENYU SLIDER / DRAWER */}
      {open && (
        <div className="fixed inset-x-0 top-full bg-forest-dark/40 backdrop-blur-md min-h-screen lg:hidden animate-fade-up">
          <div className="container-x pt-3 pb-8">
            <nav className="space-y-1.5 rounded-3xl bg-white border border-charcoal/10 p-4 shadow-soft">
              <a
                href="#about"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-bold text-charcoal hover:bg-agroGreen-50 hover:text-agroGreen-900 transition"
              >
                Biz Haqimizda
              </a>

              {/* Sektorlar ro'yxati (Mobile Accordion style) */}
              <div className="rounded-2xl bg-cream-soft p-3">
                <p className="px-1 text-[11px] font-black uppercase tracking-wider text-charcoal/50 mb-1.5">
                  5 ta Sektor
                </p>
                <div className="space-y-1">
                  {SECTOR_SUBMENU.map((item) => (
                    <a
                      key={item.tag}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold text-charcoal hover:bg-white transition"
                    >
                      <span className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded bg-agroGreen-100/60 text-agroGreen-900">
                          <item.icon className="h-3 w-3" />
                        </span>
                        <span>{item.label}</span>
                      </span>
                      <span className="text-[10px] font-bold text-agroGreen-800 bg-agroGreen-100 px-2 py-0.5 rounded">
                        {item.tag}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              <a
                href="#products"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-bold text-charcoal hover:bg-agroGreen-50 hover:text-agroGreen-900 transition"
              >
                Mahsulotlar
              </a>

              <a
                href="#technology"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-bold text-charcoal hover:bg-agroGreen-50 hover:text-agroGreen-900 transition"
              >
                Imkoniyatlar
              </a>

              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-bold text-charcoal hover:bg-agroGreen-50 hover:text-agroGreen-900 transition"
              >
                Bog‘lanish
              </a>

              {/* Mobil Til Tanlash */}
              <div className="flex items-center justify-between rounded-2xl bg-cream-soft px-4 py-2.5 mt-2">
                <span className="text-xs font-bold text-charcoal/70 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-agroGreen-800" /> Tilni tanlang:
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentLang('UZ')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      currentLang === 'UZ' ? 'bg-forest-dark text-white' : 'bg-white text-charcoal/70'
                    }`}
                  >
                    UZ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentLang('RU')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      currentLang === 'RU' ? 'bg-forest-dark text-white' : 'bg-white text-charcoal/70'
                    }`}
                  >
                    RU
                  </button>
                </div>
              </div>

              {/* BiznesGO Mobile Button */}
              <a
                href={BIZNESGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-forest-dark py-3.5 text-sm font-bold text-white shadow-md active:scale-95"
              >
                <Store className="h-4 w-4 text-agroGreen" />
                BiznesGO (B2B) Do‘konlar Uchun
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
