import Link from "next/link";
import WeatherCard from "@/components/WeatherCard";
import CompactAlertStrip from "@/components/CompactAlertStrip";
import NotificationBell from "@/components/NotificationBell";
import FeaturedMedicines from "@/components/FeaturedMedicines";
import { getCurrentUser, getUserRecentDiagnoses } from "@/lib/session";
import {
  Sprout,
  PawPrint,
  MapPin,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  Newspaper,
  UsersRound,
  Tractor,
  Wheat,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const recent = user ? await getUserRecentDiagnoses() : [];

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
              <Sprout size={16} className="text-[var(--brand-green)]" />
              Ekin va chorva uchun AI yordamchingiz
            </p>

            {/* Faqat katta ekranda ko'rinadigan asosiy harakatlar */}
            <div className="hidden web:mt-7 web:flex web:flex-wrap web:gap-3">
              <Link
                href="/tashxis/crop"
                className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_30px_-18px_rgba(2,142,17,0.9)] transition hover:brightness-105"
                style={{ background: "var(--brand-green)" }}
              >
                <Sprout size={18} /> Tashxis boshlash
              </Link>
              <Link
                href="/xarita"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-[15px] font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-green)]/40 hover:text-[var(--brand-green)]"
              >
                <MapPin size={18} /> Yaqin dorixonalar
              </Link>
              <Link
                href="/yangiliklar"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3.5 text-[15px] font-bold text-[var(--brand-ink)] transition hover:border-[var(--brand-green)]/40 hover:text-[var(--brand-green)]"
              >
                <Newspaper size={18} /> Maslahatlar
              </Link>
            </div>
          </div>

          {/* Mobil uchun bildirishnomalar va profil/kirish */}
          <div className="mt-1 flex items-center gap-2 web:hidden">
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
          {/* Ixcham ob-havo xavf lentasi — ekranni to'sib qo'ymaydi */}
          <CompactAlertStrip initialRegion={user?.region ?? "Toshkent"} />
        </div>
      </div>

      <p className="ios-section-title mt-7">Xizmatlar</p>

      <div className="space-y-3 web:mt-0 web:grid web:grid-cols-3 web:gap-6 web:space-y-0">
        <Link href="/tashxis/crop" className="block">
          <div
            className="hover-lift flex h-full items-center gap-4 rounded-[28px] p-5 shadow-[0_20px_40px_-24px_rgba(2,142,17,0.5)] transition-transform active:scale-[0.98] web:flex-col web:items-start web:p-7"
            style={{ background: "linear-gradient(135deg,#ffffff,#f2faec)" }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-white"
              style={{ background: "var(--brand-green)" }}
            >
              <Sprout size={32} strokeWidth={2} />
            </div>
            <div className="flex-1 web:mt-1">
              <p className="text-[20px] font-black text-[var(--brand-ink)]">Ekinlar uchun</p>
              <p className="text-[14px] text-[var(--brand-muted)]">
                Rasmga oling, AI tashxis qo&apos;yadi
              </p>
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
            className="hover-lift flex h-full items-center gap-4 rounded-[28px] p-5 shadow-[0_20px_40px_-24px_rgba(252,189,0,0.55)] transition-transform active:scale-[0.98] web:flex-col web:items-start web:p-7"
            style={{ background: "linear-gradient(135deg,#ffffff,#fff9e6)" }}
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              <PawPrint size={32} strokeWidth={2} />
            </div>
            <div className="flex-1 web:mt-1">
              <p className="text-[20px] font-black text-[var(--brand-ink)]">Hayvonlar uchun</p>
              <p className="text-[14px] text-[var(--brand-muted)]">
                Chorva va parranda kasalliklari
              </p>
            </div>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              <ArrowRight size={18} />
            </span>
          </div>
        </Link>

        <Link href="/xarita" className="block">
          <div className="hover-lift flex h-full items-center gap-4 rounded-[24px] bg-[var(--brand-ink)] p-5 text-white shadow-lg transition-transform active:scale-[0.98] web:flex-col web:items-start web:p-7">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[16px] text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              <MapPin size={24} />
            </div>
            <div className="flex-1 web:mt-1">
              <p className="text-[18px] font-black">Yaqin atrofdan dori topish</p>
              <p className="text-[13px] opacity-80">GPS bo&apos;yicha eng yaqin nuqtalar</p>
            </div>
            <ChevronRight size={22} className="web:hidden" />
          </div>
        </Link>

        {/* Tez kunda qo'shiladigan bo'limlar — qulflangan holda ko'rsatiladi */}
        {[
          {
            title: "Mening fermam",
            desc: "Chorva, yem va xo'jalik hisobi",
            Icon: Tractor,
          },
          {
            title: "Mening ekinim",
            desc: "Ekin maydonlari va hosil nazorati",
            Icon: Wheat,
          },
        ].map(({ title, desc, Icon }) => (
          <div
            key={title}
            aria-disabled="true"
            className="relative cursor-not-allowed select-none"
          >
            <div className="flex h-full items-center gap-4 rounded-[28px] border border-dashed border-black/15 bg-white/55 p-5 web:flex-col web:items-start web:p-7">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-slate-200/80 text-slate-400">
                <Icon size={30} />
              </div>
              <div className="flex-1 web:mt-1">
                <p className="text-[20px] font-black text-[var(--brand-ink)]/70">{title}</p>
                <p className="text-[14px] text-[var(--brand-muted)]">{desc}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-white">
                <Lock size={12} /> Tez kunda
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Agro Bozor — 4 ta dori kartochkasi, to'liq ro'yxat /dorilar sahifasida */}
      <FeaturedMedicines />

      {/* @agroz_auth_bot orqali ro'yxatdan o'tgan mutaxassislar */}
      <Link href="/mutaxassislar" className="mt-3 block web:mt-6">
        <div className="hover-lift flex items-center gap-4 rounded-[24px] border border-black/5 bg-white p-4 shadow-sm transition-transform active:scale-[0.98] web:p-5">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
            style={{ background: "#dbeafe", color: "#2563eb" }}
          >
            <UsersRound size={24} />
          </span>
          <div className="flex-1">
            <p className="text-[16px] font-black text-[var(--brand-ink)]">
              Mutaxassislar va dorixona egalari
            </p>
            <p className="text-[13px] text-[var(--brand-muted)]">
              5 km ichidagi eng yaqin mutaxassisni toping — ro&apos;yxatdan o&apos;tish @agroz_auth_bot orqali
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-[var(--brand-muted)]" />
        </div>
      </Link>

      {/* Katta ekranda qo'shimcha kontekst */}
      <div className="mt-6 hidden web:grid web:grid-cols-3 web:gap-6">
        <div className="web-hero-note ios-card flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
          >
            <Sparkles size={20} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[var(--brand-ink)]">AI tashxis</p>
            <p className="text-[13.5px] leading-snug text-[var(--brand-muted)]">
              Rasm, matn yoki ovoz bilan — 10 soniyada javob
            </p>
          </div>
        </div>

        <div className="ios-card flex items-center gap-4 p-5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }}
          >
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-[15px] font-bold text-[var(--brand-ink)]">Tasdiqlangan dorilar</p>
            <p className="text-[13.5px] leading-snug text-[var(--brand-muted)]">
              Faqat O&apos;zbekiston bozoridagi preparatlar
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
            <p className="text-[15px] font-bold text-[var(--brand-ink)]">24/7 ishlaydi</p>
            <p className="text-[13.5px] leading-snug text-[var(--brand-muted)]">
              Telegram botda va saytda bir xil imkoniyat
            </p>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <>
          <p className="ios-section-title mt-7">Oxirgi tashxislar</p>
          <ul className="ios-card divide-y divide-[var(--brand-sep)] web:grid web:grid-cols-2 web:divide-y-0">
            {recent.map((d) => (
              <li key={d.id} className="web:border-b web:border-[var(--brand-sep)]">
                <Link
                  href={`/natija/${d.id}`}
                  className="flex items-center gap-3 px-4 py-4 transition-colors active:bg-black/5 web:py-5"
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
