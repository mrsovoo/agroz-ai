"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Wind,
  Droplets,
  CloudRain,
  Sun,
  ThermometerSun,
  TriangleAlert,
  CheckCircle2,
  Sprout,
  PawPrint,
  Sparkles,
  MapPin,
  Leaf,
  Moon,
  ShieldAlert,
} from "lucide-react";

type AdviceScope = "crop" | "animal" | "both";
type Tip = { id: string; scope: AdviceScope; title: string; body: string };

type Weather = {
  temp: number;
  tempDay?: number;
  tempNight?: number;
  isDay?: boolean;
  sunrise?: string;
  sunset?: string;
  wind: number;
  humidity: number;
  rain: number;
  level: "ok" | "caution" | "warning" | "danger";
  advice: string;
  adviceNight?: string;
  tips?: Tip[];
};

const levelIcon: Record<Weather["level"], ReactNode> = {
  ok: <CheckCircle2 size={18} strokeWidth={2.4} />,
  caution: <ThermometerSun size={18} strokeWidth={2.4} />,
  warning: <TriangleAlert size={18} strokeWidth={2.4} />,
  danger: <TriangleAlert size={18} strokeWidth={2.4} />,
};

const scopeStyle: Record<AdviceScope, { bg: string; fg: string; icon: ReactNode; label: string }> = {
  crop: {
    bg: "var(--brand-green-soft)",
    fg: "var(--brand-green)",
    icon: <Sprout size={16} />,
    label: "Ekinlar uchun",
  },
  animal: {
    bg: "var(--brand-yellow-soft)",
    fg: "var(--brand-ink)",
    icon: <PawPrint size={16} />,
    label: "Chorva uchun",
  },
  both: { bg: "#dbeafe", fg: "#2563eb", icon: <Sparkles size={16} />, label: "Umumiy" },
};

