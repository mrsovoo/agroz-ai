"use client";

import { useState } from "react";
import {
  Store,
  BookOpen,
  Boxes,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  CloudCheck,
  Check,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import AgrozBusinessLogo from "./AgrozBusinessLogo";

export function TariffsBlock({ onSelectPlan }: { onSelectPlan?: (plan: "beta" | "standard" | "network") => void }) {
  return (
    <section id="tariffs" className="py-16 sm:py-24 px-4 sm:px-8 max-w-6xl mx-auto scroll-mt-16">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-3 py-1 rounded-full">
          Tariflar
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] mt-3">
          Hozirda barcha imkoniyatlar — BETA sinovida
        </h2>
        <p className="mt-3 text-sm text-[#86868B]">
          Birinchi 50 ta hamkor dorixona va agro-do‘kon uchun tizim <b>mutlaqo bepul (0 so‘m)</b>.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {/* 1. BETA Sinov (Aktiv) */}
        <div className="rounded-3xl border-2 border-zinc-900 bg-white p-7 shadow-xs relative flex flex-col justify-between">
          <div className="absolute -top-3 left-6 bg-zinc-900 text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-0.5 rounded-full">
            Ayni damda faol
          </div>

          <div>
            <div className="text-lg font-bold text-[#1D1D1F]">BETA Start</div>
            <p className="text-xs text-[#86868B] mt-1">Sinov davridagi barcha do‘konlar uchun</p>

            <div className="mt-5 pb-5 border-b border-[#E5E5EA] flex items-baseline gap-1.5">
              <span className="text-4xl font-bold text-[#1D1D1F]">0</span>
              <span className="text-sm font-medium text-[#86868B]">so‘m / oyiga</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-zinc-700">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-900 shrink-0 mt-0.5" />
                <span><b>Qarz daftari</b> (Nasiya hisob-kitobi)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-900 shrink-0 mt-0.5" />
                <span>Ombor qoldig‘ini boshqarish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-900 shrink-0 mt-0.5" />
                <span>Mahsulotlarni AgrozGO ilovasida ko‘rsatish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-900 shrink-0 mt-0.5" />
                <span>Xaridorlardan onlayn buyurtma olish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-900 shrink-0 mt-0.5" />
                <span>Telegram Mini App va Web orqali kirish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-900 shrink-0 mt-0.5" />
                <span><b>Bepul yordam:</b> Mahsulotlarni kiritib beramiz</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectPlan?.("beta")}
            className="mt-8 w-full rounded-full bg-[#1D1D1F] hover:bg-black text-white font-semibold text-xs py-3 transition shadow-xs active:scale-95"
          >
            Faollashtirish (0 so‘m)
          </button>
        </div>

        {/* 2. Standart Do'kon */}
        <div className="rounded-3xl border border-[#E5E5EA] bg-white p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-lg font-bold text-[#1D1D1F]">Standart</div>
            <p className="text-xs text-[#86868B] mt-1">To‘liq avtomatlashtirilgan do‘konlar uchun</p>

            <div className="mt-5 pb-5 border-b border-[#E5E5EA] flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-[#1D1D1F]">149 000</span>
              <span className="text-sm font-medium text-[#86868B]">so‘m / oyiga</span>
            </div>
            <div className="mt-2 text-[11px] font-medium text-emerald-600">
              BETA qatnashchilariga: 0 so‘m
            </div>

            <ul className="mt-6 space-y-3 text-xs text-zinc-700">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>BETA Startdagi barcha imkoniyatlar</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Cheksiz dori va mahsulotlar</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Kunlik savdo va kassa hisoboti</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Excel formatida yuklab olish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Prioritetli mijozlar oqimi</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectPlan?.("standard")}
            className="mt-8 w-full rounded-full bg-[#1D1D1F] hover:bg-black text-white font-semibold text-xs py-3 transition shadow-xs active:scale-95"
          >
            Sotib olish (149 000 so‘m)
          </button>
        </div>

        {/* 3. Tarmoq */}
        <div className="rounded-3xl border border-[#E5E5EA] bg-white p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-lg font-bold text-[#1D1D1F]">Tarmoq & Ulgurji</div>
            <p className="text-xs text-[#86868B] mt-1">Bir nechta filial va omborlar uchun</p>

            <div className="mt-5 pb-5 border-b border-[#E5E5EA] flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-[#1D1D1F]">Kelishuv</span>
              <span className="text-sm font-medium text-[#86868B]">asosida</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-zinc-700">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Bir nechta filiallar va xodimlar</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>AgrozGO ilovasida TOP tavsiya</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Shaxsiy menejer qo‘llab-quvvatlashi</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>Maxsus tahliliy hisobotlar</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectPlan?.("network")}
            className="mt-8 w-full rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-xs py-3 transition active:scale-95"
          >
            Shartnoma bilan ulash
          </button>
        </div>
      </div>
    </section>
  );
}

