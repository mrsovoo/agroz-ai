"use client";
import { apiFetch } from "@/lib/api-config";

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
  LogOut,
  HandCoins,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  Send,
  ArrowRight,
} from "lucide-react";
import { haptic } from "@/lib/telegram";
import { isNativeApp } from "@/lib/capacitor";
import { useRouter } from "next/navigation";
import PharmacyDashboard, { LOW_STOCK_THRESHOLD } from "./PharmacyDashboard";
import SpecialistDashboard from "./SpecialistDashboard";
import AgrozBusinessLogo from "@/components/AgrozBusinessLogo";
import { TariffsBlock } from "@/components/BusinessLanding";
import QarzDaftariSection from "@/components/QarzDaftariSection";

/** Backend URL — Development rejimida har doim localhost:4000, production'da Railway */
const BACKEND =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "") ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:4000"
    : process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://agroz-ai-backend-production.up.railway.app");

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

const DEMO_PHARMACY_PARTNER: PartnerProfile = {
  id: 991,
  name: "Agro Kimyo Baraka",
  organization: "Agro Kimyo Baraka MCHJ",
  role: "pharmacy",
  phone: "+998 90 123 45 67",
  specialty: "Agro-dorixona va o'g'itlar",
  address: "Farg'ona vil., Quva tumani, Markaziy bozor 12-do'kon",
  workHours: "08:00 - 19:00",
  isBusy: false,
  isApproved: true,
  rating: { avg: 4.9, count: 28 },
  stats: {
    totalOrders: 14,
    pendingOrders: 2,
    totalCalls: 0,
    pendingCalls: 0,
    activeCalls: 0,
    completedCalls: 0,
  },
};

const DEMO_PHARMACY_MEDICINES: PartnerMedicine[] = [
  {
    id: 101,
    specialistId: 991,
    name: "BENTO MAX (Bentonit uni)",
    type: "animal",
    usage: "Chorva va parrandalar uchun tabiiy mineral ozuqa qo'shimchasi. Oshqozon hazmini yaxshilaydi.",
    price: 45000,
    stock: 24,
    stockUnit: "qop (5kg)",
    status: "bor",
    createdAt: new Date().toISOString(),
  },
  {
    id: 102,
    specialistId: 991,
    name: "Agro-Bio Stimulyator Pro",
    type: "crop",
    usage: "Ekinlar ildiz otishi va o'sishi uchun kuchli organik stimulyator.",
    price: 85000,
    stock: 4,
    stockUnit: "dona",
    status: "bor",
    createdAt: new Date().toISOString(),
  },
  {
    id: 103,
    specialistId: 991,
    name: "Ento-Zararkunanda Insektitsid",
    type: "crop",
    usage: "Zararkunandalarga qarshi yuqori samarali vosita.",
    price: 62000,
    stock: 15,
    stockUnit: "dona",
    status: "bor",
    createdAt: new Date().toISOString(),
  },
  {
    id: 104,
    specialistId: 991,
    name: "Kalsiy-Fosfat Ozuqa Qo'shimchasi",
    type: "animal",
    usage: "Chorva suyak va mushak tizimini mustahkamlash uchun.",
    price: 38000,
    stock: 0,
    stockUnit: "qop",
    status: "yoq",
    createdAt: new Date().toISOString(),
  },
];

const DEMO_PHARMACY_ORDERS: PartnerOrder[] = [
  {
    id: 2041,
    pharmacySpecialistId: 991,
    customerName: "Jamshidbek Qodirov",
    customerPhone: "+998 91 234 56 78",
    deliveryType: "delivery",
    customerAddress: "Quva tumani, Baynalminal MFY, 44-uy",
    note: "Iltimos bugun soat 17:00 gacha yetkazib bering",
    totalSum: 90000,
    status: "yangi",
    createdAt: new Date().toISOString(),
    items: [{ id: 1, name: "BENTO MAX (Bentonit uni)", qty: 2, price: 45000 }],
  },
  {
    id: 2038,
    pharmacySpecialistId: 991,
    customerName: "Rustam aka Fermer",
    customerPhone: "+998 90 987 65 43",
    deliveryType: "pickup",
    customerAddress: null,
    note: "Do'kondan o'zim olib ketaman",
    totalSum: 85000,
    status: "tasdiqlandi",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [{ id: 2, name: "Agro-Bio Stimulyator Pro", qty: 1, price: 85000 }],
  },
  {
    id: 2025,
    pharmacySpecialistId: 991,
    customerName: "Dilshodbek Chorvador",
    customerPhone: "+998 93 111 22 33",
    deliveryType: "delivery",
    customerAddress: "Qo'qon yo'li, 12-ferma",
    totalSum: 186000,
    status: "yetkazildi",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    items: [{ id: 3, name: "Ento-Zararkunanda Insektitsid", qty: 3, price: 62000 }],
  },
];

const DEMO_SPECIALIST_PARTNER: PartnerProfile = {
  id: 992,
  name: "Dr. Alisher Ahmedov",
  role: "specialist",
  phone: "+998 93 555 44 33",
  specialty: "Bosh Veterinar & Chorvachilik Mutaxassisi",
  experienceYears: 14,
  bio: "Chorva kasalliklarini davolash, profilaktika va ozuqa ratsionini to'g'ri shakllantirish bo'yicha 14 yillik tajribaga egaman.",
  education: "Samarqand Veterinariya Meditsinasi Instituti",
  helpsWith: "animal",
  isBusy: false,
  isApproved: true,
  rating: { avg: 5.0, count: 42 },
  stats: {
    totalOrders: 0,
    pendingOrders: 0,
    totalCalls: 18,
    pendingCalls: 2,
    activeCalls: 1,
    completedCalls: 15,
  },
};

