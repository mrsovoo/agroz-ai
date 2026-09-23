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
  Link as LinkIcon,
  MousePointerClick,
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
  const [buttonText, setButtonText] = useState("🌐 Agroz AI platformasi");
  const [buttonUrl, setButtonUrl] = useState("https://agroz.uz");
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

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("agroz_admin_session") || "super-admin-session"
        : "super-admin-session";

    try {
      const res = await fetch("/api/admin/weather-alerts/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session": token,
          "x-super-admin": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          region,
          alertType,
          customTitle: customTitle.trim() || undefined,
          customMessage: customMessage.trim() || undefined,
          buttonText: buttonText.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
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
    <section className="mt-8 rounded-2xl bg-slate-900 p-6 ring-1 ring-slate-800 text-white">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="text-red-400" size={22} />
        <h2 className="font-bold text-white text-lg">
          🚨 Shoshilinch ob-havo va agro-ogohlantirishlarni tarqatish
        </h2>
      </div>
      <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
        Foydalanuvchilarga sovuq urishi, kuchli yomg&apos;ir yoki sel xavfi bo&apos;yicha agronomik va veterinariya tavsiyalari bilan shoshilinch Telegram xabari yuboring. Xabar tagida bosiladigan tugma (inline button) biriktiriladi.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Hududni tanlash */}
        <div>
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Xavf hududi
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-slate-800 px-3.5 py-2.5 text-sm text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
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
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
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

      {/* Sarlavha va matn */}
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
            className="mt-1 w-full rounded-xl bg-slate-800 px-3.5 py-2.5 text-sm text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Maxsus agronomik tavsiya / matn (ixtiyoriy):
          </label>
          <textarea
            rows={2}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Qo'shimcha tavsiya yoki harakatlar ketma-ketligini yozishingiz mumkin..."
            className="mt-1 w-full rounded-xl bg-slate-800 px-3.5 py-2.5 text-sm text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Telegram xabar tagidagi Tugma (Inline button) sozlamasi */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2.5">
            <MousePointerClick size={15} /> Xabar tagidagi Telegram tugmasi (Button):
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-400">Tugma matni:</label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="🌐 Agroz AI platformasi"
                className="mt-1 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400">Tugma havolasi (URL):</label>
              <div className="relative mt-1">
                <LinkIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  placeholder="https://agroz.uz"
                  className="w-full rounded-lg bg-slate-900 pl-8 pr-3 py-2 text-xs text-white border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yuborish tugmasi */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-400">
          * Xabar faqat belgilangan viloyatdagi faol Telegram foydalanuvchilariga yuboriladi.
        </p>

        <button
          type="button"
          onClick={handleBroadcast}
          disabled={sending}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-red-500 disabled:opacity-50 transition active:scale-95"
        >
          {sending ? (
            <>
              <Loader2 className="animate-spin" size={15} /> Yuborilmoqda...
            </>
          ) : (
            <>
              <Send size={15} /> Xabar Tarqatish
            </>
          )}
        </button>
      </div>

      {/* Natija */}
      {result && (
        <div
          className={`mt-4 rounded-xl p-4 text-xs font-medium border ${
            result.ok
              ? "bg-emerald-950/80 text-emerald-200 border-emerald-800"
              : "bg-red-950/80 text-red-200 border-red-800"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {result.ok ? (
              <CheckCircle2 className="text-emerald-400" size={18} />
            ) : (
              <AlertTriangle className="text-red-400" size={18} />
            )}
            <span>{result.note || (result.ok ? "Xabarnoma muvaffaqiyatli tarqatildi!" : "Xatolik yuz berdi")}</span>
          </div>

          {result.ok && typeof result.sentCount === "number" && (
            <div className="mt-2 space-y-1 text-slate-300">
              <p>
                Jami mo&apos;ljallangan foydalanuvchilar: <b>{result.totalTargetUsers} ta</b>
              </p>
              <p>
                Muvaffaqiyatli yetkazildi: <b className="text-emerald-400">{result.sentCount} ta</b>
              </p>
              {result.previewMessage && (
                <div className="mt-3 rounded-lg bg-slate-950 p-3 text-[11.5px] font-mono text-slate-400 border border-slate-800 whitespace-pre-wrap">
                  {result.previewMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
