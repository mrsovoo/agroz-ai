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

export default function SuperAdminPage() {
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
      if (data.ok) {
        setMe({ enabled: true, authenticated: true, username: data.username });
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
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // baribir chiqaveramiz
    }
    setMe({ enabled: true, authenticated: false, username: null });
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", {
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
      const res = await fetch(`/api/admin/reviews/${type}/${id}`, { method: "DELETE" });
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

  if (me === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-200">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  // Admin interfeysi o'chirilgan bo'lsa
  if (!me.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center rounded-2xl bg-slate-900 p-8 border border-slate-800 shadow-xl">
          <AlertCircle className="mx-auto text-amber-400 mb-3" size={40} />
          <h1 className="text-xl font-bold text-white">Admin Panel O'chirilgan</h1>
          <p className="mt-2 text-sm text-slate-400">
            Tizimda `ADMIN_PASSWORD` o'rnatilmagan yoki admin panel xavfsizlik yuzasidan faolsizlantirilgan.
          </p>
        </div>
      </div>
    );
  }

  // Tizimga kirilmagan (Login form)
  if (!me.authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 p-8 border border-slate-800 shadow-2xl">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="Agroz AI" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-center text-2xl font-black text-white tracking-tight">Super Admin Panel</h1>
          <p className="mt-1 text-center text-xs text-slate-400">admin.agroz.uz — Boshqaruv Markazi</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Parol
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {loginError && (
              <div className="rounded-xl bg-red-950/80 p-3 text-center text-xs font-semibold text-red-300 border border-red-800">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition active:scale-95"
            >
              {busy ? <RefreshCw className="animate-spin" size={18} /> : "Kirish"}
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

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Agroz AI" className="h-9 w-auto object-contain" />
              <div>
                <h1 className="text-base font-bold text-white leading-tight">Super Admin</h1>
                <p className="text-[11px] font-medium text-emerald-400">admin.agroz.uz</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                title="Ma'lumotlarni yangilash"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-red-900/50 hover:text-red-200 transition"
              >
                <LogOut size={14} /> Chiquv ({me.username})
              </button>
            </div>
          </div>

          {/* Navigatsiya Tablari */}
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "regions", label: "Viloyatlar Tahlili", icon: Globe },
              { id: "reviews", label: "Fikrlar & Sharhlar", icon: MessageSquare },
              { id: "settings", label: "Radius & Bot Sozlamalari", icon: Settings },
              { id: "broadcast", label: "Ob-havo Ogohlantirishlari", icon: AlertCircle },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
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
                ? "bg-emerald-950/80 text-emerald-200 border-emerald-800"
                : "bg-red-950/80 text-red-200 border-red-800"
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
                { label: "Jami Foydalanuvchilar", val: stats?.users ?? 0, sub: `${stats?.telegramUsers ?? 0} Telegram`, icon: Users, color: "text-blue-400" },
                { label: "Agronom & Vets", val: stats?.specialists ?? 0, sub: "Sertifikatlangan", icon: Activity, color: "text-emerald-400" },
                { label: "Agro-Dorixonalar", val: stats?.pharmacies ?? 0, sub: "Ro'yxatdan o'tgan", icon: Store, color: "text-amber-400" },
                { label: "Dori Vositalari", val: stats?.medicines ?? 0, sub: "Katalogda", icon: Package, color: "text-purple-400" },
                { label: "Jami Buyurtmalar", val: stats?.orders ?? 0, sub: "Barcha xaridlar", icon: ShoppingCart, color: "text-pink-400" },
                { label: "Buyurtmalar Summasi", val: `${(stats?.totalSalesSum ?? 0).toLocaleString()} so'm`, sub: `${stats?.ordersDelivered ?? 0} yetkazildi`, icon: TrendingUp, color: "text-cyan-400" },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="rounded-2xl bg-slate-900 p-4 border border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">{s.label}</span>
                      <Icon className={s.color} size={18} />
                    </div>
                    <p className="mt-2 text-xl font-black text-white">{s.val}</p>
                    <p className="mt-1 text-[10.5px] text-slate-500 font-medium">{s.sub}</p>
                  </div>
                );
              })}
            </div>

            {/* Oxirgi Buyurtmalar */}
            <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingCart size={18} className="text-emerald-400" /> Oxirgi Buyurtmalar
                </h2>
                <span className="text-xs text-slate-400">Jami: {stats?.orders ?? 0} ta</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Mijoz</th>
                      <th className="pb-3">Telefon</th>
                      <th className="pb-3">Summa</th>
                      <th className="pb-3">Holat</th>
                      <th className="pb-3">Baho</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-500">
                          Hali buyurtmalar kelib tushmagan
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/50">
                          <td className="py-3 font-mono font-bold text-slate-400">#{o.id}</td>
                          <td className="py-3 font-semibold text-white">{o.customerName}</td>
                          <td className="py-3 text-slate-400">{o.customerPhone}</td>
                          <td className="py-3 font-bold text-emerald-400">
                            {o.totalSum ? `${o.totalSum.toLocaleString()} so'm` : "—"}
                          </td>
                          <td className="py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                o.status === "yetkazildi"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : "bg-amber-950 text-amber-400 border border-amber-800"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {o.ratingStars ? (
                              <span className="flex items-center gap-1 font-bold text-amber-400">
                                <Star size={12} fill="currentColor" /> {o.ratingStars}
                              </span>
                            ) : (
                              "—"
                            )}
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
            <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <Globe size={18} className="text-blue-400" /> 14 ta Hudud Bo&apos;yicha Faollik va Tahlil
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {regions.map((r, i) => (
                  <div key={i} className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-sm">{r.region}</h3>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-300">
                        {r.sharePercent}% ulush
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-900 p-2">
                        <span className="text-slate-500 text-[10px]">Foydalanuvchilar</span>
                        <p className="font-bold text-slate-200">{r.users} ta</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2">
                        <span className="text-slate-500 text-[10px]">Dorixonalar</span>
                        <p className="font-bold text-amber-400">{r.pharmacies} ta</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2">
                        <span className="text-slate-500 text-[10px]">Mutaxassislar</span>
                        <p className="font-bold text-emerald-400">{r.specialists} ta</p>
                      </div>
                      <div className="rounded-lg bg-slate-900 p-2">
                        <span className="text-slate-500 text-[10px]">Buyurtmalar</span>
                        <p className="font-bold text-cyan-400">{r.orders} ta</p>
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
            <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-amber-400" /> Sharhlar va Fikrlar Moderatsiyasi
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Foydalanuvchilar tomonidan dorixona va mutaxassislarga berilgan baholarni ko&apos;rish va keraksizlarini o&apos;chirish.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="Qidiruv..."
                      className="rounded-xl bg-slate-800 pl-8 pr-3 py-2 text-xs text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={reviewFilterStars}
                    onChange={(e) => setReviewFilterStars(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-xs text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  <div className="p-8 text-center text-xs text-slate-500">
                    Fikrlar topilmadi
                  </div>
                ) : (
                  filteredReviews.map((r) => (
                    <div
                      key={`${r.type}-${r.id}`}
                      className="flex items-start justify-between gap-4 rounded-xl bg-slate-950 p-4 border border-slate-800"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              r.type === "order"
                                ? "bg-cyan-950 text-cyan-400 border border-cyan-800"
                                : "bg-purple-950 text-purple-400 border border-purple-800"
                            }`}
                          >
                            {r.type === "order" ? "Buyurtma Sharhi" : "Mutaxassis Xizmati"}
                          </span>
                          <span className="font-bold text-white text-xs">{r.targetName}</span>
                          <span className="text-[11px] text-slate-500">({r.date})</span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold pt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < r.stars ? "currentColor" : "none"}
                              className={i < r.stars ? "text-amber-400" : "text-slate-700"}
                            />
                          ))}
                          <span className="ml-1 text-slate-300 font-semibold">{r.stars}.0</span>
                        </div>

                        {r.comment && (
                          <p className="text-xs text-slate-300 italic pt-1">«{r.comment}»</p>
                        )}

                        <p className="text-[11px] text-slate-500">
                          Qoldiruvchi: {r.customerName || "Noma'lum dehqon"} ({r.customerPhone || "—"})
                        </p>
                      </div>

                      <button
                        onClick={() => deleteReview(r.type, r.id)}
                        title="O'chirish"
                        className="rounded-lg bg-red-950/60 p-2 text-red-400 hover:bg-red-900 hover:text-white transition"
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

        {/* 4. RADIUS & BOT SOZLAMALARI TAB */}
        {activeTab === "settings" && (
          <form onSubmit={saveSettings} className="space-y-6">
            <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                <Settings size={18} className="text-emerald-400" /> Tizim Parametrlari va Telegram Botlar Sozlamalari
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Bu yerdagi o&apos;zgarishlar ma&apos;lumotlar bazasida saqlanadi va darhol real-vaqt rejimida kuchga kiradi.
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                {settingsList.map((item) => (
                  <div key={item.key} className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                    <label className="block text-xs font-bold text-slate-200">
                      {item.label}
                    </label>
                    <p className="text-[11px] font-mono text-slate-500">{item.key}</p>

                    {item.key === "default_radius_km" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={settingsValues[item.key] ?? "5"}
                          onChange={(e) =>
                            setSettingsValues({ ...settingsValues, [item.key]: e.target.value })
                          }
                          className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm text-white font-bold border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-emerald-400 whitespace-nowrap">km</span>
                      </div>
                    ) : (
                      <input
                        type={item.secret ? "password" : "text"}
                        value={settingsValues[item.key] ?? ""}
                        onChange={(e) =>
                          setSettingsValues({ ...settingsValues, [item.key]: e.target.value })
                        }
                        placeholder={item.preview || "Qiymatni kiriting..."}
                        className="w-full rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs text-white font-mono border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50 transition active:scale-95"
                >
                  {busy ? <RefreshCw className="animate-spin" size={16} /> : "Barcha Sozlamalarni Saqlash"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 5. BROADCAST TAB */}
        {activeTab === "broadcast" && <AdminWeatherAlertsBroadcast />}
      </main>
    </div>
  );
}

