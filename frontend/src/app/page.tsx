import Link from "next/link";
import WeatherCard from "@/components/WeatherCard";
import NotificationBell from "@/components/NotificationBell";
import CartButton from "@/components/CartButton";
import AdCarousel from "@/components/AdCarousel";
import HomeMedicinesShowcase, { type ShowcaseMedicine } from "@/components/HomeMedicinesShowcase";
import { getCurrentUser } from "@/lib/session";
import { apiUrl } from "@/lib/api-config";
import {
  MapPin,
  ChevronRight,
  ShieldCheck,
  Newspaper,
  UsersRound,
  Pill,
  Clock,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  // Real dorilar: API dan server-side olamiz (xato bo'lsa bo'sh array)
  let medicines: ShowcaseMedicine[] = [];
  try {
    const res = await fetch(apiUrl("/api/medicines?limit=16"), {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      medicines = await res.json();
    }
  } catch {
    // Tarmoq xatosi — bo'sh holat ko'rsatiladi
  }

  return (
    <main className="px-5 pb-6">
      {/* Hero: matn + ob-havo */}
      <div className="web:grid web:grid-cols-[minmax(0,1fr)_400px] web:items-start web:gap-10">
        <header className="flex items-start justify-between pt-3 web:block web:pt-4">
          <div>
            <p className="ios-sub">
              {new Date().toLocaleDateString("uz-UZ", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="ios-title mt-1">
              Salom{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-[var(--brand-muted)] web:text-[17px]">
              <Pill size={16} className="text-[var(--brand-green)]" />
              Ekin va chorva dori vositalari platformasi
            </p>

            {/* Faqat katta ekranda ko'rinadigan asosiy harakatlar */}
            <div className="hidden web:mt-7 web:flex web:flex-wrap web:gap-3">
              <Link
                href="/dorilar"
                className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_30px_-18px_rgba(2,142,17,0.9)] transition hover:brightness-105"
                style={{ background: "var(--brand-green)" }}
              >
                <Pill size={18} /> Barcha dorilar
              </Link>
              <Link
                href="/xarita"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-[15px] font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-green)]/40 hover:text-[var(--brand-green)]"
              >
                <MapPin size={18} /> Yaqin dorixonalar
              </Link>
              <Link
                href="/mutaxassislar"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-[15px] font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-green)]/40 hover:text-[var(--brand-green)]"
              >
                <UsersRound size={18} /> Mutaxassislar
              </Link>
              <Link
                href="/yangiliklar"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-[15px] font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-green)]/40 hover:text-[var(--brand-green)]"
              >
                <Newspaper size={18} /> Maslahatlar
              </Link>
            </div>
          </div>

          {/* Mobil uchun faqat bildirishnomalar qo'ng'irog'i (savat va profil pastki menyuda bor) */}
          <div className="mt-1 flex items-center web:hidden">
            <NotificationBell />
          </div>
        </header>

        <div className="mt-5 web:mt-0">
          <WeatherCard />
        </div>
      </div>

      {/* Reklama karuseli */}
      <div className="mt-5">
        <AdCarousel />
      </div>

      {/* TO'LIQ DORILAR VITRINASI — faqat real API ma'lumotlari */}
      <HomeMedicinesShowcase initialMedicines={medicines} />

      {/* Yaqin atrofdan dori topish va Mutaxassislar */}
      {/* Dehqonlar uchun asosiy 3 ta qulay va sokin bo'lim */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3 web:mt-8 web:gap-4">
        {/* 1. Dorilar bozori */}
        <Link href="/dorilar" className="block group">
          <div className="flex h-full items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-[var(--brand-green)] hover:shadow-xs active:scale-[0.98]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
              <Pill size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-black leading-tight text-neutral-900">Dorilar bozori</p>
              <p className="mt-0.5 text-[12px] text-neutral-500 truncate">
                Ekin va chorva dorilari
              </p>
            </div>
            <ChevronRight size={19} className="shrink-0 text-neutral-400 group-hover:text-[var(--brand-green)] transition-colors" />
          </div>
        </Link>

        {/* 2. Mutaxassis chaqirish */}
        <Link href="/mutaxassislar" className="block group">
          <div className="flex h-full items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-[var(--brand-green)] hover:shadow-xs active:scale-[0.98]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
              <UsersRound size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-black leading-tight text-neutral-900">Mutaxassis chaqirish</p>
              <p className="mt-0.5 text-[12px] text-neutral-500 truncate">
                Agronom va veterinarlar
              </p>
            </div>
            <ChevronRight size={19} className="shrink-0 text-neutral-400 group-hover:text-[var(--brand-green)] transition-colors" />
          </div>
        </Link>

        {/* 3. Yaqin dorixonalar xaritasi */}
        <Link href="/xarita" className="block group">
          <div className="flex h-full items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-[var(--brand-green)] hover:shadow-xs active:scale-[0.98]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
              <MapPin size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-black leading-tight text-neutral-900">Yaqin dorixonalar</p>
              <p className="mt-0.5 text-[12px] text-neutral-500 truncate">
                Xaritadan topish (5 km)
              </p>
            </div>
            <ChevronRight size={19} className="shrink-0 text-neutral-400 group-hover:text-[var(--brand-green)] transition-colors" />
          </div>
        </Link>
      </div>

      {/* Katta ekranda qo'shimcha ishonch belgilari */}
      <div className="mt-8 hidden web:grid web:grid-cols-3 web:gap-6">
        <div className="ios-card flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
          >
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[var(--brand-ink)]">Tasdiqlangan dorilar</p>
            <p className="text-[13px] leading-snug text-[var(--brand-muted)]">
              Faqat O&apos;zbekiston bozoridagi sertifikatlangan preparatlar
            </p>
          </div>
        </div>

        <div className="ios-card flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
          >
            <Sparkles size={20} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[var(--brand-ink)]">To&apos;g&apos;ridan-to&apos;g'ri buyurtma</p>
            <p className="text-[13px] leading-snug text-[var(--brand-muted)]">
              Dorixonalar bilan vositachisiz to&apos;g'ridan-to'g'ri aloqa
            </p>
          </div>
        </div>

        <div className="ios-card flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
          >
            <Clock size={20} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[var(--brand-ink)]">Tezkor yetkazish</p>
            <p className="text-[13px] leading-snug text-[var(--brand-muted)]">
              Dorixonadan olib ketish yoki manzilingizga kuryer orqali
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
