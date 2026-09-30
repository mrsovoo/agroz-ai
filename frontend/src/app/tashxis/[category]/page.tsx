import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function DiagnosePage() {
  return (
    <div className="min-h-screen bg-white px-4 py-8 text-neutral-900 flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-neutral-100 bg-[#f8f9fa] p-6 text-center shadow-2xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#039e1e]">
          <Sparkles size={32} />
        </div>
        <span className="mt-4 inline-block rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-[#039e1e]">
          Tez orada (2.0 versiyada)
        </span>
        <h1 className="mt-3 text-xl font-black tracking-tight text-neutral-900">
          AgrozGO Tashxis — tez kunda
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Ekin va chorva kasalliklarini rasm orqali aniqlash xizmati AgrozGO 2.0 versiyasida ishga tushiriladi. Hozircha dorilar va mutaxassislar xizmatidan foydalanishingiz mumkin.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link
            href="/dorilar"
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#039e1e] px-4 py-2.5 text-sm font-bold text-white transition active:scale-95"
          >
            Dorilar bo&apos;limiga o&apos;tish
          </Link>
          <Link
            href="/"
            className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-neutral-700 transition active:scale-95"
          >
            <ArrowLeft size={16} />
            Asosiy sahifa
          </Link>
        </div>
      </div>
    </div>
  );
}
