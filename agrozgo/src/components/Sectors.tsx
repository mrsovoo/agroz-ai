import React, { useState } from 'react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Eyebrow, AgroImage } from './ui';
import { SECTORS, IMAGES, type SectorId } from '../data/content';

const SECTOR_IMAGE: Partial<Record<SectorId, string>> = {
  agro_vet: IMAGES.livestock,
  machinery: IMAGES.tractor,
  seeds: IMAGES.seedlings,
};

/** 5 ta sektor — Bento grid. Birinchi karta katta (2x), tanlangan karta qora fonda. */
export const Sectors: React.FC = () => {
  const [active, setActive] = useState<SectorId>('agro_vet');

  return (
    <section id="sectors" className="bg-beige py-16 sm:py-24">
      <div className="container-x">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Sektorlar</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              5 ta agro yo‘nalish — <span className="font-semibold text-charcoal/50">bitta marketplace’da</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-charcoal/65">
            Har bir sektor o‘z sifat nazorati bilan: yaroqlilik muddati, unuvchanlik foizi, ulgurji narx va texnika
            kafolati.
          </p>
        </div>

        <div className="mt-10 grid auto-rows-[minmax(220px,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SECTORS.map((s, i) => {
            const isActive = active === s.id;
            const big = i === 0;
            const img = SECTOR_IMAGE[s.id];
            const Icon = s.icon;
            return (
              <article
                key={s.id}
                onMouseEnter={() => setActive(s.id)}
                onClick={() => setActive(s.id)}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-6 ${
                  big ? 'md:col-span-2 lg:row-span-2' : ''
                } ${isActive ? 'bg-charcoal text-white' : 'bg-white text-charcoal'}`}
              >
                {big && img && (
                  <div className="relative -mx-5 -mt-5 mb-5 h-48 overflow-hidden sm:-mx-6 sm:-mt-6 lg:h-64">
                    <AgroImage src={img} alt={s.title} className="h-full w-full transition duration-700 group-hover:scale-105" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${isActive ? 'from-charcoal' : 'from-white'} to-transparent`} />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-2xl text-xl ${
                        isActive ? 'bg-white/10' : 'bg-beige'
                      }`}
                    >
                      {s.emoji}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold leading-tight">{s.title}</h3>
                      <p className={`text-xs ${isActive ? 'text-white/55' : 'text-charcoal/50'}`}>{s.subtitle}</p>
                    </div>
                  </div>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
                      isActive ? 'bg-gold text-charcoal' : 'bg-beige text-charcoal group-hover:bg-gold'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>

                <p className={`mt-4 text-sm leading-relaxed ${isActive ? 'text-white/75' : 'text-charcoal/70'}`}>
                  {s.description}
                </p>

                {(big || isActive) && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          isActive ? 'bg-white/10 text-white/85' : 'bg-beige text-charcoal/75'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      isActive ? 'bg-forest-badge/30 text-[#9BE0AE]' : 'bg-forest-badge/10 text-forest-badge'
                    }`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {s.guarantee}
                  </span>
                  <div className="text-right">
                    <p className={`text-2xl font-extrabold ${isActive ? 'text-gold' : 'text-charcoal'}`}>{s.metric.value}</p>
                    <p className={`text-[10px] ${isActive ? 'text-white/50' : 'text-charcoal/50'}`}>{s.metric.label}</p>
                  </div>
                </div>
                <Icon
                  className={`pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 opacity-[0.05] ${big ? 'hidden' : ''}`}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

