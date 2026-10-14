import type { Metadata } from "next";
import Link from "next/link";
import WeatherCard from "@/components/WeatherCard";
import WeatherAlertBanner from "@/components/WeatherAlertBanner";
import NewsList from "@/components/NewsList";
import { NEWS_SOURCES } from "@/lib/news-sources";
import { apiUrl } from "@/lib/api-config";
import {
  Sparkles,
  Newspaper,
  Database,
  ExternalLink,
  ShieldCheck,
  Sprout,
  Users,
  ArrowRight,
  CloudSun,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog va maslahatlar — AgrozGO",
  description:
    "Agro va chorvachilik yangiliklari, ob-havoga va turgan hududingizga qarab agronomik maslahatlar.",
};

export default async function NewsPage() {
  let items: any[] = [];
  try {
    const res = await fetch(apiUrl("/api/news"), { next: { revalidate: 900 } });
    if (res.ok) {
      const data = await res.json();
      items = data.items || [];
    }
  } catch {
    items = [];
  }

  const sourcesCard = (
    <div className="bg-white rounded-3xl p-6 border border-black/8 shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-zinc-900">
        <ShieldCheck size={16} className="text-emerald-600" />
        <span>Rasmiy ma'lumot manbalari</span>
      </div>

      <p className="text-xs text-zinc-600 leading-relaxed">
        Ob-havo ko‘rsatkichlari <b>Open-Meteo</b> real API&apos;sidan, hudud koordinatalari <b>OpenStreetMap</b> orqali olinadi. Maslahatlar agronomik hisob-kitoblar asosida shakllantiriladi.
      </p>

      <div className="pt-2 border-t border-zinc-100 flex flex-wrap gap-2">
        {NEWS_SOURCES.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF9F5] border border-black/5 hover:bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition"
          >
            <span>{s.label}</span>
            <ExternalLink size={11} className="text-zinc-400" />
          </a>
        ))}
      </div>
    </div>
  );

  const expertConsultCard = (
    <div className="bg-[#1E2024] text-white rounded-3xl p-6 shadow-xl border border-white/10 space-y-3.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
        <Users size={15} />
        <span>Mutaxassis Yordami</span>
      </div>

      <h3 className="text-base font-bold text-white leading-snug">
        Ekin yoki chorvangizda kasallik alomati bormi?
      </h3>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Tajribali agronom va veterinar shifokorlar bilan bog‘laning va zudlik bilan konsultatsiya oling.
      </p>

      <div className="pt-2">
        <Link
          href="/mutaxassislar"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-zinc-100 font-bold text-xs transition"
        >
          <span>Mutaxassislarni ko‘rish</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] antialiased pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Breadcrumb & Sarlavha */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-3">
          <Link href="/" className="hover:text-black transition">
            AgrozGO
          </Link>
          <span>/</span>
          <span className="text-zinc-900">Blog & Maslahatlar</span>
        </div>

        <div className="pb-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3.5 py-1 rounded-full mb-3">
            <Sprout size={13} className="text-emerald-700" />
            <span>Agronomik Bilimlar va Yangiliklar</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#191B1F] tracking-tight leading-tight">
            Foydali agro-maslahatlar va yangiliklar
          </h1>

          <p className="mt-2 text-xs sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
            Turgan hududingiz uchun ob-havo tahlili, ekinlarni zararkunandalardan himoya qilish tavsiyalari va O‘zbekiston agro-sektorining so‘nggi yangiliklari.
          </p>
        </div>

        {/* 2 Ustunli Web Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Asosiy Tarkib (8 ustun) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Ob-havo ogohlantirish banneri */}
            <WeatherAlertBanner />

            {/* Ob-havo va ekin maslahati kartasi */}
            <div className="bg-white rounded-3xl p-6 border border-black/8 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">
                <CloudSun size={16} className="text-amber-500" />
                <span>Hududingiz bo‘yicha agro-meteorologiya</span>
              </div>
              <WeatherCard showTips showRegion />
            </div>

            {/* Yangiliklar ro'yxati */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/8 shadow-xs">
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100 mb-6">
                <div className="flex items-center gap-2">
                  <Newspaper size={18} className="text-zinc-800" />
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#191B1F]">
                    Agro va chorvachilik yangiliklari
                  </h2>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  {items.length} ta maqola
                </span>
              </div>

              <NewsList items={items} />
            </div>
          </div>

          {/* O'ng Ustun (Sidebar, 4 ustun) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {sourcesCard}
            {expertConsultCard}
          </aside>
        </div>
      </div>
    </div>
  );
}
