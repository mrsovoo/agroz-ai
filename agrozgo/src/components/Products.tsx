import React, { useState } from 'react';
import {
  Users,
  Store,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  Receipt,
  Boxes,
} from 'lucide-react';
import { AgroImage } from './ui';
import { IMAGES, BIZNESGO_URL } from '../data/content';

/**
 * AgrozGO (B2C) nima va BiznesGO (B2B) nima?
 * Referens dizayndagi kabi interaktiv accordion hover effekti:
 * Sichqoncha borgan karta silliq kattalashadi (expanded), yonidagi esa ixcham holatga keladi (collapsed).
 */
export const Products: React.FC = () => {
  const [activeCard, setActiveCard] = useState<'b2c' | 'b2b'>('b2c');

  return (
    <section id="ecosystem" className="py-16 sm:py-24 bg-cream-soft/40 border-y border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Bo'lim Sarlavhasi */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/15 border border-agroGreen/30 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
              Yagona Agro-Tech Ekotizimi
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal tracking-tight leading-[1.14]">
              AgrozGO (B2C) nima va <br className="hidden sm:inline" />
              <span className="text-agroGreen">BiznesGO (B2B) nima?</span>
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/70 leading-relaxed">
            Fermer uchun yaqin do‘konlardan arzon xarid, agro-do‘konlar uchun esa smart POS kassa va ombor hisobini birlashtirgan yaxlit platforma.
          </p>
        </div>

        {/* 2 TA INTERAKTIV HOVER-ACCORDION KARTALAR (Referens dizayn 1:1) */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch min-h-[580px]">
          
          {/* ========================================================
              1-KARTA: AGROZGO (B2C) — FERMERLAR VA DEHQONLAR UCHUN
             ======================================================== */}
          <div
            onMouseEnter={() => setActiveCard('b2c')}
            className={`group relative flex flex-col justify-between rounded-[32px] p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden border ${
              activeCard === 'b2c'
                ? 'lg:flex-[2.4] bg-white border-agroGreen/60 shadow-soft'
                : 'lg:flex-[1] bg-white/70 border-charcoal/10 hover:border-agroGreen/40 shadow-xs'
            }`}
          >
            {/* AGROZGO EXPANDED (KATTALASHGAN) HOLAT */}
            {activeCard === 'b2c' ? (
              <div className="flex flex-col justify-between h-full animate-fade-in">
                <div>
                  {/* Yuqori Rasm va Holat belgisi */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-cream-soft shadow-xs">
                    <AgroImage
                      src={IMAGES.livestock}
                      alt="AgrozGO fermerlar ilovasi"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-forest-dark/85 backdrop-blur-md px-3 py-1 text-[11px] font-black text-agroGreen">
                      <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
                      01 • B2C Marketplace
                    </span>

                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-black text-charcoal shadow-sm">
                      1:1 Jonli ombor qoldig‘i bilan bog‘langan
                    </span>
                  </div>

                  {/* Sarlavha & Tushuntirish */}
                  <div className="mt-6 flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-agroGreen/15 text-agroGreen-800 border border-agroGreen/25">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-agroGreen-800 block">
                        Fermer, Chorvador va Dehqonlar Uchun
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-charcoal leading-snug">
                        AgrozGO — Yaqin do‘konlardan vositachisiz to‘g‘ridan-to‘g‘ri xarid
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-charcoal/75 leading-relaxed font-medium">
                    Fermer va chorvadorlar uchun 5 ta agro-sektor bo‘yicha eng yaqin do‘konlarni xaritadan topish,
                    real ombor qoldiqlarini ko‘rish va asossiz ustamalarsiz arzon narxda xarid qilish platformasi.
                  </p>

                  {/* 3 ta imkoniyat */}
                  <div className="mt-5 grid sm:grid-cols-3 gap-3 border-t border-charcoal/10 pt-4">
                    <div className="rounded-xl bg-cream-soft p-3 border border-charcoal/5">
                      <p className="text-xs font-black text-charcoal flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen" /> Bepul Bron
                      </p>
                      <p className="mt-1 text-[11px] text-charcoal/65 leading-tight">
                        5–15 km yaqin do‘kondan dori va yemni bron qilib, o‘zi olib ketadi.
                      </p>
                    </div>

                    <div className="rounded-xl bg-cream-soft p-3 border border-charcoal/5">
                      <p className="text-xs font-black text-charcoal flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen" /> Sektor Logistikasi
                      </p>
                      <p className="mt-1 text-[11px] text-charcoal/65 leading-tight">
                        Yirik motoblok va issiqxona jihozlari dalagacha yetkaziladi.
                      </p>
                    </div>

                    <div className="rounded-xl bg-cream-soft p-3 border border-charcoal/5">
                      <p className="text-xs font-black text-charcoal flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen" /> 0 So‘m Ustama
                      </p>
                      <p className="mt-1 text-[11px] text-charcoal/65 leading-tight">
                        Do‘kondagi haqiqiy kassa narxi bilan bir xil shaffof savdo.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pastki CTA Tugmasi */}
                <div className="mt-6 pt-5 border-t border-charcoal/10 flex items-center justify-between">
                  <a
                    href="#sectors"
                    className="inline-flex items-center gap-2 rounded-2xl bg-forest-dark hover:bg-forest text-white font-black py-3 px-6 text-xs transition shadow-xs active:scale-95 group/btn"
                  >
                    <ShoppingBag className="h-4 w-4 text-agroGreen" />
                    <span>Sektorlar Vitrinasini Ko‘rish</span>
                    <ArrowRight className="h-3.5 w-3.5 text-agroGreen transition-transform group-hover/btn:translate-x-1" />
                  </a>

                  <span className="text-xs font-extrabold text-agroGreen-800 hidden sm:inline">
                    Faol B2C Rejim
                  </span>
                </div>
              </div>
            ) : (
              /* AGROZGO COLLAPSED (KICHRAYGAN TEASER) HOLAT */
              <div className="flex flex-col justify-between h-full py-4 text-center items-center">
                <span className="text-5xl sm:text-7xl font-black text-charcoal/10 tracking-tight">
                  01.
                </span>

                <div className="my-auto flex flex-col items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-agroGreen/15 text-agroGreen-800 border border-agroGreen/25 mb-3 group-hover:scale-110 transition">
                    <Users className="h-6 w-6" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-agroGreen-800">
                    B2C Platforma
                  </span>
                  <h3 className="mt-1 text-base sm:text-lg font-black text-charcoal">
                    AgrozGO
                  </h3>
                  <p className="mt-1 text-xs text-charcoal/60 max-w-[140px] leading-tight">
                    Fermerlar va dehqonlar bozori
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-black text-agroGreen-800 group-hover:underline">
                  Ochish <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
          </div>

          {/* ========================================================
              2-KARTA: BIZNESGO (B2B) — AGRO-DO‘KONLAR VA OMBORLAR UCHUN
             ======================================================== */}
          <div
            onMouseEnter={() => setActiveCard('b2b')}
            className={`group relative flex flex-col justify-between rounded-[32px] p-6 sm:p-8 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden border ${
              activeCard === 'b2b'
                ? 'lg:flex-[2.4] bg-forest-dark text-white border-white/20 shadow-soft'
                : 'lg:flex-[1] bg-forest-dark/95 text-white/70 border-white/10 hover:border-agroGreen/50 shadow-xs'
            }`}
          >
            {/* BIZNESGO EXPANDED (KATTALASHGAN) HOLAT */}
            {activeCard === 'b2b' ? (
              <div className="flex flex-col justify-between h-full animate-fade-in text-white">
                <div>
                  {/* Yuqori Rasm va Holat belgisi */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-forest-card shadow-xs">
                    <AgroImage
                      src={IMAGES.controller}
                      alt="BiznesGO Smart kassa boshqaruvi"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-agroGreen/25 border border-agroGreen/35 text-white backdrop-blur-md px-3 py-1 text-[11px] font-black">
                      <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
                      02 • B2B Kassa Tizimi
                    </span>

                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md px-3 py-1 text-[11px] font-black text-white shadow-sm border border-white/10">
                      Shtrix-kod & Nasiya CRM bilan
                    </span>
                  </div>

                  {/* Sarlavha & Tushuntirish */}
                  <div className="mt-6 flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-agroGreen text-forest-dark font-black">
                      <Store className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-agroGreen block">
                        Agro-Do‘konlar va Omborlar Uchun
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                        BiznesGO — Kassa, ombor va savdo avtomatizatsiyasi
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed font-medium">
                    Vet-dorixona, yem do‘koni va urug‘chilik markazlari uchun qulay POS kassa,
                    fiskal chek, qarz daftari (Nasiya) va tovarlarni avtomatik AgrozGO vitrinasiga chiqarish tizimi.
                  </p>

                  {/* 3 ta imkoniyat */}
                  <div className="mt-5 grid sm:grid-cols-3 gap-3 border-t border-white/10 pt-4">
                    <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                      <p className="text-xs font-black text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen" /> Smart Kassa
                      </p>
                      <p className="mt-1 text-[11px] text-white/65 leading-tight">
                        Shtrix-kod bilan 1 soniyada savdo va fiskal kassa cheki.
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                      <p className="text-xs font-black text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen" /> Avto-Vitrina
                      </p>
                      <p className="mt-1 text-[11px] text-white/65 leading-tight">
                        0 so‘m komissiya bilan tovarlar AgrozGO marketplace’ga chiqadi.
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/10 p-3 border border-white/10">
                      <p className="text-xs font-black text-white flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen" /> Nasiya Daftari
                      </p>
                      <p className="mt-1 text-[11px] text-white/65 leading-tight">
                        Fermerlar qarzini SMS eslatmalar bilan yo‘qotmasdan yuritish.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pastki CTA Tugmasi */}
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                  <a
                    href={BIZNESGO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black py-3 px-6 text-xs transition shadow-glow-green active:scale-95 group/btn"
                  >
                    <span>BiznesGO’da Do‘kon Ochish</span>
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </a>

                  <span className="text-xs font-extrabold text-agroGreen hidden sm:inline">
                    Faol B2B Rejim
                  </span>
                </div>
              </div>
            ) : (
              /* BIZNESGO COLLAPSED (KICHRAYGAN TEASER) HOLAT */
              <div className="flex flex-col justify-between h-full py-4 text-center items-center">
                <span className="text-5xl sm:text-7xl font-black text-white/10 tracking-tight">
                  02.
                </span>

                <div className="my-auto flex flex-col items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-agroGreen border border-white/15 mb-3 group-hover:scale-110 transition">
                    <Store className="h-6 w-6" />
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-agroGreen">
                    B2B Platforma
                  </span>
                  <h3 className="mt-1 text-base sm:text-lg font-black text-white">
                    BiznesGO
                  </h3>
                  <p className="mt-1 text-xs text-white/60 max-w-[140px] leading-tight">
                    Agro-do‘konlar kassa tizimi
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-black text-agroGreen group-hover:underline">
                  Ochish <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
