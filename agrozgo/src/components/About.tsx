import React from 'react';
import { Users } from 'lucide-react';
import { AgroImage, Eyebrow, DarkButton } from './ui';
import { IMAGES, ECOSYSTEM_STATS, REGION_COVERAGE, MONTHLY_ORDERS, BIZNESGO_URL } from '../data/content';

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
        <div className="mt-14 grid gap-4 rounded-3xl bg-forest-dark border border-forest-border p-4 text-white shadow-soft sm:p-6 lg:grid-cols-2 lg:p-8">
          {/* Chap: qamrov */}
          <div className="flex flex-col justify-between gap-8 p-2 sm:p-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agroGreen">
                <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
                Respublika bo‘yicha tarmoq
              </span>
              <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
                B2B do‘konlardan <span className="text-white/50">fermer qo‘ligacha</span>
              </h3>
              <div className="mt-6 flex items-center justify-between text-xs text-white/50">
                <span>Viloyatlar bo‘yicha qamrov darajasi</span>
                <span className="font-bold text-agroGreen">O‘zbekiston</span>
              </div>
              <ul className="mt-4 space-y-3.5">
                {REGION_COVERAGE.map((r) => (
                  <li key={r.name}>
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-white/80 font-medium">{r.name}</span>
                      <span className="font-extrabold text-agroGreen">{r.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-agroGreen-600 via-agroGreen to-agroGreen-300" style={{ width: `${r.value}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-white/40">* Taqdimot uchun namunaviy ko‘rsatkichlar</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ECOSYSTEM_STATS.map((s) => (
                <div
                  key={s.label}
                  className={`rounded-2xl p-3.5 sm:p-4 ${
                    s.highlight
                      ? 'bg-agroGreen text-forest-dark font-black shadow-glow-subtle ring-2 ring-agroGreen/40'
                      : 'bg-white text-charcoal'
                  }`}
                >
                  <p className="text-lg font-black sm:text-xl">
                    {s.value} <span className="text-xs font-semibold">{s.unit}</span>
                  </p>
                  <p className={`mt-1 text-[11px] leading-tight font-medium ${s.highlight ? 'text-forest-dark/80' : 'text-charcoal/60'}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* O'ng: diagramma + jamoa */}
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white text-charcoal shadow-soft">
            <div id="features" className="p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-extrabold text-charcoal">Sektorlar bo‘yicha buyurtmalar dinamikasi</h4>
                  <p className="text-xs text-charcoal/50">Oylik buyurtmalar tahlili (demo)</p>
                </div>
                <span className="text-xs font-bold text-agroGreen-800 bg-agroGreen-50 px-2.5 py-1 rounded-full border border-agroGreen/20">
                  +24% o‘sish
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-b border-charcoal/10 pb-4">
                {[
                  { v: '62%', l: 'Agro-Vet ulushi', color: 'text-agroGreen-700' },
                  { v: '+18%', l: 'Yem xaridlari o‘sishi', color: 'text-gold-dark' },
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
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Yem va ozuqa</span>
              </div>
              <div className="mt-3 flex h-44 items-end gap-1.5 sm:gap-2 pt-2">
                {MONTHLY_ORDERS.map((o) => (
                  <div key={o.m} className="flex flex-1 flex-col items-center gap-1 group">
                    <div className="flex w-full flex-col overflow-hidden rounded-md transition-transform group-hover:scale-105" style={{ height: `${((o.vet + o.feed) / max) * 150}px` }}>
                      <div className="bg-gold" style={{ flex: o.feed }} />
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
    </section>
  );
};

