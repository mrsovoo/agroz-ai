import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Eyebrow, AgroImage } from './ui';
import { SECTORS, IMAGES, type SectorId } from '../data/content';

const SECTOR_IMAGE: Partial<Record<SectorId, string>> = {
  agro_vet: IMAGES.livestock,
  feed: IMAGES.heroWheat,
  warehouse: IMAGES.drone,
  seeds: IMAGES.seedlings,
  machinery: IMAGES.tractor,
};

// 5% lik sektorga mos nozik ranglar (5% opacity backgrounds)
const SECTOR_STYLES: Record<SectorId, { bg: string; iconBg: string; textAccent: string }> = {
  agro_vet: {
    bg: 'bg-emerald-700/[0.05]',
    iconBg: 'bg-emerald-700/10 text-emerald-800',
    textAccent: 'text-emerald-800',
  },
  feed: {
    bg: 'bg-amber-700/[0.05]',
    iconBg: 'bg-amber-700/10 text-amber-800',
    textAccent: 'text-amber-800',
  },
  warehouse: {
    bg: 'bg-blue-700/[0.05]',
    iconBg: 'bg-blue-700/10 text-blue-800',
    textAccent: 'text-blue-800',
  },
  seeds: {
    bg: 'bg-green-700/[0.05]',
    iconBg: 'bg-green-700/10 text-green-800',
    textAccent: 'text-green-800',
  },
  machinery: {
    bg: 'bg-orange-700/[0.05]',
    iconBg: 'bg-orange-700/10 text-orange-800',
    textAccent: 'text-orange-800',
  },
};

export const Sectors: React.FC = () => {
  return (
    <section id="sectors" className="bg-cream-soft/60 border-y border-charcoal/5 py-16 sm:py-24">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Sektorlar</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-charcoal">
              5 ta agro yo‘nalish — <span className="font-semibold text-charcoal/50">bitta marketplace’da</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-charcoal/65">
            Har bir sektor o‘z sifat nazorati bilan: yaroqlilik muddati, unuvchanlik foizi, ulgurji narx va texnika
            kafolati.
          </p>
        </div>

        {/* 5 ta Sektor Kartochkalari: Oddiy barqaror turish, hoverda identika yashil stroke, 5% opacity background */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((s) => {
            const style = SECTOR_STYLES[s.id] || SECTOR_STYLES.agro_vet;
            const Icon = s.icon;
            const img = SECTOR_IMAGE[s.id];

            return (
              <article
                key={s.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 border border-charcoal/10 transition-colors duration-300 hover:border-agroGreen ${style.bg} shadow-xs`}
              >
                <div>
                  {/* Real rasm miniatyurasi */}
                  {img && (
                    <div className="relative mb-4 h-36 w-full overflow-hidden rounded-2xl bg-white border border-charcoal/5">
                      <AgroImage
                        src={img}
                        alt={s.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${style.iconBg} border border-charcoal/5`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-charcoal leading-tight">{s.title}</h3>
                        <p className={`text-xs font-bold ${style.textAccent}`}>{s.subtitle}</p>
                      </div>
                    </div>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-charcoal/70 border border-charcoal/10">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-charcoal/70">
                    {s.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-charcoal/80 border border-charcoal/10"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-charcoal/10 pt-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-charcoal/80">
                    <ShieldCheck className="h-4 w-4 text-agroGreen-700" />
                    {s.guarantee}
                  </span>
                  <div className="text-right">
                    <p className={`text-base font-black ${style.textAccent}`}>{s.metric.value}</p>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-charcoal/40">{s.metric.label}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
