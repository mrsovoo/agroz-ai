"use client";

import { useState } from "react";
import {
  ShieldAlert,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Snowflake,
  CloudRain,
  Wind,
  SunMedium,
} from "lucide-react";

const REGIONS = [
  "Barcha viloyatlar",
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

export default function AdminWeatherAlertsBroadcast() {
  const [region, setRegion] = useState("Barcha viloyatlar");
  const [alertType, setAlertType] = useState<"frost" | "heavy_rain">("frost");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    note?: string;
    totalTargetUsers?: number;
    sentCount?: number;
    previewMessage?: string;
  } | null>(null);

  async function handleBroadcast() {
    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/weather-alerts/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          alertType,
          customTitle: customTitle.trim() || undefined,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, note: "Tarmoq xatosi tufayli yuborilmadi" });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800 text-white">
      <div className="flex items-center gap-2">
        <ShieldAlert className="text-red-400" size={20} />
        <h2 className="font-bold text-white text-base">
          🚨 Shoshilinch ob-havo ogohlantirishlarini yuborish
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate-400">
        Foydalanuvchilarga sovuq urishi, kuchli yomg&apos;ir yoki sel xavfi bo&apos;yicha agronomik va veterinariya tavsiyalari bilan shoshilinch Telegram xabari yuboring.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Hududni tanlash */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Xavf hududi
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1.5 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Xavf turi */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Ogohlantirish turi
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAlertType("frost")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-bold transition ${
                alertType === "frost"
                  ? "bg-cyan-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <Snowflake size={14} /> Sovuq urishi
            </button>
            <button
              type="button"
              onClick={() => setAlertType("heavy_rain")}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-bold transition ${
                alertType === "heavy_rain"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <CloudRain size={14} /> Kuchli yomg&apos;ir
            </button>
          </div>
        </div>
      </div>

      {/* Ixtiyoriy maxsus sarlavha va matn */}
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400">
            Maxsus sarlavha (bo&apos;sh qoldirilsa standart tayyor shablon ishlatiladi):
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={
              alertType === "frost"
                ? "Masalan: Diqqat: Tunda harorat -1°C gacha tushishi kutilmoqda!"
                : "Masalan: Diqqat: Viloyatda kuchli jala va sel xavfi!"
            }
            className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Yuborish natijasi */}
      {result && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm flex items-start gap-2.5 ${
            result.ok
              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800"
              : "bg-red-950/60 text-red-300 border border-red-800"
          }`}
        >
          {result.ok ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold">{result.note || (result.ok ? "Yuborildi" : "Xatolik")}</p>
            {result.previewMessage && (
              <details className="mt-2 text-xs text-slate-300">
                <summary className="cursor-pointer font-bold text-slate-400 hover:text-white">
                  Yuborilgan xabarnoma shabloni (HTML)
                </summary>
                <pre className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-slate-950 p-2 font-mono text-[11px] text-slate-300">
                  {result.previewMessage}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Yuborish tugmasi */}
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleBroadcast}
          disabled={sending}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-500 active:scale-95 transition disabled:opacity-50"
        >
          {sending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          <span>{region} foydalanuvchilariga xabar yuborish</span>
        </button>
      </div>
    </section>
  );
}
