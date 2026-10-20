import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Scale,
  Layers,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Cpu,
  BadgeCheck,
} from 'lucide-react';
import { BIZNESGO_URL } from '../data/content';

/**
 * Zamonaviy agrotexnologiyalar bo'limi:
 * Rasm ishlatilmagan, har bir texnologiya (1:1 kassa sinxronizatsiyasi, ozuqa kalkulyatori,
 * ikki bosqichli narx, seriya raqami va kafolat) chuqur va sodda tushuntirilgan kartochkalar.
 */
const TECH_PILLARS = [
  {
    step: '01',
    icon: RefreshCw,
    tag: '0 soniya kechikish',
    title: 'Real Vaqtli Kassa & Ombor Sinxronizatsiyasi',
    subtitle: 'Do‘kon va bozor o‘rtasida jonli aloqa',
    explanation:
      'Do‘kon kassasida (BiznesGO) shtrix-kod orqali tovar sotilishi bilanoq, uning soni AgrozGO vitrinasidagi ombor qoldig‘idan bir zumda avtomatik kamayadi. Fermer faqat do‘konda amalda mavjud tovarlarnigina ko‘radi.',
    result: 'Soxta e’lonlar va "mahsulot tugab qolgan ekan" degan tushunmovchiliklar 100% bartaraf etiladi.',
    bullets: [
      'Shtrix-kod o‘qitilishi bilan 0 soniyada yangilanish',
      'Bir vaqtning o‘zida kassa va vitrina balansi',
      'Faqat amalda omborda bor tovarlarga buyurtma',
    ],
  },
  {
    step: '02',
    icon: Scale,
    tag: '1 kg dan boshlab',
    title: 'Smart Ozuqa & Yem Bo‘lib Sotish Tizimi',
    subtitle: 'Kilogramm va qop aniq kalkulyatori',
    explanation:
      'Chorvadorga har doim ham 50 kg butun qop kerak emas. Tizim 50 kg qopni ochib, 1 kg, 5 kg yoki 10 kg qilib bo‘lib sotishda ombor qoldig‘i va donalab sotilgan kilogrammlarni kassada adashmasdan yuritadi.',
    result: 'Fermer ortiqcha xarajatsiz kerakli miqdorni oladi, do‘kondor esa tarozida va pulda adashmaydi.',
    bullets: [
      'Qop va kilogramm birliklarining avtomatik hisobi',
      'Kassada grammigacha aniq o‘lchov va narx',
      'Kichik xonadonlar uchun hamyonbop xarid imkoni',
    ],
  },
  {
    step: '03',
    icon: Layers,
    tag: 'Chakana & Ulgurji',
    title: 'Hajmga Mos Ikki Bosqichli Shaffof Narx',
    subtitle: 'Yirik partiyalar uchun avtomatik chegirma',
    explanation:
      'Agro-do‘kon va omborlar o‘z tovarlariga ikki toifadagi narxni kiritadi: 1 dona chakana xarid narxi va minimal partiyadan boshlanadigan ulgurji dilerlik narxi (masalan: 10 qopdan yoki 500 litrdan boshlab).',
    result: 'Katta fermerlar dilerlik narxini darhol ko‘radi, qo‘shimcha vositachilarsiz arzon xarid qiladi.',
    bullets: [
      'Minimal ulgurji hajmga yetganda avtomatik chegirma',
      'Yashirin komissiyalarsiz 100% ochiq shaffof narxlar',
      'Chakana va ulgurji xaridorlar uchun teng qulaylik',
    ],
  },
  {
    step: '04',
    icon: ShieldCheck,
    tag: 'Rasmiy S/N & Chek',
    title: 'Zavod Seriya Raqami & Kafolat Nazorati',
    subtitle: 'Raqamli fiskal chek va servis kafolati',
    explanation:
      'Motobloklar, motorli purkagichlar va suv nasoslari sotilganda ularning zavod seriya raqami (S/N) kassaga kiritiladi va xaridorga rasmiy kafolat muddati yozilgan POS-chek taqdim etiladi.',
    result: 'Nosozlik yuzaga kelsa, xaridor chek va seriya raqami orqali servis markazida bepul ta’mirlatadi.',
    bullets: [
      'Zavod seriya raqami (S/N) kassa tizimiga ulanadi',
      'POS kassa chekida rasmiy 12+ oy kafolat muddati',
      'Sertifikatlangan ehtiyot qismlar va servis bazasi',
    ],
  },
];

