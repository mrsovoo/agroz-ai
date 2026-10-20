import React from 'react';
import { AgroImage, Eyebrow } from './ui';
import { CentralAsiaMap } from './CentralAsiaMap';
import { IMAGES } from '../data/content';

/** "Bizning rivojlanish yo'limiz" — sof O'rta Osiyo xaritasi va 5 ta sektor ko'lami */
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

        {/* Sof Xarita va Respublika bo'yicha 5 ta sektor ko'lami */}
        <div className="mt-12">
          <CentralAsiaMap />
        </div>
      </div>
    </section>
  );
};
