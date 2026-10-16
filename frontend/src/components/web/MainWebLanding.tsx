"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Users,
  Sprout,
  ShieldCheck,
  Sparkles,
  CloudSun,
  Store,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Package,
  Receipt,
  BarChart3,
  BookOpen,
  Award,
  Smartphone,
  Download,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-config";
import TrialRegistrationSection from "./TrialRegistrationSection";

export default function MainWebLanding() {
  const { lang, t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Bazadagi haqiqiy shaffof statistika
  const [stats, setStats] = useState({
    users: 0,
    pharmacies: 0,
    specialists: 0,
    medicines: 0,
    regions: 0,
  });

  useEffect(() => {
    apiFetch("/api/web/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) {
          setStats({
            users: Number(d.users ?? 0),
            pharmacies: Number(d.pharmacies ?? 0),
            specialists: Number(d.specialists ?? 0),
            medicines: Number(d.medicines ?? 0),
            regions: Number(d.regions ?? 0),
          });
        }
      })
      .catch(() => {});
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: lang === "ru"
        ? "Что такое AgrozGO и для кого создана платформа?"
        : lang === "en"
        ? "What is AgrozGO and who is it designed for?"
        : lang === "kk"
        ? "AgrozGO деген не және бұл платформа кімдерге арналған?"
        : lang === "ky"
        ? "AgrozGO деген эмне жана платформа кимдер үчүн жасалган?"
        : lang === "tg"
        ? "AgrozGO чист ва ин платформа барои кӣ сохта шудааст?"
        : "AgrozGO nima va u kimlar uchun mo‘ljallangan?",
      a: lang === "ru"
        ? "AgrozGO — единая агротехнологическая экосистема Узбекистана. Для фермеров создано мобильное приложение с ИИ-диагностикой болезней, агро-погодой и заказом препаратов. Для агроаптек и магазинов — облачная система Agroz Business (касса, склад, учет долгов и онлайн-клиенты)."
        : lang === "en"
        ? "AgrozGO is Uzbekistan's premier agritech ecosystem. Farmers get a mobile app featuring AI plant disease diagnostics, hyperlocal agro-weather, and expert consultations. Agro-pharmacies get Agroz Business ERP (POS, inventory control, debt ledger, and online orders)."
        : lang === "kk"
        ? "AgrozGO — Өзбекстанның бірыңғай агротехнологиялық экожүйесі. Фермерлер үшін ИИ диагностикасы бар мобильді қосымша, ал дүкендер үшін Agroz Business ERP жүйесі ұсынылады."
        : lang === "ky"
        ? "AgrozGO — Өзбекстандын бирдиктүү агротехнологиялык экосистемасы. Дыйкандар үчүн мобилдик тиркеме, ал эми дүкөндөр үчүн Agroz Business ERP тутуму иштейт."
        : lang === "tg"
        ? "AgrozGO — экосистемаи пешқадами агротехнологии Ӯзбекистон мебошад. Барои деҳқонон барномаи мобилӣ ва барои дорухонаҳо Agroz Business ERP пешбинӣ шудааст."
        : "AgrozGO — O‘zbekistondagi zamonaviy agrotexnologik ekotizim. Dehqon va fermerlar uchun 5 soniyada AI kasallik tashxisi va agro ob-havoga ega qulay mobil ilova, agro-dorixonalar uchun esa kassa, omborxona va xavfsiz Qarz daftarini jamlagan Agroz Business ERP tizimi xizmat qiladi.",
    },
    {
      q: lang === "ru"
        ? "Как получить 1 месяц бесплатного тестирования Agroz Business?"
        : lang === "en"
        ? "How do I activate the 1-month free trial for Agroz Business?"
        : lang === "kk"
        ? "Agroz Business жүйесінің 1 айлық тегін сынақ нұсқасын қалай қосуға болады?"
        : lang === "ky"
        ? "Agroz Business тутумунун 1 айлык акысыз сынамык версиясын кантип кошсо болот?"
        : lang === "tg"
        ? "Чӣ тавр метавон версияи озмоишии 1-моҳаи ройгони Agroz Business-ро фаъол кард?"
        : "Agroz Business 1 oylik tekin sinov versiyasini qanday o‘rnatish mumkin?",
      a: lang === "ru"
        ? "Заполните форму «1 месяц бесплатного теста» на этой странице (название магазина, телефон, регион), нажмите подтверждение в Telegram — и вы сразу получите ссылку на личный кабинет. Карта не требуется."
        : lang === "en"
        ? "Fill in the 1-month free trial form on this page (store name, phone, region), confirm in Telegram with 1 tap, and you will instantly receive your personal dashboard link. No credit card required."
        : lang === "kk"
        ? "Осы беттегі сынақ формасын толтырып, Telegram арқылы растаңыз — жеке кабинет сілтемесін бірден аласыз."
        : lang === "ky"
        ? "Ушул баракчадагы форманы толтуруп, Telegram аркылуу тастыктаңыз — дароо кабинетке киресиз."
        : lang === "tg"
        ? "Формаи озмоиширо дар ин саҳифа пур карда, тавассути Telegram тасдиқ кунед — фавран ба кабинет дастрасӣ пайдо мекунед."
        : "Sahifadagi «1 oylik tekin sinov» bo‘limida do‘koningiz nomi, telefon va manzilingizni kiritasiz, Telegram orqali 1 marta tasdiqlaysiz — tizim darhol shaxsiy kabinet havolangizni beradi. Bank kartasi shart emas.",
    },
    {
      q: lang === "ru"
        ? "Как скачать мобильное приложение AgrozGO на iOS и Android?"
        : lang === "en"
        ? "How can I download the AgrozGO mobile app for iOS and Android?"
        : lang === "kk"
        ? "AgrozGO мобильді қосымшасын iOS пен Android-ке қалай жүктеуге болады?"
        : lang === "ky"
        ? "AgrozGO мобилдик тиркемесин iOS жана Android үчүн кантип көчүрсө болот?"
        : lang === "tg"
        ? "Чӣ тавр барномаи мобилии AgrozGO-ро барои iOS ва Android боргирӣ кардан мумкин аст?"
        : "AgrozGO mobil ilovasini iOS va Android uchun qanday yuklab olish mumkin?",
      a: lang === "ru"
        ? "Приложение доступно для загрузки в App Store и Google Play, а также в виде прямого APK-файла. Нажмите кнопку «Скачать приложение» на главной странице для перехода к загрузке."
        : lang === "en"
        ? "The app is available for download on the App Store and Google Play, as well as via direct APK installation. Simply click the 'Download App' buttons in the mobile section."
        : lang === "kk"
        ? "Қосымшаны App Store және Google Play дүкендерінен, сондай-ақ тікелей APK файлы арқылы жүктеп алуға болады."
        : lang === "ky"
        ? "Тиркемени App Store жана Google Play дүкөндөрүнөн же түз APK түрүндө көчүрүп алсаңыз болот."
        : lang === "tg"
        ? "Барномаро аз App Store ва Google Play ё тавассути файли мустақими APK боргирӣ кардан мумкин аст."
        : "Ilova App Store va Google Play do‘konlarida hamda to‘g‘ridan-to‘g‘ri APK fayl ko‘rinishida mavjud. Sahifadagi «Ilovani yuklab olish» bo‘limidan o‘zingizga mos qurilma havolasini tanlang.",
    },
    {
      q: lang === "ru"
        ? "Безопасно ли хранятся данные магазина, кассы и склада?"
        : lang === "en"
        ? "Are store, POS, inventory, and debt ledger records stored securely?"
        : lang === "kk"
        ? "Дүкен, касса, қойма және қарыз дәптерінің деректері қауіпсіз сақтала ма?"
        : lang === "ky"
        ? "Дүкөн, касса, кампа жана карыз китебинин маалыматтары коопсуз сакталабы?"
        : lang === "tg"
        ? "Оё маълумоти мағоза, хазина, анбор ва дафтари қарз бехатар нигоҳ дошта мешавад?"
        : "Agroz Business kassa, ombor va nasiya ma'lumotlari xavfsiz saqlanadimi?",
      a: lang === "ru"
        ? "На 100% безопасно. Ваши данные кассы, остатков склада и расчетов хранятся на зашифрованных облачных серверах. Ни один посторонний магазин не имеет доступа к вашей бухгалтерии."
        : lang === "en"
        ? "100% secure. Your POS sales, inventory records, and customer accounts are encrypted and safely backed up on cloud servers. No outside party ever has access to your accounts."
        : lang === "kk"
        ? "100% қауіпсіз. Кассалық саудаңыз, қойма қалдықтарыңыз бен есептеріңіз шифрланған бұлтты серверлерде сақталады."
        : lang === "ky"
        ? "100% коопсуз. Касса, кампа жана эсептериңиз булут серверлеринде шифрланып сакталат."
        : lang === "tg"
        ? "100% бехатар. Маълумоти хазина, анбор ва дафтари қарз дар серверҳои абрии рамзгузоришуда нигоҳ дошта мешавад."
        : "100% xavfsiz. Kunlik kassa savdolaringiz, ombor qoldiqlari, oylik hisobotlar va mijozlar hisobi shifrlangan bulutli serverda saqlanadi. Qog‘oz daftar kabi yo‘qolmaydi yoki o‘chib ketmaydi. Boshqa hech kim ma'lumotlaringizni ko‘ra olmaydi.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] antialiased selection:bg-amber-200 selection:text-amber-950 font-sans">
      {/* =========================================================================
          1. HERO SECTION (Apple aesthetics, pure corporate presentation)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Chap ustun: Sarlavha, Subtitle, 1 oylik sinov CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3.5 py-1.5 rounded-full">
              <Sparkles size={13} className="text-emerald-700" />
              <span>O‘zbekistondagi zamonaviy agro-ekotizim</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[58px] xl:text-[62px] font-extrabold text-[#191B1F] leading-[1.12] tracking-tight">
              AgrozGO — <br />
              <span className="font-light text-zinc-400">zamonaviy agrotexnologik</span> <br />
              va agro-savdo ekotizimi
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
              Mamlakatimiz bo‘ylab agro-dorixonalar, dehqonlar, agronom va veterinarlarni birlashtiruvchi yagona raqamli platforma. Dehqonlar uchun qulay mobil ilova, do‘konlar uchun xavfsiz ERP biznes boshqaruvi.
            </p>

            {/* Harakat Tugmalari: 1 oylik tekin sinov & Ilovani yuklash */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="#sinov"
                className="inline-flex items-center gap-3 bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-semibold pl-6 pr-2 py-2 rounded-full transition-all shadow-md shadow-black/10 active:scale-95 group"
              >
                <span>1 oylik tekin sinovni o‘rnatish</span>
                <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5 shrink-0">
                  <ArrowRight size={15} strokeWidth={2.5} />
                </span>
              </a>

              <a
                href="#app"
                className="inline-flex items-center justify-center gap-2 bg-[#F4F1EA] hover:bg-[#eae6dc] text-[#191B1F] border border-black/8 text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full transition-all active:scale-95 shadow-2xs"
              >
                <Smartphone size={15} />
                <span>Mobil Ilova</span>
              </a>

              <Link
                href="/hamkorlik?mode=login"
                className="inline-flex items-center justify-center text-xs sm:text-sm font-bold text-zinc-700 hover:text-black py-3.5 px-3 transition"
              >
                <span>Biznes kabinetga kirish</span>
              </Link>
            </div>

            {/* Shaffof Foydalanuvchilar va Platforma Statistikasi */}
            <div className="pt-6 sm:pt-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">
                  {stats.pharmacies > 0 ? `${stats.pharmacies} ta` : "50+"}
                </div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Agro-dorixonalar<br /><span className="text-[10px] text-zinc-400 font-normal">Hamkor tarmoq</span>
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">
                  {stats.specialists > 0 ? `${stats.specialists} nafar` : "24/7"}
                </div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Mutaxassislar<br /><span className="text-[10px] text-zinc-400 font-normal">Agronom & veterinar</span>
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">
                  {stats.users > 0 ? `${stats.users} ta` : "Minglab"}
                </div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Foydalanuvchilar<br /><span className="text-[10px] text-zinc-400 font-normal">Dehqon & fermerlar</span>
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">
                  {stats.regions > 0 ? `${stats.regions} ta` : "Respublika"}
                </div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Viloyatlar<br /><span className="text-[10px] text-zinc-400 font-normal">Qamrov hududi</span>
                </div>
              </div>
            </div>
          </div>

          {/* O'ng ustun: Visual mockups */}
          <div className="lg:col-span-5 relative flex justify-end">
            <div className="relative w-full aspect-4/5 sm:aspect-square max-h-[520px] rounded-[36px] overflow-hidden shadow-xl border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
                alt="Golden wheat harvest"
                loading="lazy"
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute bottom-5 right-5 left-5 bg-[#1E2024]/95 backdrop-blur-md text-white p-5 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                      AgrozGO Platformasi
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">
                      Dehqon, dorixona va mutaxassislar bir joyda
                    </h3>
                  </div>
                  <a
                    href="#sinov"
                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition"
                    aria-label="Sinovni o‘rnatish"
                  >
                    <ArrowUpRight size={15} />
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>1 oy bepul sinov</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    <span>Bulutli ERP kassa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SECTION: BIZ NIMA XIZMAT KO‘RSATAMIZ? (EKOTIZIM IMKONIYATLARI)
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3.5 py-1.5 rounded-full">
            <Sparkles size={13} className="text-emerald-700" />
            <span>Xizmatlarimiz</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight">
            Biz nima xizmat ko‘rsatamiz?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            AgrozGO qishloq xo‘jaligining barcha ishtirokchilarini raqamlashtiradi: fermerlar uchun qulay vositalar, agro-dorixonalar uchun boshqaruv tizimi va mutaxassislar uchun ish o‘rni.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
          {/* 1. AI Diagnostika */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-purple-300 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <Sparkles size={22} />
              </div>
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">
                5 Soniyada Tahlil
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                AI Agro-Diagnostika
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Kasal barg, meva yoki hayvon alomatini suratga olib yuklang. Sun’iy intellekt zudlik bilan kasallik nomi va davolash usulini aniqlaydi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-purple-700">
              24/7 Avtomatlashtirilgan
            </div>
          </div>

          {/* 2. Hududiy Agro Ob-havo */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <CloudSun size={22} />
              </div>
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                Hududiy Tavsiyalar
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Agro Ob-havo & Purkash
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Shamol tezligi, tuproq harorati, namlik va sovuq urish xavfi haqida ogohlantirishlar hamda dori purkash uchun eng qulay soatlar tavsiyasi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-amber-700">
              Aniq soatlar bo‘yicha
            </div>
          </div>

          {/* 3. Agroz Business ERP */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Store size={22} />
              </div>
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                Dorixonalar Uchun ERP
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Kassa, Ombor & Nasiya
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Kunlik kassa savdolari (POS), tovarlar ombori, oylik moliyaviy hisobotlar va xavfsiz shifrlangan Qarz daftari bitta bulutli tizimda.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-emerald-700">
              1 oy bepul sinov
            </div>
          </div>

          {/* 4. Mutaxassis chaqirish */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-blue-300 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Users size={22} />
              </div>
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                Dalaga Chaqiruv
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Agronom & Veterinar Tarmog‘i
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Fermerlar o‘z hududidagi malakali agronom va veterinarlarni to‘g‘ridan-to‘g‘ri dalaga chaqirishlari va professional maslahat olishlari mumkin.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-blue-700">
              Malakali mutaxassislar
            </div>
          </div>

          {/* 5. AgrozGO Mobil Ilovasi */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-zinc-300 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center mb-4">
                <Smartphone size={22} />
              </div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1">
                iOS & Android
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Dehqonning Mobil Yordamchisi
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Barcha agro-xizmatlarni birlashtirgan intuitiv mobil ilova. Dala sharoitida ham tez va qulay ishlaydi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-zinc-700">
              Bepul yuklab olish
            </div>
          </div>

          {/* 6. 100% Ma'lumotlar xavfsizligi */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-zinc-300 hover:shadow-lg transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <ShieldCheck size={22} />
              </div>
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                Shifrlangan Bulut
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Xavfsiz Qarz va Hisobotlar
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Do‘koningiz ma’lumotlari, kassa va qarzlar zamonaviy shifrlash protokollari bilan himoyalangan. Hech kim sizning hisobingizni ko‘ra olmaydi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-bold text-amber-700">
              100% Maxfiylik kafolati
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SECTION: DORIXONA EGALARI UCHUN 1 OYLIK TEKIN SINOV VERSINI O‘RNATISH
          ========================================================================= */}
      <section id="sinov" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <TrialRegistrationSection />
      </section>

      {/* =========================================================================
          4. SECTION: AGROZGO MOBIL ILOVASI (iOS & Android)
          ========================================================================= */}
      <section id="app" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
              <Smartphone size={13} className="text-emerald-700" />
              <span>Dehqon va Fermerlar Uchun</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight">
              AgrozGO Mobil Ilovasi
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Barcha dala xizmatlari sizning cho‘ntagingizda. iOS va Android qurilmalari uchun qulay, tezkor va ishonchli agrotexnologik yordamchi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="#app-download"
              className="inline-flex items-center gap-2 bg-[#191B1F] hover:bg-black text-white text-xs font-bold px-5 py-3 rounded-full transition shadow-xs"
            >
              <Smartphone size={14} />
              <span>Ilovani yuklab olish</span>
            </a>
          </div>
        </div>

        {/* Yuklab Olish Tugmalari Bloki */}
        <div id="app-download" className="bg-[#FAF8F3] rounded-3xl p-6 sm:p-10 border border-black/5 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#191B1F]">
              Ilovani hoziroq o‘rnating
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-xl">
              AgrozGO mobil ilovasi barcha zamonaviy iPhone va Android smartfonlarida tez va barqaror ishlaydi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* App Store */}
            <div className="flex items-center gap-3 bg-[#191B1F] text-white px-5 py-3 rounded-2xl cursor-pointer hover:bg-black transition active:scale-95 shadow-sm">
              <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 0.93-2.84-.9.04-1.99.6-2.63 1.35-.57.65-.97 1.71-.84 2.73.99.08 2.02-.51 2.54-1.24z"/>
              </svg>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium leading-none">Yuklab oling</div>
                <div className="text-xs font-bold leading-tight mt-0.5">App Store</div>
              </div>
            </div>

            {/* Google Play */}
            <div className="flex items-center gap-3 bg-[#191B1F] text-white px-5 py-3 rounded-2xl cursor-pointer hover:bg-black transition active:scale-95 shadow-sm">
              <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a2.01 2.01 0 0 1-.61-.926V2.74c0-.348.225-.67.609-.926zm11.235 11.238L4.856 3.064 17.18 10.18a1.99 1.99 0 0 1 0 3.64l-2.336 1.354-9.988 9.988 9.988-9.988z"/>
              </svg>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium leading-none">Yuklab oling</div>
                <div className="text-xs font-bold leading-tight mt-0.5">Google Play</div>
              </div>
            </div>

            {/* Direct APK */}
            <div className="flex items-center gap-2 border border-black/10 bg-white text-zinc-800 px-4 py-3 rounded-2xl cursor-pointer hover:bg-zinc-50 transition active:scale-95 text-xs font-bold">
              <Download size={15} />
              <span>APK yuklash</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SECTION: AGROZ BUSINESS (ERP TIZIMI - DORIXONALAR UCHUN)
          ========================================================================= */}
      <section id="business" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 border border-amber-200 px-3 py-1 rounded-full">
              <Store size={13} className="text-amber-800" />
              <span>Agro-dorixonalar & Do‘konlar Uchun</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight">
              Agroz Business — To‘liq Boshqaruv ERP
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              Qog‘oz daftarlar, yo‘qolgan qarzlar va chalkash hisob-kitobdan butunlay xalos bo‘ling. Savdo, ombor va nasiyani yagona xavfsiz tizimda yuritish.
            </p>
          </div>

          <a
            href="#sinov"
            className="inline-flex items-center gap-2 bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-full transition shadow-sm shrink-0"
          >
            <span>1 oylik sinovni o‘rnatish</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* 4 ta Asosiy Biznes Vosita */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs text-left flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Receipt size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Kunlik Kassa (POS)
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Har bir savdoni sekundlar ichida qayd eting. Naqd pul, plastik karta va nasiya savdolarining aniq tushum balansi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-semibold text-emerald-700">
              Avtomatik kunlik xulosa
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs text-left flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                <Package size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Omborxona & Qoldiqlar
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Dori vositalarining kirim va sotish narxlari, qoldiq miqdori va yaroqlilik muddatlari o‘tishidan oldin ogohlantirish.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-semibold text-blue-700">
              Kam qolgan dori signali
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs text-left flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                <BarChart3 size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Oylik Hisobot & Foyda
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Oylik umumiy savdo aylanmasi, xarajatlar va haqiqiy sof foyda hisobi. Qaysi preparatlar eng ko‘p daromad keltirayotganini ko‘ring.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-semibold text-amber-700">
              Moliyaviy shaffoflik
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs text-left flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                <BookOpen size={22} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-2">
                Xavfsiz Qarz Daftari
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Mijozlarning nasiya hisoblari shifrlangan bulutda saqlanadi. Qog‘oz daftar kabi yo‘qolmaydi, yirtilmaydi va doim yoningizda.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] font-semibold text-purple-700">
              100% Shifrlangan & Maxfiy
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SECTION: BIZNES TARIFLAR
          ========================================================================= */}
      <section id="tariffs" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            Shaffof Narxlar
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight mt-3">
            Agroz Business <span className="text-emerald-700">Tariflari</span>
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-600">
            Dastlabki 1 oy mutlaqo bepul (0 so‘m). O‘zingizga mos tarifni tanlang va tizimga ulaning.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* BETA Start */}
          <div className="rounded-3xl border-2 border-emerald-600 bg-white p-7 shadow-xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-6 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full">
              Tavsiya etiladi
            </div>

            <div>
              <div className="text-lg font-bold text-[#191B1F]">1 Oylik Bepul Sinov</div>
              <p className="text-xs text-zinc-500 mt-1">Barcha agro-dorixonalar uchun</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-emerald-700">0 so‘m</span>
                <span className="text-sm font-semibold text-zinc-500">/ 30 kun bepul</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-700 font-medium text-left">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Kunlik Kassa va savdo nazorati (POS)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Omborxona qoldiqlari va dori muddatlari</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Oylik moliyaviy hisobotlar va sof foyda</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Xavfsiz shifrlangan qarz daftari (Nasiya)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Telegram orqali 1 bosishda ulanish</span>
                </li>
              </ul>
            </div>

            <a
              href="#sinov"
              className="mt-8 w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 text-center transition shadow-md shadow-emerald-600/20 active:scale-95 block"
            >
              1 oylik sinovni o‘rnatish (0 so‘m)
            </a>
          </div>

          {/* Standart */}
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition">
            <div>
              <div className="text-lg font-bold text-[#191B1F]">Standart</div>
              <p className="text-xs text-zinc-500 mt-1">Sinov davridan so‘ng davom ettirish</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#191B1F]">149 000 so‘m</span>
                <span className="text-sm font-semibold text-zinc-500">/ oy</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-emerald-700">
                1-oy 0 so‘m
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-600 text-left">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Barcha sinov imkoniyatlari to‘liq saqlanadi</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Cheksiz dori va tovarlar kiritish</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Kengaytirilgan oylik tahliliy hisobotlar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Telegram orqali tezkor qo‘llab-quvvatlash</span>
                </li>
              </ul>
            </div>

            <a
              href="#sinov"
              className="mt-8 w-full rounded-full bg-[#191B1F] hover:bg-black text-white font-bold text-xs py-3.5 text-center transition shadow-xs active:scale-95 block"
            >
              Sinovdan boshlash
            </a>
          </div>

          {/* Tarmoq */}
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition">
            <div>
              <div className="text-lg font-bold text-[#191B1F]">Tarmoq</div>
              <p className="text-xs text-zinc-500 mt-1">Ko‘p filialli agro-dorixonalar uchun</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#191B1F]">Kelishilgan narx</span>
                <span className="text-sm font-semibold text-zinc-500">/ individual</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-600 text-left">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Bir nechta filiallar va xodimlar nazorati</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Shaxsiy menejer va maxsus sozlamalar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Maxsus tahliliy hisobotlar</span>
                </li>
              </ul>
            </div>

            <a
              href="tel:+998908383772"
              className="mt-8 w-full rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-3.5 text-center transition active:scale-95 block"
            >
              Bog‘lanish (+998 90 838 37 72)
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. SECTION: ALOQA & FAQ
          ========================================================================= */}
      <section id="aloqa" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            Aloqa & Qo‘llab-quvvatlash
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight mt-3">
            Biz bilan bog‘laning
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
            Ilovadan foydalanish, do‘konni ulash yoki 1 oylik sinov bo‘yicha savollaringizga yordam beramiz
          </p>
        </div>

        {/* 4 ta Aloqa Kartochkasi */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14 text-left">
          {/* 1. Telefon */}
          <a
            href="tel:+998908383772"
            className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Phone size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">Aloqa markazi</div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1">
                +998 90 838 37 72
              </div>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-3 flex items-center gap-1">
              <span>Qo‘ng‘iroq qilish</span>
              <ArrowRight size={12} />
            </div>
          </a>

          {/* 2. Telegram */}
          <a
            href="https://t.me/agroz_support"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <MessageSquare size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">Telegram yordam</div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1">
                @agroz_support
              </div>
            </div>
            <div className="text-[11px] font-bold text-blue-700 mt-3 flex items-center gap-1">
              <span>Xabar yozish</span>
              <ArrowRight size={12} />
            </div>
          </a>

          {/* 3. Email */}
          <a
            href="mailto:support@agroz.uz"
            className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Mail size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">Elektron pochta</div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1 truncate">
                support@agroz.uz
              </div>
            </div>
            <div className="text-[11px] font-bold text-amber-800 mt-3 flex items-center gap-1">
              <span>Xat yuborish</span>
              <ArrowRight size={12} />
            </div>
          </a>

          {/* 4. Ish vaqti */}
          <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center mb-3">
                <Clock size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">Ish tartibi</div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1">
                08:00 — 20:00
              </div>
            </div>
            <div className="text-[11px] font-bold text-zinc-500 mt-3">
              AI tashxis: 24/7
            </div>
          </div>
        </div>

        {/* FAQ qismi */}
        <div className="text-center mb-8 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            Ko‘p beriladigan savollar
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight mt-2">
            Tez-tez so‘raladigan savollarga javoblar
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-black/5 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => toggleFaq(i)}
                className="w-full p-5 text-left font-bold text-xs sm:text-sm text-[#191B1F] flex items-center justify-between gap-4 hover:bg-zinc-50 transition"
                aria-expanded={openFaq === i}
                aria-controls={`faq-item-${i}`}
              >
                <span>{f.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-zinc-400 transition-transform shrink-0 ${
                    openFaq === i ? "rotate-180 text-emerald-700" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div id={`faq-item-${i}`} className="px-5 pb-5 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          8. FINAL CALL TO ACTION (CTA)
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[36px] sm:rounded-[48px] bg-[#191B1F] text-white p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              AgrozGO bilan agrobiznesingizni yangi bosqichga olib chiqing
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              1 oylik tekin sinov versiyasini o‘rnating yoki fermerlar uchun AgrozGO mobil ilovasini yuklab oling.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="#sinov"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm transition shadow-lg active:scale-95"
              >
                1 oylik sinovni o‘rnatish (0 so‘m)
              </a>
              <Link
                href="/hamkorlik?mode=login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition"
              >
                Biznes kabinetga kirish
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