export default function BusinessLanding({
  onLoginClick,
  onStartFree,
  onSelectPlan,
  loginCardNode,
}: {
  onLoginClick?: () => void;
  onStartFree?: (role?: "pharmacy" | "specialist") => void;
  onSelectPlan?: (plan: "beta" | "standard" | "network") => void;
  loginCardNode?: React.ReactNode;
}) {
  const handleAction = () => {
    if (onLoginClick) onLoginClick();
    if (typeof document !== "undefined") {
      const el = document.getElementById("login");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleStartFree = (role: "pharmacy" | "specialist" = "pharmacy") => {
    if (onStartFree) {
      onStartFree(role);
    } else {
      handleAction();
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans selection:bg-zinc-900 selection:text-white">
      {/* 1. Yuqori E'lon (BETA Banner - Minimalist) */}
      <div className="bg-white border-b border-[#E5E5EA] py-2 px-4 text-center text-xs text-[#86868B] flex items-center justify-center gap-2">
        <span className="bg-zinc-100 text-zinc-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-zinc-200">
          BETA 1.0
        </span>
        <span>
          AgrozGO Business ochiq sinovda: barcha imkoniyatlar <b>0 so‘m</b>.
        </span>
      </div>

      {/* 2. Asosiy Navigatsiya */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="https://agroz-ai.vercel.app" className="hover:opacity-85 transition">
            <AgrozBusinessLogo className="h-7 sm:h-8 w-auto" />
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="https://agroz-ai.vercel.app"
            className="hidden md:inline-block text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] px-2 py-1.5 transition"
          >
            Asosiy sayt
          </a>
          <a
            href="https://agroz-ai.vercel.app/dorilar"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition"
          >
            <span>🛒 Bozor</span>
          </a>
          <a
            href="https://agroz-ai.vercel.app/mutaxassislar"
            className="hidden sm:inline-block text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] px-2 py-1.5 transition"
          >
            Mutaxassislar
          </a>
          <a
            href="#tariffs"
            className="hidden lg:inline-block text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] px-2 py-1.5 transition"
          >
            Tariflar
          </a>
          <a
            href="https://agroz-ai.vercel.app/hamkorlik"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 rounded-full transition shadow-2xs"
          >
            <span>+ Do‘konni ulash</span>
          </a>
          <button
            type="button"
            onClick={handleAction}
            className="flex items-center gap-1.5 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold px-4 py-2 hover:bg-black transition active:scale-95 shadow-2xs"
          >
            <span>Kabinetga kirish</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </nav>

      {/* 3. Hero qismi */}
      <section className="relative px-4 sm:px-8 pt-16 pb-20 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white border border-[#E5E5EA] text-zinc-700 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6 shadow-xs">
          <Sparkles size={13} className="text-zinc-600" />
          <span>Agro-do‘konlar va veterinariya dorixonalari uchun CRM</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#1D1D1F] leading-[1.12] max-w-3xl mx-auto">
          Agro-biznes va dorixonalar uchun sodda boshqaruv.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#86868B] max-w-2xl mx-auto font-normal leading-relaxed">
          Daftarni almashtiring: qarzlar hisobi, ombor qoldig‘i va AgrozGO xaridorlar oqimi bitta ixcham tizimda.
        </p>

        {/* CTA Tugmalar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => handleStartFree("pharmacy")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-semibold text-sm px-7 py-3.5 shadow-xs active:scale-95 transition"
          >
            <span>Boshqaruv kabineti (BETA)</span>
            <ArrowRight size={16} />
          </button>
          <a
            href="#tariffs"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-full bg-white border border-[#E5E5EA] text-[#1D1D1F] font-medium text-sm px-6 py-3.5 hover:bg-zinc-50 active:scale-95 transition"
          >
            <span>Tariflarni ko‘rish</span>
            <ChevronDown size={16} />
          </a>
        </div>

        {/* 4 Ta Minimalist Ko'rsatkich */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto pt-10 border-t border-[#E5E5EA]">
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold tracking-tight text-[#1D1D1F]">0 so‘m</div>
            <div className="text-xs font-medium text-[#86868B] mt-1">BETA sinovida mutlaqo bepul</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Vitrina</div>
            <div className="text-xs font-medium text-[#86868B] mt-1">AgrozGO mobil ilovasida</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold tracking-tight text-[#1D1D1F]">100%</div>
            <div className="text-xs font-medium text-[#86868B] mt-1">Maxfiy va xavfsiz</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-2xl font-bold tracking-tight text-[#1D1D1F]">1 daqiqa</div>
            <div className="text-xs font-medium text-[#86868B] mt-1">Tezkor kirish va boshlash</div>
          </div>
        </div>
      </section>

      {/* 4. Asosiy 3 Imkoniyat (Apple Card Style) */}
      <section id="features" className="py-16 sm:py-20 bg-white border-y border-[#E5E5EA] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-3 py-1 rounded-full">
              Imkoniyatlar
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] mt-3">
              Kundalik boshqaruv — ortiqcha murakkabliksiz
            </h2>
            <p className="mt-3 text-sm text-[#86868B]">
              Daftar va qog‘ozlardan qutuling: barcha asosiy jarayonlar qo‘l ostingizda.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* 1-Karta: Qarz daftari */}
            <div className="rounded-3xl border border-[#E5E5EA] p-6 bg-[#FBFBFD] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Qarz daftari yo‘qolmaydi</h3>
                <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                  Kim, qachon va qaysi mahsulotni nasiyaga olganini bir zumda ko‘rasiz. Qog‘oz yirtilishi yoki yo‘qolishidan xavotir olmaysiz.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E5E5EA] text-xs font-semibold text-zinc-700 flex items-center gap-2">
                <Check size={14} className="text-zinc-900" />
                <span>Nasiya va to‘lov muddati nazorati</span>
              </div>
            </div>

            {/* 2-Karta: Ombor qoldig'i */}
            <div className="rounded-3xl border border-[#E5E5EA] p-6 bg-[#FBFBFD] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                  <Boxes size={20} />
                </div>
                <h3 className="text-base font-bold text-[#1D1D1F]">Ombor va qoldiq nazorati</h3>
                <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                  Qaysi dori yoki vosita kamayib borayotganini tizim oldindan ko‘rsatadi. 1-harakatda qoldiqni yangilang.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E5E5EA] text-xs font-semibold text-zinc-700 flex items-center gap-2">
                <Check size={14} className="text-zinc-900" />
                <span>Kam qolgan tovarlar eslatmasi</span>
              </div>
            </div>

            {/* 3-Karta: AgrozGO Vitrinasi */}
            <div className="rounded-3xl border border-[#E5E5EA] p-6 bg-[#FBFBFD] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                  <Store size={20} />
                </div>
                <h3 className="text-base font-bold text-[#1D1D1F]">AgrozGO vitrinasi</h3>
                <p className="text-xs text-[#86868B] mt-2 leading-relaxed">
                  Faqat hisob-kitob emas — do‘koningiz AgrozGO mobil ilovasida joylashadi va yaqin atrofdagi fermerlardan onlayn buyurtma olasiz.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#E5E5EA] text-xs font-semibold text-zinc-700 flex items-center gap-2">
                <Check size={14} className="text-zinc-900" />
                <span>Yangi xaridorlar va onlayn buyurtmalar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TARIFLAR BLOKI */}
      <TariffsBlock onSelectPlan={onSelectPlan || (() => handleStartFree("pharmacy"))} />

      {/* 5.1 KABINETGA KIRISH / SOTIB OLISH */}
      {loginCardNode && (
        <section id="login" className="py-12 px-4 sm:px-8 max-w-xl mx-auto scroll-mt-20">
          <div className="text-center mb-6">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-3 py-1 rounded-full">
              Boshqaruv kabineti
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] mt-2">
              Kabinetga kirish va ulanish
            </h2>
            <p className="text-xs text-[#86868B] mt-1">
              Telefon raqamingiz orqali kiring yoki do‘koningiz uchun tarifni tanlang
            </p>
          </div>
          {loginCardNode}
        </section>
      )}

      {/* 6. MAXFIYLIK VA ISHONCH KAFOLATI */}
      <section className="py-16 sm:py-24 border-t border-[#E5E5EA] bg-[#FBFBFD] px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-500 bg-zinc-100 border border-zinc-200/80 px-3 py-1 rounded-full">
              Xavfsizlik
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F] mt-3">
              Ma’lumotlaringiz to‘liq himoyalangan
            </h2>
            <p className="mt-3 text-sm text-[#86868B]">
              Do‘koningiz savdosi va qarzlar ro‘yxati begonalarga mutlaqo ko‘rinmaydi.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Faqat sizning kirishingiz</h3>
              <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                Qarz daftari, mahsulot narxlari va hisob-kitoblarga faqat siz kirasiz.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                <ShieldCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Raqobatchilarga yopiq</h3>
              <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                Boshqa hech qaysi do‘kon daromadingiz yoki qarzdorlaringizni ko‘ra olmaydi.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                <FileSpreadsheet size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Excelga eksport</h3>
              <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                Istalgan vaqtda barcha hisobotlarni Excel fayl qilib ko‘chirib olasiz.
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1D1D1F] flex items-center justify-center mb-4">
                <CloudCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F]">Bulutli zaxira</h3>
              <p className="text-xs text-[#86868B] mt-1.5 leading-relaxed">
                Telefon yo‘qolsa yoki o‘zgarsa ham barcha yozuvlaringiz joyida saqlanadi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Yakuniy harakatga chaqiruv */}
      <section className="py-16 sm:py-20 px-4 text-center bg-white border-t border-[#E5E5EA]">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
            Do‘koningizni bugunoq ulang
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#86868B]">
            BETA sinovida qatnashing. Mahsulotlaringizni kiritishda mutaxassislarimiz yordam beradi.
          </p>
          <button
            type="button"
            onClick={() => handleStartFree("pharmacy")}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#1D1D1F] hover:bg-black text-white font-semibold text-xs px-7 py-3 shadow-xs active:scale-95 transition"
          >
            <span>Boshqaruv kabinetiga o‘tish</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 8. Minimalist Footer */}
      <footer className="py-12 px-4 text-center border-t border-[#E5E5EA] bg-white flex flex-col items-center justify-center gap-3">
        <AgrozBusinessLogo className="h-6 w-auto opacity-75" />
        <p className="text-xs text-[#86868B]">
          © {new Date().getFullYear()} AgrozGO Business · Agro-biznes va dorixonalar uchun sodda boshqaruv platformasi
        </p>
      </footer>
    </div>
  );
}
