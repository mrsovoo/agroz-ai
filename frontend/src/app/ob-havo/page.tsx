"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Sun,
  Moon,
  Wind,
  Droplets,
  CloudRain,
  Sprout,
  Sunrise,
  Sunset,
  RefreshCw,
  Sparkles,
  Leaf,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { haptic } from "@/lib/telegram";

type DayForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  sunrise?: string;
  sunset?: string;
  rainSum?: number;
  rainProb?: number;
  windMax?: number;
  weatherCode?: number;
};

type WeatherData = {
  temp: number;
  tempDay?: number;
  tempNight?: number;
  isDay?: boolean;
  sunrise?: string;
  sunset?: string;
  wind: number;
  humidity: number;
  rain: number;
  soilTemp?: number;
  sprayStatus?: "good" | "moderate" | "bad";
  sprayLabel?: string;
  sprayReason?: string;
  frostRisk?: boolean;
  agroAdvice?: string;
  level: "ok" | "caution" | "warning" | "danger";
  advice: string;
  adviceNight?: string;
  daily?: DayForecast[];
};

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [place, setPlace] = useState("Hudud aniqlanmoqda");
  const [region, setRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const loadWeather = (lat?: number, lng?: number) => {
    setIsLoading(true);
    const q = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : "";

    fetch(`/api/weather${q}`)
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.temp === "number") {
          setWeather(d);
        }
      })
      .catch((err) => {
        console.error("Ob-havo yuklash xatosi:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    if (lat !== undefined && lng !== undefined) {
      fetch(`/api/location?lat=${lat}&lng=${lng}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.region) {
            setRegion(d.region);
            setPlace(d.district ? `${d.region}, ${d.district}` : d.region);
          } else if (d?.place) {
            setPlace(d.place);
            setRegion(d.place);
          }
        })
        .catch(() => {});
    }
  };

  const requestLocation = () => {
    haptic("medium");
    setIsLocating(true);
    setLocError(null);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const { latitude, longitude } = pos.coords;
          try {
            sessionStorage.setItem("user_lat", String(latitude));
            sessionStorage.setItem("user_lng", String(longitude));
          } catch {}
          loadWeather(latitude, longitude);
        },
        (err) => {
          setIsLocating(false);
          console.warn("Geolokatsiya ruxsat etilmadi:", err.message);
          setLocError("Joylashuvni aniqlab bo'lmadi. Toshkent ob-havosi ko'rsatilmoqda.");
          loadWeather();
        },
        { timeout: 10000, maximumAge: 10 * 60 * 1000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      loadWeather();
    }
  };

  useEffect(() => {
    // 1. Agar keshda koordinatalar bo'lsa darhol yuklaymiz
    let cachedLat: number | undefined;
    let cachedLng: number | undefined;
    try {
      const sLat = sessionStorage.getItem("user_lat");
      const sLng = sessionStorage.getItem("user_lng");
      if (sLat && sLng) {
        cachedLat = parseFloat(sLat);
        cachedLng = parseFloat(sLng);
      }
    } catch {}

    if (cachedLat !== undefined && cachedLng !== undefined) {
      loadWeather(cachedLat, cachedLng);
    } else {
      // Geolokatsiyani so'raymiz
      requestLocation();
    }
  }, []);

  const formatDayName = (dateStr: string, idx: number) => {
    if (idx === 0) return "Bugun";
    if (idx === 1) return "Ertaga";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("uz-UZ", { weekday: "long", day: "numeric", month: "short" }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 pt-3 pb-24 text-neutral-900">
      {/* 1. Header: Orqaga qaytish + Joylashuv */}
      <header className="flex items-center justify-between py-2">
        <Link
          href="/"
          onClick={() => haptic("light")}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-neutral-700 shadow-xs border border-neutral-200 active:scale-95 transition"
        >
          <ArrowLeft size={16} />
          <span>Asosiy</span>
        </Link>

        <button
          onClick={requestLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 border border-emerald-200 active:scale-95 transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLocating ? "animate-spin" : ""} />
          <span>{isLocating ? "Aniqlanmoqda..." : "Joylashuvni yangilash"}</span>
        </button>
      </header>

      {/* Joylashuv bildirishnomasi */}
      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-700">
          <MapPin size={15} className="text-emerald-600 shrink-0" />
          <span className="truncate">{place}</span>
        </div>
      </div>

      {locError && (
        <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[12px] text-amber-800 border border-amber-200 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-amber-600" />
          <span>{locError}</span>
        </div>
      )}

      {/* 2. Bugungi Ob-havo Katta Kartasi */}
      <div
        className="mt-3 relative overflow-hidden rounded-[26px] p-5 text-white shadow-[0_12px_32px_-8px_rgba(2,142,17,0.38)]"
        style={{ background: "linear-gradient(135deg, #028e11 0%, #0ba324 50%, #3ca020 100%)" }}
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/20 px-3 py-0.5 text-[11.5px] font-bold text-white border border-white/20 backdrop-blur">
            Bugungi ob-havo
          </span>
          <span className="text-[12px] font-medium text-white/90">
            {new Intl.DateTimeFormat("uz-UZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}
          </span>
        </div>

        {/* Harorat va 3D Quyosh */}
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[52px] font-black leading-none tracking-tight">
                {weather ? (weather.temp > 0 ? `+${weather.temp}` : weather.temp) : "+22"}
              </span>
              <span className="text-2xl font-bold text-white/90">°C</span>
            </div>

            <p className="mt-2 flex items-center gap-2.5 text-[13px] font-semibold text-white/95">
              <span className="flex items-center gap-1">
                <Sun size={14} className="text-yellow-300" />
                Kunduzi: +{weather?.tempDay ?? 26}°
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Moon size={14} className="text-sky-200" />
                Kechasi: +{weather?.tempNight ?? 14}°
              </span>
            </p>
          </div>

          {/* 3D Quyosh ikonka */}
          <div className="relative pr-1">
            <svg
              viewBox="0 0 100 100"
              className="w-[68px] h-[68px] drop-shadow-[0_6px_14px_rgba(251,191,36,0.45)]"
            >
              <defs>
                <radialGradient id="sunGradFull" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#fff5a5" />
                  <stop offset="45%" stopColor="#ffb703" />
                  <stop offset="100%" stopColor="#fb8500" />
                </radialGradient>
              </defs>
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
              <circle cx="50" cy="50" r="27" fill="url(#sunGradFull)" />
            </svg>
          </div>
        </div>

        {/* 🌅 Quyosh chiqishi va 🌇 Quyosh botishi soatlari */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-2xl bg-black/15 p-3 border border-white/10 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300">
              <Sunrise size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/80">Quyosh chiqishi</p>
              <p className="text-[14px] font-extrabold text-white">
                {weather?.sunrise || "06:15"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-400/20 text-orange-300">
              <Sunset size={20} />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/80">Quyosh botishi</p>
              <p className="text-[14px] font-extrabold text-white">
                {weather?.sunset || "18:45"}
              </p>
            </div>
          </div>
        </div>

        {/* 4 ta asosiy parametrlar: Shamol, Namlik, Yog'in, Tuproq */}
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-white/15 py-2 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
              <Wind size={11} /> Shamol
            </div>
            <p className="text-[13px] font-extrabold mt-0.5">{weather ? `${weather.wind} m/s` : "—"}</p>
          </div>

          <div className="rounded-xl bg-white/15 py-2 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
              <Droplets size={11} /> Namlik
            </div>
            <p className="text-[13px] font-extrabold mt-0.5">{weather ? `${weather.humidity}%` : "—"}</p>
          </div>

          <div className="rounded-xl bg-white/15 py-2 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
              <CloudRain size={11} /> Yog'in
            </div>
            <p className="text-[13px] font-extrabold mt-0.5">{weather ? `${weather.rain} mm` : "0 mm"}</p>
          </div>

          <div className="rounded-xl bg-white/15 py-2 px-1 backdrop-blur border border-white/10">
            <div className="flex items-center justify-center gap-1 text-[11px] opacity-85">
              <Sprout size={11} /> Tuproq
            </div>
            <p className="text-[13px] font-extrabold mt-0.5">
              {weather ? `+${weather.soilTemp ?? Math.round(weather.temp - 2)}°` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. 7 Kunlik Ob-havo Prognozi */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[18px] font-black tracking-tight text-neutral-900 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" />
            <span>7 kunlik ob-havo prognozi</span>
          </h2>
        </div>

        <div className="space-y-2.5">
          {weather?.daily && weather.daily.length > 0 ? (
            weather.daily.map((day, idx) => (
              <div
                key={day.date || idx}
                className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs transition hover:border-emerald-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <Sun size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-neutral-900 capitalize">
                        {formatDayName(day.date, idx)}
                      </p>
                      <p className="text-[11.5px] font-medium text-neutral-400">
                        {day.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[16px] font-black text-neutral-900">
                      +{day.tempMax}°
                    </span>
                    <span className="ml-1.5 text-[13px] font-bold text-neutral-400">
                      +{day.tempMin}°
                    </span>
                  </div>
                </div>

                {/* Quyosh va shamol ma'lumotlari */}
                <div className="mt-2.5 pt-2 border-t border-neutral-100 grid grid-cols-3 gap-2 text-[11.5px] text-neutral-600">
                  <div className="flex items-center gap-1 text-neutral-600">
                    <Sunrise size={13} className="text-amber-500 shrink-0" />
                    <span>{day.sunrise || "06:15"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-neutral-600">
                    <Sunset size={13} className="text-orange-500 shrink-0" />
                    <span>{day.sunset || "18:45"}</span>
                  </div>
                  <div className="flex items-center justify-end gap-1 font-semibold text-emerald-700">
                    <Wind size={13} className="shrink-0" />
                    <span>{day.windMax ?? 2.5} m/s</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Standart 7 kunlik ko'rinish (agar API hali yuklanayotgan bo'lsa)
            [0, 1, 2, 3, 4, 5, 6].map((i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const dateStr = d.toISOString().split("T")[0];
              const tMax = (weather?.tempDay ?? 25) + (i % 2 === 0 ? 1 : -1);
              const tMin = (weather?.tempNight ?? 13) + (i % 2 === 0 ? 0 : -1);

              return (
                <div
                  key={i}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <Sun size={20} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-neutral-900 capitalize">
                          {formatDayName(dateStr, i)}
                        </p>
                        <p className="text-[11.5px] font-medium text-neutral-400">
                          {dateStr}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[16px] font-black text-neutral-900">
                        +{tMax}°
                      </span>
                      <span className="ml-1.5 text-[13px] font-bold text-neutral-400">
                        +{tMin}°
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-neutral-100 grid grid-cols-3 gap-2 text-[11.5px] text-neutral-600">
                    <div className="flex items-center gap-1">
                      <Sunrise size={13} className="text-amber-500 shrink-0" />
                      <span>{weather?.sunrise || "06:15"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sunset size={13} className="text-orange-500 shrink-0" />
                      <span>{weather?.sunset || "18:45"}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 font-semibold text-emerald-700">
                      <Wind size={13} className="shrink-0" />
                      <span>{weather?.wind ?? 2.8} m/s</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. Qishloq xo'jaligi agro-tavsiyalari */}
      <section className="mt-6 rounded-2xl bg-white p-4 border border-neutral-200/80 shadow-xs">
        <h3 className="text-[15px] font-bold text-neutral-900 flex items-center gap-2">
          <Leaf size={16} className="text-emerald-600" />
          <span>Fermer uchun agro-tavsiyalar</span>
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
          {weather?.agroAdvice ||
            weather?.advice ||
            "Ob-havo sharoiti mo'tadil. Ekinlar parvarishi, o'g'itlash va agro-texnik tadbirlarni rejalashtirish uchun qulay fursat."}
        </p>
      </section>
    </div>
  );
}
