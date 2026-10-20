import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { SECTORS, type SectorId } from '../data/content';

// 5% lik nozik sektor fonlari va aksent ranglari
const SECTOR_STYLES: Record<SectorId, { bg: string; iconBg: string; textAccent: string; borderHover: string }> = {
  agro_vet: {
    bg: 'bg-emerald-700/[0.03]',
    iconBg: 'bg-emerald-700/10 text-emerald-800',
    textAccent: 'text-emerald-800',
    borderHover: 'hover:border-emerald-600',
  },
  feed: {
    bg: 'bg-amber-700/[0.03]',
    iconBg: 'bg-amber-700/10 text-amber-800',
    textAccent: 'text-amber-800',
    borderHover: 'hover:border-amber-600',
  },
  warehouse: {
    bg: 'bg-blue-700/[0.03]',
    iconBg: 'bg-blue-700/10 text-blue-800',
    textAccent: 'text-blue-800',
    borderHover: 'hover:border-blue-600',
  },
  seeds: {
    bg: 'bg-green-700/[0.03]',
    iconBg: 'bg-green-700/10 text-green-800',
    textAccent: 'text-green-800',
    borderHover: 'hover:border-green-600',
  },
  machinery: {
    bg: 'bg-orange-700/[0.03]',
    iconBg: 'bg-orange-700/10 text-orange-800',
    textAccent: 'text-orange-800',
    borderHover: 'hover:border-orange-600',
  },
};

export const Sectors: React.FC = () => {
  return (
    <section id="sectors" className="py-12 sm:py-16 bg-cream-soft/50 border-y border-charcoal/5 scroll-mt-24">
      {/* Anchor target for #products */}
      <div id="products" className="-top-24 relative" />
      <div className="container-x">
        {/* Minimal Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-agroGreen-800 bg-agroGreen/15 border border-agroGreen/30 px-3 py-1 rounded-full">
              Asosiy Yo‘nalishlar
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              5 ta Agro-Sektor — <span className="font-semibold text-charcoal/50">Bitta Marketplace’da</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-charcoal/65 max-w-md leading-relaxed">
            Har bir sektor o‘ziga xos kafolat bilan: yaroqlilik muddati, 1 kg-lab bo‘lib olish, ulgurji narx va rasmiy servis.
          </p>
        </div>

        {/* 5 TA SEKTOR — BITTA MINIMAL QATORDA (Single Row on Desktop: lg:grid-cols-5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {SECTORS.map((s) => {
            const style = SECTOR_STYLES[s.id] || SECTOR_STYLES.agro_vet;
            const Icon = s.icon;

            return (
              <a
                key={s.id}
                href="#products"
                className={`group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 border border-charcoal/10 transition-all duration-300 ${style.bg} ${style.borderHover} hover:shadow-soft hover:bg-white`}
              >
                <div>
                  {/* Yuqori: Ikona + Sektor tegi + O'tish strelkasi */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`grid h-10 w-10 place-items-center rounded-xl ${style.iconBg} border border-charcoal/5 transition-transform group-hover:scale-105 shadow-xs`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-charcoal/60 border border-charcoal/10 shadow-xs">
                        {s.subtitle}
                      </span>
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-charcoal/40 group-hover:text-charcoal group-hover:scale-110 transition">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Sektor nomi */}
                  <h3 className="mt-3.5 text-sm sm:text-base font-extrabold text-charcoal leading-snug group-hover:text-forest-dark transition-colors">
                    {s.title}
                  </h3>

                  {/* Qisqa 2-qatorli tavsif */}
                  <p className="mt-1.5 text-xs text-charcoal/65 leading-relaxed line-clamp-2 font-medium">
                    {s.description}
                  </p>

                  {/* Mini-teglar */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-charcoal/70 border border-charcoal/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pastki qism: Kafolat va asosiy metrika */}
                <div className="mt-4 pt-3 border-t border-charcoal/10 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-charcoal/75 truncate max-w-[125px]">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-agroGreen-700" />
                    <span className="truncate">{s.guarantee}</span>
                  </span>
                  <span className={`text-xs font-black ${style.textAccent} shrink-0`}>
                    {s.metric.value}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
