import Link from "next/link";
import DiagnoseForm from "@/components/DiagnoseForm";
import { notFound } from "next/navigation";
import { ChevronLeft, Info, Sprout, PawPrint } from "lucide-react";
import TelegramBackButton from "@/components/TelegramBackButton";

export default async function DiagnosePage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (category !== "crop" && category !== "animal") notFound();
  const isCrop = category === "crop";

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
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[14px] text-white"
            style={{ background: isCrop ? "var(--brand-green)" : "var(--brand-yellow)", color: isCrop ? "#fff" : "var(--brand-ink)" }}
          >
            {isCrop ? <Sprout size={20} /> : <PawPrint size={20} />}
          </span>
          <div>
            <p className="text-[12px] font-semibold text-[var(--brand-muted)]">Tashxis</p>
            <h1 className="text-[24px] font-black leading-tight">
              {isCrop ? "Ekinlar uchun" : "Hayvonlar uchun"}
            </h1>
          </div>
        </div>
      </div>

      <div
        className="flex items-start gap-2.5 rounded-[24px] p-4 text-[14px] leading-snug"
        style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
      >
        <Info size={18} className="mt-0.5 shrink-0" />
        <span>
          <b>Qanday ishlatish:</b> Kasal joyni yaqindan rasmga oling, galereyadan tanlang yoki
          muammoni gapirib bering. 5-10 soniyada AI tashxis qo'yadi.
        </span>
      </div>

      <div className="mt-4">
        <DiagnoseForm category={category} />
      </div>
    </main>
  );
}
