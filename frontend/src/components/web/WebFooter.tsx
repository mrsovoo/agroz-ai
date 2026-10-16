"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Sprout,
  Store,
  CreditCard,
  Layers,
  Smartphone,
  Send,
  HelpCircle,
  ShieldCheck,
  FileText,
  User,
  ArrowUpRight,
  Phone,
  Sparkles,
  CloudSun,
} from "lucide-react";
import AgrozLogo from "@/components/AgrozLogo";
import { useI18n } from "@/lib/i18n";
import { isLaunchRoute, isErpOrAdminRoute } from "@/lib/env";

export default function WebFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const { t } = useI18n();

  if (isLaunchRoute(pathname) || isErpOrAdminRoute(pathname)) {
    return null;
  }

  const columns = [
    {
      title: "Ilova & Xizmatlar",
      links: [
        { href: "/#app", label: "AgrozGO Mobil Ilovasi", icon: Smartphone },
        { href: "/#business", label: "Agroz Business ERP", icon: Store },
        { href: "/#about", label: "Ekotizim imkoniyatlari", icon: Sparkles },
        { href: "/#tariffs", label: "Biznes tariflar", icon: CreditCard },
      ],
    },
    {
      title: t.footer.col_business,
      links: [
        { href: "/hamkorlik", label: t.nav.connect_store, icon: Store },
        { href: "/hamkorlik?mode=login", label: "Biznes kabinet", icon: ShieldCheck },
        { href: "/#business", label: t.nav.debt_book, icon: Layers },
        { href: "/#tariffs", label: "1 oylik bepul sinov", icon: CreditCard },
      ],
    },
    {
      title: t.footer.col_platform,
      links: [
        { href: "/#about", label: t.story1.title, icon: Layers },
        { href: "tel:+998908383772", label: "+998 90 838 37 72", icon: Phone, external: true },
        { href: "https://t.me/agrozai_bot", label: "Telegram Bot", icon: Send, external: true },
        { href: "/#aloqa", label: t.faq.title, icon: HelpCircle },
      ],
    },
    {
      title: t.footer.col_legal,
      links: [
        { href: "/maxfiylik", label: t.footer.privacy, icon: ShieldCheck },
        { href: "/shartlar", label: t.footer.terms, icon: FileText },
        { href: "/hamkorlik?mode=login", label: "Hamkorlar kirishi", icon: User },
      ],
    },
  ];

  return (
    <footer className="web-footer border-t border-[#E5E5EA] bg-white text-xs text-[#86868B] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Chap brend bloki */}
          <div className="col-span-2 space-y-4">
            <Link href="/" prefetch={true} className="inline-flex items-center">
              <AgrozLogo className="h-7 w-auto" />
            </Link>
            <p className="text-xs text-[#86868B] leading-relaxed max-w-sm">
              {t.footer.desc}
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.footer.beta_tag}
              </span>
            </div>
          </div>

          {/* Havolalar ustunlari (Apple style vector icons) */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-black transition group"
                        >
                          <Icon size={13} className="text-zinc-400 group-hover:text-black transition" />
                          <span>{link.label}</span>
                          <ArrowUpRight size={11} className="text-zinc-400 opacity-60" />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-2 text-xs text-zinc-600 hover:text-black transition group"
                        >
                          <Icon size={13} className="text-zinc-400 group-hover:text-black transition" />
                          <span>{link.label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Pastki mualliflik qatori */}
        <div className="mt-12 pt-6 border-t border-[#E5E5EA] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
          <span>© {year} {t.footer.copyright}</span>
          <span>{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
