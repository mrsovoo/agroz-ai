import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AgroImage } from './ui';
import { IMAGES } from '../data/content';

/**
 * "STANDARTLAR & KAFOLAT: Sifat nazorati, shaffof narx va ishonchli xarid"
 * Referens dizaynga 1:1 mos keluvchi interaktiv kartalar:
 * - Faol karta: Chapda sarlavha, tavsif va "Batafsil" tugmasi, o'ngda figurali foto-kapsula
 * - Nofaol kartalar: Yumshoq pastel yashil-bug'doy fon, oq pill nishon va pastki "Batafsil ↗" tugmasi
 */
const PRINCIPLES = [
  {
    id: 'booking',
    pill: 'Bron qilish & Olib ketish',
    title: 'Yaqin do‘kondan bron qilish',
    description:
      'Vet-dorilar, antibiotiklar, omuxta yem va elita urug‘larni 5–15 km yaqin agro-do‘kondan bepul bron qilib, o‘zingiz borib navbatsiz olib keting.',
    image: IMAGES.seedlings,
    badge: '5–15 km Yaqin Radius',
    chips: ['Vet-dorilar', 'Yem-ozuqa', 'Urug‘lar'],
  },
  {
    id: 'delivery',
    pill: 'Sektor yetkazib berishi',
    title: 'Sektor transportida yetkazish',
    description:
      'Motobloklar, 25L motorli purkagichlar, ko‘p yillik issiqxona plyonkalari va sug‘orish tizimlari markaziy bazadan to‘g‘ridan-to‘g‘ri dalagacha yetkaziladi.',
    image: IMAGES.tractor,
    badge: 'Markaziy Sektor Bazasi',
    chips: ['Motoblok', 'Issiqxona', 'Sug‘orish'],
  },
  {
    id: 'warranty',
    pill: '12+ oy rasmiy kafolat',
    title: 'Rasmiy chek va kafolat nazorati',
    description:
      'Barcha texnikalar zavod seriya raqami (S/N) bilan kassaga kiritiladi va POS-chekda 12+ oy rasmiy kafolat beriladi. 100% sifat nazorati.',
    image: IMAGES.controller,
    badge: 'Rasmiy S/N Nazorati',
    chips: ['Zavod S/N', 'POS Chek', 'Kafolat'],
  },
];

