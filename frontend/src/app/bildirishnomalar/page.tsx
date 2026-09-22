import Link from "next/link";
import { ArrowLeft, Bell, ShieldCheck, Sparkles, Sprout, PawPrint, Info } from "lucide-react";
import WeatherAlertBanner from "@/components/WeatherAlertBanner";
import { getCurrentUser } from "@/lib/session";

export const metadata = {
  title: "Bildirishnomalar va Ogohlantirishlar — Agroz AI",
  description: "Shoshilinch ob-havo xavflari, dehqon va chorvadorlar uchun tezkor tavsiyalar va xabarnomalar.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--brand-ink)] shadow-xs transition active:scale-95 hover:bg-neutral-50"
            aria-label="Orqaga qaytish"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-neutral-900 sm:text-2xl flex items-center gap-2">
              <Bell className="text-[var(--brand-green)]" size={22} />
              Bildirishnomalar
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Ob-havo xavflari, ekin/chorva choralari va tizim xabarnomalari
            </p>
          </div>
        </div>
      </div>

      {/* Shoshilinch ob-havo ogohlantirishlari bloki */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-neutral-800 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
            Shoshilinch Agro-Ogohlantirishlar
          </h2>
          <span className="text-xs font-semibold text-neutral-500">
            {user?.region ? `Hudud: ${user.region}` : "O'zbekiston"}
          </span>
        </div>

        <WeatherAlertBanner initialRegion={user?.region ?? "Toshkent"} />
      </div>

      {/* Qo'shimcha foydali tavsiyalar va xabarlar */}
      <div className="mt-8 space-y-4">
        <h3 className="text-[15px] font-bold text-neutral-800">Tizim va Xizmat Eslatmalari</h3>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-xs flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Sprout size={20} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-neutral-900">Mavsumiy Fitotashxis Tayyorgarligi</h4>
            <p className="mt-1 text-[13px] leading-snug text-neutral-600">
              Ushbu mavsumda harorat o&apos;zgarishi sababli ekinlarda zang va chirish xavfi kuchayadi.
              Zararlangan barglar rasmini AI tashxisiga yuklab, bepul profilaktika rejasini oling.
            </p>
            <Link
              href="/tashxis/crop"
              className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand-green)] hover:underline"
            >
              Tashxisdan o&apos;tish &rarr;
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-black/5 shadow-xs flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <PawPrint size={20} />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-neutral-900">Veterinariya Maslahati</h4>
            <p className="mt-1 text-[13px] leading-snug text-neutral-600">
              Sovuq kunlarda mollarning suv ichish tartibi va issiq to&apos;shama holatini tekshirib turing.
              Yaqin atrofdagi veterinar bilan xarita orqali bog&apos;lanishingiz mumkin.
            </p>
            <Link
              href="/mutaxassislar"
              className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand-green)] hover:underline"
            >
              Mutaxassislarni ko&apos;rish &rarr;
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