export const Technology: React.FC = () => {
  return (
    <section id="technology" className="py-16 sm:py-24 bg-white/60 border-b border-charcoal/5 scroll-mt-24">
      <div className="container-x">
        {/* Sarlavha Qismi */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-agroGreen/30 bg-agroGreen/15 px-3.5 py-1 text-xs font-black text-agroGreen-800">
              <Cpu className="h-3.5 w-3.5 text-agroGreen-700" />
              Raqamli Agro-Texnologiyalar
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-charcoal leading-[1.12]">
              Zamonaviy agrotexnologiyalar{' '}
              <span className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-agroGreen/20 text-agroGreen-800 align-middle">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>{' '}
              bilan savdo yangi cho‘qqida
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-charcoal/70 leading-relaxed max-w-xl">
              AgrozGO va BiznesGO o‘rtasidagi texnologik zanjir: kassa qoldiqlari, ozuqa kalkulyatori,
              ulgurji narxlar va rasmiy kafolat qanday ishlashi haqida batafsil tushuntirish.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={BIZNESGO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-5 py-2.5 text-xs font-bold text-charcoal hover:bg-forest-dark hover:text-white transition shadow-xs cursor-pointer"
            >
              <span>Kassa tizimini o‘rganish</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* 4 ta Texnologik Karta (RASMSIZ, SOF VA TUSHUNARLI STRUKTURA) */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TECH_PILLARS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative flex flex-col justify-between rounded-3xl bg-cream-soft/70 border border-charcoal/10 p-6 sm:p-7 transition-all duration-300 hover:border-agroGreen/50 hover:bg-white hover:shadow-soft"
              >
                <div>
                  {/* Karta yuqori satri: Raqam, Ikonka va Teg */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-agroGreen/15 text-agroGreen-800 border border-agroGreen/25 group-hover:bg-agroGreen group-hover:text-forest-dark transition-colors">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-xs font-black tracking-widest text-charcoal/40 group-hover:text-agroGreen-800 transition-colors">
                        {item.step}
                      </span>
                    </div>

                    <span className="rounded-full bg-white border border-charcoal/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-charcoal/70 group-hover:border-agroGreen/30 group-hover:text-agroGreen-800 transition">
                      {item.tag}
                    </span>
                  </div>

                  {/* Sarlavha & Quyi sarlavha */}
                  <h3 className="text-base sm:text-lg font-black text-charcoal tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold text-agroGreen-800">
                    {item.subtitle}
                  </p>

                  {/* Asosiy Tushuntirish */}
                  <div className="mt-3.5 pt-3.5 border-t border-charcoal/10">
                    <p className="text-xs text-charcoal/75 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>

                  {/* Natija / Amaliy foyda blokchasi */}
                  <div className="mt-4 rounded-2xl bg-white p-3.5 border border-charcoal/10 group-hover:border-agroGreen/25 transition">
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-agroGreen-800">
                      <BadgeCheck className="h-3.5 w-3.5 text-agroGreen" />
                      <span>AMALIY NATIJA:</span>
                    </div>
                    <p className="mt-1 text-xs text-charcoal/80 leading-relaxed font-medium">
                      {item.result}
                    </p>
                  </div>
                </div>

                {/* 3 ta punktli xususiyatlar ro'yxati */}
                <div className="mt-6 pt-4 border-t border-charcoal/10">
                  <ul className="space-y-2">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-charcoal/70 font-semibold leading-tight">
                        <CheckCircle2 className="h-3.5 w-3.5 text-agroGreen-700 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pastki Xulosa va Bog'lanish Paneli */}
        <div className="mt-10 rounded-2xl bg-forest-dark p-6 sm:p-7 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-agroGreen text-forest-dark font-black shadow-glow-green">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-black text-white">
                Fermer uchun xotirjamlik, do‘kon uchun aniq hisob-kitob
              </h4>
              <p className="mt-0.5 text-xs text-white/70 max-w-2xl leading-relaxed">
                Ushbu texnologiyalar tufayli AgrozGO oddiy e’lonlar taxtasi emas, balki real ombor qoldiqlari, tarozidagi aniqlik va rasmiy kafolat bilan ishlaydigan professional agro-platformadir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href="#products"
              className="w-full md:w-auto text-center rounded-xl bg-agroGreen hover:bg-agroGreen-hover text-forest-dark font-black py-3 px-5 text-xs transition active:scale-95"
            >
              Ekotizimni Ko‘rish
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
