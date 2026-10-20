import React from 'react';
import { Users } from 'lucide-react';
import { AgroImage, Eyebrow, DarkButton } from './ui';
import { CentralAsiaMap } from './CentralAsiaMap';
import { IMAGES, MONTHLY_ORDERS, BIZNESGO_URL } from '../data/content';

/** "Bizning rivojlanish yo'limiz" — oq matnli blok + qora bento (xarita/statistika + diagramma). */
export const About: React.FC = () => {
  const max = Math.max(...MONTHLY_ORDERS.map((o) => o.vet + o.feed));

  return (
    <section id="about" className="py-16 sm:py-24">
      <div className="container-x">
        {/* Intro */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-3">
            <Eyebrow>AgrozGO</Eyebrow>
            <AgroImage src={IMAGES.seedlings} alt="Yosh ko'chatlar" className="mt-6 hidden h-28 w-40 rounded-2xl lg:block" />
          </div>
          <div className="lg:col-span-6">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Bizning rivojlanish yo‘limiz:{' '}
              <span className="font-semibold text-charcoal/50">B2B va B2C ekotizimi</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-charcoal/70 sm:text-base">
              <b className="text-charcoal">Birinchi bosqich — BiznesGO (B2B).</b> Agro-do‘konlar uchun POS kassa,
              ombor va qarz daftari. Bugun vet-dorixonalar, yem do‘konlari, ulgurji omborlar, urug‘chilik va texnika
              markazlari o‘z savdosini raqamlashtirmoqda.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/70 sm:text-base">
              <b className="text-charcoal">Ikkinchi bosqich — AgrozGO (B2C).</b> Shu do‘konlardagi real mahsulotlar,
              narxlar va qoldiqlar fermer, chorvador va dehqonlarga bitta marketplace’da ochiladi — sifat nazorati
              va shaffof narx bilan.
            </p>
          </div>
          <div className="flex justify-end lg:col-span-3">
            <AgroImage src={IMAGES.hero} alt="Bug'doy boshoqlari" className="h-28 w-40 rounded-2xl" />
          </div>
        </div>

        {/* Qora/to'q bento blok */}
        <div className="relative mt-14 overflow-hidden rounded-3xl bg-forest-dark border border-forest-border p-4 text-white shadow-soft sm:p-6 lg:p-8">
          {/* Atmosferik nozik yashil nur auralari */}
          <div className="pointer-events-none absolute -top-28 -right-28 h-96 w-96 rounded-full bg-agroGreen/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-agroGreen/15 blur-3xl" />

          <div className="relative grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* Chap: O‘zbekiston va O‘rta Osiyo Interaktiv SVG Xaritasi */}
            <CentralAsiaMap />

            {/* O'ng: diagramma + jamoa */}
            <div className="flex flex-col overflow-hidden rounded-2xl bg-white text-charcoal shadow-soft">
              <div id="features" className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-extrabold text-charcoal">Sektorlar bo‘yicha buyurtmalar dinamikasi</h4>
                    <p className="text-xs text-charcoal/50">Oylik buyurtmalar tahlili (ko‘rgazmali)</p>
                  </div>
                  <span className="text-xs font-bold text-agroGreen-800 bg-agroGreen-50 px-2.5 py-1 rounded-full border border-agroGreen/20">
                    +24% o‘sish
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-b border-charcoal/10 pb-4">
                  {[
                    { v: '62%', l: 'Agro-Vet ulushi', color: 'text-agroGreen-700' },
                    { v: '+18%', l: 'Yem xaridlari o‘sishi', color: 'text-amber-700' },
                    { v: '85%', l: 'Takroriy mijozlar', color: 'text-charcoal' },
                  ].map((k) => (
                    <div key={k.l} className="rounded-xl border border-charcoal/10 bg-cream/40 p-2.5">
                      <p className="text-[10px] leading-tight font-medium text-charcoal/50">{k.l}</p>
                      <p className={`mt-1 text-lg font-black ${k.color}`}>{k.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-charcoal/70">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-agroGreen" /> Agro-Vet</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Yem va ozuqa</span>
                </div>
                <div className="mt-3 flex h-44 items-end gap-1.5 sm:gap-2 pt-2">
                  {MONTHLY_ORDERS.map((o) => (
                    <div key={o.m} className="flex flex-1 flex-col items-center gap-1 group">
                      <div className="flex w-full flex-col overflow-hidden rounded-md transition-transform group-hover:scale-105" style={{ height: `${((o.vet + o.feed) / max) * 150}px` }}>
                        <div className="bg-amber-500" style={{ flex: o.feed }} />
                        <div className="bg-agroGreen" style={{ flex: o.vet }} />
                      </div>
                      <span className="text-[9px] font-medium text-charcoal/50 sm:text-[10px]">{o.m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto flex flex-col gap-4 bg-gradient-to-br from-agroGreen-50 via-cream to-agroGreen-100/60 border-t border-agroGreen/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-bold text-forest-dark">
                    <Users className="h-5 w-5 text-agroGreen-700" /> Do‘koningizni ulang
                  </h4>
                  <p className="mt-1 max-w-xs text-xs text-charcoal/70 font-medium">
                    BiznesGO’da ro‘yxatdan o‘tgan do‘konlar AgrozGO ishga tushishi bilan birinchilardan bo‘lib ko‘rinadi.
                  </p>
                </div>
                <DarkButton href={BIZNESGO_URL} external>
                  BiznesGO’ga o‘tish
                </DarkButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

