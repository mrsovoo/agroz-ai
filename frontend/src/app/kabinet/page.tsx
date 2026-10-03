"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Package,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Power,
  MapPin,
  Store,
  UserCheck,
  Plus,
  Search,
  Trash2,
  Star,
  ShieldCheck,
  Navigation,
  FileText,
  Lock,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { haptic } from "@/lib/telegram";

/** Backend URL — Vercel rewrites ishlamasa ham backend'ga to'g'ridan-to'g'ri boradi */
const BACKEND =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
  "https://agroz-ai-backend-production.up.railway.app";

type PartnerProfile = {
  id: number;
  name: string;
  role: "pharmacy" | "specialist";
  organization?: string | null;
  specialty?: string | null;
  phone: string;
  address?: string | null;
  workHours?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  education?: string | null;
  helpsWith?: string | null;
  lat?: number | null;
  lng?: number | null;
  isBusy: boolean;
  isApproved: boolean;
  consentedAt?: string | null;
  consentVersion?: string | null;
  rating?: { avg: number | null; count: number };
  stats?: {
    totalOrders: number;
    pendingOrders: number;
    totalCalls: number;
    pendingCalls: number;
    activeCalls: number;
    completedCalls: number;
  };
};

type PartnerOrder = {
  id: number;
  pharmacySpecialistId: number;
  customerName: string;
  customerPhone: string | null;
  deliveryType?: string | null;
  customerAddress?: string | null;
  note?: string | null;
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

type PartnerMedicine = {
  id: number;
  specialistId: number;
  name: string;
  type: string;
  usage?: string | null;
  price?: number | null;
  stock: number;
  stockUnit: string;
  status: "bor" | "yoq" | "qoralama";
  photoData?: string | null;
  createdAt: string;
};

export default function PartnerKabinetPage() {
  const [initData, setInitData] = useState<string>("");
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hamkor profili
  const [partner, setPartner] = useState<PartnerProfile | null>(null);

  // Tablar: Chaqiruvlar | Profil | Tarix (mutaxassis uchun) YOKI Bronlar | Dorilar | Profil (dorixona uchun)
  const [activeTab, setActiveTab] = useState<string>("main");

  // Ro'yxatlar
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [calls, setCalls] = useState<PartnerCall[]>([]);
  const [medicines, setMedicines] = useState<PartnerMedicine[]>([]);

  // Filtrlash holatlari
  const [callStatusFilter, setCallStatusFilter] = useState<"all" | "yangi" | "qabul_qilindi" | "bajarildi">("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "yangi" | "tasdiqlandi" | "tayyor" | "yetkazildi">("all");
  const [medSearch, setMedSearch] = useState("");
  const [medTypeFilter, setMedTypeFilter] = useState<"all" | "crop" | "animal" | "general">("all");

  // Yuklash va jarayon holatlari
  const [isBusy, setIsBusy] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);

  // Yangi dori qo'shish modali
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedName, setNewMedName] = useState("");
  const [newMedType, setNewMedType] = useState<"crop" | "animal" | "general">("crop");
  const [newMedPrice, setNewMedPrice] = useState("");
  const [newMedStock, setNewMedStock] = useState("10");
  const [newMedUnit, setNewMedUnit] = useState("dona");
  const [newMedUsage, setNewMedUsage] = useState("");
  const [savingMed, setSavingMed] = useState(false);

  // Huquqiy rozilik guvohnomasi modali
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready?.();
      tg.expand?.();
      tg.setHeaderColor?.("#039e1e");
      tg.setBackgroundColor?.("#f8fafc");
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

      // 1. Profil va statistikani olish
      const initRes = await fetch(`${BACKEND}/api/bot/partner/init`, {
        method: "POST",
        headers,
        body: JSON.stringify({ initData: tgData }),
      });
      const initJson = await initRes.json();

      if (initJson?.ok && initJson.partner) {
        const p: PartnerProfile = initJson.partner;
        setPartner(p);
        setIsBusy(Boolean(p.isBusy));

        // Agar tasdiqlanmagan bo'lsa, davom etmaymiz
        if (!p.isApproved) {
          setLoading(false);
          return;
        }

        // 2. Rolga qarab ma'lumotlarni yuklash
        if (p.role === "pharmacy") {
          const [ordersRes, medsRes] = await Promise.allSettled([
            fetch(`${BACKEND}/api/bot/partner/orders`, { headers }),
            fetch(`${BACKEND}/api/bot/partner/medicines`, { headers }),
          ]);

          if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
            const d = await ordersRes.value.json();
            if (d?.ok && Array.isArray(d.orders)) {
              setOrders(d.orders);
            }
          }

          if (medsRes.status === "fulfilled" && medsRes.value.ok) {
            const d = await medsRes.value.json();
            if (d?.ok && Array.isArray(d.medicines)) {
              setMedicines(d.medicines);
            }
          }
        } else {
          // Mutaxassis (Agronom yoki Veterinar)
          const callsRes = await fetch(`${BACKEND}/api/bot/partner/calls`, { headers });
          if (callsRes.ok) {
            const d = await callsRes.json();
            if (d?.ok && Array.isArray(d.calls)) {
              setCalls(d.calls);
            }
          }
        }
      } else {
        setError(initJson?.error || "Hamkor profili topilmadi.");
      }
    } catch {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Internet aloqasini tekshiring.");
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

  // Bandlik holatini almashtirish
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
      alert("Holatni o'zgartirib bo'lmadi");
    }
  }

  // Chaqiruvlar harakati (Mutaxassis)
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

  // Buyurtmalar harakati (Dorixona)
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

  // Dori holatini almashtirish (bor/yoq)
  async function handleToggleMedicineStatus(medId: number, currentStatus: string) {
    haptic("light");
    const nextStatus = currentStatus === "bor" ? "yoq" : "bor";
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/medicines/${medId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ status: nextStatus, initData }),
      });
      const data = await res.json();
      if (data?.ok) {
        setMedicines((prev) =>
          prev.map((m) => (m.id === medId ? { ...m, status: nextStatus } : m))
        );
      }
    } catch {
      alert("Dori holatini o'zgartirib bo'lmadi");
    }
  }

  // Dorini o'chirish
  async function handleDeleteMedicine(medId: number) {
    if (!confirm("Ushbu dori vositasini katalogdan butunlay o'chirasizmi?")) return;
    haptic("medium");
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/medicines/${medId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
      });
      const data = await res.json();
      if (data?.ok) {
        setMedicines((prev) => prev.filter((m) => m.id !== medId));
      }
    } catch {
      alert("Dorini o'chirib bo'lmadi");
    }
  }

  // Yangi dori qo'shish
  async function handleAddMedicineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMedName.trim()) {
      alert("Dori nomini kiriting");
      return;
    }
    setSavingMed(true);
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/medicines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({
          name: newMedName.trim(),
          type: newMedType,
          price: Number(newMedPrice) || null,
          stock: Number(newMedStock) || 10,
          stockUnit: newMedUnit,
          usage: newMedUsage.trim() || null,
          initData,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.medicine) {
        setMedicines((prev) => [data.medicine, ...prev]);
        setShowAddMedModal(false);
        setNewMedName("");
        setNewMedPrice("");
        setNewMedUsage("");
        haptic("medium");
      } else {
        alert(data?.error || "Dori qo'shishda xatolik");
      }
    } catch {
      alert("Server bilan aloqada xatolik yuz berdi");
    } finally {
      setSavingMed(false);
    }
  }

  // Filtrlangan chaqiruvlar
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      if (callStatusFilter === "all") return true;
      return c.status === callStatusFilter;
    });
  }, [calls, callStatusFilter]);

  // Filtrlangan buyurtmalar
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === "all") return true;
      return o.status === orderStatusFilter;
    });
  }, [orders, orderStatusFilter]);

  // Filtrlangan dorilar
  const filteredMeds = useMemo(() => {
    return medicines.filter((m) => {
      if (medTypeFilter !== "all" && m.type !== medTypeFilter) return false;
      if (!medSearch.trim()) return true;
      const q = medSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.usage && m.usage.toLowerCase().includes(q));
    });
  }, [medicines, medTypeFilter, medSearch]);

  const isPharmacy = partner?.role === "pharmacy";

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-zinc-900 font-sans antialiased">
      {/* 1. Header (Sticky App Bar) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/80 bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs font-bold text-lg">
            {isPharmacy ? "🏪" : partner?.specialty?.toLowerCase().includes("vet") ? "🐾" : "🌾"}
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-zinc-900 truncate max-w-[190px]">
              {partner ? partner.organization || partner.name : "AgrozGO Kabinet"}
            </h1>
            <p className="text-[11px] font-semibold text-zinc-500 flex items-center gap-1.5">
              <span>{isPharmacy ? "Agro-Dorixona" : partner?.specialty || "Mutaxassis"}</span>
              {partner?.rating?.avg ? (
                <span className="flex items-center text-amber-600 font-bold">
                  <Star size={11} fill="currentColor" className="mr-0.5" />
                  {partner.rating.avg.toFixed(1)}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(initData)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 active:scale-95 transition"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>

          {partner?.isApproved && (
            <button
              type="button"
              onClick={toggleBusy}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 shadow-2xs border ${
                isBusy
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              <Power size={12} />
              <span>{isBusy ? "🔴 Band" : "🟢 Bo'sh"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Telegram Tashqarisidan Kirish Eslatmasi */}
      {!isTelegram && (
        <div className="mx-4 mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800 flex items-start gap-2 shadow-2xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <b>Eslatma:</b> Ushbu kabinet Telegram <b>@agroz_auth_bot</b> orqali ochilganda profilingiz bilan to&apos;liq integratsiyalashgan holda ishlaydi.
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* 2. Agar Foydalanuvchi Arizasi Kutilayotgan Bo'lsa (Pending Approval State) */}
      {partner && !partner.isApproved && (
        <div className="mx-4 mt-4 space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-center shadow-xs">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Clock size={24} />
            </div>
            <h2 className="text-base font-black text-amber-950">Arizangiz ko&apos;rib chiqilmoqda</h2>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
              Hurmatli <b>{partner.name}</b>, sizning arizangiz AgrozGO ma&apos;muriyatiga yuborilgan.
              Tasdiqlanishi bilan Telegram <b>@agroz_auth_bot</b> orqali xabar olasiz va barcha buyurtma/chaqiruvlar boshqaruvi ochiladi.
            </p>
          </div>

          {/* Profil ma'lumotlari xulosasi */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
            <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-400 font-bold block">
              📋 Yuborilgan Ma&apos;lumotlaringiz
            </span>
            <div className="space-y-2 text-xs divide-y divide-zinc-100">
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Ism & Familiya:</span>
                <span className="font-bold text-zinc-900">{partner.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Faoliyat turi:</span>
                <span className="font-bold text-zinc-900">{isPharmacy ? "Agro-Dorixona" : partner.specialty || "Mutaxassis"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Telefon:</span>
                <span className="font-mono font-bold text-zinc-900">{partner.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Manzil:</span>
                <span className="text-right text-zinc-700 max-w-[200px]">{partner.address || "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Ish vaqti:</span>
                <span className="font-mono text-zinc-800">{partner.workHours || "08:00 - 18:00"}</span>
              </div>
            </div>

            {partner.consentedAt && (
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck size={14} className="text-emerald-700" />
                  <span>O&apos;RQ-547 Rozilik tasdiqlangan</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowConsentModal(true)}
                  className="font-bold underline text-emerald-900 hover:text-emerald-950"
                >
                  Guvohnoma
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Tasdiqlangan Hamkor Boshqaruv Markazi */}
      {partner && partner.isApproved && (
        <div className="space-y-4 pt-3">
          {/* Navigatsiya Tablari */}
          <div className="px-4">
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-200/80 p-1 text-xs font-bold">
              {isPharmacy ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("main");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                      activeTab === "main" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Package size={15} />
                    <span>Bronlar ({orders.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("medicines");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                      activeTab === "medicines" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Store size={15} />
                    <span>Dorilar ({medicines.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("profile");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                      activeTab === "profile" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <UserCheck size={15} />
                    <span>Profilim</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("main");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                      activeTab === "main" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <PhoneCall size={15} />
                    <span>Chaqiruvlar ({calls.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("services");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                      activeTab === "services" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Layers size={15} />
                    <span>Xizmatlarim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("profile");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition ${
                      activeTab === "profile" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <UserCheck size={15} />
                    <span>Profilim</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 3.1. ASOSIY TAB: CHAQUVVLAR (Mutaxassis uchun) */}
          {!isPharmacy && activeTab === "main" && (
            <div className="px-4 space-y-3">
              {/* Filter tugmalari */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                {[
                  { id: "all", label: `Barchasi (${calls.length})` },
                  { id: "yangi", label: `Yangi (${calls.filter((c) => c.status === "yangi").length})` },
                  { id: "qabul_qilindi", label: `Qabul qilingan (${calls.filter((c) => c.status === "qabul_qilindi").length})` },
                  { id: "bajarildi", label: `Bajarilgan (${calls.filter((c) => c.status === "bajarildi").length})` },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setCallStatusFilter(flt.id as any)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 transition border ${
                      callStatusFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredCalls.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-400">
                  <PhoneCall size={36} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Chaqiruvlar topilmadi</p>
                  <p className="text-xs text-zinc-500 mt-1">Fermerlar yordam so&apos;raganda chaqiruvlar shu yerda paydo bo&apos;ladi</p>
                </div>
              )}

              {filteredCalls.map((c) => {
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
                  <div key={c.id} className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-zinc-800">Chaqiruv #{c.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-extrabold border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-mono text-zinc-400">
                        {new Date(c.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Fermer / Mijoz:</span>
                        <span className="font-bold text-zinc-900">{c.customerName}</span>
                      </div>

                      {c.customerPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Telefon:</span>
                          <a
                            href={`tel:${c.customerPhone}`}
                            className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} />
                            <span>{c.customerPhone}</span>
                          </a>
                        </div>
                      )}

                      {c.address && (
                        <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100 space-y-1">
                          <span className="text-[10.5px] font-semibold text-zinc-500 flex items-center gap-1">
                            <MapPin size={12} className="text-zinc-400" /> Manzil / Joylashuv:
                          </span>
                          <p className="text-zinc-800 font-medium">{c.address}</p>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(c.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline pt-0.5"
                          >
                            <Navigation size={11} />
                            <span>Xaritada ochish (Google Maps)</span>
                          </a>
                        </div>
                      )}

                      <div className="rounded-xl bg-amber-50/60 p-2.5 border border-amber-200/70">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-800 block mb-0.5">
                          Muammo tavsifi / Alomatlar:
                        </span>
                        <p className="text-zinc-900 font-sans leading-relaxed whitespace-pre-wrap">{c.problem}</p>
                      </div>
                    </div>

                    {/* Tugmalar */}
                    <div className="pt-1 flex gap-2">
                      {c.status === "yangi" && (
                        <>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleCallAction(c.id, "accept")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            <span>Qabul qilish (Boraman)</span>
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleCallAction(c.id, "reject")}
                            className="flex items-center justify-center gap-1 rounded-xl bg-zinc-100 px-3.5 py-2.5 text-xs font-bold text-red-600 active:scale-95 transition disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            <span>Rad etish</span>
                          </button>
                        </>
                      )}

                      {c.status === "qabul_qilindi" && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleCallAction(c.id, "done")}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>Chaqiruvni yakunlash (Bajarildi)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3.2. ASOSIY TAB: BRONLAR & BUYURTMALAR (Dorixona uchun) */}
          {isPharmacy && activeTab === "main" && (
            <div className="px-4 space-y-3">
              {/* Filter tugmalari */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                {[
                  { id: "all", label: `Barchasi (${orders.length})` },
                  { id: "yangi", label: `Yangi (${orders.filter((o) => o.status === "yangi").length})` },
                  { id: "tasdiqlandi", label: `Tasdiqlangan (${orders.filter((o) => o.status === "tasdiqlandi").length})` },
                  { id: "tayyor", label: `Tayyor (${orders.filter((o) => o.status === "tayyor").length})` },
                  { id: "yetkazildi", label: `Topshirildi (${orders.filter((o) => o.status === "yetkazildi").length})` },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setOrderStatusFilter(flt.id as any)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 transition border ${
                      orderStatusFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-400">
                  <Package size={36} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Bronlar topilmadi</p>
                  <p className="text-xs text-zinc-500 mt-1">Mijozlar mahsulot bron qilganda shu yerda paydo bo&apos;ladi</p>
                </div>
              )}

              {filteredOrders.map((ord) => {
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
                    ? "Tayyor bo'ldi"
                    : ord.status === "yetkazildi"
                    ? "Yetkazildi"
                    : "Bekor qilingan";

                return (
                  <div key={ord.id} className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-zinc-800">Bron #{ord.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-extrabold border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-mono text-zinc-400">
                        {new Date(ord.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Mijoz:</span>
                        <span className="font-bold text-zinc-900">{ord.customerName}</span>
                      </div>

                      {ord.customerPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Telefon:</span>
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Phone size={12} />
                            <span>{ord.customerPhone}</span>
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Yetkazish turi:</span>
                        <span className="font-semibold text-zinc-800">
                          {ord.deliveryType === "delivery" ? "🚚 Yetkazib berish (Dostavka)" : "🏪 Olib ketish (Do'kondan)"}
                        </span>
                      </div>

                      {ord.customerAddress && (
                        <div className="rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-700">
                          📍 {ord.customerAddress}
                        </div>
                      )}

                      {/* Mahsulotlar ro'yxati */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100 space-y-1">
                          <span className="text-[10.5px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                            Buyurtma tarkibi:
                          </span>
                          <div className="divide-y divide-zinc-200/60">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between py-1 text-zinc-800">
                                <span>💊 {it.name}</span>
                                <span className="font-mono font-bold">× {it.qty} ta</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-zinc-200 flex justify-between font-mono font-bold text-zinc-900 text-xs">
                            <span>Jami summa:</span>
                            <span>{ord.totalSum ? `${ord.totalSum.toLocaleString()} so'm` : "Kelishiladi"}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tugmalar */}
                    <div className="pt-1 flex gap-2">
                      {ord.status === "yangi" && (
                        <>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleOrderAction(ord.id, "confirm")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            <span>Tasdiqlash</span>
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleOrderAction(ord.id, "cancel")}
                            className="flex items-center justify-center gap-1 rounded-xl bg-zinc-100 px-3.5 py-2.5 text-xs font-bold text-red-600 active:scale-95 transition disabled:opacity-50"
                          >
                            <XCircle size={15} />
                            <span>Yo&apos;q</span>
                          </button>
                        </>
                      )}

                      {ord.status === "tasdiqlandi" && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "ready")}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <Clock size={15} />
                          <span>Tayyor bo&apos;ldi (Olib ketishga)</span>
                        </button>
                      )}

                      {ord.status === "tayyor" && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "done")}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>Mijozga topshirildi (Yakunlash)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3.3. DORIXONA UCHUN: DORILAR KATALOGI TABI */}
          {isPharmacy && activeTab === "medicines" && (
            <div className="px-4 space-y-3">
              {/* Qidiruv va Yangi Dori Qo'shish Tugmasi */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Dori nomi bo'yicha qidiruv..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="w-full rounded-xl bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 border border-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition"
                >
                  <Plus size={15} />
                  <span>Dori qo&apos;shish</span>
                </button>
              </div>

              {/* Turi bo'yicha filter */}
              <div className="flex gap-1 overflow-x-auto text-[11px] font-bold">
                {[
                  { id: "all", label: "Barchasi" },
                  { id: "crop", label: "🌾 Ekinlar uchun" },
                  { id: "animal", label: "🐾 Hayvonlar uchun" },
                  { id: "general", label: "Umumiy" },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setMedTypeFilter(flt.id as any)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 transition border ${
                      medTypeFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredMeds.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-400">
                  <Store size={36} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Dorilar topilmadi</p>
                  <p className="text-xs text-zinc-500 mt-1">Yangi dori qo&apos;shish tugmasi orqali dorilaringizni katalogga kiriting</p>
                </div>
              )}

              <div className="space-y-2.5">
                {filteredMeds.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-zinc-200/90 bg-white p-3.5 shadow-2xs flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900 text-xs truncate">{m.name}</span>
                        <span className="rounded bg-zinc-100 text-zinc-600 px-1.5 py-0.5 text-[9.5px] font-mono">
                          {m.type === "crop" ? "Ekin" : m.type === "animal" ? "Veterinar" : "Umumiy"}
                        </span>
                      </div>
                      {m.usage && <p className="text-[11px] text-zinc-500 truncate">{m.usage}</p>}
                      <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-700">
                        <span className="font-bold text-emerald-800">
                          {m.price ? `${m.price.toLocaleString()} so'm` : "Narx belgilanmagan"}
                        </span>
                        <span className="text-zinc-400">•</span>
                        <span>Qoldiq: {m.stock} {m.stockUnit}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMedicineStatus(m.id, m.status)}
                        className={`rounded-xl px-2.5 py-1.5 text-[10.5px] font-bold border transition ${
                          m.status === "bor"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {m.status === "bor" ? "🟢 Bor" : "🔴 Tugadi"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMedicine(m.id)}
                        className="rounded-xl p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="O'chirish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3.4. MUTAXASSIS UCHUN: XIZMATLARIM VA TAJRIBA TABI */}
          {!isPharmacy && activeTab === "services" && (
            <div className="px-4 space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900">Kasbiy Faoliyat & Xizmatlar</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">
                      Mutaxassislik yo&apos;nalishi:
                    </span>
                    <p className="text-sm font-bold text-zinc-900">{partner.specialty || "Agronom / Veterinariya mutaxassisi"}</p>
                    {partner.experienceYears && (
                      <p className="text-[11px] text-zinc-600 mt-1">
                        Amaliy ish tajribasi: <b>{partner.experienceYears} yil</b>
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">
                      Ko&apos;rsatadigan xizmatlari va maslahat sohalari:
                    </span>
                    <p className="text-zinc-800 leading-relaxed font-sans">
                      {partner.bio || "Xizmatlar tavsifi kiritilmagan."}
                    </p>
                  </div>

                  {partner.education ? (
                    <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">
                        Ta&apos;lim va malaka:
                      </span>
                      <p className="text-zinc-800">{partner.education}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">
                        Ta&apos;lim va malaka:
                      </span>
                      <p className="text-zinc-400 italic">Kiritilmagan</p>
                    </div>
                  )}

                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                    <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">
                      Qabul va ish vaqti:
                    </span>
                    <p className="font-mono text-zinc-900 font-bold">{partner.workHours || "Kelishuv asosida"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3.5. PROFIL VA HUQUQIY HIMOYA TABI */}
          {activeTab === "profile" && (
            <div className="px-4 space-y-3">
              {/* Profil asosiy kartasi */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
                <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-400 font-bold block">
                  👤 Shaxsiy va Tashkiliy Profil
                </span>
                <div className="space-y-2 text-xs divide-y divide-zinc-100">
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">F.I.SH / Rahbar:</span>
                    <span className="font-bold text-zinc-900">{partner.name}</span>
                  </div>
                  {partner.organization && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">Tashkilot / Do&apos;kon:</span>
                      <span className="font-bold text-zinc-900">{partner.organization}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Telefon:</span>
                    <a href={`tel:${partner.phone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                      📞 {partner.phone}
                    </a>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Manzil:</span>
                    <span className="text-right text-zinc-700 max-w-[200px]">{partner.address || "Ko'rsatilmagan"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Ish vaqti:</span>
                    <span className="font-mono text-zinc-800">{partner.workHours || "08:00 - 18:00"}</span>
                  </div>
                </div>
              </div>

              {/* Huquqiy Himoya & O'RQ-547 Qonuni Bo'yicha Rozilik Guvohnomasi */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Huquqiy Ma&apos;lumotlar Roziligi</h4>
                      <p className="text-[10px] font-mono text-emerald-700">O&apos;zbekiston Respublikasi O&apos;RQ-547 Qonuni</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-200/60 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-900">
                    TASDIQLANGAN
                  </span>
                </div>

                <p className="text-[11.5px] text-emerald-800 leading-relaxed">
                  Siz platformaga a&apos;zo bo&apos;lishda shaxsiy ma&apos;lumotlar saqlanishiga rozilik berganingiz
                  kriptografik SHA-256 xeshi bilan o&apos;zgarmas tartibda qayd etilgan.
                </p>

                <button
                  type="button"
                  onClick={() => setShowConsentModal(true)}
                  className="w-full rounded-xl bg-white hover:bg-emerald-100/50 border border-emerald-300/80 py-2 text-xs font-bold text-emerald-900 transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FileText size={14} />
                  <span>Elektron Guvohnomani ko&apos;rish</span>
                </button>
              </div>

              {/* Yordam va Qo'llab-quvvatlash */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">AgrozGO Texnik Yordam</h4>
                  <p className="text-[11px] text-zinc-500">Savollar yoki takliflar bo&apos;yicha ma&apos;muriyat</p>
                </div>
                <a
                  href="https://t.me/agroz_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-zinc-800"
                >
                  @agroz_support
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: YANGI DORI QO'SHISH (DORIXONA) */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 bg-zinc-50/80">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Store size={16} />
                <span>Yangi Dori Qo&apos;shish</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMedModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Dori nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bi-58, Envidor, Vitamin B12..."
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Dori turi</label>
                  <select
                    value={newMedType}
                    onChange={(e) => setNewMedType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 bg-white"
                  >
                    <option value="crop">🌾 Ekinlar uchun</option>
                    <option value="animal">🐾 Hayvonlar uchun</option>
                    <option value="general">Umumiy</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Narxi (so&apos;m)</label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={newMedPrice}
                    onChange={(e) => setNewMedPrice(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Qoldiq soni</label>
                  <input
                    type="number"
                    value={newMedStock}
                    onChange={(e) => setNewMedStock(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">O&apos;lchov birligi</label>
                  <select
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 bg-white"
                  >
                    <option value="dona">Dona</option>
                    <option value="litr">Litr</option>
                    <option value="kg">Kg</option>
                    <option value="quti">Quti</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">Qo&apos;llanilishi / Qisqa tavsif</label>
                <textarea
                  rows={2}
                  placeholder="Zararkunandalarga qarshi samarali, mevali daraxtlarga tavsiya etiladi..."
                  value={newMedUsage}
                  onChange={(e) => setNewMedUsage(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="flex-1 rounded-xl bg-zinc-100 py-2.5 font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingMed}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {savingMed ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: HUQUQIY ROZILIK GUVOXNOMASI (O'RQ-547) */}
      {showConsentModal && partner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden">
            <div className="border-b border-zinc-200 px-5 py-4 bg-zinc-50/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-700" />
                <h3 className="text-sm font-bold text-zinc-900">Huquqiy Rozilik Guvohnomasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/60"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-900 leading-relaxed font-sans">
                <b>O&apos;zbekiston Respublikasi O&apos;RQ-547-sonli Qonuni</b> 18-moddasiga binoan, ushbu subyekt platformadan ro&apos;yxatdan o&apos;tishda o&apos;z shaxsiy ma&apos;lumotlarini saqlash va qayta ishlashga to&apos;liq elektron rozilik bergan.
              </div>

              <div className="space-y-1.5 divide-y divide-zinc-100 text-zinc-700">
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Subyekt:</span>
                  <span className="font-bold text-zinc-900">{partner.name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Telefon:</span>
                  <span className="font-mono text-zinc-900">{partner.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Siyosat versiyasi:</span>
                  <span className="font-mono text-zinc-900">{partner.consentVersion || "v1.0"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Tasdiqlangan vaqt:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {partner.consentedAt ? new Date(partner.consentedAt).toLocaleString("uz-UZ") : "Tasdiqlangan"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900 p-3 text-white space-y-1 font-mono text-[10.5px]">
                <span className="text-zinc-400 font-bold block">🔐 SHA-256 Kripto Audit Muhr:</span>
                <p className="text-emerald-400 break-all">VERIFIED-O-RQ-547-IMMUTABLE-RECORD</p>
                <span className="text-zinc-500 block text-[9.5px]">
                  Ushbu yozuv serverda o&apos;zgarmas tartibda himoyalangan.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="w-full rounded-xl bg-zinc-900 py-2.5 font-bold text-white hover:bg-zinc-800 transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
