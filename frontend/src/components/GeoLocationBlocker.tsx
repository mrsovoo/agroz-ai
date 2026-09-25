"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Globe, Sparkles, ExternalLink, ShieldAlert, ArrowRight } from "lucide-react";

const COUNTRY_DATA: Record<string, { name: string; flag: string }> = {
  KZ: { name: "Qozog'iston", flag: "🇰🇿" },
  KG: { name: "Qirg'iziston", flag: "🇰🇬" },
  TJ: { name: "Tojikiston", flag: "🇹🇯" },
  TM: { name: "Turkmaniston", flag: "🇹🇲" },
  RU: { name: "Rossiya", flag: "🇷🇺" },
  TR: { name: "Turkiya", flag: "🇹🇷" },
  AF: { name: "Afg'oniston", flag: "🇦🇫" },
  AZ: { name: "Ozarbayjon", flag: "🇦🇿" },
  US: { name: "AQSH", flag: "🇺🇸" },
  DE: { name: "Germaniya", flag: "🇩🇪" },
  CN: { name: "Xitoy", flag: "🇨🇳" },
  AE: { name: "BAA", flag: "🇦🇪" },
};

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export default function GeoLocationBlocker() {
  const pathname = usePathname();
  const [isBlocked, setIsBlocked] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  useEffect(() => {
    // Admin yoki autentifikatsiya sahifalari hech qachon bloklanmaydi
    if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/kirish"))) {
      setIsBlocked(false);
      return;
    }

    // Admin sessiyasi mavjud bo'lsa bloklanmaydi
    if (
      typeof document !== "undefined" &&
      (document.cookie.includes("agroz_admin_sid") ||
        (typeof localStorage !== "undefined" && localStorage.getItem("agroz_admin_session")))
    ) {
      setIsBlocked(false);
      return;
    }

    // URL orqali test qilish imkoni:
    // ?geo_test=foreign -> chet eldan kirgandek bloklash kartochkasini chiqaradi
    // ?geo_test=uz yoki ?bypass_geo=1 -> bloklamaydi
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("geo_test=foreign")) {
        setDetectedCountry("KZ");
        setIsBlocked(true);
        return;
      }
      if (search.includes("geo_test=uz") || search.includes("bypass_geo=1")) {
        sessionStorage.setItem("agroz_geo_country", "UZ");
        setIsBlocked(false);
        return;
      }
    }

    // Sessiya keshini tekshirish (sahifadan sahifaga o'tganda qayta so'rov yubormaslik uchun)
    const cachedCountry = sessionStorage.getItem("agroz_geo_country");
    if (cachedCountry) {
      if (cachedCountry === "UZ") {
        setIsBlocked(false);
      } else {
        setDetectedCountry(cachedCountry);
        setIsBlocked(true);
      }
      return;
    }

    // Hududni aniqlash zanjiri (Backend -> Tashqi Geo API)
    detectCountry();
  }, [pathname]);

  async function detectCountry() {
    try {
      // 1. Backend /api/geo/check orqali Cloudflare/Proxy headerlarini tekshirish
      const res = await fetch("/api/geo/check", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.country && data.country !== "UNKNOWN") {
          sessionStorage.setItem("agroz_geo_country", data.country);
          if (data.country === "UZ") {
            setIsBlocked(false);
            return;
          } else {
            setDetectedCountry(data.country);
            setIsBlocked(true);
            return;
          }
        }
      }
    } catch {
      /* backend check davom etadi */
    }

    try {
      // 2. Tashqi ultra-tezkor va bepul GeoIP API (CORS ruxsat berilgan)
      const ctrl = new AbortController();
      const tId = setTimeout(() => ctrl.abort(), 3000);
      const extRes = await fetch("https://api.country.is/", { signal: ctrl.signal });
      clearTimeout(tId);

      if (extRes.ok) {
        const extData = await extRes.json();
        const code = (extData.country || "").toUpperCase().trim();
        if (code) {
          sessionStorage.setItem("agroz_geo_country", code);
          if (code === "UZ") {
            setIsBlocked(false);
            return;
          } else {
            setDetectedCountry(code);
            setIsBlocked(true);
            return;
          }
        }
      }
    } catch {
      // 3. Fallback ikkinchi API
      try {
        const ctrl2 = new AbortController();
        const tId2 = setTimeout(() => ctrl2.abort(), 3000);
        const fbRes = await fetch("https://ipwho.is/", { signal: ctrl2.signal });
        clearTimeout(tId2);
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          const code = (fbData.country_code || "").toUpperCase().trim();
          if (code) {
            sessionStorage.setItem("agroz_geo_country", code);
            if (code === "UZ") {
              setIsBlocked(false);
              return;
            } else {
              setDetectedCountry(code);
              setIsBlocked(true);
              return;
            }
          }
        }
      } catch {
        // Agar barcha so'rovlar xato bersa, platformani bloklamaymiz (fail-open)
        setIsBlocked(false);
      }
    }
  }

  if (!isBlocked) {
    return null;
  }

  const countryInfo = detectedCountry ? COUNTRY_DATA[detectedCountry] : null;
  const countryDisplayName = countryInfo
    ? `${countryInfo.flag} ${countryInfo.name}`
    : detectedCountry
    ? `🌐 ${detectedCountry}`
    : "Boshqa hudud";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-center my-8 overflow-hidden">
        {/* Yuqori dekorativ chiziq */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/80 mb-4 shadow-xs">
          <span>🇺🇿</span>
          <span>O&apos;zbekiston hududi uchun</span>
        </div>

        {/* Asosiy ikonka */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 shadow-inner mb-4">
          <Globe size={32} className="animate-pulse" />
        </div>

        {/* Sarlavha */}
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
          Xizmat sizning davlatingizda hozircha mavjud emas
        </h2>

        {/* Aniqlangan davlat ko'rsatkichi */}
        {detectedCountry && (
          <div className="mt-2.5 inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Aniqlangan joylashuv: <span className="text-slate-900 font-bold">{countryDisplayName}</span>
          </div>
        )}

        {/* Asosiy tushuntirish matni */}
        <div className="mt-4 space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Hurmatli foydalanuvchi, <b>Agroz AI</b> agro-platformasi ayni vaqtda faqat{" "}
            <b>O&apos;zbekiston Respublikasi</b> hududidagi dehqon, fermer va chorvadorlar uchun to&apos;liq
            xizmat ko&apos;rsatmoqda.
          </p>
          <p className="text-slate-700 font-medium bg-amber-50/80 border border-amber-200/70 p-3 rounded-xl text-xs">
            ✨ Keyingi yangilanishlarimizda qo&apos;shni va boshqa davlatlar hududlarini ham qamrab olishni
            albatta reja qilganmiz!
          </p>
        </div>

        {/* Instagram Reklama & Sahifalari */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-left">
          <p className="text-xs font-bold text-slate-800 text-center mb-3">
            🌱 Loyiha yangiliklari va foydali maslahatlardan boxabar bo&apos;lish uchun rasmiy
            Instagram sahifalarimizni kuzatib boring:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* 1. agro.yordam */}
            <a
              href="https://instagram.com/agro.yordam"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col justify-between rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50/60 to-purple-50/40 p-3.5 transition-all hover:border-pink-400 hover:shadow-md active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white shadow-xs">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-pink-600 transition" />
                </div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-pink-700 transition">
                  @agro.yordam
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-600 leading-tight">
                  Ekinlar parvarishi, kasalliklar va agronom maslahatlari
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-pink-700">
                <span>Kuzatish</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
              </div>
            </a>

            {/* 2. ferma.max */}
            <a
              href="https://instagram.com/ferma.max"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col justify-between rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-indigo-50/40 p-3.5 transition-all hover:border-purple-400 hover:shadow-md active:scale-98"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white shadow-xs">
                    <InstagramIcon className="w-4 h-4" />
                  </div>
                  <ExternalLink size={14} className="text-slate-400 group-hover:text-purple-600 transition" />
                </div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition">
                  @ferma.max
                </h4>
                <p className="mt-0.5 text-[11px] text-slate-600 leading-tight">
                  Chorvachilik, ferma boshqaruvi va veterinariya tavsiyalari
                </p>
              </div>

              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-700">
                <span>Kuzatish</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition" />
              </div>
            </a>
          </div>

          {/* Telegram kanal / bot linki */}
          <div className="mt-3 rounded-xl bg-sky-50/60 border border-sky-200/80 p-2.5 text-center">
            <a
              href="https://t.me/agroz_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-sky-800 hover:underline inline-flex items-center gap-1"
            >
              <span>Telegram orqali foydalanish:</span>
              <span className="font-extrabold text-sky-900">@agroz_bot</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Pastki yordamchi qism (Admin kirishi yoki xabardorlik) */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Agroz AI Ecosystem</span>
          <a
            href="/admin"
            className="hover:text-slate-600 hover:underline transition"
          >
            Admin sifatida kirish
          </a>
        </div>
      </div>
    </div>
  );
}
