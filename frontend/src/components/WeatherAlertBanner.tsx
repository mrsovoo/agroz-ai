"use client";

import { useEffect, useState } from "react";
import {
  TriangleAlert,
  Snowflake,
  CloudRain,
  Wind,
  SunMedium,
  Send,
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Share2,
  Sparkles,
  Loader2,
  ShieldAlert,
  Sprout,
  PawPrint,
  Info,
} from "lucide-react";
import type { WeatherAlert, AlertType } from "@/lib/weather-alerts";

const REGIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Jizzax",
  "Navoiy",
  "Sirdaryo",
  "Qoraqalpog'iston",
];

const alertIcons: Record<AlertType, React.ReactNode> = {
  frost: <Snowflake className="animate-pulse text-cyan-600" size={24} />,
  heavy_rain: <CloudRain className="animate-bounce text-blue-600" size={24} />,
  storm_wind: <Wind className="text-amber-600" size={24} />,
  heatwave: <SunMedium className="text-orange-600" size={24} />,
  sudden_cold: <Snowflake className="text-indigo-600" size={24} />,
};

export default function WeatherAlertBanner({
  initialRegion,
  compact = false,
}: {
  initialRegion?: string;
  compact?: boolean;
}) {
  const [region, setRegion] = useState<string>(initialRegion || "Toshkent");
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [regionSelectorOpen, setRegionSelectorOpen] = useState(false);

  // Hudud bo'yicha ogohlantirishlarni yuklash
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/weather/alerts?region=${encodeURIComponent(region)}&sample=1`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.ok && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setAlerts(data.alerts);
          setSelectedIndex(0);
        }
      })
      .catch((e) => console.error("Alerts load error:", e))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [region]);

  const activeAlert = alerts[selectedIndex] ?? null;

  // Brauzer push bildirishnomasini so'rash va chiqarish
  async function enableBrowserNotification() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Sizning brauzeringizda bildirishnomalar qo'llab-quvvatlanmaydi.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        if (activeAlert) {
          new Notification(activeAlert.title, {
            body: `${activeAlert.dateText} — ${activeAlert.subtitle}`,
            icon: "/icon.svg",
          });
        }
        setSentNotice("Brauzer bildirishnomalari muvaffaqiyatli yoqildi!");
        setTimeout(() => setSentNotice(null), 4000);
      } else {
        alert("Bildirishnomalar uchun ruxsat berilmadi.");
      }
    } catch {
      alert("Bildirishnomani yoqishda xatolik yuz berdi.");
    }
  }

  // Telegram orqali xabar yuborish
  async function sendToTelegram() {
    if (!activeAlert) return;
    setSending(true);
    setSentNotice(null);

    try {
      const res = await fetch("/api/weather/alerts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert: activeAlert,
          channel: "telegram",
          customRegion: region,
        }),
      });

      const data = (await res.json()) as { ok: boolean; note?: string; previewText?: string };
      if (data.ok) {
        setSentNotice(data.note || "Ogohlantirish Telegramga yuborildi!");
      } else {
        setSentNotice("Xabar yuborishda xatolik.");
      }
    } catch {
      setSentNotice("Tarmoq xatosi yuz berdi.");
    } finally {
      setSending(false);
      setTimeout(() => setSentNotice(null), 6000);
    }
  }

  // Do'stlarga va guruhlarga ulashish (Telegram share)
  function shareAlert() {
    if (!activeAlert) return;
    const shareText = `⚠️ SHOSHILINCH AGRO-OGOHLANTIRISH (${activeAlert.region}):\n${activeAlert.title}\n${activeAlert.subtitle}\n\nEkin va chorvani himoyalash choralari: ${typeof window !== "undefined" ? window.location.href : "https://agroz.uz"}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent("https://agroz.uz")}&text=${encodeURIComponent(shareText)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  }

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 p-4 text-[14px] text-amber-900 border border-amber-500/20">
        <Loader2 size={18} className="animate-spin text-amber-600" />
        <span>Hududingiz bo&apos;yicha ob-havo xavflari tekshirilmoqda...</span>
      </div>
    );
  }

  if (!activeAlert) return null;

  const isFrost = activeAlert.type === "frost";
  const isRain = activeAlert.type === "heavy_rain";

  return (
    <section
      id="weather-alert-banner"
      aria-label="Ob-havo ogohlantirishlari"
      className={`relative overflow-hidden rounded-[24px] border transition-all ${
        isFrost
          ? "border-cyan-300/60 bg-gradient-to-br from-cyan-50 via-sky-50 to-white shadow-[0_12px_32px_-12px_rgba(6,182,212,0.25)]"
          : isRain
            ? "border-blue-300/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-white shadow-[0_12px_32px_-12px_rgba(59,130,246,0.25)]"
            : "border-amber-300/60 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-[0_12px_32px_-12px_rgba(245,158,11,0.25)]"
      } p-4 sm:p-5`}
    >
      {/* Yuqori qism: Xavf darajasi va Hudud tanlash */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 items-center gap-1.5 rounded-full bg-red-600 px-2.5 text-[11px] font-black uppercase tracking-wider text-white shadow-sm">
            <span className="h-2 w-2 rounded-full bg-white animate-ping" />
            Shoshilinch xabar
          </span>
          <span className="text-[12px] font-semibold text-neutral-600">
            {activeAlert.dateText}
          </span>
        </div>

        {/* Hududni almashtirish selektori */}
        <div className="relative">
          <button
            onClick={() => setRegionSelectorOpen(!regionSelectorOpen)}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12.5px] font-bold text-[var(--brand-ink)] shadow-xs border border-black/10 hover:bg-white active:scale-95 transition"
          >
            <MapPin size={13} className="text-[var(--brand-green)]" />
            <span>{region}</span>
            <ChevronDown size={14} className="text-neutral-400" />
          </button>

          {regionSelectorOpen && (
            <div className="absolute right-0 top-9 z-30 mt-1 max-h-56 w-48 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-xl">
              <p className="px-2.5 py-1 text-[11px] font-bold text-neutral-400 uppercase">
                Viloyatni tanlang:
              </p>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRegion(r);
                    setRegionSelectorOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-[13px] font-medium transition ${
                    r === region
                      ? "bg-[var(--brand-green-soft)] font-bold text-[var(--brand-green)]"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <span>{r}</span>
                  {r === region && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sarlavha va asosiy xabar */}
      <div className="mt-3.5 flex items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-black/5">
          {alertIcons[activeAlert.type] || <TriangleAlert className="text-amber-500" size={24} />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-extrabold leading-tight text-neutral-900 sm:text-[18px]">
            {activeAlert.title}
          </h2>
          <p className="mt-1 text-[13.5px] font-medium leading-snug text-neutral-700">
            {activeAlert.subtitle}
          </p>
        </div>
      </div>

      {/* Qo'shimcha xavf turlari (agar bir nechta bo'lsa tabs) */}
      {alerts.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {alerts.map((a, idx) => (
            <button
              key={a.id}
              onClick={() => setSelectedIndex(idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                idx === selectedIndex
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "bg-white/80 text-neutral-700 hover:bg-white border border-black/5"
              }`}
            >
              {a.type === "frost" ? "❄️ Sovuq urishi" : a.type === "heavy_rain" ? "🌧️ Kuchli yomg'ir" : "⚠️ Xavf"}
            </button>
          ))}
        </div>
      )}

      {/* Tezkor tavsiyalar (Accordion / Ochiladigan blok) */}
      <div className="mt-3.5 rounded-2xl bg-white/80 p-3 sm:p-4 border border-black/5">
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-bold text-neutral-900 flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-red-500" />
            Dehqon va chorvadorlar nima qilishi kerak?
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand-green)] hover:underline"
          >
            {expanded ? "Qisqartirish" : "Barcha choralar"}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Ekinlar va chorva choralari */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {/* Ekinlar */}
          <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-emerald-900">
              <Sprout size={15} className="text-emerald-600" /> Ekinlar va ko&apos;chatlar uchun:
            </p>
            <ul className="mt-1.5 space-y-1 text-[12.5px] leading-relaxed text-emerald-950">
              {(expanded ? activeAlert.actionItems.crop : activeAlert.actionItems.crop.slice(0, 2)).map(
                (item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Chorva */}
          <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-100">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-amber-900">
              <PawPrint size={15} className="text-amber-600" /> Chorva mollar uchun:
            </p>
            <ul className="mt-1.5 space-y-1 text-[12.5px] leading-relaxed text-amber-950">
              {(expanded ? activeAlert.actionItems.animal : activeAlert.actionItems.animal.slice(0, 2)).map(
                (item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Yuborilganlik holati xabari */}
      {sentNotice && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-3.5 py-2.5 text-[13px] font-medium shadow-sm animate-in fade-in">
          <Check size={16} className="shrink-0" />
          <span>{sentNotice}</span>
        </div>
      )}

      {/* Harakatlar paneli: Telegramga yuborish, Brauzer bildirishnomasi, Ulashish */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          onClick={sendToTelegram}
          disabled={sending}
          className="flex flex-1 min-w-[170px] items-center justify-center gap-2 rounded-xl bg-[var(--brand-green)] px-4 py-2.5 text-[13.5px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition disabled:opacity-60"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          <span>Telegramga ogohlantirish yuborish</span>
        </button>

        <button
          onClick={enableBrowserNotification}
          className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-neutral-800 border border-black/10 shadow-xs hover:bg-neutral-50 active:scale-95 transition"
        >
          <Bell size={15} className={pushEnabled ? "text-emerald-600" : "text-neutral-500"} />
          <span>{pushEnabled ? "Bildirishnoma yoqilgan" : "Brauzerda ogohlantirish"}</span>
        </button>

        <button
          onClick={shareAlert}
          title="Dehqonlarga ulashish"
          className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-neutral-800 border border-black/10 shadow-xs hover:bg-neutral-50 active:scale-95 transition"
        >
          <Share2 size={15} className="text-neutral-600" />
          <span className="hidden sm:inline">Ulashish</span>
        </button>
      </div>

      <p className="mt-2.5 flex items-center gap-1 text-[11.5px] font-medium text-neutral-500">
        <Info size={12} />
        Gidrometeorologiya va Open-Meteo tahlili asosida Agroz AI agro-tizimi tomonidan tayyorlandi.
      </p>
    </section>
  );
}
