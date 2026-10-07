"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  Minus,
  Search,
  Trash2,
  Star,
  ShieldCheck,
  Navigation,
  FileText,
  Phone,
  Sparkles,
  Award,
  ChevronRight,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  X,
  LayoutDashboard,
  Boxes,
} from "lucide-react";
import { haptic } from "@/lib/telegram";
import { isNativeApp } from "@/lib/capacitor";
import { useRouter } from "next/navigation";
import PharmacyDashboard, { LOW_STOCK_THRESHOLD } from "./PharmacyDashboard";
import AgrozBusinessLogo from "@/components/AgrozBusinessLogo";

/** Backend URL — Vercel yoki to'g'ridan-to'g'ri backend */
const BACKEND =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
  "https://agroz-ai-backend-production.up.railway.app";

type StockFilter = "all" | "low" | "out" | "draft";

/** Dori qoldiq holati: qoralama → tugagan → kam qolgan → yetarli */
function medStockState(m: { status: string; stock: number }): "ok" | "low" | "out" | "draft" {
  if (m.status === "qoralama") return "draft";
  if (m.status === "yoq" || m.stock <= 0) return "out";
  if (m.stock <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function formatPriceWithDots(val: string | number | null | undefined): string {
  if (!val && val !== 0) return "";
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parsePriceNumber(val: string | null | undefined): number | null {
  if (!val) return null;
  const digits = String(val).replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

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

  // Tablar: Mutaxassis uchun "calls" | "profile". Dorixona uchun "orders" | "medicines" | "profile"
  const [activeTab, setActiveTab] = useState<string>("calls");

  // Ro'yxatlar
  const [orders, setOrders] = useState<PartnerOrder[]>([]);
  const [calls, setCalls] = useState<PartnerCall[]>([]);
  const [medicines, setMedicines] = useState<PartnerMedicine[]>([]);

  // Filtrlash holatlari
  const [callStatusFilter, setCallStatusFilter] = useState<"all" | "yangi" | "qabul_qilindi" | "bajarildi">("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "yangi" | "tasdiqlandi" | "tayyor" | "yetkazildi">("all");
  const [medSearch, setMedSearch] = useState("");
  const [medTypeFilter, setMedTypeFilter] = useState<"all" | "crop" | "animal" | "general">("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  // Qoldiq stepper uchun debounce taymerlari va rollback qiymatlari
  const stockTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const stockOriginalRef = useRef<Record<number, number>>({});

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
  const [newMedPhoto, setNewMedPhoto] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [savingMed, setSavingMed] = useState(false);

  // Huquqiy rozilik guvohnomasi modali
  const [showConsentModal, setShowConsentModal] = useState(false);

  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isNativeApp()) {
      router.replace("/");
      return;
    }
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
  }, [router]);

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

        // Default tabni belgilash
        if (p.role === "pharmacy") {
          setActiveTab((prev) => (prev === "calls" ? "dashboard" : prev));
        } else {
          setActiveTab((prev) => (prev === "orders" || prev === "medicines" || prev === "dashboard" ? "calls" : prev));
        }

        // Agar tasdiqlanmagan bo'lsa
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

  // Bandlik holatini almashtirish (1-tap toggle)
  async function toggleBusy() {
    haptic("medium");
    const next = !isBusy;
    setIsBusy(next);
    try {
      const res = await fetch(`${BACKEND}/api/bot/partner/busy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify({ isBusy: next }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setIsBusy(!next); // rollback
        alert("Holatni o'zgartirib bo'lmadi");
      }
    } catch {
      setIsBusy(!next);
      alert("Aloqa xatosi yuz berdi");
    }
  }

  // Chaqiruv amali (Qabul qilish / Rad etish / Yakunlash)
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
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        setCalls((prev) =>
          prev.map((c) => (c.id === callId ? { ...c, status: data.status } : c))
        );
        haptic("medium");
      } else {
        alert(data?.error || "Amalni bajarib bo'lmadi");
      }
    } catch {
      alert("Server bilan aloqada xatolik");
    } finally {
      setActionBusyId(null);
    }
  }

  // Bron amali (Tasdiqlash / Bekor / Tayyor / Yetkazildi)
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
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o))
        );
        haptic("medium");
      } else {
        alert(data?.error || "Amalni bajarib bo'lmadi");
      }
    } catch {
      alert("Server bilan aloqada xatolik");
    } finally {
      setActionBusyId(null);
    }
  }

  // Dori bor/yo'q holatini 1-tap orqali o'zgartirish
  async function handleToggleMedicineStatus(medId: number, currentStatus: "bor" | "yoq" | "qoralama") {
    haptic("light");
    const nextStatus = currentStatus === "bor" ? "yoq" : "bor";
    // Optimistik yangilash
    setMedicines((prev) =>
      prev.map((m) => (m.id === medId ? { ...m, status: nextStatus } : m))
    );
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
      if (!data?.ok) {
        // Rollback
        setMedicines((prev) =>
          prev.map((m) => (m.id === medId ? { ...m, status: currentStatus } : m))
        );
        alert("Holatni saqlab bo'lmadi");
      }
    } catch {
      setMedicines((prev) =>
        prev.map((m) => (m.id === medId ? { ...m, status: currentStatus } : m))
      );
      alert("Aloqa xatosi");
    }
  }

  // Qoldiqni +/- bilan o'zgartirish: UI darhol yangilanadi, oxirgi bosishdan 700ms keyin bitta so'rov
  function handleStockChange(medId: number, delta: number) {
    haptic("light");
    const current = medicines.find((m) => m.id === medId);
    if (!current) return;
    const nextStock = Math.max(0, current.stock + delta);
    if (nextStock === current.stock) return;

    if (!(medId in stockOriginalRef.current)) {
      stockOriginalRef.current[medId] = current.stock;
    }
    setMedicines((prev) => prev.map((m) => (m.id === medId ? { ...m, stock: nextStock } : m)));

    clearTimeout(stockTimersRef.current[medId]);
    stockTimersRef.current[medId] = setTimeout(async () => {
      const original = stockOriginalRef.current[medId];
      delete stockOriginalRef.current[medId];
      delete stockTimersRef.current[medId];
      try {
        const res = await fetch(`${BACKEND}/api/bot/partner/medicines/${medId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-telegram-init-data": initData,
          },
          body: JSON.stringify({ stock: nextStock, initData }),
        });
        const data = await res.json();
        if (!data?.ok) throw new Error();
      } catch {
        setMedicines((prev) => prev.map((m) => (m.id === medId ? { ...m, stock: original } : m)));
        alert("Qoldiqni saqlab bo'lmadi");
      }
    }, 700);
  }

  // Dorini o'chirish
  async function handleDeleteMedicine(medId: number) {
    if (!confirm("Haqiqatan ham ushbu dorini katalogdan o'chirmoqchimisiz?")) return;
    haptic("heavy");
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
        haptic("medium");
      }
    } catch {
      alert("Dorini o'chirib bo'lmadi");
    }
  }

  // Rasm tanlash va brauzerda siqish (max 800px JPEG, ~50-80 KB)
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Faqat rasm faylini tanlashingiz mumkin");
      return;
    }

    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxW = 1080;
        const maxH = 1450;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          if (isPng) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/png");
            setNewMedPhoto(compressed);
          } else {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.88);
            setNewMedPhoto(compressed);
          }
        } else {
          setNewMedPhoto(event.target?.result as string);
        }
        setIsCompressingPhoto(false);
        haptic("light");
      };
      img.onerror = () => {
        setIsCompressingPhoto(false);
        alert("Rasmni o'qib bo'lmadi");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsCompressingPhoto(false);
      alert("Faylni o'qishda xatolik yuz berdi");
    };
    reader.readAsDataURL(file);
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
          price: parsePriceNumber(newMedPrice),
          stock: Number(newMedStock) || 10,
          stockUnit: newMedUnit,
          usage: newMedUsage.trim() || null,
          photoData: newMedPhoto,
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
        setNewMedPhoto(null);
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
      if (stockFilter !== "all" && medStockState(m) !== stockFilter) return false;
      if (!medSearch.trim()) return true;
      const q = medSearch.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.usage && m.usage.toLowerCase().includes(q));
    });
  }, [medicines, medTypeFilter, medSearch, stockFilter]);

  // Qoldiq holati hisoblagichlari (chiplar, nav badge)
  const stockCounts = useMemo(() => {
    const c = { ok: 0, low: 0, out: 0, draft: 0 };
    for (const m of medicines) c[medStockState(m)]++;
    return c;
  }, [medicines]);

  const isPharmacy = partner?.role === "pharmacy";

  // Tab almashtirish: sahifa tepasiga qaytariladi
  function goTab(tab: string) {
    haptic("light");
    setActiveTab(tab);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Faol chaqiruvlar / buyurtmalar soni (badge uchun)
  const pendingCallsCount = useMemo(() => calls.filter((c) => c.status === "yangi" || c.status === "qabul_qilindi").length, [calls]);
  const pendingOrdersCount = useMemo(() => orders.filter((o) => o.status === "yangi" || o.status === "tasdiqlandi").length, [orders]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-zinc-900 font-sans antialiased">
      {/* 1. Header (Sticky App Bar) — Radikal Sodda va Aniq */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200/80 bg-white/95 backdrop-blur-md px-4 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <AgrozBusinessLogo className="h-7 w-auto shrink-0" />
          <div className="h-5 w-px bg-zinc-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs font-black tracking-tight text-zinc-900 truncate">
              {partner ? partner.organization || partner.name : "AgrozGO Business"}
            </h1>
            <p className="text-[10px] font-semibold text-zinc-500 flex items-center gap-1.5 truncate">
              <span>{isPharmacy ? "Agro-Dorixona" : partner?.specialty || "Mutaxassis"}</span>
              {partner?.rating?.avg ? (
                <span className="flex items-center text-amber-600 font-bold">
                  <Star size={10} fill="currentColor" className="mr-0.5" />
                  {partner.rating.avg.toFixed(1)}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Yangilash tugmasi */}
          <button
            type="button"
            onClick={() => loadData(initData)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-900 active:scale-95 transition"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-emerald-600" : ""} />
          </button>

          {/* 1-Tap Bandlik Kaliti: Katta va Aniq */}
          {partner?.isApproved && (
            <button
              type="button"
              onClick={toggleBusy}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 shadow-xs border ${
                isBusy
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              }`}
            >
              <Power size={13} className={isBusy ? "text-red-600" : "text-emerald-700"} />
              <span>{isBusy ? "Bandman" : "Bo'shman"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Telegram Tashqarisidan Kirish Eslatmasi */}
      {!isTelegram && (
        <div className="mx-4 mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <b>Telegram WebApp rejimi:</b> Ushbu kabinet <b>@agroz_auth_bot</b> orqali avtomatik profil bilan ochiladi.
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Agar profil topilmagan bo'lsa (tashqaridan ochilganda) */}
      {!loading && !partner && !error && (
        <div className="mx-4 mt-6 rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-xs space-y-4">
          <div className="flex justify-center">
            <AgrozBusinessLogo className="h-10 w-auto" />
          </div>
          <h2 className="text-base font-black text-zinc-900">AgrozGO Business</h2>
          <p className="text-xs text-zinc-600 leading-relaxed max-w-sm mx-auto">
            Ushbu kabinet agronomlar, veterinarlar va agro-dorixona egalari uchun mo&apos;ljallangan. Profilingizni ochish uchun <b>@agroz_auth_bot</b> orqali kiring.
          </p>
          <a
            href="https://t.me/agroz_auth_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#1b1464] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90"
          >
            <span>Botga o&apos;tish</span>
          </a>
        </div>
      )}

      {/* 2. Agar Foydalanuvchi Arizasi Kutilayotgan Bo'lsa (Pending Approval) */}
      {partner && !partner.isApproved && (
        <div className="mx-4 mt-4 space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center shadow-xs">
            <div className="flex justify-center mb-3">
              <AgrozBusinessLogo className="h-8 w-auto" />
            </div>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Clock size={24} />
            </div>
            <h2 className="text-base font-black text-amber-950">Arizangiz ko&apos;rib chiqilmoqda</h2>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
              Hurmatli <b>{partner.name}</b>, sizning arizangiz moderator tomonidan ko&apos;rib chiqilmoqda.
              Tasdiqlanishi bilan <b>@agroz_auth_bot</b> orqali xabar beriladi.
            </p>
          </div>

          {/* Yuborilgan ma'lumotlar xulosasi */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              📋 Sizning Ma&apos;lumotlaringiz
            </span>
            <div className="space-y-2 text-xs divide-y divide-zinc-100">
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">F.I.SH / Nomi:</span>
                <span className="font-bold text-zinc-900">{partner.name}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Faoliyat turi:</span>
                <span className="font-bold text-zinc-900">{isPharmacy ? "Agro-Dorixona" : partner.specialty || "Mutaxassis"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Telefon raqam:</span>
                <span className="font-mono font-bold text-zinc-900">{partner.phone}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-zinc-500">Manzil:</span>
                <span className="text-right text-zinc-700 max-w-[200px]">{partner.address || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tasdiqlangan Hamkor Boshqaruv Markazi */}
      {partner && partner.isApproved && (
        <div className="space-y-4 pt-3">
          {/* Navigatsiya Tablari (Mutaxassis) — Dorixona uchun pastki nav bar ishlatiladi */}
          {!isPharmacy && (
          <div className="px-4">
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-200/80 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("calls");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition ${
                      activeTab === "calls" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <PhoneCall size={15} />
                    <span>Chaqiruvlar</span>
                    {pendingCallsCount > 0 && (
                      <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] text-white font-extrabold">
                        {pendingCallsCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setActiveTab("profile");
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition ${
                      activeTab === "profile" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                  <UserCheck size={15} />
                  <span>Profilim</span>
                </button>
            </div>
          </div>
          )}

          {/* 3.1. MUTAXASSIS: CHAQIRUVLAR TABI */}
          {!isPharmacy && activeTab === "calls" && (
            <div className="px-4 space-y-3">
              {/* Filter tugmalari */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
                {[
                  { id: "all", label: `Barchasi (${calls.length})` },
                  { id: "yangi", label: `Yangi (${calls.filter((c) => c.status === "yangi").length})` },
                  { id: "qabul_qilindi", label: `Qabul qilingan (${calls.filter((c) => c.status === "qabul_qilindi").length})` },
                  { id: "bajarildi", label: `Yakunlangan (${calls.filter((c) => c.status === "bajarildi").length})` },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setCallStatusFilter(flt.id as any)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 transition border ${
                      callStatusFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredCalls.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-400">
                  <PhoneCall size={36} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Chaqiruvlar yo&apos;q</p>
                  <p className="text-xs text-zinc-500 mt-1">Fermerlar yordam so&apos;raganda chaqiruv shu yerda paydo bo&apos;ladi</p>
                </div>
              )}

              {/* Chaqiruv kartochkalari — 1-bosishda natijaga yetkazuvchi dizayn */}
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
                    ? "Kutilmoqda"
                    : c.status === "qabul_qilindi"
                    ? "Jarayonda"
                    : c.status === "bajarildi"
                    ? "Yakunlangan"
                    : "Rad etilgan";

                return (
                  <div key={c.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
                    {/* Yuqori qism: ID, Status va Vaqt */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-zinc-900">#{c.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {new Date(c.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Mijoz va Tezkor Bog'lanish */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] text-zinc-400 block font-medium">Mijoz / Fermer</span>
                          <span className="text-sm font-extrabold text-zinc-900 truncate block">{c.customerName}</span>
                        </div>

                        {/* Bog'lanish tugmasi: bosilganda raqam chiqadi va ulanish imkoni beriladi */}
                        {c.customerPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              haptic("medium");
                              setRevealedPhones((prev) => ({
                                ...prev,
                                [`call_${c.id}`]: !prev[`call_${c.id}`],
                              }));
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition shrink-0"
                          >
                            <Phone size={13} />
                            <span>Bog&apos;lanish</span>
                          </button>
                        )}
                      </div>

                      {/* Bog'lanish bosilganda ko'rinadigan telefon raqami qutisi */}
                      {revealedPhones[`call_${c.id}`] && c.customerPhone && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Phone size={13} className="text-emerald-700 shrink-0" />
                            <a
                              href={`tel:${c.customerPhone}`}
                              onClick={() => haptic("light")}
                              className="font-mono font-black text-xs text-emerald-950 hover:underline truncate"
                            >
                              {c.customerPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${c.customerPhone}`}
                              onClick={() => haptic("light")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                            >
                              Qo&apos;ng&apos;iroq
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(c.customerPhone || "");
                                haptic("light");
                                alert("Telefon raqami nusxalandi: " + c.customerPhone);
                              }}
                              className="rounded-lg bg-white border border-emerald-300 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                            >
                              Nusxa
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Muammo / Alomatlar tavsifi */}
                      <div className="rounded-xl bg-amber-50/70 p-3 border border-amber-200/80">
                        <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block mb-1">
                          Muammo tavsifi:
                        </span>
                        <p className="text-xs text-zinc-900 leading-relaxed font-sans">{c.problem}</p>
                      </div>

                      {/* Manzil va 1-Tap Navigator havolasi */}
                      {c.address && (
                        <div className="rounded-xl bg-zinc-50 p-2.5 border border-zinc-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin size={14} className="text-zinc-500 shrink-0" />
                            <span className="text-xs text-zinc-800 truncate font-medium">{c.address}</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Navigation size={11} />
                            <span>Xarita</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Harakat tugmalari — 1-bosishda holatni o'zgartirish */}
                    <div className="pt-1 flex gap-2">
                      {c.status === "yangi" && (
                        <>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleCallAction(c.id, "accept")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            <span>Qabul qilish (Boraman)</span>
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleCallAction(c.id, "reject")}
                            className="flex items-center justify-center gap-1 rounded-xl bg-zinc-100 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 transition disabled:opacity-50"
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
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>Yordam berildi (Yakunlash)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3.2a. DORIXONA: ASOSIY (DASHBOARD) */}
          {isPharmacy && activeTab === "dashboard" && (
            <PharmacyDashboard
              orders={orders}
              medicines={medicines}
              rating={partner.rating}
              onOpenOrders={(f) => {
                haptic("light");
                setOrderStatusFilter(f ?? "all");
                goTab("orders");
              }}
              onOpenStock={(f) => {
                haptic("light");
                setStockFilter(f ?? "all");
                setMedTypeFilter("all");
                setMedSearch("");
                goTab("medicines");
              }}
              onAddMedicine={() => {
                haptic("light");
                setShowAddMedModal(true);
              }}
            />
          )}

          {/* 3.2. DORIXONA: BRONLAR & BUYURTMALAR TABI */}
          {isPharmacy && activeTab === "orders" && (
            <div className="px-4 space-y-3">
              {/* Filter tugmalari */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
                {[
                  { id: "all", label: `Barchasi (${orders.length})` },
                  { id: "yangi", label: `Yangi (${orders.filter((o) => o.status === "yangi").length})` },
                  { id: "tasdiqlandi", label: `Tasdiqlangan (${orders.filter((o) => o.status === "tasdiqlandi").length})` },
                  { id: "tayyor", label: `Tayyor (${orders.filter((o) => o.status === "tayyor").length})` },
                  { id: "yetkazildi", label: `Topshirilgan (${orders.filter((o) => o.status === "yetkazildi").length})` },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setOrderStatusFilter(flt.id as any)}
                    className={`shrink-0 rounded-xl px-3 py-1.5 transition border ${
                      orderStatusFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-400">
                  <Package size={36} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Bronlar yo&apos;q</p>
                  <p className="text-xs text-zinc-500 mt-1">Mijoz dori bron qilganda shu yerda paydo bo&apos;ladi</p>
                </div>
              )}

              {/* Bron kartochkasi */}
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
                    ? "Olib ketishga tayyor"
                    : ord.status === "yetkazildi"
                    ? "Topshirildi"
                    : "Bekor qilingan";

                return (
                  <div key={ord.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-zinc-900">Bron #{ord.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {new Date(ord.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] text-zinc-400 block font-medium">Mijoz</span>
                          <span className="text-sm font-extrabold text-zinc-900 truncate block">{ord.customerName}</span>
                        </div>

                        {/* Bog'lanish tugmasi: bosilganda raqam chiqadi */}
                        {ord.customerPhone && (
                          <button
                            type="button"
                            onClick={() => {
                              haptic("medium");
                              setRevealedPhones((prev) => ({
                                ...prev,
                                [`ord_${ord.id}`]: !prev[`ord_${ord.id}`],
                              }));
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition shrink-0"
                          >
                            <Phone size={13} />
                            <span>Bog&apos;lanish</span>
                          </button>
                        )}
                      </div>

                      {/* Bog'lanish bosilganda ko'rinadigan telefon raqami qutisi */}
                      {revealedPhones[`ord_${ord.id}`] && ord.customerPhone && (
                        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Phone size={13} className="text-emerald-700 shrink-0" />
                            <a
                              href={`tel:${ord.customerPhone}`}
                              onClick={() => haptic("light")}
                              className="font-mono font-black text-xs text-emerald-950 hover:underline truncate"
                            >
                              {ord.customerPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${ord.customerPhone}`}
                              onClick={() => haptic("light")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                            >
                              Qo&apos;ng&apos;iroq
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(ord.customerPhone || "");
                                haptic("light");
                                alert("Telefon raqami nusxalandi: " + ord.customerPhone);
                              }}
                              className="rounded-lg bg-white border border-emerald-300 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                            >
                              Nusxa
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl bg-zinc-50 p-2 text-zinc-700 font-medium flex items-center justify-between">
                        <span>Yetkazish turi:</span>
                        <span className="font-bold text-zinc-900">
                          {ord.deliveryType === "delivery" ? "🚚 Yetkazib berish" : "🏪 Do'kondan olib ketish"}
                        </span>
                      </div>

                      {/* Mahsulotlar ro'yxati */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-100 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block">
                            So&apos;ralgan dorilar:
                          </span>
                          <div className="divide-y divide-zinc-200/60">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between py-1 text-zinc-800">
                                <span>💊 {it.name}</span>
                                <span className="font-mono font-bold">× {it.qty} ta</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-zinc-200 flex justify-between font-bold text-zinc-900 text-xs">
                            <span>Jami summa:</span>
                            <span className="text-emerald-700">
                              {ord.totalSum ? `${ord.totalSum.toLocaleString()} so'm` : "Kelishiladi"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bosqichma-bosqich harakatlar */}
                    <div className="pt-1 flex gap-2">
                      {ord.status === "yangi" && (
                        <>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleOrderAction(ord.id, "confirm")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                            <span>Tasdiqlash (Dori bor)</span>
                          </button>
                          <button
                            type="button"
                            disabled={isWorking}
                            onClick={() => handleOrderAction(ord.id, "cancel")}
                            className="flex items-center justify-center gap-1 rounded-xl bg-zinc-100 px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 active:scale-95 transition disabled:opacity-50"
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
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <Clock size={15} />
                          <span>Tayyorlandi (Xabar yuborish)</span>
                        </button>
                      )}

                      {ord.status === "tayyor" && (
                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleOrderAction(ord.id, "done")}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
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

          {/* 3.3. DORIXONA: DORILAR KATALOGI (Bor/Yo'q 1-tap boshqaruvi) */}
          {isPharmacy && activeTab === "medicines" && (
            <div className="px-4 space-y-3">
              {/* Qidiruv va Tezkor Qo'shish */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Dori nomi bo'yicha..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="w-full rounded-xl bg-white pl-9 pr-3 py-2.5 text-xs text-zinc-900 border border-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(true)}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white shadow-xs active:scale-95 transition shrink-0"
                >
                  <Plus size={16} />
                  <span>Dori qo&apos;shish</span>
                </button>
              </div>

              {/* Qoldiq holati bo'yicha filter */}
              <div className="flex gap-1 overflow-x-auto text-[11px] font-bold scrollbar-none">
                {[
                  { id: "all", label: `Barchasi (${medicines.length})`, active: "bg-zinc-900 text-white border-zinc-900" },
                  { id: "low", label: `⚠️ Kam qolgan (${stockCounts.low})`, active: "bg-amber-500 text-white border-amber-500" },
                  { id: "out", label: `🔴 Tugagan (${stockCounts.out})`, active: "bg-red-600 text-white border-red-600" },
                  { id: "draft", label: `📝 Qoralama (${stockCounts.draft})`, active: "bg-zinc-700 text-white border-zinc-700" },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => {
                      haptic("light");
                      setStockFilter(flt.id as StockFilter);
                    }}
                    className={`shrink-0 rounded-xl px-3 py-1.5 transition border ${
                      stockFilter === flt.id ? `${flt.active} shadow-xs` : "bg-white text-zinc-600 border-zinc-200"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {/* Turi bo'yicha filter */}
              <div className="flex gap-1 overflow-x-auto text-[11px] font-bold scrollbar-none">
                {[
                  { id: "all", label: "Barchasi" },
                  { id: "crop", label: "🌾 Ekinlar" },
                  { id: "animal", label: "🐾 Hayvonlar" },
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
                  <Store size={36} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Dorilar topilmadi</p>
                  <p className="text-xs text-zinc-500 mt-1">Yangi dori qo&apos;shish orqali do&apos;koningiz dorilarini kiriting</p>
                </div>
              )}

              {/* Dorilar ro'yxati: 1-Tap Bor/Tugadi toggle */}
              <div className="space-y-2">
                {filteredMeds.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {m.photoData ? (
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-zinc-200 shrink-0 shadow-2xs p-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.photoData} alt={m.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-lg shrink-0">
                          {m.type === "crop" ? "🌾" : m.type === "animal" ? "🐾" : "💊"}
                        </div>
                      )}

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-zinc-900 text-xs truncate">{m.name}</span>
                          <span className="rounded bg-zinc-100 text-zinc-600 px-1.5 py-0.2 text-[9px] font-mono">
                            {m.type === "crop" ? "Ekin" : m.type === "animal" ? "Veterinar" : "Umumiy"}
                          </span>
                        </div>
                        {m.usage && <p className="text-[11px] text-zinc-500 truncate">{m.usage}</p>}
                        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-700">
                          <span className="font-bold text-emerald-800">
                            {m.price ? `${m.price.toLocaleString()} so'm` : "Kelishuv"}
                          </span>
                        </div>
                        {/* Qoldiqni 1-tap o'zgartirish */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleStockChange(m.id, -1)}
                            disabled={m.stock <= 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 active:scale-90 transition disabled:opacity-40"
                            aria-label="Qoldiqni kamaytirish"
                          >
                            <Minus size={13} />
                          </button>
                          <span
                            className={`min-w-[64px] text-center rounded-lg px-2 py-1 text-[11px] font-mono font-black ${
                              m.stock <= 0
                                ? "bg-red-50 text-red-700"
                                : m.stock <= LOW_STOCK_THRESHOLD
                                ? "bg-amber-50 text-amber-800"
                                : "bg-zinc-100 text-zinc-800"
                            }`}
                          >
                            {m.stock} {m.stockUnit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockChange(m.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 active:scale-90 transition"
                            aria-label="Qoldiqni oshirish"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* 1-Tap Bor/Tugadi tugmasi */}
                      <button
                        type="button"
                        onClick={() => handleToggleMedicineStatus(m.id, m.status)}
                        className={`rounded-xl px-3 py-2 text-xs font-black border transition active:scale-95 ${
                          m.status === "bor"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {m.status === "bor" ? "🟢 Bor" : "🔴 Tugadi"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMedicine(m.id)}
                        className="rounded-xl p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 transition"
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

          {/* 3.4. PROFILIM TABI (Barcha ma'lumotlar, tajriba, xizmatlar va huquqiy guvohnoma bitta joyda) */}
          {activeTab === "profile" && (
            <div className="px-4 space-y-3">
              {/* Profil Asosiy Kartasi */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-xl shadow-xs">
                    {isPharmacy ? "🏪" : partner.specialty?.toLowerCase().includes("vet") ? "🐾" : "🌾"}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900">{partner.name}</h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      {isPharmacy ? partner.organization || "Agro-Dorixona" : partner.specialty || "Mutaxassis"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-zinc-100 pt-1">
                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Telefon:</span>
                    <a href={`tel:${partner.phone}`} className="font-mono font-bold text-emerald-700 hover:underline">
                      {partner.phone}
                    </a>
                  </div>

                  {partner.address && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">Manzil:</span>
                      <span className="text-right text-zinc-800 font-medium max-w-[200px]">{partner.address}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1.5">
                    <span className="text-zinc-500">Ish vaqti:</span>
                    <span className="font-mono text-zinc-800 font-bold">{partner.workHours || "08:00 - 18:00"}</span>
                  </div>

                  {!isPharmacy && partner.experienceYears && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">Tajriba:</span>
                      <span className="font-bold text-zinc-900">{partner.experienceYears} yil</span>
                    </div>
                  )}

                  {!isPharmacy && partner.education && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500">Ta&apos;lim:</span>
                      <span className="text-right text-zinc-800 font-medium max-w-[200px]">{partner.education}</span>
                    </div>
                  )}
                </div>

                {/* Mutaxassis xizmatlari va bio */}
                {!isPharmacy && partner.bio && (
                  <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
                      Ko&apos;rsatadigan xizmatlarim:
                    </span>
                    <p className="text-xs text-zinc-800 leading-relaxed font-sans">{partner.bio}</p>
                  </div>
                )}
              </div>

              {/* O'RQ-547 Qonuniy Himoya Guvohnomasi */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">Qonuniy Himoya (O&apos;RQ-547)</h4>
                      <p className="text-[10px] text-emerald-700">Elektron Rozilik Guvohnomasi</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-200/70 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-900">
                    TASDIQLANGAN
                  </span>
                </div>

                <p className="text-xs text-emerald-800 leading-relaxed">
                  Sizning platformadagi faoliyatingiz va shaxsiy ma&apos;lumotlaringiz O&apos;zbekiston Respublikasi O&apos;RQ-547 Qonuni asosida kriptografik tarzda himoyalangan.
                </p>

                <button
                  type="button"
                  onClick={() => setShowConsentModal(true)}
                  className="w-full rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 py-2.5 text-xs font-bold text-emerald-900 transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <FileText size={14} />
                  <span>Elektron Guvohnomani ochish</span>
                </button>
              </div>

              {/* Texnik Yordam */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <AgrozBusinessLogo className="h-5 w-auto" />
                  <p className="text-[11px] text-zinc-500">Texnik yordam va savollar bo&apos;yicha</p>
                </div>
                <a
                  href="https://t.me/agroz_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#1b1464] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90"
                >
                  @agroz_support
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3.5. DORIXONA: PASTKI NAVIGATSIYA (Dashboard nav bar) */}
      {isPharmacy && partner?.isApproved && (
        <nav
          className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-md grid grid-cols-5 items-end px-2 pt-1.5 pb-1.5">
            {[
              { id: "dashboard", label: "Asosiy", Icon: LayoutDashboard, badge: 0, badgeCls: "" },
              { id: "orders", label: "Bronlar", Icon: Package, badge: pendingOrdersCount, badgeCls: "bg-amber-500" },
              { id: "__add", label: "", Icon: Plus, badge: 0, badgeCls: "" },
              { id: "medicines", label: "Qoldiq", Icon: Boxes, badge: stockCounts.low + stockCounts.out, badgeCls: "bg-red-500" },
              { id: "profile", label: "Profil", Icon: UserCheck, badge: 0, badgeCls: "" },
            ].map(({ id, label, Icon, badge, badgeCls }) => {
              if (id === "__add") {
                return (
                  <div key={id} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        haptic("medium");
                        setShowAddMedModal(true);
                      }}
                      className="-mt-6 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-white active:scale-90 transition"
                      aria-label="Dori qo'shish"
                    >
                      <Plus size={24} strokeWidth={2.6} />
                    </button>
                  </div>
                );
              }
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goTab(id)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-bold transition active:scale-95 ${
                    active ? "text-emerald-700" : "text-zinc-500"
                  }`}
                >
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-emerald-50" : ""}`}>
                    <Icon size={19} strokeWidth={active ? 2.5 : 2} />
                  </span>
                  <span>{label}</span>
                  {badge > 0 && (
                    <span
                      className={`absolute top-0 right-2 min-w-[17px] rounded-full px-1 text-[9px] leading-[17px] text-white font-extrabold ring-2 ring-white ${badgeCls}`}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* 4. MODAL: YANGI DORI QO'SHISH (DORIXONA) */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
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
              {/* Dori fotosurati (Kamera yoki Galereyadan) */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Dori fotosurati (ixtiyoriy)</label>
                {newMedPhoto ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-2xs p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newMedPhoto} alt="Dori fotosurati" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setNewMedPhoto(null);
                        haptic("light");
                      }}
                      className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 transition active:scale-95"
                      title="Rasmni o'chirish"
                    >
                      <X size={14} />
                    </button>
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/60 text-white text-[10px] px-2 py-0.5 font-medium">
                      ✓ Rasm tanlandi
                    </span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 rounded-2xl p-4 cursor-pointer transition text-center group active:scale-[0.99]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2 group-hover:scale-105 transition">
                      <Camera size={20} />
                    </div>
                    <span className="font-bold text-xs text-emerald-950">
                      {isCompressingPhoto ? "Rasm yuklanmoqda..." : "Fotosuratni yuklash"}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      Kameradan oling yoki galereyadan tanlang
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isCompressingPhoto}
                      onChange={handlePhotoSelect}
                    />
                  </label>
                )}
              </div>

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
                    type="text"
                    inputMode="numeric"
                    placeholder="Masalan: 45.000"
                    value={newMedPrice}
                    onChange={(e) => setNewMedPrice(formatPriceWithDots(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
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
                  <label className="font-bold text-zinc-700 block mb-1">Birligi</label>
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
                <label className="font-bold text-zinc-700 block mb-1">Qisqa tavsif (ixtiyoriy)</label>
                <textarea
                  rows={2}
                  placeholder="Zararkunandalarga qarshi, mevali daraxtlarga..."
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

      {/* 5. MODAL: ELEKTRON ROZILIK GUVOXNOMASI (O'RQ-547) */}
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
                <b>O&apos;zbekiston Respublikasi O&apos;RQ-547-sonli Qonuni</b> 18-moddasiga muvofiq, platforma orqali ro&apos;yxatdan o&apos;tishda shaxsiy ma&apos;lumotlar saqlanishiga elektron rozilik berilgan.
              </div>

              <div className="space-y-1.5 divide-y divide-zinc-100 text-zinc-700">
                <div className="flex justify-between py-1">
                  <span className="text-zinc-500">Hamkor:</span>
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
                  <span className="text-zinc-500">Tasdiqlangan sana:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {partner.consentedAt ? new Date(partner.consentedAt).toLocaleString("uz-UZ") : "Tasdiqlangan"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-zinc-700 space-y-1 text-xs">
                <span className="font-bold text-zinc-900 block flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Davlat Standarti: O&apos;RQ-547 Qonuni</span>
                </span>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Ushbu rozilik ma&apos;lumotlari qonunchilik talablariga muvofiq maxfiy va xavfsiz tarzda qayd etilgan.
                </p>
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
