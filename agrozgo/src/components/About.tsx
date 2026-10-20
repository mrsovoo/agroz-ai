import React from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Store,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Logo, BiznesGoLogo } from './ui';
import { CentralAsiaMap } from './CentralAsiaMap';
import { BIZNESGO_URL } from '../data/content';

/**
 * "Bizning rivojlanish yo'limiz: B2B va B2C ekotizimi"
 * - O'rtada: Rivojlanish yo'li sarlavhasi va 1-bosqich hamda 2-bosqich to'liq tushuntirishi
 * - Chapda: BiznesGO logosi, "Bu B2B platforma" belgisi va o'ngga yo'naltirilgan strelka
 * - O'ngda: AgrozGO logosi, "Bu B2C platforma" belgisi va chapga yo'naltirilgan strelka
 * - Pastda: O'rta Osiyo va O'zbekiston hududiy qamrov xaritasi
 */
export const About: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24 bg-cream/50 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Yuqori Ekotizim Uchligi: Chapda B2B, O'rtada Tushuntirish, O'ngda B2C */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch mb-14 sm:mb-20">
          
          {/* CHAP TARAF: BIZNESGO (B2B PLATFORMA) */}
          <div className="lg:col-span-3 flex flex-col justify-between rounded-3xl bg-forest-dark p-6 sm:p-7 text-white border border-white/10 shadow-card relative overflow-hidden group">
            {/* Fon bezagi */}
            <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-agroGreen/10 blur-2xl pointer-events-none" />

            <div>
              {/* B2B Badge & Bosqich */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/20 border border-agroGreen/30 px-3 py-1 text-[11px] font-black text-agroGreen">
                  <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
                  1-BOSQICH
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white/70 uppercase">
                  B2B
                </span>
              </div>

              {/* BiznesGO Logosi */}
              <div className="mt-6 mb-4">
                <BiznesGoLogo variant="full" textColor="#ffffff" iconColor="#35ca56" className="h-9 sm:h-10" />
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-agroGreen">
                  Bu B2B Platforma
                </span>
                <h3 className="mt-1 text-lg font-black text-white leading-snug">
                  Agro-Do‘konlar va Omborlar Kassa Tizimi
                </h3>
                <p className="mt-2 text-xs text-white/70 leading-relaxed">
                  Smart POS kassa, avtomatlashtirilgan ombor hisobi, fiskal chek va CRM qarz daftari.
                </p>
              </div>
            </div>

            {/* O'rtaga / AgrozGO ga qaratilgan strelka & Harakat */}
            <div className="mt-8 pt-5 border-t border-white/10">
              <a
                href={BIZNESGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn flex items-center justify-between rounded-2xl bg-white/10 hover:bg-agroGreen hover:text-forest-dark p-3.5 text-xs font-bold transition-all text-white"
              >
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-agroGreen group-hover/btn:text-forest-dark transition-colors" />
                  <span>BiznesGO.uz</span>
                </div>
                {/* O'ngga / O'rtaga ko'rsatuvchi strelka */}
                <div className="flex items-center gap-1 text-[11px] font-black">
                  <span className="hidden sm:inline">B2B Tizim</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </div>
              </a>
            </div>
          </div>

          {/* O'RTA TARAF: BIZNING RIVOJLANISH YO'LIMIZ (ASOSIY STRUKTURA) */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-9 border border-charcoal/10 shadow-xs">
            <div>
              {/* Eyebrow */}
              <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-agroGreen/30 bg-agroGreen/15 px-4 py-1 text-xs font-black text-agroGreen-800">
                  <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
                  Rivojlanish Strategiyasi
                </span>
              </div>

              {/* Markaziy Sarlavha */}
              <h2 className="mt-4 text-center text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal tracking-tight leading-[1.18]">
                Bizning rivojlanish yo‘limiz:{' '}
                <span className="text-agroGreen">B2B va B2C ekotizimi</span>
              </h2>

              {/* 1-bosqich va 2-bosqich bloklari */}
              <div className="mt-7 space-y-4">
                {/* 1-bosqich: BiznesGO (B2B) */}
                <div className="rounded-2xl bg-cream-soft/80 p-4 sm:p-5 border border-charcoal/8 transition hover:border-agroGreen/40">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-forest-dark text-agroGreen text-xs font-black shrink-0">
                      1
                    </span>
                    <h3 className="text-sm font-black text-charcoal">
                      Birinchi bosqich — BiznesGO (B2B)
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed pl-8">
                    Agro-do‘konlar uchun POS kassa, ombor va qarz daftari. Bugun vet-dorixonalar, yem do‘konlari,
                    ulgurji omborlar, urug‘chilik va texnika markazlari o‘z savdosini raqamlashtirmoqda.
                  </p>
                </div>

                {/* Markaziy Strelkali Ko'prik (B2B ──► B2C) */}
                <div className="flex items-center justify-center gap-3 py-0.5">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-charcoal/20 to-transparent" />
                  <div className="inline-flex items-center gap-2 rounded-full bg-forest-dark text-white px-3.5 py-1 text-[11px] font-black shadow-xs">
                    <span className="text-white/80">B2B Kassa</span>
                    <span className="text-agroGreen font-black">──►</span>
                    <span className="text-agroGreen">Avto-Sinxron</span>
                    <span className="text-agroGreen font-black">──►</span>
                    <span className="text-white/80">B2C Bozor</span>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-charcoal/20 to-transparent" />
                </div>

                {/* 2-bosqich: AgrozGO (B2C) */}
                <div className="rounded-2xl bg-cream-soft/80 p-4 sm:p-5 border border-charcoal/8 transition hover:border-agroGreen/40">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="grid h-6 w-6 place-items-center rounded-lg bg-agroGreen text-forest-dark text-xs font-black shrink-0">
                      2
                    </span>
                    <h3 className="text-sm font-black text-charcoal">
                      Ikkinchi bosqich — AgrozGO (B2C)
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed pl-8">
                    Shu do‘konlardagi real mahsulotlar, narxlar va qoldiqlar fermer, chorvador va dehqonlarga bitta
                    marketplace’da ochiladi — sifat nazorati va shaffof narx bilan.
                  </p>
                </div>
              </div>
            </div>

            {/* Pastki Xulosa Chizig'i */}
            <p className="mt-6 pt-4 border-t border-charcoal/10 text-center text-xs text-charcoal/60 font-medium">
              Agro-do‘konlar bitta kassa orqali raqamlashadi, fermerlar esa yagona marketplace orqali xarid qiladi.
            </p>
          </div>

          {/* O'NG TARAF: AGROZGO (B2C PLATFORMA) */}
          <div className="lg:col-span-3 flex flex-col justify-between rounded-3xl bg-cream-soft p-6 sm:p-7 text-charcoal border border-charcoal/10 shadow-card relative overflow-hidden group hover:border-agroGreen/50 transition">
            {/* Fon bezagi */}
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-agroGreen/15 blur-2xl pointer-events-none" />

            <div>
              {/* B2C Badge & Bosqich */}
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/20 border border-agroGreen/30 px-3 py-1 text-[11px] font-black text-agroGreen-800">
                  <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
                  2-BOSQICH
                </span>
                <span className="rounded-full bg-charcoal/10 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-charcoal/70 uppercase">
                  B2C
                </span>
              </div>

              {/* AgrozGO Logosi */}
              <div className="mt-6 mb-4">
                <Logo className="h-9 sm:h-10" />
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-agroGreen-800">
                  Bu B2C Platforma
                </span>
                <h3 className="mt-1 text-lg font-black text-charcoal leading-snug">
                  Fermerlar va Chorvadorlar Bozori
                </h3>
                <p className="mt-2 text-xs text-charcoal/70 leading-relaxed">
                  5 ta agro sektor bo‘yicha yagona katalog, eng yaqin do‘konlardan real narx va bron qilish.
                </p>
              </div>
            </div>

            {/* O'rtaga / BiznesGO ga qaratilgan strelka & Harakat */}
            <div className="mt-8 pt-5 border-t border-charcoal/10">
              <a
                href="#products"
                className="group/btn flex items-center justify-between rounded-2xl bg-white hover:bg-forest-dark hover:text-white p-3.5 text-xs font-bold transition-all text-charcoal border border-charcoal/10 shadow-xs"
              >
                {/* Chapga / O'rtaga ko'rsatuvchi strelka */}
                <div className="flex items-center gap-1 text-[11px] font-black text-agroGreen-800 group-hover/btn:text-agroGreen">
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover/btn:-translate-x-1" />
                  <span className="hidden sm:inline">B2C Bozor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Marketplace</span>
                  <ShoppingBag className="h-4 w-4 text-agroGreen-800 group-hover/btn:text-agroGreen transition-colors" />
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Sof Xarita va Respublika bo'yicha 5 ta sektor ko'lami */}
        <div>
          <CentralAsiaMap />
        </div>
      </div>
    </section>
  );
};
