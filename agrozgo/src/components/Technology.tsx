import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { AgroImage } from './ui';
import { OPERATION_PILLARS } from '../data/content';

export const Technology: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = () => setActiveIdx((i) => (i + OPERATION_PILLARS.length - 1) % OPERATION_PILLARS.length);
  const next = () => setActiveIdx((i) => (i + 1) % OPERATION_PILLARS.length);

  return (
    <section id="technology" className="py-16 sm:py-24">
      <div className="container-x">
        {/* Sarlavha */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-forest-border/20 bg-agroGreen/15 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
              Agro-Texnologiyalar
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-charcoal leading-[1.12]">
              Zamonaviy agrotexnologiyalar{' '}
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-agroGreen/20 text-agroGreen-800 align-middle">
                <Sparkles className="h-5 w-5" />
              </span>{' '}
              bilan savdo yangi cho‘qqida
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#products"
              className="rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-xs font-bold text-charcoal hover:bg-forest-dark hover:text-white transition shadow-xs"
            >
              Texnikalarni ko‘rish
            </a>
          </div>
        </div>

        {/* 4 ta Bento ustun: Sodda va toza kartochkalar */}
        <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
          {/* Chapdagi ma'lumot qutisi */}
          <div className="flex flex-col justify-between rounded-3xl bg-cream-soft border border-charcoal/10 p-6 sm:p-8 lg:col-span-4 shadow-xs">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-agroGreen-800">
                Imkoniyatlar Tahlili
              </span>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/75 font-medium">
                BiznesGO (B2B) kassa-ombor tizimi va AgrozGO (B2C) fermerlar bozori integratsiyasi orqali
                ombor qoldiqlari, qoplab/kg-lab sotish va narxlar 100% real vaqtda yangilanadi.
              </p>

              <div className="mt-6 rounded-2xl bg-white p-4 border border-charcoal/10">
                <p className="text-xs font-extrabold text-charcoal flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-agroGreen-700" /> {OPERATION_PILLARS[activeIdx].title}
                </p>
                <p className="mt-1 text-xs text-charcoal/60 leading-relaxed">
                  {OPERATION_PILLARS[activeIdx].desc}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-4 border-t border-charcoal/10">
              <span className="text-xs font-bold text-charcoal/50">
                {activeIdx + 1} / {OPERATION_PILLARS.length} texnologiya
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Oldingi"
                  className="grid h-10 w-10 place-items-center rounded-full border border-charcoal/15 bg-white text-charcoal transition hover:bg-cream-warm cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Keyingi"
                  className="grid h-10 w-10 place-items-center rounded-full bg-forest-dark text-white transition hover:bg-forest cursor-pointer active:scale-95 shadow-xs"
                >
                  <ChevronRight className="h-5 w-5 text-agroGreen" />
                </button>
              </div>
            </div>
          </div>

          {/* O'ngdagi 3 ta soddalashtirilgan kartalar */}
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
            {OPERATION_PILLARS.map((p, i) => {
              const isActive = activeIdx === i;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveIdx(i)}
                  className={`group relative flex flex-col justify-end overflow-hidden rounded-3xl p-5 cursor-pointer min-h-[360px] sm:min-h-[400px] transition-all duration-300 border ${
                    isActive
                      ? 'border-agroGreen shadow-soft'
                      : 'border-charcoal/10 hover:border-agroGreen/50 shadow-xs'
                  }`}
                >
                  <AgroImage
                    src={p.image}
                    alt={p.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/45 to-transparent" />

                  {/* Yuqori o'ng burchakdagi nishon */}
                  <span className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md group-hover:bg-agroGreen group-hover:text-forest-dark transition">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>

                  {/* Karta matni */}
                  <div className="relative z-10 text-white">
                    <span className="rounded-full bg-agroGreen/30 text-white px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md">
                      {p.tag}
                    </span>
                    <h3 className="mt-2 text-base font-extrabold text-white leading-snug">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/70 line-clamp-2">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
