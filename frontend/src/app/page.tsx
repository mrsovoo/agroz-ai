import Link from "next/link";
import WeatherCard from "@/components/WeatherCard";
import CompactAlertStrip from "@/components/CompactAlertStrip";
import NotificationBell from "@/components/NotificationBell";
import CartButton from "@/components/CartButton";
import HomeMedicinesShowcase from "@/components/HomeMedicinesShowcase";
import { getCurrentUser } from "@/lib/session";
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

          {/* Mobil uchun savat, bildirishnomalar va profil/kirish */}
          <div className="mt-1 flex items-center gap-2 web:hidden">
            <CartButton />
            <NotificationBell />
            <Link
              href={user ? "/profil" : "/kirish"}
              className="flex h-11 items-center gap-1.5 rounded-full bg-white px-4 text-[15px] font-bold text-[var(--brand-ink)] shadow-sm active:scale-95"
            >
              {user ? "Profil" : "Kirish"}
              <ChevronRight size={16} className="text-[var(--brand-muted)]" />
            </Link>
          </div>
        </header>

        <div className="mt-5 web:mt-0">
          <WeatherCard />
          {/* Ixcham ob-havo xavf lentasi */}
          <CompactAlertStrip initialRegion={user?.region ?? "Toshkent"} />
        </div>
      </div>

      {/* TO'LIQ DORILAR VITRINASI (Ekin va hayvon tashxisi o'rniga to'g'ridan-to'g'ri dori kartochkalari) */}
      <HomeMedicinesShowcase />

      {/* Yaqin atrofdan dori topish va Mutaxassislar */}
      <div className="mt-7 grid gap-3.5 sm:grid-cols-2 web:mt-9 web:gap-5">
        <Link href="/xarita" className="block">
          <div className="hover-lift flex h-full items-center gap-4 rounded-[24px] bg-[var(--brand-ink)] p-5 text-white shadow-lg transition-transform active:scale-[0.98]">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              <MapPin size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-black">Yaqin dorixonalar xaritasi</p>
              <p className="text-[13px] opacity-80">GPS bo&apos;yicha eng yaqin dorixonalarni toping</p>
            </div>
            <ChevronRight size={22} />
          </div>
        </Link>

        <div className="hover-lift flex flex-col justify-between gap-3 rounded-[24px] border border-black/5 bg-white p-5 shadow-sm">
          <Link href="/mutaxassislar" className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
              style={{ background: "#dbeafe", color: "#2563eb" }}
            >
              <UsersRound size={24} />
            </span>
            <div className="flex-1">
              <p className="text-[17px] font-black text-[var(--brand-ink)]">
                Mutaxassislar va dorixonalar
              </p>
              <p className="text-[13px] text-[var(--brand-muted)]">
                Agronomlar, veterinar shifokorlar va dorixona egalari
              </p>
            </div>
            <ChevronRight size={20} className="shrink-0 text-[var(--brand-muted)]" />
          </Link>
        </div>
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
