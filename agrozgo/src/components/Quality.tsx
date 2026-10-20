import React from 'react';
import {
  ShieldCheck,
  Store,
  Truck,
  CheckCircle2,
  FileCheck,
  BadgeCheck,
  ArrowRight,
} from 'lucide-react';
import { VALUES } from '../data/content';

/**
 * STANDARTLAR & KAFOLAT:
 * Sifat nazorati, shaffof narx va tartiblangan xarid tamoyillari:
 * (01) Yaqin do'kondan bron qilish (Dori, yem, urug'lar — o'zi olib ketadi)
 * (02) Sektor logistikasi orqali yetkazish (Yirik texnika, issiqxona — manzilgacha yetkaziladi)
 * (03) Rasmiy chek va kafolat nazorati (S/N, 12+ oy kafolat)
 * Barcha takrorlanuvchi qismlardan xoli, bitta yaxlit va nufuzli bo'lim.
 */
export const Quality: React.FC = () => {
  return (
    <section id="standards" className="py-16 sm:py-24 bg-white/60 border-b border-charcoal/5 scroll-mt-24">
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
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Sifat nazorati, shaffof narx va ishonchli xarid —{' '}
              <span className="text-agroGreen">AgrozGO bosh tamoyillari.</span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed max-w-2xl">
              Mahsulot turiga qarab ikki xil oqilona xarid tizimi: kundalik ehtiyojlar yaqin do‘kondan bepul bron qilinadi,
              yirik texnika va issiqxona jihozlari esa markaziy sektor bazalaridan xavfsiz yetkaziladi.
            </p>
          </div>

          {/* 3 TA ANIQ VA STRUKTURAVIY MASTER KARTA */}
          <div className="relative z-10 mt-10 grid gap-6 md:grid-cols-3 items-stretch">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-3xl bg-white/10 backdrop-blur-md p-6 sm:p-7 border border-white/15 flex flex-col justify-between transition-all duration-300 hover:bg-white/15 hover:border-agroGreen/50"
              >
                <div>
                  {/* Yuqori qator: Raqam va Harakat belgisi */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen text-forest-dark text-xs font-black">
                      {v.num.replace(/[()]/g, '')}
                    </span>
                    <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-agroGreen">
                      {v.action}
                    </span>
                  </div>

                  {/* Sarlavha & Savol */}
                  <h3 className="text-lg font-black text-white leading-snug">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-xs font-black text-agroGreen">
                    {v.subtitle}
                  </p>

                  {/* Qisqa tushuntirish */}
                  <p className="mt-2.5 text-xs text-white/75 leading-relaxed">
                    {v.text}
                  </p>

                  {/* Nimalar kiradi punktlari */}
                  {v.items && (
                    <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2">
                      {v.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs font-medium text-white/85 leading-tight">
                          <CheckCircle2 className="h-4 w-4 text-agroGreen shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pastki teglar */}
                <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-white/10">
                  {v.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/75"
                    >
                      #{c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PASTKI 3 TA SIFAT METRIKASI */}
          <div className="relative z-10 mt-10 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-agroGreen">№1</span>
              <p className="mt-1 text-xs font-bold text-white">Do‘kondan Tekshirib Olish</p>
              <p className="mt-0.5 text-[11px] text-white/60">Yaqin 5–15 km radiusda dori va yemlar zaxirada saqlanadi.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-agroGreen">100%</span>
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
      </div>
    </section>
  );
};
