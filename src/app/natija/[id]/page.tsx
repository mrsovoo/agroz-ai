import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { diagnoses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import {
  ChevronLeft,
  Stethoscope,
  ClipboardList,
  Pill,
  RotateCcw,
  ShieldAlert,
  FileText,
  Cpu,
} from "lucide-react";
import TelegramBackButton from "@/components/TelegramBackButton";
import NearbyHelp from "@/components/NearbyHelp";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tashxis natijasi",
  description: "AI tashxisi, tavsiya etilgan yechim va dorilar ro'yxati.",
};

const severityStyle: Record<string, { bg: string; text: string; label: string }> = {
  past: { bg: "var(--brand-green-soft)", text: "var(--brand-green)", label: "Yengil" },
  orta: { bg: "var(--brand-yellow-soft)", text: "var(--brand-ink)", label: "O'rtacha" },
  yuqori: { bg: "var(--brand-red-soft)", text: "#d7263d", label: "Jiddiy" },
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const rows = await db.select().from(diagnoses).where(eq(diagnoses.id, numericId)).limit(1);
  const d = rows[0];
  if (!d) notFound();

  // Boshqa foydalanuvchining tashxis tarixini ID bo'yicha ko'rishning oldini olamiz.
  if (d.userId !== null) {
    const user = await getCurrentUser();
    if (!user || user.id !== d.userId) notFound();
  }

  let meds: string[] = [];
  try {
    meds = JSON.parse(d.medicines) as string[];
  } catch {
    meds = [];
  }
  const sev = severityStyle[d.severity ?? "orta"] ?? severityStyle.orta;
  const category: "crop" | "animal" = d.category === "animal" ? "animal" : "crop";

  return (
    <main className="px-5 pb-6">
      <TelegramBackButton href="/" />
      <div className="mb-5 flex items-center gap-3 pt-3">
        <Link
          href="/"
          aria-label="Orqaga"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
        >
          <ChevronLeft size={22} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[var(--brand-ink)] text-white">
            <Stethoscope size={20} />
          </span>
          <div>
            <p className="text-[12px] font-semibold text-[var(--brand-muted)]">Natija</p>
            <h1 className="text-[24px] font-black leading-tight">AI tashxisi</h1>
          </div>
        </div>
        <span
          className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold"
          style={{ background: sev.bg, color: sev.text }}
        >
          <ShieldAlert size={13} />
          {sev.label}
        </span>
      </div>

      <div className="web:grid web:grid-cols-[minmax(0,1fr)_380px] web:items-start web:gap-10">
        <div>
          <section
            className="rounded-[28px] p-5 text-white shadow-[0_20px_40px_-24px_rgba(2,142,17,.5)] web:p-8"
            style={{ background: "linear-gradient(135deg,#028e11,#76b44d)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-widest text-white/80">Tashxis</p>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                <Cpu size={11} />
                {d.source === "ai" ? "AI tahlili" : "Oflayn baza"}
              </span>
            </div>
            <h2 className="mt-1 text-[26px] font-black leading-tight web:text-[36px]">
              {d.diseaseName}
            </h2>
            <p className="mt-2 text-[13px] text-white/85">
              {d.category === "crop" ? "Ekin bo'limi" : "Chorva bo'limi"}
            </p>
          </section>

          <p className="ios-section-title mt-6 flex items-center gap-1.5">
            <ClipboardList size={14} /> Nima qilish kerak
          </p>
          <section className="ios-card p-5 web:p-7">
            <p className="whitespace-pre-line text-[16px] leading-[1.7] text-[var(--brand-ink)] web:text-[17px]">
              {d.solution}
            </p>
          </section>

          {d.inputText && (
            <>
              <p className="ios-section-title mt-5 flex items-center gap-1.5">
                <FileText size={14} /> Sizning tavsifingiz
              </p>
              <section className="ios-card p-4 text-[14px] leading-relaxed text-[var(--brand-ink)]">
                {d.inputText}
              </section>
            </>
          )}
        </div>

        <aside className="web:sticky web:top-24">
          <p className="ios-section-title mt-5 flex items-center gap-1.5 web:mt-0">
            <Pill size={14} /> Tavsiya etilgan dorilar
          </p>
          <section className="ios-card">
            {meds.length === 0 && (
              <p className="p-4 text-[var(--brand-muted)]">Dori tavsiya etilmadi.</p>
            )}
            <ul>
              {meds.map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-3 border-b border-[var(--brand-sep)] px-4 py-3.5 last:border-b-0"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: "var(--brand-green)" }}
                  >
                    <Pill size={16} />
                  </span>
                  <span className="flex-1 text-[15px] font-semibold text-[var(--brand-ink)]">
                    {m}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* AI tavsiya qilgan dorilarni yaqin dorixonalardan topish va kerak bo'lsa
              yaqin atrofdagi mutaxassisni ko'rsatish. */}
          <NearbyHelp category={category} medicines={meds} severity={d.severity ?? null} />

          <Link href={`/tashxis/${d.category}`} className="mt-3 block">
            <button className="ios-btn secondary">
              <RotateCcw size={18} />
              Yangi tashxis
            </button>
          </Link>

          <p className="mt-5 text-center text-[11px] text-[var(--brand-muted)]">
            AI xato qilishi mumkin. Jiddiy holatlarda mutaxassisga murojaat qiling.
          </p>
        </aside>
      </div>
    </main>
  );
}
