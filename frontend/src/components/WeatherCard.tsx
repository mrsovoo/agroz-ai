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
}: {
  showTips?: boolean;
  showRegion?: boolean;
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

  // Purkash sharoitini hisoblash
  const sprayCondition = (() => {
    if (!w) return null;
    if (w.rain > 0.1) {
      return { status: "bad", label: "Purkash tavsiya etilmaydi (yog'in bor)" };
    }
    if (w.wind >= 5) {
      return { status: "bad", label: `Purkash mumkin emas (shamol ${w.wind} m/s)` };
    }
    if (w.wind >= 3.5 || w.temp >= 33) {
      return { status: "fair", label: "Ehtiyotkorlik bilan (shamol o'rtacha)" };
    }
    return { status: "great", label: "Dori purkashga a'lo sharoit" };
  })();

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

    if (w.wind >= 5) {
      return {
        isHazard: true,
        tag: `💨 Diqqat (${loc}):`,
        text: `Kuchli shamol (${w.wind} m/s) — dori purkash samarasiz, preparatlar havoga uchib yerga to'g'ri tushmaydi.`,
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
        className="overflow-hidden rounded-[28px] p-5 text-white shadow-[0_20px_40px_-20px_rgba(2,142,17,0.45)]"
        style={{ background: "linear-gradient(135deg,#028e11 0%,#0a9c1b 50%,#76b44d 100%)" }}
      >
        {/* Joylashuv va Asosiy harorat */}
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-white/90">
              <Sun size={14} /> Bugun · {place}
            </p>
            <div className="mt-1.5 flex items-end gap-2">
              <span className="text-[54px] font-black leading-none tracking-tight">
                {w ? w.temp : "—"}
              </span>
              <span className="pb-2 text-2xl font-semibold text-white/80">°C</span>
            </div>

            {/* Kunduzi va Kechasi harorati */}
            {w && (
              <p className="mt-1 flex items-center gap-2 text-[12.5px] font-semibold text-white/85">
                <span className="flex items-center gap-1">
                  <Sun size={12} className="text-yellow-300" />
                  Kunduzi: +{w.tempDay ?? w.temp}°C
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Moon size={12} className="text-sky-200" />
                  Kechasi: +{w.tempNight ?? (w.temp - 6)}°C
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--brand-ink)] shadow-xs"
              style={{ background: "var(--brand-yellow)" }}
            >
              <Sun size={22} strokeWidth={2.2} />
            </div>

            {/* Purkash indeksi nishoni */}
            {sprayCondition && (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow-2xs ${
                  sprayCondition.status === "great"
                    ? "bg-emerald-800/80 text-emerald-100 border border-emerald-400/40"
                    : sprayCondition.status === "fair"
                      ? "bg-amber-800/80 text-amber-100 border border-amber-400/40"
                      : "bg-red-800/80 text-red-100 border border-red-400/40"
                }`}
              >
                {sprayCondition.label}
              </span>
            )}
          </div>
        </div>

        {/* 3 ta muhim parametr: Shamol, Namlik, Yog'in */}
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
