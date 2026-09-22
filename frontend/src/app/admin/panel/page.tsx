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

export default function AdminPanelPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Tablar: dashboard | regions | reviews | settings | broadcast
  const [activeTab, setActiveTab] = useState<"dashboard" | "regions" | "reviews" | "settings" | "broadcast">("dashboard");

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [settingsList, setSettingsList] = useState<SettingListItem[]>([]);
  const [settingsValues, setSettingsValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Fikrlar filtrlash
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewFilterStars, setReviewFilterStars] = useState<number | "all">("all");

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      setMe(data);
    } catch {
      setMe({ enabled: true, authenticated: false, username: null });
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, regionsRes, reviewsRes, settingsRes] = await Promise.all([
        fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/admin/regions").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/admin/reviews").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/admin/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (statsRes?.ok) {
        setStats(statsRes.stats);
        setRecentOrders(statsRes.recentOrders || []);
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Login yoki parol noto'g'ri");
      } else {
        await checkAuth();
      }
    } catch {
      setLoginError("Server bilan bog'lanishda xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setMe({ enabled: true, authenticated: false, username: null });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/settings", {
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
      const res = await fetch(`/api/admin/reviews/${type}/${id}`, { method: "DELETE" });
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
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
        <div className="w-full max-w-md rounded-3xl bg-slate-800/90 p-7 shadow-2xl border border-slate-700/80 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">AgroZ Super Admin</h1>
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
                className="w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                className="w-full rounded-2xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50"
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
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-white sm:text-lg">
                  AgroZ Boshqaruv Markazi
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Radius boshqaruvi, viloyatlar tahlili va sharhlar moderatsiyasi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              title="Yangilash"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "regions", label: "Viloyatlar Tahlili", icon: Globe },
            { id: "reviews", label: "Fikrlar & Sharhlar", icon: MessageSquare, count: reviews.length },
            { id: "settings", label: "Radius & Sozlamalar", icon: Settings },
            { id: "broadcast", label: "Ob-havo Xabarnomasi", icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 ${
                  active
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                      active ? "bg-slate-950 text-white" : "bg-slate-700 text-emerald-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {notice && (
          <div
            className={`mb-5 flex items-center justify-between rounded-2xl p-4 text-xs font-bold border ${
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
        {/* TAB 1: DASHBOARD METRIKALARI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* Metrikalar grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Foydalanuvchilar</span>
                  <Users size={16} className="text-blue-400" />
                </div>
                <p className="text-2xl font-black text-white">{stats.users}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Telegram: <b>{stats.telegramUsers}</b>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dorixonalar</span>
                  <Store size={16} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white">{stats.pharmacies}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mutaxassis: <b>{stats.specialists} ta</b>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Dorilar turi</span>
                  <Package size={16} className="text-teal-400" />
                </div>
                <p className="text-2xl font-black text-white">{stats.medicines}</p>
                <p className="text-[11px] text-slate-400 mt-1">Barcha dorixonalar</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Buyurtmalar</span>
                  <ShoppingCart size={16} className="text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white">{stats.orders}</p>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                  Yetkazildi: <b>{stats.ordersDelivered} ta</b>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Jami Savdo</span>
                  <TrendingUp size={16} className="text-emerald-400" />
                </div>
                <p className="text-lg font-black text-white">{formatSum(stats.totalSalesSum)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Yetkazilgan buyurtmalar</p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
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
                  <h3 className="text-sm font-bold text-white">Yagona Standart Radius: {stats.defaultRadiusKm} km</h3>
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Oxirgi buyurtmalar
                </h3>
                <span className="text-xs text-slate-400">Real vaqt yangilanishi</span>
              </div>

              {recentOrders.length === 0 ? (
                <p className="text-xs text-slate-500">Hozircha buyurtmalar mavjud emas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-500">
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
                        <tr key={o.id} className="hover:bg-slate-800/30">
                          <td className="py-3 font-bold text-white">#{o.id}</td>
                          <td className="py-3 font-semibold text-slate-200">{o.customerName}</td>
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
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3 text-slate-500">
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
        {/* TAB 2: VILOYATLAR TAHLILI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "regions" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    O&apos;zbekiston Viloyatlari Kesimida Statistika
                  </h3>
                  <p className="text-xs text-slate-400">
                    Qaysi viloyatda qancha foydalanuvchi, dorixona, mutaxassis va buyurtmalar hajmi
                  </p>
                </div>
                <span className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-emerald-400">
                  14 ta ma&apos;muriy hudud
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regions.map((reg, idx) => (
                  <div
                    key={reg.region}
                    className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase">
                          #{idx + 1} Viloyat
                        </span>
                        <h4 className="text-sm font-black text-white">{reg.region}</h4>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                        {reg.sharePercent}% ulush
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.max(5, reg.sharePercent)}%` }}
                      />
                    </div>

                    <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400">Foydalanuvchilar:</span>
                        <p className="font-bold text-white">{reg.users} ta</p>
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Fermer va Mijozlarning Fikrlari & Izohlari
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dori vositalari va mutaxassislar bo&apos;yicha yozilgan sharhlarni nazorat qilish
                  </p>
                </div>

                {/* Filterlar */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="Qidiruv (ism, dorixona, izoh)..."
                      className="rounded-xl border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <select
                    value={reviewFilterStars}
                    onChange={(e) =>
                      setReviewFilterStars(e.target.value === "all" ? "all" : Number(e.target.value))
                    }
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none"
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
                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                  Hech qanday fikr yoki sharh topilmadi.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredReviews.map((rev) => (
                    <div
                      key={`${rev.type}-${rev.id}`}
                      className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4 transition hover:border-slate-700"
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
                          <h4 className="text-sm font-bold text-white">
                            {rev.customerName || "Foydalanuvchi"}
                          </h4>
                          {rev.customerPhone && (
                            <p className="text-[11px] text-slate-500">{rev.customerPhone}</p>
                          )}
                          <p className="mt-1 text-[11px] text-emerald-400">
                            Manzil / Dorixona: <b>{rev.targetName}</b>
                          </p>
                        </div>

                        {rev.comment && (
                          <p className="mt-2.5 rounded-xl bg-slate-900/90 p-2.5 text-xs text-slate-300 italic border border-slate-800">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
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
            <div className="rounded-2xl border border-indigo-500/40 bg-slate-900 p-5 shadow-lg">
              <div className="flex items-center gap-2.5 mb-2">
                <MapPin size={20} className="text-indigo-400" />
                <h3 className="text-base font-black text-white">
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-bold text-indigo-400 focus:border-indigo-500 focus:outline-none"
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
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {preset} km
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI provayder sozlamalari */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
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
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-left transition hover:border-emerald-500/50"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Telegram botlar */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Admin paroli va xavfsizlik */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
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
      </main>
    </div>
  );
}
