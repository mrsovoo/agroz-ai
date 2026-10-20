import React, { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Wheat, Leaf, Sprout, ShieldCheck, Award, Layers } from 'lucide-react';
import { AgroImage, Eyebrow, DarkButton } from './ui';
import { IMAGES, QUALITY_BADGES, FEATURES, VALUES } from '../data/content';

/** Fermer surati ustida sifat bayonoti + №1 badge'lar */
export const Quality: React.FC = () => (
  <section className="py-16 sm:py-24">
    <div className="container-x">
      <div className="relative min-h-[420px] sm:min-h-[480px] overflow-hidden rounded-3xl bg-forest-dark border border-forest-border shadow-soft">
        <AgroImage
          src={IMAGES.farmer}
          alt="Planshet bilan fermer"
          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-luminosity scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/80 to-forest-dark/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/85 via-transparent to-forest-dark/70" />

        {/* Atmosferik zumrad nurlari */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-agroGreen/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-agroGreen/15 blur-3xl" />

        <div className="relative flex min-h-[420px] sm:min-h-[480px] flex-col justify-between gap-8 p-6 sm:p-10">
          <div className="grid gap-6 lg:grid-cols-12">
            <p className="text-xs uppercase tracking-widest text-agroGreen font-black lg:col-span-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Standartlar & Kafolat
            </p>
            <h2 className="text-2xl font-black leading-tight text-white sm:text-4xl lg:col-span-8">
              Sifat nazorati, shaffof narx va ishonchli yetkazib berish — AgrozGO bosh tamoyillari.
            </h2>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            {/* Lucide iconlar (emojilar o'rniga) */}
            <div className="flex gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-agroGreen backdrop-blur-md">
                <Wheat className="h-5 w-5" />
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-agroGreen backdrop-blur-md">
                <Sprout className="h-5 w-5" />
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-agroGreen backdrop-blur-md">
                <Leaf className="h-5 w-5" />
              </span>
            </div>

            {/* Metrika nishonlari */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
              {QUALITY_BADGES.map((b, i) => (
                <div
                  key={b.label}
                  className={`flex-1 min-w-0 rounded-2xl p-3 sm:p-4 sm:w-40 border transition ${
                    i === 0
                      ? 'bg-agroGreen text-forest-dark border-agroGreen shadow-glow-subtle'
                      : 'bg-white/10 text-white border-white/15 backdrop-blur-md'
                  }`}
                >
                  <p className={`text-xl sm:text-2xl font-black ${i === 0 ? 'text-forest-dark' : 'text-agroGreen'}`}>{b.rank}</p>
                  <p className={`mt-0.5 text-[10px] sm:text-[11px] font-semibold leading-tight ${i === 0 ? 'text-forest-dark/85' : 'text-white/70'}`}>{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Imkoniyatlar (Features) */}
      <div className="mt-16 grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-3">
          <Eyebrow>Imkoniyatlar</Eyebrow>
          <AgroImage src={IMAGES.livestock} alt="Yaylovdagi qoramollar" className="mt-6 hidden h-28 w-40 rounded-2xl lg:block shadow-xs" />
        </div>
        <div className="lg:col-span-6">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-charcoal">
            Zamonaviy texnologiya bilan <span className="font-semibold text-charcoal/50">qulay agro-xarid</span>
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3 rounded-2xl bg-white p-3.5 border border-charcoal/5 shadow-xs">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-agroGreen-700" />
                <div>
                  <p className="text-sm font-bold text-charcoal">{f.title}</p>
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
          <AgroImage src={IMAGES.tractor} alt="Agro-texnika" className="h-28 w-40 rounded-2xl shadow-xs" />
        </div>
      </div>
    </div>
  </section>
);

/** "Qadriyatlarimiz" (Values) — 3 ta ixcham va soddalashtirilgan karta */
export const Values: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const ordered = [...VALUES.slice(offset), ...VALUES.slice(0, offset)];

  return (
    <section className="pb-16 sm:pb-24">
      <div className="container-x">
        <div className="grid gap-6 rounded-3xl bg-cream-soft border border-charcoal/10 p-5 sm:p-8 lg:grid-cols-12 lg:p-10 shadow-xs">
          <div className="flex flex-col justify-between gap-6 lg:col-span-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-agroGreen-800">
                Tamoyillarimiz
              </span>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl text-charcoal">
                Biz amal qiladigan <span className="font-semibold text-charcoal/50">qadriyatlar:</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Oldingi"
                onClick={() => setOffset((o) => (o + VALUES.length - 1) % VALUES.length)}
                className="grid h-10 w-10 place-items-center rounded-full border border-charcoal/15 bg-white transition hover:bg-cream cursor-pointer active:scale-95"
              >
                <ChevronLeft className="h-4 w-4 text-charcoal" />
              </button>
              <button
                type="button"
                aria-label="Keyingi"
                onClick={() => setOffset((o) => (o + 1) % VALUES.length)}
                className="grid h-10 w-10 place-items-center rounded-full bg-forest-dark text-white transition hover:bg-forest cursor-pointer active:scale-95 shadow-xs"
              >
                <ChevronRight className="h-4 w-4 text-agroGreen" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:col-span-9">
            {ordered.map((v) => (
              <div
                key={v.title}
                className="flex flex-col justify-between rounded-3xl bg-white p-6 border border-charcoal/10 shadow-xs transition-colors duration-200 hover:border-agroGreen"
              >
                <div>
                  <p className="text-sm font-black flex items-center gap-2 text-charcoal">
                    <span className="rounded-lg bg-agroGreen/15 text-agroGreen-900 px-2 py-0.5 text-xs font-black">
                      {v.num}
                    </span>
                    <span>{v.title}</span>
                  </p>
                  <p className="mt-3 text-xs leading-relaxed text-charcoal/70">
                    {v.text}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5 pt-3 border-t border-charcoal/5">
                  {v.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-charcoal/60"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
