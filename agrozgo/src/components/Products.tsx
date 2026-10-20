import React from 'react';
import {
  Users,
  Store,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  ShoppingBag,
  Layers,
  FileText,
  Boxes,
  Zap,
} from 'lucide-react';
import { AgroImage } from './ui';
import { IMAGES, BIZNESGO_URL } from '../data/content';

/**
 * AgrozGO (B2C) va BiznesGO (B2B) farqi va bir-biriga bog'lanishini
 * bittada tushuntiruvchi 2 ta asosiy master-karta bo'limi.
 */
export const Products: React.FC = () => {
  return (
    <section id="products" className="py-16 sm:py-24 bg-cream-soft/60 border-y border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Bo'lim Sarlavhasi */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/15 border border-agroGreen/30 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
              Yagona Agro-Tech Ekotizimi
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-charcoal tracking-tight leading-[1.12]">
              AgrozGO (B2C) nima va <br className="hidden sm:inline" />
              <span className="text-agroGreen">BiznesGO (B2B) nima?</span>
            </h2>
          </div>
          <p className="max-w-md text-xs sm:text-sm text-charcoal/70 leading-relaxed">
            Fermer uchun eng yaqin do‘konlardan arzon xarid, do‘kon egalari uchun esa smart POS kassa va ombor hisobini birlashtirgan yaxlit platforma.
          </p>
        </div>

        {/* 2 TA ASOSIY MASTER-KARTA (B2C vs B2B) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* ========================================================
              1-KARTA: AGROZGO (B2C) — FERMERLAR VA DEHQONLAR UCHUN
             ======================================================== */}
          <div className="group relative flex flex-col justify-between rounded-[32px] bg-white p-6 sm:p-8 lg:p-10 border border-agroGreen/30 shadow-card transition-all duration-300 hover:border-agroGreen hover:shadow-soft">
            <div>
              {/* Karta yuqori statusi */}
              <div className="flex items-center justify-between gap-3 pb-5 border-b border-charcoal/10">
                <span className="inline-flex items-center gap-2 rounded-full bg-agroGreen/15 border border-agroGreen/30 px-3 py-1 text-xs font-black text-agroGreen-900">
                  <Users className="h-3.5 w-3.5 text-agroGreen-700" />
                  AgrozGO (B2C)
                </span>
                <span className="text-xs font-bold text-charcoal/50">
                  Fermer, Chorvador, Dehqonlar
                </span>
              </div>

              {/* Rasm va Mini-Badge */}
              <div className="relative mt-6 h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-cream-soft border border-charcoal/5">
                <AgroImage
                  src={IMAGES.livestock}
                  alt="AgrozGO fermerlar ilovasi"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[11px] font-black text-forest-dark shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-agroGreen" />
                  1:1 Jonli ombor qoldig‘i bilan bog‘langan
                </span>
              </div>

              {/* Sarlavha & Tushuntirish */}
              <h3 className="mt-6 text-xl sm:text-2xl font-black text-charcoal leading-snug">
                Yaqin do‘konlardan vositachisiz to‘g‘ridan-to‘g‘ri xarid
              </h3>

              <div className="mt-3 rounded-2xl bg-cream-soft/80 p-4 border border-charcoal/5">
                <p className="text-xs font-black uppercase tracking-wider text-forest-dark mb-1">
                  Nima bu?
                </p>
                <p className="text-xs sm:text-sm text-charcoal/75 leading-relaxed">
                  Fermer va chorvadorlar uchun eng yaqin 5 ta agro-sektor do‘konlarini xaritadan topish, real ombor qoldiqlarini ko‘rish va mahsulotlarni asossiz ustamalarsiz arzon narxda xarid qilish marketplace platformasi.
                </p>
              </div>

              {/* Qanday ishlaydi (Mexanizm va Logistika) */}
              <div className="mt-4 space-y-2.5">
                <p className="text-xs font-black uppercase tracking-wider text-charcoal/50">
                  Qanday ishlaydi?
                </p>
                <div className="flex items-start gap-3 rounded-xl bg-white p-3 border border-charcoal/10 shadow-2xs">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-agroGreen-50 text-agroGreen-800 font-black text-xs">
                    01
                  </span>
                  <div>
                    <p className="text-xs font-black text-charcoal">Kichik tovarlar: Bron qilish & Olib ketish</p>
                    <p className="mt-0.5 text-[11px] text-charcoal/65 leading-relaxed">
                      Dori-darmon, urug‘ yoki kundalik yem xaridlarini onlayn bron qilasiz. Do‘konda tovar zaxiralanadi, borib navbatsiz olib ketasiz.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white p-3 border border-charcoal/10 shadow-2xs">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-agroGreen-50 text-agroGreen-800 font-black text-xs">
                    02
                  </span>
                  <div>
                    <p className="text-xs font-black text-charcoal">Yirik buyurtmalar: Sektor logistikasi</p>
                    <p className="mt-0.5 text-[11px] text-charcoal/65 leading-relaxed">
                      Ko‘p tonnalik yem, ulgurji o‘g‘it yoki yirik texnikalarni boshqa viloyatdan xarid qilsangiz, sektorlarning o‘z transport xizmati yetkazadi.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 ta muhim afzallik */}
              <ul className="mt-5 space-y-2 border-t border-charcoal/10 pt-4">
                {[
                  'Do‘konga borishdan oldin tovar bor-yo‘qligini 100% bilish',
                  '1 kg dan boshlab bo‘lib olish va ochiq shaffof narxlar',
                  'Partiya raqami, yaroqlilik muddati va rasmiy sifat kafolati',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-bold text-charcoal/80">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-agroGreen-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pastki CTA Tugmasi */}
            <div className="mt-8 pt-6 border-t border-charcoal/10">
              <a
                href="#app-showcase"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-forest-dark hover:bg-forest text-white font-black py-3.5 px-6 text-sm transition shadow-sm active:scale-95 group"
              >
                <span>AgrozGO Ilovasi Haqida</span>
                <ArrowRight className="h-4 w-4 text-agroGreen transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>

          {/* ========================================================
              2-KARTA: BIZNESGO (B2B) — DO'KONLAR VA DORIXONALAR UCHUN
             ======================================================== */}
          <div className="group relative flex flex-col justify-between rounded-[32px] bg-forest-dark p-6 sm:p-8 lg:p-10 border border-forest-border text-white shadow-2xl transition-all duration-300 hover:border-agroGreen/50">
            <div>
              {/* Karta yuqori statusi */}
              <div className="flex items-center justify-between gap-3 pb-5 border-b border-white/10">
                <span className="inline-flex items-center gap-2 rounded-full bg-agroGreen px-3 py-1 text-xs font-black text-forest-dark shadow-glow-subtle">
                  <Store className="h-3.5 w-3.5 text-forest-dark" />
                  BiznesGO (B2B)
                </span>
                <span className="text-xs font-bold text-white/60">
                  Agro-Do‘kon, Dorixona, Omborlar
                </span>
              </div>

              {/* Rasm va Mini-Badge */}
              <div className="relative mt-6 h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-black/40 border border-white/10">
                <AgroImage
                  src={IMAGES.controller}
                  alt="BiznesGO Smart kassa boshqaruvi"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-forest-dark/95 border border-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-black text-white shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-agroGreen" />
                  Smart POS Kassa, Ombor & Qarz Daftari
                </span>
              </div>

              {/* Sarlavha & Tushuntirish */}
              <h3 className="mt-6 text-xl sm:text-2xl font-black text-white leading-snug">
                Do‘kon kassasi, ombor hisobi va avtomatik sotuv
              </h3>

              <div className="mt-3 rounded-2xl bg-white/10 p-4 border border-white/10 backdrop-blur-md">
                <p className="text-xs font-black uppercase tracking-wider text-agroGreen mb-1">
                  Nima bu?
                </p>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Agro-do‘kon egalari uchun savdo, kassa, ombor qoldiqlari va CRM qarz daftarini raqamlashtiruvchi hamda tovarlarni avtomatik ravishda AgrozGO marketplace fermerlariga chiqaruvchi B2B boshqaruv tizimi.
                </p>
              </div>

              {/* Qanday ishlaydi (Mexanizm va Integratsiya) */}
              <div className="mt-4 space-y-2.5">
                <p className="text-xs font-black uppercase tracking-wider text-white/50">
                  Qanday ishlaydi?
                </p>
                <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 border border-white/10">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-agroGreen text-forest-dark font-black text-xs">
                    01
                  </span>
                  <div>
                    <p className="text-xs font-black text-white">Smart POS Kassa & Ombor hisobi</p>
                    <p className="mt-0.5 text-[11px] text-white/70 leading-relaxed">
                      Do‘kon kassa dasturidan foydalanadi, shtrix-kod orqali savdoni yuritadi, chek chiqaradi va qarz daftarini avtomatlashtiradi.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3 border border-white/10">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-agroGreen text-forest-dark font-black text-xs">
                    02
                  </span>
                  <div>
                    <p className="text-xs font-black text-white">Avtomatik AgrozGO Vitrinasi</p>
                    <p className="mt-0.5 text-[11px] text-white/70 leading-relaxed">
                      Kassaga kiritilgan barcha tovarlar va ularning real qoldiqlari 0 soniyada AgrozGO xaridorlariga ko‘rinadi va buyurtmalar kassaga tushadi.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 ta muhim afzallik */}
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
                {[
                  'Shtrix-kodli tezkor kassa va fiskal chek integratsiyasi',
                  'CRM qarz daftari (Nasiya) va mijozlar shaxsiy hisoboti',
                  '0 so‘m komissiya bilan AgrozGO dan yangi mijozlar oqimi',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs font-bold text-white/85">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-agroGreen" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pastki CTA Tugmasi */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <a
                href={BIZNESGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black py-3.5 px-6 text-sm transition shadow-glow-green active:scale-95 group"
              >
                <span>BiznesGO (B2B) Do‘kon Ochish</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* BOG'LOVCHI KO'PRIK BANNERI (Ecosystem Bridge Banner) */}
        <div className="mt-8 rounded-2xl bg-white p-4 sm:p-5 border border-charcoal/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-agroGreen/15 text-agroGreen-800 border border-agroGreen/25">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-black text-charcoal">
                Ekotizim qanday bog‘langan?
              </p>
              <p className="text-[11px] sm:text-xs text-charcoal/65">
                Do‘kon BiznesGO’da savdo qiladi — uning tovarlari avtomatik ravishda AgrozGO fermerlariga ko‘rinadi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold shrink-0">
            <span className="rounded-lg bg-forest-dark text-white px-2.5 py-1 text-[11px] font-bold">
              BiznesGO (B2B)
            </span>
            <span className="text-agroGreen font-black">──►</span>
            <span className="rounded-lg bg-agroGreen text-forest-dark px-2.5 py-1 text-[11px] font-black">
              AgrozGO (B2C)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