export default function WeatherCard({
  showTips = false,
  showRegion = false,
  showDetails = false,
}: {
  showTips?: boolean;
  showRegion?: boolean;
  showDetails?: boolean;
}) {
  const [w, setW] = useState<Weather | null>(null);
  const [place, setPlace] = useState("Hudud aniqlanmoqda");
  const [region, setRegion] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<{ title: string; region: string } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const load = (lat?: number, lng?: number) => {
      const q = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : "";
      fetch(`/api/weather${q}`)
        .then((r) => r.json())
        .then((d: Weather) => {
          if (typeof d?.temp === "number") {
            setW(d);
            setLoadFailed(false);
          } else {
            setW(null);
            setLoadFailed(true);
          }
        })
        .catch(() => {
          setW(null);
          setLoadFailed(true);
        });

      // Real ogohlantirishlar
      fetch(`/api/weather/alerts${q}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok && Array.isArray(d.alerts) && d.alerts.length > 0) {
            setActiveAlert({ title: d.alerts[0].title, region: d.alerts[0].region });
          } else {
            setActiveAlert(null);
          }
        })
        .catch(() => setActiveAlert(null));

      // Manzilni aniqlash
      if (lat !== undefined && lng !== undefined) {
        fetch(`/api/location?lat=${lat}&lng=${lng}`)
          .then((r) => r.json())
          .then((d: { place?: string | null }) => {
            if (d?.place) {
              setPlace(d.place);
              setRegion(d.place);
            }
          })
          .catch(() => {});
      }
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPlace("Sizning hududingiz");
          load(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setPlace("Toshkent");
          load();
        },
        { timeout: 8000, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false },
      );
    } else {
      setPlace("Toshkent");
      load();
    }
  }, [showRegion]);



  // Real parametrlar asosida "Diqqat {manzil}" ogohlantirishini tuzish
  const advisory = (() => {
    const loc = activeAlert?.region || region || place || "Sizning hududingiz";

    if (activeAlert) {
      return {
        isHazard: true,
        tag: `⚠️ Diqqat (${loc}):`,
        text: activeAlert.title,
      };
    }
    if (!w) return null;

    if (w.wind >= 8) {
      return {
        isHazard: true,
        tag: `💨 Diqqat (${loc}):`,
        text: `Kuchli shamol (${w.wind} m/s) — dori purkash tavsiya etilmaydi, preparatlar havoga uchib yerga to'g'ri tushmaydi.`,
      };
    }
    if (w.wind >= 5) {
      return {
        isHazard: false,
        tag: `💨 Eslatma (${loc}):`,
        text: `O'rtacha shabada (${w.wind} m/s) — dori sepishda tomchilar sachramasligiga e'tibor bering yoki tinchroq vaqtni kuting.`,
      };
    }
    if (w.rain > 0.1) {
      return {
        isHazard: true,
        tag: `🌧️ Diqqat (${loc}):`,
        text: `Yog'ingarchilik (${w.rain} mm) — barglar ho'lligi sababli o'g'it va dorilashni to'xtating, preparatlar yuvilib ketadi.`,
      };
    }
    if (w.humidity < 30) {
      return {
        isHazard: false,
        tag: `☀️ Diqqat (${loc}):`,
        text: `Havo quruq (namlik ${w.humidity}%) — ekinlarda suv bug'lanishi kuchli, tomchilatib sug'orishni amalga oshiring.`,
      };
    }
    if (w.humidity > 80) {
      return {
        isHazard: false,
        tag: `🌿 Diqqat (${loc}):`,
        text: `Namlik yuqori (${w.humidity}%) — zamburug'li kasalliklar xavfi mavjud, profilaktik fungitsid qo'llang.`,
      };
    }
    if (typeof w.tempNight === "number" && w.tempNight <= 3) {
      return {
        isHazard: true,
        tag: `❄️ Diqqat (${loc}):`,
        text: `Kechasi harorat ${w.tempNight}°C gacha tushishi kutilmoqda — parnik va nozik ko'chatlarni himoyalang.`,
      };
    }
    if (w.temp >= 35) {
      return {
        isHazard: true,
        tag: `☀️ Diqqat (${loc}):`,
        text: `Yuqori harorat (${w.temp}°C) — kunduzgi quyosh tig'ida dorilamang, sug'orishni erta tongda bajaring.`,
      };
    }

    return {
      isHazard: false,
      tag: `✅ Diqqat (${loc}):`,
      text: `Hozirda ob-havo mo'tadil (harorat ${w.temp}°C, shamol ${w.wind} m/s) — dori purkash va dala ishlari uchun juda qulay.`,
    };
  })();

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-[26px] p-5 text-white shadow-[0_12px_30px_-10px_rgba(2,142,17,0.4)]"
        style={{ background: "linear-gradient(135deg, #028e11 0%, #0ba324 45%, #5db838 100%)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/95">
              <Sun size={14} className="text-yellow-200" /> Bugun · {region || "Toshkent"}
            </p>
            <div className="my-1 flex items-baseline gap-1">
              <span className="text-[52px] font-black leading-none tracking-tight">
                {w ? w.temp : "22"}
              </span>
              <span className="text-2xl font-bold text-white/90">°C</span>
            </div>

            {/* Kunduzi va Kechasi harorati */}
            <p className="mt-1.5 flex items-center gap-2 text-[12px] font-medium text-white/90">
              <span className="flex items-center gap-1">
                <Sun size={12} className="text-yellow-300" />
                Kunduzi: +{w?.tempDay ?? 28}°C
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Moon size={12} className="text-sky-200" />
                Kechasi: +{w?.tempNight ?? 18}°C
              </span>
            </p>
          </div>

          {/* 3D Quyosh illustratsiyasi */}
          <div className="relative pr-2 shrink-0">
            <svg viewBox="0 0 100 100" className="w-[84px] h-[84px] drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]">
              <defs>
                <radialGradient id="sunGrad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fff5a5" />
                  <stop offset="45%" stopColor="#ffb703" />
                  <stop offset="100%" stopColor="#fb8500" />
                </radialGradient>
              </defs>
              {/* 8 ta dumaloq nur */}
              <g fill="#ffc300">
                <rect x="47" y="5" width="6" height="14" rx="3" />
                <rect x="47" y="81" width="6" height="14" rx="3" />
                <rect x="5" y="47" width="14" height="6" rx="3" />
                <rect x="81" y="47" width="14" height="6" rx="3" />
                <rect x="18" y="18" width="6" height="14" rx="3" transform="rotate(-45 21 25)" />
                <rect x="76" y="76" width="6" height="14" rx="3" transform="rotate(-45 79 83)" />
                <rect x="76" y="18" width="6" height="14" rx="3" transform="rotate(45 79 25)" />
                <rect x="18" y="76" width="6" height="14" rx="3" transform="rotate(45 21 83)" />
              </g>
              {/* Markaziy quyosh shari */}
              <circle cx="50" cy="50" r="27" fill="url(#sunGrad)" />
            </svg>
          </div>
        </div>

        {/* 3 ta muhim parametr: Shamol, Namlik, Yog'in (faqat showDetails bo'lsa) */}
        {showDetails && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/15 py-2.5 backdrop-blur">
                <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
                  <Wind size={11} /> Shamol
                </div>
                <p className="text-base font-bold">{w ? `${w.wind} m/s` : "—"}</p>
              </div>
              <div className="rounded-2xl bg-white/15 py-2.5 backdrop-blur">
                <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
                  <Droplets size={11} /> Namlik
                </div>
                <p className="text-base font-bold">{w ? `${w.humidity}%` : "—"}</p>
              </div>
              <div className="rounded-2xl bg-white/15 py-2.5 backdrop-blur">
                <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
                  <CloudRain size={11} /> Yog'in
                </div>
                <p className="text-base font-bold">{w ? `${w.rain} mm` : "—"}</p>
              </div>
            </div>

            {/* Diqqat {manzil} Ogohlantirish va Agrometeorologik Tavsiya Bloki */}
            {advisory ? (
              <div
                className={`mt-4 flex items-start gap-2.5 rounded-[20px] px-4 py-3 text-[14px] font-semibold leading-snug transition-all ${
                  advisory.isHazard
                    ? "bg-amber-300 text-neutral-950 shadow-xs"
                    : "bg-white/20 border border-white/25 text-white backdrop-blur shadow-2xs"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {advisory.isHazard ? (
                    <TriangleAlert size={18} strokeWidth={2.4} className="text-amber-950" />
                  ) : (
                    <CheckCircle2 size={18} strokeWidth={2.4} className="text-white" />
                  )}
                </span>
                <span>
                  <b className={`font-extrabold mr-1.5 ${advisory.isHazard ? "text-amber-950" : "text-white"}`}>
                    {advisory.tag}
                  </b>
                  {advisory.text}
                </span>
              </div>
            ) : loadFailed ? (
              <div className="mt-4 rounded-[18px] bg-red-500/20 border border-red-500/30 px-4 py-3 text-[13px] text-white">
                Ob-havo ma&apos;lumotini yuklab bo&apos;lmadi. Qayta urinib ko&apos;ring.
              </div>
            ) : (
              <div className="mt-4 rounded-[18px] bg-white/10 px-4 py-3 text-[13px] text-white/80">
                Ob-havo ma&apos;lumotlari tahlil qilinmoqda...
              </div>
            )}
          </>
        )}
      </div>

      {/* Hudud va mavsumga qarab maslahatlar (agar showTips bo'lsa) */}
      {showTips && (
        <>
          <div className="mt-5 flex items-center justify-between gap-2">
            <p className="ios-section-title m-0 flex items-center gap-1.5">
              <Leaf size={14} /> Turgan joyingiz uchun maslahatlar
            </p>
          </div>

          {region && (
            <p className="mt-1 flex items-center gap-1 text-[12.5px] font-medium text-[var(--brand-muted)]">
              <MapPin size={12} /> {region}
            </p>
          )}

          {!w?.tips || w.tips.length === 0 ? (
            <p className="ios-card mt-2 p-4 text-[14px] text-[var(--brand-muted)]">
              {loadFailed
                ? "Maslahatlar uchun ob-havo ma'lumoti olinmadi."
                : "Maslahatlar yuklanmoqda..."}
            </p>
          ) : (
            <ul className="mt-2 space-y-2.5">
              {w.tips.map((t) => {
                const s = scopeStyle[t.scope] ?? scopeStyle.both;
                return (
                  <li key={t.id} className="ios-card flex items-start gap-3 p-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      {s.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-bold leading-tight text-[var(--brand-ink)]">
                        {t.title}
                      </p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
                        {t.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
