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
  ShoppingCart,
  Edit3,
  Download,
  Calendar,
  Banknote,
  CreditCard,
} from "lucide-react";
import { haptic } from "@/lib/telegram";
import { isNativeApp } from "@/lib/capacitor";
import Link from "next/link";
import PharmacyDashboard, { LOW_STOCK_THRESHOLD } from "./PharmacyDashboard";
import SpecialistDashboard from "./SpecialistDashboard";
import AgrozBusinessLogo from "@/components/AgrozBusinessLogo";
import { TariffsBlock } from "@/components/BusinessLanding";
import QarzDaftariSection, { recordPosCreditDebt } from "@/components/QarzDaftariSection";

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

/** Mahsulot qoldiq holati: qoralama → tugagan → kam qolgan → yetarli */
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

/** O'zbekiston telefon raqamini avtomatik +998 XX XXX XX XX formatlash */
function formatUzbekPhone(val: string): string {
  let digits = val.replace(/\D/g, "");
  if (digits.startsWith("998")) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (!digits) return "+998 ";

  let res = "+998 ";
  if (digits.length <= 2) {
    res += digits;
  } else if (digits.length <= 5) {
    res += `${digits.slice(0, 2)} ${digits.slice(2)}`;
  } else if (digits.length <= 7) {
    res += `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  } else {
    res += `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  return res;
}

function transliterateToLogin(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts",
    ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya", ў: "o", ғ: "g", ҳ: "h", қ: "q",
    "o'": "o", "o`": "o", "oʻ": "o", "oʼ": "o",
    "g'": "g", "g`": "g", "gʻ": "g", "gʼ": "g",
  };
  let res = (text || "").toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    res = res.replaceAll(k, v);
  }
  return res
    .replace(/['`ʻʼ]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
}

function generateDefaultPassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const num = Math.floor(100 + Math.random() * 900);
  const letter = letters[Math.floor(Math.random() * letters.length)];
  return `Agro${letter}${num}!`;
}

type PartnerProfile = {
  id: number;
  name: string;
  login?: string | null;
  role: "pharmacy" | "specialist" | "both";
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
  contractAcceptedAt?: string | null;
  trialEndsAt?: string | null;
  daysLeft?: number;
  subscriptionStatus?: "trial" | "active" | "expired";
  isTelegramLinked?: boolean;
  botUsername?: string;
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
  conclusion?: string | null;
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
  batchNo?: string | null;
  expiryDate?: string | null;
};

