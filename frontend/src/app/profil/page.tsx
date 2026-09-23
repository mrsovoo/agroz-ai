import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import ProfileEdit from "@/components/ProfileEdit";
import ProfileOrdersAndCalls from "@/components/ProfileOrdersAndCalls";
import CompactAlertStrip from "@/components/CompactAlertStrip";
import {
  Sprout,
  PawPrint,
  Phone,
  MapPin,
  ChevronRight,
  Send,
  BellRing,
  Pill,
  UsersRound,
  Newspaper,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="px-5 pb-6 pt-3">
        <p className="ios-sub">Profil</p>
        <h1 className="ios-title">Kirish</h1>
        <div className="ios-card mt-6 flex flex-col items-center gap-4 p-6 text-center">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[22px] text-[var(--brand-ink)]"
            style={{ background: "var(--brand-yellow)" }}
          >
            <Sprout size={32} />
          </div>
          <p className="text-[15px] leading-relaxed text-[var(--brand-ink)]">
            Yaqin dorixonalarni ko&apos;rish, mutaxassislar bilan bog&apos;lanish va savatingizni boshqarish uchun profilingizga kiring.
          </p>
          <div className="w-full max-w-sm space-y-2.5 pt-2">
            <Link href="/kirish" className="block w-full">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-95 transition"
                style={{ background: "#2AABEE" }}
              >
                <Send size={18} />
                <span>Telegram orqali 1 bosishda kirish</span>
              </button>
            </Link>
            <Link href="/kirish" className="block text-[13px] font-bold text-[var(--brand-green)] hover:underline">
              Yoki ismingiz bilan tezkor kirish →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pb-6 pt-3 web:grid web:grid-cols-[340px_minmax(0,1fr)] web:items-start web:gap-10">
      <div className="web:sticky web:top-24">
        <p className="ios-sub">Profil</p>
        <h1 className="ios-title">
          Salom{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>

        <section
          className="ios-card mt-5 p-5 text-white"
          style={{ background: "linear-gradient(135deg,#028e11,#76b44d)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black text-[var(--brand-ink)]"
              style={{ background: "var(--brand-yellow)" }}
            >
              {(user.name || user.phone || "F").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-[18px] font-black">{user.name || "Foydalanuvchi"}</p>
              {user.phone ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] opacity-90">
                  <Phone size={12} /> {user.phone}
                </p>
              ) : user.telegramId ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] opacity-90">
                  <Send size={12} /> TG ID: {user.telegramId}
                </p>
              ) : null}
              {user.region && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] opacity-90">
                  <MapPin size={12} /> {user.region}
                </p>
              )}
            </div>
          </div>
        </section>

        <ProfileEdit name={user.name} region={user.region} district={user.district} />

        <LogoutButton />
      </div>

      <div>
        {/* Mening Buyurtmalarim va Mutaxassis chaqiruvlari */}
        <ProfileOrdersAndCalls userPhone={user.phone} />

        {/* Hududiy ob-havo ogohlantirishlari */}
        <div className="mt-8 mb-6">
          <p className="ios-section-title flex items-center gap-1.5 web:mt-0">
            <BellRing size={14} className="text-red-500" /> Hududingizdagi muhim ob-havo xavflari
          </p>
          <CompactAlertStrip initialRegion={user.region || "Toshkent"} />
        </div>

        <p className="ios-section-title mt-6 flex items-center gap-1.5 web:mt-0">
          <Pill size={14} /> Asosiy bo&apos;limlar
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/dorilar" className="block">
            <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)] active:scale-[0.98]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
                <Pill size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-neutral-900 leading-tight">Dorilar bozori</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 truncate">Ekin va chorva dori vositalari</p>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </Link>

          <Link href="/xarita" className="block">
            <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)] active:scale-[0.98]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
                <MapPin size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-neutral-900 leading-tight">Yaqin dorixonalar</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 truncate">Xaritadan 5 km radiusda topish</p>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </Link>

          <Link href="/mutaxassislar" className="block">
            <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)] active:scale-[0.98]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
                <UsersRound size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-neutral-900 leading-tight">Mutaxassislar</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 truncate">Agronom va veterinarlar</p>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </Link>

          <Link href="/yangiliklar" className="block">
            <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)] active:scale-[0.98]">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
                <Newspaper size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-black text-neutral-900 leading-tight">Maslahatlar</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 truncate">Foydali agro qo&apos;llanmalar</p>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
