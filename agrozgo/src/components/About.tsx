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

        {/* Qora bento blok */}
        <div className="mt-14 grid gap-4 rounded-3xl bg-forest p-4 text-white shadow-soft sm:p-6 lg:grid-cols-2 lg:p-8">
          {/* Chap: qamrov */}
          <div className="flex flex-col justify-between gap-8 p-2 sm:p-4">
            <div>
              <h3 className="text-2xl font-bold leading-tight sm:text-3xl">
                B2B do‘konlardan <span className="text-white/50">fermer qo‘ligacha</span>
              </h3>
              <div className="mt-6 flex items-center justify-between text-xs text-white/50">
                <span>Viloyatlar bo‘yicha qamrov</span>
                <span className="font-semibold text-white">O‘zbekiston</span>
              </div>
              <ul className="mt-4 space-y-3">
                {REGION_COVERAGE.map((r) => (
                  <li key={r.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-white/75">{r.name}</span>
                      <span className="font-semibold text-gold">{r.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-1.5 rounded-full bg-gold" style={{ width: `${r.value}%` }} />
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
                  className={`rounded-2xl p-3 sm:p-4 ${s.highlight ? 'bg-gold-soft text-charcoal' : 'bg-white text-charcoal'}`}
                >
                  <p className="text-lg font-extrabold sm:text-xl">
                    {s.value} <span className="text-xs font-semibold">{s.unit}</span>
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-charcoal/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* O'ng: diagramma + jamoa */}
          <div className="flex flex-col overflow-hidden rounded-2xl bg-white text-charcoal">
            <div id="features" className="p-5 sm:p-6">
              <h4 className="text-base font-bold">Sektorlar bo‘yicha buyurtmalar dinamikasi</h4>
              <p className="text-xs text-charcoal/50">Oylik ko‘rsatkich (demo)</p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-b border-charcoal/10 pb-4">
                {[
                  { v: '62%', l: 'Agro-Vet ulushi' },
                  { v: '+18%', l: 'Yem xaridlari o‘sishi' },
                  { v: '85%', l: 'Takroriy mijozlar' },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-charcoal/10 p-2.5">
                    <p className="text-[10px] leading-tight text-charcoal/50">{k.l}</p>
                    <p className="mt-1 text-lg font-extrabold">{k.v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-charcoal/60">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-charcoal" /> Agro-Vet</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold" /> Yem va ozuqa</span>
              </div>
              <div className="mt-3 flex h-44 items-end gap-1.5 sm:gap-2">
                {MONTHLY_ORDERS.map((o) => (
                  <div key={o.m} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full flex-col overflow-hidden rounded-md" style={{ height: `${((o.vet + o.feed) / max) * 150}px` }}>
                      <div className="bg-gold" style={{ flex: o.feed }} />
                      <div className="bg-charcoal" style={{ flex: o.vet }} />
                    </div>
                    <span className="text-[9px] text-charcoal/50 sm:text-[10px]">{o.m}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto flex flex-col gap-4 bg-gold-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h4 className="flex items-center gap-2 text-lg font-bold">
                  <Users className="h-5 w-5" /> Do‘koningizni ulang
                </h4>
                <p className="mt-1 max-w-xs text-xs text-charcoal/65">
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