export const Quality: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section id="standards" className="py-16 sm:py-24 bg-white/60 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Bo'lim Sarlavhasi */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-agroGreen/30 bg-agroGreen/15 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <ShieldCheck className="h-4 w-4 text-agroGreen-700" />
              STANDARTLAR & KAFOLAT
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-charcoal leading-[1.14]">
              Sifat nazorati, shaffof narx va ishonchli xarid —{' '}
              <span className="text-agroGreen">AgrozGO bosh tamoyillari.</span>
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/70 leading-relaxed">
            Mahsulot turiga qarab ikki xil oqilona xarid tizimi: kundalik ehtiyojlar yaqin do‘kondan bron qilinadi,
            yirik texnika va issiqxona jihozlari esa markaziy sektordan yetkaziladi.
          </p>
        </div>

        {/* INTERAKTIV 3 TA KARTA (Referens rasmga 1:1) */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch min-h-[380px] sm:min-h-[420px]">
          {PRINCIPLES.map((card, idx) => {
            const isActive = activeIdx === idx;

            if (isActive) {
              /* FAOL (EXPANDED) KARTA — Chapda matn, o'ngda figurali foto-kapsula */
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveIdx(idx)}
                  className="lg:flex-[2.4] flex flex-col justify-between rounded-[32px] bg-[#F5F4EE] border border-charcoal/10 p-6 sm:p-8 shadow-soft transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 h-full">
                    {/* Chap ustun: Sarlavha, tavsif va "Batafsil" */}
                    <div className="flex flex-col justify-between h-full sm:max-w-[55%]">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-black text-agroGreen-800 border border-charcoal/10 shadow-xs mb-3">
                          <span className="h-2 w-2 rounded-full bg-agroGreen" />
                          {card.badge}
                        </span>

                        <h3 className="text-xl sm:text-2xl font-black text-charcoal leading-snug">
                          {card.title}
                        </h3>

                        <p className="mt-3 text-xs sm:text-sm text-charcoal/75 leading-relaxed font-medium">
                          {card.description}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {card.chips.map((c) => (
                            <span
                              key={c}
                              className="rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-bold text-charcoal/70 border border-charcoal/5"
                            >
                              #{c}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pastki: Read More + Dumaloq oq tugma */}
                      <div className="mt-6 pt-4 border-t border-charcoal/10 flex items-center gap-3">
                        <a
                          href="#sectors"
                          className="group/btn inline-flex items-center gap-3 text-xs font-black text-charcoal hover:text-agroGreen-800 transition"
                        >
                          <span>Batafsil ko‘rish</span>
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-xs border border-charcoal/10 group-hover/btn:bg-agroGreen group-hover/btn:text-forest-dark transition-all duration-300">
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </a>
                      </div>
                    </div>

                    {/* O'ng ustun: Vertikal figurali foto-kapsula (Referens rasmga 1:1) */}
                    <div className="w-full sm:w-[190px] lg:w-[220px] h-[220px] sm:h-full shrink-0 flex flex-col gap-2 relative">
                      <div className="relative h-1/2 w-full overflow-hidden rounded-[26px] shadow-xs">
                        <AgroImage
                          src={card.image}
                          alt={card.title}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                      <div className="relative h-1/2 w-full overflow-hidden rounded-[26px] shadow-xs">
                        <AgroImage
                          src={card.image}
                          alt={card.title}
                          className="h-full w-full object-cover scale-110 object-bottom transition-transform duration-700 hover:scale-115"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            /* NOFAOL (COLLAPSED) KARTALAR — Yumshoq pastel yashil-bug'doy fon + Oq pill badge */
            return (
              <div
                key={card.id}
                onClick={() => setActiveIdx(idx)}
                onMouseEnter={() => setActiveIdx(idx)}
                className="lg:flex-[1] flex flex-col justify-between rounded-[32px] bg-[#E3E9D5] hover:bg-[#DEE5CF] border border-charcoal/8 p-6 sm:p-7 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer relative overflow-hidden group shadow-xs"
              >
                {/* Orqa fondagi bezak doiralari (Referensdagi doiralar kabi) */}
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/20" />
                <div className="pointer-events-none absolute bottom-10 left-16 h-20 w-20 rounded-full bg-white/15" />

                <div>
                  {/* Yuqori oq pill sarlavha (Referens 1:1) */}
                  <span className="inline-block rounded-full bg-white px-4 py-2 text-xs font-black text-charcoal shadow-xs border border-charcoal/5 group-hover:shadow-sm transition">
                    {card.pill}
                  </span>

                  <h4 className="mt-5 text-base sm:text-lg font-black text-charcoal/90 leading-snug">
                    {card.title}
                  </h4>
                  <p className="mt-1 text-xs text-charcoal/60 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                {/* Pastki: "Batafsil" va oq dumaloq tugma */}
                <div className="mt-8 pt-4 border-t border-charcoal/10 flex items-center justify-between relative z-10">
                  <span className="text-xs font-black text-charcoal/80 group-hover:text-charcoal transition">
                    Batafsil
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-xs border border-charcoal/10 group-hover:scale-110 group-hover:bg-agroGreen group-hover:text-forest-dark transition-all duration-300">
                    <ArrowUpRight className="h-4 w-4 text-charcoal group-hover:text-forest-dark" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* PASTKI 3 TA SIFAT METRIKASI */}
        <div className="mt-10 pt-8 border-t border-charcoal/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-cream-soft p-4 border border-charcoal/10 shadow-xs">
            <span className="text-2xl font-black text-agroGreen">№1</span>
            <p className="mt-1 text-xs font-bold text-charcoal">Do‘kondan Tekshirib Olish</p>
            <p className="mt-0.5 text-[11px] text-charcoal/60">Yaqin 5–15 km radiusda dori va yemlar zaxirada saqlanadi.</p>
          </div>
          <div className="rounded-2xl bg-cream-soft p-4 border border-charcoal/10 shadow-xs">
            <span className="text-2xl font-black text-agroGreen">100%</span>
            <p className="mt-1 text-xs font-bold text-charcoal">Sektor Transport Kafolati</p>
            <p className="mt-0.5 text-[11px] text-charcoal/60">Yirik texnika va issiqxona jihozlari manzilgacha yetkaziladi.</p>
          </div>
          <div className="rounded-2xl bg-cream-soft p-4 border border-charcoal/10 shadow-xs">
            <span className="text-2xl font-black text-agroGreen">12+ oy</span>
            <p className="mt-1 text-xs font-bold text-charcoal">Rasmiy S/N Chek-Kafolati</p>
            <p className="mt-0.5 text-[11px] text-charcoal/60">Barcha texnikalar rasmiy servis markazi kafolati bilan beriladi.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
