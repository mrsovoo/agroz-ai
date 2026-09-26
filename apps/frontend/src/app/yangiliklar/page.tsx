import type { Metadata } from "next";
import WeatherCard from "@/components/WeatherCard";
import WeatherAlertBanner from "@/components/WeatherAlertBanner";
import NewsList from "@/components/NewsList";
import { NEWS_SOURCES } from "@/lib/news-sources";
import { apiUrl } from "@/lib/api-config";
import { Lightbulb, Newspaper, Database, ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maslahatlar va yangiliklar",
  description:
    "Agro va chorvachilik yangiliklari, ob-havoga va turgan hududingizga qarab maslahatlar.",
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

  const sources = (
    <div
      className="flex flex-col gap-2 rounded-[20px] p-4 text-[13px] leading-relaxed"
      style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
    >
      <p className="flex items-start gap-2.5">
        <Database size={17} className="mt-0.5 shrink-0" />
        <span>
          Ob-havo <b>Open-Meteo</b> real API'sidan, hudud nomi <b>OpenStreetMap</b> dan olinadi.
          Maslahatlar shu ma'lumotlar asosida hisoblanadi.
        </span>
      </p>
      <p className="flex items-start gap-2.5">
        <ShieldCheck size={17} className="mt-0.5 shrink-0" />
        <span>Yangiliklar faqat rasmiy RSS manbalardan olinadi va manba nomi bilan ko&apos;rsatiladi.</span>
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {NEWS_SOURCES.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold"
          >
            {s.label}
            <ExternalLink size={10} />
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <main className="px-5 pb-6 pt-3 web:grid web:grid-cols-[minmax(0,1fr)_380px] web:items-start web:gap-10">
      <div>
        <p className="ios-sub flex items-center gap-1.5">
          <Lightbulb size={13} className="text-[var(--brand-yellow)]" /> Bilim
        </p>
        <h1 className="ios-title">Maslahatlar</h1>
        <p className="mt-1 text-[14px] text-[var(--brand-muted)] web:text-[16px]">
          Turgan hududingiz uchun ob-havo maslahatlari va agro/chorvachilik yangiliklari
        </p>

        <section className="mt-5">
          <WeatherAlertBanner />
        </section>

        <section className="mt-5">
          <WeatherCard showTips showRegion />
        </section>

        <section className="mt-8">
          <p className="ios-section-title flex items-center gap-1.5">
            <Newspaper size={14} /> Agro va chorvachilik yangiliklari
          </p>
          <NewsList items={items} />
        </section>

        <div className="mt-6 web:hidden">{sources}</div>
      </div>

      {/* Katta ekranda manbalar o'ng ustunda turadi */}
      <aside className="mt-5 hidden web:mt-0 web:block web:sticky web:top-24">
        {sources}
      </aside>
    </main>
  );
}
