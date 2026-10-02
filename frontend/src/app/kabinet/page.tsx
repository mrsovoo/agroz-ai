"use client";

import { useEffect, useState } from "react";
import { Package, PhoneCall, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Power } from "lucide-react";
import { haptic } from "@/lib/telegram";

/** Backend URL — Vercel rewrites ishlamasa ham backend'ga to'g'ridan-to'g'ri boradi */
const BACKEND =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
  "https://agroz-ai-backend-production.up.railway.app";
type PartnerOrder = {
  id: number;
  pharmacySpecialistId: number;
  customerName: string;
  customerPhone: string | null;
  totalSum: number | null;
  status: string;
  createdAt: string;
  items: { id: number; name: string; qty: number; price: number | null }[];
};

type PartnerCall = {
  id: number;
  specialistId: number;
  customerName: string;
  customerPhone: string | null;
  problem: string;
  address: string | null;
  status: string;
  createdAt: string;
};

export default function PartnerKabinetPage() {
  const [initData, setInitData] = useState<string>("");
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"orders" | "calls">("orders");
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [calls, setCalls] = useState<PartnerCall[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      tg.setHeaderColor?.("#fcbd00");
      tg.setBackgroundColor?.("#f2f3f5");
      if (tg.initData) {
        setInitData(tg.initData);
        setIsTelegram(true);
      }
    }
  }, []);

  async function loadData(tgData = initData) {
    if (!tgData) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-telegram-init-data": tgData,
      };

      const [ordersRes, callsRes] = await Promise.allSettled([
        fetch(`${BACKEND}/api/bot/partner/orders`, { headers }),
        fetch(`${BACKEND}/api/bot/partner/calls`, { headers }),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const d = await ordersRes.value.json();
        if (d?.ok && Array.isArray(d.orders)) {
          setOrders(d.orders);
        }
      }

      if (callsRes.status === "fulfilled" && callsRes.value.ok) {
        const d = await callsRes.value.json();
        if (d?.ok && Array.isArray(d.calls)) {
          setCalls(d.calls);
          // Agar chaqiruvlar ko'proq bo'lsa (mutaxassis), tabni chaqiruvlarga o'tkazamiz
          if (d.calls.length > 0 && orders.length === 0) {
            setActiveTab("calls");
          }
        }
      }
    } catch {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initData) {
      loadData(initData);
    } else {
      setLoading(false);
    }
  }, [initData]);

  async function handleOrderAction(orderId: number, action: "confirm" | "cancel" | "ready" | "done") {
    haptic("medium");
    setActionBusyId(orderId);
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/orders/${orderId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ action, initData }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o))
        );
        loadData(initData);
      }
    } catch {
      alert("Amalni bajarib bo'lmadi");
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleCallAction(callId: number, action: "accept" | "reject" | "done") {
    haptic("medium");
    setActionBusyId(callId);
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/calls/${callId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ action, initData }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        setCalls((prev) =>
          prev.map((c) => (c.id === callId ? { ...c, status: data.status } : c))
        );
        loadData(initData);
      }
    } catch {
      alert("Amalni bajarib bo'lmadi");
    } finally {
      setActionBusyId(null);
    }
  }

  async function toggleBusy() {
    haptic("medium");
    const next = !isBusy;
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/busy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ isBusy: next, initData }),
      });
      const data = await res.json();
      if (data?.ok) {
        setIsBusy(data.isBusy);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] pb-24 text-neutral-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3 shadow-xs">
        <div>
          <h1 className="text-base font-black tracking-tight text-neutral-900">AgrozGO Hamkor Kabineti</h1>
          <p className="text-[12px] font-medium text-neutral-500">Bron va chaqiruvlar boshqaruvi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(initData)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 active:scale-95 transition"
            title="Yangilash"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-[#039e1e]" : ""} />
          </button>
          <button
            type="button"
            onClick={toggleBusy}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-bold transition active:scale-95 shadow-2xs ${
              isBusy ? "bg-red-100 text-red-700 border border-red-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            <Power size={13} />
            <span>{isBusy ? "Band" : "Bo'sh"}</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-neutral-200/70 p-1">
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setActiveTab("orders");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold transition ${
              activeTab === "orders" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Package size={16} />
            <span>Bronlar ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setActiveTab("calls");
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold transition ${
              activeTab === "calls" ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <PhoneCall size={16} />
            <span>Chaqiruvlar ({calls.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3">
        {!isTelegram && (
          <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 flex items-start gap-2 shadow-2xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
            <div>
              <b>Eslatma:</b> Ushbu kabinet Telegram <b>@agroz_auth_bot</b> orqali kirganingizda profilingiz bilan avtomatik bog&apos;lanadi.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* 1. Bronlar ro'yxati */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && !loading && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-400">
                <Package size={36} className="mx-auto mb-2 opacity-40 text-neutral-500" />
                <p className="text-sm font-bold text-neutral-700">Hozircha yangi bronlar yo&apos;q</p>
                <p className="text-xs text-neutral-500 mt-1">Mijozlar mahsulot bron qilganda shu yerda paydo bo&apos;ladi</p>
              </div>
            )}

            {orders.map((ord) => {
              const isWorking = actionBusyId === ord.id;
              const statusColor =
                ord.status === "yangi"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : ord.status === "tasdiqlandi"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : ord.status === "tayyor"
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : ord.status === "yetkazildi"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-red-100 text-red-800 border-red-200";

              const statusText =
                ord.status === "yangi"
                  ? "Yangi bron"
                  : ord.status === "tasdiqlandi"
                  ? "Tasdiqlangan"
                  : ord.status === "tayyor"
                  ? "Olib ketishga tayyor"
                  : ord.status === "yetkazildi"
                  ? "Yetkazildi"
                  : "Bekor qilingan";

              return (
                <div key={ord.id} className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2">
                    <span className="text-[13px] font-black text-neutral-800">Bron #{ord.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold border ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="space-y-1 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Mijoz:</span>
                      <span className="font-bold text-neutral-900">{ord.customerName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Telefon:</span>
                      {ord.customerPhone ? (
                        <a href={`tel:${ord.customerPhone}`} className="font-bold text-[#039e1e] hover:underline">
                          {ord.customerPhone}
                        </a>
                      ) : (
                        <span className="text-xs italic text-neutral-400">Tasdiqlangach ko&apos;rinadi</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Jami summa:</span>
                      <span className="font-black text-neutral-900">
                        {ord.totalSum ? `${ord.totalSum.toLocaleString("uz-UZ")} so'm` : "Kelishiladi"}
                      </span>
                    </div>
                  </div>

                  {/* Mahsulotlar ro'yxati */}
                  {ord.items && ord.items.length > 0 && (
                    <div className="mt-2.5 rounded-xl bg-neutral-50 p-2 text-xs border border-neutral-100">
                      <span className="font-bold text-neutral-600 block mb-1">Mahsulotlar:</span>
                      <ul className="space-y-1">
                        {ord.items.map((it) => (
                          <li key={it.id} className="flex justify-between text-neutral-700">
                            <span>• {it.name}</span>
                            <span className="font-bold">× {it.qty} ta</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tugmalar */}
                  <div className="mt-3 flex gap-2">
                    {ord.status === "yangi" && (
                      <>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "confirm")}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#039e1e] py-2 text-[12px] font-black text-white active:scale-95 transition shadow-2xs disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          <span>Tasdiqlash</span>
                        </button>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "cancel")}
                          className="flex items-center justify-center gap-1 rounded-xl bg-neutral-100 px-3 py-2 text-[12px] font-bold text-red-600 active:scale-95 transition disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          <span>Mahsulot yo&apos;q</span>
                        </button>
                      </>
                    )}

                    {ord.status === "tasdiqlandi" && (
                      <>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "ready")}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-purple-600 py-2 text-[12px] font-black text-white active:scale-95 transition shadow-2xs disabled:opacity-50"
                        >
                          <Clock size={14} />
                          <span>Tayyor bo&apos;ldi</span>
                        </button>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "cancel")}
                          className="rounded-xl bg-neutral-100 px-3 py-2 text-[12px] font-bold text-neutral-600"
                        >
                          Bekor qilish
                        </button>
                      </>
                    )}

                    {ord.status === "tayyor" && (
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => handleOrderAction(ord.id, "done")}
                        className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-[12px] font-black text-white active:scale-95 transition shadow-2xs disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>Mijoz olib ketdi (Yakunlash)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Chaqiruvlar ro'yxati */}
        {activeTab === "calls" && (
          <div className="space-y-3">
            {calls.length === 0 && !loading && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-neutral-400">
                <PhoneCall size={36} className="mx-auto mb-2 opacity-40 text-neutral-500" />
                <p className="text-sm font-bold text-neutral-700">Hozircha chaqiruvlar yo&apos;q</p>
                <p className="text-xs text-neutral-500 mt-1">Fermerlar yordam so&apos;raganda shu yerda chiqadi</p>
              </div>
            )}

            {calls.map((c) => {
              const isWorking = actionBusyId === c.id;
              const statusColor =
                c.status === "yangi"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : c.status === "qabul_qilindi"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : c.status === "bajarildi"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-red-100 text-red-800 border-red-200";

              const statusText =
                c.status === "yangi"
                  ? "Yangi chaqiruv"
                  : c.status === "qabul_qilindi"
                  ? "Qabul qilingan"
                  : c.status === "bajarildi"
                  ? "Yakunlangan"
                  : "Rad etilgan";

              return (
                <div key={c.id} className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2">
                    <span className="text-[13px] font-black text-neutral-800">Chaqiruv #{c.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold border ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="space-y-1 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Mijoz:</span>
                      <span className="font-bold text-neutral-900">{c.customerName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Telefon:</span>
                      {c.customerPhone ? (
                        <a href={`tel:${c.customerPhone}`} className="font-bold text-[#039e1e] hover:underline">
                          {c.customerPhone}
                        </a>
                      ) : (
                        <span className="text-xs italic text-neutral-400">Qabul qilingach ko&apos;rinadi</span>
                      )}
                    </div>

                    {c.address && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-neutral-500 shrink-0">Manzil:</span>
                        <span className="text-right text-neutral-700">{c.address}</span>
                      </div>
                    )}

                    <div className="mt-2 rounded-xl bg-neutral-50 p-2.5 text-xs border border-neutral-100">
                      <span className="font-bold text-neutral-600 block mb-0.5">Muammo tavsifi:</span>
                      <p className="text-neutral-800 whitespace-pre-wrap">{c.problem}</p>
                    </div>
                  </div>

                  {/* Tugmalar */}
                  <div className="mt-3 flex gap-2">
                    {c.status === "yangi" && (
                      <>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleCallAction(c.id, "accept")}
                          className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#039e1e] py-2 text-[12px] font-black text-white active:scale-95 transition shadow-2xs disabled:opacity-50"
                        >
                          <CheckCircle2 size={14} />
                          <span>Qabul qilish</span>
                        </button>
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleCallAction(c.id, "reject")}
                          className="flex items-center justify-center gap-1 rounded-xl bg-neutral-100 px-3 py-2 text-[12px] font-bold text-red-600 active:scale-95 transition disabled:opacity-50"
                        >
                          <XCircle size={14} />
                          <span>Rad etish</span>
                        </button>
                      </>
                    )}

                    {c.status === "qabul_qilindi" && (
                      <button
                        type="button"
                        disabled={isWorking}
                        onClick={() => handleCallAction(c.id, "done")}
                        className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-[12px] font-black text-white active:scale-95 transition shadow-2xs disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>Chaqiruvni yakunlash</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
