"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronDown,
  ShoppingCart,
  Star,
  MapPin,
  Users,
  Sprout,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function MainWebLanding() {
  const { lang, t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const sampleProducts = [
    {
      id: "bento-max",
      name: "BENTO MAX (5 kg)",
      category: "Premiks & Ozuqa",
      type: "animal",
      desc: "Bio-mineral ozuqa qo‘shimchasi va bentonit premiks. Qoramol va qo‘ylar uchun immunitet va o‘sishni rag‘batlantiradi.",
      price: "45 000 so‘m",
      store: "Aziya Agro Kimyo",
      location: "Toshkent",
      badge: "Popular",
      badgeIcon: Sparkles,
      badgeColor: "bg-amber-100/90 text-amber-900 border border-amber-200",
      image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "ridomil-gold",
      name: "Ridomil Gold MZ 68 WG",
      category: "Fungitsid",
      type: "crop",
      desc: "Pomidor, kartoshka va uzum fitoftorasi va peronosporoziga qarshi yuqori samarali tizimli himoya preparati.",
      price: "120 000 so‘m",
      store: "Agro Kimyo Savdo",
      location: "Farg‘ona",
      badge: "Crop Protection",
      badgeIcon: Sprout,
      badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
      image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "gumifos",
      name: "Biostimulyator Gumifos 1L",
      category: "Organik o‘g‘it",
      type: "crop",
      desc: "Ildiz tizimini rivojlantiruvchi va hosildorlikni 25-30% ga oshiruvchi tabiiy kaliy gumati va mikroelementlar.",
      price: "65 000 so‘m",
      store: "Agro Servis MCHJ",
      location: "Samarqand",
      badge: "High Yield",
      badgeIcon: TrendingUp,
      badgeColor: "bg-blue-100/90 text-blue-900 border border-blue-200",
      image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "enrofloksatsin",
      name: "Enrofloksatsin 10% (100ml)",
      category: "Veterinariya",
      type: "animal",
      desc: "Qoramol, qo‘y va parrandalar nafas va oshqozon-ichak infeksiyalarini davolash uchun antibakterial vosita.",
      price: "38 000 so‘m",
      store: "Vetta Farm Dorixona",
      location: "Andijon",
      badge: "Veterinary Care",
      badgeIcon: ShieldCheck,
      badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
      image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const filteredProducts =
    activeCategory === "all"
      ? sampleProducts
      : sampleProducts.filter((p) => p.type === activeCategory);

  const sampleSpecialists = [
    {
      name: "Jamshid Qodirov",
      role: "Bosh agronom-konsultant",
      specialty: "Bog‘dorchilik, tomchilatib sug‘orish va issiqxona ekinlari",
      exp: "12 yillik tajriba",
      rating: "4.9",
      reviews: "128",
      region: "Toshkent viloyati",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
    },
    {
      name: "Dr. Sarvar Aliyev",
      role: "Katta veterinar shifokor",
      specialty: "Qoramol kasalliklari profilaktikasi, emlash va naslchilik",
      exp: "15 yillik tajriba",
      rating: "5.0",
      reviews: "94",
      region: "Samarqand viloyati",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
    },
    {
      name: "Nodira Karimova",
      role: "O‘simliklar himoyasi mutaxassisi",
      specialty: "Biologik zararkunandalarga qarshi kurash va tuproq tahlili",
      exp: "8 yillik tajriba",
      rating: "4.8",
      reviews: "86",
      region: "Farg‘ona vodiysi",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
    },
  ];

  const faqs = [
    {
      q: lang === "ru"
        ? "Действительно ли Agroz Business бесплатен?"
        : lang === "en"
        ? "Is Agroz Business really free of charge?"
        : lang === "kk"
        ? "Agroz Business жүйесі шынымен тегін бе?"
        : lang === "ky"
        ? "Agroz Business тутуму чын эле акысызбы?"
        : lang === "tg"
        ? "Оё истифодаи Agroz Business дар ҳақиқат ройгон аст?"
        : "Agroz Business tizimidan foydalanish haqiqatan ham bepulmi?",
      a: lang === "ru"
        ? "Да, сейчас платформа находится в периоде БЕТА-тестирования. Первые 50 партнерских агроаптек получают долговую книгу, кассу, склад и онлайн-заказы бесплатно (0 сум)."
        : lang === "en"
        ? "Yes, the platform is currently in BETA. The first 50 partner agro-pharmacies receive the debt ledger, POS, warehouse control, and online orders completely free ($0)."
        : lang === "kk"
        ? "Иә, қазір платформа БЕТА сынақ кезеңінде. Алғашқы 50 серіктес дүкен қарыз дәптері, касса, қойма және онлайн тапсырыстарды мүлдем тегін пайдаланады."
        : lang === "ky"
        ? "Ооба, азыр платформа БЕТА сыноо мезгилинде. Алгачкы 50 өнөктөш дүкөн карыз китебин, касса жана кампаны акысыз пайдалана алышат."
        : lang === "tg"
        ? "Бале, ҳоло платформа дар давраи озмоишии БЕТА қарор дорад. 50 мағозаи аввалини агро дафтари қарз, хазина ва анборро комилан ройгон дастрас мекунанд."
        : "Ha, hozirda platforma BETA sinov davrida. Dastlabki 50 ta hamkor dorixona va agro-do‘kon uchun Qarz daftari, kassa, ombor va onlayn buyurtmalar mutlaqo bepul (0 so‘m) taqdim etiladi.",
    },
    {
      q: lang === "ru"
        ? "Безопасно ли хранятся данные долговой книги?"
        : lang === "en"
        ? "Are debt ledger records stored securely?"
        : lang === "kk"
        ? "Қарыз дәптерінің деректері қауіпсіз сақтала ма?"
        : lang === "ky"
        ? "Карыз китебинин маалыматтары коопсуз сакталабы?"
        : lang === "tg"
        ? "Оё маълумоти дафтари қарз бехатар нигоҳ дошта мешавад?"
        : "Qarz daftari ma'lumotlari xavfsiz saqlanadimi?",
      a: lang === "ru"
        ? "На 100% безопасно. Ваши данные хранятся на зашифрованных облачных серверах. Они не потеряются как бумажная тетрадь. Ни один другой магазин не имеет доступа к вашей клиентуре."
        : lang === "en"
        ? "100% secure. Your data is encrypted and backed up in cloud servers. It won't get lost or damaged like paper notebooks. No other store can ever access your debt ledger."
        : lang === "kk"
        ? "100% қауіпсіз. Деректеріңіз шифрланған бұлтты серверлерде сақталады. Қағаз дәптердей жоғалмайды, басқа ешбір дүкен сіздің есептеріңізді көре алмайды."
        : lang === "ky"
        ? "100% коопсуз. Маалыматтарыңыз булут серверлеринде шифрланып сакталат. Эч бир башка дүкөн сиздин эсептериңизди көрө албайт."
        : lang === "tg"
        ? "100% бехатар. Маълумоти шумо дар серверҳои абрии рамзгузоришуда нигоҳ дошта мешавад ва ба дигарон дастрас нест."
        : "100% xavfsiz. Ma'lumotlaringiz shifrlangan bulutli serverda saqlanadi. Qog‘oz daftar kabi yo‘qolmaydi, yirtilmaydi yoki suv tegib o‘chib ketmaydi. Boshqa hech bir do‘kon sizning qarzdorlaringiz yoki aylanmangizni aslo ko‘ra olmaydi.",
    },
    {
      q: lang === "ru"
        ? "Сколько времени занимает подключение магазина?"
        : lang === "en"
        ? "How long does it take to connect a store?"
        : lang === "kk"
        ? "Дүкенді қосу қанша уақыт алады?"
        : lang === "ky"
        ? "Дүкөндү туташтыруу канча убакытты алат?"
        : lang === "tg"
        ? "Пайваст кардани мағоза чӣ қадар вақт мегирад?"
        : "Do‘konimni ulash uchun qancha vaqt ketadi?",
      a: lang === "ru"
        ? "Всего 1 минуту! На странице «Подключить магазин» введите название и телефон, подтвердите через Telegram — и личный бизнес-кабинет готов к работе."
        : lang === "en"
        ? "Just 1 minute! On the 'Connect store' page, enter your business name and phone, confirm with Telegram, and your business cabinet is immediately activated."
        : lang === "kk"
        ? "Бар болғаны 1 минут! «Дүкенді қосу» бетінде атау мен телефонды енгізіп, Telegram арқылы растасаңыз, жеке кабинет бірден іске қосылады."
        : lang === "ky"
        ? "Болгону 1 мүнөт! Аталышын жана телефонду киргизип, Telegram аркылуу тастыктасаңыз, кабинет дароо ишке кирет."
        : lang === "tg"
        ? "Ҳамагӣ 1 дақиқа! Номи мағоза ва рақами худро ворид карда, тавассути Telegram тасдиқ кунед — кабинет фавран омода мешавад."
        : "Atigi 1 daqiqa! «Do‘konni ulash» sahifasida nomingiz va telefoningizni kiritib, Telegram orqali bitta tasdiqlash tugmasini bossangiz bas — shaxsiy biznes kabinetingiz darhol ishga tushadi.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] antialiased selection:bg-amber-200 selection:text-amber-950 font-sans">
      {/* =========================================================================
          1. HERO SECTION (Apple aesthetics + Agroton template)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Chap ustun: Asosiy Sarlavha, Paragraf, Qora Pill CTA, 3 ta Metrika kartasi */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-extrabold text-[#191B1F] leading-[1.08] tracking-tight">
              {t.hero.title_p1} <br />
              <span className="font-light text-zinc-500">{t.hero.title_p2}</span> <br />
              {t.hero.title_p3}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
              {t.hero.desc}
            </p>

            {/* Qora Pill Tugma (Apple style vector arrow button) */}
            <div className="pt-2">
              <Link
                href="/hamkorlik"
                className="inline-flex items-center gap-3 bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-semibold pl-6 pr-2 py-2 rounded-full transition shadow-lg shadow-black/10 active:scale-95 group"
              >
                <span>{t.hero.contact_btn}</span>
                <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </div>

            {/* Pastki Chap: 3 ta Metrika kartochkasi (Apple clean rounded cards) */}
            <div className="pt-6 sm:pt-10 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="bg-[#F4F1EA] rounded-2xl p-4 sm:p-5 border border-black/5 min-w-[130px] sm:min-w-[145px]">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#191B1F] tracking-tight">100%</div>
                <div className="text-[11px] font-medium text-zinc-500 mt-1 leading-snug whitespace-pre-line">
                  {t.hero.stat_quality}
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-4 sm:p-5 border border-black/5 min-w-[130px] sm:min-w-[145px]">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#191B1F] tracking-tight">50+</div>
                <div className="text-[11px] font-medium text-zinc-500 mt-1 leading-snug whitespace-pre-line">
                  {t.hero.stat_tech}
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-4 sm:p-5 border border-black/5 min-w-[130px] sm:min-w-[145px]">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#191B1F] tracking-tight">10+</div>
                <div className="text-[11px] font-medium text-zinc-500 mt-1 leading-snug whitespace-pre-line">
                  {t.hero.stat_experience}
                </div>
              </div>
            </div>
          </div>

          {/* O'ng ustun: Bug'doyzor foni va pastki o'ngdagi suzuvchi qora karta */}
          <div className="lg:col-span-5 relative flex justify-end">
            <div className="relative w-full aspect-4/5 sm:aspect-square max-h-[520px] rounded-[36px] overflow-hidden shadow-xl border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
                alt="Golden wheat harvest"
                loading="lazy"
                className="w-full h-full object-cover"
              />

              {/* Gradient qorong'ulik */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Pastki o'ng suzuvchi qora karta */}
              <div className="absolute bottom-5 right-5 left-5 sm:left-auto sm:w-72 bg-[#1E2024]/95 backdrop-blur-md text-white p-4 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-xs font-semibold leading-snug text-zinc-200">
                    {t.hero.leader_card_text}
                  </p>
                  <Link
                    href="/dorilar"
                    className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition"
                    aria-label="Katalog"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                {/* Ichki kichik foto */}
                <div className="w-full h-24 rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=400&q=80"
                    alt="Agro silos and field"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SECTION 2: DEVELOPMENT PATH
          ========================================================================= */}
      <section id="about" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          {/* Chap kichik foto */}
          <div className="md:col-span-3 hidden md:flex justify-start">
            <div className="w-40 h-28 rounded-2xl overflow-hidden shadow-md border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=400&q=80"
                alt="Agro field view"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* O'rtadagi sarlavha va matn */}
          <div className="md:col-span-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{t.story1.tag}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight leading-snug">
              {t.story1.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl mx-auto">
              {t.story1.p1}
            </p>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl mx-auto">
              {t.story1.p2}
            </p>
          </div>

          {/* O'ng kichik foto */}
          <div className="md:col-span-3 hidden md:flex justify-end">
            <div className="w-40 h-28 rounded-2xl overflow-hidden shadow-md border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=400&q=80"
                alt="Wheat ears close-up"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SECTION 3: DARK BENTO BOX
          ========================================================================= */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#1E2024] text-white rounded-[36px] sm:rounded-[48px] p-6 sm:p-10 lg:p-12 shadow-2xl border border-white/10">
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Chap tomon: Sales by locations & 3 Stat Pills */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {t.bento.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{t.bento.subtitle}</p>
              </div>

              {/* Viloyatlar bo'yicha sariq chiziqlar */}
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_tashkent}</span>
                    <span className="text-amber-400">85%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_fergana}</span>
                    <span className="text-amber-400">72%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[72%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_samarkand}</span>
                    <span className="text-amber-400">64%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[64%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_bukhara}</span>
                    <span className="text-amber-400">55%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[55%]" />
                  </div>
                </div>
              </div>

              {/* 3 ta pastki oq/krem pill statslar: 2,500,000, 1,800,000, 500,000 */}
              <div className="grid grid-cols-3 gap-2.5 pt-4">
                <div className="bg-[#F8F6F0] text-[#191B1F] p-3 rounded-2xl text-center">
                  <div className="text-xs sm:text-sm font-black">2,500,000</div>
                  <div className="text-[9px] text-zinc-600 font-medium mt-0.5">{t.bento.stat_prod}</div>
                </div>
                <div className="bg-[#F8F6F0] text-[#191B1F] p-3 rounded-2xl text-center">
                  <div className="text-xs sm:text-sm font-black">1,800,000</div>
                  <div className="text-[9px] text-zinc-600 font-medium mt-0.5">{t.bento.stat_export}</div>
                </div>
                <div className="bg-[#F8F6F0] text-[#191B1F] p-3 rounded-2xl text-center">
                  <div className="text-xs sm:text-sm font-black">500,000</div>
                  <div className="text-[9px] text-zinc-600 font-medium mt-0.5">{t.bento.stat_yield}</div>
                </div>
              </div>
            </div>

            {/* O'ng tomon: Oq grafik kartasi va Sariq "Join Our team" kartasi */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              {/* Oq karta: Analysis of production and crop distribution */}
              <div className="bg-white text-[#191B1F] rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="mb-4">
                  <h4 className="text-base font-extrabold text-[#191B1F]">
                    {t.bento.chart_title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {t.bento.chart_subtitle}
                  </p>
                </div>

                {/* 3 ta Kichik Metrika: 63%, 12%, 30% */}
                <div className="grid grid-cols-3 gap-3 pb-5 border-b border-zinc-100">
                  <div className="border-l-2 border-amber-400 pl-3">
                    <div className="text-[10px] text-zinc-500 leading-tight">{t.bento.metric_domestic}</div>
                    <div className="text-lg font-black text-[#191B1F] mt-1">63%</div>
                  </div>
                  <div className="border-l-2 border-zinc-800 pl-3">
                    <div className="text-[10px] text-zinc-500 leading-tight">{t.bento.metric_processing}</div>
                    <div className="text-lg font-black text-[#191B1F] mt-1">12%</div>
                  </div>
                  <div className="border-l-2 border-orange-500 pl-3">
                    <div className="text-[10px] text-zinc-500 leading-tight">{t.bento.metric_export}</div>
                    <div className="text-lg font-black text-[#191B1F] mt-1">30%</div>
                  </div>
                </div>

                {/* 12 oylik Ustunli grafik */}
                <div className="pt-6">
                  <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 h-36 border-b border-zinc-100 pb-2">
                    {[
                      { m: t.bento.months[0], h1: 25, h2: 45, h3: 20 },
                      { m: t.bento.months[1], h1: 30, h2: 50, h3: 25 },
                      { m: t.bento.months[2], h1: 45, h2: 65, h3: 35 },
                      { m: t.bento.months[3], h1: 60, h2: 80, h3: 45 },
                      { m: t.bento.months[4], h1: 75, h2: 95, h3: 50 },
                      { m: t.bento.months[5], h1: 85, h2: 100, h3: 60 },
                      { m: t.bento.months[6], h1: 80, h2: 90, h3: 55 },
                      { m: t.bento.months[7], h1: 70, h2: 85, h3: 50 },
                      { m: t.bento.months[8], h1: 65, h2: 75, h3: 40 },
                      { m: t.bento.months[9], h1: 50, h2: 65, h3: 35 },
                      { m: t.bento.months[10], h1: 40, h2: 55, h3: 30 },
                      { m: t.bento.months[11], h1: 30, h2: 45, h3: 20 },
                    ].map((col, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="w-full flex flex-col items-center gap-0.5">
                          <div
                            style={{ height: `${col.h1 * 0.35}px` }}
                            className="w-full bg-amber-400 rounded-t-xs"
                          />
                          <div
                            style={{ height: `${col.h2 * 0.55}px` }}
                            className="w-full bg-[#1E2024]"
                          />
                          <div
                            style={{ height: `${col.h3 * 0.35}px` }}
                            className="w-full bg-orange-400 rounded-b-xs"
                          />
                        </div>
                        <span className="text-[9px] text-zinc-400 mt-2">{col.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sariq Karta: "Join Our team" */}
              <div className="bg-[#FDF2D5] text-[#191B1F] rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-md">
                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-lg font-extrabold text-[#191B1F]">
                    {t.bento.join_title}
                  </h4>
                  <p className="text-xs text-zinc-700 max-w-sm leading-relaxed">
                    {t.bento.join_desc}
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/hamkorlik"
                      className="inline-flex items-center gap-2 bg-[#191B1F] hover:bg-black text-white text-xs font-bold pl-5 pr-2 py-2 rounded-full transition active:scale-95 group"
                    >
                      <span>{t.bento.join_btn}</span>
                      <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <ArrowUpRight size={13} />
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Overlapping team avatars */}
                <div className="flex items-center -space-x-3 shrink-0">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80",
                  ].map((img, i) => (
                    <div
                      key={i}
                      className="w-11 h-11 rounded-full border-2 border-[#FDF2D5] overflow-hidden shadow-sm"
                    >
                      <img src={img} alt="Team member" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION 4: FULL-BLEED PHOTOGRAPHIC BANNER
          ========================================================================= */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-[36px] sm:rounded-[48px] overflow-hidden shadow-2xl min-h-[460px] sm:min-h-[540px] flex flex-col justify-between p-6 sm:p-12 lg:p-14">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1800&q=80"
            alt="Farmer in the golden wheat field"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover brightness-75"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

          {/* Yuqori/O'rtadagi Sarlavha */}
          <div className="relative z-10 max-w-2xl mx-auto text-center pt-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-snug">
              {t.banner.statement}
            </h2>
          </div>

          {/* Pastki Qism: 3 ta doira nishon va 3 ta medal */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 pt-12">
            {/* Chap: Apple vector agro-badges */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E5B54F]/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Sprout size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E5B54F]/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <ShieldCheck size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E5B54F]/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Award size={20} />
              </div>
            </div>

            {/* O'ng: 3 ta medal kartasi */}
            <div className="flex items-center gap-3">
              <div className="bg-[#FAF6EC] text-[#191B1F] rounded-2xl px-5 py-3 text-center min-w-[90px] shadow-lg">
                <div className="text-lg sm:text-xl font-black text-amber-700">{t.banner.badge1_title}</div>
                <div className="text-[9px] font-semibold text-zinc-500 mt-0.5">{t.banner.badge1_desc}</div>
              </div>

              <div className="bg-[#FAF6EC] text-[#191B1F] rounded-2xl px-5 py-3 text-center min-w-[90px] shadow-lg">
                <div className="text-lg sm:text-xl font-black text-amber-700">{t.banner.badge2_title}</div>
                <div className="text-[9px] font-semibold text-zinc-500 mt-0.5">{t.banner.badge2_desc}</div>
              </div>

              <div className="bg-[#FAF6EC] text-[#191B1F] rounded-2xl px-5 py-3 text-center min-w-[90px] shadow-lg">
                <div className="text-lg sm:text-xl font-black text-amber-700">{t.banner.badge3_title}</div>
                <div className="text-[9px] font-semibold text-zinc-500 mt-0.5">{t.banner.badge3_desc}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SECTION 5: SECONDARY STORY & VISION
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          {/* Chap kichik foto */}
          <div className="md:col-span-3 hidden md:flex justify-start">
            <div className="w-44 h-32 rounded-2xl overflow-hidden shadow-md border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=400&q=80"
                alt="Agronomist examining crops"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* O'rta: Sarlavha, Paragraf, Qora Pill Tugma */}
          <div className="md:col-span-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{t.story2.tag}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight leading-snug">
              {t.story2.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl mx-auto">
              {t.story2.p1}
            </p>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl mx-auto">
              {t.story2.p2}
            </p>

            <div className="pt-2">
              <Link
                href="/hamkorlik"
                className="inline-flex items-center gap-3 bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-semibold pl-6 pr-2 py-2 rounded-full transition active:scale-95 group"
              >
                <span>{t.story2.contact_btn}</span>
                <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </div>
          </div>

          {/* O'ng kichik foto */}
          <div className="md:col-span-3 hidden md:flex justify-end">
            <div className="w-44 h-32 rounded-2xl overflow-hidden shadow-md border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=400&q=80"
                alt="Agricultural fields and sunny sky"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SECTION 6: VALUES BLOCK
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Chap ustun: Sarlavha va Pagination doiralari */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#191B1F] tracking-tight leading-snug whitespace-pre-line">
              {t.values.title}
            </h3>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#F4F1EA] hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition"
                aria-label="Oldingi"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-black transition"
                aria-label="Keyingi"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* O'ng ustun: 3 ta qadriyatlar kartochkasi */}
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-5">
            {/* Karta 01 */}
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-3">{t.values.v1_tag}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {t.values.v1_pills.map((tag) => (
                    <div
                      key={tag}
                      className="text-center text-[11px] font-semibold py-1.5 px-2 rounded-xl bg-[#FAF8F3] border border-black/5 text-zinc-700"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                {t.values.v1_desc}
              </p>
            </div>

            {/* Karta 02 */}
            <div className="bg-[#1E2024] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-3">{t.values.v2_tag}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {t.values.v2_pills.map((tag) => (
                    <div
                      key={tag}
                      className="text-center text-[11px] font-semibold py-1.5 px-2 rounded-xl bg-white/10 text-zinc-200"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pt-2">
                {t.values.v2_desc}
              </p>
            </div>

            {/* Karta 03 */}
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-3">{t.values.v3_tag}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {t.values.v3_pills.map((tag) => (
                    <div
                      key={tag}
                      className="text-center text-[11px] font-semibold py-1.5 px-2 rounded-xl bg-[#FAF8F3] border border-black/5 text-zinc-700"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                {t.values.v3_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. SECTION 7: JONLI AGRO BOZOR (Apple Style Category Pills & Badges)
          ========================================================================= */}
      <section id="bozor" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full mb-3">
              <ShoppingCart size={13} className="text-emerald-700" />
              <span>{t.bozor.tag}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#191B1F]">
              {t.bozor.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-2xl">
              {t.bozor.desc}
            </p>
          </div>

          <Link
            href="/dorilar"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 group shrink-0"
          >
            <span>{t.bozor.view_all}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Kategoriya Tablari (Apple Vector Icon Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {[
            { id: "all", label: t.bozor.cat_all, icon: null },
            { id: "crop", label: t.bozor.cat_crop, icon: Sprout },
            { id: "animal", label: t.bozor.cat_animal, icon: ShieldCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? "bg-[#191B1F] text-white shadow-xs"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {Icon && <Icon size={13} className={activeCategory === cat.id ? "text-amber-400" : "text-zinc-500"} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mahsulotlar Kartochkalari (Apple badges) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {filteredProducts.map((p) => {
            const BadgeIcon = p.badgeIcon;
            return (
              <Link
                key={p.id}
                href={`/dorilar?q=${encodeURIComponent(p.name)}`}
                className="bg-white rounded-3xl p-4 border border-black/5 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  <div className="h-48 rounded-2xl overflow-hidden relative mb-4 bg-zinc-100">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 ${p.badgeColor}`}>
                      <BadgeIcon size={11} />
                      <span>{p.badge}</span>
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-emerald-700 mb-1">{p.category}</div>
                  <h3 className="text-base font-extrabold text-[#191B1F] line-clamp-1 group-hover:text-emerald-700 transition">
                    {p.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-medium">{p.store} • {p.location}</div>
                    <div className="text-base font-black text-[#191B1F] mt-0.5">{p.price}</div>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-[#191B1F] group-hover:text-white transition shadow-2xs">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          8. SECTION 8: MUTAXASSISLAR
          ========================================================================= */}
      <section id="mutaxassislar" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full mb-3">
              <Users size={13} className="text-emerald-700" />
              <span>{t.specialists.tag}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#191B1F]">
              {t.specialists.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-2xl">
              {t.specialists.desc}
            </p>
          </div>

          <Link
            href="/mutaxassislar"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 group shrink-0"
          >
            <span>{t.specialists.view_all}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {sampleSpecialists.map((sp, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 border border-zinc-200">
                    <img src={sp.avatar} alt={sp.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#191B1F]">{sp.name}</h3>
                    <div className="text-xs font-semibold text-emerald-700 mt-0.5">{sp.role}</div>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed min-h-[48px]">
                  {sp.specialty}
                </p>

                <div className="flex items-center gap-2 mt-4 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star size={12} fill="currentColor" />
                    {sp.rating} ({sp.reviews})
                  </span>
                  <span className="text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                    {sp.exp}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <MapPin size={13} className="text-zinc-400" />
                  {sp.region}
                </span>

                <Link
                  href="/mutaxassislar"
                  className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs transition"
                >
                  {t.specialists.contact_btn}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          9. SECTION 9: SHAFFAF TARIFLAR
          ========================================================================= */}
      <section id="tariffs" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            {t.tariffs.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight mt-3">
            {t.tariffs.title_p1}
            <span className="text-emerald-700">{t.tariffs.title_highlight}</span>
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-600">
            {t.tariffs.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* BETA Start */}
          <div className="rounded-3xl border-2 border-emerald-600 bg-white p-7 shadow-xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-6 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full">
              {t.tariffs.recommended}
            </div>

            <div>
              <div className="text-lg font-bold text-[#191B1F]">{t.tariffs.plan1_name}</div>
              <p className="text-xs text-zinc-500 mt-1">{t.tariffs.plan1_sub}</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-emerald-700">{t.tariffs.plan1_price}</span>
                <span className="text-sm font-semibold text-zinc-500">{t.tariffs.plan1_period}</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Qarz daftari (Nasiya hisob-kitobi)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Ombor qoldig‘ini boshqarish</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Agroz Bozorida tovarlarni namoyish etish</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Xaridorlardan onlayn buyurtma olish</span>
                </li>
              </ul>
            </div>

            <Link
              href="/hamkorlik"
              className="mt-8 w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 text-center transition shadow-md shadow-emerald-600/20 active:scale-95 block"
            >
              {t.tariffs.plan1_btn}
            </Link>
          </div>

          {/* Standart */}
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition">
            <div>
              <div className="text-lg font-bold text-[#191B1F]">{t.tariffs.plan2_name}</div>
              <p className="text-xs text-zinc-500 mt-1">{t.tariffs.plan2_sub}</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#191B1F]">{t.tariffs.plan2_price}</span>
                <span className="text-sm font-semibold text-zinc-500">{t.tariffs.plan2_period}</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-emerald-700">
                {t.tariffs.plan2_beta}
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-600">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Barcha BETA Start imkoniyatlari</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Cheksiz dori va mahsulotlar kiritish</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Kunlik savdo va kassa hisoboti</span>
                </li>
              </ul>
            </div>

            <Link
              href="/hamkorlik"
              className="mt-8 w-full rounded-full bg-[#191B1F] hover:bg-black text-white font-bold text-xs py-3.5 text-center transition shadow-xs active:scale-95 block"
            >
              {t.tariffs.plan2_btn}
            </Link>
          </div>

          {/* Tarmoq */}
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition">
            <div>
              <div className="text-lg font-bold text-[#191B1F]">{t.tariffs.plan3_name}</div>
              <p className="text-xs text-zinc-500 mt-1">{t.tariffs.plan3_sub}</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#191B1F]">{t.tariffs.plan3_price}</span>
                <span className="text-sm font-semibold text-zinc-500">{t.tariffs.plan3_period}</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-600">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Bir nechta filiallar va xodimlar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Shaxsiy menejer yordami</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Maxsus tahliliy hisobotlar</span>
                </li>
              </ul>
            </div>

            <Link
              href="/hamkorlik"
              className="mt-8 w-full rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-3.5 text-center transition active:scale-95 block"
            >
              {t.tariffs.plan3_btn}
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. SECTION 10: FAQ & ALOQA
          ========================================================================= */}
      <section id="aloqa" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            {t.faq.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight mt-3">
            {t.faq.title}
          </h2>
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
          11. FINAL CALL TO ACTION (CTA)
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[36px] sm:rounded-[48px] bg-[#191B1F] text-white p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {t.cta.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              {t.cta.desc}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/hamkorlik"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm transition shadow-lg active:scale-95"
              >
                {t.cta.free_btn}
              </Link>
              <Link
                href="/hamkorlik?mode=login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition"
              >
                {t.cta.login_btn}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
