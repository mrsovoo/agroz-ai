import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { AgroImage } from './ui';
import { OPERATION_PILLARS } from '../data/content';

export const Technology: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  const prev = () => setActiveIdx((i) => (i + OPERATION_PILLARS.length - 1) % OPERATION_PILLARS.length);
  const next = () => setActiveIdx((i) => (i + 1) % OPERATION_PILLARS.length);

  return (
    <section id="technology" className="py-16 sm:py-24">
      <div className="container-x">
        {/* Sarlavha: ✦ ⨂ Elevates agricultural operations new heights ✳ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-forest-border/20 bg-agroGreen/15 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
              Agro-Texnologiyalar
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-charcoal leading-[1.12]">
              Zamonaviy agrotexnologiyalar{' '}
              <span className="inline-block text-agroGreen font-black">✳</span>{' '}
              bilan savdo yangi cho‘qqida
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#products"
              className="rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-xs font-bold text-charcoal hover:bg-forest-dark hover:text-white transition shadow-sm"
            >
              Texnikalarni ko‘rish
            </a>
          </div>
        </div>

        {/* 4 ta Bento ustun: Chapda tavsif va boshqaruv, o'ngda 3 ta baland kartochkalar */}
        <div className="mt-12 grid gap-5 lg:grid-cols-12 lg:items-stretch">
          {/* Chapdagi ma'lumot qutisi (Referensdagi chapdagi navigation box) */}
          <div className="flex flex-col justify-between rounded-[32px] bg-cream-soft border border-charcoal/5 p-6 sm:p-8 lg:col-span-4 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-agroGreen-800">
                Imkoniyatlar tahlili
              </span>
              <p className="mt-4 text-sm leading-relaxed text-charcoal/75">
                DJI va zamonaviy purkash tizimlari yordamida bir parvozda 21 gektargacha dorilash,
                yoqilg‘ini 4 barobarga tejash va ekin zararlanishini nolga tushirish imkoniyati.
              </p>
              <div className="mt-6 rounded-2xl bg-white p-4 border border-charcoal/5">
                <p className="text-xs font-bold text-charcoal">{OPERATION_PILLARS[activeIdx].title}</p>
                <p className="mt-1 text-xs text-charcoal/60 leading-relaxed">
                  {OPERATION_PILLARS[activeIdx].desc}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Oldingi"
                className="grid h-11 w-11 place-items-center rounded-full border border-charcoal/15 bg-white text-charcoal transition hover:bg-cream-warm cursor-pointer active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Keyingi"
                className="grid h-11 w-11 place-items-center rounded-full bg-forest-dark text-white transition hover:bg-forest cursor-pointer active:scale-95 shadow-sm"
              >
                <ChevronRight className="h-5 w-5 text-agroGreen" />
              </button>
            </div>
          </div>

          {/* O'ngdagi 3 ta vertikal kavisli rasm kartalari */}
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
            {OPERATION_PILLARS.map((p, i) => {
              const isActive = activeIdx === i;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveIdx(i)}
                  className={`group relative flex flex-col justify-end overflow-hidden rounded-[32px] p-5 cursor-pointer min-h-[380px] sm:min-h-[440px] transition-all duration-500 ${
                    isActive
                      ? 'ring-2 ring-agroGreen shadow-glow-green scale-[1.01]'
                      : 'hover:scale-[1.01] shadow-card'
                  }`}
                >
                  <AgroImage
                    src={p.image}
                    alt={p.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest-dark/40 to-transparent" />

                  {/* Yuqori o'ng burchakdagi strelka */}
                  <span className="absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-forest-dark backdrop-blur-md transition group-hover:bg-agroGreen group-hover:scale-110">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>

                  {/* Pastki yozuvlar */}
                  <div className="relative text-white">
                    <span className="inline-block rounded-full bg-agroGreen px-2.5 py-0.5 text-[10px] font-black text-forest-dark mb-2">
                      {p.tag}
                    </span>
                    <h3 className="text-lg font-black leading-snug">{p.title}</h3>
                    <p className="mt-1 text-xs text-white/70 font-medium">{p.en}</p>
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
