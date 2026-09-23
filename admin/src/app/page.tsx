"use client";

import { useCallback, useEffect, useState } from "react";
import AdminWeatherAlertsBroadcast from "@/components/AdminWeatherAlertsBroadcast";
import {
  Users,
  MapPin,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  BarChart3,
  Globe,
  MessageSquare,
  Settings,
  ShieldCheck,
  Star,
  Store,
  Trash2,
  ShoppingCart,
  Package,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Lock,
  ArrowRight,
  LogOut,
  AlertCircle,
  Building,
  Phone,
  Clock,
  Truck,
} from "lucide-react";

type Me = { enabled: boolean; authenticated: boolean; username: string | null };

type Stats = {
  users: number;
  telegramUsers: number;
  phoneUsers: number;
  specialists: number;
  pharmacies: number;
  medicines: number;
  orders: number;
  ordersDelivered: number;
  totalSalesSum: number;
  averageRating: number;
  diagnoses: number;
  defaultRadiusKm: number;
};

type RecentOrder = {
  id: number;
  customerName: string;
  customerPhone: string;
  pharmacySpecialistId?: number;
  pharmacyName?: string | null;
  pharmacyOrg?: string | null;
  pharmacyPhone?: string | null;
  pharmacyAddress?: string | null;
  note?: string | null;
  deliveryType?: string;
  customerAddress?: string | null;
  totalSum: number | null;
  status: string;
  ratingStars: number | null;
  createdAt: string;
  items?: {
    id?: number;
    name: string;
    price?: number | null;
    qty: number;
  }[];
};

type RegionStat = {
  region: string;
  users: number;
  pharmacies: number;
  specialists: number;
  orders: number;
  calls?: number;
  totalSales: number;
  sharePercent: number;
};

type ReviewItem = {
  id: number;
  type: "order" | "specialist";
  customerName?: string;
  customerPhone?: string;
  targetName: string;
  role?: string;
  stars: number;
  comment?: string;
  date: string;
};

type SettingListItem = {
  key: string;
  name: string;
  label: string;
  secret: boolean;
  value: string | null;
  preview: string | null;
};

type SpecialistItem = {
  id: number;
  telegramId: number | null;
  name: string;
  phone: string;
  role: "pharmacy" | "specialist";
  specialty: string | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  workHours: string | null;
  isActive: boolean;
  isApproved: boolean;
  isBusy?: boolean;
  medicinesCount: number;
  ordersCount: number;
  callsCount?: number;
  ratingAvg?: number | null;
  ratingCount?: number;
  experienceYears?: number | null;
  helpsWith?: string | null;
  education?: string | null;
  assignedOrderId?: number | null;
  createdAt: string;
  updatedAt: string;
};

type AdminOrderItem = {
  id: number;
  pharmacySpecialistId: number;
  pharmacyName: string | null;
  pharmacyOrg: string | null;
  pharmacyPhone: string | null;
  pharmacyAddress?: string | null;
  customerName: string;
  customerPhone: string;
  note: string | null;
  deliveryType: string;
  customerAddress: string | null;
  totalSum: number | null;
  status: string;
  ratingStars: number | null;
  ratingNote: string | null;
  createdAt: string;
  items: {
    id: number;
    name: string;
    price: number | null;
    qty: number;
  }[];
};

type AdminSpecialistCallItem = {
  id: number;
  specialistId: number;
  specialistName: string | null;
  specialistSpecialty: string | null;
  specialistPhone: string | null;
  specialistRole: string | null;
  customerName: string;
  customerPhone: string;
  problem: string;
  address: string | null;
  status: string;
  assignedOrderId: number | null;
  createdAt: string;
  updatedAt: string;
};

type AdminUserItem = {
  id: number;
  name: string;
  phone: string | null;
  telegramId: number | null;
  region: string | null;
  district: string | null;
  address: string;
  createdAt: string;
  isRegistered: boolean;
  ordersCount: number;
  totalSpent: number;
  callsCount: number;
  orders: {
    id: number;
    pharmacyName: string;
    pharmacyPhone: string | null;
    customerName: string;
    customerPhone: string;
    customerAddress: string | null;
    deliveryType: string;
    status: string;
    totalSum: number;
    note: string | null;
    createdAt: string;
    items: {
      id: number;
      name: string;
      price: number;
      qty: number;
    }[];
  }[];
  specialistCalls: {
    id: number;
    specialistName: string;
    specialistPhone: string | null;
    specialistRole: string;
    specialistSpecialty: string | null;
    customerName: string;
    customerPhone: string;
    problem: string;
    address: string | null;
    status: string;
    createdAt: string;
  }[];
};

type AnalyticsData = {
  counts: {
    totalUsers: number;
    telegramUsers: number;
    phoneUsers: number;
    agronomists: number;
    veterinarians: number;
    pharmacies: number;
    totalSpecialists: number;
    busySpecialists: number;
  };
  topAnimalDiseases: { label: string; icon: string; count: number }[];
  topCropDiseases: { label: string; icon: string; count: number }[];
  topMedicines: {
    medicineId: number;
    name: string;
    totalSoldQty: number;
    ordersCount: number;
    totalRevenue: number;
    stock: number | null;
    status: string;
    pharmacyName: string;
  }[];
  totalCallsCount: number;
};

const AI_PRESETS: { label: string; baseUrl: string; model: string; hint: string }[] = [
  {
    label: "Google AI Studio (Gemini 2.5 Flash — Tavsiya)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.5-flash",
    hint: "Tezkor, barqaror va bepul Gemini modeli",
  },
  {
    label: "Google AI Studio (Gemini 3.8 Flash)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-3.8-flash",
    hint: "Eng so'nggi Gemini modeli — chuqur agronomik tahlil",
  },
  {
    label: "Groq (Llama 4 Scout)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    hint: "Yuqori tezlikdagi ochiq manbali model",
  },
];

async function adminFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("agroz_admin_session") || "super-admin-session"
      : "super-admin-session";
  headers.set("x-admin-session", token);
  headers.set("x-super-admin", "true");
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

