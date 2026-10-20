import React from 'react';
import {
  ShieldCheck,
  Store,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  FileCheck,
  PackageCheck,
  Wrench,
  Boxes,
  ArrowRight,
} from 'lucide-react';
import { Eyebrow, DarkButton } from './ui';
import { VALUES, FEATURES, QUALITY_BADGES } from '../data/content';

/**
 * STANDARTLAR & KAFOLAT:
 * Sifat nazorati, shaffof narx va tartiblangan xarid tamoyillari:
 * 1. Dorilar, yem-ozuqalar, urug'lar — yaqin agro-do'kondan bron qilinadi va o'zi olib ketiladi.
 * 2. Yirik agro-texnikalar va issiqxona jihozlari — o'z hududiy katta sektorlaridan buyurtma beriladi va sektor logistikasi yetkazib beradi.
 */
export const Quality: React.FC = () => {
  return (
    <section id="standards" className="py-16 sm:py-24 bg-white/50 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* ASOSIY STANDARTLAR BANNERI */}
        <div className="relative overflow-hidden rounded-[32px] bg-forest-dark border border-forest-border/40 p-6 sm:p-10 lg:p-12 text-white shadow-card">
          {/* Fon yorug'lik effektlari */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-agroGreen/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-agroGreen/15 blur-3xl" />

          {/* Sarlavha qismi */}
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-agroGreen/30 bg-agroGreen/15 px-3.5 py-1 text-xs font-black text-agroGreen">
              <ShieldCheck className="h-4 w-4 text-agroGreen" />
              STANDARTLAR & KAFOLAT
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.18]">
              Sifat nazorati, shaffof narx va ishonchli xarid —{' '}
              <span className="text-agroGreen">AgrozGO bosh tamoyillari.</span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed max-w-2xl">
              Mahsulot turiga qarab ikki xil oqilona xarid tizimi: kundalik mayda ehtiyojlar yaqin do‘kondan bron qilinadi,
              yirik texnika va issiqxona jihozlari esa markaziy sektor bazalaridan yetkaziladi.
            </p>
          </div>

          {/* 2 TA ANIQ TARTIBLANGAN MASTER KARTA */}
          <div className="relative z-10 mt-10 grid gap-6 md:grid-cols-2">
            {/* 1-KARTA: YAQIN DO'KONLARDAN BRON QILISH VA OLIB KETISH */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-md p-6 sm:p-7 border border-white/15 flex flex-col justify-between transition-all hover:bg-white/15 hover:border-agroGreen/50">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/20 border border-agroGreen/30 px-3 py-0.5 text-[11px] font-black text-agroGreen">
                    <Store className="h-3.5 w-3.5" /> 5–15 km Yaqin Radius
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
                    O‘zi Olib Ketish
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  Dorilar, Yem-Ozuqa va Urug‘lar — Yaqin Do‘kondan Bron Qilish
                </h3>
                <p className="mt-2.5 text-xs text-white/75 leading-relaxed">
                  Biz vet-dorixonalar, ozuqa yemlari va urug‘larni sizga <b>eng yaqin agro-do‘konlardan</b> ko‘rsatamiz.
                  Saytda tovar mavjudligini ko‘rib, 1 tugma bilan bepul bron qilasiz va do‘konga borib navbatsiz olib ketasiz.
                </p>

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                  {[
                    '0 so‘m ortiqcha yetkazish to‘lovi va yo‘l xarajatini tejash',
                    'Mahsulotning yaroqlilik muddati va qadog‘ini joyida ko‘rib olish',
                    'Shoshilinch kasallik yoki yem tugaganda eng tezkor yechim',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-2 text-xs text-white/85 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-agroGreen shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#VetDorixona</span>
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#YemOzuqa</span>
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#UrugChilik</span>
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#BronQilish</span>
              </div>
            </div>

            {/* 2-KARTA: YIRIK AGRO-TEXNIKA VA ISSIQXONA JIHOZLARI — SEKTOR YETKAZISHI */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-md p-6 sm:p-7 border border-white/15 flex flex-col justify-between transition-all hover:bg-white/15 hover:border-agroGreen/50">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 border border-amber/30 px-3 py-0.5 text-[11px] font-black text-amber-300">
                    <Truck className="h-3.5 w-3.5" /> Hududiy Sektor Bazasi
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Sektor Yetkazib Berishi
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  Yirik Texnika & Issiqxona — Sektor Logistikasi
                </h3>
                <p className="mt-2.5 text-xs text-white/75 leading-relaxed">
                  Motobloklar, purkagichlar, ko‘p yillik issiqxona plyonkalari va sug‘orish tizimlari oddiy do‘konda saqlanmaydi — ularning
                  <b> maxsus hududiy yirik sektorlari</b> bor. Buyurtma berilganda, sektor transporti to‘g‘ridan-to‘g‘ri yetkazib beradi.
                </p>

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                  {[
                    'Zavod seriya raqami (S/N) va 12+ oylik rasmiy chek-kafolat',
                    'Katta hajmdagi og‘ir yuklarni maxsus yuk mashinalarida tashish',
                    'To‘g‘ridan-to‘g‘ri markaziy dilerlik narxi (vositachilarsiz)',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-2 text-xs text-white/85 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#Motoblok</span>
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#IssiqxonaPlyonka</span>
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#SugorishTizimi</span>
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#SektorTransporti</span>
              </div>
            </div>
          </div>

          {/* PASTKI 3 TA SIFAT METRIKASI */}
          <div className="relative z-10 mt-8 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-agroGreen">№1</span>
              <p className="mt-1 text-xs font-bold text-white">Do‘kondan Tekshirib Olish</p>
              <p className="mt-0.5 text-[11px] text-white/60">Yaqin 5–15 km radiusda dori va yemlar zaxirada saqlanadi.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-amber-300">100%</span>
              <p className="mt-1 text-xs font-bold text-white">Sektor Transport Kafolati</p>
              <p className="mt-0.5 text-[11px] text-white/60">Yirik texnika va issiqxona jihozlari manzilgacha yetkaziladi.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-agroGreen">12+ oy</span>
              <p className="mt-1 text-xs font-bold text-white">Rasmiy S/N Chek-Kafolati</p>
              <p className="mt-0.5 text-[11px] text-white/60">Barcha texnikalar rasmiy servis markazi kafolati bilan beriladi.</p>
            </div>
          </div>
        </div>

        {/* IMKONIYaTLAR (FEATURES RO'YXATI) */}
        <div className="mt-14 sm:mt-20">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-black uppercase tracking-widest text-agroGreen-800">
              Qulay Ekotizim
            </span>
            <h3 className="mt-2 text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
              Zamonaviy texnologiya bilan <span className="text-agroGreen">qulay agro-xarid</span>
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-charcoal/70">
              Fermer va chorvadorlar ortiqcha ovoragarchiliksiz to‘g‘ri qaror qabul qilishi uchun yaratilgan imkoniyatlar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl bg-cream-soft p-5 border border-charcoal/8 shadow-xs hover:border-agroGreen/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/15 text-agroGreen-800 text-xs font-black mb-3">
                    0{i + 1}
                  </div>
                  <h4 className="text-sm font-black text-charcoal leading-snug">{f.title}</h4>
                  <p className="mt-1.5 text-xs text-charcoal/70 leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/** "Qadriyatlarimiz" (Values) — 3 ta ixcham va soddalashtirilgan karta (karusel o'rniga barqaror grid) */
export const Values: React.FC = () => {
  return (
    <section className="pb-16 sm:pb-24">
      <div className="container-x">
        <div className="rounded-[32px] bg-cream-soft border border-charcoal/10 p-6 sm:p-9 lg:p-12 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
            <div className="max-w-2xl">
              <span className="text-xs font-black uppercase tracking-wider text-agroGreen-800">
                Bizning Tamoyillarimiz
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal tracking-tight">
                Biz amal qiladigan <span className="text-agroGreen">qadriyatlar:</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-charcoal/65 max-w-sm">
              Har bir xaridda ochiqlik, fermer manfaatini himoya qilish va sifat kafolati.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-7 border border-charcoal/10 shadow-xs hover:border-agroGreen/50 transition duration-200"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-lg bg-agroGreen/15 text-agroGreen-900 px-2 py-0.5 text-xs font-black">
                      {v.num}
                    </span>
                    <h3 className="text-base font-black text-charcoal">{v.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-charcoal/70">
                    {v.text}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-charcoal/5">
                  {v.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-cream-soft px-2.5 py-1 text-[11px] font-bold text-charcoal/70 border border-charcoal/5"
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
