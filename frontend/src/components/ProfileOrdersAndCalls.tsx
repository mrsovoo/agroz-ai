"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Pill,
  UsersRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  ChevronRight,
  Phone,
  MapPin,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";

type OrderItem = {
  name: string;
  price: number;
  qty: number;
};

type UserOrder = {
  id: number;
  pharmacyName: string;
  pharmacyPhone: string | null;
  deliveryType: string;
  customerAddress: string | null;
  totalSum: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type UserCall = {
  id: number;
  specialistName: string;
  specialistPhone: string | null;
  specialistSpecialty: string | null;
  problem: string;
  address: string | null;
  status: string;
  createdAt: string;
};

export default function ProfileOrdersAndCalls({ userPhone }: { userPhone?: string | null }) {
  const [activeTab, setActiveTab] = useState<"medicines" | "specialists">("medicines");
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [calls, setCalls] = useState<UserCall[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = userPhone
        ? apiUrl(`/api/profile/activity?phone=${encodeURIComponent(userPhone)}`)
        : apiUrl("/api/profile/activity");
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setOrders(data.orders || []);
          setCalls(data.specialistCalls || []);
        }
      }
    } catch {
      // Tarmoq xatosi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userPhone]);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "yangi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <Clock size={11} /> Yangi
          </span>
        );
      case "tasdiqlandi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
            <CheckCircle2 size={11} /> Tasdiqlandi
          </span>
        );
      case "yetkazildi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> Yetkazildi
          </span>
        );
      case "bekor":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
            <AlertCircle size={11} /> Bekor qilingan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
            {status}
          </span>
        );
    }
  };

  const getCallStatusBadge = (status: string) => {
    switch (status) {
      case "yangi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <Clock size={11} /> Kutilmoqda
          </span>
        );
      case "qabul_qilindi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
            <CheckCircle2 size={11} /> Qabul qilindi
          </span>
        );
      case "bajarildi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> Bajarildi
          </span>
        );
      case "bekor":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
            <AlertCircle size={11} /> Bekor qilindi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
            {status}
          </span>
        );
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-black text-neutral-900 leading-tight">
            Mening Buyurtmalarim
          </h2>
          <p className="text-[12.5px] text-neutral-500 font-medium">
            Dorilar va mutaxassis chaqiruvlari tarixi
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-600 border border-black/10 hover:bg-neutral-50 active:scale-95 transition"
          title="Yangilash"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-neutral-200/60 p-1 border border-black/5 text-xs font-bold mb-4">
        <button
          onClick={() => setActiveTab("medicines")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
            activeTab === "medicines"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <Pill size={15} />
          <span>Dorilar ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("specialists")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
            activeTab === "specialists"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <UsersRound size={15} />
          <span>Mutaxassislar ({calls.length})</span>
        </button>
      </div>

      {/* Tab 1: Dorilar */}
      {activeTab === "medicines" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
                <ShoppingBag size={26} />
              </div>
              <h3 className="text-[16px] font-bold text-neutral-800">
                Hozircha dori buyurtma qilinmagan
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500 max-w-xs mx-auto">
                Katalogdan kerakli o&apos;g&apos;it, vaksina yoki dorilarni savatga qo&apos;shib buyurtma bering.
              </p>
              <Link href="/dorilar" className="inline-block mt-4">
                <button className="rounded-xl bg-[var(--brand-green)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition">
                  Dorilar bozoriga o&apos;tish →
                </button>
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)]/40"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-neutral-900">
                      Buyurtma #{ord.id}
                    </span>
                    {getOrderStatusBadge(ord.status)}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(ord.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <Store size={14} className="text-neutral-400 shrink-0" />
                    <span className="font-bold">{ord.pharmacyName}</span>
                    {ord.pharmacyPhone && (
                      <a href={`tel:${ord.pharmacyPhone}`} className="text-neutral-500 hover:underline font-mono">
                        ({ord.pharmacyPhone})
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Truck size={14} className="text-neutral-400 shrink-0" />
                    <span>
                      {ord.deliveryType === "delivery"
                        ? `Yetkazib berish: ${ord.customerAddress || "Manzil ko'rsatilgan"}`
                        : "Dorixonadan olib ketish"}
                    </span>
                  </div>

                  {/* Dorilar ro'yxati */}
                  <div className="rounded-xl bg-neutral-50 p-2.5 mt-2 border border-neutral-100">
                    <div className="divide-y divide-neutral-200/60">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 text-[11.5px]">
                          <span className="text-neutral-800 font-medium">💊 {it.name}</span>
                          <span className="font-mono text-neutral-600">
                            {it.qty} dona × {it.price.toLocaleString()} so&apos;m
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-neutral-200/80 pt-1.5 mt-1.5 flex items-center justify-between font-bold">
                      <span className="text-[11px] text-neutral-500">Jami to&apos;lov:</span>
                      <span className="font-mono text-[13px] text-neutral-900">
                        {ord.totalSum.toLocaleString()} so&apos;m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Mutaxassislar */}
      {activeTab === "specialists" && (
        <div className="space-y-3">
          {calls.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
                <UsersRound size={26} />
              </div>
              <h3 className="text-[16px] font-bold text-neutral-800">
                Hozircha mutaxassis chaqirilmagan
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500 max-w-xs mx-auto">
                Ekin yoki chorvangizda kasallik yoki zararkunandalar bo&apos;lsa, malakali agronom va veterinarlarni chaqiring.
              </p>
              <Link href="/mutaxassislar" className="inline-block mt-4">
                <button className="rounded-xl bg-[var(--brand-ink)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 active:scale-95 transition">
                  Mutaxassislarni ko&apos;rish →
                </button>
              </Link>
            </div>
          ) : (
            calls.map((call) => (
              <div
                key={call.id}
                className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)]/40"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-neutral-900">
                      Chaqiruv #{call.id}
                    </span>
                    {getCallStatusBadge(call.status)}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(call.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-[13.5px] text-neutral-900">
                        👨‍⚕️ {call.specialistName}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {call.specialistSpecialty || "Agronom / Veterinar"}
                      </p>
                    </div>
                    {call.specialistPhone && (
                      <a
                        href={`tel:${call.specialistPhone}`}
                        className="flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-1.5 font-bold text-neutral-800 hover:bg-neutral-200 transition"
                      >
                        <Phone size={12} /> Qo&apos;ng&apos;iroq
                      </a>
                    )}
                  </div>

                  {call.address && (
                    <div className="flex items-center gap-1.5 text-neutral-600 pt-1">
                      <MapPin size={13} className="text-neutral-400 shrink-0" />
                      <span>{call.address}</span>
                    </div>
                  )}

                  <div className="rounded-xl bg-neutral-50 p-2.5 mt-2 border border-neutral-100">
                    <p className="text-[10.5px] uppercase font-mono font-bold text-neutral-400 mb-0.5">
                      Muammo tavsifi:
                    </p>
                    <p className="text-xs text-neutral-800 italic">
                      {call.problem}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