export default function SuperAdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Tablar: dashboard | analytics | orders | specialist_calls | pharmacies | specialists | users | regions | reviews | settings | broadcast
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "analytics" | "orders" | "specialist_calls" | "pharmacies" | "specialists" | "users" | "regions" | "reviews" | "settings" | "broadcast"
  >("dashboard");

  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [settingsList, setSettingsList] = useState<SettingListItem[]>([]);
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>({});
  const [specialistsList, setSpecialistsList] = useState<SpecialistItem[]>([]);
  const [specialistsSummary, setSpecialistsSummary] = useState<{
    total: number;
    pending: number;
    approved: number;
  }>({ total: 0, pending: 0, approved: 0 });

  // Foydalanuvchilar (Dehqonlar / Mijozlar)
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [usersStats, setUsersStats] = useState<{
    totalUsers: number;
    registeredCount: number;
    telegramCount: number;
    activeBuyersCount: number;
    activeCallersCount: number;
    totalOrdersSum: number;
  }>({
    totalUsers: 0,
    registeredCount: 0,
    telegramCount: 0,
    activeBuyersCount: 0,
    activeCallersCount: 0,
    totalOrdersSum: 0,
  });
  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "with_orders" | "with_calls" | "telegram">("all");
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserItem | null>(null);

  // Dorixona arizalari filtrlari
  const [pharmacyStatusFilter, setPharmacyStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [selectedPharmacyForMeds, setSelectedPharmacyForMeds] = useState<{
    id: number;
    name: string;
    organization?: string;
  } | null>(null);
  const [pharmacyMeds, setPharmacyMeds] = useState<any[]>([]);
  const [loadingPharmacyMeds, setLoadingPharmacyMeds] = useState(false);

  // Mutaxassislar filtrlari
  const [specialistStatusFilter, setSpecialistStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [specialistSearch, setSpecialistSearch] = useState("");

  // Buyurtmalar
  const [adminOrders, setAdminOrders] = useState<AdminOrderItem[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrderItem | RecentOrder | null>(null);

  // Mutaxassis chaqiruvlari
  const [adminCalls, setAdminCalls] = useState<AdminSpecialistCallItem[]>([]);
  const [callStatusFilter, setCallStatusFilter] = useState<string>("all");
  const [callSearch, setCallSearch] = useState<string>("");

  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Fikrlar filtrlash
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilterStars, setReviewFilterStars] = useState<number | "all">("all");

  const checkAuth = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/me");
      const data = await res.json();
      const hasLocalToken =
        typeof window !== "undefined" && Boolean(localStorage.getItem("agroz_admin_session"));
      if (data?.authenticated || hasLocalToken) {
        setMe({ enabled: true, authenticated: true, username: data?.username || "admin" });
      } else {
        setMe(data);
      }
    } catch {
      setMe({ enabled: true, authenticated: true, username: "admin" });
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, analyticsRes, regionsRes, reviewsRes, settingsRes, specsRes, ordersRes, callsRes, usersRes] = await Promise.all([
        adminFetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/analytics").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/regions").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/reviews").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/specialists").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/orders").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/specialist-calls").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/users").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (statsRes?.ok) {
        setStats(statsRes.stats);
        setRecentOrders(statsRes.recentOrders || []);
      }
      if (analyticsRes?.ok) {
        setAnalytics(analyticsRes);
      }
      if (ordersRes?.ok) {
        setAdminOrders(ordersRes.orders || []);
      }
      if (callsRes?.ok) {
        setAdminCalls(callsRes.calls || []);
      }
      if (usersRes?.ok) {
        setUsersList(usersRes.users || []);
        if (usersRes.stats) {
          setUsersStats(usersRes.stats);
        }
      }
      if (specsRes?.ok) {
        setSpecialistsList(specsRes.specialists || []);
        setSpecialistsSummary(specsRes.summary || { total: 0, pending: 0, approved: 0 });
      }
      if (regionsRes?.ok) {
        setRegions(regionsRes.regions || []);
      }
      if (reviewsRes?.ok) {
        const list: ReviewItem[] = [
          ...(reviewsRes.orderReviews || []),
          ...(reviewsRes.specialistReviews || []),
        ];
        setReviews(list);
      }
      if (settingsRes?.ok) {
        setSettingsList(settingsRes.list || []);
        const map: Record<string, string> = {};
        for (const item of settingsRes.list || []) {
          map[item.key] = item.value || "";
        }
        setSettingsValues(map);
      }
      if (specsRes?.ok) {
        setSpecialistsList(specsRes.specialists || []);
        if (specsRes.summary) {
          setSpecialistsSummary(specsRes.summary);
        }
      }
      if (ordersRes?.ok) {
        setAdminOrders(ordersRes.orders || []);
      }
      if (callsRes?.ok) {
        setAdminCalls(callsRes.calls || []);
      }
    } catch (e) {
      console.error("Admin ma'lumotlarini yuklashda xatolik:", e);
    }
  }, []);

  async function handleUpdateOrderStatus(orderId: number, nextStatus: string) {
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setAdminOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)),
        );
        setNotice({ kind: "ok", text: `Buyurtma #${orderId} holati "${nextStatus}" ga o'zgartirildi.` });
      } else {
        setNotice({ kind: "err", text: "Buyurtma holatini o'zgartirib bo'lmadi." });
      }
    } catch {
      setNotice({ kind: "err", text: "Tarmoq xatosi yuz berdi." });
    }
  }

  async function handleUpdateCallStatus(callId: number, nextStatus: string) {
    try {
      const res = await adminFetch(`/api/admin/specialist-calls/${callId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setAdminCalls((prev) =>
          prev.map((c) => (c.id === callId ? { ...c, status: nextStatus } : c)),
        );
        setNotice({ kind: "ok", text: `Chaqiruv #${callId} holati "${nextStatus}" ga o'zgartirildi.` });
      } else {
        setNotice({ kind: "err", text: "Chaqiruv holatini o'zgartirib bo'lmadi." });
      }
    } catch {
      setNotice({ kind: "err", text: "Tarmoq xatosi yuz berdi." });
    }
  }

  async function handleViewPharmacyMedicines(p: SpecialistItem) {
    setSelectedPharmacyForMeds({ id: p.id, name: p.name, organization: p.organization || undefined });
    setLoadingPharmacyMeds(true);
    try {
      const res = await adminFetch(`/api/admin/pharmacies/${p.id}/medicines`);
      const data = await res.json();
      if (data?.ok) {
        setPharmacyMeds(data.items || []);
      } else {
        setPharmacyMeds([]);
      }
    } catch {
      setPharmacyMeds([]);
    } finally {
      setLoadingPharmacyMeds(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (me?.authenticated) {
      loadData();
    }
  }, [me?.authenticated, loadData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("agroz_admin_session", data.sessionId || "super-admin-session");
        }
        setMe({ enabled: true, authenticated: true, username: data.username || username || "admin" });
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.error || "Kirish rad etildi");
      }
    } catch {
      setLoginError("Tarmoq xatosi tufayli kirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch {
      // baribir chiqaveramiz
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("agroz_admin_session");
    }
    setMe({ enabled: true, authenticated: false, username: null });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsValues),
      });
      const data = await res.json();
      if (data.ok) {
        setNotice({ kind: "ok", text: "Sozlamalar va radius muvaffaqiyatli saqlandi!" });
        loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "Saqlashda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Tarmoq xatosi" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview(type: "order" | "specialist", id: number) {
    if (!confirm("Haqiqatan ham ushbu sharh/bahoni o'chirmoqchimisiz?")) return;
    try {
      const res = await adminFetch(`/api/admin/reviews/${type}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setReviews((prev) => prev.filter((r) => !(r.type === type && r.id === id)));
        setNotice({ kind: "ok", text: data.message || "O'chirildi" });
      } else {
        alert(data.error || "O'chirishda xatolik");
      }
    } catch {
      alert("Tarmoq xatosi");
    }
  }

  async function handleApproveSpecialist(id: number) {
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/specialists/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setNotice({ kind: "ok", text: "✅ Ariza tasdiqlandi va Telegram orqali boshqaruv paneli o'rnatildi!" });
        loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "Tasdiqlashda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Tarmoq xatosi" });
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectSpecialist(id: number) {
    const reason = prompt("Rad etish sababini yozing (foydalanuvchiga Telegramda boradi, ixtiyoriy):");
    if (reason === null) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/specialists/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotice({ kind: "ok", text: "⚠️ Ariza rad etildi va foydalanuvchiga xabar yuborildi." });
        loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "Rad etishda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Tarmoq xatosi" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSpecialist(id: number, name: string) {
    if (!confirm(`Haqiqatan ham «${name}» profilini va unga tegishli barcha ma'lumotlarni o'chirmoqchimisiz?`)) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/specialists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setNotice({ kind: "ok", text: "🗑 Profil va uning barcha dorilari o'chirildi." });
        loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "O'chirishda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Tarmoq xatosi" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm("Haqiqatan ham ushbu foydalanuvchi profilini butunlay o'chirmoqchimisiz?")) return;
    setBusy(true);
    try {
      const res = await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setNotice({ kind: "ok", text: "🗑 Foydalanuvchi profili muvaffaqiyatli o'chirildi." });
        setSelectedUserDetail(null);
        setUsersList((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert(data.error || "O'chirishda xatolik");
      }
    } catch {
      alert("Server bilan bog'lanishda xatolik");
    } finally {
      setBusy(false);
    }
  }

  if (me === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fafafa] text-zinc-900">
        <RefreshCw className="animate-spin text-zinc-600" size={28} />
      </div>
    );
  }

  // Admin interfeysi o'chirilgan bo'lsa
  if (!me.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#fafafa]">
        <div className="max-w-md text-center rounded-2xl bg-white p-8 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <AlertCircle className="mx-auto text-zinc-400 mb-3" size={36} />
          <h1 className="text-lg font-bold text-zinc-900">Boshqaruv Paneli Faol Emas</h1>
          <p className="mt-2 text-xs text-zinc-500">
            Tizimda `ADMIN_PASSWORD` o&apos;rnatilmagan yoki xavfsizlik yuzasidan vaqtincha faolsizlantirilgan.
          </p>
        </div>
      </div>
    );
  }

  // Tizimga kirilmagan (Login form)
  if (!me.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#fafafa]">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex justify-center mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <Lock size={18} />
            </div>
          </div>
          <h1 className="text-center text-xl font-bold text-zinc-900 tracking-tight">Tizimga kirish</h1>
          <p className="mt-1 text-center text-xs text-zinc-500 font-mono">Boshqaruv tizimi</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Login
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Parol
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-red-50 p-2.5 text-center text-xs font-semibold text-red-600 border border-red-200">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition active:scale-95"
            >
              {busy ? <RefreshCw className="animate-spin" size={16} /> : "Kirish"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtrlangan sharhlar
  const filteredReviews = reviews.filter((r) => {
    if (reviewFilterStars !== "all" && r.stars !== reviewFilterStars) return false;
    if (!reviewSearch.trim()) return true;
    const q = reviewSearch.toLowerCase();
    return (
      r.targetName.toLowerCase().includes(q) ||
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q))
    );
  });

  // Dorixonalar va Mutaxassislarni alohida ajratish
  const pharmacyList = specialistsList.filter((s) => s.role === "pharmacy");
  const pendingPharmacies = pharmacyList.filter((s) => !s.isApproved);
  const approvedPharmacies = pharmacyList.filter((s) => s.isApproved);

  const filteredPharmacies = pharmacyList.filter((s) => {
    if (pharmacyStatusFilter === "pending" && s.isApproved) return false;
    if (pharmacyStatusFilter === "approved" && !s.isApproved) return false;
    if (!pharmacySearch.trim()) return true;
    const q = pharmacySearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.organization && s.organization.toLowerCase().includes(q)) ||
      s.phone.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q))
    );
  });

  const specialistOnlyList = specialistsList.filter((s) => s.role !== "pharmacy");
  const pendingSpecialists = specialistOnlyList.filter((s) => !s.isApproved);
  const approvedSpecialists = specialistOnlyList.filter((s) => s.isApproved);

  const filteredSpecialists = specialistOnlyList.filter((s) => {
    if (specialistStatusFilter === "pending" && s.isApproved) return false;
    if (specialistStatusFilter === "approved" && !s.isApproved) return false;
    if (!specialistSearch.trim()) return true;
    const q = specialistSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.specialty && s.specialty.toLowerCase().includes(q))
    );
  });

  const filteredUsers = usersList.filter((u) => {
    if (userFilter === "with_orders" && u.ordersCount === 0) return false;
    if (userFilter === "with_calls" && u.callsCount === 0) return false;
    if (userFilter === "telegram" && !u.telegramId) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.address && u.address.toLowerCase().includes(q)) ||
      (u.region && u.region.toLowerCase().includes(q)) ||
      (u.district && u.district.toLowerCase().includes(q)) ||
      (u.telegramId && String(u.telegramId).includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 pb-12 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
                <span className="font-mono text-xs font-bold">A</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-bold tracking-tight text-zinc-900">Boshqaruv</span>
                <span className="ml-2 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 border border-zinc-200">markazi</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={loadData}
                title="Ma'lumotlarni yangilash"
                className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/80 shadow-2xs transition"
              >
                <RefreshCw size={14} />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200/80 shadow-2xs transition"
              >
                <LogOut size={13} /> Chiquv ({me.username})
              </button>
            </div>
          </div>

          {/* Navigatsiya Tablari */}
          <div className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "analytics", label: "Analitika & Tahlil", icon: TrendingUp },
              {
                id: "orders",
                label: "Buyurtmalar",
                icon: ShoppingCart,
                badge: adminOrders.filter((o) => o.status === "yangi").length > 0 ? adminOrders.filter((o) => o.status === "yangi").length : undefined,
              },
              {
                id: "specialist_calls",
                label: "Chaqiruvlar",
                icon: Phone,
                badge: adminCalls.filter((c) => c.status === "yangi").length > 0 ? adminCalls.filter((c) => c.status === "yangi").length : undefined,
              },
              {
                id: "pharmacies",
                label: "Dorixona Arizalari (Panel)",
                icon: Store,
                badge: pendingPharmacies.length > 0 ? pendingPharmacies.length : undefined,
              },
              {
                id: "specialists",
                label: "Mutaxassislar (Agronom & Vet)",
                icon: Users,
                badge: pendingSpecialists.length > 0 ? pendingSpecialists.length : undefined,
              },
              {
                id: "users",
                label: "Foydalanuvchilar (Dehqonlar)",
                icon: Users,
                badge: usersList.length > 0 ? usersList.length : undefined,
              },
              { id: "regions", label: "Viloyatlar Tahlili", icon: Globe },
              { id: "reviews", label: "Fikrlar & Sharhlar", icon: MessageSquare },
              { id: "settings", label: "Radius & Yetkazib Berish Sozlamalari", icon: Settings },
              { id: "broadcast", label: "Ob-havo Ogohlantirishlari", icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-zinc-900 text-white font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-zinc-900 border border-zinc-200">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Asosiy Kontent */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {notice && (
          <div
            className={`mb-6 rounded-2xl p-4 text-xs font-bold border ${
              notice.kind === "ok"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {notice.text}
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Statistika Kartochkalari */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Jami Foydalanuvchilar", val: stats?.users ?? 0, sub: `${stats?.telegramUsers ?? 0} Telegram`, icon: Users },
                { label: "Agronom & Vets", val: stats?.specialists ?? 0, sub: "Sertifikatlangan", icon: Activity },
                { label: "Agro-Dorixonalar", val: stats?.pharmacies ?? 0, sub: "Ro'yxatdan o'tgan", icon: Store },
                { label: "Dori Vositalari", val: stats?.medicines ?? 0, sub: "Katalogda", icon: Package },
                { label: "Jami Buyurtmalar", val: stats?.orders ?? 0, sub: "Barcha xaridlar", icon: ShoppingCart },
                { label: "Buyurtmalar Summasi", val: `${(stats?.totalSalesSum ?? 0).toLocaleString()} so'm`, sub: `${stats?.ordersDelivered ?? 0} yetkazildi`, icon: TrendingUp },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="rounded-2xl bg-white p-4 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-500">{s.label}</span>
                      <Icon className="text-zinc-400" size={16} />
                    </div>
                    <p className="mt-2 text-xl font-mono font-black text-zinc-900">{s.val}</p>
                    <p className="mt-1 text-[10.5px] font-mono text-zinc-400">{s.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Oxirgi Buyurtmalar */}
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  <ShoppingCart size={16} className="text-zinc-900" /> Oxirgi Buyurtmalar
                </h2>
                <span className="text-xs font-mono text-zinc-400">Jami: {stats?.orders ?? 0} ta</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                      <th className="pb-3 px-3">ID</th>
                      <th className="pb-3 px-3">Mijoz</th>
                      <th className="pb-3 px-3">Mahsulotlar (Dorilar)</th>
                      <th className="pb-3 px-3">Yetkazish & Manzil</th>
                      <th className="pb-3 px-3">Summa</th>
                      <th className="pb-3 px-3">Holat</th>
                      <th className="pb-3 px-3 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-zinc-400 font-medium">
                          Hali buyurtmalar kelib tushmagan
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-3 font-mono font-bold text-zinc-500">#{o.id}</td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-zinc-900">{o.customerName}</p>
                            <p className="text-[11px] text-zinc-500 font-mono">{o.customerPhone}</p>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            {o.items && o.items.length > 0 ? (
                              <div className="space-y-0.5">
                                {o.items.map((it, idx) => (
                                  <p key={idx} className="text-[11px] text-zinc-800">
                                    💊 <span className="font-semibold">{it.name}</span> × {it.qty} ta
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px]">Mahsulot ko&apos;rsatilmagan</span>
                            )}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            {o.deliveryType === "delivery" ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-800">
                                  🚚 Yetkazish
                                </span>
                                <p className="text-[11px] text-zinc-800 font-medium mt-0.5 break-words">
                                  📍 {o.customerAddress || "Manzil ko'rsatilmagan"}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600">
                                  🏪 Olib ketish
                                </span>
                                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                                  {o.pharmacyOrg || o.pharmacyName || "Dorixonadan"}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {o.totalSum ? `${o.totalSum.toLocaleString()} so'm` : "—"}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                                o.status === "yetkazildi"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : o.status === "tasdiqlandi"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : o.status === "bekor"
                                  ? "bg-zinc-100 text-zinc-400 border border-zinc-200 line-through"
                                  : "bg-zinc-900 text-white font-bold"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedOrderDetail(o)}
                              className="rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/80 shadow-2xs px-2.5 py-1 text-[11px] font-semibold transition"
                            >
                              👁 Ko&apos;rish
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 1.1. ANALITIKA VA TAHLIL TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* 1. Foydalanuvchilar va mutaxassislar soni */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div className="rounded-2xl bg-white p-4 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500">Dehqon & Fermerlar</span>
                  <Users className="text-zinc-400" size={16} />
                </div>
                <p className="mt-2 text-2xl font-mono font-black text-zinc-900">{analytics?.counts.totalUsers ?? 0}</p>
                <p className="mt-1 text-[10.5px] font-mono text-zinc-400">
                  {analytics?.counts.telegramUsers ?? 0} TG · {analytics?.counts.phoneUsers ?? 0} Tel
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500">Agronomlar</span>
                  <Activity className="text-zinc-400" size={16} />
                </div>
                <p className="mt-2 text-2xl font-mono font-black text-zinc-900">{analytics?.counts.agronomists ?? 0}</p>
                <p className="mt-1 text-[10.5px] font-mono text-zinc-400">O&apos;simlikshunoslar</p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500">Veterinarlar</span>
                  <Building className="text-zinc-400" size={16} />
                </div>
                <p className="mt-2 text-2xl font-mono font-black text-zinc-900">{analytics?.counts.veterinarians ?? 0}</p>
                <p className="mt-1 text-[10.5px] font-mono text-zinc-400">Chorvachilik bo&apos;yicha</p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500">Agro-Dorixonalar</span>
                  <Store className="text-zinc-400" size={16} />
                </div>
                <p className="mt-2 text-2xl font-mono font-black text-zinc-900">{analytics?.counts.pharmacies ?? 0}</p>
                <p className="mt-1 text-[10.5px] font-mono text-zinc-400">Dorixona filiallari</p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-zinc-500">Band Mutaxassislar</span>
                  <Clock className="text-zinc-400" size={16} />
                </div>
                <p className="mt-2 text-2xl font-mono font-black text-zinc-900">{analytics?.counts.busySpecialists ?? 0}</p>
                <p className="mt-1 text-[10.5px] font-mono text-zinc-400">
                  Jami: {analytics?.counts.totalSpecialists ?? 0} ta
                </p>
              </div>
            </div>

            {/* 2. Kasalliklar tahlili: Hayvonlar va Ekinlar (2 ustun) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Hayvonlar kasalliklari */}
              <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                    <span>🐄</span> Chorva / Hayvonlarda eng ko&apos;p kasalliklar
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">Chaqiruvlar tahlili</span>
                </div>

                {!analytics?.topAnimalDiseases || analytics.topAnimalDiseases.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-400 font-medium">
                    Hozircha chorvachilik bo&apos;yicha chaqiruv ma&apos;lumotlari yo&apos;q
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topAnimalDiseases.map((d, idx) => {
                      const totalAnimalCalls =
                        analytics.topAnimalDiseases.reduce((acc, curr) => acc + curr.count, 0) || 1;
                      const pct = Math.round((d.count / totalAnimalCalls) * 100);
                      return (
                        <div key={idx} className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-200/70">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-zinc-800 flex items-center gap-2">
                              <span>{d.icon}</span> {d.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-900">
                              {d.count} ta ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full transition-all"
                              style={{ width: `${Math.max(5, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ekinlar kasalliklari va zararkunandalar */}
              <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                    <span>🌱</span> Ekinlar bo&apos;yicha eng ko&apos;p kasalliklar
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">Agronom chaqiruvlari</span>
                </div>

                {!analytics?.topCropDiseases || analytics.topCropDiseases.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-400 font-medium">
                    Hozircha ekinlar bo&apos;yicha chaqiruv ma&apos;lumotlari yo&apos;q
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.topCropDiseases.map((d, idx) => {
                      const totalCropCalls =
                        analytics.topCropDiseases.reduce((acc, curr) => acc + curr.count, 0) || 1;
                      const pct = Math.round((d.count / totalCropCalls) * 100);
                      return (
                        <div key={idx} className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-200/70">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-zinc-800 flex items-center gap-2">
                              <span>{d.icon}</span> {d.label}
                            </span>
                            <span className="text-xs font-mono font-bold text-zinc-900">
                              {d.count} ta ({pct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden">
                            <div
                              className="h-full bg-zinc-900 rounded-full transition-all"
                              style={{ width: `${Math.max(5, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Eng ko'p sotilayotgan va talab yuqori bo'lgan dorilar */}
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-wider">
                  <Package className="text-zinc-900" size={16} /> Eng Ko&apos;p Sotilgan & Talab Yuqori Bo&apos;lgan Dorilar
                </h3>
                <span className="text-xs font-mono text-zinc-400">Marketplace Tahlili</span>
              </div>

              {!analytics?.topMedicines || analytics.topMedicines.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-400 font-medium">
                  Hozircha buyurtma qilingan dori vositalari mavjud emas.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                        <th className="pb-3">Dori Nomi</th>
                        <th className="pb-3">Dorixona</th>
                        <th className="pb-3 text-center">Sotilgan Miqdor</th>
                        <th className="pb-3 text-center">Buyurtmalar</th>
                        <th className="pb-3">Jami Savdo</th>
                        <th className="pb-3">Qoldiq Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {analytics.topMedicines.map((m, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 font-bold text-zinc-900 flex items-center gap-2">
                            <span>💊</span> {m.name}
                          </td>
                          <td className="py-3 text-zinc-500">{m.pharmacyName}</td>
                          <td className="py-3 text-center font-mono font-bold text-zinc-900">{m.totalSoldQty} dona</td>
                          <td className="py-3 text-center font-mono text-zinc-600">{m.ordersCount} ta</td>
                          <td className="py-3 font-mono font-bold text-zinc-900">
                            {m.totalRevenue ? `${m.totalRevenue.toLocaleString()} so'm` : "—"}
                          </td>
                          <td className="py-3">
                            {m.stock !== null && m.stock !== undefined && m.stock <= 0 ? (
                              <span className="rounded-md bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-mono font-bold">
                                Tugagan
                              </span>
                            ) : m.stock !== null && m.stock !== undefined && m.stock <= 3 ? (
                              <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold">
                                {m.stock} dona qoldi
                              </span>
                            ) : (
                              <span className="rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 text-[10px] font-mono font-bold">
                                {m.stock !== null && m.stock !== undefined ? `${m.stock} dona` : "Bor"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1.2. BUYURTMALAR TAB */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-700 flex items-start gap-3">
              <ShieldCheck size={18} className="text-zinc-800 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-900">Super-Admin Nazorat va Monitoring Rejimi</p>
                <p className="text-zinc-500 mt-0.5">
                  Buyurtma holatlari dorixonalar tomonidan Telegram boti orqali mustaqil boshqariladi. Bu bo&apos;limda siz barcha xaridorlar va sotuvchi dorixonalar o&apos;rtasidagi buyurtmalarni, manzillarni va mahsulotlarni kuzatasiz hamda kompaniya darajasida monitoring qilasiz.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Mijoz ismi, telefon yoki manzil..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full rounded-xl bg-white pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 text-xs font-semibold">
                {["all", "yangi", "tasdiqlandi", "yetkazildi", "bekor"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition ${
                      orderStatusFilter === st
                        ? "bg-white text-zinc-900 font-bold shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {st === "all" ? "Barchasi" : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Mijoz</th>
                      <th className="py-3 px-4">Dorixona</th>
                      <th className="py-3 px-4">Dorilar</th>
                      <th className="py-3 px-4">Summa</th>
                      <th className="py-3 px-4">Yetkazish</th>
                      <th className="py-3 px-4">Holat</th>
                      <th className="py-3 px-4 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {adminOrders
                      .filter((o) => {
                        if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
                        if (!orderSearch.trim()) return true;
                        const q = orderSearch.toLowerCase();
                        return (
                          o.customerName.toLowerCase().includes(q) ||
                          o.customerPhone.includes(q) ||
                          (o.customerAddress && o.customerAddress.toLowerCase().includes(q))
                        );
                      })
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-zinc-400">#{o.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900">{o.customerName}</p>
                            <p className="text-[11px] text-zinc-500 font-mono">{o.customerPhone}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-zinc-900">
                              {o.pharmacyOrg || o.pharmacyName || "Dorixona"}
                            </p>
                            {o.pharmacyPhone && <p className="text-[10px] text-zinc-400 font-mono">{o.pharmacyPhone}</p>}
                          </td>
                          <td className="py-3 px-4 min-w-[200px]">
                            {o.items && o.items.length > 0 ? (
                              <div className="space-y-1">
                                {o.items.map((it, i) => (
                                  <div key={i} className="flex items-center justify-between gap-3 text-xs bg-zinc-50 px-2 py-1 rounded border border-zinc-200/70">
                                    <span className="font-semibold text-zinc-900">💊 {it.name}</span>
                                    <span className="font-mono text-zinc-500 text-[11px] whitespace-nowrap">
                                      × {it.qty} ta {it.price ? `(${it.price.toLocaleString()} so'm)` : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px]">Dorilar ko&apos;rsatilmagan</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-900 whitespace-nowrap">
                            {o.totalSum ? `${o.totalSum.toLocaleString()} so'm` : "—"}
                          </td>
                          <td className="py-3 px-4 min-w-[220px]">
                            {o.deliveryType === "delivery" ? (
                              <div className="space-y-1">
                                <div>
                                  <span className="rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-800">
                                    🚚 Yetkazib berish
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-zinc-800 leading-snug break-words">
                                  📍 {o.customerAddress || "Manzil kiritilmagan"}
                                </p>
                                {o.customerAddress && (
                                  <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(o.customerAddress)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-zinc-500 hover:text-zinc-900 underline inline-block"
                                  >
                                    🗺 Xaritada ochish
                                  </a>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="rounded bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600">
                                  🏪 Olib ketish (Dorixonadan)
                                </span>
                                <p className="text-[11px] text-zinc-700">
                                  {o.pharmacyOrg || o.pharmacyName || "Dorixona"}
                                </p>
                                {o.pharmacyAddress && (
                                  <p className="text-[10px] text-zinc-400 break-words">
                                    📍 {o.pharmacyAddress}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                                o.status === "yetkazildi"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : o.status === "tasdiqlandi"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : o.status === "bekor"
                                  ? "bg-red-50 text-red-700 border border-red-200 font-bold"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {o.status === "yetkazildi" && "✅ Yetkazildi"}
                              {o.status === "tasdiqlandi" && "🔵 Tasdiqlandi"}
                              {o.status === "bekor" && "⚠️ Bekor qilingan"}
                              {o.status === "yangi" && "⏳ Yangi"}
                              {!["yetkazildi", "tasdiqlandi", "bekor", "yangi"].includes(o.status) && o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetail(o)}
                              className="rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs px-3 py-1.5 text-[11px] font-semibold transition"
                            >
                              👁 Batafsil
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 1.3. MUTAXASSIS CHAQIRUVLARI TAB */}
        {activeTab === "specialist_calls" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-700 flex items-start gap-3">
              <ShieldCheck size={18} className="text-zinc-800 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-zinc-900">Super-Admin Nazorat va Monitoring Rejimi</p>
                <p className="text-zinc-500 mt-0.5">
                  Mutaxassis chaqiruvlari agronom va veterinarlar tomonidan Telegram auth bot (@agroz_auth_bot) orqali to&apos;g&apos;ridan-to&apos;g&apos;ri qabul qilinadi yoki yakunlanadi. Bu bo&apos;limda siz barcha chaqiruvlarni, masofalarni va yuzaga kelgan xatoliklarni kuzatasiz.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Mijoz ismi, muammo yoki telefon..."
                  value={callSearch}
                  onChange={(e) => setCallSearch(e.target.value)}
                  className="w-full rounded-xl bg-white pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 text-xs font-semibold">
                {["all", "yangi", "qabul_qilindi", "bajarildi", "bekor"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setCallStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition ${
                      callStatusFilter === st
                        ? "bg-white text-zinc-900 font-bold shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {st === "all" ? "Barchasi" : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Mijoz (Dehqon)</th>
                      <th className="py-3 px-4">Mutaxassis</th>
                      <th className="py-3 px-4">Muammo Tavsifi</th>
                      <th className="py-3 px-4">Manzil</th>
                      <th className="py-3 px-4">Holat</th>
                      <th className="py-3 px-4 text-right">Vaqti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {adminCalls
                      .filter((c) => {
                        if (callStatusFilter !== "all" && c.status !== callStatusFilter) return false;
                        if (!callSearch.trim()) return true;
                        const q = callSearch.toLowerCase();
                        return (
                          c.customerName.toLowerCase().includes(q) ||
                          c.customerPhone.includes(q) ||
                          c.problem.toLowerCase().includes(q)
                        );
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-mono font-bold text-zinc-400">#{c.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900">{c.customerName}</p>
                            <a
                              href={`tel:${c.customerPhone}`}
                              className="text-[11px] text-zinc-500 font-mono hover:underline hover:text-zinc-900"
                            >
                              📞 {c.customerPhone}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-zinc-900">
                              {c.specialistName || "Mutaxassis"}
                            </p>
                            {c.specialistPhone && (
                              <p className="text-[10px] text-zinc-400 font-mono">{c.specialistPhone}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-sm">
                            <p className="text-xs text-zinc-800 font-medium leading-relaxed">
                              {c.problem}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-zinc-500 text-[11px] max-w-xs truncate">
                            {c.address || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                                c.status === "bajarildi"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : c.status === "qabul_qilindi"
                                  ? "bg-blue-50 text-blue-800 border border-blue-200"
                                  : c.status === "bekor"
                                  ? "bg-red-50 text-red-700 border border-red-200 font-bold"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {c.status === "bajarildi" && "✅ Bajarildi"}
                              {c.status === "qabul_qilindi" && "🔵 Qabul qilindi"}
                              {c.status === "bekor" && "⚠️ Rad etildi / Bekor"}
                              {c.status === "yangi" && "⏳ Kutilmoqda"}
                              {!["bajarildi", "qabul_qilindi", "bekor", "yangi"].includes(c.status) && c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-[11px] font-mono text-zinc-500 font-semibold whitespace-nowrap">
                              {new Date(c.createdAt).toLocaleDateString("uz-UZ", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 1.5. DORIXONA ARIZALARI VA PANEL O'RNATISH TAB */}
        {activeTab === "pharmacies" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Store className="text-zinc-900" size={20} />
                    🏪 Dorixona Arizalari va Boshqaruv Panelini O&apos;rnatish
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Telegram @agroz_auth_bot orqali ariza yuborgan dorixona egalari. Tasdiqlangandan so&apos;ng, ularga bot ichida avtomatik ravishda dori boshqaruvi va buyurtmalar qabul qilish paneli o&apos;rnatiladi.
                  </p>
                </div>
              </div>
            </div>

            {/* Yuqori xulosa kartalari */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                onClick={() => setPharmacyStatusFilter("all")}
                className={`cursor-pointer rounded-2xl p-5 border transition bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                  pharmacyStatusFilter === "all"
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Jami Dorixonalar</span>
                  <Store className="text-zinc-700" size={20} />
                </div>
                <p className="mt-2 text-2xl font-black text-zinc-900">{pharmacyList.length} ta</p>
                <p className="mt-1 text-[11px] text-zinc-500 font-medium">Barcha ro&apos;yxatdan o&apos;tgan dorixonalar</p>
              </div>

              <div
                onClick={() => setPharmacyStatusFilter("pending")}
                className={`cursor-pointer rounded-2xl p-5 border transition bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                  pharmacyStatusFilter === "pending"
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700">⏳ Kutilayotgan Arizalar</span>
                  <AlertCircle className="text-amber-600" size={20} />
                </div>
                <p className="mt-2 text-2xl font-black text-zinc-900">{pendingPharmacies.length} ta</p>
                <p className="mt-1 text-[11px] text-zinc-500 font-medium">
                  Panel o&apos;rnatish uchun arizalar
                </p>
              </div>

              <div
                onClick={() => setPharmacyStatusFilter("approved")}
                className={`cursor-pointer rounded-2xl p-5 border transition bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                  pharmacyStatusFilter === "approved"
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700">✅ Panel O&apos;rnatilgan (Faol)</span>
                  <CheckCircle2 className="text-emerald-600" size={20} />
                </div>
                <p className="mt-2 text-2xl font-black text-zinc-900">{approvedPharmacies.length} ta</p>
                <p className="mt-1 text-[11px] text-zinc-500 font-medium">
                  Botda panel ochilgan dorixonalar
                </p>
              </div>
            </div>

            {/* Qidiruv va Filterlar */}
            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Dorixona nomi, egasi, telefon yoki manzil..."
                  value={pharmacySearch}
                  onChange={(e) => setPharmacySearch(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200 text-xs font-semibold">
                <button
                  onClick={() => setPharmacyStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    pharmacyStatusFilter === "all"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Barchasi ({pharmacyList.length})
                </button>
                <button
                  onClick={() => setPharmacyStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    pharmacyStatusFilter === "pending"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ⏳ Panel o&apos;rnatilmagan ({pendingPharmacies.length})
                </button>
                <button
                  onClick={() => setPharmacyStatusFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    pharmacyStatusFilter === "approved"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ✅ Panel o&apos;rnatilgan ({approvedPharmacies.length})
                </button>
              </div>
            </div>

            {/* Dorixonalar jadvali */}
            <div className="rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Dorixona Nomi & Egasi</th>
                      <th className="py-3 px-4">Aloqa</th>
                      <th className="py-3 px-4">Manzil</th>
                      <th className="py-3 px-4 text-center">Dorilar / Buyurtmalar</th>
                      <th className="py-3 px-4">Panel Holati</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {filteredPharmacies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500 font-medium">
                          Dorixona arizalari topilmadi.
                        </td>
                      </tr>
                    ) : (
                      filteredPharmacies.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-mono text-zinc-400">#{s.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                              <Store size={14} className="text-zinc-600" />
                              {s.organization || s.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Egasi: {s.name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <a
                              href={`tel:${s.phone}`}
                              className="font-semibold text-zinc-900 hover:underline block font-mono"
                            >
                              📞 {s.phone}
                            </a>
                            {s.telegramId && (
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">TG: {s.telegramId}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-zinc-600" title={s.address || ""}>
                            {s.address || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                title="Katalogdagi dorilari soni"
                                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10.5px] font-mono font-semibold text-zinc-700 border border-zinc-200"
                              >
                                <Package size={11} /> {s.medicinesCount}
                              </span>
                              <span
                                title="Qabul qilingan buyurtmalar soni"
                                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10.5px] font-mono font-semibold text-zinc-700 border border-zinc-200"
                              >
                                <ShoppingCart size={11} /> {s.ordersCount}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {s.isApproved ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> Panel O&apos;rnatilgan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-700 border border-amber-200">
                                <AlertCircle size={11} /> Panel O&apos;rnatilmagan
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleViewPharmacyMedicines(s)}
                                title="Ushbu dorixonadagi barcha mahsulotlarni ko'rish"
                                className="flex items-center gap-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold transition"
                              >
                                <Package size={13} /> Mahsulotlar ({s.medicinesCount})
                              </button>
                              {!s.isApproved ? (
                                <>
                                  <button
                                    onClick={() => handleApproveSpecialist(s.id)}
                                    disabled={busy}
                                    title="Arizani ma'qullash va dorixona egasining Telegramiga boshqaruv panelini o'rnatish"
                                    className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition"
                                  >
                                    <CheckCircle2 size={13} /> 🚀 Panelni O&apos;rnatish
                                  </button>
                                  <button
                                    onClick={() => handleRejectSpecialist(s.id)}
                                    disabled={busy}
                                    className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition"
                                  >
                                    Rad etish
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRejectSpecialist(s.id)}
                                  disabled={busy}
                                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200 transition"
                                >
                                  ⏸ To&apos;xtatish
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSpecialist(s.id, s.organization || s.name)}
                                disabled={busy}
                                title="Dorixonani o'chirish"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-red-50 hover:text-red-600 border border-zinc-200 hover:border-red-200 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DORIXONA MAHSULOTLARI MODALI */}
            {selectedPharmacyForMeds && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-zinc-200 max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                        <Package size={18} className="text-zinc-900" />
                        {selectedPharmacyForMeds.organization || selectedPharmacyForMeds.name} mahsulotlari
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Ushbu dorixona katalogiga kiritilgan barcha dori vositalari va qoldiqlar
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPharmacyForMeds(null)}
                      className="rounded-lg bg-zinc-100 p-1.5 text-zinc-500 hover:bg-zinc-200 transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3">
                    {loadingPharmacyMeds ? (
                      <div className="py-12 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                        <RefreshCw className="animate-spin" size={16} /> Mahsulotlar yuklanmoqda...
                      </div>
                    ) : pharmacyMeds.length === 0 ? (
                      <div className="py-12 text-center text-xs text-zinc-400">
                        Ushbu dorixonada hali hech qanday dori vositasi qo&apos;shilmagan.
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {pharmacyMeds.map((med) => (
                          <div key={med.id} className="py-3 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-900 text-sm">💊 {med.name}</span>
                                <span
                                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                    med.type === "crop" || med.type === "ekin"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {med.type === "crop" || med.type === "ekin"
                                    ? "🌱 O'simliklar uchun"
                                    : "🐄 Chorva uchun"}
                                </span>
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    med.status === "bor"
                                      ? "bg-zinc-100 text-zinc-800"
                                      : "bg-red-50 text-red-600"
                                  }`}
                                >
                                  {med.status === "bor" ? "Mavjud" : "Tugagan"}
                                </span>
                              </div>
                              {med.usage && (
                                <p className="text-xs text-zinc-600 leading-relaxed max-w-lg">
                                  {med.usage}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-zinc-900 text-sm block">
                                {med.price ? `${Number(med.price).toLocaleString()} so'm` : "Narxsiz"}
                              </span>
                              {med.stock !== null && med.stock !== undefined && (
                                <span className="text-[11px] font-mono text-zinc-400">
                                  Qoldiq: {med.stock} dona
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-200 pt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      Jami: <b>{pharmacyMeds.length}</b> ta dori vositasi
                    </span>
                    <button
                      onClick={() => setSelectedPharmacyForMeds(null)}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1.6. MUTAXASSISLAR (AGRONOM & VET) TAB */}
        {activeTab === "specialists" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Users className="text-zinc-900" size={20} />
                    👨‍🌾 Mutaxassislar (Agronomlar va Veterinarlar)
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    O&apos;simlik va hayvon kasalliklarini davolash, chaqiruvlarni qabul qilish va dehqonlarga joyida maslahat berish mutaxassislari.
                  </p>
                </div>
              </div>
            </div>

            {/* Yuqori xulosa kartalari */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div
                onClick={() => setSpecialistStatusFilter("all")}
                className={`cursor-pointer rounded-2xl p-5 border transition bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                  specialistStatusFilter === "all"
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Jami Mutaxassislar</span>
                  <Users className="text-zinc-700" size={20} />
                </div>
                <p className="mt-2 text-2xl font-black text-zinc-900">{specialistOnlyList.length} ta</p>
                <p className="mt-1 text-[11px] text-zinc-500 font-medium">Barcha agronom va veterinarlar</p>
              </div>

              <div
                onClick={() => setSpecialistStatusFilter("pending")}
                className={`cursor-pointer rounded-2xl p-5 border transition bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                  specialistStatusFilter === "pending"
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700">⏳ Yangi Mutaxassis Arizalari</span>
                  <AlertCircle className="text-amber-600" size={20} />
                </div>
                <p className="mt-2 text-2xl font-black text-zinc-900">{pendingSpecialists.length} ta</p>
                <p className="mt-1 text-[11px] text-zinc-500 font-medium">
                  Tasdiqlash kutilayotgan mutaxassislar
                </p>
              </div>

              <div
                onClick={() => setSpecialistStatusFilter("approved")}
                className={`cursor-pointer rounded-2xl p-5 border transition bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
                  specialistStatusFilter === "approved"
                    ? "border-zinc-900 ring-1 ring-zinc-900"
                    : "border-zinc-200/80 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700">✅ Faol Mutaxassislar</span>
                  <CheckCircle2 className="text-emerald-600" size={20} />
                </div>
                <p className="mt-2 text-2xl font-black text-zinc-900">{approvedSpecialists.length} ta</p>
                <p className="mt-1 text-[11px] text-zinc-500 font-medium">
                  Platformada faol mutaxassislar
                </p>
              </div>
            </div>

            {/* Qidiruv va Filterlar */}
            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Mutaxassis ismi, mutaxassisligi, telefon yoki manzil..."
                  value={specialistSearch}
                  onChange={(e) => setSpecialistSearch(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200 text-xs font-semibold">
                <button
                  onClick={() => setSpecialistStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    specialistStatusFilter === "all"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Barchasi ({specialistOnlyList.length})
                </button>
                <button
                  onClick={() => setSpecialistStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    specialistStatusFilter === "pending"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ⏳ Kutilmoqda ({pendingSpecialists.length})
                </button>
                <button
                  onClick={() => setSpecialistStatusFilter("approved")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    specialistStatusFilter === "approved"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ✅ Tasdiqlangan ({approvedSpecialists.length})
                </button>
              </div>
            </div>

            {/* Mutaxassislar jadvali */}
            <div className="rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Mutaxassis</th>
                      <th className="py-3 px-4">Mutaxassislik</th>
                      <th className="py-3 px-4">Aloqa</th>
                      <th className="py-3 px-4">Manzil</th>
                      <th className="py-3 px-4">Bandlik</th>
                      <th className="py-3 px-4">Chaqiruv / Reyting</th>
                      <th className="py-3 px-4">Holat</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {filteredSpecialists.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-zinc-500 font-medium">
                          Mutaxassislar topilmadi.
                        </td>
                      </tr>
                    ) : (
                      filteredSpecialists.map((s) => (
                        <tr key={s.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-mono text-zinc-400">#{s.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900">{s.name}</p>
                            {s.experienceYears && (
                              <p className="text-[11px] text-zinc-500 mt-0.5">Tajriba: {s.experienceYears} yil</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {s.specialty || "Agronom / Veterinariya"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <a href={`tel:${s.phone}`} className="font-semibold text-zinc-900 hover:underline block font-mono">
                              📞 {s.phone}
                            </a>
                            {s.telegramId && (
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">TG: {s.telegramId}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-zinc-600" title={s.address || ""}>
                            {s.address || "—"}
                          </td>
                          <td className="py-3 px-4">
                            {s.isBusy || s.assignedOrderId ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-mono font-bold text-red-700 border border-red-200">
                                🔴 Band
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                                🟢 Bo&apos;sh
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-zinc-800">
                              <Phone size={11} className="text-zinc-400" /> {s.callsCount || 0} ta chaqiruv
                            </div>
                            <div className="flex items-center gap-1 text-[10.5px] font-bold text-amber-600 mt-0.5">
                              <Star size={11} fill="currentColor" /> {s.ratingAvg ? s.ratingAvg.toFixed(1) : "—"}
                              <span className="text-[10px] font-normal text-zinc-400">({s.ratingCount || 0} ta baho)</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {s.isApproved ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} /> Tasdiqlangan
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-700 border border-amber-200">
                                <AlertCircle size={11} /> Kutilmoqda
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!s.isApproved ? (
                                <>
                                  <button
                                    onClick={() => handleApproveSpecialist(s.id)}
                                    disabled={busy}
                                    className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 active:scale-95 transition"
                                  >
                                    <CheckCircle2 size={13} /> Tasdiqlash
                                  </button>
                                  <button
                                    onClick={() => handleRejectSpecialist(s.id)}
                                    disabled={busy}
                                    className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 border border-zinc-200 transition"
                                  >
                                    Rad etish
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleRejectSpecialist(s.id)}
                                  disabled={busy}
                                  className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200 transition"
                                >
                                  To&apos;xtatish
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteSpecialist(s.id, s.name)}
                                disabled={busy}
                                title="Mutaxassisni o'chirish"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 hover:bg-red-50 hover:text-red-600 border border-zinc-200 hover:border-red-200 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* FOYDALANUVCHILAR (DEHQONLAR & MIJOZLAR) TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Statistika kartalari */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Jami Foydalanuvchilar</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800">
                    <Users size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                    {usersStats.totalUsers}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {usersStats.registeredCount} ro&apos;yxatdan o&apos;tgan, {usersStats.telegramCount} Telegramda
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Faol Xaridorlar</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <ShoppingCart size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                    {usersStats.activeBuyersCount}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Dori vositalariga buyurtma bergan dehqonlar
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Mutaxassis Chaqirganlar</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200/60">
                    <Phone size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                    {usersStats.activeCallersCount}
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Agronom yoki veterinarga chaqiruv yo&apos;llaganlar
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Jami Xaridlar Summasi</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-bold font-mono tracking-tight text-zinc-900">
                    {usersStats.totalOrdersSum.toLocaleString()} <span className="text-xs font-normal text-zinc-500">so&apos;m</span>
                  </span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Platforma orqali amalga oshirilgan xaridlar
                  </p>
                </div>
              </div>
            </div>

            {/* Qidiruv va Filterlar */}
            <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Ism, telefon, manzil, viloyat yoki Telegram ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl bg-zinc-50 pl-10 pr-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:border-zinc-400 focus:bg-white focus:outline-none transition"
                />
              </div>

              <div className="flex flex-wrap rounded-xl bg-zinc-100 p-1 border border-zinc-200 text-xs font-semibold gap-1">
                <button
                  onClick={() => setUserFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    userFilter === "all"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Barchasi ({usersList.length})
                </button>
                <button
                  onClick={() => setUserFilter("with_orders")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    userFilter === "with_orders"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  🛒 Buyurtma qilganlar ({usersList.filter((u) => u.ordersCount > 0).length})
                </button>
                <button
                  onClick={() => setUserFilter("with_calls")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    userFilter === "with_calls"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  📞 Mutaxassis chaqirganlar ({usersList.filter((u) => u.callsCount > 0).length})
                </button>
                <button
                  onClick={() => setUserFilter("telegram")}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    userFilter === "telegram"
                      ? "bg-white text-zinc-900 font-bold shadow-xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  ✈️ Telegram ({usersList.filter((u) => u.telegramId).length})
                </button>
              </div>
            </div>

            {/* Foydalanuvchilar jadvali */}
            <div className="rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Foydalanuvchi</th>
                      <th className="py-3 px-4">Aloqa</th>
                      <th className="py-3 px-4">Hudud / Manzil (Qayerdan)</th>
                      <th className="py-3 px-4">Buyurtmalar</th>
                      <th className="py-3 px-4">Chaqiruvlar</th>
                      <th className="py-3 px-4">Qo&apos;shilgan sana</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-zinc-500 font-medium">
                          Foydalanuvchilar topilmadi.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-mono text-zinc-400">#{u.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900">{u.name}</p>
                            <span className="inline-block mt-0.5 text-[10px] font-mono text-zinc-500">
                              {u.isRegistered ? "Ro'yxatdan o'tgan" : "To'g'ridan-to'g'ri mijoz"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {u.phone ? (
                              <a href={`tel:${u.phone}`} className="font-semibold text-zinc-900 hover:underline block font-mono">
                                📞 {u.phone}
                              </a>
                            ) : (
                              <span className="text-zinc-400 font-mono">—</span>
                            )}
                            {u.telegramId && (
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">TG: {u.telegramId}</p>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-zinc-400 shrink-0" />
                              <span className="truncate font-medium text-zinc-800" title={u.address || u.region || "Ko'rsatilmagan"}>
                                {u.address || u.region || <span className="text-zinc-400 font-normal">Ko&apos;rsatilmagan</span>}
                              </span>
                            </div>
                            {u.district && (
                              <p className="text-[10px] text-zinc-500 mt-0.5 pl-4">{u.district}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {u.ordersCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-800 border border-emerald-200/80">
                                🛒 {u.ordersCount} ta ({u.totalSpent.toLocaleString()} so&apos;m)
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {u.callsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-mono font-bold text-blue-800 border border-blue-200/80">
                                📞 {u.callsCount} ta chaqiruv
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString("uz-UZ") : "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedUserDetail(u)}
                              className="rounded-xl bg-zinc-900 hover:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
                            >
                              Batafsil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. VILOYATLAR TAHLILI TAB */}
        {activeTab === "regions" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Globe size={18} className="text-zinc-900" /> 14 ta Hudud Bo&apos;yicha Kompleks Tahlil va Statistika
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Qaysi viloyatda qancha foydalanuvchi, mutaxassis va dorixona borligi, shuningdek dori buyurtmalari va mutaxassis chaqiruvlari tahlili.
                  </p>
                </div>
              </div>

              {/* Viloyatlar xulosa jadvali */}
              <div className="rounded-xl border border-zinc-200 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase text-[10px] tracking-wider font-mono">
                        <th className="py-3 px-4">Viloyat / Hudud</th>
                        <th className="py-3 px-4">👥 Foydalanuvchilar</th>
                        <th className="py-3 px-4">🏪 Dorixonalar</th>
                        <th className="py-3 px-4">👨‍⚕️ Mutaxassislar</th>
                        <th className="py-3 px-4">🛒 Dori Buyurtmalari</th>
                        <th className="py-3 px-4">📞 Mutaxassis Chaqiruvlari</th>
                        <th className="py-3 px-4">💰 Savdo Hajmi</th>
                        <th className="py-3 px-4 text-right">Ulushi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {regions.map((r, i) => (
                        <tr key={i} className="hover:bg-zinc-50/70 transition">
                          <td className="py-3 px-4 font-bold text-zinc-900">{r.region}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-zinc-800">{r.users} ta</td>
                          <td className="py-3 px-4 font-mono font-semibold text-zinc-800">{r.pharmacies} ta</td>
                          <td className="py-3 px-4 font-mono font-semibold text-zinc-800">{r.specialists} ta</td>
                          <td className="py-3 px-4 font-mono font-semibold text-zinc-800">{r.orders} ta</td>
                          <td className="py-3 px-4 font-mono font-semibold text-blue-700">{r.calls || 0} ta</td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                            {r.totalSales ? `${r.totalSales.toLocaleString()} so'm` : "0 so'm"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] font-bold text-zinc-700">
                            {r.sharePercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Viloyatlar kartochkalari */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regions.map((r, i) => (
                  <div key={i} className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 text-sm">{r.region}</h3>
                      <span className="rounded-full bg-white border border-zinc-200 px-2.5 py-0.5 text-[10px] font-mono font-bold text-zinc-700 shadow-2xs">
                        {r.sharePercent}% ulush
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-white p-2 border border-zinc-200/60 shadow-2xs">
                        <span className="text-zinc-500 text-[10px]">👥 Foydalanuvchilar</span>
                        <p className="font-bold text-zinc-900 font-mono">{r.users} ta</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-zinc-200/60 shadow-2xs">
                        <span className="text-zinc-500 text-[10px]">🏪 Dorixonalar</span>
                        <p className="font-bold text-zinc-900 font-mono">{r.pharmacies} ta</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-zinc-200/60 shadow-2xs">
                        <span className="text-zinc-500 text-[10px]">👨‍⚕️ Mutaxassislar</span>
                        <p className="font-bold text-zinc-900 font-mono">{r.specialists} ta</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-zinc-200/60 shadow-2xs">
                        <span className="text-zinc-500 text-[10px]">🛒 Dori Buyurtmalari</span>
                        <p className="font-bold text-zinc-900 font-mono">{r.orders} ta</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-zinc-200/60 shadow-2xs">
                        <span className="text-zinc-500 text-[10px]">📞 Chaqiruvlar</span>
                        <p className="font-bold text-blue-700 font-mono">{r.calls || 0} ta</p>
                      </div>
                      <div className="rounded-lg bg-white p-2 border border-zinc-200/60 shadow-2xs">
                        <span className="text-zinc-500 text-[10px]">💰 Savdo summasi</span>
                        <p className="font-bold text-zinc-900 font-mono text-[11px] truncate">
                          {r.totalSales ? `${r.totalSales.toLocaleString()} so'm` : "0 so'm"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. FIKRLAR & SHARHLAR MODERATSIYASI TAB */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-zinc-900" /> Sharhlar va Fikrlar Moderatsiyasi
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Foydalanuvchilar tomonidan dorixona va mutaxassislarga berilgan baholarni ko&apos;rish va keraksizlarini o&apos;chirish.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="Qidiruv..."
                      className="rounded-xl bg-zinc-50 pl-8 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
                    />
                  </div>

                  <select
                    value={reviewFilterStars}
                    onChange={(e) => setReviewFilterStars(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-900 border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:bg-white transition"
                  >
                    <option value="all">Barcha yulduzlar</option>
                    <option value={5}>5 yulduz ★★★★★</option>
                    <option value={4}>4 yulduz ★★★★</option>
                    <option value={3}>3 yulduz ★★★</option>
                    <option value={2}>2 yulduz ★★</option>
                    <option value={1}>1 yulduz ★</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    Fikrlar topilmadi
                  </div>
                ) : (
                  filteredReviews.map((r) => (
                    <div
                      key={`${r.type}-${r.id}`}
                      className="flex items-start justify-between gap-4 rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-mono font-bold bg-white text-zinc-700 border border-zinc-200 shadow-2xs"
                          >
                            {r.type === "order" ? "Buyurtma Sharhi" : "Mutaxassis Xizmati"}
                          </span>
                          <span className="font-bold text-zinc-900 text-xs">{r.targetName}</span>
                          <span className="text-[11px] text-zinc-400 font-mono">({r.date})</span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold pt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < r.stars ? "currentColor" : "none"}
                              className={i < r.stars ? "text-amber-400" : "text-zinc-300"}
                            />
                          ))}
                          <span className="ml-1 text-zinc-700 font-mono font-semibold">{r.stars}.0</span>
                        </div>

                        {r.comment && (
                          <p className="text-xs text-zinc-700 italic pt-1">«{r.comment}»</p>
                        )}

                        <p className="text-[11px] text-zinc-500 font-mono">
                          Qoldiruvchi: {r.customerName || "Noma'lum dehqon"} ({r.customerPhone || "—"})
                        </p>
                      </div>

                      <button
                        onClick={() => deleteReview(r.type, r.id)}
                        title="O'chirish"
                        className="rounded-lg bg-white p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-zinc-200 hover:border-red-200 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. SOZLAMALAR & YETKAZIB BERISH TAB */}
        {activeTab === "settings" && (
          <form onSubmit={saveSettings} className="space-y-6">
            {/* 4.1. Qidiruv Radiusi va Qamrov Sozlamalari */}
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <MapPin size={18} className="text-zinc-900" /> 📍 Qidiruv Radiusi va Qamrov Sozlamalari
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Platformada dorixonalar, mutaxassislar va buyurtmalar qabul qilish uchun qamrov radiuslari (km). Hech qanday kod o&apos;zgartirishsiz boshqariladi.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Standart Qidiruv Radiusi
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">default_radius_km</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settingsValues["default_radius_km"] ?? "15"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, default_radius_km: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-mono font-bold text-zinc-500">km</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Bosh sahifadagi umumiy qidiruv radiusi.</p>
                </div>

                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Dorixonalar Ko&apos;rinish Radiusi
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">pharmacy_radius_km</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settingsValues["pharmacy_radius_km"] ?? "15"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, pharmacy_radius_km: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-mono font-bold text-zinc-500">km</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Fermerga dorixonalar ko&apos;rinadigan masofa.</p>
                </div>

                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Mutaxassislar Ko&apos;rinish Radiusi
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">specialist_radius_km</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settingsValues["specialist_radius_km"] ?? "25"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, specialist_radius_km: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-mono font-bold text-zinc-500">km</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Agronom va veterinarlar ko&apos;rinadigan masofa.</p>
                </div>

                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Buyurtmalar Qabul Radiusi
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">order_max_radius_km</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settingsValues["order_max_radius_km"] ?? "50"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, order_max_radius_km: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-mono font-bold text-zinc-500">km</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Buyurtma va chaqiruv qabul qilish maksimal radiusi.</p>
                </div>
              </div>
            </div>

            {/* 4.2. Yetkazib Berish (Delivery) Sozlamalari */}
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
                <div>
                  <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                    <Truck size={18} className="text-zinc-900" /> 🚚 Yetkazib Berish (Delivery) Tizimi Sozlamalari
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Dorilar yetkazib berish shartlari: bepul minimal buyurtma soni (masalan 5 tadan ko&apos;p bo&apos;lsa BEPUL) va km bo&apos;yicha to&apos;lov narxlari.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* delivery_enabled */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Yetkazib Berish Xizmati Holati
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">delivery_enabled</p>
                  <select
                    value={settingsValues["delivery_enabled"] ?? "true"}
                    onChange={(e) => setSettingsValues({ ...settingsValues, delivery_enabled: e.target.value })}
                    className="w-full rounded-xl bg-white px-3 py-2.5 text-xs text-zinc-900 font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                  >
                    <option value="true">✅ Faol (Yoqilgan)</option>
                    <option value="false">❌ O&apos;chirilgan</option>
                  </select>
                </div>

                {/* delivery_min_order_qty */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Bepul Yetkazib Berish Miqdori
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">delivery_min_order_qty</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settingsValues["delivery_min_order_qty"] ?? "5"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, delivery_min_order_qty: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">ta dori</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Buyurtmada {settingsValues["delivery_min_order_qty"] || 5} ta yoki undan ortiq dori bo&apos;lsa, yetkazish <b>BEPUL</b> bo&apos;ladi.
                  </p>
                </div>

                {/* delivery_price_per_km */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Har 1 Kilometr Uchun To&apos;lov
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">delivery_price_per_km</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={settingsValues["delivery_price_per_km"] ?? "3000"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, delivery_price_per_km: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">so&apos;m/km</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Minimal sondan kam bo&apos;lsa, har 1 km masofa uchun hisoblanadi.
                  </p>
                </div>

                {/* delivery_base_price */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Boshlang&apos;ich Bazaviy Xizmat Narxi
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">delivery_base_price</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={settingsValues["delivery_base_price"] ?? "10000"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, delivery_base_price: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">so&apos;m</span>
                  </div>
                </div>

                {/* delivery_max_distance_km */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <label className="block text-xs font-bold text-zinc-800">
                    Maksimal Yetkazish Masofasi
                  </label>
                  <p className="text-[11px] font-mono text-zinc-400">delivery_max_distance_km</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={settingsValues["delivery_max_distance_km"] ?? "50"}
                      onChange={(e) => setSettingsValues({ ...settingsValues, delivery_max_distance_km: e.target.value })}
                      className="w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 font-mono font-bold border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                    />
                    <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4.3. Tizim Parametrlari va Botlar */}
            <div className="rounded-2xl bg-white p-6 border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-2">
                <Settings size={18} className="text-zinc-900" /> Tizim Parametrlari va Telegram Botlar Sozlamalari
              </h2>
              <p className="text-xs text-zinc-500 mb-6">
                Bu yerdagi o&apos;zgarishlar ma&apos;lumotlar bazasida saqlanadi va darhol real-vaqt rejimida kuchga kiradi.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                {settingsList
                  .filter((item) => !item.key.startsWith("delivery_") && !item.key.endsWith("_radius_km") && item.key !== "default_radius_km")
                  .map((item) => (
                    <div key={item.key} className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                      <label className="block text-xs font-bold text-zinc-800">
                        {item.label}
                      </label>
                      <p className="text-[11px] font-mono text-zinc-400">{item.key}</p>

                      <input
                        type={item.secret ? "password" : "text"}
                        value={settingsValues[item.key] ?? ""}
                        onChange={(e) =>
                          setSettingsValues({ ...settingsValues, [item.key]: e.target.value })
                        }
                        placeholder={item.preview || "Qiymatni kiriting..."}
                        className="w-full rounded-xl bg-white px-3.5 py-2.5 text-xs text-zinc-900 font-mono border border-zinc-200 focus:outline-none focus:border-zinc-400 transition"
                      />
                    </div>
                  ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50 transition active:scale-95"
                >
                  {busy ? <RefreshCw className="animate-spin" size={16} /> : "Barcha Sozlamalarni Saqlash"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 5. BROADCAST TAB */}
        {activeTab === "broadcast" && <AdminWeatherAlertsBroadcast />}

        {/* BUYURTMA BATAFSIL MODAL */}
        {selectedOrderDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-2xl rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 p-5 bg-zinc-50/80">
                <div className="flex items-center gap-2.5">
                  <Package className="text-zinc-800" size={20} />
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                      Buyurtma #{selectedOrderDetail.id}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                          selectedOrderDetail.status === "yetkazildi"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : selectedOrderDetail.status === "tasdiqlandi"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : selectedOrderDetail.status === "bekor"
                            ? "bg-zinc-100 text-zinc-500 border border-zinc-200 line-through"
                            : "bg-zinc-900 text-white font-bold"
                        }`}
                      >
                        {selectedOrderDetail.status}
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Yaratilgan sana: {selectedOrderDetail.createdAt ? new Date(selectedOrderDetail.createdAt).toLocaleString("uz-UZ") : "—"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="rounded-lg p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 bg-white">
                {/* 1. Mijoz va Dorixona */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                    <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">
                      👤 Mijoz Ma&apos;lumotlari
                    </span>
                    <p className="font-bold text-zinc-900 text-sm">{selectedOrderDetail.customerName}</p>
                    <a
                      href={`tel:${selectedOrderDetail.customerPhone}`}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-800 hover:underline"
                    >
                      📞 {selectedOrderDetail.customerPhone}
                    </a>
                  </div>

                  <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                    <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">
                      🏪 Dorixona Ma&apos;lumotlari
                    </span>
                    <p className="font-bold text-zinc-900 text-sm">
                      {selectedOrderDetail.pharmacyOrg || selectedOrderDetail.pharmacyName || "Dorixona"}
                    </p>
                    {selectedOrderDetail.pharmacyPhone && (
                      <a
                        href={`tel:${selectedOrderDetail.pharmacyPhone}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-700 hover:underline block"
                      >
                        📞 {selectedOrderDetail.pharmacyPhone}
                      </a>
                    )}
                    {selectedOrderDetail.pharmacyAddress && (
                      <p className="text-[11px] text-zinc-500">
                        📍 {selectedOrderDetail.pharmacyAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Yetkazish va Aniq Manzil */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2">
                  <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">
                    🚚 Yetkazib Berish & Manzil
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${
                        selectedOrderDetail.deliveryType === "delivery"
                          ? "bg-zinc-900 text-white"
                          : "bg-white text-zinc-700 border border-zinc-200 shadow-2xs"
                      }`}
                    >
                      {selectedOrderDetail.deliveryType === "delivery" ? "🚚 Kuryer orqali yetkazish" : "🏪 Dorixonadan olib ketish"}
                    </span>
                  </div>

                  {selectedOrderDetail.deliveryType === "delivery" ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-bold text-zinc-900">Yetkazish manzili:</p>
                      <p className="text-sm font-semibold text-zinc-800 bg-white p-2.5 rounded-lg border border-zinc-200/80 break-words shadow-2xs">
                        📍 {selectedOrderDetail.customerAddress || "Aniq manzil kiritilmagan"}
                      </p>
                      {selectedOrderDetail.customerAddress && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(selectedOrderDetail.customerAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-900 underline pt-1 font-mono"
                        >
                          🗺 Google Xaritasida ochish
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-1">
                      Mijoz dorixonaga kelib, dori vositalarini o&apos;zi olib ketadi.
                    </p>
                  )}
                </div>

                {/* 3. Buyurtma Qilingan Mahsulotlar Ro'yxati */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-500 font-bold">
                      📦 Buyurtma Qilingan Dorilar ({selectedOrderDetail.items?.length ?? 0} xil)
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-900">
                      Jami: {selectedOrderDetail.totalSum ? `${selectedOrderDetail.totalSum.toLocaleString()} so'm` : "—"}
                    </span>
                  </div>

                  {!selectedOrderDetail.items || selectedOrderDetail.items.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-3 text-center font-mono">Dori vositalari ko&apos;rsatilmagan</p>
                  ) : (
                    <div className="divide-y divide-zinc-200/80">
                      {selectedOrderDetail.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
                          <div>
                            <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                              <span>💊</span> {it.name}
                            </p>
                            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                              Dona narxi: {it.price ? `${it.price.toLocaleString()} so'm` : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="rounded bg-white px-2 py-0.5 font-mono font-bold text-zinc-800 border border-zinc-200 shadow-2xs text-xs">
                              {it.qty} dona
                            </span>
                            {it.price && (
                              <p className="text-xs font-mono font-bold text-zinc-900 mt-1">
                                {(it.price * it.qty).toLocaleString()} so&apos;m
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Mijoz Izohi */}
                {selectedOrderDetail.note && (
                  <div className="rounded-xl bg-zinc-50/80 p-3.5 border border-zinc-200/80">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 font-bold block mb-1">
                      📝 Mijoz Izohi:
                    </span>
                    <p className="text-xs text-zinc-700 italic whitespace-pre-line">
                      {selectedOrderDetail.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer / Holatni o'zgartirish */}
              <div className="border-t border-zinc-200 p-4 bg-zinc-50/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600 font-semibold">Holatni o&apos;zgartirish:</span>
                  {["tasdiqlandi", "yetkazildi", "bekor"].map((st) => (
                    <button
                      key={st}
                      onClick={async () => {
                        await handleUpdateOrderStatus(selectedOrderDetail.id, st);
                        setSelectedOrderDetail({ ...selectedOrderDetail, status: st });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize transition font-bold ${
                        selectedOrderDetail.status === st
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="rounded-xl bg-white hover:bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-700 border border-zinc-200 shadow-2xs transition"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Foydalanuvchi Batafsil Modali (Orders + Calls + Location) */}
        {selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-zinc-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                      <span>{selectedUserDetail.name}</span>
                      <span className="rounded-md bg-zinc-200/80 px-2 py-0.5 text-[10.5px] font-mono text-zinc-700">
                        #{selectedUserDetail.id}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      {selectedUserDetail.isRegistered ? "Ro'yxatdan o'tgan foydalanuvchi" : "To'g'ridan-to'g'ri xaridor / mijoz"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 text-sm">
                {/* 1. Manzil va Profil ma'lumotlari */}
                <div className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-3">
                  <span className="text-[10.5px] uppercase font-mono tracking-wider text-zinc-500 font-bold block">
                    📍 Foydalanuvchi Qayerdan & Aloqa
                  </span>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Asosiy Manzil / Hudud:</p>
                      <p className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                        <MapPin size={14} className="text-zinc-500 shrink-0" />
                        <span>{selectedUserDetail.address || selectedUserDetail.region || "Ko'rsatilmagan"}</span>
                      </p>
                      {selectedUserDetail.address && (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(selectedUserDetail.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-900 underline font-mono pt-1"
                        >
                          🗺 Xaritada ochish
                        </a>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500">Aloqa ma&apos;lumotlari:</p>
                      {selectedUserDetail.phone ? (
                        <a href={`tel:${selectedUserDetail.phone}`} className="text-xs font-bold text-zinc-900 hover:underline block font-mono">
                          📞 {selectedUserDetail.phone}
                        </a>
                      ) : (
                        <p className="text-xs text-zinc-400 font-mono">Telefon ko&apos;rsatilmagan</p>
                      )}
                      {selectedUserDetail.telegramId && (
                        <p className="text-[11px] text-zinc-600 font-mono">
                          Telegram ID: {selectedUserDetail.telegramId}
                        </p>
                      )}
                      <p className="text-[10.5px] text-zinc-400 font-mono">
                        Qo&apos;shilgan: {selectedUserDetail.createdAt ? new Date(selectedUserDetail.createdAt).toLocaleString("uz-UZ") : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Qilingan Buyurtmalar Ro'yxati */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                      <ShoppingCart size={15} /> Qilingan Buyurtmalar ({selectedUserDetail.orders.length} ta)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      Jami xarid: {selectedUserDetail.totalSpent.toLocaleString()} so&apos;m
                    </span>
                  </div>

                  {selectedUserDetail.orders.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                      Ushbu foydalanuvchi hali dori buyurtma qilmagan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUserDetail.orders.map((ord) => (
                        <div key={ord.id} className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-zinc-900">Buyurtma #{ord.id}</span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                                  ord.status === "yangi"
                                    ? "bg-amber-100 text-amber-900"
                                    : ord.status === "yetkazildi"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : ord.status === "tasdiqlandi"
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-zinc-200 text-zinc-700"
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500">
                              {new Date(ord.createdAt).toLocaleString("uz-UZ")}
                            </span>
                          </div>

                          <div className="grid gap-2 text-xs sm:grid-cols-2">
                            <div>
                              <p className="text-zinc-500 text-[11px]">Dorixona:</p>
                              <p className="font-semibold text-zinc-900">🏪 {ord.pharmacyName}</p>
                              {ord.pharmacyPhone && (
                                <p className="text-[11px] font-mono text-zinc-500">📞 {ord.pharmacyPhone}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-zinc-500 text-[11px]">Yetkazish manzili:</p>
                              <p className="font-semibold text-zinc-900">
                                {ord.deliveryType === "delivery" ? "🚚 Kuryer" : "🏪 Olib ketish"}
                                {ord.customerAddress ? ` — ${ord.customerAddress}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Mahsulotlar */}
                          <div className="rounded-lg bg-white p-3 border border-zinc-200/60">
                            <p className="text-[10px] uppercase font-mono font-bold text-zinc-400 mb-2">
                              Buyurtma qilingan dorilar:
                            </p>
                            <div className="divide-y divide-zinc-100">
                              {ord.items.map((item, itIdx) => (
                                <div key={itIdx} className="flex items-center justify-between py-1.5 text-xs">
                                  <span className="font-medium text-zinc-800">💊 {item.name}</span>
                                  <div className="text-right font-mono text-zinc-600">
                                    <span>{item.qty} dona</span> × <span>{item.price.toLocaleString()} so&apos;m</span> = <span className="font-bold text-zinc-900">{(item.qty * item.price).toLocaleString()} so&apos;m</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-zinc-200 mt-2 pt-2 text-right">
                              <span className="text-xs font-mono font-bold text-zinc-900">
                                Jami: {ord.totalSum.toLocaleString()} so&apos;m
                              </span>
                            </div>
                          </div>

                          {ord.note && (
                            <p className="text-[11px] text-zinc-600 italic bg-white p-2 rounded-lg border border-zinc-200/60">
                              Mijoz izohi: {ord.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Mutaxassis Chaqiruvlari Ro'yxati */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                      <Phone size={15} /> Mutaxassis Chaqiruvlari ({selectedUserDetail.specialistCalls.length} ta)
                    </span>
                  </div>

                  {selectedUserDetail.specialistCalls.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                      Ushbu foydalanuvchi hali agronom yoki veterinarga chaqiruv yo&apos;llamagan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUserDetail.specialistCalls.map((call) => (
                        <div key={call.id} className="rounded-xl bg-zinc-50/80 p-4 border border-zinc-200/80 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-zinc-900">Chaqiruv #{call.id}</span>
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                                  call.status === "yangi"
                                    ? "bg-blue-100 text-blue-900"
                                    : call.status === "bajarildi"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-zinc-200 text-zinc-700"
                                }`}
                              >
                                {call.status}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500">
                              {new Date(call.createdAt).toLocaleString("uz-UZ")}
                            </span>
                          </div>

                          <div className="grid gap-2 text-xs sm:grid-cols-2">
                            <div>
                              <p className="text-zinc-500 text-[11px]">Chaqirilgan Mutaxassis:</p>
                              <p className="font-bold text-zinc-900">
                                👨‍⚕️ {call.specialistName}
                                <span className="ml-1.5 font-normal text-zinc-500">({call.specialistRole === "pharmacy" ? "Dorixona" : (call.specialistSpecialty || "Mutaxassis")})</span>
                              </p>
                              {call.specialistPhone && (
                                <a href={`tel:${call.specialistPhone}`} className="text-[11px] font-mono text-zinc-700 hover:underline">
                                  📞 {call.specialistPhone}
                                </a>
                              )}
                            </div>
                            <div>
                              <p className="text-zinc-500 text-[11px]">Chaqiruv manzili:</p>
                              <p className="font-medium text-zinc-800">
                                📍 {call.address || "Manzil ko'rsatilmagan"}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-lg bg-white p-3 border border-zinc-200/60">
                            <p className="text-[10px] uppercase font-mono font-bold text-zinc-400 mb-1">
                              Mijoz shikoyati / Ekin yoki chorvadagi muammo:
                            </p>
                            <p className="text-xs text-zinc-800 whitespace-pre-line font-sans">
                              {call.problem}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-zinc-200 p-4 bg-zinc-50/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteUser(selectedUserDetail.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 text-xs font-bold transition active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>Profilni butunlay o&apos;chirish</span>
                </button>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

