import React from 'react';
import {
  ShieldCheck,
  Store,
  Truck,
  CheckCircle2,
  Users,
  MapPin,
  RefreshCw,
  BookmarkCheck,
  Send,
  Receipt,
  ShoppingBag,
  CreditCard,
  Scale,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { VALUES, BIZNESGO_URL } from '../data/content';

/**
 * STANDARTLAR & KAFOLAT:
 * 1. Yuqori master-banner: Yaqin do'kondan bron qilish (Dori, yem, urug') vs Sektor yetkazib berishi (Yirik texnika, issiqxona).
 * 2. Qulayliklar bo'limi:
 *    - Chap bo'lim (B2C): Fermerlar uchun qulayliklar + pastida "Mahsulotlarni ko'rish" tugmasi.
 *    - O'ng bo'lim (B2B): Agro-do'konlar uchun qulayliklar + pastida "BiznesGO'ni ko'rish" tugmasi.
 */
export const Quality: React.FC = () => {
  return (
    <section id="standards" className="py-16 sm:py-24 bg-white/50 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* 1. ASOSIY STANDARTLAR BANNERI */}
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
            <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.18]">
              Sifat nazorati, shaffof narx va ishonchli xarid —{' '}
              <span className="text-agroGreen">AgrozGO bosh tamoyillari.</span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/75 leading-relaxed max-w-2xl">
              Mahsulot turiga qarab ikki xil oqilona xarid tizimi: kundalik mayda ehtiyojlar yaqin do‘kondan bron qilinadi,
              yirik texnika va issiqxona jihozlari esa markaziy sektor bazalaridan yetkaziladi.
            </p>
          </div>

          {/* 2 TA ANIQ TARTIBLANGAN MASTER KARTA */}
          <div className="relative z-10 mt-10 grid gap-6 md:grid-cols-2">
            {/* 1-KARTA: YAQIN DO'KONLARDAN BRON QILISH VA OLIB KETISH */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-md p-6 sm:p-7 border border-white/15 flex flex-col justify-between transition-all hover:bg-white/15 hover:border-agroGreen/50">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/20 border border-agroGreen/30 px-3 py-0.5 text-[11px] font-black text-agroGreen">
                    <Store className="h-3.5 w-3.5" /> 5–15 km Yaqin Radius
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
                    O‘zi Olib Ketish
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  Dorilar, Yem-Ozuqa va Urug‘lar — Yaqin Do‘kondan Bron Qilish
                </h3>
                <p className="mt-2.5 text-xs text-white/75 leading-relaxed">
                  Biz vet-dorixonalar, ozuqa yemlari va urug‘larni sizga <b>eng yaqin agro-do‘konlardan</b> ko‘rsatamiz.
                  Saytda tovar mavjudligini ko‘rib, 1 tugma bilan bepul bron qilasiz va do‘konga borib navbatsiz olib ketasiz.
                </p>

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                  {[
                    '0 so‘m ortiqcha yetkazish to‘lovi va yo‘l xarajatini tejash',
                    'Mahsulotning yaroqlilik muddati va qadog‘ini joyida ko‘rib olish',
                    'Shoshilinch kasallik yoki yem tugaganda eng tezkor yechim',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-2 text-xs text-white/85 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-agroGreen shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#VetDorixona</span>
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#YemOzuqa</span>
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#UrugChilik</span>
                <span className="text-[10px] font-bold text-agroGreen bg-white/10 px-2 py-0.5 rounded-md">#BronQilish</span>
              </div>
            </div>

            {/* 2-KARTA: YIRIK AGRO-TEXNIKA VA ISSIQXONA JIHOZLARI — SEKTOR YETKAZISHI */}
            <div className="rounded-3xl bg-white/10 backdrop-blur-md p-6 sm:p-7 border border-white/15 flex flex-col justify-between transition-all hover:bg-white/15 hover:border-agroGreen/50">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/20 border border-amber/30 px-3 py-0.5 text-[11px] font-black text-amber-300">
                    <Truck className="h-3.5 w-3.5" /> Hududiy Sektor Bazasi
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full">
                    Sektor Yetkazib Berishi
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
                  Yirik Texnika & Issiqxona — Sektor Logistikasi
                </h3>
                <p className="mt-2.5 text-xs text-white/75 leading-relaxed">
                  Motobloklar, purkagichlar, ko‘p yillik issiqxona plyonkalari va sug‘orish tizimlari oddiy do‘konda saqlanmaydi — ularning
                  <b> maxsus hududiy yirik sektorlari</b> bor. Buyurtma berilganda, sektor transporti to‘g‘ridan-to‘g‘ri yetkazib beradi.
                </p>

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                  {[
                    'Zavod seriya raqami (S/N) va 12+ oylik rasmiy chek-kafolat',
                    'Katta hajmdagi og‘ir yuklarni maxsus yuk mashinalarida tashish',
                    'To‘g‘ridan-to‘g‘ri markaziy dilerlik narxi (vositachilarsiz)',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-2 text-xs text-white/85 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#Motoblok</span>
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#IssiqxonaPlyonka</span>
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#SugorishTizimi</span>
                <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-2 py-0.5 rounded-md">#SektorTransporti</span>
              </div>
            </div>
          </div>

          {/* PASTKI 3 TA SIFAT METRIKASI */}
          <div className="relative z-10 mt-8 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-agroGreen">№1</span>
              <p className="mt-1 text-xs font-bold text-white">Do‘kondan Tekshirib Olish</p>
              <p className="mt-0.5 text-[11px] text-white/60">Yaqin 5–15 km radiusda dori va yemlar zaxirada saqlanadi.</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-2xl font-black text-amber-300">100%</span>
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

        {/* 2. QULAYLIKLAR BO'LIMI: CHAPDA B2C (FERMERLAR) VA O'NGDA B2B (DO'KONLAR) */}
        <div className="mt-16 sm:mt-24">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/15 border border-agroGreen/30 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Sparkles className="h-3.5 w-3.5 text-agroGreen-700" />
              Ekotizim Qulayliklari
            </span>
            <h3 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal tracking-tight">
              Zamonaviy texnologiya bilan <span className="text-agroGreen">qulay agro-savdo</span>
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-charcoal/70 leading-relaxed">
              Fermerlar uchun tezkor xarid va tejamkorlik, do‘kon egalari uchun esa avtomatlashtirilgan kassa va yangi mijozlar oqimi.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            
            {/* CHAP BO'LIM: AGROZGO (B2C) — FERMERLAR UCHUN QULAYLIKLAR */}
            <div className="rounded-3xl bg-cream-soft/80 border border-charcoal/10 p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-agroGreen/40 transition">
              <div>
                {/* Sarlavha & B2C Nishon */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-charcoal/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-agroGreen/15 text-agroGreen-800 border border-agroGreen/25">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-agroGreen-800 block">
                        B2C • Xaridorlar Uchun
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-charcoal">
                        AgrozGO — Fermerlar Qulayliklari
                      </h4>
                    </div>
                  </div>
                  <span className="rounded-full bg-agroGreen text-forest-dark px-3 py-1 text-[11px] font-black">
                    Fermerga
                  </span>
                </div>

                {/* 4 ta B2C qulaylik */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-charcoal/5 shadow-xs">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/10 text-agroGreen-800 shrink-0 mt-0.5">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-charcoal">Yaqin do‘konlarni xaritada topish</h5>
                      <p className="mt-0.5 text-xs text-charcoal/70 leading-relaxed">
                        Joylashuvingiz bo‘yicha 5–15 km radiusdagi vet-dorixona, yem va urug‘ do‘konlari ko‘rsatiladi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-charcoal/5 shadow-xs">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/10 text-agroGreen-800 shrink-0 mt-0.5">
                      <RefreshCw className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-charcoal">Real vaqtli ombor qoldig‘i</h5>
                      <p className="mt-0.5 text-xs text-charcoal/70 leading-relaxed">
                        BiznesGO kassasi bilan sinxron — faqat do‘konda amalda bor mahsulotgina ko‘rsatiladi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-charcoal/5 shadow-xs">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/10 text-agroGreen-800 shrink-0 mt-0.5">
                      <BookmarkCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-charcoal">Onlayn buyurtma va bepul bron</h5>
                      <p className="mt-0.5 text-xs text-charcoal/70 leading-relaxed">
                        Mahsulotni saytda 1 bosishda oldindan bron qiling, do‘konga borib navbatsiz tayyor holda oling.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-charcoal/5 shadow-xs">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/10 text-agroGreen-800 shrink-0 mt-0.5">
                      <Send className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-charcoal">Telegram orqali bildirishnoma</h5>
                      <p className="mt-0.5 text-xs text-charcoal/70 leading-relaxed">
                        Buyurtma holati, do‘kon manzili, aksiyalar va tayyorligi haqida darhol SMS va bot xabari.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pastki Harakat Tugmasi (B2C) */}
              <div className="mt-8 pt-5 border-t border-charcoal/10">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-forest-dark hover:bg-forest text-white font-black py-3.5 px-6 text-xs sm:text-sm transition shadow-xs active:scale-95 group"
                >
                  <ShoppingBag className="h-4 w-4 text-agroGreen" />
                  <span>Mahsulot va Do‘konlarni Ko‘rish</span>
                  <ArrowRight className="h-4 w-4 text-agroGreen transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>

            {/* O'NG BO'LIM: BIZNESGO (B2B) — DO'KONLAR UCHUN QULAYLIKLAR */}
            <div className="rounded-3xl bg-forest-dark text-white border border-white/10 p-6 sm:p-8 flex flex-col justify-between shadow-card relative overflow-hidden group">
              {/* Fon nuri */}
              <div className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-agroGreen/10 blur-2xl" />

              <div>
                {/* Sarlavha & B2B Nishon */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-agroGreen border border-white/15">
                      <Store className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-agroGreen block">
                        B2B • Agro-Do‘konlar Uchun
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        BiznesGO — Kassa & Savdo Boshqaruvi
                      </h4>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/15 text-white px-3 py-1 text-[11px] font-black border border-white/10">
                    Do‘kondorga
                  </span>
                </div>

                {/* 4 ta B2B qulaylik */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen shrink-0 mt-0.5">
                      <Receipt className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-white">Smart POS kassa & tezkor savdo</h5>
                      <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
                        Shtrix-kod o‘qitish, qulay chek chiqarish, fiskal kassa va tovarlarni oson kirim qilish.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen shrink-0 mt-0.5">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-white">Avtomatik AgrozGO vitrinasi</h5>
                      <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
                        Kassaga kiritilgan barcha tovarlar 0 so‘m komissiya bilan minglab fermerlarga ko‘rinadi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen shrink-0 mt-0.5">
                      <CreditCard className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-white">CRM Nasiya & Qarz daftari</h5>
                      <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
                        Doimiy fermerlar qarzini SMS eslatmalar bilan tartibli yuritish va yo‘qotishlarning oldini olish.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 border border-white/10">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen shrink-0 mt-0.5">
                      <Scale className="h-4 w-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-white">Ozuqa bo‘lib sotish & muddat nazorati</h5>
                      <p className="mt-0.5 text-xs text-white/70 leading-relaxed">
                        50 kg qopni kg-lab bo‘lib sotish kalkulyatori hamda muddati o‘tayotgan dorilarni oldindan ogohlantirish.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pastki Harakat Tugmasi (B2B) */}
              <div className="mt-8 pt-5 border-t border-white/10">
                <a
                  href={BIZNESGO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black py-3.5 px-6 text-xs sm:text-sm transition shadow-glow-green active:scale-95 group"
                >
                  <Store className="h-4 w-4" />
                  <span>BiznesGO Tizimini Ko‘rish</span>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

/** "Qadriyatlarimiz" (Values) — 3 ta ixcham va soddalashtirilgan karta (karusel o'rniga barqaror grid) */
export const Values: React.FC = () => {
  return (
    <section className="pb-16 sm:pb-24">
      <div className="container-x">
        <div className="rounded-[32px] bg-cream-soft border border-charcoal/10 p-6 sm:p-9 lg:p-12 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 sm:mb-10">
            <div className="max-w-2xl">
              <span className="text-xs font-black uppercase tracking-wider text-agroGreen-800">
                Bizning Tamoyillarimiz
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-charcoal tracking-tight">
                Biz amal qiladigan <span className="text-agroGreen">qadriyatlar:</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-charcoal/65 max-w-sm">
              Har bir xaridda ochiqlik, fermer manfaatini himoya qilish va sifat kafolati.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="flex flex-col justify-between rounded-3xl bg-white p-6 sm:p-7 border border-charcoal/10 shadow-xs hover:border-agroGreen/50 transition duration-200"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-lg bg-agroGreen/15 text-agroGreen-900 px-2 py-0.5 text-xs font-black">
                      {v.num}
                    </span>
                    <h3 className="text-base font-black text-charcoal">{v.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-charcoal/70">
                    {v.text}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-charcoal/5">
                  {v.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-full bg-cream-soft px-2.5 py-1 text-[11px] font-bold text-charcoal/70 border border-charcoal/5"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
