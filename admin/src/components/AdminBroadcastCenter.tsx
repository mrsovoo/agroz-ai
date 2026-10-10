"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Store,
  Users,
  UserCheck,
  Globe,
  Link as LinkIcon,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import AdminWeatherAlertsBroadcast from "@/components/AdminWeatherAlertsBroadcast";

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

type TargetAudience = "pharmacies" | "specialists" | "users" | "all";

interface RecipientCounts {
  pharmacies: number;
  specialists: number;
  users: number;
  total: number;
}

export default function AdminBroadcastCenter() {
  const [activeMode, setActiveMode] = useState<"custom" | "weather">("custom");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("pharmacies");
  const [region, setRegion] = useState("Barcha viloyatlar");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [signature, setSignature] = useState("AgrozGO");

  const [testTelegramId, setTestTelegramId] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [counts, setCounts] = useState<RecipientCounts>({
    pharmacies: 0,
    specialists: 0,
    users: 0,
    total: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState<{
    id: number;
    target: string;
    total: number;
    sentCount: number;
    failedCount: number;
    remaining: number;
    status: "jarayonda" | "tugadi" | "toxtadi" | string;
    createdAt?: string;
  } | null>(null);
  const [result, setResult] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
    sentCount?: number;
    failedCount?: number;
    totalTarget?: number;
  } | null>(null);

  useEffect(() => {
    fetchCounts();
    const saved = typeof window !== "undefined" ? localStorage.getItem("agroz_test_telegram_id") : null;
    if (saved) setTestTelegramId(saved);
  }, []);

  useEffect(() => {
    if (!activeBroadcast || activeBroadcast.status !== "jarayonda") return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("agroz_admin_session") || "super-admin-session"
        : "super-admin-session";

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/broadcasts/${activeBroadcast.id}`, {
          headers: {
            "x-admin-session": token,
            "x-super-admin": "true",
          },
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok && data.ok && data.broadcast) {
          const b = data.broadcast;
          setActiveBroadcast({
            id: b.id,
            target: b.target,
            total: b.total ?? 0,
            sentCount: b.sentCount ?? 0,
            failedCount: b.failedCount ?? 0,
            remaining: b.remaining ?? Math.max(0, (b.total ?? 0) - (b.sentCount ?? 0) - (b.failedCount ?? 0)),
            status: b.status || "jarayonda",
            createdAt: b.createdAt,
          });
          if (b.status === "tugadi" || b.status === "toxtadi") {
            setResult({
              ok: b.status === "tugadi",
              message:
                b.status === "tugadi"
                  ? `Ommaviy xabar yakunlandi: ${b.sentCount ?? 0} ta yuborildi, ${b.failedCount ?? 0} ta xatolik.`
                  : `Ommaviy xabar to'xtatildi: ${b.sentCount ?? 0} ta yuborildi, ${b.failedCount ?? 0} ta xatolik.`,
              sentCount: b.sentCount ?? 0,
              failedCount: b.failedCount ?? 0,
              totalTarget: b.total ?? 0,
            });
          }
        }
      } catch {
        // ignore transient polling error
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeBroadcast]);

  async function fetchCounts() {
    setLoadingCounts(true);
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("agroz_admin_session") || "super-admin-session"
        : "super-admin-session";

    try {
      const res = await fetch("/api/admin/messages/recipients-count", {
        headers: {
          "x-admin-session": token,
          "x-super-admin": "true",
        },
        credentials: "include",
      });
      const data = await res.json();
      if (data.ok) {
        setCounts({
          pharmacies: data.pharmacies ?? 0,
          specialists: data.specialists ?? 0,
          users: data.users ?? 0,
          total: data.total ?? 0,
        });
      }
    } catch (e) {
      console.error("Qabul qiluvchilarni sanashda xatolik:", e);
    } finally {
      setLoadingCounts(false);
    }
  }

  async function handleSendTest() {
    if (!message.trim() || !testTelegramId.trim()) return;
    setSendingTest(true);
    setResult(null);

    if (typeof window !== "undefined") {
      localStorage.setItem("agroz_test_telegram_id", testTelegramId.trim());
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("agroz_admin_session") || "super-admin-session"
        : "super-admin-session";

    try {
      const res = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session": token,
          "x-super-admin": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          targetType: targetAudience,
          testTelegramId: Number(testTelegramId.trim()),
          title: title.trim() || undefined,
          message: message.trim() || undefined,
          buttonText: buttonText.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          signature: signature.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          message: data.message || "Sinov xabari muvaffaqiyatli yuborildi!",
        });
      } else {
        setResult({
          ok: false,
          error: data.error || "Sinov xabarini yuborishda xatolik yuz berdi",
        });
      }
    } catch (error: any) {
      setResult({
        ok: false,
        error: error.message || "Tarmoq xatosi tufayli sinov xabari yuborilmadi",
      });
    } finally {
      setSendingTest(false);
    }
  }

  async function executeSendMessage() {
    if (!message.trim()) return;

    setSending(true);
    setResult(null);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("agroz_admin_session") || "super-admin-session"
        : "super-admin-session";

    try {
      const res = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-session": token,
          "x-super-admin": "true",
        },
        credentials: "include",
        body: JSON.stringify({
          targetType: targetAudience,
          title: title.trim() || undefined,
          message: message.trim() || undefined,
          buttonText: buttonText.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          region: targetAudience === "users" ? region : undefined,
          signature: signature.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.broadcastId) {
          const total = data.total ?? data.totalTarget ?? 0;
          setActiveBroadcast({
            id: Number(data.broadcastId),
            target: targetAudience,
            total,
            sentCount: data.sentCount ?? 0,
            failedCount: data.failedCount ?? 0,
            remaining: data.remaining ?? total,
            status: data.status || "jarayonda",
          });
        }
        setResult({
          ok: true,
          message: data.message || "Yuborish boshlandi!",
          sentCount: data.sentCount,
          failedCount: data.failedCount,
          totalTarget: data.totalTarget,
        });
        setTitle("");
        setMessage("");
        setButtonText("");
        setButtonUrl("");
        setImageUrl("");
      } else {
        setResult({
          ok: false,
          error: data.error || "Xabar yuborishda xatolik yuz berdi",
        });
      }
    } catch (error: any) {
      setResult({
        ok: false,
        error: error.message || "Tarmoq ulanishida xatolik tufayli xabar yuborilmadi",
      });
    } finally {
      setSending(false);
    }
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setShowConfirmModal(true);
  }

  const currentCount =
    targetAudience === "pharmacies"
      ? counts.pharmacies
      : targetAudience === "specialists"
      ? counts.specialists
      : targetAudience === "users"
      ? counts.users
      : counts.total;

  const audienceLabel =
    targetAudience === "pharmacies"
      ? "Dorixona egalari"
      : targetAudience === "specialists"
      ? "Mutaxassislar (Agronom & Veterinar)"
      : targetAudience === "users"
      ? "Oddiy foydalanuvchilar (Dehqon/Fermerlar)"
      : "Barcha foydalanuvchilar (Hamma)";

  return (
    <div className="space-y-6">
      {/* Yuqori rejim almashtirgich (Tabs) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveMode("custom")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition ${
              activeMode === "custom"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Send size={16} />
            <span>Markaziy Xabarnoma</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("weather")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition ${
              activeMode === "weather"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldAlert size={16} className={activeMode === "weather" ? "text-red-400" : "text-slate-400"} />
            <span>Shoshilinch Ob-hava</span>
          </button>
        </div>
      </div>

      {/* REJIM 1: Maxsus xabarnoma (Custom Message) */}
      {activeMode === "custom" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="text-emerald-600" size={22} />
                  Telegram Xabarlar Markazi
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Dorixona egalari, mutaxassislar yoki oddiy foydalanuvchilarga bot orqali rasmiy xabar yuborish
                </p>
              </div>

              <button
                type="button"
                onClick={fetchCounts}
                disabled={loadingCounts}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                <RefreshCw size={13} className={loadingCounts ? "animate-spin" : ""} />
                Statistikani yangilash
              </button>
            </div>

            {/* Qabul qiluvchi auditoriyasini tanlash */}
            <div className="mt-6">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                1. Xabar qabul qiluvchilar auditoriyasi:
              </label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Dorixonalar */}
                <button
                  type="button"
                  onClick={() => setTargetAudience("pharmacies")}
                  className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition ${
                    targetAudience === "pharmacies"
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        targetAudience === "pharmacies"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      <Store size={16} />
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      {counts.pharmacies} ta
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Dorixona egalari</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">@agroz_auth_bot</span>
                </button>

                {/* Mutaxassislar */}
                <button
                  type="button"
                  onClick={() => setTargetAudience("specialists")}
                  className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition ${
                    targetAudience === "specialists"
                      ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        targetAudience === "specialists"
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      <UserCheck size={16} />
                    </div>
                    <span className="text-xs font-black text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
                      {counts.specialists} ta
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Mutaxassislar</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Agronom va veterinar</span>
                </button>

                {/* Oddiy foydalanuvchilar */}
                <button
                  type="button"
                  onClick={() => setTargetAudience("users")}
                  className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition ${
                    targetAudience === "users"
                      ? "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        targetAudience === "users"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <Users size={16} />
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                      {counts.users} ta
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Foydalanuvchilar</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">@agrozai_bot (Dehqonlar)</span>
                </button>

                {/* Barchaga (Hamma) */}
                <button
                  type="button"
                  onClick={() => setTargetAudience("all")}
                  className={`relative flex flex-col items-start p-3.5 rounded-2xl border text-left transition ${
                    targetAudience === "all"
                      ? "border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        targetAudience === "all"
                          ? "bg-purple-600 text-white"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      <Globe size={16} />
                    </div>
                    <span className="text-xs font-black text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded-full">
                      {counts.total} ta
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Barchaga (Hamma)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">@agrozai_bot & @agroz_auth_bot</span>
                </button>
              </div>

              {/* Viloyat bo'yicha saralash (faqat foydalanuvchilar tanlanganda) */}
              {targetAudience === "users" && (
                <div className="mt-4 rounded-xl bg-amber-50/60 border border-amber-200/80 p-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-amber-900">Viloyat bo&apos;yicha filtrlash:</span>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-amber-800">
                    {region === "Barcha viloyatlar"
                      ? "Barcha viloyatlardagi dehqon va fermerlarga yuboriladi"
                      : `Faqat ${region}dagi dehqon va fermerlarga yuboriladi`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form va Jonli Ko'rinish (2 ustun) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Form ustuni (7/12) */}
            <form
              onSubmit={handleSendMessage}
              className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  2. Xabar ma&apos;lumotlari
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setTargetAudience("pharmacies");
                    setTitle("Yangi talab: Rasm va narx majburiy");
                    setMessage(
                      "Yangi talab: dori uchun rasm va narx majburiy. To'ldirilmagan dorilaringiz vaqtincha ko'rinmaydi.",
                    );
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  📋 Shablon: Rasm va narx majburiy (Dorixonalarga)
                </button>
              </div>

              {/* Sarlavha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xabar sarlavhasi (ixtiyoriy)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Hurmatli dorixona egalari diqqatiga!"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Xabar matni */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Xabar matni <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {message.length} belgi
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Xabar matnini shu yerga yozing. Yangi qatordan yozilgan satrlar Telegramda to'g'ri ko'rinadi..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Qo'shimcha havola / Tugma (ixtiyoriy) */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <LinkIcon size={14} className="text-emerald-600" />
                  Qo&apos;shimcha inline havola tugmasi (ixtiyoriy)
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tugma matni
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Masalan: Ilovaga o'tish"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tugma havolasi (URL)
                    </label>
                    <input
                      type="url"
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="https://agroz.uz..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rasm (ixtiyoriy) */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-emerald-600" />
                  Xabar rasmi (ixtiyoriy)
                </span>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image-1450x1080.jpg"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  Rekomendatsiya: 1450x1080 px, .jpg/.png, HTTPS. Rasm berilsa matn caption sifatida ishlatiladi.
                </p>
              </div>

              {/* Imzo / Pastki yozuv (ixtiyoriy) */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" />
                    Xabar imzosi / Pastki yozuv (ixtiyoriy)
                  </span>
                  {signature.trim() ? (
                    <button
                      type="button"
                      onClick={() => setSignature("")}
                      className="text-[10px] font-semibold text-red-500 hover:underline"
                    >
                      Imzoni olib tashlash
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSignature("AgrozGO")}
                      className="text-[10px] font-semibold text-emerald-600 hover:underline"
                    >
                      Standart: AgrozGO
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Masalan: AgrozGO (bo'sh qoldirilsa imzo qo'yilmaydi)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  Standart qiymat: <b>AgrozGO</b>. O&apos;zingiz xohlagancha o&apos;zgartirishingiz yoki xabarni imzosiz yuborish uchun tozalab qo&apos;yishingiz mumkin.
                </p>
              </div>

              {/* Background Broadcast Progress */}
              {activeBroadcast && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {activeBroadcast.status === "jarayonda" ? (
                        <Loader2 size={14} className="animate-spin text-emerald-600" />
                      ) : activeBroadcast.status === "tugadi" ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-600" />
                      )}
                      Ommaviy xabar #{activeBroadcast.id} holati:
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        activeBroadcast.status === "jarayonda"
                          ? "bg-blue-100 text-blue-700"
                          : activeBroadcast.status === "tugadi"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {activeBroadcast.status}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300"
                      style={{
                        width: `${
                          activeBroadcast.total > 0
                            ? Math.min(
                                100,
                                Math.round(
                                  ((activeBroadcast.sentCount + activeBroadcast.failedCount) /
                                    activeBroadcast.total) *
                                    100
                                )
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="rounded-lg bg-white p-2 border border-slate-200">
                      <span className="block text-[10px] text-slate-500">Jami</span>
                      <span className="font-black text-slate-900">{activeBroadcast.total}</span>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200">
                      <span className="block text-[10px] text-emerald-700">Yuborildi</span>
                      <span className="font-black text-emerald-800">{activeBroadcast.sentCount}</span>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2 border border-blue-200">
                      <span className="block text-[10px] text-blue-700">Qoldi</span>
                      <span className="font-black text-blue-800">{activeBroadcast.remaining}</span>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 border border-red-200">
                      <span className="block text-[10px] text-red-700">Xatolik</span>
                      <span className="font-black text-red-800">{activeBroadcast.failedCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Natija xabari */}
              {result && (
                <div
                  className={`rounded-xl p-3.5 text-xs font-medium flex items-start gap-2.5 ${
                    result.ok
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {result.ok ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{result.ok ? "Muvaffaqiyatli!" : "Xatolik yuz berdi"}</p>
                    <p className="mt-0.5 text-[11px]">
                      {result.message || result.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Sinov xabari yuborish (Test Send) */}
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  🧪 Menga sinov yuborish (Test)
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={testTelegramId}
                    onChange={(e) => setTestTelegramId(e.target.value)}
                    placeholder="Telegram ID raqamingiz (masalan: 123456789)"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    disabled={sendingTest || !testTelegramId.trim() || !message.trim()}
                    onClick={handleSendTest}
                    className="rounded-lg bg-slate-800 hover:bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {sendingTest ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    Sinov yuborish
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Ommaviy yuborishdan oldin xabar Telegramda qanday borishini o&apos;z profilingizda tekshirib ko&apos;ring.
                </p>
              </div>

              {/* Yuborish tugmasi */}
              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Xabar yuborilmoqda...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>
                      Xabarni {currentCount} ta {audienceLabel.toLowerCase()}ga yuborish
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Jonli ko'rinish ustuni (5/12) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Telegram Jonli Ko&apos;rinish
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    Preview
                  </span>
                </div>

                {/* Telegram chat qutisi */}
                <div className="rounded-2xl bg-[#0e1621] p-4 text-white shadow-inner font-sans">
                  {/* Bot header */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                    <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-xs text-white">
                      A
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        AgrozGO Bot
                        <span className="inline-block h-3 w-3 rounded-full bg-sky-400 text-[8px] text-slate-900 text-center font-black leading-3">
                          ✓
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {targetAudience === "pharmacies" || targetAudience === "specialists"
                          ? "@agroz_auth_bot"
                          : "@agrozai_bot"}
                      </p>
                    </div>
                  </div>

                  {/* Message bubble */}
                  <div className="mt-3 rounded-xl bg-[#182533] p-3.5 text-xs text-slate-100 leading-relaxed border border-slate-800">
                    {title.trim() && (
                      <p className="font-bold text-sm text-emerald-400 mb-2">
                        📢 {title.trim()}
                      </p>
                    )}

                    <div className="whitespace-pre-wrap text-slate-200">
                      {message.trim() || (
                        <span className="italic text-slate-500">
                          Bu yerda yozilgan xabar matni Telegramda qanday ko&apos;rinishi aks etadi...
                        </span>
                      )}
                    </div>

                    {signature.trim() ? (
                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="italic">{signature.trim()}</span>
                        <span>
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-end text-[10px] text-slate-400">
                        <span>
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Inline Button Preview */}
                  {buttonText.trim() && (
                    <div className="mt-2">
                      <div className="w-full rounded-xl bg-[#2b5278] hover:bg-[#346391] py-2 px-3 text-center text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm">
                        <LinkIcon size={12} />
                        <span>{buttonText.trim()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900 leading-normal">
                💡 <b>Eslatma:</b> Telegram bot orqali yuborilgan xabarlar foydalanuvchiga to&apos;g&apos;ridan-to&apos;g&apos;ri shaxsiy xabar (push bildirishnoma) sifatida boradi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJIM 2: Ob-havo ogohlantirishlari (Existing Weather Alerts) */}
      {activeMode === "weather" && <AdminWeatherAlertsBroadcast />}

      {/* Tasdiqlash modali */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ommaviy xabarni tasdiqlash
                </h3>
                <p className="text-xs text-slate-500">
                  Ushbu amal barcha belgilangan qabul qiluvchilarga yuboriladi
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 space-y-1.5 border border-slate-200">
              <p>
                <b>Auditoriya:</b> {audienceLabel}
              </p>
              <p>
                <b>Qabul qiluvchilar soni:</b> <span className="font-bold text-emerald-700">{currentCount} ta</span>
              </p>
              <p>
                <b>Bot:</b> {targetAudience === "pharmacies" || targetAudience === "specialists" ? "@agroz_auth_bot" : "@agrozai_bot"}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  executeSendMessage();
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
              >
                Ha, {currentCount} kishiga yuborilsin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
