import { db } from "@/db";
import { news } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { Sprout, PawPrint, CalendarDays, Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  await ensureSeed();
  const items = await db.select().from(news).orderBy(desc(news.id));
  return (
    <main className="px-5 pb-6 pt-3">
      <p className="ios-sub flex items-center gap-1.5">
        <Lightbulb size={13} className="text-[var(--brand-yellow)]" /> Bilim
      </p>
      <h1 className="ios-title">Maslahatlar</h1>
      <p className="mt-1 text-[14px] text-[var(--brand-muted)]">
        Mavsumiy agro va chorva tavsiyalari
      </p>

      <ul className="mt-6 space-y-3">
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
    </main>
  );
}
