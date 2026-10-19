import React, { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AgroImage, Eyebrow, DarkButton } from './ui';
import { IMAGES, QUALITY_BADGES, FEATURES, VALUES } from '../data/content';

/** Fermer surati ustida sifat bayonoti + №1 badge'lar (referensdagi kabi). */
export const Quality: React.FC = () => (
  <section className="py-16 sm:py-24">
    <div className="container-x">
      <div className="relative min-h-[520px] overflow-hidden rounded-3xl shadow-soft">
        <AgroImage src={IMAGES.farmer} alt="Planshet bilan fermer" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/55 via-charcoal/10 to-charcoal/60" />

        <div className="relative flex min-h-[520px] flex-col justify-between gap-8 p-6 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-12">
            <p className="text-xs leading-relaxed text-white/70 lg:col-span-3">
              Sifat nazorati, shaffof narx va ishonchli yetkazib berish — AgrozGO tamoyillari.
            </p>
            <h2 className="text-2xl font-bold leading-tight text-white sm:text-4xl lg:col-span-7">
              Biz fermerga sifatli mahsulot, barqaror yetkazib berish va xalqaro standartlarga muvofiqlikni
              kafolatlaymiz.
            </h2>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex gap-2">
              {['🌾', '🌻', '🌿'].map((e) => (
                <span key={e} className="grid h-12 w-12 place-items-center rounded-xl border border-white/30 bg-white/10 text-xl backdrop-blur">
                  {e}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {QUALITY_BADGES.map((b, i) => (
                <div key={b.label} className={`metric-card w-28 sm:w-36 ${i === 0 ? '!bg-gold-soft' : ''}`}>
                  <p className="text-2xl font-extrabold">{b.rank}</p>
                  <p className="mt-1 text-[10px] leading-tight text-charcoal/65 sm:text-[11px]">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Imkoniyatlar */}
      <div className="mt-16 grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-3">
          <Eyebrow>Imkoniyatlar</Eyebrow>
          <AgroImage src={IMAGES.livestock} alt="Yaylovdagi qoramollar" className="mt-6 hidden h-28 w-40 rounded-2xl lg:block" />
        </div>
        <div className="lg:col-span-6">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Zamonaviy texnologiya bilan <span className="font-semibold text-charcoal/50">qulay agro-xarid</span>
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest-badge" />
                <div>
                  <p className="text-sm font-bold">{f.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal/65">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <DarkButton href="#contact">Bog‘lanish</DarkButton>
          </div>
        </div>
        <div className="flex justify-end lg:col-span-3">
          <AgroImage src={IMAGES.tractor} alt="Agro-texnika" className="h-28 w-40 rounded-2xl" />
        </div>
      </div>
    </div>
  </section>
);

/** "Qadriyatlarimiz" — 3 karta, o'rtadagisi qora (referensdagi kabi). */
export const Values: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const ordered = [...VALUES.slice(offset), ...VALUES.slice(0, offset)];

  return (
    <section className="pb-16 sm:pb-24">
      <div className="container-x">
        <div className="grid gap-6 rounded-3xl bg-beige p-5 sm:p-8 lg:grid-cols-12 lg:p-10">
          <div className="flex flex-col justify-between gap-6 lg:col-span-3">
            <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              Biz amal qiladigan <span className="font-semibold text-charcoal/50">qadriyatlar:</span>
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Oldingi"
                onClick={() => setOffset((o) => (o + VALUES.length - 1) % VALUES.length)}
                className="grid h-10 w-10 place-items-center rounded-full border border-charcoal/15 bg-white transition hover:bg-cream"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Keyingi"
                onClick={() => setOffset((o) => (o + 1) % VALUES.length)}
                className="grid h-10 w-10 place-items-center rounded-full bg-gold transition hover:bg-gold-dark"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 lg:col-span-9">
            {ordered.map((v, i) => {
              const dark = i === 1;
              return (
                <div
                  key={v.title}
                  className={`flex flex-col rounded-2xl p-5 shadow-card transition-all duration-300 ${
                    dark ? 'bg-charcoal text-white' : 'bg-white'
                  }`}
                >
                  <p className="text-sm font-bold">
                    <span className="mr-1 text-gold-dark">{v.num}</span> {v.title}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {v.chips.map((c) => (
                      <span
                        key={c}
                        className={`rounded-full border px-2.5 py-1 text-[11px] ${
                          dark ? 'border-white/20 text-white/80' : 'border-charcoal/10 text-charcoal/70'
                        }`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className={`mt-auto pt-6 text-xs leading-relaxed ${dark ? 'text-white/65' : 'text-charcoal/60'}`}>
                    {v.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

