"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Menu,
  X,
  Store,
  Users,
  ArrowRight,
  Sprout,
  HelpCircle,
  Smartphone,
  CreditCard,
  Building2,
  Search,
  Check,
  Globe,
  Sparkles,
  BarChart3,
  Layers,
  ShieldCheck,
  ChevronDown,
  User,
} from "lucide-react";
import AgrozLogo from "@/components/AgrozLogo";
import { loadCart, closeCart, toggleCart, CART_EVENT } from "@/lib/cart-store";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";

export default function WebTopNav() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();

  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncCart = () => {
      const c = loadCart();
      setCartCount(c?.lines?.reduce((s, l) => s + l.qty, 0) ?? 0);
    };
    syncCart();
    window.addEventListener(CART_EVENT, syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  // Click outside to close language menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sahifa o'zgarganda menyularni yopish
  useEffect(() => {
    setMobileMenuOpen(false);
    setLangMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/#about", label: t.nav.about, isAnchor: true },
    { href: "/agrozgo", label: "AgrozGO" },
    { href: "/hamkorlik", label: t.nav.partners },
    { href: "/yangiliklar", label: t.nav.blog },
    { href: "/#aloqa", label: t.nav.contact, isAnchor: true },
  ];

  const isActive = (link: (typeof navLinks)[0]) => {
    if (link.isAnchor && link.href === "/#about") {
      return pathname === "/" || pathname === "";
    }
    if (link.href === "/") return pathname === "/";
    if (link.href.startsWith("/#")) return false;
    return pathname.startsWith(link.href);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="web-top-nav sticky top-0 z-50 w-full pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <header className="max-w-7xl mx-auto rounded-full bg-white/90 backdrop-blur-xl border border-black/8 shadow-md shadow-black/5 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 pointer-events-auto transition-all">
        {/* 1. Logotip - Brand Logo & Symbol */}
        <Link
          href="/"
          prefetch={true}
          onClick={() => {
            closeCart();
            setMobileMenuOpen(false);
          }}
          className="flex items-center shrink-0 group py-1"
          aria-label="AgrozGO Bosh sahifa"
        >
          <AgrozLogo className="h-6 sm:h-7 w-auto transition-transform group-hover:scale-102" />
        </Link>

        {/* 2. Asosiy Navigatsiya Tabs (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#F4F3ED] rounded-full p-1 text-[13px] font-medium text-zinc-700">
          {navLinks.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.label}
                href={link.href}
                prefetch={!link.href.startsWith("/#")}
                onClick={() => closeCart()}
                className={`px-4 py-1.5 rounded-full transition-all duration-150 flex items-center gap-1 ${
                  active
                    ? "bg-[#191B1F] text-white font-bold shadow-xs"
                    : "hover:text-black hover:bg-white/60"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 3. O'ng tomon Amallar (Til Tanlash, Qidiruv, Savat, Black pill CTA) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Apple-style Til tanlash Menyusi (Dropdown) */}
          <div className="relative" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F3ED] hover:bg-zinc-200 text-xs font-semibold text-zinc-800 transition active:scale-95 border border-black/5"
              aria-label="Tilni tanlash"
              aria-expanded={langMenuOpen}
            >
              <span className="text-sm">{currentLang.flag}</span>
              <span className="hidden sm:inline font-medium text-[11px] uppercase tracking-wider">{currentLang.code}</span>
              <ChevronDown size={11} className={`text-zinc-500 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Ochiluvchi Til Paneli */}
            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white/95 backdrop-blur-xl border border-black/10 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {lang === "uz" ? "Tilni tanlang" : "Select language"}
                </div>
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLang(item.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                      lang === item.code
                        ? "bg-[#191B1F] text-white font-bold"
                        : "text-zinc-700 hover:bg-zinc-100 font-medium"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-base">{item.flag}</span>
                      <span>{item.nativeName}</span>
                    </span>
                    {lang === item.code && <Check size={14} className="text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Qidiruv ikonka tugmasi */}
          <Link
            href="/agrozgo"
            onClick={() => closeCart()}
            className="w-9 h-9 rounded-full bg-[#F4F3ED] hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition"
            title={t.nav.search}
            aria-label={t.nav.search}
          >
            <Search size={15} />
          </Link>

          {/* Savat Tugmasi */}
          <button
            type="button"
            onClick={() => toggleCart()}
            className="relative flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition active:scale-95 shadow-2xs"
            title={t.nav.cart}
            aria-label={t.nav.cart}
          >
            <ShoppingCart size={15} className="text-emerald-700" />
            <span className="hidden sm:inline">{t.nav.cart}</span>
            {cartCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-black text-white ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* Kirish / Kabinet Tugmasi (Mijoz & Fermer uchun) */}
          <Link
            href="/kirish"
            prefetch={true}
            onClick={() => closeCart()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-800 transition active:scale-95 shadow-2xs"
          >
            <User size={13} className="text-zinc-600" />
            <span>{t.nav.cabinet}</span>
          </Link>

          {/* Do'konni ulash CTA (Biznes hamkorlik uchun) */}
          <Link
            href="/hamkorlik"
            prefetch={true}
            onClick={() => closeCart()}
            className="text-xs font-bold bg-[#191B1F] hover:bg-black text-white px-4 sm:px-5 py-2 rounded-full transition shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <span>{t.nav.connect_store}</span>
          </Link>

          {/* Mobil Menyu Gamburger Tugmasi */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full text-zinc-700 hover:text-black hover:bg-zinc-100 transition active:scale-95"
            aria-label="Menyu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* 4. Mobil Ochiluvchi Menyu Paneli (Apple Style Icons) */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="lg:hidden max-w-6xl mx-auto mt-2 rounded-3xl border border-black/8 bg-white/98 backdrop-blur-xl px-5 py-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto pointer-events-auto"
        >
          {/* Asosiy Ilova */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3">
              AgrozGO Ilova
            </div>
            <Link
              href="/agrozgo"
              onClick={() => {
                setMobileMenuOpen(false);
                closeCart();
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 text-emerald-950 font-bold text-xs"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <ShoppingCart size={15} />
                </span>
                <span>AgrozGO Web App (Bozor, Ob-havo, Ekspertlar)</span>
              </span>
              <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase font-black">
                Live
              </span>
            </Link>

            <Link
              href="/agrozgo#bozor"
              onClick={() => {
                setMobileMenuOpen(false);
                closeCart();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl text-zinc-800 hover:bg-zinc-50 font-bold text-xs"
            >
              <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center">
                <Store size={15} />
              </span>
              <span>{t.nav.market_title}</span>
            </Link>

            <Link
              href="/agrozgo#mutaxassislar"
              onClick={() => {
                setMobileMenuOpen(false);
                closeCart();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl text-zinc-800 hover:bg-zinc-50 font-bold text-xs"
            >
              <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center">
                <Users size={15} />
              </span>
              <span>{t.nav.specialists_title}</span>
            </Link>

            <Link
              href="/yangiliklar"
              onClick={() => {
                setMobileMenuOpen(false);
                closeCart();
              }}
              className="flex items-center gap-2.5 p-3 rounded-2xl text-zinc-800 hover:bg-zinc-50 font-semibold text-xs"
            >
              <span className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center">
                <Sprout size={15} />
              </span>
              <span>{t.nav.tips_title}</span>
            </Link>
          </div>

          {/* Platforma & Biznes */}
          <div className="border-t border-zinc-100 pt-3 space-y-1 text-xs font-semibold text-zinc-700">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3">
              {t.nav.about_platform}
            </div>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50"
            >
              <Store size={15} className="text-zinc-500" />
              <span>{t.nav.debt_book}</span>
            </Link>
            <Link
              href="/#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50"
            >
              <BarChart3 size={15} className="text-zinc-500" />
              <span>{t.nav.analytics}</span>
            </Link>
            <Link
              href="/#tariffs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50"
            >
              <CreditCard size={15} className="text-zinc-500" />
              <span>{t.nav.tariffs}</span>
            </Link>
            <Link
              href="/#aloqa"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-zinc-50"
            >
              <HelpCircle size={15} className="text-zinc-500" />
              <span>{t.nav.faq}</span>
            </Link>
          </div>

          {/* Amallar: Ro'yxatdan o'tish, Do'konni ulash va Kirish alohida */}
          <div className="border-t border-zinc-100 pt-3 space-y-2">
            <Link
              href="/hamkorlik"
              onClick={() => {
                setMobileMenuOpen(false);
                closeCart();
              }}
              className="w-full py-3 px-4 rounded-full bg-[#191B1F] hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{t.nav.connect_store}</span>
              <ArrowRight size={14} />
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                href="/kirish"
                onClick={() => {
                  setMobileMenuOpen(false);
                  closeCart();
                }}
                className="py-2.5 px-3 rounded-full bg-emerald-600 text-white text-center font-bold text-xs hover:bg-emerald-700 shadow-xs"
              >
                Kirish / Ro‘yxatdan o‘tish
              </Link>
              <Link
                href="/hamkorlik?mode=login"
                onClick={() => {
                  setMobileMenuOpen(false);
                  closeCart();
                }}
                className="py-2.5 px-3 rounded-full border border-zinc-200 text-zinc-800 text-center font-bold text-xs hover:bg-zinc-50"
              >
                Biznes kabinet
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
