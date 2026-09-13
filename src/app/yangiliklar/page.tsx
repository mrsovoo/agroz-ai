import { db } from "@/db";
import { news } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import WeatherCard from "@/components/WeatherCard";
import { Sprout, PawPrint, CalendarDays, Lightbulb, Database } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maslahatlar",
  description:
    "Ob-havoga qarab purkash tavsiyalari va mavsumiy agro/chorva bo'yicha foydali maslahatlar.",
};

export default async function NewsPage() {
  await ensureSeed();
  const items = await db.select().from(news).orderBy(desc(news.id));
  return (
    <main className="px-5 pb-6 pt-3 web:grid web:grid-cols-[minmax(0,1fr)_380px] web:items-start web:gap-10">
      <div>
        <p className="ios-sub flex items-center gap-1.5">
          <Lightbulb size={13} className="text-[var(--brand-yellow)]" /> Bilim
        </p>
        <h1 className="ios-title">Maslahatlar</h1>
        <p className="mt-1 text-[14px] text-[var(--brand-muted)] web:text-[16px]">
          Real ob-havo va mavsumiy agro/chorva tavsiyalari
        </p>

        <section className="mt-5 web:hidden">
          <WeatherCard />
        </section>

        <h2 className="ios-section-title mt-6 web:mt-9">Mavsumiy maslahatlar</h2>
        <ul className="mt-0 space-y-3 web:grid web:grid-cols-2 web:gap-6 web:space-y-0">
        {items.map((n) => {
          const isChorva = n.tag === "Chorva";
          return (
            <li key={n.id} className="ios-card overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: isChorva ? "var(--brand-yellow-soft)" : "var(--brand-green-soft)",
                }}
              >
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                  style={{
                    background: "#fff",
                    color: isChorva ? "var(--brand-ink)" : "var(--brand-green)",
                  }}
                >
                  {isChorva ? <PawPrint size={12} /> : <Sprout size={12} />}
                  {isChorva ? "Chorva" : "Agro"}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand-muted)]">
                  <CalendarDays size={11} />
                  {new Date(n.createdAt).toLocaleDateString("uz-UZ")}
                </span>
              </div>
              <div className="p-4">
                <h2 className="text-[18px] font-black leading-tight text-[var(--brand-ink)]">
                  {n.title}
                </h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[var(--brand-ink)]/80">{n.body}</p>
              </div>
            </li>
          );
          })}
        </ul>

        <div
          className="mt-4 flex items-start gap-2.5 rounded-[20px] p-4 text-[13px] leading-relaxed web:hidden"
          style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
        >
          <Database size={17} className="mt-0.5 shrink-0" />
          <p>
            Ob-havo tavsiyasi Open-Meteo real API ma&apos;lumotlari asosida hisoblanadi.
          </p>
        </div>
      </div>

      {/* Katta ekranda ob-havo va izoh o'ng ustunda turadi */}
      <aside className="mt-5 hidden web:mt-0 web:block web:sticky web:top-24">
        <WeatherCard />
        <div
          className="mt-4 flex items-start gap-2.5 rounded-[20px] p-4 text-[13px] leading-relaxed"
          style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
        >
          <Database size={17} className="mt-0.5 shrink-0" />
          <p>
            Ob-havo tavsiyasi Open-Meteo real API ma'lumotlari asosida hisoblanadi. Agro va chorva
            maqolalari esa bazadagi tasdiqlangan mavsumiy tavsiyalardan olinadi.
          </p>
        </div>
      </aside>
    </main>
  );
}