export default function PartnerKabinetPage() {
  const [initData, setInitData] = useState<string>("");
  const [webToken, setWebToken] = useState<string>("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState<"otp" | "password">("otp");
  const [rememberMe, setRememberMe] = useState(true);

  // Qurilmani eslab qolish (Remembered Partner / Device)
  const [rememberedPartner, setRememberedPartner] = useState<{
    login: string;
    name: string;
    organization?: string | null;
    role: string;
    phone: string;
  } | null>(null);

  // Telegram Bot orqali tasdiqlash holatlari
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loginToken, setLoginToken] = useState("");
  const [botUsername, setBotUsername] = useState("agroz_auth_bot");
  const [botStartUrl, setBotStartUrl] = useState("");
  const [telegramLinkRequired, setTelegramLinkRequired] = useState(false);
  const checkLoginTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // To'liq ro'yxatdan o'tish modali (yangi hamkorlar uchun)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regRole, setRegRole] = useState<"pharmacy" | "specialist" | "both">("pharmacy");
  const [regSpecialty, setRegSpecialty] = useState("Agro-do'kon");
  const [regName, setRegName] = useState("");
  const [regOrganization, setRegOrganization] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regLoginIsManual, setRegLoginIsManual] = useState(false);
  const [regPassword, setRegPassword] = useState(generateDefaultPassword);
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regShowPassword, setRegShowPassword] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [regEducation, setRegEducation] = useState("");
  const [regRegion, setRegRegion] = useState("Toshkent viloyati");
  const [regDistrict, setRegDistrict] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regPhone, setRegPhone] = useState("+998 ");
  const [regWorkHours, setRegWorkHours] = useState("08:00 - 19:00");
  const [regExperienceYears, setRegExperienceYears] = useState("3");
  const [regBio, setRegBio] = useState("");
  const [regHelpsWith, setRegHelpsWith] = useState<"crop" | "animal" | "both">("both");
  const [regContractAccepted, setRegContractAccepted] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState<{
    token: string;
    sessionToken: string;
    startUrl: string;
    botUsername: string;
    phone: string;
    name: string;
    role?: string;
    login?: string;
    trialEndsAt: string;
  } | null>(null);
  const [regNotice, setRegNotice] = useState<string | null>(null);
  const [roleSwitching, setRoleSwitching] = useState(false);

  // Rasmiy xizmat ko'rsatish shartnomasi modali
  const [showContractModal, setShowContractModal] = useState(false);

  // Parolni yangilash (Telegram orqali tasdiqlash) holatlari
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetCountdown, setResetCountdown] = useState(0);

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

  // Tablar: Default "dashboard"
  const [activeTab, setActiveTab] = useState<string>("dashboard");

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

  // Yangi mahsulot qo'shish / tahrirlash modali
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [newMedName, setNewMedName] = useState("");
  const [newMedType, setNewMedType] = useState<"crop" | "animal" | "general">("crop");
  const [newMedPrice, setNewMedPrice] = useState("");
  const [newMedStock, setNewMedStock] = useState("10");
  const [newMedUnit, setNewMedUnit] = useState("dona");
  const [newMedUsage, setNewMedUsage] = useState("");
  const [newMedBatchNo, setNewMedBatchNo] = useState("");
  const [newMedExpiryDate, setNewMedExpiryDate] = useState("");
  const [newMedPhoto, setNewMedPhoto] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [savingMed, setSavingMed] = useState(false);

  // Tezkor Kassa (POS Sotuv) modali
  const [showPosModal, setShowPosModal] = useState(false);
  const [posMedId, setPosMedId] = useState<number | "">("");
  const [posQty, setPosQty] = useState("1");
  const [posPaymentMethod, setPosPaymentMethod] = useState<"naqd" | "karta" | "nasiya">("naqd");
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posSaving, setPosSaving] = useState(false);

  // Mutaxassis ko'rik xulosasi modali
  const [completeCallModal, setCompleteCallModal] = useState<PartnerCall | null>(null);
  const [callConclusion, setCallConclusion] = useState("");

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
      const loginFromUrl = urlParams.get("login");

      if (tokenFromUrl) {
        setWebToken(tokenFromUrl);
        localStorage.setItem("agroz_business_token", tokenFromUrl);
        loadData("", tokenFromUrl);
      } else if (phoneFromUrl) {
        handleWebLogin(phoneFromUrl);
      } else if (loginFromUrl) {
        setLoginPhone(loginFromUrl.replace(/^@/, ""));
        setAuthTab("password");
        setShowLoginModal(true);
        setLoading(false);
      } else {
        const stored = localStorage.getItem("agroz_business_token");
        if (stored) {
          setWebToken(stored);
          loadData("", stored);
        } else {
          setLoading(false);
          try {
            const remStr = localStorage.getItem("agroz_remembered_partner");
            if (remStr) {
              const rem = JSON.parse(remStr);
              if (rem && (rem.login || rem.phone)) {
                setRememberedPartner(rem);
                setLoginPhone(rem.login || rem.phone);
                setAuthTab("password");
              }
            }
          } catch {}
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

  // Ro'yxatdan o'tishda do'kon yoki hamkor nomiga qarab unikal login tavsiya qilish
  useEffect(() => {
    if (regLoginIsManual) return;
    const combined = [regOrganization.trim(), regName.trim()].filter(Boolean).join(" ");
    if (!combined || combined.length < 2) return;

    // Real-vaqtda darhol transliteratsiya qilib beramiz
    const localSlug = transliterateToLogin(combined);
    if (localSlug) {
      setRegLogin(localSlug);
    }

    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    suggestTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/api/bot/partner/suggest-login?name=${encodeURIComponent(regName.trim())}&org=${encodeURIComponent(regOrganization.trim())}`
        );
        const data = await res.json();
        if (data?.ok && data.login) {
          setRegLogin(data.login);
        }
      } catch {}
    }, 400);
    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    };
  }, [regOrganization, regName, regLoginIsManual]);

  // OTP Taymeri
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Parol yangilash taymeri
  useEffect(() => {
    if (resetCountdown <= 0) return;
    const timer = setInterval(() => {
      setResetCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCountdown]);

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

        // Qurilmani eslab qolish
        try {
          localStorage.setItem(
            "agroz_remembered_partner",
            JSON.stringify({
              login: p.login || p.phone,
              name: p.name,
              organization: p.organization,
              role: p.role,
              phone: p.phone,
            })
          );
        } catch {}

        // Default tabni belgilash
        if (p.role === "pharmacy") {
          setActiveTab((prev) => (prev === "calls" ? "dashboard" : prev));
        } else if (p.role === "specialist") {
          setActiveTab((prev) => (prev === "orders" || prev === "medicines" ? "dashboard" : prev));
        }

        // Agar tasdiqlanmagan bo'lsa
        if (!p.isApproved) {
          setLoading(false);
          return;
        }

        // 2. Rolga qarab ma'lumotlarni yuklash (Do'kon yoki Ikkala rejim bo'lsa)
        if (p.role === "pharmacy" || p.role === "both") {
          const [ordersRes, medsRes] = await Promise.allSettled([
            apiFetch(`/api/bot/partner/orders`, { headers }),
            apiFetch(`/api/bot/partner/medicines`, { headers }),
          ]);

          let loadedOrders: PartnerOrder[] = [];
          if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
            const d = await ordersRes.value.json();
            if (d?.ok && Array.isArray(d.orders)) {
              loadedOrders = d.orders;
            }
          }
          try {
            const localPosOrders = JSON.parse(localStorage.getItem(`agroz_pos_orders_${p.id}`) || "[]");
            if (Array.isArray(localPosOrders) && localPosOrders.length > 0) {
              const existingIds = new Set(loadedOrders.map((o) => o.id));
              loadedOrders = [...localPosOrders.filter((o: PartnerOrder) => !existingIds.has(o.id)), ...loadedOrders];
            }
          } catch {
            // ignore
          }
          setOrders(loadedOrders);

          if (medsRes.status === "fulfilled" && medsRes.value.ok) {
            const d = await medsRes.value.json();
            if (d?.ok && Array.isArray(d.medicines)) {
              let metaMap: Record<string, { batchNo?: string | null; expiryDate?: string | null }> = {};
              try {
                metaMap = JSON.parse(localStorage.getItem(`agroz_med_meta_${p.id}`) || "{}");
              } catch {
                metaMap = {};
              }
              setMedicines(
                d.medicines.map((m: PartnerMedicine) => ({
                  ...m,
                  batchNo: m.batchNo || metaMap[String(m.id)]?.batchNo || null,
                  expiryDate: m.expiryDate || metaMap[String(m.id)]?.expiryDate || null,
                }))
              );
            }
          }
        }

        // Mutaxassis yoki Ikkala rejim bo'lsa Chaqiruvlarni yuklash
        if (p.role === "specialist" || p.role === "both") {
          const callsRes = await apiFetch(`/api/bot/partner/calls`, { headers });
          if (callsRes.ok) {
            const d = await callsRes.json();
            if (d?.ok && Array.isArray(d.calls)) {
              let conclusionMap: Record<string, string> = {};
              try {
                conclusionMap = JSON.parse(localStorage.getItem(`agroz_call_conclusions_${p.id}`) || "{}");
              } catch {
                conclusionMap = {};
              }
              setCalls(
                d.calls.map((c: PartnerCall) => ({
                  ...c,
                  conclusion: c.conclusion || conclusionMap[String(c.id)] || null,
                }))
              );
            }
          }
        }
      } else {
        if (token && !tgData) {
          localStorage.removeItem("agroz_business_token");
          setWebToken("");
          try {
            const remStr = localStorage.getItem("agroz_remembered_partner");
            if (remStr) {
              const rem = JSON.parse(remStr);
              if (rem && (rem.login || rem.phone)) {
                setRememberedPartner(rem);
                setLoginPhone(rem.login || rem.phone);
                setAuthTab("password");
              }
            }
          } catch {}
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
        if (partner.role === "pharmacy" || partner.role === "both") {
          const res = await apiFetch(`/api/bot/partner/orders`, { headers });
          if (res.ok) {
            const d = await res.json();
            if (d?.ok && Array.isArray(d.orders)) {
              let localPosOrders: PartnerOrder[] = [];
              try {
                localPosOrders = JSON.parse(localStorage.getItem(`agroz_pos_orders_${partner.id}`) || "[]");
              } catch {
                localPosOrders = [];
              }
              const existingIds = new Set(d.orders.map((o: PartnerOrder) => o.id));
              setOrders([
                ...localPosOrders.filter((o) => !existingIds.has(o.id)),
                ...d.orders,
              ]);
            }
          }
        }
        if (partner.role === "specialist" || partner.role === "both") {
          const res = await apiFetch(`/api/bot/partner/calls`, { headers });
          if (res.ok) {
            const d = await res.json();
            if (d?.ok && Array.isArray(d.calls)) {
              let conclusionMap: Record<string, string> = {};
              try {
                conclusionMap = JSON.parse(localStorage.getItem(`agroz_call_conclusions_${partner.id}`) || "{}");
              } catch {
                conclusionMap = {};
              }
              setCalls(
                d.calls.map((c: PartnerCall) => ({
                  ...c,
                  conclusion: c.conclusion || conclusionMap[String(c.id)] || null,
                }))
              );
            }
          }
        }
      } catch {
        // silent
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [partner, initData, webToken]);

  // Telegram bot orqali tasdiqlash kodini so'rash
  async function handleRequestTelegramOtp() {
    setLoginError(null);
    const cleanPhone = loginPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setLoginError("Iltimos, to'liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }

    setOtpLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/request-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (data?.ok) {
        setOtpSent(true);
        setOtpCountdown(60);
        setLoginToken(data.token || "");
        if (data.botUsername) setBotUsername(data.botUsername);
        if (data.botStartUrl) setBotStartUrl(data.botStartUrl);
        setTelegramLinkRequired(data.method === "telegram_link_required");

        // Telegram botda "Tasdiqlash" tugmasi bosilganini orqa fonda har 2.5 sekundda avtomatik tekshirish
        if (checkLoginTimerRef.current) clearInterval(checkLoginTimerRef.current);
        checkLoginTimerRef.current = setInterval(async () => {
          if (!data.token) return;
          try {
            const pollRes = await apiFetch(`/api/bot/partner/check-login-otp?token=${encodeURIComponent(data.token)}`);
            const pollData = await pollRes.json();
            if (pollData?.ok && pollData.verified && pollData.token) {
              if (checkLoginTimerRef.current) {
                clearInterval(checkLoginTimerRef.current);
                checkLoginTimerRef.current = null;
              }
              setWebToken(pollData.token);
              if (rememberMe) {
                localStorage.setItem("agroz_business_token", pollData.token);
                try {
                  localStorage.setItem(
                    "agroz_remembered_partner",
                    JSON.stringify({
                      login: pollData.login || pollData.phone,
                      name: pollData.name,
                      organization: pollData.organization,
                      role: pollData.role,
                      phone: pollData.phone,
                    })
                  );
                } catch {}
              }
              await loadData(initData, pollData.token);
            }
          } catch {
            // ignore
          }
        }, 2500);
      } else {
        if (data?.notRegistered) {
          setShowLoginModal(false);
          setShowRegisterModal(true);
          const ph = data.phone || cleanPhone;
          const formatted = ph.startsWith("+") ? ph : "+" + ph;
          setRegPhone(formatted);
          if (data.userName) {
            setRegName(data.userName);
            const translit = transliterateToLogin(data.userName);
            if (translit) setRegLogin(translit);
          }
          setRegNotice(
            data.isExistingUser
              ? `Xush kelibsiz! Siz tizimda mavjudsiz. Biznes kabinetingizni faollashtirish uchun 1 daqiqada ariza topshiring!`
              : (data.error || "Ushbu raqam bilan biznes profil topilmadi. 1 daqiqada ro'yxatdan o'ting!")
          );
        } else {
          setLoginError(data?.error || "Kodni yuborishda xatolik yuz berdi");
        }
      }
    } catch {
      setLoginError("Server bilan aloqa uzildi. Internet aloqasini tekshiring.");
    } finally {
      setOtpLoading(false);
    }
  }

  // Telegram botga yuborilgan 6 xonali kod bilan tasdiqlash
  async function handleVerifyTelegramOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoginError(null);
    const cleanPhone = loginPhone.replace(/\D/g, "");

    if (!otpCode || otpCode.trim().length < 4) {
      setLoginError("Iltimos, Telegram botga yuborilgan tasdiqlash kodini to'liq kiriting");
      return;
    }

    setLoginLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code: otpCode.trim(), token: loginToken }),
      });
      const data = await res.json();
      if (data?.ok && data.token) {
        if (checkLoginTimerRef.current) {
          clearInterval(checkLoginTimerRef.current);
          checkLoginTimerRef.current = null;
        }
        setWebToken(data.token);
        if (rememberMe) {
          localStorage.setItem("agroz_business_token", data.token);
          try {
            localStorage.setItem(
              "agroz_remembered_partner",
              JSON.stringify({
                login: data.login || data.phone || cleanPhone,
                name: data.name,
                organization: data.organization,
                role: data.role,
                phone: data.phone || cleanPhone,
              })
            );
          } catch {}
        }
        await loadData(initData, data.token);
        setShowLoginModal(false);
        return;
      } else {
        setLoginError(data?.error || "Tasdiqlash kodi noto'g'ri kiritildi");
      }
    } catch {
      setLoginError("Server bilan aloqa uzildi. Qayta urinib ko'ring.");
    } finally {
      setLoginLoading(false);
    }
  }

  // Parol bilan kirish (zaxira varianti)
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
      const digits = targetPhone.replace(/\D/g, "");
      const res = await apiFetch(`/api/bot/partner/web-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits.length >= 9 ? digits : targetPhone,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.token) {
        setWebToken(data.token);
        if (rememberMe) {
          localStorage.setItem("agroz_business_token", data.token);
          try {
            localStorage.setItem(
              "agroz_remembered_partner",
              JSON.stringify({
                login: data.login || targetPhone,
                name: data.name,
                organization: data.organization,
                role: data.role,
                phone: data.phone || targetPhone,
              })
            );
          } catch {}
        }
        await loadData(initData, data.token);
        setShowLoginModal(false);
        return;
      } else {
        if (data?.notRegistered) {
          setShowLoginModal(false);
          setShowRegisterModal(true);
          const ph = data.phone || (digits.length >= 9 ? "+" + digits : targetPhone);
          const formatted = ph.startsWith("+") ? ph : "+" + ph;
          setRegPhone(formatted);
          if (data.userName) {
            setRegName(data.userName);
            const translit = transliterateToLogin(data.userName);
            if (translit) setRegLogin(translit);
          }
          setRegNotice(
            data.isExistingUser
              ? `Xush kelibsiz! Siz tizimda mavjudsiz. Biznes kabinetingizni faollashtirish uchun 1 daqiqada ariza topshiring!`
              : (data.error || "Biznes profilingiz topilmadi. Ro'yxatdan o'tish orqali biznes kabinetingizni faollashtiring!")
          );
        } else {
          setLoginError(data?.error || "Login yoki parol noto‘g‘ri kiritildi");
        }
      }
    } catch {
      setLoginError("Server bilan aloqa uzildi. Internetni tekshiring.");
    } finally {
      setLoginLoading(false);
    }
  }

  // Telegram orqali parolni yangilash kodini so'rash
  async function handleRequestResetOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    const cleanPhone = resetPhone.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      setResetError("Iltimos, to'liq telefon raqamingizni kiriting (+998 XX XXX XX XX)");
      return;
    }

    setResetLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/request-reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (data?.ok) {
        setResetStep("verify");
        setResetCountdown(60);
        setResetSuccess(data.message || "Tasdiqlash kodi Telegram botingizga yuborildi");
      } else {
        setResetError(data?.error || "Kodni yuborishda xatolik yuz berdi");
      }
    } catch {
      setResetError("Server bilan aloqa uzildi. Internet aloqasini tekshiring.");
    } finally {
      setResetLoading(false);
    }
  }

  // Telegram kodi va yangi parolni yuborib parolni bazada yangilash
  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanPhone = resetPhone.replace(/\D/g, "");
    if (!resetCode.trim() || resetCode.trim().length < 4) {
      setResetError("Iltimos, Telegram botga yuborilgan 6 xonali tasdiqlash kodini kiriting");
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 8) {
      setResetError("Yangi parol xavfsizlik uchun kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(resetNewPassword)) {
      setResetError("Parolda kamida bitta harf va bitta raqam bo'lishi shart");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Yangi parollar mos kelmadi");
      return;
    }

    setResetLoading(true);
    try {
      const res = await apiFetch("/api/bot/partner/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code: resetCode.trim(),
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.token) {
        setResetSuccess("Parolingiz muvaffaqiyatli yangilandi va bazada saqlandi!");
        setWebToken(data.token);
        if (rememberMe) {
          localStorage.setItem("agroz_business_token", data.token);
          try {
            if (data.partner) {
              localStorage.setItem(
                "agroz_remembered_partner",
                JSON.stringify({
                  login: data.partner.login || cleanPhone,
                  name: data.partner.name,
                  organization: data.partner.organization,
                  role: data.partner.role,
                  phone: data.partner.phone || cleanPhone,
                })
              );
            }
          } catch {}
        }
        setTimeout(async () => {
          setShowResetPasswordModal(false);
          setResetStep("request");
          setResetCode("");
          setResetNewPassword("");
          setResetConfirmPassword("");
          await loadData(initData, data.token);
        }, 800);
      } else {
        setResetError(data?.error || "Parolni yangilashda xatolik yuz berdi");
      }
    } catch {
      setResetError("Server bilan aloqa uzildi. Qayta urinib ko'ring.");
    } finally {
      setResetLoading(false);
    }
  }

  // Yangi hamkor to'liq arizasi va shartnomani topshirish
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);

    if (!regContractAccepted) {
      alert("Iltimos, xizmat ko'rsatish shartnomasi va 1 oylik sinov shartlarini qabul qiling.");
      return;
    }

    const cleanP = regPhone.trim();
    if (!cleanP || cleanP.replace(/\D/g, "").length < 9) {
      alert("Iltimos, to'liq telefon raqamingizni kiriting");
      return;
    }

    if (regRole !== "specialist" && !regOrganization.trim()) {
      alert("Iltimos, do'kon yoki dorixona nomini kiriting");
      return;
    }

    if (!regPassword || regPassword.length < 8) {
      alert("Parol xavfsizlik uchun kamida 8 ta belgidan iborat bo'lishi kerak");
      return;
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(regPassword)) {
      alert("Parolda kamida bitta harf va bitta raqam bo'lishi shart");
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await apiFetch("/api/bot/partner/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          phone: cleanP,
          role: regRole,
          specialty: regSpecialty,
          organization: regOrganization.trim() || regName.trim(),
          login: regLogin.trim(),
          password: regPassword.trim(),
          education: regEducation.trim(),
          region: regRegion,
          district: regDistrict.trim(),
          address: regAddress.trim(),
          workHours: regWorkHours,
          experienceYears: Number(regExperienceYears) || 1,
          bio: regBio.trim(),
          helpsWith: regHelpsWith,
          contractAccepted: true,
        }),
      });
      const data = await res.json();
      if (data?.ok) {
        setRegSuccess(data);
        if (data.sessionToken) {
          setWebToken(data.sessionToken);
          localStorage.setItem("agroz_business_token", data.sessionToken);
          try {
            localStorage.setItem(
              "agroz_remembered_partner",
              JSON.stringify({
                login: data.login || cleanP,
                name: data.name,
                organization: data.organization,
                role: data.role || regRole,
                phone: data.phone || cleanP,
              })
            );
          } catch {}
        }
      } else {
        alert(data?.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan aloqa uzildi. Internetni tekshiring.");
    } finally {
      setRegSubmitting(false);
    }
  }

  // Tezkor almashtirish (Demo yoki ro'yxatdan tanlash)
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

    setLoginError("Iltimos, telefon raqamingizni to‘liq kiriting va Telegram orqali tasdiqlang");
    setLoginLoading(false);
    setSelectedPartnerId(null);
  }

  function handleLogout() {
    if (checkLoginTimerRef.current) {
      clearInterval(checkLoginTimerRef.current);
      checkLoginTimerRef.current = null;
    }
    localStorage.removeItem("agroz_business_token");
    setWebToken("");
    setPartner(null);
    setOrders([]);
    setMedicines([]);
    setCalls([]);
    setOtpSent(false);
    setOtpCode("");
  }

  // Hamkor faoliyat rolini o'zgartirish (Do'kon, Mutaxassis yoki Ikkalasi)
  async function handleSwitchRole(nextRole: "pharmacy" | "specialist" | "both") {
    if (!partner || roleSwitching) return;
    setRoleSwitching(true);
    try {
      const headers = getHeaders();
      const res = await apiFetch(`/api/bot/partner/profile`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (data?.ok && data.partner) {
        setPartner((prev) => (prev ? { ...prev, role: data.partner.role } : null));
        setActiveTab("dashboard");
        await loadData(initData, webToken);
      } else {
        alert(data?.error || "Rolni o'zgartirishda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan aloqa uzildi");
    } finally {
      setRoleSwitching(false);
    }
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

  // Chaqiruv amali (Qabul qilish / Rad etish / Yakunlash + Ko'rik xulosasi)
  async function handleCallAction(callId: number, action: "accept" | "reject" | "done", conclusionText?: string) {
    haptic("medium");
    setActionBusyId(callId);
    const cleanConclusion = conclusionText?.trim() || undefined;

    if (cleanConclusion && partner?.id) {
      try {
        const key = `agroz_call_conclusions_${partner.id}`;
        const prevMap = JSON.parse(localStorage.getItem(key) || "{}");
        prevMap[String(callId)] = cleanConclusion;
        localStorage.setItem(key, JSON.stringify(prevMap));
      } catch {
        // ignore
      }
    }

    try {
      const res = await apiFetch(`/api/bot/partner/calls/${callId}/action`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ action, conclusion: cleanConclusion }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        setCalls((prev) =>
          prev.map((c) =>
            c.id === callId
              ? { ...c, status: data.status, conclusion: cleanConclusion || c.conclusion }
              : c
          )
        );
        haptic("medium");
      } else {
        const fallbackStatus =
          action === "accept" ? "qabul_qilindi" : action === "done" ? "bajarildi" : "rad_etildi";
        setCalls((prev) =>
          prev.map((c) =>
            c.id === callId
              ? { ...c, status: fallbackStatus, conclusion: cleanConclusion || c.conclusion }
              : c
          )
        );
      }
    } catch {
      const fallbackStatus =
        action === "accept" ? "qabul_qilindi" : action === "done" ? "bajarildi" : "rad_etildi";
      setCalls((prev) =>
        prev.map((c) =>
          c.id === callId
            ? { ...c, status: fallbackStatus, conclusion: cleanConclusion || c.conclusion }
            : c
        )
      );
    } finally {
      setActionBusyId(null);
      setCompleteCallModal(null);
      setCallConclusion("");
    }
  }

  // Bron amali (Tasdiqlash / Bekor / Tayyor / Yetkazildi + Avto-qoldiq kamayishi)
  async function handleOrderAction(orderId: number, action: "confirm" | "cancel" | "ready" | "done") {
    haptic("medium");
    setActionBusyId(orderId);
    const targetOrder = orders.find((o) => o.id === orderId);

    const deductOrderStock = (order?: PartnerOrder) => {
      if (!order || action !== "done" || order.status === "yetkazildi") return;
      setMedicines((prevMeds) => {
        const nextMeds = prevMeds.map((m) => {
          const matchedItem = order.items.find(
            (it) => it.id === m.id || it.name.trim().toLowerCase() === m.name.trim().toLowerCase()
          );
          if (!matchedItem) return m;
          const nextStock = Math.max(0, m.stock - (Number(matchedItem.qty) || 1));
          const nextStatus: "bor" | "yoq" | "qoralama" =
            nextStock <= 0 ? "yoq" : m.status === "yoq" ? "bor" : m.status;
          apiFetch(`/api/bot/partner/medicines/${m.id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify({ stock: nextStock, status: nextStatus }),
          }).catch(() => {});
          return { ...m, stock: nextStock, status: nextStatus };
        });
        if (partner?.id) {
          try {
            localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(nextMeds));
          } catch {
            // ignore
          }
        }
        return nextMeds;
      });
    };

    try {
      const res = await apiFetch(`/api/bot/partner/orders/${orderId}/action`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data?.ok && data.status) {
        deductOrderStock(targetOrder);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o))
        );
        haptic("medium");
      } else {
        const fallbackStatus =
          action === "confirm"
            ? "tasdiqlandi"
            : action === "ready"
            ? "tayyor"
            : action === "done"
            ? "yetkazildi"
            : "bekor_qilindi";
        deductOrderStock(targetOrder);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: fallbackStatus } : o))
        );
      }
    } catch {
      const fallbackStatus =
        action === "confirm"
          ? "tasdiqlandi"
          : action === "ready"
          ? "tayyor"
          : action === "done"
          ? "yetkazildi"
          : "bekor_qilindi";
      deductOrderStock(targetOrder);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: fallbackStatus } : o))
      );
    } finally {
      setActionBusyId(null);
    }
  }

  // Mahsulot bor/yo'q holatini 1-tap orqali o'zgartirish
  async function handleToggleMedicineStatus(medId: number, currentStatus: "bor" | "yoq" | "qoralama") {
    haptic("light");
    const nextStatus = currentStatus === "bor" ? "yoq" : "bor";
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
      if (!data?.ok && !webToken.startsWith("biz_partner_")) {
        setMedicines((prev) =>
          prev.map((m) => (m.id === medId ? { ...m, status: currentStatus } : m))
        );
        alert("Holatni saqlab bo'lmadi");
      }
    } catch {
      if (!webToken.startsWith("biz_partner_")) {
        setMedicines((prev) =>
          prev.map((m) => (m.id === medId ? { ...m, status: currentStatus } : m))
        );
        alert("Aloqa xatosi");
      }
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
    setMedicines((prev) => {
      const updated = prev.map((m) => (m.id === medId ? { ...m, stock: nextStock } : m));
      if (partner?.id) {
        try {
          localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });

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
        if (!data?.ok && !webToken.startsWith("biz_partner_")) throw new Error();
      } catch {
        if (!webToken.startsWith("biz_partner_")) {
          setMedicines((prev) => prev.map((m) => (m.id === medId ? { ...m, stock: original } : m)));
          alert("Qoldiqni saqlab bo'lmadi");
        }
      }
    }, 700);
  }

  // Mahsulotni o'chirish
  async function handleDeleteMedicine(medId: number) {
    if (!confirm("Haqiqatan ham ushbu mahsulotni katalogdan o'chirmoqchimisiz?")) return;
    haptic("heavy");
    try {
      const res = await apiFetch(`/api/bot/partner/medicines/${medId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data?.ok || webToken.startsWith("biz_partner_")) {
        setMedicines((prev) => {
          const next = prev.filter((m) => m.id !== medId);
          if (partner?.id) {
            try {
              localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(next));
            } catch {
              // ignore
            }
          }
          return next;
        });
        haptic("medium");
      }
    } catch {
      if (webToken.startsWith("biz_partner_")) {
        setMedicines((prev) => prev.filter((m) => m.id !== medId));
      } else {
        alert("Mahsulotni o'chirib bo'lmadi");
      }
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

  function openNewMedicineModal() {
    setEditingMedId(null);
    setNewMedName("");
    setNewMedType("crop");
    setNewMedPrice("");
    setNewMedStock("10");
    setNewMedUnit("dona");
    setNewMedUsage("");
    setNewMedBatchNo("");
    setNewMedExpiryDate("");
    setNewMedPhoto(null);
    setShowAddMedModal(true);
  }

  function openEditMedicineModal(m: PartnerMedicine) {
    setEditingMedId(m.id);
    setNewMedName(m.name);
    setNewMedType((m.type as "crop" | "animal" | "general") || "crop");
    setNewMedPrice(m.price ? formatPriceWithDots(m.price) : "");
    setNewMedStock(String(m.stock ?? 0));
    setNewMedUnit(m.stockUnit || "dona");
    setNewMedUsage(m.usage || "");
    setNewMedBatchNo(m.batchNo || "");
    setNewMedExpiryDate(m.expiryDate || "");
    setNewMedPhoto(m.photoData || null);
    setShowAddMedModal(true);
  }

  // Yangi mahsulot qo'shish yoki mavjudini tahrirlash
  async function handleAddMedicineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMedName.trim()) {
      alert("Mahsulot nomini kiriting");
      return;
    }
    setSavingMed(true);
    const parsedPrice = parsePriceNumber(newMedPrice);
    const parsedStock = Math.max(0, Number(newMedStock) || 0);
    const batchVal = newMedBatchNo.trim() || null;
    const expiryVal = newMedExpiryDate.trim() || null;

    const saveMetaLocally = (medId: number) => {
      if (!partner?.id) return;
      try {
        const key = `agroz_med_meta_${partner.id}`;
        const metaMap = JSON.parse(localStorage.getItem(key) || "{}");
        metaMap[String(medId)] = { batchNo: batchVal, expiryDate: expiryVal };
        localStorage.setItem(key, JSON.stringify(metaMap));
      } catch {
        // ignore
      }
    };

    try {
      if (editingMedId !== null) {
        const payload = {
          name: newMedName.trim(),
          type: newMedType,
          price: parsedPrice,
          stock: parsedStock,
          stockUnit: newMedUnit,
          usage: newMedUsage.trim() || null,
          photoData: newMedPhoto,
          status: parsedStock > 0 ? ("bor" as const) : ("yoq" as const),
        };
        let updatedFromServer: PartnerMedicine | null = null;
        try {
          const res = await apiFetch(`/api/bot/partner/medicines/${editingMedId}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data?.ok && data.medicine) {
            updatedFromServer = data.medicine;
          }
        } catch {
          // local fallback
        }
        saveMetaLocally(editingMedId);
        setMedicines((prev) => {
          const next = prev.map((m) =>
            m.id === editingMedId
              ? {
                  ...m,
                  ...(updatedFromServer || payload),
                  batchNo: batchVal,
                  expiryDate: expiryVal,
                }
              : m
          );
          if (partner?.id) {
            try {
              localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(next));
            } catch {
              // ignore
            }
          }
          return next;
        });
        setShowAddMedModal(false);
        setEditingMedId(null);
        haptic("medium");
        return;
      }

      const res = await apiFetch(`/api/bot/partner/medicines`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: newMedName.trim(),
          type: newMedType,
          price: parsedPrice,
          stock: parsedStock,
          stockUnit: newMedUnit,
          usage: newMedUsage.trim() || null,
          photoData: newMedPhoto,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.medicine) {
        const createdMed: PartnerMedicine = {
          ...data.medicine,
          batchNo: batchVal,
          expiryDate: expiryVal,
        };
        saveMetaLocally(createdMed.id);
        setMedicines((prev) => {
          const next = [createdMed, ...prev];
          if (partner?.id) {
            try {
              localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(next));
            } catch {
              // ignore
            }
          }
          return next;
        });
        setShowAddMedModal(false);
        setNewMedName("");
        setNewMedPrice("");
        setNewMedUsage("");
        setNewMedBatchNo("");
        setNewMedExpiryDate("");
        setNewMedPhoto(null);
        haptic("medium");
      } else if (webToken.startsWith("biz_partner_")) {
        const localMed: PartnerMedicine = {
          id: Date.now(),
          specialistId: partner?.id || 1001,
          name: newMedName.trim(),
          type: newMedType,
          price: parsedPrice,
          stock: parsedStock,
          stockUnit: newMedUnit,
          usage: newMedUsage.trim() || null,
          status: parsedStock > 0 ? "bor" : "yoq",
          photoData: newMedPhoto,
          createdAt: new Date().toISOString(),
          batchNo: batchVal,
          expiryDate: expiryVal,
        };
        saveMetaLocally(localMed.id);
        setMedicines((prev) => {
          const next = [localMed, ...prev];
          if (partner?.id) {
            try {
              localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(next));
            } catch {
              // ignore
            }
          }
          return next;
        });
        setShowAddMedModal(false);
        setNewMedName("");
        setNewMedPrice("");
        setNewMedUsage("");
        setNewMedBatchNo("");
        setNewMedExpiryDate("");
        setNewMedPhoto(null);
        haptic("medium");
      } else {
        alert(data?.error || "Mahsulot qo'shishda xatolik");
      }
    } catch {
      alert("Server bilan aloqada xatolik yuz berdi");
    } finally {
      setSavingMed(false);
    }
  }

  // Tezkor Kassa (POS Sotuv)
  async function handlePosSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedMed = medicines.find((m) => m.id === Number(posMedId));
    if (!selectedMed) {
      alert("Iltimos, sotiladigan mahsulotni tanlang");
      return;
    }
    const qty = Math.max(1, Number(posQty) || 1);
    if (qty > selectedMed.stock) {
      alert(`Omborda faqat ${selectedMed.stock} ${selectedMed.stockUnit} mavjud`);
      return;
    }
    if (posPaymentMethod === "nasiya" && !posCustomerName.trim()) {
      alert("Nasiya (Qarzga) sotuv uchun mijoz ismini kiriting");
      return;
    }

    setPosSaving(true);
    try {
      const unitPrice = selectedMed.price || 0;
      const totalSum = unitPrice * qty;
      const nextStock = Math.max(0, selectedMed.stock - qty);
      const nextStatus: "bor" | "yoq" | "qoralama" = nextStock <= 0 ? "yoq" : "bor";

      // 1. Ombor qoldig'ini kamaytirish
      setMedicines((prev) => {
        const next = prev.map((m) =>
          m.id === selectedMed.id ? { ...m, stock: nextStock, status: nextStatus } : m
        );
        if (partner?.id) {
          try {
            localStorage.setItem(`agroz_local_meds_${partner.id}`, JSON.stringify(next));
          } catch {
            // ignore
          }
        }
        return next;
      });
      apiFetch(`/api/bot/partner/medicines/${selectedMed.id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ stock: nextStock, status: nextStatus }),
      }).catch(() => {});

      // 2. Sotuvni buyurtmalar tarixiga qo'shish
      const paymentLabel =
        posPaymentMethod === "nasiya"
          ? "Kassa: Nasiya (Qarz daftari)"
          : posPaymentMethod === "karta"
          ? "Kassa: Plastik karta"
          : "Kassa: Naqd to'lov";
      const posOrder: PartnerOrder = {
        id: Math.floor(100000 + Math.random() * 900000),
        pharmacySpecialistId: partner?.id || 0,
        customerName: posCustomerName.trim() || "Do'kon mijozi (Kassa)",
        customerPhone: posCustomerPhone.trim() || null,
        deliveryType: "pickup",
        customerAddress: null,
        note: paymentLabel,
        totalSum,
        status: "yetkazildi",
        createdAt: new Date().toISOString(),
        items: [
          {
            id: selectedMed.id,
            name: selectedMed.name,
            qty,
            price: unitPrice,
          },
        ],
      };

      setOrders((prev) => {
        const next = [posOrder, ...prev];
        if (partner?.id) {
          try {
            const prevLocal = JSON.parse(localStorage.getItem(`agroz_pos_orders_${partner.id}`) || "[]");
            localStorage.setItem(
              `agroz_pos_orders_${partner.id}`,
              JSON.stringify([posOrder, ...(Array.isArray(prevLocal) ? prevLocal : [])])
            );
          } catch {
            // ignore
          }
        }
        return next;
      });

      // 3. Agar Nasiya bo'lsa, Qarz daftariga avtomatik yozish
      if (posPaymentMethod === "nasiya" && totalSum > 0) {
        recordPosCreditDebt({
          partnerId: partner?.id,
          customerName: posCustomerName.trim(),
          customerPhone: posCustomerPhone.trim() || "Kiritilmagan",
          amount: totalSum,
          note: `${selectedMed.name} (${qty} ${selectedMed.stockUnit})`,
        });
      }

      setShowPosModal(false);
      setPosMedId("");
      setPosQty("1");
      setPosPaymentMethod("naqd");
      setPosCustomerName("");
      setPosCustomerPhone("");
      haptic("medium");
    } finally {
      setPosSaving(false);
    }
  }

  // Excel (CSV) eksport: Buyurtmalar va Savdo hisoboti
  function exportOrdersCsv() {
    if (orders.length === 0) {
      alert("Eksport qilish uchun buyurtmalar yoki sotuvlar mavjud emas.");
      return;
    }
    const headers = ["ID", "Sana", "Mijoz", "Telefon", "Mahsulotlar", "Summa (so'm)", "Holat", "Izoh / To'lov turi"];
    const rows = orders.map((o) => [
      o.id,
      new Date(o.createdAt).toLocaleString("uz-UZ"),
      `"${(o.customerName || "").replace(/"/g, '""')}"`,
      `"${o.customerPhone || ""}"`,
      `"${o.items.map((i) => `${i.name} x${i.qty}`).join("; ").replace(/"/g, '""')}"`,
      o.totalSum || 0,
      o.status,
      `"${(o.note || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agroz-savdo-hisoboti-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Excel (CSV) eksport: Ombor qoldig'i
  function exportMedicinesCsv() {
    if (medicines.length === 0) {
      alert("Eksport qilish uchun omborda mahsulotlar mavjud emas.");
      return;
    }
    const headers = ["ID", "Mahsulot nomi", "Toifa", "Narxi (so'm)", "Qoldiq", "O'lchov birligi", "Holati", "Partiya", "Yaroqlilik muddati"];
    const rows = medicines.map((m) => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      m.type === "crop" ? "O'simliklar" : m.type === "animal" ? "Chorva" : "Umumiy",
      m.price || 0,
      m.stock,
      `"${m.stockUnit}"`,
      m.status,
      `"${m.batchNo || ""}"`,
      `"${m.expiryDate || ""}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agroz-ombor-qoldiq-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const isPharmacy = partner?.role === "pharmacy" || partner?.role === "both";
  const isSpecialist = partner?.role === "specialist" || partner?.role === "both";
  const isBoth = partner?.role === "both";

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
  // Kirish kartasi (Landing page ichida yoki modalda ko'rsatish uchun)
  const renderLoginCard = (isModal = false) => (
    <div className={`w-full rounded-3xl border border-[#E5E5EA] bg-white p-5 sm:p-6 shadow-xs space-y-4 ${isModal ? "" : "mx-auto"}`}>
      <div className="flex flex-col items-center text-center">
        <AgrozBusinessLogo className="h-8 w-auto mb-2" />
        <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200/60">
          Boshqaruv Paneli
        </span>
        <p className="text-xs text-[#86868B] mt-2 max-w-sm">
          Agro-do‘kon egalari va mutaxassislar uchun Telegram orqali xavfsiz boshqaruv tizimi.
        </p>
      </div>

      {loginError && (
        <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
          <span>{loginError}</span>
        </div>
      )}

      {/* Telegram Bot orqali Tasdiqlash bilan Kirish */}
      {!otpSent ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestTelegramOtp();
          }}
          className="space-y-3 pt-1"
        >
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Telefon raqamingiz:
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
                disabled={otpLoading}
                className="rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 shrink-0 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {otpLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Send size={13} />
                    <span>Kirish</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1.5">
              Tasdiqlash kodi va ruxsat tugmasi <b>@{botUsername}</b> botingizga yuboriladi.
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyTelegramOtp} className="space-y-3 pt-1">
          <div className="rounded-2xl bg-blue-50/80 border border-blue-200 p-3 text-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span>Telegram botga tasdiqlash so‘rovi yuborildi</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Botdagi <b>«✅ Kabinetga kirishni tasdiqlash»</b> tugmasini bossangiz, sahifa avtomatik ochiladi.
            </p>
            {botStartUrl && (
              <a
                href={botStartUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-600 text-white font-bold py-2 text-xs hover:bg-blue-700 transition"
              >
                <span>Telegram botni ochish (@{botUsername})</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-700">6 xonali tasdiqlash kodi:</label>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-[11px] text-zinc-500 hover:text-black"
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
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-zinc-900 focus:border-zinc-900 focus:bg-white focus:outline-none transition"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>Kod kelmadimi?</span>
            {otpCountdown > 0 ? (
              <span className="font-mono text-zinc-400">{otpCountdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleRequestTelegramOtp}
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
            className="w-full rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold py-3 transition active:scale-95 disabled:opacity-50"
          >
            {loginLoading ? <RefreshCw size={14} className="animate-spin mx-auto" /> : <span>Tasdiqlash va Kirish</span>}
          </button>
        </form>
      )}

      {/* 2. Yangi hamkorlar uchun ro'yxatdan o'tish (1 oylik bepul sinov) */}
      <div className="pt-4 border-t border-[#E5E5EA] space-y-2.5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-emerald-950">1 Oylik Bepul Sinov</span>
              <span className="bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full">
                0 so‘m
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Yangi agro-do‘kon yoki mutaxassis uchun 30 kun to‘liq ERP
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
            className="shrink-0 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 transition active:scale-95 shadow-xs"
          >
            Ariza berish
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowContractModal(true)}
          className="w-full text-center text-[11px] font-medium text-zinc-500 hover:text-zinc-800 transition py-1"
        >
          📄 Xizmat ko‘rsatish shartnomasi va oferta
        </button>
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
          <AgrozBusinessLogo className="h-7 w-auto" />
          <Link
            href="/"
            className="text-xs font-semibold text-zinc-500 hover:text-black transition flex items-center gap-1"
          >
            <span>Asosiy sayt</span>
            <ExternalLink size={12} />
          </Link>
        </header>

        {/* Markaziy Kirish Kartochkasi (Apple-style minimalist auth) */}
        <main className="w-full max-w-md mx-auto my-auto">
          <div className="rounded-[28px] border border-[#E5E5EA] bg-white p-6 sm:p-8 shadow-xl shadow-black/5 space-y-6">
            {/* Sarlavha va Tavsif */}
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#191B1F] tracking-tight">
                Agroz Business
              </h1>
              <p className="text-xs text-zinc-500">
                Biznes profilingizga kiring
              </p>
            </div>

            {/* Xatolik xabari */}
            {loginError && (
              <div className="rounded-2xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Eslab qolingan qurilma / hisob kartochkasi */}
            {rememberedPartner && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {rememberedPartner.role === "specialist" ? "👨‍🌾" : rememberedPartner.role === "both" ? "🌟" : "🏪"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Ushbu qurilmada saqlangan</p>
                    <h3 className="text-xs font-black text-zinc-900 truncate">
                      {rememberedPartner.organization || rememberedPartner.name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">
                      @{rememberedPartner.login || rememberedPartner.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRememberedPartner(null);
                    setLoginPhone("");
                    setLoginPassword("");
                    try {
                      localStorage.removeItem("agroz_remembered_partner");
                    } catch {}
                  }}
                  className="text-[11px] font-bold text-zinc-500 hover:text-red-600 transition px-2 py-1 rounded-lg hover:bg-white shrink-0"
                  title="Boshqa hisobga o'tish"
                >
                  Boshqa hisob
                </button>
              </div>
            )}

            {/* Kirish usullari tablari: Telegram orqali / Parol bilan */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-100 text-xs font-bold text-zinc-600">
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
                Telegram orqali
              </button>
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
            </div>

            {/* Tab 1: Telegram Bot orqali Tasdiqlash (Asosiy va Tavsiya etilgan) */}
            {authTab === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRequestTelegramOtp();
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                        Telefon raqamingiz:
                      </label>
                      <input
                        type="tel"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(formatUzbekPhone(e.target.value))}
                        onFocus={() => {
                          if (!loginPhone) setLoginPhone("+998 ");
                        }}
                        placeholder="+998 90 123 45 67"
                        required
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm font-mono font-bold text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                      />
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                        Raqamingiz kiritilgach, <b>@{botUsername}</b> Telegram botingizga tasdiqlash tugmasi va kod yuboriladi.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={otpLoading || loginPhone.replace(/\D/g, "").length < 9}
                      className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Telegramga so‘rov yuborilmoqda...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Telegram orqali tasdiqlash</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyTelegramOtp} className="space-y-4">
                    {/* Jonli polling va Telegram tugmasi bloki */}
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                        </span>
                        <span>Telegram botingizga tasdiqlash yuborildi</span>
                      </div>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Telegramdagi <b>@{botUsername}</b> botida <b>«✅ Kabinetga kirishni tasdiqlash»</b> tugmasini bossangiz, bu oyna avtomatik ochiladi.
                      </p>
                      {botStartUrl && (
                        <a
                          href={botStartUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs shadow-xs transition"
                        >
                          <Send size={14} />
                          <span>Telegram botda ochish</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-700">Yoki botdagi 6 xonali kodni yozing:</label>
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
                          onClick={handleRequestTelegramOtp}
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
              </div>
            )}

            {/* Tab 2: Parol bilan kirish */}
            {authTab === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                {rememberedPartner ? (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Kirilayotgan hisob:
                    </label>
                    <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-100/80 px-4 py-2.5 text-xs font-mono font-bold text-zinc-800 flex items-center justify-between">
                      <span>@{rememberedPartner.login || rememberedPartner.phone}</span>
                      <span className="text-[11px] font-sans font-semibold text-zinc-500">
                        {rememberedPartner.organization || rememberedPartner.name}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Telefon raqam yoki Login:
                    </label>
                    <input
                      type="text"
                      value={loginPhone}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^[\d+\s]+$/.test(v) && v.length >= 2) {
                          setLoginPhone(formatUzbekPhone(v));
                        } else {
                          setLoginPhone(v);
                        }
                      }}
                      onFocus={() => {
                        if (!loginPhone) setLoginPhone("+998 ");
                      }}
                      placeholder="+998 90 123 45 67 yoki login"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm font-medium text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700">Maxfiy Parol:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPasswordModal(true);
                        setResetPhone(rememberedPartner?.phone || loginPhone);
                        setResetStep("request");
                        setResetError(null);
                        setResetSuccess(null);
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition"
                    >
                      Parolni yangilash
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Kamida 8 ta belgi"
                      autoFocus={Boolean(rememberedPartner)}
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
                    <span className="text-xs font-medium text-zinc-600">Devaysni eslab qolish</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading || !loginPassword.trim()}
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

            {/* Pastki: Yangi Hamkor Ro'yxatdan O'tish & Shartnoma */}
            <div className="pt-4 border-t border-zinc-100 space-y-2.5 text-center">
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 text-xs font-bold py-3 transition flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>Yangi hamkor sifatida ro‘yxatdan o‘tish</span>
                <ArrowRight size={14} />
              </button>

              <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-400">
                <button
                  type="button"
                  onClick={() => setShowContractModal(true)}
                  className="hover:text-zinc-700 transition"
                >
                  Shartnoma va oferta
                </button>
                <span>·</span>
                <a
                  href="https://t.me/agroz_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-zinc-700 transition"
                >
                  Yordam: @agroz_support
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-zinc-400 pt-6">
          © {new Date().getFullYear()} Agroz Business
        </footer>

        {/* PAROLNI YANGILASH (TELEGRAM BOT ORQALI) MODALI */}
        {showResetPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-md my-auto rounded-[28px] border border-[#E5E5EA] bg-white p-6 sm:p-7 shadow-2xl space-y-4">
              <button
                type="button"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setResetStep("request");
                  setResetError(null);
                  setResetSuccess(null);
                }}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition"
                title="Yopish"
              >
                <X size={16} />
              </button>

              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-zinc-900 text-white shadow-xs mb-1">
                  <KeyRound size={20} />
                </div>
                <h3 className="text-lg font-black text-zinc-900">Parolni yangilash</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                  {resetStep === "request"
                    ? "Telegram botingiz orqali tasdiqlab, yangi parol o‘rnating."
                    : "Telegram botga yuborilgan 6 xonali kod va yangi parolingizni kiriting."}
                </p>
              </div>

              {resetError && (
                <div className="rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 border border-emerald-200 flex items-start gap-2">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              {resetStep === "request" ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Telefon raqamingiz:
                    </label>
                    <input
                      type="tel"
                      value={resetPhone}
                      onChange={(e) => setResetPhone(formatUzbekPhone(e.target.value))}
                      onFocus={() => {
                        if (!resetPhone) setResetPhone("+998 ");
                      }}
                      placeholder="+998 90 123 45 67"
                      required
                      autoFocus
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm font-mono font-bold text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                      Ushbu raqamga ulangan Telegram botingizga 6 xonali tasdiqlash kodi yuboriladi.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || resetPhone.replace(/\D/g, "").length < 9}
                    className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Kodni yuborish...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Tasdiqlash kodini olish</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-700">Telegramdagi 6 xonali kod: *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep("request");
                          setResetCode("");
                        }}
                        className="text-[11px] font-semibold text-zinc-500 hover:text-black transition"
                      >
                        Raqamni o‘zgartirish
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      required
                      autoFocus
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Yangi maxfiy parol: *</label>
                    <input
                      type="password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Kamida 8 ta belgi (harf va raqam)"
                      required
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-2.5 text-sm font-medium text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                    <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                      {resetNewPassword.length > 0 && (resetNewPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(resetNewPassword)) ? (
                        <span className="text-amber-600 font-semibold">⚠️ Kamida 8 ta belgi, harf va raqam qatnashishi kerak</span>
                      ) : resetNewPassword.length >= 8 ? (
                        <span className="text-emerald-600 font-semibold">✓ Xavfsiz parol</span>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Yangi parolni takrorlang: *</label>
                    <input
                      type="password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Parolni qayta kiriting"
                      required
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-2.5 text-sm font-medium text-zinc-900 focus:border-black focus:bg-white focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                    <span>Kod kelmadimi?</span>
                    {resetCountdown > 0 ? (
                      <span className="font-mono text-zinc-400">{resetCountdown} soniya</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestResetOtp}
                        disabled={resetLoading}
                        className="font-bold text-black hover:underline"
                      >
                        Qayta yuborish
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading || resetCode.length < 4 || resetNewPassword.length < 8}
                    className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Bazada yangilanmoqda...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Parolni yangilash va Saqlash</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TO'LIQ HAMKOR RO'YXATDAN O'TISH MODALI */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl my-auto rounded-[28px] border border-[#E5E5EA] bg-white p-6 sm:p-7 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setShowRegisterModal(false);
                  setRegSuccess(null);
                }}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition"
                title="Yopish"
              >
                <X size={16} />
              </button>

              {!regSuccess ? (
                <>
                  <div className="text-center pt-1 space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                      1 Oylik Bepul Sinov (0 so‘m)
                    </span>
                    <h2 className="text-xl font-black tracking-tight text-[#1D1D1F] pt-1">
                      Agroz Business Hamkorlik Arizasi
                    </h2>
                    <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                      Agro-do‘koningiz yoki mutaxassislik faoliyatingiz uchun to‘liq ma’lumotlarni kiriting.
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2 text-xs">
                    {regNotice && (
                      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-amber-900 flex items-start gap-2.5">
                        <span className="text-base leading-none">💡</span>
                        <p className="text-xs font-semibold leading-relaxed">{regNotice}</p>
                      </div>
                    )}

                    {/* Yo'nalish tanlash: Agro-do'kon, Mutaxassis yoki Ikkalasi */}
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1.5">Faoliyat yo‘nalishi: *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRegRole("pharmacy");
                            setRegSpecialty("Agro-do'kon");
                          }}
                          className={`flex items-center justify-center gap-2 rounded-2xl p-3 border font-bold transition text-xs ${
                            regRole === "pharmacy"
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          <Store size={15} />
                          <span>Agro-Do‘kon</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRegRole("specialist");
                            setRegSpecialty("Agronom");
                          }}
                          className={`flex items-center justify-center gap-2 rounded-2xl p-3 border font-bold transition text-xs ${
                            regRole === "specialist"
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                          }`}
                        >
                          <UserCheck size={15} />
                          <span>Mutaxassis</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRegRole("both");
                            setRegSpecialty("Agro-do'kon va Mutaxassis");
                          }}
                          className={`flex items-center justify-center gap-2 rounded-2xl p-3 border font-bold transition text-xs ${
                            regRole === "both"
                              ? "bg-gradient-to-r from-emerald-700 to-teal-800 text-white border-emerald-700 shadow-xs"
                              : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70"
                          }`}
                        >
                          <Sparkles size={15} />
                          <span>Ham Do‘kon, ham Mutaxassis</span>
                        </button>
                      </div>
                    </div>

                    {/* Dual role maxsus tushuntirish */}
                    {regRole === "both" && (
                      <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                          <Sparkles size={14} className="text-emerald-600" />
                          <span>Universal rejim tanlandi</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Siz o‘z savdo do‘koningiz tovarlari, kassa va qarz daftarini boshqarasiz hamda mutaxassis sifatida fermerlarning maslahat va ko‘rik chaqiruvlarini ham qabul qilasiz.
                        </p>
                      </div>
                    )}

                    {/* Mutaxassis yoki Ikkala rejim bo'lsa yo'nalish tanlash */}
                    {(regRole === "specialist" || regRole === "both") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-zinc-700 mb-1">Mutaxassislik sohasi: *</label>
                          <select
                            value={regSpecialty}
                            onChange={(e) => setRegSpecialty(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                          >
                            <option value="Agronom">Agronom (Ekinlar)</option>
                            <option value="Veterinar">Veterinar (Chorva mollari)</option>
                            <option value="Agro-do'kon va Mutaxassis">Agro-do‘kon va Agronom</option>
                            <option value="O‘simliklar himoyasi">O‘simliklar himoyasi (Entomolog)</option>
                            <option value="Chorvachilik mutaxassisi">Chorvachilik mutaxassisi</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-zinc-700 mb-1">Qaysi sohada xizmat: *</label>
                          <select
                            value={regHelpsWith}
                            onChange={(e) => setRegHelpsWith(e.target.value as any)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                          >
                            <option value="both">Har ikkisi (Ekinlar va Chorva)</option>
                            <option value="crop">Faqat ekinlar (Dehqonchilik)</option>
                            <option value="animal">Faqat chorva (Mollar/Parranda)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* F.I.SH va Do'kon nomi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-700 mb-1">To‘liq ism (F.I.SH): *</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Masalan: Alisher Qodirov"
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-700 mb-1">
                          {regRole !== "specialist" ? "Agro-do‘kon rasmiy nomi: *" : "Tashkilot yoki brend nomi:"}
                        </label>
                        <input
                          type="text"
                          required={regRole !== "specialist"}
                          value={regOrganization}
                          onChange={(e) => setRegOrganization(e.target.value)}
                          placeholder={regRole !== "specialist" ? "Masalan: Baraka Agro Kimyo" : "Ixtiyoriy"}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Telefon va Ish vaqti */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-700 mb-1">Telefon raqam: *</label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(formatUzbekPhone(e.target.value))}
                          onFocus={() => {
                            if (!regPhone) setRegPhone("+998 ");
                          }}
                          placeholder="+998 90 123 45 67"
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-mono font-bold focus:border-black focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-700 mb-1">Ish vaqti: *</label>
                        <input
                          type="text"
                          required
                          value={regWorkHours}
                          onChange={(e) => setRegWorkHours(e.target.value)}
                          placeholder="08:00 - 19:00"
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Avtomatik unikal Login va Maxfiy Parol */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-100/70 border border-zinc-200">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-zinc-800">Tizimga kirish logini: *</label>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Avto yaratilgan
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold text-xs">@</span>
                          <input
                            type="text"
                            required
                            value={regLogin}
                            onChange={(e) => {
                              setRegLogin(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                              setRegLoginIsManual(true);
                            }}
                            placeholder="dokon_login"
                            className="w-full rounded-2xl border border-zinc-200 bg-white pl-8 pr-3.5 py-2 text-zinc-900 font-mono font-bold text-xs focus:border-black focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          Do‘kon havolangiz: <span className="font-mono text-emerald-700 font-semibold">biznesgo.vercel.app/@{regLogin || "login"}</span>
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-zinc-800">Maxfiy parol: *</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const p = generateDefaultPassword();
                                setRegPassword(p);
                                haptic("light");
                              }}
                              className="text-[10px] text-zinc-600 hover:text-black font-medium underline"
                              title="Yangi xavfsiz parol generatsiya qilish"
                            >
                              Yangi parol 🎲
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(regPassword).catch(() => {});
                                alert("Parol nusxalandi: " + regPassword);
                              }}
                              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline"
                              title="Parolni nusxalash"
                            >
                              Nusxalash 📋
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type={regShowPassword ? "text" : "password"}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Kamida 8 ta belgi (harf+raqam)"
                            className="w-full rounded-2xl border border-zinc-200 bg-white pl-3.5 pr-9 py-2 text-zinc-900 font-mono font-medium text-xs focus:border-black focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setRegShowPassword(!regShowPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                            title={regShowPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                          >
                            {regShowPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          {regPassword.length === 0 ? (
                            <span className="text-zinc-400">Harf va raqam qatnashishi shart</span>
                          ) : regPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(regPassword) ? (
                            <span className="text-amber-600 font-semibold">
                              ⚠️ Oddiy: kamida 8 ta belgi, harf va raqam
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">
                              ✓ Avto tayyorlangan ishonchli parol
                            </span>
                          )}
                          <span className="text-zinc-400 font-mono text-[9px]">Dastlabki parol tayyor</span>
                        </div>
                      </div>
                    </div>

                    {/* Hudud: Viloyat va Tuman */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-zinc-700 mb-1">Viloyat / Hudud: *</label>
                        <select
                          value={regRegion}
                          onChange={(e) => setRegRegion(e.target.value)}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                        >
                          <option value="Toshkent shahri">Toshkent shahri</option>
                          <option value="Toshkent viloyati">Toshkent viloyati</option>
                          <option value="Samarqand viloyati">Samarqand viloyati</option>
                          <option value="Farg‘ona viloyati">Farg‘ona viloyati</option>
                          <option value="Andijon viloyati">Andijon viloyati</option>
                          <option value="Namangan viloyati">Namangan viloyati</option>
                          <option value="Buxoro viloyati">Buxoro viloyati</option>
                          <option value="Qashqadaryo viloyati">Qashqadaryo viloyati</option>
                          <option value="Surxondaryo viloyati">Surxondaryo viloyati</option>
                          <option value="Xorazm viloyati">Xorazm viloyati</option>
                          <option value="Jizzax viloyati">Jizzax viloyati</option>
                          <option value="Sirdaryo viloyati">Sirdaryo viloyati</option>
                          <option value="Navoiy viloyati">Navoiy viloyati</option>
                          <option value="Qoraqalpog‘iston Res.">Qoraqalpog‘iston Res.</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-700 mb-1">Tuman yoki shahar: *</label>
                        <input
                          type="text"
                          required
                          value={regDistrict}
                          onChange={(e) => setRegDistrict(e.target.value)}
                          placeholder="Masalan: Zangiota tumani"
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Aniq manzil */}
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">To‘liq manzil va mo‘ljal: *</label>
                      <input
                        type="text"
                        required
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="Masalan: Yangiyo‘l shoh ko‘chasi, 45-uy, Dehqon bozori yonida"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Mutaxassis qo'shimcha: Tajriba va Ma'lumot */}
                    {(regRole === "specialist" || regRole === "both") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-zinc-700 mb-1">Tajriba (yil): *</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={regExperienceYears}
                            onChange={(e) => setRegExperienceYears(e.target.value)}
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-zinc-700 mb-1">Ma‘lumoti / Mutaxassislik diplomi:</label>
                          <input
                            type="text"
                            value={regEducation}
                            onChange={(e) => setRegEducation(e.target.value)}
                            placeholder="Masalan: Toshkent Davlat Agrar Universiteti"
                            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-zinc-900 font-medium focus:border-black focus:bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Rasmiy Shartnoma va 1 oylik sinov shartlari bloki */}
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="contractCheck"
                          type="checkbox"
                          required
                          checked={regContractAccepted}
                          onChange={(e) => setRegContractAccepted(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-black focus:ring-black accent-black shrink-0"
                        />
                        <label htmlFor="contractCheck" className="text-zinc-800 font-semibold leading-relaxed cursor-pointer">
                          Men{" "}
                          <button
                            type="button"
                            onClick={() => setShowContractModal(true)}
                            className="text-blue-600 underline hover:text-blue-800 font-bold"
                          >
                            Agroz Business xizmat ko‘rsatish shartnomasi va ofertasi
                          </button>
                          ni to‘liq o‘qidim hamda 1 oylik sinov shartlariga roziman.
                        </label>
                      </div>

                      <ul className="text-[11px] text-zinc-600 space-y-1 pl-6 list-disc">
                        <li>Dastlabki <b>1 oy (30 kun)</b> foydalanish mutlaqo bepul (0 so‘m).</li>
                        <li>1 oylik bepul davr tugagach, xizmat haqi oyiga <b>149 000 so‘m</b>ni tashkil etadi.</li>
                        <li>Muddati tugashiga <b>5 kun qolganda</b> @{botUsername} orqali ogohlantirish yuboriladi.</li>
                        <li>To‘lov muddati o‘tganda boshqaruv bazasi ma’lumotlar yo‘qolmagan holda vaqtincha yopiladi.</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={regSubmitting || !regContractAccepted}
                      className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-sm font-bold py-3.5 transition-all shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {regSubmitting ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Ariza yuborilmoqda...</span>
                        </>
                      ) : (
                        <span>Arizani topshirish va Kabinetni ochish</span>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* Muvaffaqiyatli ro'yxatdan o'tish natijasi */
                <div className="py-4 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-900">Arizangiz muvaffaqiyatli qabul qilindi!</h3>
                    <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto leading-relaxed">
                      Hurmatli <b>{regSuccess.name}</b>, sizga 1 oylik (30 kunlik) bepul sinov davri faollashtirildi.
                      Sinov muddati: <b>{new Date(regSuccess.trialEndsAt).toLocaleDateString("uz-UZ")}</b> gacha.
                    </p>
                    {regSuccess.login && (
                      <div className="mt-3 flex flex-col items-center gap-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-mono font-bold text-zinc-800">
                          <span>Kirish loginingiz:</span>
                          <span className="text-emerald-700 font-extrabold">@{regSuccess.login}</span>
                        </div>
                        <div className="text-[11px] text-zinc-600 font-mono bg-zinc-50 border border-zinc-200/80 px-3 py-1 rounded-xl">
                          Do‘kon havolasi: <span className="text-emerald-700 font-bold">biznesgo.vercel.app/@{regSuccess.login}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-left space-y-2">
                    <span className="text-xs font-bold text-blue-950 block">
                      🔔 Muhim: Telegram botingizni ulang!
                    </span>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      To‘lov muddati tugashidan 5 kun oldin ogohlantirish olish va xaridorlardan keladigan buyurtmalarni o‘tkazib yubormaslik uchun Telegram botga start bosing:
                    </p>
                    <a
                      href={regSuccess.startUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs shadow-xs transition"
                    >
                      <Send size={14} />
                      <span>Telegram Botni Ulash (@{regSuccess.botUsername})</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextToken = regSuccess?.sessionToken;
                      setShowRegisterModal(false);
                      setRegSuccess(null);
                      if (nextToken) {
                        setWebToken(nextToken);
                        localStorage.setItem("agroz_business_token", nextToken);
                        loadData("", nextToken);
                      }
                    }}
                    className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-xs font-bold py-3 transition shadow-sm"
                  >
                    Boshqaruv Kabinetiga o‘tish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RASMIY XIZMAT KO'RSATISH SHARTNOMASI MODALI */}
        {showContractModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl my-auto rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition"
                title="Yopish"
              >
                <X size={16} />
              </button>

              <div className="border-b border-zinc-100 pb-3">
                <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase bg-zinc-100 px-2.5 py-0.5 rounded-full">
                  Rasmiy Hujjat
                </span>
                <h3 className="text-lg font-black text-zinc-900 mt-2">
                  AgrozGO Business Axborot Tizimidan Foydalanish Bo‘yicha Ommaviy Oferta va Xizmat Ko‘rsatish Shartnomasi
                </h3>
              </div>

              <div className="space-y-4 text-xs text-zinc-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                <section className="space-y-1">
                  <h4 className="font-bold text-zinc-900">1. Umumiy qoidalar va shartnoma predmeti</h4>
                  <p>
                    Ushbu Ommaviy Oferta AgrozGO platformasi orqali agro-do‘kon egalari va soha mutaxassislari (keyingi o‘rinlarda «Hamkor») uchun taqdim etiladigan ERP boshqaruv tizimi, ombor hisob-kitobi, kassa (POS) savdosi, qarz daftari va fermerlar bilan aloqa o‘rnatish xizmatlarini tartibga soladi.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-zinc-900">2. 1 Oylik Bepul Sinov Davri (Trial Period)</h4>
                  <p>
                    2.1. Yangi ro‘yxatdan o‘tgan barcha Hamkorlarga dastlabki <b>30 (o‘ttiz) kalendar kuni</b> davomida AgrozGO Business tizimidan to‘liq va bepul (0 so‘m) foydalanish huquqi taqdim etiladi.
                  </p>
                  <p>
                    2.2. Bepul sinov davrida Hamkor barcha ERP funksiyalaridan (ombor, kassa, qarz daftari, bronlar) cheklovsiz foydalanishi mumkin.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-zinc-900">3. Tariflar va Oylik Obuna To‘lovi</h4>
                  <p>
                    3.1. 1 oylik bepul sinov muddati yakunlangach, platformadan foydalanish oylik <b>149 000 (bir yuz qirq to‘qqiz ming) so‘m</b> miqdorida to‘lov asosida amalga oshiriladi.
                  </p>
                  <p>
                    3.2. To‘lov Click, Payme yoki bank kartasi orqali har oy muddatidan oldin amalga oshirilishi lozim.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-zinc-900">4. Telegram Bot Orqali Ogohlantirish Tartibi</h4>
                  <p>
                    4.1. Hamkorning 1 oylik sinov muddati yoki oylik obuna muddati tugashiga <b>5 (besh) kun</b> qolganda, AgrozGO avtomatlashtirilgan tizimi Hamkorning ulangan Telegram hisobiga (@agroz_auth_bot) to‘lov kuni haqida rasmiy ogohlantirish xabarini yuboradi.
                  </p>
                  <p>
                    4.2. Ushbu ogohlantirishlarni o‘z vaqtida qabul qilish uchun Hamkor rasmiy Telegram botni ulashi shart.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-zinc-900">5. To‘lov Amalga Oshirilmaganda Baza Faoliyatini To‘xtatish (Qulflash)</h4>
                  <p>
                    5.1. Sinov muddati yoki to‘langan obuna davri yakunlangach, agar yangi davr uchun to‘lov amalga oshirilmasa, Hamkorning boshqaruv kabineti va bazasi vaqtincha to‘xtatiladi (qulflanadi).
                  </p>
                  <p>
                    5.2. Qulflangan davrda Hamkorning kiritgan mahsulotlari, buyurtmalari va qarz daftari yozuvlari o‘chirilmaydi va to‘lov amalga oshirilishi bilanoq avtomatik tarzda qayta tiklanadi.
                  </p>
                </section>

                <section className="space-y-1">
                  <h4 className="font-bold text-zinc-900">6. Qonuniy Asoslar va Maxfiylik</h4>
                  <p>
                    Ushbu shartnoma O‘zbekiston Respublikasining Fuqarolik Kodeksi hamda «Shaxsiy ma’lumotlar to‘g‘risida»gi O‘RQ-547-sonli Qonuniga to‘liq mos holda tuzilgan. Ma’lumotlar xavfsiz va shifrlangan serverlarda saqlanadi.
                  </p>
                </section>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="rounded-2xl bg-[#191B1F] hover:bg-black text-white text-xs font-bold px-6 py-2.5 transition active:scale-95"
                >
                  Shartlarni tushundim va qabul qilaman
                </button>
              </div>
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
              {isBoth ? <Sparkles size={16} /> : isPharmacy ? <Store size={16} /> : <UserCheck size={16} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-semibold text-[#1D1D1F] truncate leading-tight">
                {partner ? partner.organization || partner.name : "Do'kon paneli"}
              </h2>
              <p className="text-[10px] text-[#86868B] truncate mt-0.5">
                {isBoth ? "🌟 Do‘kon + Mutaxassis" : isPharmacy ? "Agro-Do‘kon" : partner?.specialty || "Mutaxassis"}
              </p>
            </div>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-black/5 text-[#86868B] shrink-0">
            BETA
          </span>
        </div>

        {/* Sidebar Navigatsiya Menyu */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {/* Agro-do'kon menyusi (Hamkor Do'kon yoki Ikkala rejim bo'lsa) */}
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
                  <span>Ombor & Mahsulotlar</span>
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

              {/* Universal rejimda Mutaxassis chaqiruvlari tabini qo'shish */}
              {isSpecialist && isBoth && (
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
                    <span>Fermer Chaqiruvlari</span>
                  </div>
                  {pendingCallsCount > 0 && (
                    <span className="rounded-full bg-black/10 text-[#1D1D1F] px-1.5 py-0.2 text-[10px] font-mono font-medium">
                      {pendingCallsCount}
                    </span>
                  )}
                </button>
              )}

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

              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic("medium");
                    setShowPosModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-semibold transition active:scale-95 shadow-xs"
                >
                  <ShoppingCart size={14} />
                  <span>Tezkor Kassa (Sotuv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic("medium");
                    openNewMedicineModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white px-3 py-2 text-xs font-medium transition active:scale-95 shadow-xs"
                >
                  <Plus size={14} />
                  <span>Mahsulot qo&apos;shish</span>
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

        {/* Sidebar pastki qismi: Tariflar, Chiqish */}
        <div className="p-3 border-t border-[#E5E5EA] space-y-1.5 bg-[#FBFBFD]">

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

          <button
            type="button"
            onClick={() => setShowContractModal(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium text-[#1D1D1F] bg-white border border-[#E5E5EA] hover:bg-[#F5F5F7] transition"
          >
            <div className="flex items-center gap-2">
              <FileText size={13} className="text-[#1D1D1F]" />
              <span>Rasmiy Shartnoma</span>
            </div>
            <ExternalLink size={11} className="text-[#86868B] shrink-0" />
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
                {isPharmacy ? "Agro-Do‘kon" : partner?.specialty || "Mutaxassis"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPharmacy && partner?.isApproved && (
              <button
                type="button"
                onClick={() => setShowPosModal(true)}
                className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition"
                title="Tezkor Kassa"
              >
                <ShoppingCart size={12} />
                <span>Kassa</span>
              </button>
            )}

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
            {isPharmacy && partner?.isApproved && (
              <button
                type="button"
                onClick={() => setShowPosModal(true)}
                className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white transition active:scale-95 shadow-2xs"
              >
                <ShoppingCart size={13} />
                <span>Tezkor Kassa</span>
              </button>
            )}

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
                <span className="font-bold text-zinc-900">{isPharmacy ? "Agro-Do‘kon" : partner.specialty || "Mutaxassis"}</span>
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
          {(partner.subscriptionStatus === "expired" || (typeof partner.daysLeft === "number" && partner.daysLeft <= 0)) ? (
            /* BAZA VAQTINCHA YOPILGAN (Qulflangan holat) */
            <div className="mx-4 my-8 max-w-xl mx-auto rounded-[28px] border border-red-200 bg-white p-7 sm:p-8 text-center shadow-xl space-y-5 animate-in fade-in duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100 text-red-600 shadow-xs">
                <Lock size={32} />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-red-600 uppercase bg-red-50 px-3 py-1 rounded-full border border-red-200/80">
                  Sinov muddati tugagan
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                  Boshqaruv Bazasi Vaqtincha Yopilgan
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-md mx-auto">
                  Hurmatli <b>{partner.organization || partner.name}</b>, sizning 1 oylik (30 kunlik) bepul sinov muddatingiz o‘z nihoyasiga yetdi.
                  Barcha tovarlaringiz, buyurtmalaringiz va qarz daftari yozuvlaringiz to‘liq saqlangan.
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 text-xs space-y-2 text-zinc-700 text-left">
                <div className="flex justify-between py-1 border-b border-zinc-200/60">
                  <span>Oylik xizmat haqi:</span>
                  <span className="font-extrabold text-zinc-900 text-sm">149 000 so‘m/oy</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Baza holati:</span>
                  <span className="font-bold text-red-600">Vaqtincha to‘xtatilgan</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTariffsModal(true)}
                  className="w-full rounded-2xl bg-[#191B1F] hover:bg-black text-white text-xs font-bold py-3.5 transition active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  <Sparkles size={15} />
                  <span>Oylik obunani faollashtirish (149 000 so‘m)</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowContractModal(true)}
                    className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 py-2.5 text-xs font-bold text-zinc-700 transition"
                  >
                    Shartnomani ko‘rish
                  </button>
                  <a
                    href="https://t.me/agroz_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 py-2.5 text-xs font-bold text-blue-700 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Texnik yordam</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Sinov muddati tugashiga 5 kun yoki kam qolganda: OGOHLANTIRISH BANNERI */}
              {typeof partner.daysLeft === "number" && partner.daysLeft <= 5 && partner.daysLeft > 0 && (
                <div className="mx-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-950">
                          Diqqat: Sinov muddati tugashiga {partner.daysLeft} kun qoldi!
                        </span>
                        <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                          {partner.daysLeft === 1 ? "Oxirgi kun" : `${partner.daysLeft} kun`}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        1 oylik bepul davrdan so‘ng xizmat 149 000 so‘m/oy. Bazangiz to‘xtab qolmasligi uchun muddatni uzaytiring.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowTariffsModal(true)}
                      className="rounded-xl bg-amber-900 hover:bg-black text-white text-xs font-bold px-4 py-2 transition shadow-xs active:scale-95"
                    >
                      Obunani uzaytirish
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowContractModal(true)}
                      className="rounded-xl bg-white border border-amber-300 text-amber-950 text-xs font-bold px-3 py-2 hover:bg-amber-100/50 transition"
                    >
                      Shartnoma
                    </button>
                  </div>
                </div>
              )}

              {/* Telegram bot ulanmagan bo'lsa: OGOHLANTIRISH VA ULASH BANNERI */}
              {!partner.isTelegramLinked && (
                <div className="mx-4 rounded-2xl border border-blue-200 bg-blue-50/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Send size={15} />
                    </div>
                    <div className="text-xs text-blue-950">
                      <span className="font-bold">Telegram botingiz ulanmagan: </span>
                      <span>To‘lov eslatmalari (5 kun oldin) va yangi buyurtmalar/chaqiruvlar haqida tezkor xabar olish uchun botni ulang.</span>
                    </div>
                  </div>
                  <a
                    href={`https://t.me/${partner.botUsername || "agroz_auth_bot"}?start=biz_partner_${partner.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 shrink-0 transition"
                  >
                    <span>Telegramni ulash</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}

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
              onOpenCompleteModal={(c) => {
                haptic("light");
                setCompleteCallModal(c);
                setCallConclusion(c.conclusion || "");
              }}
              actionBusyId={actionBusyId}
            />
          )}

          {/* 3.1. MUTAXASSIS: CHAQIRUVLAR TABI */}
          {isSpecialist && activeTab === "calls" && (
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

                      {/* Mutaxassis ko'rik xulosasi */}
                      {c.conclusion && (
                        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-2.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            📋 Ko&apos;rik xulosasi va tavsiya:
                          </span>
                          <p className="text-xs text-emerald-950 font-medium leading-relaxed">{c.conclusion}</p>
                        </div>
                      )}

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

                    {/* Harakat tugmalari */}
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
                          onClick={() => {
                            haptic("light");
                            setCompleteCallModal(c);
                            setCallConclusion(c.conclusion || "");
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 py-2.5 text-xs font-bold text-white active:scale-95 transition shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          <span>Ko&apos;rik xulosasi & Yakunlash</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* 3.2a. AGRO-DO'KON: ASOSIY (DASHBOARD) */}
          {isPharmacy && activeTab === "dashboard" && (
            <PharmacyDashboard
              partnerId={partner.id}
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
                openNewMedicineModal();
              }}
              onOpenDebts={() => {
                haptic("light");
                goTab("debts");
              }}
              onOpenPos={() => {
                haptic("medium");
                setShowPosModal(true);
              }}
              onExportReport={exportOrdersCsv}
            />
          )}

          {/* 3.2b. AGRO-DO'KON: QARZ DAFTARI (NASIYA & TA'MINOTCHI) */}
          {isPharmacy && activeTab === "debts" && (
            <QarzDaftariSection
              partnerId={partner.id}
              storeName={partner.organization || partner.name}
            />
          )}

          {/* 3.2. AGRO-DO'KON: BRONLAR & BUYURTMALAR TABI */}
          {isPharmacy && activeTab === "orders" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
              {/* Filter tugmalari va Eksport / Kassa */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[11px] font-bold scrollbar-none">
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

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPosModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <ShoppingCart size={14} />
                    <span>Tezkor Kassa (Sotuv)</span>
                  </button>
                  <button
                    type="button"
                    onClick={exportOrdersCsv}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 px-3.5 py-2 text-xs font-bold transition"
                  >
                    <Download size={14} />
                    <span>Excel (.csv)</span>
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 && !loading && (
                <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center text-zinc-400">
                  <Package size={40} className="mx-auto mb-3 opacity-30 text-zinc-400" />
                  <p className="text-sm font-bold text-zinc-700">Buyurtmalar va sotuvlar yo&apos;q</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Mijoz mahsulot bron qilganda yoki Tezkor Kassa orqali sotuv qilganingizda shu yerda ko&apos;rinadi
                  </p>
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
                        <span className="text-xs font-mono font-black text-zinc-900">#{ord.id}</span>
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
                        <span>Turi / Izoh:</span>
                        <span className="font-bold text-zinc-900">
                          {ord.note
                            ? ord.note
                            : ord.deliveryType === "delivery"
                            ? "🚚 Yetkazib berish"
                            : "🏪 Do'kondan olib ketish"}
                        </span>
                      </div>

                      {/* Mahsulotlar ro'yxati */}
                      {ord.items && ord.items.length > 0 && (
                        <div className="rounded-xl bg-zinc-50/80 p-3 border border-zinc-100 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block">
                            So&apos;ralgan mahsulotlar:
                          </span>
                          <div className="divide-y divide-zinc-200/60">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between py-1 text-zinc-800">
                                <span>📦 {it.name}</span>
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
                            <span>Tasdiqlash (Bor)</span>
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
                          <span>Mijozga topshirildi (Qoldiqdan yechish)</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* 3.3. AGRO-DO'KON: MAHSULOTLAR KATALOGI (Ombor, Tahrirlash, Partiya/Muddati va CSV) */}
          {isPharmacy && activeTab === "medicines" && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
              {/* Qidiruv, Eksport va Tezkor Qo'shish */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Mahsulot nomi yoki qo‘llanilishi bo'yicha qidiruv..."
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    className="w-full rounded-2xl bg-white pl-10 pr-4 py-3 text-xs sm:text-sm text-zinc-900 border border-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs transition"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={exportMedicinesCsv}
                    className="flex items-center justify-center gap-1.5 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-3 text-xs sm:text-sm font-bold text-zinc-800 transition shrink-0"
                  >
                    <Download size={16} />
                    <span>Excel (.csv)</span>
                  </button>
                  <button
                    type="button"
                    onClick={openNewMedicineModal}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#1D1D1F] hover:bg-black px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-xs active:scale-95 transition shrink-0"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Yangi mahsulot qo&apos;shish</span>
                  </button>
                </div>
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
                    { id: "animal", label: "🐾 Chorva" },
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
                  <p className="text-sm font-bold text-zinc-700">Mahsulotlar topilmadi</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    Qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring yoki &quot;Yangi mahsulot qo&apos;shish&quot; tugmasi orqali omborga kiritishni boshlang.
                  </p>
                </div>
              )}

              {/* Mahsulotlar ro'yxati: 3-ustunli Responsive Grid */}
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
                              {m.type === "crop" ? "🌾" : m.type === "animal" ? "🐾" : "📦"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-zinc-900 text-xs sm:text-sm truncate group-hover:text-emerald-700 transition">
                              {m.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              <span className="inline-block rounded-md bg-zinc-100 text-zinc-600 px-2 py-0.5 text-[9px] font-mono">
                                {m.type === "crop" ? "O'simliklar" : m.type === "animal" ? "Chorvachilik" : "Umumiy vosita"}
                              </span>
                              {m.batchNo && (
                                <span className="inline-block rounded-md bg-zinc-100 text-zinc-600 px-1.5 py-0.5 text-[9px] font-mono">
                                  #{m.batchNo}
                                </span>
                              )}
                              {m.expiryDate && (
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 px-1.5 py-0.5 text-[9px] font-mono">
                                  <Calendar size={9} />
                                  {m.expiryDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tahrirlash va O'chirish tugmalari */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditMedicineModal(m)}
                            className="rounded-xl p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition"
                            title="Mahsulotni tahrirlash"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedicine(m.id)}
                            className="rounded-xl p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 transition"
                            title="Mahsulotni o'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
                      {isPharmacy ? partner.organization || "Agro-Do‘kon" : partner.specialty || "Mutaxassis"}
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

              {/* Faoliyat turi va Boshqaruv panelini tanlash (Agro-do'kon / Mutaxassis / Universal) */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Faoliyat turi va Kabinet rejimi</h4>
                    <p className="text-xs text-zinc-500">Istalgan payt boshqaruv rejimini almashtirishingiz mumkin</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {partner.role === "both" ? "Universal" : partner.role === "pharmacy" ? "Agro-do‘kon" : "Mutaxassis"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={roleSwitching || partner.role === "pharmacy"}
                    onClick={() => handleSwitchRole("pharmacy")}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition ${
                      partner.role === "pharmacy"
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Store size={20} className={partner.role === "pharmacy" ? "text-emerald-400" : "text-zinc-700"} />
                      {partner.role === "pharmacy" && <CheckCircle2 size={16} className="text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold">Agro-Do‘kon</span>
                    <span className={`text-[10px] mt-1 leading-snug ${partner.role === "pharmacy" ? "text-zinc-300" : "text-zinc-500"}`}>
                      Mahsulotlar ombori, sotuvlar, kassa va qarz daftari
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={roleSwitching || partner.role === "specialist"}
                    onClick={() => handleSwitchRole("specialist")}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition ${
                      partner.role === "specialist"
                        ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                        : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <UserCheck size={20} className={partner.role === "specialist" ? "text-emerald-400" : "text-zinc-700"} />
                      {partner.role === "specialist" && <CheckCircle2 size={16} className="text-emerald-400" />}
                    </div>
                    <span className="text-xs font-bold">Mutaxassis</span>
                    <span className={`text-[10px] mt-1 leading-snug ${partner.role === "specialist" ? "text-zinc-300" : "text-zinc-500"}`}>
                      Agronom / Veterinar, fermerlar chaqiruvlari va ko‘riklar
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={roleSwitching || partner.role === "both"}
                    onClick={() => handleSwitchRole("both")}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-left transition ${
                      partner.role === "both"
                        ? "border-emerald-700 bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-xs"
                        : "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-950"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <Sparkles size={20} className={partner.role === "both" ? "text-emerald-300" : "text-emerald-700"} />
                      {partner.role === "both" && <CheckCircle2 size={16} className="text-emerald-300" />}
                    </div>
                    <span className="text-xs font-bold">Universal (Ikkalasi)</span>
                    <span className={`text-[10px] mt-1 leading-snug ${partner.role === "both" ? "text-emerald-200" : "text-emerald-800"}`}>
                      Ham do‘kon mahsulotlari, ham mutaxassislik xizmatlari
                    </span>
                  </button>
                </div>
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
            </>
          )}
        </div>
      )}

      {/* 3.5. AGRO-DO'KON: PASTKI NAVIGATSIYA (Faqat Mobil) */}
      {isPharmacy && partner?.isApproved && partner.subscriptionStatus !== "expired" && (typeof partner.daysLeft !== "number" || partner.daysLeft > 0) && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-md grid grid-cols-5 items-end px-2 pt-1.5 pb-1.5">
            {[
              { id: "dashboard", label: "Asosiy", Icon: LayoutDashboard, badge: 0 },
              { id: "orders", label: "Bronlar", Icon: Package, badge: pendingOrdersCount },
              isBoth
                ? { id: "calls", label: "Chaqiruv", Icon: PhoneCall, badge: pendingCallsCount }
                : { id: "__add", label: "", Icon: Plus, badge: 0 },
              { id: "medicines", label: "Qoldiq", Icon: Boxes, badge: stockCounts.low + stockCounts.out },
              { id: "debts", label: "Qarzlar", Icon: HandCoins, badge: 0 },
            ].map(({ id, label, Icon, badge }) => {
              if (id === "__add") {
                return (
                  <div key={id} className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        haptic("medium");
                        openNewMedicineModal();
                      }}
                      className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#1D1D1F] text-white shadow-md active:scale-90 transition"
                      aria-label="Mahsulot qo'shish"
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
      {!isPharmacy && partner?.isApproved && partner.subscriptionStatus !== "expired" && (typeof partner.daysLeft !== "number" || partner.daysLeft > 0) && (
        <nav
          className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#E5E5EA] bg-white/95 backdrop-blur-md shadow-xs"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-md grid grid-cols-3 items-end px-4 pt-1.5 pb-1.5">
            {[
              { id: "dashboard", label: "Asosiy", Icon: LayoutDashboard, badge: 0 },
              { id: "calls", label: "Chaqiruvlar", Icon: PhoneCall, badge: pendingCallsCount },
              { id: "profile", label: "Profil", Icon: UserCheck, badge: 0 },
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

      {/* 4. MODAL: YANGI MAHSULOT QO'SHISH YOKI TAHRIRLASH (AGRO-DO'KON) */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 bg-zinc-50/80">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Store size={16} />
                <span>{editingMedId !== null ? "Mahsulotni Tahrirlash" : "Yangi Mahsulot Qo'shish"}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddMedModal(false);
                  setEditingMedId(null);
                }}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/60"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedicineSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Mahsulot fotosurati (ixtiyoriy)</label>
                {newMedPhoto ? (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-2xs p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newMedPhoto} alt="Mahsulot fotosurati" className="w-full h-full object-contain" />
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
                <label className="font-bold text-zinc-700 block mb-1">Mahsulot nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bento Max, Bi-58, Envidor, Vitamin B12..."
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Toifasi</label>
                  <select
                    value={newMedType}
                    onChange={(e) => setNewMedType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 bg-white"
                  >
                    <option value="crop">🌾 Ekinlar uchun</option>
                    <option value="animal">🐾 Chorva uchun</option>
                    <option value="general">Umumiy vosita</option>
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
                    <option value="qop">Qop</option>
                    <option value="quti">Quti</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Partiya raqami (ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="Masalan: P-2026-04"
                    value={newMedBatchNo}
                    onChange={(e) => setNewMedBatchNo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Yaroqlilik muddati</label>
                  <input
                    type="date"
                    value={newMedExpiryDate}
                    onChange={(e) => setNewMedExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-zinc-400"
                  />
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
                  onClick={() => {
                    setShowAddMedModal(false);
                    setEditingMedId(null);
                  }}
                  className="flex-1 rounded-xl bg-zinc-100 py-2.5 font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingMed}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {savingMed ? "Saqlanmoqda..." : editingMedId !== null ? "Yangilash" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4B. MODAL: TEZKOR KASSA (POS SOTUV — NAQD / KARTA / NASIYA) */}
      {showPosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-zinc-50/90">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">Tezkor Kassa (Do&apos;kon sotuvi)</h3>
                  <p className="text-[10px] text-zinc-500">Qoldiq avto-kamayadi, nasiya qarz daftariga yoziladi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPosModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/60"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePosSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">Sotilayotgan mahsulot *</label>
                <select
                  required
                  value={posMedId}
                  onChange={(e) => setPosMedId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-zinc-900 bg-white font-medium"
                >
                  <option value="">— Ombordan mahsulot tanlang —</option>
                  {medicines
                    .filter((m) => m.stock > 0)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.price ? `${m.price.toLocaleString()} so'm` : "Kelishuv"} (Qoldiq: {m.stock} {m.stockUnit})
                      </option>
                    ))}
                </select>
                {medicines.filter((m) => m.stock > 0).length === 0 && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Omborda qoldig&apos;i bor mahsulot yo&apos;q. Avval &quot;Mahsulot qo&apos;shish&quot; orqali tovar kiriting.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Miqdori *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={posQty}
                    onChange={(e) => setPosQty(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-zinc-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Jami summa</label>
                  <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono font-black text-emerald-700">
                    {(() => {
                      const med = medicines.find((m) => m.id === Number(posMedId));
                      const total = (med?.price || 0) * (Math.max(1, Number(posQty) || 1));
                      return `${total.toLocaleString()} so'm`;
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1.5">To&apos;lov usuli</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "naqd", label: "Naqd", Icon: Banknote },
                    { id: "karta", label: "Karta", Icon: CreditCard },
                    { id: "nasiya", label: "Nasiya (Qarz)", Icon: HandCoins },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPosPaymentMethod(id as any)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-2 font-bold border transition ${
                        posPaymentMethod === id
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Mijoz ismi {posPaymentMethod === "nasiya" ? "*" : "(ixtiyoriy)"}
                  </label>
                  <input
                    type="text"
                    required={posPaymentMethod === "nasiya"}
                    placeholder="Masalan: Rustam aka"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Telefon raqami</label>
                  <input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={posCustomerPhone}
                    onChange={(e) => setPosCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPosModal(false)}
                  className="flex-1 rounded-xl bg-zinc-100 py-2.5 font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={posSaving || !posMedId}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {posSaving ? "Saqlanmoqda..." : "Sotuvni tasdiqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4C. MODAL: MUTAXASSIS KO'RIK XULOSASI VA RETSEPT */}
      {completeCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 bg-zinc-50/90">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Chaqiruvni yakunlash & Ko&apos;rik xulosasi</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Mijoz: <b>{completeCallModal.customerName}</b> (#{completeCallModal.id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteCallModal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200/60"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCallAction(completeCallModal.id, "done", callConclusion);
              }}
              className="p-5 space-y-3.5 text-xs"
            >
              <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-3 text-zinc-700">
                <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-0.5">Murojaat mazmuni:</span>
                {completeCallModal.problem}
              </div>

              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Ko&apos;rik xulosasi va tavsiya etilgan vositalar (Retsept)
                </label>
                <textarea
                  rows={4}
                  placeholder="Masalan: Tashxis tasdiqlandi. Kuniga 2 mahal Vitamin B12 va Bento Max ozuqa qo'shimchasi tavsiya etildi..."
                  value={callConclusion}
                  onChange={(e) => setCallConclusion(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteCallModal(null)}
                  className="flex-1 rounded-xl bg-zinc-100 py-2.5 font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionBusyId === completeCallModal.id}
                  className="flex-1 rounded-xl bg-zinc-900 hover:bg-black py-2.5 font-bold text-white shadow-xs disabled:opacity-50"
                >
                  {actionBusyId === completeCallModal.id ? "Saqlanmoqda..." : "Saqlash va Yakunlash"}
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

      {/* Rasmiy Xizmat Ko'rsatish Shartnomasi Modali (Kabinet ichida ham ko'rish uchun) */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl my-auto rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowContractModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition"
              title="Yopish"
            >
              <X size={16} />
            </button>

            <div className="border-b border-zinc-100 pb-3">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase bg-zinc-100 px-2.5 py-0.5 rounded-full">
                Rasmiy Hujjat
              </span>
              <h3 className="text-lg font-black text-zinc-900 mt-2">
                AgrozGO Business Axborot Tizimidan Foydalanish Bo‘yicha Ommaviy Oferta va Xizmat Ko‘rsatish Shartnomasi
              </h3>
            </div>

            <div className="space-y-4 text-xs text-zinc-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <section className="space-y-1">
                <h4 className="font-bold text-zinc-900">1. Umumiy qoidalar va shartnoma predmeti</h4>
                <p>
                  Ushbu Ommaviy Oferta AgrozGO platformasi orqali agro-do‘kon egalari va soha mutaxassislari (keyingi o‘rinlarda «Hamkor») uchun taqdim etiladigan ERP boshqaruv tizimi, ombor hisob-kitobi, kassa (POS) savdosi, qarz daftari va fermerlar bilan aloqa o‘rnatish xizmatlarini tartibga soladi.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-zinc-900">2. 1 Oylik Bepul Sinov Davri (Trial Period)</h4>
                <p>
                  2.1. Yangi ro‘yxatdan o‘tgan barcha Hamkorlarga dastlabki <b>30 (o‘ttiz) kalendar kuni</b> davomida AgrozGO Business tizimidan to‘liq va bepul (0 so‘m) foydalanish huquqi taqdim etiladi.
                </p>
                <p>
                  2.2. Bepul sinov davrida Hamkor barcha ERP funksiyalaridan (ombor, kassa, qarz daftari, bronlar) cheklovsiz foydalanishi mumkin.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-zinc-900">3. Tariflar va Oylik Obuna To‘lovi</h4>
                <p>
                  3.1. 1 oylik bepul sinov muddati yakunlangach, platformadan foydalanish oylik <b>149 000 (bir yuz qirq to‘qqiz ming) so‘m</b> miqdorida to‘lov asosida amalga oshiriladi.
                </p>
                <p>
                  3.2. To‘lov Click, Payme yoki bank kartasi orqali har oy muddatidan oldin amalga oshirilishi lozim.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-zinc-900">4. Telegram Bot Orqali Ogohlantirish Tartibi</h4>
                <p>
                  4.1. Hamkorning 1 oylik sinov muddati yoki oylik obuna muddati tugashiga <b>5 (besh) kun</b> qolganda, AgrozGO avtomatlashtirilgan tizimi Hamkorning ulangan Telegram hisobiga (@agroz_auth_bot) to‘lov kuni haqida rasmiy ogohlantirish xabarini yuboradi.
                </p>
                <p>
                  4.2. Ushbu ogohlantirishlarni o‘z vaqtida qabul qilish uchun Hamkor rasmiy Telegram botni ulashi shart.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-zinc-900">5. To‘lov Amalga Oshirilmaganda Baza Faoliyatini To‘xtatish (Qulflash)</h4>
                <p>
                  5.1. Sinov muddati yoki to‘langan obuna davri yakunlangach, agar yangi davr uchun to‘lov amalga oshirilmasa, Hamkorning boshqaruv kabineti va bazasi vaqtincha to‘xtatiladi (qulflanadi).
                </p>
                <p>
                  5.2. Qulflangan davrda Hamkorning kiritgan mahsulotlari, buyurtmalari va qarz daftari yozuvlari o‘chirilmaydi va to‘lov amalga oshirilishi bilanoq avtomatik tarzda qayta tiklanadi.
                </p>
              </section>

              <section className="space-y-1">
                <h4 className="font-bold text-zinc-900">6. Qonuniy Asoslar va Maxfiylik</h4>
                <p>
                  Ushbu shartnoma O‘zbekiston Respublikasining Fuqarolik Kodeksi hamda «Shaxsiy ma’lumotlar to‘g‘risida»gi O‘RQ-547-sonli Qonuniga to‘liq mos holda tuzilgan. Ma’lumotlar xavfsiz va shifrlangan serverlarda saqlanadi.
                </p>
              </section>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowContractModal(false)}
                className="rounded-2xl bg-[#191B1F] hover:bg-black text-white text-xs font-bold px-6 py-2.5 transition active:scale-95"
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
