import React from 'react';
import { Users } from 'lucide-react';
import { AgroImage, Eyebrow, DarkButton } from './ui';
import { CentralAsiaMap } from './CentralAsiaMap';
import { IMAGES, BIZNESGO_URL } from '../data/content';

/** "Bizning rivojlanish yo'limiz" — katta O'rta Osiyo xaritasi va ekotizim qamrovi */
export const About: React.FC = () => {
  return (
    <section id="about" className="py-16 sm:py-24">
      <div className="container-x">
        {/* Sarlavha & Kirish */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-3">
            <Eyebrow>AgrozGO</Eyebrow>
            <AgroImage src={IMAGES.seedlings} alt="Yosh ko'chatlar" className="mt-6 hidden h-28 w-40 rounded-2xl lg:block" />
          </div>
          <div className="lg:col-span-6">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl text-charcoal">
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

        {/* Katta Bento Blok: To'liq Kenglikdagi O'rta Osiyo Xaritasi */}
        <div className="relative mt-12 overflow-hidden rounded-3xl bg-[#080D0A] border border-white/10 p-4 text-white shadow-2xl sm:p-6 lg:p-8">
          {/* Atmosferik nozik yashil va oq nur effektlari */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-[450px] w-[450px] rounded-full bg-agroGreen/15 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-white/5 blur-[120px]" />

          {/* Asosiy Katta Xarita Komponenti */}
          <div className="relative w-full">
            <CentralAsiaMap />
          </div>

          {/* Do'kon egalari uchun ixcham CTA strip */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-white/[0.04] border border-white/10 p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen border border-agroGreen/30">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  Agro-do‘koningiz bormi? BiznesGO orqali AgrozGO vitrinasiga ulaning
                </h4>
                <p className="text-xs text-white/60">
                  POS kassa va ombor hisobi BiznesGO’da, mahsulotlaringiz esa avtomatik AgrozGO xaridorlariga ko‘rinadi.
                </p>
              </div>
            </div>
            <DarkButton href={BIZNESGO_URL} external className="shrink-0 whitespace-nowrap">
              BiznesGO’ga o‘tish
            </DarkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
