import Link from "next/link";
import { getCurrentUser, getUserRecentDiagnoses } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";
import ProfileEdit from "@/components/ProfileEdit";
import WeatherAlertBanner from "@/components/WeatherAlertBanner";
import { Sprout, PawPrint, Phone, MapPin, ChevronRight, History, Sparkles, Send, BellRing } from "lucide-react";

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
            Tashxis tarixini saqlash va yaqin dorixonalarni shaxsiylashtirish uchun Telegram yoki telefon raqam
            orqali kiring.
          </p>
          <Link href="/kirish" className="w-full max-w-sm">
            <button className="ios-btn">Kirish (Telegram / Telefon)</button>
          </Link>
        </div>
      </main>
    );
  }

  const history = await getUserRecentDiagnoses();

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
        {/* Hududiy ob-havo ogohlantirishlari */}
        <div className="mb-6">
          <p className="ios-section-title flex items-center gap-1.5 web:mt-0">
            <BellRing size={14} className="text-red-500" /> Hududingizdagi muhim ob-havo xavflari
          </p>
          <WeatherAlertBanner initialRegion={user.region || "Toshkent"} />
        </div>

        <p className="ios-section-title mt-6 flex items-center gap-1.5 web:mt-0">
          <History size={14} /> Tashxislar tarixi
        </p>
        {history.length === 0 ? (
          <div className="ios-card flex flex-col items-center gap-3 p-6 text-center text-[var(--brand-muted)] web:p-10">
            <Sparkles size={28} className="text-[var(--brand-green-light)]" />
            Hali tashxis qo&apos;yilmagan.
            <Link href="/" className="w-full web:max-w-xs">
              <button className="ios-btn yellow">Birinchi tashxisni boshlash</button>
            </Link>
          </div>
        ) : (
          <ul className="ios-card divide-y divide-[var(--brand-sep)] web:grid web:grid-cols-2 web:divide-y-0">
            {history.map((d) => (
              <li key={d.id} className="web:border-b web:border-[var(--brand-sep)]">
                <Link
                  href={`/natija/${d.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-black/5 web:py-4 web:hover:bg-black/[0.03]"
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
                    <p className="text-[15px] font-semibold text-[var(--brand-ink)] line-clamp-1">
                      {d.diseaseName}
                    </p>
                    <p className="text-[12px] text-[var(--brand-muted)]">
                      {d.source === "ai" ? "Gemini AI" : "Offlayn"} · {d.confidence ?? "—"}%
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--brand-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