const DEMO_SPECIALIST_CALLS: PartnerCall[] = [
  {
    id: 3012,
    specialistId: 992,
    customerName: "Ilhomjon aka (Fermer)",
    customerPhone: "+998 90 333 44 55",
    problem: "Sigirning tana harorati yuqori, 2 kundan beri yem yemayapti. Zudlik bilan ko'rik va ukol kerak.",
    address: "Oltiariq tumani, Yangiarıq MFY, 15-ferma",
    status: "yangi",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3008,
    specialistId: 992,
    customerName: "Zafarbek",
    customerPhone: "+998 97 888 99 00",
    problem: "Yosh buzoqlar uchun rejali vaksina va ko'rik qilish kerak.",
    address: "Farg'ona, Beshkapa",
    status: "qabul_qilindi",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export default function PartnerKabinetPage() {
  const [initData, setInitData] = useState<string>("");
  const [webToken, setWebToken] = useState<string>("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState<"password" | "otp">("password");
  const [rememberMe, setRememberMe] = useState(true);

  // OTP tasdiqlash holatlari
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [quickList, setQuickList] = useState<{
    pharmacies: Array<{
      id: number;
      name: string;
      phone: string;
      address?: string | null;
      workHours?: string | null;
    }>;
    experts: Array<{
      id: number;
      name: string;
      phone: string;
      specialty?: string | null;
      experienceYears?: number | null;
    }>;
  }>({ pharmacies: [], experts: [] });
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTariffsModal, setShowTariffsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Sotib olish va tariflar modali
  const [purchasePlan, setPurchasePlan] = useState<"beta" | "standard" | null>(null);
  const [purchaseStoreName, setPurchaseStoreName] = useState("");
  const [purchasePhone, setPurchasePhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"click" | "payme" | "card">("click");

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

  function getHeaders(customInitData = initData, customToken = webToken) {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (customInitData) {
      h["x-telegram-init-data"] = customInitData;
    }
    if (customToken) {
      h["Authorization"] = `Bearer ${customToken}`;
      h["x-partner-token"] = customToken;
    }
    return h;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initData) {
      tg.ready?.();
      tg.expand?.();
      tg.setHeaderColor?.("#1b1464");
      tg.setBackgroundColor?.("#f8fafc");
      setInitData(tg.initData);
      setIsTelegram(true);
      loadData(tg.initData, "");
    } else {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get("token");
      const phoneFromUrl = urlParams.get("phone");

      if (tokenFromUrl) {
        setWebToken(tokenFromUrl);
        localStorage.setItem("agroz_business_token", tokenFromUrl);
        loadData("", tokenFromUrl);
      } else if (phoneFromUrl) {
        handleWebLogin(phoneFromUrl);
      } else {
        const stored = localStorage.getItem("agroz_business_token");
        if (stored) {
          setWebToken(stored);
          loadData("", stored);
        } else {
          setLoading(false);
        }
      }
    }

    // Quick-list hamkorlarni yuklab olish (web yoki local dev uchun)
    apiFetch(`/api/bot/partner/quick-list`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) {
          setQuickList({
            pharmacies: Array.isArray(d.pharmacies) ? d.pharmacies : [],
            experts: Array.isArray(d.experts) ? d.experts : [],
          });
        }
      })
      .catch(() => {});
  }, []);

  // OTP Taymeri
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  async function loadData(tgData = initData, token = webToken) {
    if (!tgData && !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers = getHeaders(tgData, token);

      // 1. Profil va statistikani olish
      const initRes = await apiFetch(`/api/bot/partner/init`, {
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
          setActiveTab((prev) => (prev === "orders" || prev === "medicines" ? "dashboard" : prev));
        }

        // Agar tasdiqlanmagan bo'lsa
        if (!p.isApproved) {
          setLoading(false);
          return;
        }

        // 2. Rolga qarab ma'lumotlarni yuklash
        if (p.role === "pharmacy") {
          const [ordersRes, medsRes] = await Promise.allSettled([
            apiFetch(`/api/bot/partner/orders`, { headers }),
            apiFetch(`/api/bot/partner/medicines`, { headers }),
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
          const callsRes = await apiFetch(`/api/bot/partner/calls`, { headers });
          if (callsRes.ok) {
            const d = await callsRes.json();
            if (d?.ok && Array.isArray(d.calls)) {
              setCalls(d.calls);
            }
          }
        }
      } else {
        if (token && !tgData) {
          localStorage.removeItem("agroz_business_token");
          setWebToken("");
        }
        setError(initJson?.error || "Hamkor profili topilmadi.");
      }
    } catch {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Internet aloqasini tekshiring.");
    } finally {
      setLoading(false);
    }
  }

  // Real-vaqtda sinxronizatsiya: har 20 soniyada buyurtmalar yoki chaqiruvlarni fonda avtomatik yangilash
  useEffect(() => {
    if (!partner || !partner.isApproved) return;
    const interval = setInterval(async () => {
      try {
        const headers = getHeaders();
        if (partner.role === "pharmacy") {
          const res = await apiFetch(`/api/bot/partner/orders`, { headers });
          if (res.ok) {
            const d = await res.json();
            if (d?.ok && Array.isArray(d.orders)) {
              setOrders(d.orders);
            }
          }
        } else {
          const res = await apiFetch(`/api/bot/partner/calls`, { headers });
          if (res.ok) {
            const d = await res.json();
            if (d?.ok && Array.isArray(d.calls)) {
              setCalls(d.calls);
            }
          }
        }
      } catch {
        // silent
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [partner, initData, webToken]);

  async function handleStartPlan(plan: "beta" | "standard", storeName?: string, phone?: string) {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const pPhone = phone || purchasePhone || loginPhone || "+998 90 123 45 67";
      const pName = storeName || purchaseStoreName || (plan === "standard" ? "Agro Baraka Dorixona" : "Do‘konim");

      const newPartner: PartnerProfile = {
        ...DEMO_PHARMACY_PARTNER,
        id: Date.now(),
        name: pName,
        organization: `${pName} MCHJ`,
        phone: pPhone,
      };

      setPartner(newPartner);
      setMedicines(DEMO_PHARMACY_MEDICINES);
      setOrders(DEMO_PHARMACY_ORDERS);
      setActiveTab("dashboard");
      const token = `biz_partner_${Date.now()}`;
      setWebToken(token);
      localStorage.setItem("agroz_business_token", token);
      setShowLoginModal(false);
      setPurchasePlan(null);
    } catch {
      setLoginError("Tarifni faollashtirishda xatolik yuz berdi");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleWebLogin(phoneToUse?: string, demoRole?: "pharmacy" | "specialist", partnerId?: number) {
    setLoginLoading(true);
    setLoginError(null);
    setSelectedPartnerId(partnerId || null);

    const targetPhone = (phoneToUse || (partnerId ? undefined : loginPhone))?.trim();

    try {
      const res = await apiFetch(`/api/bot/partner/web-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          partnerId,
          demoRole,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.token) {
        setWebToken(data.token);
        localStorage.setItem("agroz_business_token", data.token);
        await loadData(initData, data.token);
        setShowLoginModal(false);
        setLoginLoading(false);
        return;
      }
    } catch {
      // offline fallback
    }

    // Telefon raqam bilan to'g'ridan-to'g'ri kirish
    if (targetPhone && targetPhone.length >= 7) {
      const newPartner: PartnerProfile = {
        ...DEMO_PHARMACY_PARTNER,
        id: Date.now(),
        name: "Do‘konim",
        phone: targetPhone,
      };
      setPartner(newPartner);
      setMedicines(DEMO_PHARMACY_MEDICINES);
      setOrders(DEMO_PHARMACY_ORDERS);
      setActiveTab("dashboard");
      const token = `biz_partner_${Date.now()}`;
      setWebToken(token);
      localStorage.setItem("agroz_business_token", token);
      setShowLoginModal(false);
      setLoginLoading(false);
      return;
    }

    if (demoRole === "pharmacy") {
      handleStartPlan("beta");
      return;
    }

    setLoginError("Iltimos, telefon raqamingizni to‘liq kiriting");
    setLoginLoading(false);
    setSelectedPartnerId(null);
  }

  // 1. Parol bilan kirish
  async function handlePasswordLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoginError(null);

    const targetPhone = loginPhone.trim();
    if (!targetPhone) {
      setLoginError("Iltimos, telefon raqamingiz yoki loginingizni kiriting");
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError("Iltimos, parolingizni kiriting");
      return;
    }

    setLoginLoading(true);
    try {
      const cleanPhone = targetPhone.replace(/\D/g, "");
      const res = await apiFetch(`/api/bot/partner/web-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone || targetPhone,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.token) {
        setWebToken(data.token);
        if (rememberMe) {
          localStorage.setItem("agroz_business_token", data.token);
        }
        await loadData(initData, data.token);
        setLoginLoading(false);
        return;
      } else {
        // Fallback: Agar telefon raqam to'liq bo'lsa kirish
        if (cleanPhone.length >= 9) {
          await handleWebLogin(cleanPhone);
          return;
        }
        setLoginError(data?.error || "Login yoki parol noto‘g‘ri kiritildi");
      }
    } catch {
      if (targetPhone.length >= 7) {
        await handleWebLogin(targetPhone);
        return;
      }
      setLoginError("Server bilan aloqa uzildi. Internetni tekshiring.");
    } finally {
      setLoginLoading(false);
    }
  }

  // 2. Tasdiqlash kodini olish (SMS / Telegram)
  async function handleRequestOtp() {
    setLoginError(null);
    const cleanPhone = loginPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setLoginError("Iltimos, to‘liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await apiFetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (data?.ok) {
        setOtpSent(true);
        setOtpCountdown(60);
      } else {
        setOtpSent(true);
        setOtpCountdown(60);
      }
    } catch {
      setOtpSent(true);
      setOtpCountdown(60);
    } finally {
      setOtpLoading(false);
    }
  }

  // 3. Tasdiqlash kodini tekshirish va kirish
  async function handleVerifyOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoginError(null);
    const cleanPhone = loginPhone.replace(/\D/g, "");

    if (!otpCode || otpCode.trim().length < 4) {
      setLoginError("Iltimos, tasdiqlash kodini to‘liq kiriting");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await apiFetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otpCode.trim() }),
      });
      const data = await res.json();
      if (data?.ok && data.token) {
        setWebToken(data.token);
        if (rememberMe) {
          localStorage.setItem("agroz_business_token", data.token);
        }
        await loadData(initData, data.token);
        setLoginLoading(false);
        return;
      }
    } catch {
      // fallback
    }

    await handleWebLogin(cleanPhone);
  }

  function handleLogout() {
    localStorage.removeItem("agroz_business_token");
    setWebToken("");
    setPartner(null);
    setOrders([]);
    setMedicines([]);
    setCalls([]);
  }

  // Bandlik holatini almashtirish (1-tap toggle)
  async function toggleBusy() {
    haptic("medium");
    const next = !isBusy;
    setIsBusy(next);
    try {
      const res = await apiFetch(`/api/bot/partner/busy`, {
        method: "POST",
        headers: getHeaders(),
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
      const res = await apiFetch(`/api/bot/partner/calls/${callId}/action`, {
        method: "POST",
        headers: getHeaders(),
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
      const res = await apiFetch(`/api/bot/partner/orders/${orderId}/action`, {
        method: "POST",
        headers: getHeaders(),
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
      const res = await apiFetch(`/api/bot/partner/medicines/${medId}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status: nextStatus }),
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
        const res = await apiFetch(`/api/bot/partner/medicines/${medId}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ stock: nextStock }),
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
      const res = await apiFetch(`/api/bot/partner/medicines/${medId}`, {
        method: "DELETE",
        headers: getHeaders(),
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
      const res = await apiFetch(`/api/bot/partner/medicines`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: newMedName.trim(),
          type: newMedType,
          price: parsePriceNumber(newMedPrice),
          stock: Number(newMedStock) || 10,
          stockUnit: newMedUnit,
          usage: newMedUsage.trim() || null,
          photoData: newMedPhoto,
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

  // Kirish kartasi (Landing page ichida yoki modalda ko'rsatish uchun)
  const renderLoginCard = (isModal = false) => (
    <div className={`w-full rounded-3xl border border-[#E5E5EA] bg-white p-5 sm:p-6 shadow-xs space-y-4 ${isModal ? "" : "mx-auto"}`}>
      <div className="flex flex-col items-center text-center">
        <AgrozBusinessLogo className="h-8 w-auto mb-2" />
        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60">
          Boshqaruv Paneli
        </span>
        <p className="text-xs text-[#86868B] mt-2 max-w-sm">
          Agro-dorixona egalari va mutaxassislar uchun professional boshqaruv tizimi.
        </p>
      </div>

      {loginError && (
        <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
          {loginError}
        </div>
      )}

      {/* 1. Asosiy: Telefon raqam orqali Kabinetga Kirish */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleWebLogin();
        }}
        className="space-y-3 pt-1"
      >
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Ro‘yxatdan o‘tgan telefon raqamingiz:
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50/50 px-4 py-2.5 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={loginLoading}
              className="rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 shrink-0 transition active:scale-95 disabled:opacity-50"
            >
              {loginLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <span>Kirish</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* 2. Pastida: Yangi do'konlar uchun Sotib olishlar va Tariflar */}
      <div className="pt-4 border-t border-[#E5E5EA] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Yangi do‘konni ulash va sotib olish
          </span>
          <span className="text-[10px] text-zinc-400">Tezkor faollashtirish</span>
        </div>

        {/* Variant 1: BETA Tarif (0 so'm) */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1D1D1F]">BETA Start</span>
              <span className="bg-zinc-900 text-white text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full">
                0 so‘m
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] mt-0.5">
              Qarz daftari, ombor nazorati va AgrozGO vitrinasi
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPurchasePlan("beta")}
            disabled={loginLoading}
            className="shrink-0 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold px-4 py-2 transition active:scale-95"
          >
            Faollashtirish
          </button>
        </div>

        {/* Variant 2: Standart Tarif (149 000 so'm / Sotib olish) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1D1D1F]">Agro-Do‘kon Standart</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                149 000 so‘m/oy
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] mt-0.5">
              Cheksiz tovarlar, kunlik kassa hisoboti va prioritetli vitrina
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPurchasePlan("standard")}
            disabled={loginLoading}
            className="shrink-0 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-semibold px-4 py-2 transition active:scale-95 border border-zinc-200/80"
          >
            Sotib olish
          </button>
        </div>

        {/* Telegram bot orqali rasmiy ariza topshirish */}
        <div className="pt-2 text-center">
          <a
            href="https://t.me/agroz_auth_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition"
          >
            <span>Telegram bot orqali rasmiy ariza topshirish: @agroz_auth_bot</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );

  // 1. Agar tizim yuklanayotgan bo'lsa va profil aniqlanmagan bo'lsa
  if (loading && !partner) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F]">
          <RefreshCw size={15} className="animate-spin text-[#1D1D1F]" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  // 2. Agar foydalanuvchi tizimga kirmagan bo'lsa: Dedicated Business Login & Tasdiqlash ekrani
  if (!partner) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col justify-between py-8 px-4 sm:px-6 antialiased font-sans text-[#1D1D1F]">
        {/* Yuqori brend qatori */}
        <header className="max-w-md mx-auto w-full flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <AgrozBusinessLogo className="h-7 w-auto" />
            <span className="text-[10px] font-bold tracking-wider text-zinc-600 uppercase bg-zinc-200/80 px-2.5 py-0.5 rounded-full">
              ERP Kabinet
            </span>
          </div>
          <a
            href="https://agroz.uz"
            className="text-xs font-semibold text-zinc-500 hover:text-black transition flex items-center gap-1"
          >
            <span>Asosiy sayt</span>
            <ExternalLink size={12} />
          </a>
        </header>

        {/* Markaziy Kirish Kartochkasi (Apple-style clean ERP auth) */}
        <main className="w-full max-w-md mx-auto my-auto">
          <div className="rounded-[28px] border border-[#E5E5EA] bg-white p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6">
            {/* Sarlavha va Tavsif */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#191B1F] text-white shadow-md mb-2">
                <Store size={22} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#191B1F] tracking-tight">
                Agroz Business Tizimi
              </h1>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Agro-dorixona, kassa savdosi, ombor qoldiqlari va qarz daftari boshqaruv kabineti
              </p>
            </div>

            {/* Xatolik xabari */}
            {loginError && (
              <div className="rounded-2xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Kirish usullari tablari: Parol bilan / Tasdiqlash kodi */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 text-xs font-bold text-zinc-600">
              <button
                type="button"
                onClick={() => {
                  setAuthTab("password");
                  setLoginError(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  authTab === "password"
                    ? "bg-white text-black shadow-xs font-extrabold"
                    : "hover:text-black"
                }`}
              >
                Parol bilan
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab("otp");
                  setLoginError(null);
                }}
                className={`py-2 rounded-xl transition-all ${
                  authTab === "otp"
                    ? "bg-white text-black shadow-xs font-extrabold"
                    : "hover:text-black"
                }`}
              >
                Tasdiqlash kodi
              </button>
            </div>

            {/* Tab 1: Parol bilan kirish */}
            {authTab === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Telefon raqam yoki Login:
                  </label>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="+998 90 123 45 67 yoki login"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm font-medium text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700">Maxfiy Parol:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("otp");
                        setLoginError(null);
                      }}
                      className="text-[11px] font-semibold text-zinc-500 hover:text-black transition"
                    >
                      Parolni unutdingizmi?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 pl-4 pr-11 py-3 text-sm font-medium text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition"
                      title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md border-zinc-300 text-black focus:ring-black accent-black"
                    />
                    <span className="text-xs font-medium text-zinc-600">Eslab qolish</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Tekshirilmoqda...</span>
                    </>
                  ) : (
                    <span>Tizimga kirish</span>
                  )}
                </button>
              </form>
            )}

            {/* Tab 2: Tasdiqlash kodi bilan kirish (SMS / Telegram) */}
            {authTab === "otp" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Telefon raqamingiz:
                  </label>
                  <input
                    type="tel"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    disabled={otpSent}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm font-medium text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition disabled:opacity-75"
                  />
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={otpLoading}
                    className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {otpLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Kod yuborilmoqda...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Tasdiqlash kodini olish</span>
                      </>
                    )}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-700">Tasdiqlash kodi:</label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                          }}
                          className="text-[11px] font-semibold text-zinc-500 hover:text-black transition"
                        >
                          Raqamni o‘zgartirish
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        autoFocus
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Kod kelmadimi?</span>
                      {otpCountdown > 0 ? (
                        <span className="font-mono text-zinc-400">{otpCountdown} soniya</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRequestOtp}
                          disabled={otpLoading}
                          className="font-bold text-black hover:underline"
                        >
                          Qayta yuborish
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading || otpCode.length < 4}
                      className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loginLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Tasdiqlanmoqda...</span>
                        </>
                      ) : (
                        <span>Tasdiqlash va Kirish</span>
                      )}
                    </button>
                  </form>
                )}

                {/* Telegram orqali tasdiqlash alternativi */}
                <div className="pt-2 text-center">
                  <a
                    href="https://t.me/agroz_auth_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>Telegram bot orqali 1-sekundda tasdiqlash: @agroz_auth_bot</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}

            {/* Pastki: Yangi do'konlar uchun ro'yxatdan o'tish */}
            <div className="pt-4 border-t border-zinc-100 text-center space-y-2">
              <p className="text-xs text-zinc-500">
                Do‘koningiz hali AgrozGO tizimiga ulanmaganmi?
              </p>
              <button
                type="button"
                onClick={() => setPurchasePlan("beta")}
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-bold py-2.5 transition active:scale-98"
              >
                <span>Yangi do‘konni ulash (Ariza topshirish)</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Qo'shimcha yordam */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-zinc-500">
              Texnik yordam:{" "}
              <a href="tel:+998908383772" className="font-bold text-zinc-800 hover:underline">
                +998 90 838 37 72
              </a>{" "}
              |{" "}
              <a
                href="https://t.me/agroz_support"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-600 hover:underline"
              >
                @agroz_support
              </a>
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-zinc-400 pt-6">
          © {new Date().getFullYear()} AgrozGO Business. Barcha huquqlar himoyalangan.
        </footer>

        {/* Yangi do'konni ulash va faollashtirish modali */}
        {purchasePlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-md my-auto rounded-3xl border border-[#E5E5EA] bg-white p-6 shadow-xl space-y-4">
              <button
                type="button"
                onClick={() => setPurchasePlan(null)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition"
                title="Yopish"
              >
                <X size={16} />
              </button>

              <div className="text-center pt-2">
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60">
                  {purchasePlan === "standard" ? "Tarifni sotib olish" : "Bepul ulanish"}
                </span>
                <h3 className="text-xl font-bold tracking-tight text-[#1D1D1F] mt-2">
                  {purchasePlan === "standard" ? "Agro-Do‘kon Standart" : "BETA Start Rejasi"}
                </h3>
                <p className="text-xs text-[#86868B] mt-1">
                  {purchasePlan === "standard"
                    ? "Oylik obuna narxi: 149 000 so‘m (BETA a’zolariga 0 so‘m imtiyoz)"
                    : "BETA sinov davrida mutlaqo bepul (0 so‘m)"}
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartPlan(purchasePlan, purchaseStoreName, purchasePhone);
                }}
                className="space-y-3 pt-2"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Do‘kon yoki dorixona nomi:
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseStoreName}
                    onChange={(e) => setPurchaseStoreName(e.target.value)}
                    placeholder="Masalan: Baraka Agro"
                    className="w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50/50 px-4 py-2.5 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Telefon raqamingiz:
                  </label>
                  <input
                    type="tel"
                    required
                    value={purchasePhone}
                    onChange={(e) => setPurchasePhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full rounded-2xl border border-[#E5E5EA] bg-zinc-50/50 px-4 py-2.5 text-sm font-medium text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold py-3 transition active:scale-95 disabled:opacity-50"
                >
                  {loginLoading ? (
                    <RefreshCw size={14} className="animate-spin mx-auto" />
                  ) : purchasePlan === "standard" ? (
                    <span>To‘lov qilish va kabinetni ochish (149 000 so‘m)</span>
                  ) : (
                    <span>Do‘konni ulash va kabinetga o‘tish (0 so‘m)</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans antialiased">
      {/* 0. DESKTOP SIDEBAR (Apple-style toza oq-qora sidebar) */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-40 bg-white border-r border-[#E5E5EA]">
        {/* Yuqori qism: Do'kon / Biznes nomi */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1D1D1F] text-white">
              {isPharmacy ? <Store size={16} /> : <UserCheck size={16} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-[#1D1D1F] truncate leading-tight">
                {partner ? partner.organization || partner.name : "Do'kon paneli"}
              </h2>
              <p className="text-[10px] text-[#86868B] truncate mt-0.5">
                {isPharmacy ? "Agro-Dorixona" : partner?.specialty || "Mutaxassis"}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-black/5 text-[#86868B] shrink-0">
            BETA
          </span>
        </div>

        {/* Sidebar Navigatsiya Menyu */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {/* Dorixona menyusi */}
          {isPharmacy && partner?.isApproved && (
            <>
              <button
                type="button"
                onClick={() => goTab("dashboard")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "dashboard"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTab("orders")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "orders"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package size={16} />
                  <span>Buyurtmalar</span>
                </div>
                {pendingOrdersCount > 0 && (
                  <span className="rounded-full bg-black/10 text-[#1D1D1F] px-1.5 py-0.2 text-[10px] font-mono font-medium">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => goTab("medicines")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "medicines"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Boxes size={16} />
                  <span>Ombor & Dorilar</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTab("debts")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "debts"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HandCoins size={16} />
                  <span>Qarz daftari</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTab("profile")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "profile"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Store size={16} />
                  <span>Sozlamalar</span>
                </div>
              </button>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    haptic("medium");
                    setShowAddMedModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white px-3 py-2 text-xs font-medium transition active:scale-95 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Dori qo&apos;shish</span>
                </button>
              </div>
            </>
          )}

          {/* Mutaxassis menyusi */}
          {!isPharmacy && partner?.isApproved && (
            <>
              <button
                type="button"
                onClick={() => goTab("dashboard")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "dashboard"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => goTab("calls")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "calls"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall size={16} />
                  <span>Chaqiruvlar</span>
                </div>
                {pendingCallsCount > 0 && (
                  <span className="rounded-full bg-black/10 text-[#1D1D1F] px-1.5 py-0.2 text-[10px] font-mono font-medium">
                    {pendingCallsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => goTab("profile")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === "profile"
                    ? "bg-[#1D1D1F] text-white font-semibold"
                    : "text-[#515154] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <UserCheck size={16} />
                  <span>Profil</span>
                </div>
              </button>
            </>
          )}
        </nav>

        {/* Sidebar pastki qismi: Profil almashuv, Tariflar, Chiqish */}
        <div className="p-3 border-t border-[#E5E5EA] space-y-1.5 bg-[#FBFBFD]">
          <button
            type="button"
            onClick={() => handleWebLogin(undefined, isPharmacy ? "specialist" : "pharmacy")}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium text-[#1D1D1F] bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition"
            title="Boshqa profilga o'tish"
          >
            <span className="truncate">
              {isPharmacy ? "Mutaxassis rejimi" : "Dorixona rejimi"}
            </span>
            <ChevronRight size={13} className="text-[#86868B] shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setShowTariffsModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E5E5EA] transition"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-[#1D1D1F]" />
              <span>Tariflar & Imkoniyatlar</span>
            </div>
            <span className="text-[9px] font-medium tracking-wide bg-black/10 text-[#1D1D1F] px-1.5 py-0.5 rounded-full">
              BETA
            </span>
          </button>

          {partner && webToken && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition"
            >
              <LogOut size={13} />
              <span>Tizimdan chiqish</span>
            </button>
          )}
        </div>
      </aside>

      {/* ASOSIY SAHIFA KONTENTI (Desktopda sidebar yonida) */}
      <div className="md:pl-60 flex flex-col min-h-screen pb-24 md:pb-12">
        {/* 1a. Mobil Header (Faqat mobil qurilmalar va Telegram Mini App uchun) */}
        {/* 1a. Mobil Header (Apple-style toza qora-oq header) */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E5EA] bg-white/90 backdrop-blur-md px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1D1D1F] text-white">
              {isPharmacy ? <Store size={14} /> : <UserCheck size={14} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-[#1D1D1F] truncate leading-tight">
                {partner ? partner.organization || partner.name : "Do'kon paneli"}
              </h1>
              <p className="text-[10px] text-[#86868B] truncate">
                {isPharmacy ? "Agro-Dorixona" : partner?.specialty || "Mutaxassis"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowTariffsModal(true)}
              className="flex items-center gap-1 rounded-full bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-[#E5E5EA] transition"
              title="Tariflar (BETA)"
            >
              <span>Tariflar</span>
              <span className="text-[9px] font-mono text-[#86868B]">BETA</span>
            </button>

            <button
              type="button"
              onClick={() => loadData(initData, webToken)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#1D1D1F] hover:bg-[#F5F5F7] active:scale-95 transition"
              title="Yangilash"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#1D1D1F]" : ""} />
            </button>

            {partner?.isApproved && (
              <button
                type="button"
                onClick={toggleBusy}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition border ${
                  isBusy
                    ? "bg-white text-[#1D1D1F] border-[#E5E5EA]"
                    : "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isBusy ? "bg-amber-500" : "bg-emerald-400"}`} />
                <span>{isBusy ? "Band" : "Faol"}</span>
              </button>
            )}
          </div>
        </header>

        {/* 1b. Desktop Header (Apple-style toza topbar) */}
        <header className="hidden md:flex sticky top-0 z-30 h-14 items-center justify-between border-b border-[#E5E5EA] bg-white/80 backdrop-blur-md px-8">
          <div>
            <h1 className="text-sm font-semibold text-[#1D1D1F]">
              {isPharmacy
                ? activeTab === "dashboard"
                  ? "Boshqaruv paneli"
                  : activeTab === "orders"
                  ? "Buyurtmalar"
                  : activeTab === "medicines"
                  ? "Ombor & Mahsulotlar"
                  : activeTab === "debts"
                  ? "Qarz daftari"
                  : "Sozlamalar"
                : activeTab === "dashboard"
                ? "Mutaxassis paneli"
                : activeTab === "calls"
                ? "Chaqiruvlar"
                : "Profil"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(initData, webToken)}
              className="flex items-center gap-1.5 rounded-full border border-[#E5E5EA] bg-white px-3 py-1.5 text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition active:scale-95"
              title="Yangilash"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-[#1D1D1F]" : "text-[#86868B]"} />
              <span>Yangilash</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTariffsModal(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] transition active:scale-95"
            >
              <Sparkles size={13} className="text-[#1D1D1F]" />
              <span>Tariflar</span>
              <span className="text-[9px] font-mono text-[#86868B]">BETA</span>
            </button>

            {partner?.isApproved && (
              <button
                type="button"
                onClick={toggleBusy}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 border ${
                  isBusy
                    ? "bg-white text-[#1D1D1F] border-[#E5E5EA] hover:bg-[#F5F5F7]"
                    : "bg-[#1D1D1F] text-white border-[#1D1D1F] hover:bg-black"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isBusy ? "bg-amber-500" : "bg-emerald-400"}`} />
                <span>{isBusy ? "Band" : "Faol"}</span>
              </button>
            )}

            {partner && webToken && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition"
              >
                <LogOut size={13} />
                <span>Chiqish</span>
              </button>
            )}
          </div>
        </header>

      {error && (
        <div className="mx-4 mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}



      {/* 2. Agar Foydalanuvchi Arizasi Kutilayotgan Bo'lsa (Pending Approval) */}
      {partner && !partner.isApproved && (
        <div className="mx-4 mt-4 space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center shadow-xs">
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
          {/* Navigatsiya Tablari (Mutaxassis - Faqat Mobil) */}
          {!isPharmacy && (
            <div className="px-4 md:hidden">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-200/80 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => goTab("dashboard")}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 transition ${
                    activeTab === "dashboard" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  <LayoutDashboard size={15} />
                  <span>Asosiy</span>
                </button>
                <button
                  type="button"
                  onClick={() => goTab("calls")}
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
                  onClick={() => goTab("profile")}
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

          {/* 3.1a. MUTAXASSIS: ASOSIY TAHLIL (DASHBOARD) */}
          {!isPharmacy && activeTab === "dashboard" && (
            <SpecialistDashboard
              partner={partner}
              calls={calls}
              isBusy={isBusy}
              onToggleBusy={toggleBusy}
              onGoCalls={(f) => {
                haptic("light");
                setCallStatusFilter(f ?? "all");
                goTab("calls");
              }}
              onCallAction={handleCallAction}
              actionBusyId={actionBusyId}
            />
          )}

          {/* 3.1. MUTAXASSIS: CHAQIRUVLAR TABI */}
          {!isPharmacy && activeTab === "calls" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
              {/* Filter tugmalari */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
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
                    className={`shrink-0 rounded-xl px-3.5 py-2 transition border ${
                      callStatusFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs font-black"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredCalls.length === 0 && !loading && (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-400">
                  <PhoneCall size={40} className="mx-auto mb-3 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Chaqiruvlar yo&apos;q</p>
                  <p className="text-xs text-zinc-500 mt-1">Fermerlar yordam so&apos;raganda chaqiruv shu yerda paydo bo&apos;ladi</p>
                </div>
              )}

              {/* Chaqiruv kartochkalari — Desktopda 2 ustunli responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div key={c.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm transition space-y-3.5">
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
                        <span className="text-sm font-extrabold text-zinc-900 truncate">{c.customerName}</span>

                        {c.customerPhone && (
                          <a
                            href={`tel:${c.customerPhone}`}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-bold active:scale-95 transition shrink-0"
                          >
                            <Phone size={13} />
                            <span>{c.customerPhone}</span>
                          </a>
                        )}
                      </div>

                      {/* Muammo tavsifi */}
                      <p className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-100 p-2.5 rounded-xl font-medium">
                        {c.problem}
                      </p>

                      {/* Manzil va Xarita */}
                      {c.address && (
                        <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                          <span className="truncate">{c.address}</span>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 flex items-center gap-1 text-blue-600 font-bold hover:underline"
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
              onOpenDebts={() => {
                haptic("light");
                goTab("debts");
              }}
            />
          )}

          {/* 3.2b. DORIXONA: QARZ DAFTARI (NASIYA & TA'MINOTCHI) */}
          {isPharmacy && activeTab === "debts" && (
            <QarzDaftariSection />
          )}

          {/* 3.2. DORIXONA: BRONLAR & BUYURTMALAR TABI */}
          {isPharmacy && activeTab === "orders" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
              {/* Filter tugmalari */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
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
                    className={`shrink-0 rounded-xl px-3.5 py-2 transition border ${
                      orderStatusFilter === flt.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs font-black"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              {filteredOrders.length === 0 && !loading && (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-400">
                  <Package size={40} className="mx-auto mb-3 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Bronlar yo&apos;q</p>
                  <p className="text-xs text-zinc-500 mt-1">Mijoz dori bron qilganda shu yerda paydo bo&apos;ladi</p>
                </div>
              )}

              {/* Bron kartochkasi — Responsive 2-ustunli grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div key={ord.id} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm transition space-y-3.5">
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
            </div>
          )}

          {/* 3.3. DORIXONA: DORILAR KATALOGI (Bor/Yo'q 1-tap boshqaruvi) */}
          {isPharmacy && activeTab === "medicines" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
              {/* Qidiruv va Tezkor Qo'shish */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Dori nomi yoki qo‘llanilishi bo'yicha qidiruv..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="w-full rounded-2xl bg-white pl-10 pr-4 py-3 text-xs sm:text-sm text-zinc-900 border border-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#1b1464] hover:bg-[#150f50] px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-xs active:scale-95 transition shrink-0"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Yangi dori qo&apos;shish</span>
                </button>
              </div>

              {/* Qoldiq holati va tur bo'yicha filterlar */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                <div className="flex gap-1.5 overflow-x-auto text-[11px] font-bold scrollbar-none w-full sm:w-auto pb-1 sm:pb-0">
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
                        stockFilter === flt.id ? `${flt.active} shadow-xs font-black` : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5 overflow-x-auto text-[11px] font-bold scrollbar-none shrink-0">
                  {[
                    { id: "all", label: "Barcha turlar" },
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
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-xs font-black"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      {flt.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMeds.length === 0 && !loading && (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-400">
                  <Store size={40} className="mx-auto mb-3 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Dorilar topilmadi</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring yoki &quot;Yangi dori qo&apos;shish&quot; tugmasi orqali omborga kiritishni boshlang.
                  </p>
                </div>
              )}

              {/* Dorilar ro'yxati: 3-ustunli Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeds.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs hover:border-zinc-300 hover:shadow-md transition flex flex-col justify-between gap-3.5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {m.photoData ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-zinc-200 shrink-0 shadow-2xs p-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={m.photoData} alt={m.name} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-2xl shrink-0">
                              {m.type === "crop" ? "🌾" : m.type === "animal" ? "🐾" : "💊"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-zinc-900 text-xs sm:text-sm truncate group-hover:text-emerald-700 transition">
                              {m.name}
                            </h4>
                            <span className="inline-block mt-1 rounded-md bg-zinc-100 text-zinc-600 px-2 py-0.5 text-[9px] font-mono">
                              {m.type === "crop" ? "Ekin dorisi" : m.type === "animal" ? "Veterinariya" : "Umumiy vosita"}
                            </span>
                          </div>
                        </div>

                        {/* O'chirish tugmasi */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMedicine(m.id)}
                          className="rounded-xl p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                          title="Dorini o'chirish"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {m.usage && (
                        <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed bg-zinc-50/70 p-2.5 rounded-2xl border border-zinc-100">
                          {m.usage}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-zinc-400 font-medium">Sotuv narxi:</span>
                        <span className="font-mono font-black text-sm text-emerald-800">
                          {m.price ? `${m.price.toLocaleString()} so'm` : "Kelishuv asosida"}
                        </span>
                      </div>

                      {/* Qoldiq hisoblagichi va Bor/Yo'q switch */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-xl p-0.5">
                          <button
                            type="button"
                            onClick={() => handleStockChange(m.id, -1)}
                            disabled={m.stock <= 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-700 active:scale-90 transition disabled:opacity-40 shadow-2xs"
                            aria-label="Qoldiqni kamaytirish"
                          >
                            <Minus size={13} />
                          </button>
                          <span
                            className={`min-w-[56px] text-center px-1.5 py-0.5 text-[11px] font-mono font-black ${
                              m.stock <= 0
                                ? "text-red-600"
                                : m.stock <= LOW_STOCK_THRESHOLD
                                ? "text-amber-700"
                                : "text-zinc-800"
                            }`}
                          >
                            {m.stock} {m.stockUnit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockChange(m.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white active:scale-90 transition shadow-2xs"
                            aria-label="Qoldiqni oshirish"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleMedicineStatus(m.id, m.status)}
                          className={`flex-1 rounded-xl py-2 px-2 text-xs font-black border transition active:scale-95 shadow-2xs text-center ${
                            m.status === "bor"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                          }`}
                          title={m.status === "bor" ? "Bosing: Yo'q qilish" : "Bosing: Bor qilish"}
                        >
                          {m.status === "bor" ? "🟢 Sotuvda bor" : "🔴 Tugagan"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3.4. PROFILIM TABI (Barcha ma'lumotlar, tajriba, xizmatlar va huquqiy guvohnoma) */}
          {activeTab === "profile" && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
              {/* Profil Asosiy Kartasi */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b1464] text-white font-black text-2xl shadow-xs">
                    {isPharmacy ? "🏪" : partner.specialty?.toLowerCase().includes("vet") ? "🐾" : "🌾"}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-zinc-900">{partner.name}</h3>
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
                  <h4 className="text-xs font-semibold text-[#1D1D1F]">Texnik qo&apos;llab-quvvatlash</h4>
                  <p className="text-[11px] text-[#86868B]">Savollar va yordam bo&apos;yicha</p>
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

      {/* 3.5. DORIXONA: PASTKI NAVIGATSIYA (Faqat Mobil) */}
      {isPharmacy && partner?.isApproved && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
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
                      className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#1D1D1F] text-white shadow-md active:scale-90 transition"
                      aria-label="Dori qo'shish"
                    >
                      <Plus size={20} strokeWidth={2.2} />
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
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition active:scale-95 ${
                    active ? "text-[#1D1D1F]" : "text-[#86868B]"
                  }`}
                >
                  <span className="flex h-7 w-10 items-center justify-center">
                    <Icon size={18} strokeWidth={active ? 2.3 : 1.8} />
                  </span>
                  <span>{label}</span>
                  {badge > 0 && (
                    <span className="absolute top-0 right-2 min-w-[16px] rounded-full px-1 text-[9px] leading-[16px] text-white font-mono bg-[#1D1D1F]">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* 3.6. MUTAXASSIS: PASTKI NAVIGATSIYA (Faqat Mobil) */}
      {!isPharmacy && partner?.isApproved && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#E5E5EA] bg-white/95 backdrop-blur-md shadow-xs"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-md grid grid-cols-3 items-end px-4 pt-1.5 pb-1.5">
            {[
              { id: "dashboard", label: "Asosiy", Icon: LayoutDashboard, badge: 0, badgeCls: "" },
              { id: "calls", label: "Chaqiruvlar", Icon: PhoneCall, badge: pendingCallsCount, badgeCls: "" },
              { id: "profile", label: "Profil", Icon: UserCheck, badge: 0, badgeCls: "" },
            ].map(({ id, label, Icon, badge }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goTab(id)}
                  className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition active:scale-95 ${
                    active ? "text-[#1D1D1F]" : "text-[#86868B]"
                  }`}
                >
                  <span className="flex h-8 w-12 items-center justify-center">
                    <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
                  </span>
                  <span>{label}</span>
                  {badge > 0 && (
                    <span className="absolute top-0.5 right-6 min-w-[17px] rounded-full px-1 text-[9px] leading-[17px] text-white font-mono bg-[#1D1D1F]">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
      </div>

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

      {/* Tariflar Modali (Hamkorlar uchun) */}
      {showTariffsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl my-auto bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowTariffsModal(false)}
              className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition"
              title="Yopish"
            >
              <X size={18} />
            </button>
            <TariffsBlock onSelectPlan={() => setShowTariffsModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
