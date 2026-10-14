"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Send,
  Loader2,
  ShieldCheck,
  Building2,
  Sparkles,
  MapPin,
  Phone,
  User,
  Check,
  ChevronLeft,
  Layers,
  TrendingUp,
  Award,
} from "lucide-react";
import AgrozLogo from "@/components/AgrozLogo";
import { apiFetch } from "@/lib/api-config";
import { useI18n } from "@/lib/i18n";

export default function HamkorlikPage() {
  const router = useRouter();
  const { lang, t } = useI18n();

  // Form maydonlari
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [specialty, setSpecialty] = useState("Agro-dorixona");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(true);

  const [tab, setTab] = useState<"register" | "login">("register");
  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Jarayon holatlari
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2-bosqich: Telegram tasdiqlash ma'lumotlari
  const [regData, setRegData] = useState<{
    token: string;
    sessionToken: string;
    startUrl: string;
    webCabinetUrl: string;
    botUsername: string;
    phone: string;
    organization: string;
  } | null>(null);

  const [verified, setVerified] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("mode") === "login" || params.get("login") === "true") {
          setTab("login");
        }
        const existingToken = localStorage.getItem("agroz_business_token");
        if (existingToken) {
          setHasExistingSession(true);
        }
      }
    } catch {}
  }, []);

  // Telefon raqamni formatlash (+998 ...)
  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, "");
    if (!digits.startsWith("998")) {
      digits = "998" + digits;
    }
    digits = digits.slice(0, 12);

    let formatted = "+998";
    if (digits.length > 3) formatted += " " + digits.slice(3, 5);
    if (digits.length > 5) formatted += " " + digits.slice(5, 8);
    if (digits.length > 8) formatted += " " + digits.slice(8, 10);
    if (digits.length > 10) formatted += " " + digits.slice(10, 12);

    setPhone(formatted);
  };

  // 1-bosqich: Ro'yxatdan o'tish arizasini yuborish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError(
        lang === "ru"
          ? "Пожалуйста, подтвердите согласие с правилами"
          : lang === "en"
          ? "Please accept the terms and privacy policy"
          : "Iltimos, foydalanish shartlari va maxfiylik siyosatiga rozilik bildiring"
      );
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setError("Iltimos, to'liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }
    if (!organization.trim()) {
      setError("Do'kon yoki dorixona nomini kiriting");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || organization.trim(),
          phone: cleanPhone,
          organization: organization.trim(),
          specialty,
          address: address.trim() || "O'zbekiston",
          role: "pharmacy",
        }),
      });

      const data = await res.json();
      if (data?.ok) {
        setRegData(data);
        setStep(2);
      } else {
        setError(data?.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } catch {
      setError("Server bilan aloqa uzildi. Internetni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // 1-bosqich (Login): Mavjud kabinetga kirish
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setError("Iltimos, telefon raqamingizni to'liq kiriting (+998 XX XXX XX XX)");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          organization: "Do‘konim",
          role: "pharmacy",
        }),
      });

      const data = await res.json();
      if (data?.ok) {
        setRegData(data);
        setStep(2);
      } else {
        setError(data?.error || "Kirishda xatolik yuz berdi");
      }
    } catch {
      setError("Server bilan aloqa uzildi. Internetni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  // 2-bosqich: Telegram bot tasdiqlashini fonda kuzatish (polling)
  useEffect(() => {
    if (step !== 2 || !regData?.token || verified) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await apiFetch(
          `/api/bot/partner/check-registration?token=${encodeURIComponent(regData.token)}`
        );
        const data = await res.json();
        if (data?.ok && data.verified) {
          setVerified(true);
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);

          if (regData.sessionToken) {
            localStorage.setItem("agroz_business_token", regData.sessionToken);
          }
          setTimeout(() => {
            router.push(regData.webCabinetUrl || "/business");
          }, 1500);
        }
      } catch {}
    }, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, regData, verified, router]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] antialiased selection:bg-amber-200 selection:text-amber-950 font-sans">
      {/* 1. Katta Corporate Header & Breadcrumb */}
      <section className="pt-8 sm:pt-14 pb-8 sm:pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-4">
          <Link href="/" className="hover:text-black transition">
            AgrozGO
          </Link>
          <span>/</span>
          <span className="text-zinc-900">{t.nav.partners}</span>
        </div>

        <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-4">
          <Building2 size={13} className="text-emerald-700" />
          <span>Agroz Business Ecosystem</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-[#191B1F] tracking-tight leading-[1.12]">
          {lang === "ru"
            ? "Партнерство с AgrozGO: автоматизация и рост вашего агробизнеса"
            : lang === "en"
            ? "Partner with AgrozGO: Scale and automate your agricultural business"
            : "AgrozGO bilan hamkorlik: agro-biznesingizni yangi bosqichga olib chiqing"}
        </h1>

        <p className="mt-4 text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
          {lang === "ru"
            ? "Облачная книга долгов, учет склада, касса и онлайн-заказы от тысяч фермеров по всему Узбекистану в единой системе."
            : lang === "en"
            ? "Cloud debt ledger, inventory control, POS, and online order flow from thousands of farmers across Uzbekistan in one unified platform."
            : "Bulutli qarz daftari, omborxona nazorati, kassa va O‘zbekiston bo‘ylab minglab dehqon va chorvadorlardan buyurtmalar oqimi — yagona raqamli platformada."}
        </p>
      </section>

      {/* 2. Asosiy Split-Screen Grid (Chapda Afzalliklar, O'ngda Ariza Formasi) */}
      <section className="pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Chap ustun: Korporativ afzalliklar va ishonch kartalari */}
          <div className="lg:col-span-6 space-y-6">
            {/* 4 ta Apple Bento Karta */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#191B1F] mb-1.5">
                    {lang === "ru" ? "100% Защищенная книга долгов" : lang === "en" ? "100% Encrypted Debt Ledger" : "100% Shaxsiy Qarz Daftari"}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === "ru"
                      ? "Данные клиентов и долгов надежно зашифрованы в облаке. Бумажная тетрадь больше не потеряется."
                      : lang === "en"
                      ? "Customer debt records are encrypted in cloud storage. No more torn or misplaced paper notebooks."
                      : "Mijozlarning nasiya hisoblari shifrlangan. Qog‘oz daftar kabi yo‘qolmaydi yoki chalkashmaydi."}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                    <Layers size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#191B1F] mb-1.5">
                    {lang === "ru" ? "Контроль склада и остатков" : lang === "en" ? "Warehouse & Stock Control" : "Ombor va Kassa Nazorati"}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === "ru"
                      ? "Учет остатков препаратов и кормов в реальном времени с автоматическими уведомлениями."
                      : lang === "en"
                      ? "Real-time stock monitoring of fertilizers and medicines with automated low-stock alerts."
                      : "Dori vositalari va o‘g‘itlar qoldig‘ini real vaqtda kuzatish va kam qolgan tovarlar ogohlantirishi."}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                    <Store size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#191B1F] mb-1.5">
                    {lang === "ru" ? "Онлайн Агро Базар" : lang === "en" ? "Live Marketplace Showcase" : "Jonli Bozor Vitrinasi"}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === "ru"
                      ? "Ваши товары видны фермерам вашего района и города прямо на платформе и в Telegram."
                      : lang === "en"
                      ? "Your catalog becomes instantly visible to farmers in your region both on web and Telegram."
                      : "Do‘koningizdagi tovarlar hududingizdagi minglab fermer va xaridorlarga to‘g‘ridan-to‘g‘ri ko‘rinadi."}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
                    <Sparkles size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#191B1F] mb-1.5">
                    {lang === "ru" ? "БЕТА 0 сум для партнеров" : lang === "en" ? "BETA $0 for Partners" : "BETA 0 so‘m Imtiyozi"}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {lang === "ru"
                      ? "Первые 50 партнерских аптек получают полный функционал платформы бесплатно."
                      : lang === "en"
                      ? "The first 50 partner pharmacies receive full platform features completely free."
                      : "Dastlabki 50 ta hamkor agro-dorixona uchun barcha servislar 1 yil davomida mutlaqo bepul taqdim etiladi."}
                  </p>
                </div>
              </div>
            </div>

            {/* Qora Bento Statistika kartasi */}
            <div className="rounded-3xl bg-[#1E2024] text-white p-6 sm:p-8 shadow-xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {lang === "ru" ? "Доверие партнеров" : lang === "en" ? "Partner Trust" : "Hamkorlar ishonchi"}
                </span>
                <span className="text-xs text-zinc-400">O‘zbekiston bo‘ylab</span>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">50+</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Hamkor do‘konlar</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">12 000+</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Faol xaridorlar</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Xavfsiz ma'lumot</div>
                </div>
              </div>
            </div>
          </div>

          {/* O'ng ustun: Ro'yxatdan o'tish va Kirish Formasi */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-black/8 shadow-xl">
              {step === 1 ? (
                <div>
                  {/* Segmented Apple-style Toggle */}
                  <div className="flex p-1 bg-[#F4F3ED] rounded-full mb-8">
                    <button
                      type="button"
                      onClick={() => {
                        setTab("register");
                        setError(null);
                      }}
                      className={`flex-1 py-2.5 rounded-full text-xs font-bold transition ${
                        tab === "register"
                          ? "bg-[#191B1F] text-white shadow-xs"
                          : "text-zinc-600 hover:text-black"
                      }`}
                    >
                      {lang === "ru" ? "Подключить магазин" : lang === "en" ? "Register Store" : "Do‘konni ulash"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab("login");
                        setError(null);
                      }}
                      className={`flex-1 py-2.5 rounded-full text-xs font-bold transition ${
                        tab === "login"
                          ? "bg-[#191B1F] text-white shadow-xs"
                          : "text-zinc-600 hover:text-black"
                      }`}
                    >
                      {lang === "ru" ? "Вход в кабинет" : lang === "en" ? "Cabinet Login" : "Kabinetga kirish"}
                    </button>
                  </div>

                  {/* Faol seans bor bo'lsa ogohlantirish */}
                  {hasExistingSession && (
                    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
                        <div>
                          <p className="font-bold">Faol biznes seansingiz mavjud</p>
                          <p className="text-[11px] text-emerald-800">Qayta kirmasdan to‘g‘ridan-to‘g‘ri kabinetga o‘ting</p>
                        </div>
                      </div>
                      <Link
                        href="/business"
                        className="px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0"
                      >
                        Kabinetga o‘tish →
                      </Link>
                    </div>
                  )}

                  {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
                      <AlertCircle size={16} className="text-rose-600 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {tab === "register" ? (
                    /* Ro'yxatdan o'tish formasi */
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                          {lang === "ru" ? "Название магазина / аптеки *" : lang === "en" ? "Store or Pharmacy Name *" : "Do‘kon yoki dorixona nomi *"}
                        </label>
                        <div className="relative">
                          <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            required
                            placeholder="Masalan: Aziya Agro Savdo MCHJ"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-[#FAF9F5] text-xs sm:text-sm focus:outline-none focus:border-black font-medium transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                          {lang === "ru" ? "Имя руководителя или ответственного" : lang === "en" ? "Manager or Owner Name" : "Do‘kon egasi yoki mas'ul shaxs ismi"}
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Masalan: Jamshid Qodirov"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-[#FAF9F5] text-xs sm:text-sm focus:outline-none focus:border-black font-medium transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                          {lang === "ru" ? "Телефон (привязанный к Telegram) *" : lang === "en" ? "Phone (connected to Telegram) *" : "Telefon raqamingiz (Telegram bog‘langan) *"}
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="tel"
                            required
                            placeholder="+998 90 123 45 67"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-[#FAF9F5] text-xs sm:text-sm focus:outline-none focus:border-black font-mono transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                          Faoliyat yo‘nalishi
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            "Agro-dorixona",
                            "Veterinariya",
                            "Ozuqa & Premiks",
                            "Urug‘ va o‘g‘itlar",
                          ].map((cat) => (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => setSpecialty(cat)}
                              className={`py-2.5 px-3 text-xs rounded-xl border transition text-left flex items-center justify-between ${
                                specialty === cat
                                  ? "border-[#191B1F] bg-[#191B1F] text-white font-bold shadow-xs"
                                  : "border-zinc-200 bg-[#FAF9F5] text-zinc-700 hover:border-black"
                              }`}
                            >
                              <span>{cat}</span>
                              {specialty === cat && <Check size={13} className="text-amber-400" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                          Manzil yoki hudud
                        </label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Masalan: Toshkent viloyati, Qibray tumani"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-[#FAF9F5] text-xs sm:text-sm focus:outline-none focus:border-black transition"
                          />
                        </div>
                      </div>

                      {/* Auditorlik talabi: Majburiy rozilik checkboxi */}
                      <div className="pt-2">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600 leading-snug">
                          <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-0.5 rounded border-zinc-300 text-black focus:ring-black"
                          />
                          <span>
                            Men AgrozGO platformasining{" "}
                            <Link href="/maxfiylik" className="text-zinc-900 underline font-medium" target="_blank">
                              Maxfiylik siyosati
                            </Link>{" "}
                            va{" "}
                            <Link href="/shartlar" className="text-zinc-900 underline font-medium" target="_blank">
                              Foydalanish shartlari
                            </Link>
                            ga rozilik bildiraman.
                          </span>
                        </label>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 py-3.5 rounded-full bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Ariza saqlanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <span>Davom etish (Telegram orqali tasdiqlash)</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    /* Login formasi */
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
                        <p className="font-bold text-zinc-900 mb-1">Parolsiz va tezkor kirish:</p>
                        <p>Telefon raqamingizni kiriting va Telegram orqali bitta «Start» tugmasini bosib kabinetingizga xavfsiz kiring.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                          Telefon raqamingiz *
                        </label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="tel"
                            required
                            placeholder="+998 90 123 45 67"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-zinc-200 bg-[#FAF9F5] text-xs sm:text-sm focus:outline-none focus:border-black font-mono transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 py-3.5 rounded-full bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Kirish tekshirilmoqda...</span>
                          </>
                        ) : (
                          <>
                            <span>Telegram orqali kabinetga kirish</span>
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* 2-Bosqich: Telegram Bot orqali Tasdiqlash */
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <Send size={28} className="translate-x-0.5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-[#191B1F]">
                      Telegram orqali tasdiqlash
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto">
                      Do‘koningiz va raqamingizni tasdiqlash uchun rasmiy botimizga o‘tib, bitta <b>/start</b> tugmasini bosing:
                    </p>
                  </div>

                  {regData && (
                    <div className="space-y-4">
                      <a
                        href={regData.startUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95"
                      >
                        <Send size={15} />
                        <span>Telegram Botda ochish ({regData.botUsername})</span>
                      </a>

                      <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 max-w-sm mx-auto flex items-center justify-center gap-2">
                        <Loader2 size={14} className="animate-spin text-emerald-600 shrink-0" />
                        <span>Tasdiqlash kutilmoqda (avtomatik ochiladi)...</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-zinc-500 hover:text-black"
                    >
                      ← Ma'lumotlarni o‘zgartirish
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
