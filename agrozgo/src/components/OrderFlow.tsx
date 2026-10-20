import React from 'react';
import { Search, ShoppingBag, ShieldCheck, ArrowRight, Store, Clock, CheckCircle2 } from 'lucide-react';
import { Eyebrow, DarkButton } from './ui';
import { ORDER_FLOW_STEPS, BIZNESGO_URL } from '../data/content';

const ICONS = [Search, ShoppingBag, Clock, ShieldCheck];

export const OrderFlow: React.FC = () => {
  return (
    <section id="order-flow" className="py-16 sm:py-24 bg-cream border-t border-charcoal/5">
      <div className="container-x">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Eyebrow>B2C Xarid Oqimi</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-charcoal">
              To‘g‘ridan-to‘g‘ri do‘konga <br className="hidden sm:inline" />
              <span className="font-semibold text-charcoal/50">buyurtma berish jarayoni</span>
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/70 leading-relaxed sm:text-right">
            Fermer va chorvadorlar uchun vositachisiz, shaffof narxlar va do‘kon kassasi bilan real vaqtda bog‘langan 4 bosqichli qulay xarid tizimi.
          </p>
        </div>

        {/* 4 ta Bosqich Kartochkalari */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER_FLOW_STEPS.map((s, idx) => {
            const Icon = ICONS[idx] || CheckCircle2;
            return (
              <div
                key={s.num}
                className="group relative flex flex-col justify-between rounded-3xl bg-white p-6 shadow-xs border border-charcoal/10 transition-colors duration-200 hover:border-agroGreen hover:shadow-soft"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-agroGreen-50 text-agroGreen-800 border border-agroGreen/20 group-hover:bg-agroGreen group-hover:text-forest-dark transition-colors">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-cream-soft border border-charcoal/10 px-3 py-1 text-xs font-black text-charcoal/70">
                      {s.num}
                    </span>
                  </div>

                  <span className="mt-6 inline-block rounded-full bg-agroGreen/15 px-2.5 py-0.5 text-[10px] font-black text-agroGreen-900 uppercase tracking-wider">
                    {s.badge}
                  </span>

                  <h3 className="mt-2 text-base sm:text-lg font-black text-charcoal leading-snug">
                    {s.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-charcoal/70">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-charcoal/10 flex items-center justify-between text-[11px] font-bold text-agroGreen-800">
                  <span>Bosqich {s.num}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* B2B va B2C Integratsiya Banneri (Do'kon egalari uchun) */}
        <div className="mt-10 rounded-3xl bg-forest-dark border border-forest-border p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-soft">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 sm:h-14 sm:w-14 shrink-0 place-items-center rounded-2xl bg-agroGreen text-forest-dark shadow-glow-green">
              <Store className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-agroGreen">
                Agro-Do‘konlar va Dorixonalar Uchun
              </p>
              <h4 className="mt-1 text-base sm:text-xl font-black">
                O‘z tovarlaringizni AgrozGO (B2C) ilovasida sotasizmi?
              </h4>
              <p className="mt-1 text-xs text-white/70 max-w-xl">
                BiznesGO POS kassa dasturini do‘koningizga o‘rnating va barcha qoldiqlaringiz avtomatik tarzda marketplace vitrinasiga chiqadi.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <DarkButton href={BIZNESGO_URL} external className="w-full justify-center md:w-auto !bg-agroGreen !text-forest-dark hover:!bg-agroGreen-hover shadow-glow-green font-black whitespace-nowrap">
              BiznesGO (B2B) Do‘kon ochish
            </DarkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
