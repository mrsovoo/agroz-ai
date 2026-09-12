import Link from "next/link";
import WeatherCard from "@/components/WeatherCard";
import { getCurrentUser } from "@/lib/session";
import { ensureSeed } from "@/lib/seed";
import { db } from "@/db";
import { diagnoses } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Sprout, PawPrint, MapPin, ChevronRight, ArrowRight, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();
  const user = await getCurrentUser();
  const recent = user
    ? await db
        .select()
        .from(diagnoses)
        .where(eq(diagnoses.userId, user.id))
        .orderBy(desc(diagnoses.id))
        .limit(3)
    : [];

  return (
    <main className="px-5 pb-6">
      <header className="flex items-start justify-between pt-3">
        <div>
          <p className="ios-sub">
            {new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="ios-title mt-1">
            Salom{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-[var(--brand-muted)]">
            <Sprout size={16} className="text-[var(--brand-green)]" />
            Agro va chorva yordamchingiz
          </p>
        </div>
        <Link
          href={user ? "/profil" : "/kirish"}
          className="mt-1 flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[15px] font-bold text-[var(--brand-ink)] shadow-sm active:scale-95"
        >
          {user ? "Profil" : "Kirish"}
          <ChevronRight size={16} className="text-[var(--brand-muted)]" />
        </Link>
      </header>

      <div className="mt-5">
        <WeatherCard />
      </div>

      <p className="ios-section-title mt-7">Tashxis qo'yish</p>

      <div className="space-y-3">
        <Link href="/tashxis/crop" className="block">
          <div
            className="flex items-center gap-4 rounded-[28px] p-5 shadow-[0_20px_40px_-24px_rgba(2,142,17,0.5)] active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg,#ffffff,#f2faec)" }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-white"
              style={{ background: "var(--brand-green)" }}
            >
              <Sprout size={32} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-[20px] font-black text-[var(--brand-ink)]">Ekinlar uchun</p>
              <p className="text-[14px] text-[var(--brand-muted)]">Rasmga oling, AI tashxis qo'yadi</p>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: "var(--brand-green)" }}
            >
              <ArrowRight size={18} />
            </span>
          </div>
        </Link>

        <Link href="/tashxis/animal" className="block">
          <div
            className="flex items-center gap-4 rounded-[28px] p-5 shadow-[0_20px_40px_-24px_rgba(252,189,0,0.55)] active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg,#ffffff,#fff9e6)" }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              <PawPrint size={32} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="text-[20px] font-black text-[var(--brand-ink)]">Hayvonlar uchun</p>
              <p className="text-[14px] text-[var(--brand-muted)]">Chorva va parranda kasalliklari</p>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              <ArrowRight size={18} />
            </span>
          </div>
        </Link>
      </div>

      <Link href="/xarita" className="mt-3 block">
        <div className="flex items-center gap-4 rounded-[24px] bg-[var(--brand-ink)] p-5 text-white shadow-lg active:scale-[0.98]">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[16px] text-[var(--brand-ink)]"
            style={{ background: "var(--brand-yellow)" }}
          >
            <MapPin size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-black">Yaqin atrofdan dori topish</p>
            <p className="text-[13px] opacity-80">GPS bo'yicha eng yaqin nuqtalar</p>
          </div>
          <ChevronRight size={22} />
        </div>
      </Link>

      {recent.length > 0 && (
        <>
          <p className="ios-section-title mt-7">Oxirgi tashxislar</p>
          <ul className="ios-card divide-y divide-[var(--brand-sep)]">
            {recent.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/natija/${d.id}`}
                  className="flex items-center gap-3 px-4 py-4 active:bg-black/5"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      background:
                        d.category === "crop" ? "var(--brand-green-soft)" : "var(--brand-yellow-soft)",
                      color: d.category === "crop" ? "var(--brand-green)" : "var(--brand-ink)",
                    }}
                  >
                    {d.category === "crop" ? <Sprout size={19} /> : <PawPrint size={19} />}
                  </span>
                  <div className="flex-1">
                    <p className="text-[16px] font-semibold text-[var(--brand-ink)] line-clamp-1">
                      {d.diseaseName}
                    </p>
                    <p className="flex items-center gap-1 text-[13px] text-[var(--brand-muted)]">
                      <Clock size={12} />
                      {new Date(d.createdAt).toLocaleDateString("uz-UZ")}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--brand-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
