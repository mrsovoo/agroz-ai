"use client";

import { useCallback, useEffect, useState } from "react";
import AdminBroadcastCenter from "@/components/AdminBroadcastCenter";
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
  Check,
  Clock,
  Phone,
  Eye,
  XCircle,
  Send,
  Loader2,
  AlertTriangle,
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

type AdminSpecialist = {
  id: number;
  telegramId: number | null;
  name: string;
  phone: string;
  role: "pharmacy" | "specialist";
  specialty: string | null;
  organization: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  workHours: string | null;
  isActive: boolean;
  isApproved: boolean;
  isBusy: boolean;
  medicinesCount: number;
  ordersCount: number;
  callsCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

type PharmacyMedicine = {
  id: number;
  name: string;
  type: string | null;
  usage: string | null;
  price: number | null;
  stock: number | null;
  status: string;
  photoFileId: string | null;
  createdAt: string;
};

type AdminOrder = {
  id: number;
  pharmacySpecialistId: number | null;
  pharmacyName: string | null;
  pharmacyOrg: string | null;
  pharmacyPhone: string | null;
  pharmacyAddress: string | null;
  customerName: string;
  customerPhone: string;
  note: string | null;
  deliveryType: string | null;
  customerAddress: string | null;
  totalSum: number | null;
  status: string;
  ratingStars: number | null;
  ratingNote: string | null;
  createdAt: string;
  items: {
    id: number;
    name: string;
    qty: number;
    price: number | null;
  }[];
};

type AdminCall = {
  id: number;
  specialistId: number;
  specialistName: string;
  specialistSpecialty: string | null;
  specialistPhone: string;
  specialistRole: string;
  customerName: string;
  customerPhone: string;
  problem: string;
  address: string | null;
  status: string;
  assignedOrderId: number | null;
  createdAt: string;
  updatedAt: string;
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

  // Dorixonalar va Mutaxassislar
  const [pharmacies, setPharmacies] = useState<AdminSpecialist[]>([]);
  const [specialistsList, setSpecialistsList] = useState<AdminSpecialist[]>([]);
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [pharmacyFilter, setPharmacyFilter] = useState<"all" | "pending" | "approved">("all");
  const [specialistSearch, setSpecialistSearch] = useState("");
  const [specialistFilter, setSpecialistFilter] = useState<"all" | "agronom" | "veterinar">("all");
  const [specialistRoleFilter, setSpecialistRoleFilter] = useState<"all" | "crop" | "animal">("all");

  // Buyurtmalar va Chaqiruvlar
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);
  const [callsList, setCallsList] = useState<AdminCall[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | "yangi" | "tasdiqlandi" | "yetkazildi" | "bekor">("all");
  const [callSearch, setCallSearch] = useState("");
  const [callFilter, setCallFilter] = useState<"all" | "yangi" | "qabul_qilindi" | "bajarildi" | "bekor">("all");

  // Dorixona dorilarini ko'rish modali
  const [selectedPharmacyForMeds, setSelectedPharmacyForMeds] = useState<{
    id: number;
    name: string;
    org: string | null;
  } | null>(null);
  const [pharmacyMedicines, setPharmacyMedicines] = useState<PharmacyMedicine[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState("");

  // To'g'ridan-to'g'ri xabar yuborish modali (Dorixona yoki Mutaxassisga)
  const [directMsgModal, setDirectMsgModal] = useState<{
    open: boolean;
    type: "pharmacy" | "specialist" | "user";
    id: number;
    name: string;
    telegramId?: number | null;
  } | null>(null);
  const [directMsgTitle, setDirectMsgTitle] = useState("");
  const [directMsgText, setDirectMsgText] = useState("");
  const [directMsgBtnText, setDirectMsgBtnText] = useState("");
  const [directMsgBtnUrl, setDirectMsgBtnUrl] = useState("");
  const [directMsgSending, setDirectMsgSending] = useState(false);
  const [directMsgResult, setDirectMsgResult] = useState<{ ok: boolean; message: string } | null>(null);

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
      const [statsRes, analyticsRes, regionsRes, reviewsRes, settingsRes, adsRes, specialistsRes, ordersRes, callsRes] = await Promise.all([
        adminFetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/analytics").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/regions").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/reviews").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/advertisements/all").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/specialists").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/orders").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        adminFetch("/api/admin/specialist-calls").then((r) => (r.ok ? r.json() : null)).catch(() => null),
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
      if (specialistsRes?.ok && Array.isArray(specialistsRes.specialists)) {
        const allSpecs: AdminSpecialist[] = specialistsRes.specialists;
        setPharmacies(allSpecs.filter((s) => s.role === "pharmacy"));
        setSpecialistsList(allSpecs.filter((s) => s.role === "specialist"));
      }
      if (ordersRes?.ok && Array.isArray(ordersRes.orders)) {
        setOrdersList(ordersRes.orders);
      }
      if (callsRes?.ok && Array.isArray(callsRes.calls)) {
        setCallsList(callsRes.calls);
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

  // Mutaxassislar va Dorixonalar boshqaruvi
  async function handleApproveSpecialist(id: number) {
    if (!confirm("Ushbu arizani tasdiqlamoqchimisiz? Tasdiqlangach, Telegram orqali mutaxassis/dorixonaga boshqaruv paneli avtomatik yetkaziladi.")) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await adminFetch(`/api/admin/specialists/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotice({ kind: "ok", text: "Ariza tasdiqlandi va Telegram orqali bot boshqaruv paneli yuborildi!" });
        await loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "Tasdiqlashda xatolik yuz berdi" });
      }
    } catch {
      setNotice({ kind: "err", text: "Serverga ulanishda xato" });
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectSpecialist(id: number) {
    const reason = prompt("Arizani rad etish sababini kiriting (foydalanuvchiga Telegram orqali yuboriladi):", "Hujjatlar yoki ma'lumotlar to'liq emas");
    if (reason === null) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await adminFetch(`/api/admin/specialists/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotice({ kind: "ok", text: "Ariza rad etildi va foydalanuvchiga xabar berildi" });
        await loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "Rad etishda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Serverga ulanishda xato" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSpecialist(id: number, name: string) {
    if (!confirm(`Haqiqatan ham "${name}"ni butunlay o'chirmoqchimisiz? Unga tegishli barcha dorilar, reytinglar va ma'lumotlar o'chiriladi.`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await adminFetch(`/api/admin/specialists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setNotice({ kind: "ok", text: "Muvaffaqiyatli o'chirildi" });
        await loadData();
      } else {
        setNotice({ kind: "err", text: data.error || "O'chirishda xatolik" });
      }
    } catch {
      setNotice({ kind: "err", text: "Serverga ulanishda xato" });
    } finally {
      setBusy(false);
    }
  }

  async function handleViewPharmacyMedicines(pharmacy: AdminSpecialist) {
    setSelectedPharmacyForMeds({ id: pharmacy.id, name: pharmacy.name, org: pharmacy.organization });
    setLoadingMedicines(true);
    setMedicineSearch("");
    try {
      const res = await adminFetch(`/api/admin/pharmacies/${pharmacy.id}/medicines`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.items)) {
        setPharmacyMedicines(data.items);
      } else {
        setPharmacyMedicines([]);
      }
    } catch {
      setPharmacyMedicines([]);
    } finally {
      setLoadingMedicines(false);
    }
  }

  async function handleSendDirectMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!directMsgModal || !directMsgText.trim()) return;

    setDirectMsgSending(true);
    setDirectMsgResult(null);

    try {
      const res = await adminFetch("/api/admin/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "direct",
          title: directMsgTitle.trim() || undefined,
          message: directMsgText.trim(),
          buttonText: directMsgBtnText.trim() || undefined,
          buttonUrl: directMsgBtnUrl.trim() || undefined,
          directRecipient: {
            recipientType: directMsgModal.type,
            id: directMsgModal.id,
            telegramId: directMsgModal.telegramId || undefined,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        setDirectMsgResult({ ok: true, message: data.message || "Xabar muvaffaqiyatli yuborildi!" });
        setDirectMsgText("");
        setDirectMsgTitle("");
        setDirectMsgBtnText("");
        setDirectMsgBtnUrl("");
      } else {
        setDirectMsgResult({ ok: false, message: data.error || "Xabar yuborishda xatolik yuz berdi" });
      }
    } catch {
      setDirectMsgResult({ ok: false, message: "Tarmoq xatosi tufayli xabar yuborilmadi" });
    } finally {
      setDirectMsgSending(false);
    }
  }

  async function handleUpdateOrderStatus(orderId: number, status: string) {
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrdersList((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
        setNotice({ kind: "ok", text: `Buyurtma holati "${status}"ga o'zgartirildi` });
      } else {
        alert("Buyurtma holatini o'zgartirib bo'lmadi");
      }
    } catch {
      alert("Server xatosi");
    }
  }

  async function handleDeleteOrder(orderId: number) {
    if (!confirm("Buyurtmani butunlay o'chirib tashlamoqchimisiz?")) return;
    try {
      const res = await adminFetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrdersList((prev) => prev.filter((o) => o.id !== orderId));
        setNotice({ kind: "ok", text: "Buyurtma o'chirildi" });
      } else {
        alert("Buyurtmani o'chirishda xatolik");
      }
    } catch {
      alert("Server xatosi");
    }
  }

  async function handleUpdateCallStatus(callId: number, status: string) {
    try {
      const res = await adminFetch(`/api/admin/specialist-calls/${callId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setCallsList((prev) => prev.map((c) => (c.id === callId ? { ...c, status } : c)));
        setNotice({ kind: "ok", text: `Chaqiruv holati "${status}"ga o'zgartirildi` });
      } else {
        alert("Chaqiruv holatini o'zgartirib bo'lmadi");
      }
    } catch {
      alert("Server xatosi");
    }
  }

  async function handleDeleteCall(callId: number) {
    if (!confirm("Chaqiruvni butunlay o'chirib tashlamoqchimisiz?")) return;
    try {
      const res = await adminFetch(`/api/admin/specialist-calls/${callId}`, { method: "DELETE" });
      if (res.ok) {
        setCallsList((prev) => prev.filter((c) => c.id !== callId));
        setNotice({ kind: "ok", text: "Chaqiruv o'chirildi" });
      } else {
        alert("Chaqiruvni o'chirishda xatolik");
      }
    } catch {
      alert("Server xatosi");
    }
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
              { id: "orders", label: "Buyurtmalar", icon: ShoppingCart, count: ordersList.filter((o) => o.status === "yangi").length },
              { id: "calls", label: "Chaqiruvlar", icon: Activity, count: callsList.filter((c) => c.status === "yangi").length },
              { id: "pharmacies", label: "Dorixonalar", icon: Store, count: pharmacies.length },
              { id: "specialists", label: "Mutaxassislar", icon: Users, count: specialistsList.length },
              { id: "regions", label: "Viloyatlar Tahlili", icon: Globe },
              { id: "reviews", label: "Mijozlar Fikrlari", icon: MessageSquare, count: reviews.length },
              { id: "ads", label: "Reklamalar", icon: Megaphone, count: ads.length },
              { id: "settings", label: "Tizim Sozlamalari", icon: Settings },
              { id: "broadcast", label: "Xabarlar & Xabarnoma", icon: Send },
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
        {/* ------------------------------------------------------------- */}
        {/* TAB: DORIXONALAR VA HAMKORLIK ARIZALARI */}
        {/* ------------------------------------------------------------- */}
        {/* TAB: DORIXONALAR */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "pharmacies" && (
          <div className="space-y-6">
            {/* Header va Metrikalar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Store className="text-emerald-500" size={20} />
                    Dorixonalar Boshqaruvi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Platformadagi barcha hamkor dorixonalar va ularning dori vositalari nazorati
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <RefreshCw size={13} />
                  Yangilash
                </button>
              </div>

              {/* Metrika kartalari */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jami Dorixonalar</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{pharmacies.length} ta</p>
                  <p className="mt-1 text-[11px] text-slate-400">Ro&apos;yxatdan o&apos;tgan</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">💊 Kiritilgan Dorilar</p>
                  <p className="mt-1 text-2xl font-black text-emerald-800">
                    {pharmacies.reduce((sum, p) => sum + (p.medicinesCount || 0), 0)} ta
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Barcha dorixonalarda</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">📦 Jami Buyurtmalar</p>
                  <p className="mt-1 text-2xl font-black text-amber-800">
                    {pharmacies.reduce((sum, p) => sum + (p.ordersCount || 0), 0)} ta
                  </p>
                  <p className="mt-1 text-[11px] text-amber-600 font-semibold">Mijozlar buyurtmalari</p>
                </div>
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">📍 Faol Hamkorlar</p>
                  <p className="mt-1 text-2xl font-black text-teal-800">
                    {pharmacies.length} ta
                  </p>
                  <p className="mt-1 text-[11px] text-teal-600 font-semibold">Panel ochiq</p>
                </div>
              </div>

              {/* Qidiruv */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500">
                  Jami dorixonalar: <b>{pharmacies.length} ta</b>
                </span>

                <div className="relative min-w-[260px] flex-1 sm:max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Dorixona nomi, mas'ul shaxs yoki telefon..."
                    value={pharmacySearch}
                    onChange={(e) => setPharmacySearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Dorixonalar Ro'yxati */}
            {(() => {
              const filtered = pharmacies.filter((p) => {
                if (pharmacySearch.trim()) {
                  const q = pharmacySearch.toLowerCase();
                  return (
                    p.organization?.toLowerCase().includes(q) ||
                    p.name?.toLowerCase().includes(q) ||
                    p.phone?.toLowerCase().includes(q) ||
                    p.address?.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Store size={36} className="mx-auto mb-3 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-800">Dorixonalar topilmadi</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {pharmacySearch ? "Qidiruv so'rovi bo'yicha hech narsa chiqmadi" : "Hozircha dorixonalar mavjud emas"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      className="relative rounded-2xl border border-slate-200 bg-white p-5 transition shadow-xs hover:border-slate-300"
                    >
                      {/* Kartochka tepasi */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <Store size={22} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-black text-slate-900 truncate">
                              {p.organization || p.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium truncate">
                              Mas&apos;ul: <b className="text-slate-700">{p.name}</b>
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          #{p.id} Dorixona
                        </span>
                      </div>

                      {/* Ma'lumotlar bloki */}
                      <div className="space-y-2 border-y border-slate-100 py-3 my-3 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Phone size={13} /> Telefon:
                          </span>
                          <a href={`tel:${p.phone}`} className="font-bold text-slate-900 hover:text-emerald-600">
                            {p.phone}
                          </a>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 flex items-center gap-1 shrink-0">
                            <MapPin size={13} /> Manzil:
                          </span>
                          <span className="font-medium text-slate-800 text-right line-clamp-1">
                            {p.address || "Manzil kiritilmagan"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock size={13} /> Ish vaqti:
                          </span>
                          <span className="font-medium text-slate-800">{p.workHours || "24/7"}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Bot size={13} /> Telegram:
                          </span>
                          <span className="font-medium">
                            {p.telegramId ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Ulangan (ID: {p.telegramId})
                              </span>
                            ) : (
                              <span className="text-slate-400">Ulanmagan</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Statistika ko'rsatkichlari */}
                      <div className="grid grid-cols-3 gap-2 py-1 mb-3 text-center">
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Dorilar</p>
                          <p className="text-sm font-black text-teal-700">{p.medicinesCount} ta</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Buyurtmalar</p>
                          <p className="text-sm font-black text-amber-700">{p.ordersCount} ta</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Reyting</p>
                          <p className="text-sm font-black text-emerald-700 flex items-center justify-center gap-0.5">
                            {p.ratingAvg ? (
                              <>
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                {p.ratingAvg}
                              </>
                            ) : (
                              "Yangi"
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Harakatlar tugmalari */}
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPharmacyMedicines(p)}
                            className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 active:scale-95 transition"
                          >
                            <Package size={14} />
                            Dorilar ({p.medicinesCount})
                          </button>

                          <button
                            onClick={() => {
                              setDirectMsgTitle("");
                              setDirectMsgText("");
                              setDirectMsgBtnText("");
                              setDirectMsgBtnUrl("");
                              setDirectMsgResult(null);
                              setDirectMsgModal({
                                open: true,
                                type: "pharmacy",
                                id: p.id,
                                name: p.organization || p.name,
                                telegramId: p.telegramId,
                              });
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 hover:bg-sky-100 active:scale-95 transition"
                            title="Ushbu dorixona egasiga Telegram orqali xabar yuborish"
                          >
                            <Send size={13} />
                            Xabar
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteSpecialist(p.id, p.organization || p.name)}
                          disabled={busy}
                          title="Dorixonani butunlay o'chirish"
                          className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: MUTAXASSISLAR (AGRONOM VA VETERINARLAR) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "specialists" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="text-emerald-500" size={20} />
                    Mutaxassislar (Agronom va Veterinarlar)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Dehqon va chorvadorlarga joyiga borib yordam beruvchi mutaxassislarni ko&apos;rib chiqish, tasdiqlash va boshqarish
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <RefreshCw size={13} />
                  Yangilash
                </button>
              </div>

              {/* Metrikalar */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Jami Mutaxassislar</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{specialistsList.length} ta</p>
                  <p className="mt-1 text-[11px] text-slate-400">Baza bo&apos;yicha</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">🌾 Agronomlar</p>
                  <p className="mt-1 text-2xl font-black text-emerald-800">
                    {specialistsList.filter((s) => (s.specialty || "").toLowerCase().includes("agronom") || (s.specialty || "").toLowerCase().includes("ekin")).length} ta
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold">O&apos;simlik sohasi</p>
                </div>
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">🐄 Veterinarlar</p>
                  <p className="mt-1 text-2xl font-black text-teal-800">
                    {specialistsList.filter((s) => (s.specialty || "").toLowerCase().includes("veterinar") || (s.specialty || "").toLowerCase().includes("chorva")).length} ta
                  </p>
                  <p className="mt-1 text-[11px] text-teal-600 font-semibold">Chorva sohasi</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">📞 Jami Chaqiruvlar</p>
                  <p className="mt-1 text-2xl font-black text-blue-800">
                    {specialistsList.reduce((acc, s) => acc + (s.callsCount || 0), 0)} ta
                  </p>
                  <p className="mt-1 text-[11px] text-blue-600 font-semibold">Fermerlar chaqiruvi</p>
                </div>
              </div>

              {/* Filtrlash */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "Barchasi", count: specialistsList.length },
                    {
                      id: "agronom",
                      label: "🌾 Agronomlar",
                      count: specialistsList.filter((s) => (s.specialty || "").toLowerCase().includes("agronom") || (s.specialty || "").toLowerCase().includes("ekin")).length,
                    },
                    {
                      id: "veterinar",
                      label: "🐄 Veterinarlar",
                      count: specialistsList.filter((s) => (s.specialty || "").toLowerCase().includes("veterinar") || (s.specialty || "").toLowerCase().includes("chorva")).length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSpecialistFilter(tab.id as any)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        specialistFilter === tab.id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          specialistFilter === tab.id
                            ? "bg-slate-700 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mutaxassis, soha yoki telefon..."
                    value={specialistSearch}
                    onChange={(e) => setSpecialistSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Mutaxassislar ro'yxati */}
            {(() => {
              const filtered = specialistsList.filter((s) => {
                if (
                  specialistFilter === "agronom" &&
                  !((s.specialty || "").toLowerCase().includes("agronom") || (s.specialty || "").toLowerCase().includes("ekin"))
                )
                  return false;
                if (
                  specialistFilter === "veterinar" &&
                  !((s.specialty || "").toLowerCase().includes("veterinar") || (s.specialty || "").toLowerCase().includes("chorva"))
                )
                  return false;
                if (specialistSearch.trim()) {
                  const q = specialistSearch.toLowerCase();
                  return (
                    s.name?.toLowerCase().includes(q) ||
                    s.specialty?.toLowerCase().includes(q) ||
                    s.organization?.toLowerCase().includes(q) ||
                    s.phone?.toLowerCase().includes(q) ||
                    s.address?.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Users size={36} className="mx-auto mb-3 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-800">Mutaxassislar topilmadi</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {specialistSearch ? "Qidiruv so'rovi bo'yicha hech narsa chiqmadi" : "Hozircha mutaxassislar mavjud emas"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filtered.map((s) => (
                    <div
                      key={s.id}
                      className="relative rounded-2xl border border-slate-200 bg-white p-5 transition shadow-xs hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <Users size={22} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-base font-black text-slate-900 truncate">{s.name}</h4>
                            <p className="text-xs text-emerald-700 font-bold truncate">
                              {s.specialty || "Qishloq xo'jaligi mutaxassisi"}
                            </p>
                            {s.organization && (
                              <p className="text-[11px] text-slate-400 truncate">{s.organization}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            ID: #{s.id}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 border-y border-slate-100 py-3 my-3 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Phone size={13} /> Telefon:
                          </span>
                          <a href={`tel:${s.phone}`} className="font-bold text-slate-900 hover:text-emerald-600">
                            {s.phone}
                          </a>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <span className="text-slate-400 flex items-center gap-1 shrink-0">
                            <MapPin size={13} /> Manzil:
                          </span>
                          <span className="font-medium text-slate-800 text-right line-clamp-1">
                            {s.address || "Manzil kiritilmagan"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Bot size={13} /> Telegram:
                          </span>
                          <span className="font-medium">
                            {s.telegramId ? (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                Ulangan (ID: {s.telegramId})
                              </span>
                            ) : (
                              <span className="text-slate-400">Ulanmagan</span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Holat (Bandlik):</span>
                          <span>
                            {s.isBusy ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                🔴 Chaqiruvda band
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                🟢 Bo&apos;sh
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-1 mb-3 text-center">
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Chaqiruvlar</p>
                          <p className="text-sm font-black text-amber-700">{s.callsCount} ta</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Reyting</p>
                          <p className="text-sm font-black text-emerald-700 flex items-center justify-center gap-0.5">
                            {s.ratingAvg ? (
                              <>
                                <Star size={11} className="fill-amber-400 text-amber-400" />
                                {s.ratingAvg} ({s.ratingCount})
                              </>
                            ) : (
                              "Yangi"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <span className="text-[11px] text-slate-400">
                          Ro&apos;yxatdan o&apos;tgan: {new Date(s.createdAt).toLocaleDateString("uz-UZ")}
                        </span>

                        <button
                          onClick={() => handleDeleteSpecialist(s.id, s.name)}
                          disabled={busy}
                          title="Mutaxassisni butunlay o'chirish"
                          className="flex items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: BUYURTMALAR (ORDERS) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="text-emerald-500" size={20} />
                    Barcha Buyurtmalar Boshqaruvi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Dorixonalarga tushgan dori buyurtmalari, buyurtma tarkibi va yetkazib berish holati
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <RefreshCw size={13} />
                  Yangilash
                </button>
              </div>

              {/* Filtrlash */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "Barchasi", count: ordersList.length },
                    {
                      id: "yangi",
                      label: "⏳ Yangi",
                      count: ordersList.filter((o) => o.status === "yangi").length,
                      alert: ordersList.filter((o) => o.status === "yangi").length > 0,
                    },
                    {
                      id: "tasdiqlandi",
                      label: "🔵 Tasdiqlandi",
                      count: ordersList.filter((o) => o.status === "tasdiqlandi").length,
                    },
                    {
                      id: "yetkazildi",
                      label: "✅ Yetkazildi",
                      count: ordersList.filter((o) => o.status === "yetkazildi").length,
                    },
                    {
                      id: "bekor",
                      label: "❌ Bekor",
                      count: ordersList.filter((o) => o.status === "bekor").length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOrderFilter(tab.id as any)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        orderFilter === tab.id
                          ? "bg-slate-900 text-white"
                          : tab.alert
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          orderFilter === tab.id
                            ? "bg-slate-700 text-white"
                            : tab.alert
                            ? "bg-amber-200 text-amber-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mijoz, dorixona yoki ID..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Buyurtmalar ro'yxati */}
            {(() => {
              const filtered = ordersList.filter((o) => {
                if (orderFilter !== "all" && o.status !== orderFilter) return false;
                if (orderSearch.trim()) {
                  const q = orderSearch.toLowerCase();
                  return (
                    o.customerName?.toLowerCase().includes(q) ||
                    o.customerPhone?.toLowerCase().includes(q) ||
                    o.pharmacyName?.toLowerCase().includes(q) ||
                    o.pharmacyOrg?.toLowerCase().includes(q) ||
                    String(o.id).includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <ShoppingCart size={36} className="mx-auto mb-3 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-800">Buyurtmalar topilmadi</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {orderSearch ? "Qidiruv so'rovi bo'yicha hech narsa chiqmadi" : "Hozircha buyurtmalar yo'q"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-800">
                            #{o.id}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{o.customerName}</h4>
                            <p className="text-xs text-slate-400">{o.customerPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-black border transition ${
                              o.status === "yetkazildi"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : o.status === "tasdiqlandi"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : o.status === "bekor"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            }`}
                          >
                            <option value="yangi">⏳ Yangi</option>
                            <option value="tasdiqlandi">🔵 Tasdiqlandi</option>
                            <option value="yetkazildi">✅ Yetkazildi</option>
                            <option value="bekor">❌ Bekor</option>
                          </select>

                          <button
                            onClick={() => handleDeleteOrder(o.id)}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Buyurtmani o'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-600 mb-3">
                        <div>
                          <p className="text-slate-400 text-[11px]">Bajaruvchi dorixona:</p>
                          <p className="font-bold text-slate-900">
                            {o.pharmacyOrg || o.pharmacyName || "Dorixona belgilanmagan"}
                          </p>
                          {o.pharmacyPhone && <p className="text-slate-500">{o.pharmacyPhone}</p>}
                        </div>
                        <div>
                          <p className="text-slate-400 text-[11px]">Yetkazish manzili:</p>
                          <p className="font-medium text-slate-800">{o.customerAddress || "Olib ketish (Dorixonadan)"}</p>
                          {o.deliveryType && (
                            <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {o.deliveryType}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tovarlar ro'yxati */}
                      {o.items && o.items.length > 0 && (
                        <div className="rounded-xl bg-slate-50 p-3 mb-3">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Buyurtma tarkibi ({o.items.length} ta dori):
                          </p>
                          <div className="space-y-1.5">
                            {o.items.map((it, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">
                                  {it.name} <span className="text-slate-400">× {it.qty} dona</span>
                                </span>
                                <span className="font-bold text-slate-900">
                                  {it.price ? formatSum(it.price * it.qty) : "-"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                        <span className="text-slate-400">
                          Sana: {new Date(o.createdAt).toLocaleDateString("uz-UZ")} {new Date(o.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="text-right">
                          <span className="text-slate-400 text-[11px] mr-2">Jami summa:</span>
                          <span className="text-base font-black text-emerald-700">
                            {o.totalSum ? formatSum(o.totalSum) : "0 so'm"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB: CHAQIRUVLAR (SPECIALIST CALLS) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "calls" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="text-emerald-500" size={20} />
                    Mutaxassis Chaqiruvlari Tarixi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Dehqon va chorvadorlarning mutaxassislar uchun yuborgan muammoli so&apos;rovlari
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <RefreshCw size={13} />
                  Yangilash
                </button>
              </div>

              {/* Filtrlash */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "Barchasi", count: callsList.length },
                    {
                      id: "yangi",
                      label: "⏳ Yangi",
                      count: callsList.filter((c) => c.status === "yangi").length,
                      alert: callsList.filter((c) => c.status === "yangi").length > 0,
                    },
                    {
                      id: "qabul_qilindi",
                      label: "🔵 Qabul qilindi",
                      count: callsList.filter((c) => c.status === "qabul_qilindi").length,
                    },
                    {
                      id: "bajarildi",
                      label: "✅ Bajarildi",
                      count: callsList.filter((c) => c.status === "bajarildi").length,
                    },
                    {
                      id: "bekor",
                      label: "❌ Bekor",
                      count: callsList.filter((c) => c.status === "bekor").length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCallFilter(tab.id as any)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        callFilter === tab.id
                          ? "bg-slate-900 text-white"
                          : tab.alert
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          callFilter === tab.id
                            ? "bg-slate-700 text-white"
                            : tab.alert
                            ? "bg-amber-200 text-amber-900"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mijoz, muammo yoki telefon..."
                    value={callSearch}
                    onChange={(e) => setCallSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Chaqiruvlar ro'yxati */}
            {(() => {
              const filtered = callsList.filter((c) => {
                if (callFilter !== "all" && c.status !== callFilter) return false;
                if (callSearch.trim()) {
                  const q = callSearch.toLowerCase();
                  return (
                    c.customerName?.toLowerCase().includes(q) ||
                    c.customerPhone?.toLowerCase().includes(q) ||
                    c.problem?.toLowerCase().includes(q) ||
                    c.specialistName?.toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
                    <Activity size={36} className="mx-auto mb-3 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-800">Chaqiruvlar topilmadi</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {callSearch ? "Qidiruv so'rovi bo'yicha hech narsa chiqmadi" : "Hozircha chaqiruvlar yo'q"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-800">
                            #{c.id}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{c.customerName}</h4>
                            <p className="text-xs text-slate-400">{c.customerPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={c.status}
                            onChange={(e) => handleUpdateCallStatus(c.id, e.target.value)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-black border transition ${
                              c.status === "bajarildi"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : c.status === "qabul_qilindi"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : c.status === "bekor"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            }`}
                          >
                            <option value="yangi">⏳ Yangi</option>
                            <option value="qabul_qilindi">🔵 Qabul qilindi</option>
                            <option value="bajarildi">✅ Bajarildi</option>
                            <option value="bekor">❌ Bekor</option>
                          </select>

                          <button
                            onClick={() => handleDeleteCall(c.id)}
                            className="rounded-xl p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Chaqiruvni o'chirish"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl bg-amber-50/70 border border-amber-200/60 p-3 mb-3">
                        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                          Murojaat / Muammo tavsifi:
                        </p>
                        <p className="text-xs font-semibold text-slate-900">{c.problem}</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 text-xs text-slate-600">
                        <div>
                          <p className="text-slate-400 text-[11px]">Biriktirilgan mutaxassis:</p>
                          <p className="font-bold text-slate-900">{c.specialistName}</p>
                          <p className="text-slate-500">{c.specialistPhone}</p>
                          {c.specialistSpecialty && (
                            <span className="inline-block mt-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                              {c.specialistSpecialty}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-slate-400 text-[11px]">Chaqiruv manzili:</p>
                          <p className="font-medium text-slate-800">{c.address || "Manzil ko'rsatilmagan"}</p>
                          <p className="text-[11px] text-slate-400 mt-2">
                            Yaratilgan vaqt: {new Date(c.createdAt).toLocaleDateString("uz-UZ")} {new Date(c.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
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

        {/* DORIXONA DORILARI MODALI */}
        {selectedPharmacyForMeds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
              {/* Modal header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-200">
                    <Store size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedPharmacyForMeds.org || selectedPharmacyForMeds.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Dorixona assortimenti va dori vositalari ro&apos;yxati ({pharmacyMedicines.length} ta dori)
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPharmacyForMeds(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Ichki qidiruv */}
              <div className="mb-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Dori nomi yoki qo'llanilishi bo'yicha izlash..."
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Dorilar jadvali */}
              {loadingMedicines ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  <RefreshCw className="animate-spin mx-auto mb-2 text-emerald-500" size={24} />
                  Dorilar yuklanmoqda...
                </div>
              ) : (() => {
                const list = pharmacyMedicines.filter((m) => {
                  if (!medicineSearch.trim()) return true;
                  const q = medicineSearch.toLowerCase();
                  return (
                    m.name.toLowerCase().includes(q) ||
                    m.type?.toLowerCase().includes(q) ||
                    m.usage?.toLowerCase().includes(q)
                  );
                });

                if (list.length === 0) {
                  return (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400">
                      <Package size={32} className="mx-auto mb-2 text-slate-300" />
                      {medicineSearch ? "Qidiruv bo'yicha dori topilmadi" : "Ushbu dorixona hali birorta ham dori kiritmagan"}
                    </div>
                  );
                }

                return (
                  <div className="max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <tr>
                          <th className="py-3 px-4">Dori nomi</th>
                          <th className="py-3 px-4">Turi / Guruhi</th>
                          <th className="py-3 px-4">Qo&apos;llanishi</th>
                          <th className="py-3 px-4">Narxi</th>
                          <th className="py-3 px-4">Qoldiq</th>
                          <th className="py-3 px-4">Holati</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {list.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900">{m.name}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{m.type || "-"}</td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{m.usage || "-"}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {m.price ? formatSum(m.price) : "-"}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              {m.stock !== null ? `${m.stock} dona` : "-"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${
                                  m.status === "bor"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {m.status === "bor" ? "Mavjud" : "Tugagan"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Modal pastki qismi */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <span className="text-xs text-slate-400">
                  Jami: <b>{pharmacyMedicines.length}</b> ta dori
                </span>
                <button
                  onClick={() => setSelectedPharmacyForMeds(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}

        </main>
      </div>
    </div>
  );
}
