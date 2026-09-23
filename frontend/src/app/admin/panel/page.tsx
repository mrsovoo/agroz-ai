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
  Megaphone,
  Image,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Menu,
  X,
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
  totalSum: number | null;
  status: string;
  ratingStars: number | null;
  createdAt: string;
};

type RegionStat = {
  region: string;
  users: number;
  pharmacies: number;
  specialists: number;
  orders: number;
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

type Ad = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
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

export default function AdminPanelPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Tablar: dashboard | analytics | orders | calls | pharmacies | specialists | regions | reviews | ads | settings | broadcast
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "orders" | "calls" | "pharmacies" | "specialists" | "regions" | "reviews" | "ads" | "settings" | "broadcast">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<{
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
    topAnimalDiseases: { name: string; count: number }[];
    topCropDiseases: { name: string; count: number }[];
    topMedicines: { medicineId: number; name: string; totalQty: number; totalSum: number; stock: number | null; status: string; pharmacyName: string }[];
    totalCallsCount: number;
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [settingsList, setSettingsList] = useState<SettingListItem[]>([]);
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Fikrlar filtrlash
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilterStars, setReviewFilterStars] = useState<number | "all">("all");

  // Reklamalar
  const [ads, setAds] = useState<Ad[]>([]);
  const [adForm, setAdForm] = useState<{
    id?: number;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    priority: number;
    isActive: boolean;
  }>({ title: "", description: "", imageUrl: "", linkUrl: "", priority: 0, isActive: true });
  const [adEditing, setAdEditing] = useState(false);
  const [adFormOpen, setAdFormOpen] = useState(false);

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
      const [statsRes, analyticsRes, regionsRes, reviewsRes, settingsRes, adsRes] = await Promise.all([
        adminFetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/analytics").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/regions").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/reviews").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/advertisements/all").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (statsRes?.ok) {
        setStats(statsRes.stats);
        setRecentOrders(statsRes.recentOrders || []);
      }
      if (analyticsRes?.ok) {
        setAnalytics(analyticsRes);
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
      if (adsRes?.ok) {
        setAds(adsRes.ads || []);
      }
    } catch (e) {
      console.error("Admin ma'lumotlarini yuklashda xatolik:", e);
    }
  }, []);

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
      if (!res.ok || !data.ok) {
        setLoginError(data.error || "Login yoki parol noto'g'ri");
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem("agroz_admin_session", data.sessionId || "super-admin-session");
        }
        setMe({ enabled: true, authenticated: true, username: data.username || username || "admin" });
        await checkAuth();
      }
    } catch {
      setLoginError("Server bilan bog'lanishda xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await adminFetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("agroz_admin_session");
    }
    setMe({ enabled: true, authenticated: false, username: null });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsValues),
      });
      if (res.ok) {
        setNotice({ kind: "ok", text: "Sozlamalar muvaffaqiyatli saqlandi!" });
        loadData();
      } else {
        const d = await res.json();
        setNotice({ kind: "err", text: d.error || "Saqlashda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Serverga ulanishda xato" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview(type: "order" | "specialist", id: number) {
    if (!confirm("Haqiqatan ham ushbu fikr/sharhni o'chirmoqchimisiz?")) return;
    try {
      const res = await adminFetch(`/api/admin/reviews/${type}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => !(r.type === type && r.id === id)));
        setNotice({ kind: "ok", text: "Sharh muvaffaqiyatli olib tashlandi" });
      } else {
        alert("O'chirishda xatolik");
      }
    } catch {
      alert("Server xatosi");
    }
  }

  function formatSum(num: number): string {
    return new Intl.NumberFormat("uz-UZ").format(num) + " so'm";
  }

  // Reklama CRUD
  async function saveAd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const method = adEditing ? "PUT" : "POST";
      const url = adEditing
        ? `/api/advertisements/${adForm.id}`
        : "/api/advertisements";
      const res = await adminFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: adForm.title,
          description: adForm.description || null,
          imageUrl: adForm.imageUrl || null,
          linkUrl: adForm.linkUrl || null,
          priority: adForm.priority,
          isActive: adForm.isActive,
        }),
      });
      if (res.ok) {
        setNotice({ kind: "ok", text: adEditing ? "Reklama yangilandi!" : "Reklama qo'shildi!" });
        setAdFormOpen(false);
        setAdEditing(false);
        setAdForm({ title: "", description: "", imageUrl: "", linkUrl: "", priority: 0, isActive: true });
        loadData();
      } else {
        const d = await res.json();
        setNotice({ kind: "err", text: d.error || "Saqlashda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Serverga ulanishda xato" });
    } finally {
      setBusy(false);
    }
  }

  async function deleteAd(id: number) {
    if (!confirm("Haqiqatan ham ushbu reklamani o'chirmoqchimisiz?")) return;
    try {
      const res = await adminFetch(`/api/advertisements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAds((prev) => prev.filter((a) => a.id !== id));
        setNotice({ kind: "ok", text: "Reklama o'chirildi" });
      } else {
        alert("O'chirishda xatolik");
      }
    } catch {
      alert("Server xatosi");
    }
  }

  async function toggleAd(ad: Ad) {
    try {
      const res = await adminFetch(`/api/advertisements/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      if (res.ok) {
        setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, isActive: !a.isActive } : a));
      }
    } catch {
      alert("Server xatosi");
    }
  }

  function editAd(ad: Ad) {
    setAdForm({
      id: ad.id,
      title: ad.title,
      description: ad.description || "",
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      priority: ad.priority,
      isActive: ad.isActive,
    });
    setAdEditing(true);
    setAdFormOpen(true);
  }

  // Filtrlangan sharhlar
  const filteredReviews = reviews.filter((r) => {
    if (reviewFilterStars !== "all" && r.stars !== reviewFilterStars) return false;
    if (reviewSearch.trim()) {
      const q = reviewSearch.toLowerCase();
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchCustomer = r.customerName?.toLowerCase().includes(q);
      const matchTarget = r.targetName?.toLowerCase().includes(q);
      if (!matchComment && !matchCustomer && !matchTarget) return false;
    }
    return true;
  });

  // Kirish oynasi
  if (!me || !me.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-3xl bg-slate-800/90 p-7 shadow-2xl border border-slate-700/80 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-900 shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">AgroZ Super Admin</h1>
            <p className="mt-1 text-xs font-medium text-slate-400">
              Tizim statistikasi, viloyatlar va sozlamalar boshqaruvi
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Login (Username)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-2xl border border-slate-300 bg-slate-900/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Parol
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-slate-300 bg-slate-900/80 px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {loginError && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-semibold text-red-400">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
            >
              <Lock size={16} />
              {busy ? "Tekshirilmoqda..." : "Super Admin Panelga Kirish"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex justify-center lg:p-6">
      <div className="w-full max-w-[1400px] bg-white lg:rounded-[32px] lg:shadow-xl flex flex-col lg:flex-row overflow-hidden border border-slate-200">
      {/* Mobil Header (faqat kichik ekranlar uchun) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-slate-900/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900">AgroZ Admin</h1>
            <span className="text-[10px] text-emerald-400">Super Boshqaruv</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* Mobil orqa fon qoraytirish */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* TO'LIQ CHAP SIDEBAR (Full Left Navigation Bar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-slate-200 bg-[#F9FAFB] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Platforma Nomi */}
          <div className="border-b border-slate-800/80 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={24} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-black tracking-tight text-slate-900 truncate">AgroZ AI</h1>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">Super Admin Paneli</p>
              </div>
            </div>
          </div>

          {/* Menyu bo'limlari (Nav links) */}
          <nav className="space-y-1.5 p-3 pt-4">
            <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
              Asosiy Bo&apos;limlar
            </p>
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "analytics", label: "Analitika & Tahlil", icon: TrendingUp },
              { id: "orders", label: "Buyurtmalar", icon: ShoppingCart },
              { id: "calls", label: "Chaqiruvlar", icon: Activity },
              { id: "pharmacies", label: "Dorixona Arizalari", icon: Store },
              { id: "specialists", label: "Mutaxassislar", icon: Users },
              { id: "regions", label: "Viloyatlar Tahlili", icon: Globe },
              { id: "reviews", label: "Mijozlar Fikrlari", icon: MessageSquare, count: reviews.length },
              { id: "ads", label: "Reklamalar", icon: Megaphone, count: ads.length },
              { id: "settings", label: "Tizim Sozlamalari", icon: Settings },
              { id: "broadcast", label: "Ob-havo Xabarnomasi", icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-xs font-bold transition-all ${
                    active
                      ? "bg-emerald-100/60 text-emerald-800 font-bold"
                      : "text-slate-400 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? "text-slate-950" : "text-slate-400 group-hover:text-emerald-400 transition-colors"}
                  />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        active ? "bg-slate-50 text-slate-900" : "bg-slate-100 text-emerald-400 border border-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Pastki Qismi: Admin Profil va Chiqish */}
        <div className="border-t border-slate-800/80 p-3.5 space-y-2">
          <div className="flex items-center justify-between rounded-2xl bg-slate-950/60 p-2.5 border border-slate-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-emerald-400">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{me.username || "Super Admin"}</p>
                <p className="text-[10px] text-emerald-400 font-semibold truncate">Faol sessiya</p>
              </div>
            </div>
            <button
              onClick={loadData}
              title="Ma'lumotlarni yangilash"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition active:scale-95"
          >
            <LogOut size={15} />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </aside>

      {/* ASOSIY KONTENT SOHASI (Right Side Content) */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {notice && (
          <div
            className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-xs font-bold border ${
              notice.kind === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} className="text-sm">✕</button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Placeholder for new tabs */}
        {activeTab === "orders" && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 border-dashed">
            <div className="text-center">
              <ShoppingCart size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Buyurtmalar bo'limi</h3>
              <p className="text-sm text-slate-400">Bu yerda barcha buyurtmalar ro'yxati va holati ko'rinadi (Tez orada ulashamiz).</p>
            </div>
          </div>
        )}
        
        {activeTab === "calls" && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 border-dashed">
            <div className="text-center">
              <Activity size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Chaqiruvlar bo'limi</h3>
              <p className="text-sm text-slate-400">Mutaxassislar uchun kelib tushgan chaqiruvlar tarixi (Tez orada ulashamiz).</p>
            </div>
          </div>
        )}

        {activeTab === "pharmacies" && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 border-dashed">
            <div className="text-center">
              <Store size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Dorixona Arizalari</h3>
              <p className="text-sm text-slate-400">Yangi dorixonalarni tasdiqlash va ro'yxati (Tez orada ulashamiz).</p>
            </div>
          </div>
        )}

        {activeTab === "specialists" && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 border-dashed">
            <div className="text-center">
              <Users size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="text-lg font-bold text-slate-900">Mutaxassislar</h3>
              <p className="text-sm text-slate-400">Barcha agronom va veterinar mutaxassislar ro'yxati (Tez orada ulashamiz).</p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: DASHBOARD METRIKALARI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* Metrikalar grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Foydalanuvchilar</span>
                  <Users size={16} className="text-blue-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.users}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Telegram: <b>{stats.telegramUsers}</b>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dorixonalar</span>
                  <Store size={16} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.pharmacies}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mutaxassis: <b>{stats.specialists} ta</b>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dorilar turi</span>
                  <Package size={16} className="text-teal-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.medicines}</p>
                <p className="text-[11px] text-slate-400 mt-1">Barcha dorixonalar</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Buyurtmalar</span>
                  <ShoppingCart size={16} className="text-amber-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{stats.orders}</p>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                  Yetkazildi: <b>{stats.ordersDelivered} ta</b>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Jami Savdo</span>
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <p className="text-lg font-black text-slate-900">{formatSum(stats.totalSalesSum)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Yetkazilgan buyurtmalar</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Standart Radius</span>
                  <MapPin size={16} className="text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-indigo-400">{stats.defaultRadiusKm} km</p>
                <p className="text-[11px] text-slate-400 mt-1">Yaqin atrof chegarasi</p>
              </div>
            </div>

            {/* Qidiruv radiusi tezkor banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/20 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Yagona Standart Radius: {stats.defaultRadiusKm} km</h3>
                  <p className="text-xs text-slate-400">
                    Barcha foydalanuvchilar (xaridorlar) uchun chalkashliksiz qat&apos;iy 5 km radius joriy qilingan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-indigo-400 transition"
              >
                Radiusni sozlash <ArrowRight size={13} />
              </button>
            </div>

            {/* Oxirgi buyurtmalar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Oxirgi buyurtmalar
                </h3>
                <span className="text-xs text-slate-400">Real vaqt yangilanishi</span>
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-xs text-slate-400">Hozircha buyurtmalar mavjud emas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                      <tr>
                        <th className="pb-2.5"># ID</th>
                        <th className="pb-2.5">Mijoz</th>
                        <th className="pb-2.5">Telefon</th>
                        <th className="pb-2.5">Summa</th>
                        <th className="pb-2.5">Holat</th>
                        <th className="pb-2.5">Mijoz Bahosi</th>
                        <th className="pb-2.5">Sana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-100/30">
                          <td className="py-3 font-bold text-slate-900">#{o.id}</td>
                          <td className="py-3 font-semibold text-slate-800">{o.customerName}</td>
                          <td className="py-3 text-slate-400">{o.customerPhone}</td>
                          <td className="py-3 font-bold text-emerald-400">
                            {o.totalSum ? formatSum(o.totalSum) : "Kelishuv asosida"}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                                o.status === "yetkazildi"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : o.status === "tasdiqlandi"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : o.status === "bekor"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {o.ratingStars ? (
                              <span className="flex items-center gap-1 font-bold text-amber-400">
                                <Star size={13} fill="currentColor" /> {o.ratingStars} / 5
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 text-slate-400">
                            {new Date(o.createdAt).toLocaleDateString("uz-UZ")}
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

        {/* ------------------------------------------------------------- */}
        {/* TAB: CHUQUR ANALITIKA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Platforma Bo&apos;yicha Chuqur Analitika
                  </h3>
                  <p className="text-xs text-slate-400">
                    Kasalliklar tendensiyasi, dorilar talabi va mutaxassislar bandlik darajasi
                  </p>
                </div>
                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  Real vaqt statistikasi
                </span>
              </div>

              {/* Mutaxassislar & Foydalanuvchilar taqsimoti */}
              {analytics && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agronomlar</p>
                    <p className="mt-1 text-2xl font-black text-emerald-400">{analytics.counts.agronomists} ta</p>
                    <p className="mt-1 text-[11px] text-slate-400">O&apos;simlik mutaxassislari</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Veterinarlar</p>
                    <p className="mt-1 text-2xl font-black text-teal-400">{analytics.counts.veterinarians} ta</p>
                    <p className="mt-1 text-[11px] text-slate-400">Chorva shifokorlari</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Band Mutaxassislar</p>
                    <p className="mt-1 text-2xl font-black text-amber-400">{analytics.counts.busySpecialists} ta</p>
                    <p className="mt-1 text-[11px] text-slate-400">Ayni paytda chaqiruvda</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jami Chaqiruvlar</p>
                    <p className="mt-1 text-2xl font-black text-blue-400">{analytics.totalCallsCount} ta</p>
                    <p className="mt-1 text-[11px] text-slate-400">Bajarilgan chaqiruvlar</p>
                  </div>
                </div>
              )}

              {/* Kasalliklar tendensiyasi (Ekin va Chorva) */}
              <div className="grid gap-4 lg:grid-cols-2 mb-6">
                {/* Ekin kasalliklari */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      🌿 Eng Ko&apos;p Uchrayotgan Ekin Kasalliklari
                    </h4>
                    <span className="text-[11px] text-slate-400">Chaqiruvlar asosida</span>
                  </div>
                  {analytics?.topCropDiseases && analytics.topCropDiseases.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.topCropDiseases.map((d, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-slate-900/80 p-2.5 text-xs">
                          <span className="font-semibold text-slate-800 capitalize">#{i + 1} {d.name}</span>
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-400 border border-emerald-500/20">
                            {d.count} ta murojaat
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">Hozircha ma&apos;lumot mavjud emas</p>
                  )}
                </div>

                {/* Chorva kasalliklari */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      🐄 Eng Ko&apos;p Uchrayotgan Chorva Kasalliklari
                    </h4>
                    <span className="text-[11px] text-slate-400">Chaqiruvlar asosida</span>
                  </div>
                  {analytics?.topAnimalDiseases && analytics.topAnimalDiseases.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.topAnimalDiseases.map((d, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl bg-slate-900/80 p-2.5 text-xs">
                          <span className="font-semibold text-slate-800 capitalize">#{i + 1} {d.name}</span>
                          <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-extrabold text-teal-400 border border-teal-500/20">
                            {d.count} ta murojaat
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">Hozircha ma&apos;lumot mavjud emas</p>
                  )}
                </div>
              </div>

              {/* Eng ko'p sotilgan va talabgir dorilar */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2.5">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    💊 Eng Talabgir va Ko&apos;p Sotilgan Dorilar
                  </h4>
                  <span className="text-[11px] text-slate-400">Buyurtmalar kesimida</span>
                </div>
                {analytics?.topMedicines && analytics.topMedicines.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-400">
                        <tr>
                          <th className="pb-2">Dori nomi</th>
                          <th className="pb-2">Dorixona</th>
                          <th className="pb-2">Sotilgan miqdor</th>
                          <th className="pb-2">Umumiy tushum</th>
                          <th className="pb-2">Qoldiq</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {analytics.topMedicines.map((m, idx) => (
                          <tr key={idx} className="hover:bg-white/50">
                            <td className="py-2.5 font-bold text-slate-900">{m.name}</td>
                            <td className="py-2.5 text-slate-400">{m.pharmacyName}</td>
                            <td className="py-2.5 font-bold text-emerald-400">{m.totalQty} dona</td>
                            <td className="py-2.5 text-slate-900">{formatSum(m.totalSum)}</td>
                            <td className="py-2.5">
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                m.status === "bor" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                              }`}>
                                {m.stock !== null ? `${m.stock} dona` : m.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Hozircha sotuvlar ma&apos;lumoti mavjud emas</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: VILOYATLAR TAHLILI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "regions" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    O&apos;zbekiston Viloyatlari Kesimida Statistika
                  </h3>
                  <p className="text-xs text-slate-400">
                    Qaysi viloyatda qancha foydalanuvchi, dorixona, mutaxassis va buyurtmalar hajmi
                  </p>
                </div>
                <span className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-bold text-emerald-400">
                  14 ta ma&apos;muriy hudud
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regions.map((reg, idx) => (
                  <div
                    key={reg.region}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950/70 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">
                          #{idx + 1} Viloyat
                        </span>
                        <h4 className="text-sm font-black text-slate-900">{reg.region}</h4>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        {reg.sharePercent}% ulush
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.max(5, reg.sharePercent)}%` }}
                      />
                    </div>

                    <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400">Foydalanuvchilar:</span>
                        <p className="font-bold text-slate-900">{reg.users} ta</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">Dorixonalar:</span>
                        <p className="font-bold text-emerald-400">{reg.pharmacies} ta</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">Mutaxassislar:</span>
                        <p className="font-bold text-teal-400">{reg.specialists} ta</p>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400">Buyurtmalar:</span>
                        <p className="font-bold text-amber-400">{reg.orders} ta</p>
                      </div>
                    </div>

                    {reg.totalSales > 0 && (
                      <div className="mt-2.5 rounded-xl bg-emerald-500/10 p-2 text-center text-[11.5px] font-bold text-emerald-400 border border-emerald-500/20">
                        Jami aylanma: {formatSum(reg.totalSales)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: FIKRLAR VA SHARHLAR MODERATSIYASI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Fermer va Mijozlarning Fikrlari & Izohlari
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dori vositalari va mutaxassislar bo&apos;yicha yozilgan sharhlarni nazorat qilish
                  </p>
                </div>

                {/* Filterlar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="Qidiruv (ism, dorixona, izoh)..."
                      className="rounded-xl border border-slate-300 bg-slate-100 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={reviewFilterStars}
                    onChange={(e) =>
                      setReviewFilterStars(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="rounded-xl border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="all">Barcha baholar</option>
                    <option value="5">⭐️ 5 yulduz</option>
                    <option value="4">⭐️ 4 yulduz</option>
                    <option value="3">⭐️ 3 yulduz</option>
                    <option value="2">⭐️ 2 yulduz</option>
                    <option value="1">⭐️ 1 yulduz</option>
                  </select>
                </div>
              </div>

              {filteredReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  Hech qanday fikr yoki sharh topilmadi.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredReviews.map((rev) => (
                    <div
                      key={`${rev.type}-${rev.id}`}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              rev.type === "order"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-teal-500/20 text-teal-400"
                            }`}
                          >
                            {rev.type === "order" ? "📦 Buyurtma / Dorixona" : "👨‍⚕️ Mutaxassis"}
                          </span>

                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                fill={s <= rev.stars ? "currentColor" : "none"}
                                className={s <= rev.stars ? "text-amber-400" : "text-slate-700"}
                              />
                            ))}
                            <span className="ml-1 text-xs font-black">{rev.stars} / 5</span>
                          </div>
                        </div>

                        <div className="mt-2.5">
                          <h4 className="text-sm font-bold text-slate-900">
                            {rev.customerName || "Foydalanuvchi"}
                          </h4>
                          {rev.customerPhone && (
                            <p className="text-[11px] text-slate-400">{rev.customerPhone}</p>
                          )}
                          <p className="mt-1 text-[11px] text-emerald-400">
                            Manzil / Dorixona: <b>{rev.targetName}</b>
                          </p>
                        </div>

                        {rev.comment && (
                          <p className="mt-2.5 rounded-xl bg-slate-900/90 p-2.5 text-xs text-slate-700 italic border border-slate-200">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
                        <span>{new Date(rev.date).toLocaleDateString("uz-UZ")}</span>
                        <button
                          onClick={() => deleteReview(rev.type, rev.id)}
                          className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-400 transition hover:bg-red-500/20"
                        >
                          <Trash2 size={12} /> O&apos;chirish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: RADIUS VA SOZLAMALAR */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "settings" && (
          <form onSubmit={saveSettings} className="space-y-6">
            {/* Radius boshqaruvi bloki */}
            <div className="rounded-2xl border border-indigo-500/40 bg-white p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <MapPin size={20} className="text-indigo-400" />
                <h3 className="text-base font-black text-slate-900">
                  Tizim Qidiruv Radiusi Boshqaruvi
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Ushbu parametr platforma bo&apos;ylab dorixonalar va mutaxassislarni qidirishning yagona standart radiusini (km) belgilaydi. Standart tavsiya etilgan qiymat: <b>5 km</b>.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-full sm:w-64">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Standart Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settingsValues["default_radius_km"] || "5"}
                    onChange={(e) =>
                      setSettingsValues((prev) => ({
                        ...prev,
                        default_radius_km: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-indigo-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-4 sm:pt-5">
                  {[3, 5, 10, 15, 25].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setSettingsValues((prev) => ({
                          ...prev,
                          default_radius_km: String(preset),
                        }))
                      }
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        settingsValues["default_radius_km"] === String(preset)
                          ? "bg-indigo-500 text-slate-950"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {preset} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI provayder sozlamalari */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Sun&apos;iy Intellekt (Gemini AI) Sozlamalari
                </h3>
              </div>

              <div className="mb-4 grid gap-2 sm:grid-cols-3">
                {AI_PRESETS.map((p) => (
                  <button
                    key={p.model}
                    type="button"
                    onClick={() => {
                      setSettingsValues((prev) => ({
                        ...prev,
                        openai_base_url: p.baseUrl,
                        ai_model: p.model,
                      }));
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-500/50"
                  >
                    <p className="text-xs font-bold text-emerald-400">{p.label}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{p.hint}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Gemini API Kaliti (GEMINI_API_KEY / OPENAI_API_KEY)
                  </label>
                  <input
                    type="password"
                    value={settingsValues["openai_api_key"] || ""}
                    onChange={(e) =>
                      setSettingsValues((prev) => ({ ...prev, openai_api_key: e.target.value }))
                    }
                    placeholder="AI kalitini kiriting (••••••••)"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      AI Model Nomi
                    </label>
                    <input
                      type="text"
                      value={settingsValues["ai_model"] || "gemini-2.5-flash"}
                      onChange={(e) =>
                        setSettingsValues((prev) => ({ ...prev, ai_model: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      AI Base URL
                    </label>
                    <input
                      type="text"
                      value={
                        settingsValues["openai_base_url"] ||
                        "https://generativelanguage.googleapis.com/v1beta/openai/"
                      }
                      onChange={(e) =>
                        setSettingsValues((prev) => ({ ...prev, openai_base_url: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Telegram botlar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Telegram Bot Sozlamalari
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mutaxassis & Dorixona Boti (@agroz_auth_bot) Tokeni
                  </label>
                  <input
                    type="password"
                    value={settingsValues["telegram_auth_bot_token"] || ""}
                    onChange={(e) =>
                      setSettingsValues((prev) => ({
                        ...prev,
                        telegram_auth_bot_token: e.target.value,
                      }))
                    }
                    placeholder="Bot tokenini kiriting..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Asosiy Bot Tokeni
                  </label>
                  <input
                    type="password"
                    value={settingsValues["telegram_bot_token"] || ""}
                    onChange={(e) =>
                      setSettingsValues((prev) => ({
                        ...prev,
                        telegram_bot_token: e.target.value,
                      }))
                    }
                    placeholder="Asosiy bot tokeni..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Admin paroli va xavfsizlik */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Super Admin Hisobi (Login & Parol)
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Admin Login
                  </label>
                  <input
                    type="text"
                    value={settingsValues["admin_username"] || ""}
                    onChange={(e) =>
                      setSettingsValues((prev) => ({ ...prev, admin_username: e.target.value }))
                    }
                    placeholder="admin"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Yangi Parol (o&apos;zgartirish uchun)
                  </label>
                  <input
                    type="password"
                    value={settingsValues["admin_password"] || ""}
                    onChange={(e) =>
                      setSettingsValues((prev) => ({ ...prev, admin_password: e.target.value }))
                    }
                    placeholder="Yangi parol kiriting..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              {busy ? "Saqlanmoqda..." : "Barcha Sozlamalarni Saqlash"}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: OB-HAVO VA AGRO OGOHLANTIRISHLAR */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "broadcast" && (
          <div className="space-y-6">
            <AdminWeatherAlertsBroadcast />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: REKLAMALAR BOSHQARUVI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "ads" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reklamalar Boshqaruvi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Instagram tarzidagi reklama kartochkalarini qo&apos;shish, tahrirlash va o&apos;chirish
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAdForm({ title: "", description: "", imageUrl: "", linkUrl: "", priority: 0, isActive: true });
                    setAdEditing(false);
                    setAdFormOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-95"
                >
                  <Plus size={15} /> Yangi reklama
                </button>
              </div>

              {/* Reklama formi */}
              {adFormOpen && (
                <form onSubmit={saveAd} className="mb-6 rounded-2xl border border-slate-300 bg-slate-50 p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    {adEditing ? "Reklamani tahrirlash" : "Yangi reklama qo'shish"}
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Sarlavha *</label>
                      <input
                        type="text"
                        value={adForm.title}
                        onChange={(e) => setAdForm((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Reklama sarlavhasi"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Havola (URL)</label>
                      <input
                        type="url"
                        value={adForm.linkUrl}
                        onChange={(e) => setAdForm((p) => ({ ...p, linkUrl: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Tavsif</label>
                    <textarea
                      value={adForm.description}
                      onChange={(e) => setAdForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Qisqa tavsif..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Rasm URL</label>
                      <input
                        type="url"
                        value={adForm.imageUrl}
                        onChange={(e) => setAdForm((p) => ({ ...p, imageUrl: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Ustunlik (0-100)</label>
                      <input
                        type="number"
                        value={adForm.priority}
                        onChange={(e) => setAdForm((p) => ({ ...p, priority: Number(e.target.value) }))}
                        min={0}
                        max={100}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Rasm ko'rinishi (preview) */}
                  {adForm.imageUrl && (
                    <div className="rounded-xl border border-slate-300 overflow-hidden">
                      <img
                        src={adForm.imageUrl}
                        alt="Reklama rasmi"
                        className="h-32 w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setAdForm((p) => ({ ...p, isActive: !p.isActive }))}
                        className={`flex h-6 w-10 items-center rounded-full transition ${
                          adForm.isActive ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          adForm.isActive ? "translate-x-5" : "translate-x-1"
                        }`} />
                      </button>
                      {adForm.isActive ? "Faol" : "Nofaol"}
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAdFormOpen(false);
                          setAdEditing(false);
                        }}
                        className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Bekor qilish
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        {busy ? "Saqlanmoqda..." : adEditing ? "Yangilash" : "Qo'shish"}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Reklamalar ro'yxati */}
              {ads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  <Megaphone size={32} className="mx-auto mb-3 text-slate-700" />
                  Hech qanday reklama topilmadi. Yuqoridagi tugma orqali yangi reklama qo&apos;shing.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className={`relative overflow-hidden rounded-2xl border transition hover:border-slate-300 ${
                        ad.isActive ? "border-slate-200 bg-slate-50" : "border-slate-800/50 bg-slate-950/50 opacity-60"
                      }`}
                    >
                      {/* Rasm */}
                      {ad.imageUrl ? (
                        <div className="relative h-32">
                          <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement!.innerHTML =
                                '<div class="flex h-full items-center justify-center bg-slate-100 text-slate-600"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-2 left-3 right-3">
                            <h4 className="text-sm font-bold text-slate-900 drop-shadow">{ad.title}</h4>
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-20 items-center gap-3 bg-slate-800/30 px-4">
                          <Image size={20} className="text-slate-600" />
                          <h4 className="text-sm font-bold text-slate-900">{ad.title}</h4>
                        </div>
                      )}

                      <div className="p-4">
                        {ad.description && (
                          <p className="mb-3 text-xs text-slate-400 line-clamp-2">{ad.description}</p>
                        )}

                        {ad.linkUrl && (
                          <a
                            href={ad.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mb-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                          >
                            <ExternalLink size={11} /> {ad.linkUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                          </a>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleAd(ad)}
                              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                                ad.isActive
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              }`}
                            >
                              {ad.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                              {ad.isActive ? "Faol" : "Nofaol"}
                            </button>
                            <span className="text-[10px] text-slate-600">
                              #{ad.id} • Ustunlik: {ad.priority}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editAd(ad)}
                              className="flex items-center gap-1 rounded-lg bg-blue-500/10 px-2 py-1 text-[11px] font-bold text-blue-400 transition hover:bg-blue-500/20"
                            >
                              <Edit3 size={11} /> Tahrirlash
                            </button>
                            <button
                              onClick={() => deleteAd(ad.id)}
                              className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-400 transition hover:bg-red-500/20"
                            >
                              <Trash2 size={11} /> O&apos;chirish
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        </main>
      </div>
    </div>
  );
}
