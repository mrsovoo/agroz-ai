"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Store,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  Truck,
  User,
  LogOut,
  Edit3,
  Save,
  X,
  ChevronRight,
  Sparkles,
  Wheat,
  Warehouse,
  Sprout,
  Wrench,
  Loader2,
  RefreshCw,
  Send,
  ExternalLink,
  Package,
  HandCoins,
  Users,
  ShoppingCart,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";
import ProductsCatalogSection from "@/components/ProductsCatalogSection";
import DebtsSection from "@/components/DebtsSection";
import CustomersSection from "@/components/CustomersSection";
import PosSection from "@/components/PosSection";

export type MerchantType =
  | "agro_shop"
  | "veterinary_pharmacy"
  | "feed_store"
  | "warehouse"
  | "seed_seedling_store"
  | "equipment_store";

export interface Merchant {
  id: number;
  telegramId: number | null;
  phone: string;
  name: string;
  organizationName: string;
  merchantType: MerchantType;
  region?: string | null;
  district?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  workingHours?: string | null;
  deliveryAvailable: boolean;
  status: "pending" | "active" | "blocked";
  createdAt: string;
  updatedAt: string;
}

const MERCHANT_TYPE_META: Record<
  MerchantType,
  { label: string; desc: string; icon: typeof Store; color: string }
> = {
  agro_shop: {
    label: "Agro-do‘kon",
    desc: "Urug‘, mineral o‘g‘itlar, kimyoviy himoya vositalari va preparatlar",
    icon: Store,
    color: "emerald",
  },
  veterinary_pharmacy: {
    label: "Veterinar dorixona",
    desc: "Chorva va parrandalar uchun vaksinalar, dori-darmon va vitaminlar",
    icon: Sparkles,
    color: "blue",
  },
  feed_store: {
    label: "Yem-ozuqa do‘koni",
    desc: "Kombikorm, kepak, bento, bug‘doy, makkajo‘xori va ozuqa qo‘shimchalari",
    icon: Wheat,
    color: "amber",
  },
  warehouse: {
    label: "Ombor va ulgurji savdo",
    desc: "Katta partiyali qishloq xo‘jaligi mahsulotlari ombori",
    icon: Warehouse,
    color: "indigo",
  },
  seed_seedling_store: {
    label: "Urug‘ va ko‘chat do‘koni",
    desc: "Meva, sabzavot, poliz urug‘lari, nihollar va ko‘chatlar",
    icon: Sprout,
    color: "green",
  },
  equipment_store: {
    label: "Qishloq xo‘jaligi jihozlari",
    desc: "Texnika, ehtiyot qismlar, nasoslar va sug‘orish uskunalari",
    icon: Wrench,
    color: "purple",
  },
};

const UZBEKISTAN_REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg‘ona viloyati",
  "Jizzax viloyati",
  "Xorazm viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Qoraqalpog‘iston Respublikasi",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
];

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) {
    return `+998 (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10, 12)}`;
  }
  return phone;
}

export default function BiznesGoPage() {
  const [loading, setLoading] = useState(true);
  const [initDataString, setInitDataString] = useState<string>("");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [viewState, setViewState] = useState<
    "loading" | "browser_landing" | "not_registered" | "dashboard"
  >("loading");
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Ro'yxatdan o'tish formasi holatlari
  const [regMerchantType, setRegMerchantType] = useState<MerchantType>("agro_shop");
  const [regName, setRegName] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [regPhone, setRegPhone] = useState("+998 ");
  const [regRegion, setRegRegion] = useState("Toshkent viloyati");
  const [regDistrict, setRegDistrict] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regWorkingHours, setRegWorkingHours] = useState("08:00 - 18:00");
  const [regDelivery, setRegDelivery] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Profil tahrirlash holatlari
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editOrgName, setEditOrgName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editMerchantType, setEditMerchantType] = useState<MerchantType>("agro_shop");
  const [editRegion, setEditRegion] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editWorkingHours, setEditWorkingHours] = useState("");
  const [editDelivery, setEditDelivery] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Dashboard bo'limlari va Telegram BackButton boshqaruvi
  const [activeTab, setActiveTab] = useState<"pos" | "products" | "debts" | "customers" | "profile">("pos");
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const closePosModalRef = useRef<(() => void) | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const closeProductModalRef = useRef<(() => void) | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const closeDebtModalRef = useRef<(() => void) | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const closeCustomerModalRef = useRef<(() => void) | null>(null);

  const handlePosModalStateChange = useCallback((isOpen: boolean, closeFn: () => void) => {
    setIsPosModalOpen(isOpen);
    closePosModalRef.current = closeFn;
  }, []);

  const handleProductModalStateChange = useCallback((isOpen: boolean, closeFn: () => void) => {
    setIsProductModalOpen(isOpen);
    closeProductModalRef.current = closeFn;
  }, []);

  const handleDebtModalStateChange = useCallback((isOpen: boolean, closeFn: () => void) => {
    setIsDebtModalOpen(isOpen);
    closeDebtModalRef.current = closeFn;
  }, []);

  const handleCustomerModalStateChange = useCallback((isOpen: boolean, closeFn: () => void) => {
    setIsCustomerModalOpen(isOpen);
    closeCustomerModalRef.current = closeFn;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = (window as any).Telegram?.WebApp;
    const backBtn = tg?.BackButton;
    if (!backBtn) return;

    const shouldShowBack =
      viewState === "dashboard" &&
      (isPosModalOpen ||
        isProductModalOpen ||
        isDebtModalOpen ||
        isCustomerModalOpen ||
        isEditingProfile ||
        activeTab !== "pos");

    const handleBackClick = () => {
      if (isPosModalOpen && closePosModalRef.current) {
        closePosModalRef.current();
      } else if (isProductModalOpen && closeProductModalRef.current) {
        closeProductModalRef.current();
      } else if (isDebtModalOpen && closeDebtModalRef.current) {
        closeDebtModalRef.current();
      } else if (isCustomerModalOpen && closeCustomerModalRef.current) {
        closeCustomerModalRef.current();
      } else if (isEditingProfile) {
        setIsEditingProfile(false);
      } else if (activeTab !== "pos") {
        setActiveTab("pos");
      }
    };

    if (shouldShowBack) {
      backBtn.show?.();
      backBtn.onClick?.(handleBackClick);
    } else {
      backBtn.hide?.();
    }

    return () => {
      backBtn.offClick?.(handleBackClick);
    };
  }, [
    viewState,
    isPosModalOpen,
    isProductModalOpen,
    isDebtModalOpen,
    isCustomerModalOpen,
    isEditingProfile,
    activeTab,
  ]);

  // Dastlabki yuklanish: Telegram initData yoki saqlangan sessiyani tekshirish
  useEffect(() => {
    async function initializeAuth() {
      setLoading(true);
      let initData = "";

      if (typeof window !== "undefined") {
        try {
          const tg = (window as any).Telegram?.WebApp;
          if (tg) {
            tg.ready?.();
            tg.expand?.();
            initData = tg.initData || "";
          }
        } catch {
          // ignore
        }
      }

      setInitDataString(initData);

      // 1. Agar Telegram initData mavjud bo'lsa -> serverga tekshiruvga yuboramiz
      if (initData) {
        try {
          const res = await apiFetch("/api/biznesgo/auth/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
          });

          const data = await res.json().catch(() => null);

          if (res.ok && data?.ok) {
            if (data.registered && data.merchant) {
              if (data.token) {
                localStorage.setItem("agroz_biznesgo_token", data.token);
              }
              setMerchant(data.merchant);
              setViewState("dashboard");
            } else {
              // Ro'yxatdan o'tmagan Telegram foydalanuvchisi
              setTelegramUser(data.telegramUser);
              if (data.telegramUser?.firstName) {
                setRegName(
                  `${data.telegramUser.firstName} ${data.telegramUser.lastName || ""}`.trim()
                );
              }
              setViewState("not_registered");
            }
            setLoading(false);
            return;
          } else {
            // Telegram initData tekshiruvdan o'tmadi (masalan, 401)
            setAuthErrorMessage(
              data?.error ||
                "Telegram orqali avtorizatsiyadan o'tib bo'lmadi. Iltimos, Telegram bot orqali qaytadan kiring."
            );
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Telegram auth failed:", err);
          setAuthErrorMessage("Serverga ulanishda xatolik yuz berdi. Internet aloqasini tekshiring.");
          setLoading(false);
          return;
        }
      }

      // 2. Agar Telegram initData bo'lmasa, saqlangan sessiya tokenni /auth/me orqali tekshiramiz
      const savedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("agroz_biznesgo_token") ||
            localStorage.getItem("agroz_business_token")
          : null;

      if (savedToken) {
        try {
          const res = await apiFetch("/api/biznesgo/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          const data = await res.json().catch(() => null);

          if (res.ok && data?.ok && data.merchant) {
            setMerchant(data.merchant);
            setViewState("dashboard");
            setLoading(false);
            return;
          } else {
            // Eskirgan token
            localStorage.removeItem("agroz_biznesgo_token");
          }
        } catch {
          // ignore
        }
      }

      // 3. Agar Telegram tashqarisida (oddiy brauzerda) ochilgan bo'lsa
      setViewState("browser_landing");
      setLoading(false);
    }

    initializeAuth();
  }, []);

  // Ro'yxatdan o'tishni yuborish
  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError("Iltimos, ism-familiyangizni kiriting");
      return;
    }
    if (!regOrgName.trim()) {
      setRegError("Iltimos, do'koningiz yoki tashkilotingiz nomini kiriting");
      return;
    }
    const cleanDigits = regPhone.replace(/\D/g, "");
    if (cleanDigits.length < 9) {
      setRegError("Iltimos, to'liq telefon raqamingizni kiriting");
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await apiFetch("/api/biznesgo/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: initDataString,
          isDevDemo: !initDataString,
          merchantType: regMerchantType,
          name: regName.trim(),
          organizationName: regOrgName.trim(),
          phone: regPhone.trim(),
          region: regRegion,
          district: regDistrict.trim(),
          address: regAddress.trim(),
          workingHours: regWorkingHours.trim(),
          deliveryAvailable: regDelivery,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.merchant) {
        if (data.token) {
          localStorage.setItem("agroz_biznesgo_token", data.token);
        }
        setMerchant(data.merchant);
        setViewState("dashboard");
      } else {
        setRegError(data?.error || "Ro'yxatdan o'tishda xatolik yuz berdi");
      }
    } catch {
      setRegError("Server bilan bog'lanishda xatolik. Internet aloqasini tekshiring.");
    } finally {
      setSubmittingReg(false);
    }
  }

  // Profil tahrirlash rejimini ochish
  function openEditProfile() {
    if (!merchant) return;
    setEditName(merchant.name);
    setEditOrgName(merchant.organizationName);
    setEditPhone(merchant.phone);
    setEditMerchantType(merchant.merchantType);
    setEditRegion(merchant.region || "Toshkent viloyati");
    setEditDistrict(merchant.district || "");
    setEditAddress(merchant.address || "");
    setEditWorkingHours(merchant.workingHours || "08:00 - 18:00");
    setEditDelivery(merchant.deliveryAvailable);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);
    setIsEditingProfile(true);
  }

  // Profil o'zgarishlarini saqlash
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!editName.trim()) {
      setProfileErrorMsg("Ism bo'sh bo'lishi mumkin emas");
      return;
    }
    if (!editOrgName.trim()) {
      setProfileErrorMsg("Tashkilot nomi bo'sh bo'lishi mumkin emas");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await apiFetch("/api/biznesgo/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          organizationName: editOrgName.trim(),
          phone: editPhone.trim(),
          merchantType: editMerchantType,
          region: editRegion,
          district: editDistrict.trim(),
          address: editAddress.trim(),
          workingHours: editWorkingHours.trim(),
          deliveryAvailable: editDelivery,
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.merchant) {
        setMerchant(data.merchant);
        setIsEditingProfile(false);
        setProfileSuccessMsg("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(data?.error || "Saqlashda xatolik yuz berdi");
      }
    } catch {
      setProfileErrorMsg("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSavingProfile(false);
    }
  }

  // Tizimdan chiqish
  async function handleLogout() {
    if (!window.confirm("Haqiqatan ham kabinetdan chiqmoqchimisiz?")) return;
    try {
      await apiFetch("/api/biznesgo/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("agroz_biznesgo_token");
    localStorage.removeItem("agroz_business_token");
    setMerchant(null);
    setViewState(initDataString ? "not_registered" : "browser_landing");
  }

  // Dev rejimida tezkor sinov (Demo login)
  async function handleDevDemoLogin() {
    setLoading(true);
    try {
      const res = await apiFetch("/api/biznesgo/auth/dev-demo", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.merchant) {
        if (data.token) {
          localStorage.setItem("agroz_biznesgo_token", data.token);
        }
        setMerchant(data.merchant);
        setViewState("dashboard");
      } else {
        alert(data?.error || "Demo rejim faol emas.");
      }
    } catch {
      alert("Serverga ulanish xatosi");
    } finally {
      setLoading(false);
    }
  }

  // 1. Yuklanish holati
  if (loading || viewState === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
            B
          </div>
          <div className="flex items-center gap-2 text-zinc-600 text-xs font-semibold">
            <Loader2 size={16} className="animate-spin text-emerald-600" />
            <span>BiznesGO xavfsiz tizimiga ulanmoqda...</span>
          </div>
        </div>
      </div>
    );
  }

  // 1.1 Avtorizatsiya xatosi (masalan, noto'g'ri yoki eskirgan initData)
  if (authErrorMessage) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-red-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-black text-zinc-900">Avtorizatsiya muvaffaqiyatsiz bo‘ldi</h1>
            <p className="text-xs text-zinc-600 leading-relaxed">{authErrorMessage}</p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setAuthErrorMessage(null);
                setLoading(true);
                window.location.reload();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
            >
              <RefreshCw size={16} />
              <span>Qaytadan urinish</span>
            </button>
            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={handleDevDemoLogin}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 py-2.5 text-xs font-semibold transition"
              >
                <span>Lokal test (Dev rejimda tekshirish)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Telegram tashqarisida (brauzerda) ochilganda ko'rinadigan landing
  if (viewState === "browser_landing") {
    const rawBotName =
      process.env.NEXT_PUBLIC_BIZNESGO_BOT_USERNAME ||
      process.env.NEXT_PUBLIC_TELEGRAM_AUTH_BOT_USERNAME ||
      "biznesgo_bot";
    const cleanBotName = rawBotName.replace(/^@/, "");

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-2xl shadow-inner">
            B
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              <ShieldCheck size={14} />
              <span>Xavfsiz Telegram Mini App</span>
            </div>
            <h1 className="text-xl font-black text-zinc-900">BiznesGO Boshqaruv Paneli</h1>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Agro-do‘konlar, veterinar dorixonalar, omborlar va urug‘-ko‘chat sotuvchilari uchun yagona biznes platformasi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-left space-y-2.5">
            <div className="text-xs font-bold text-zinc-800">Qulayliklar:</div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Telegram orqali 1-bosishda xavfsiz avtorizatsiya</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Agro-do‘kon va xizmatlarni boshqarish</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>Fermerlardan keladigan buyurtmalar nazorati</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`https://t.me/${cleanBotName}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
            >
              <Send size={16} />
              <span>Telegram Bot orqali ochish (@{cleanBotName})</span>
            </a>

            {process.env.NODE_ENV !== "production" && (
              <div className="pt-2 border-t border-zinc-100 flex flex-col gap-1.5">
                <div className="text-[11px] font-semibold text-zinc-400">Lokal sinov (Brauzer)</div>
                <button
                  type="button"
                  onClick={handleDevDemoLogin}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 py-2.5 text-xs font-semibold transition"
                >
                  <span>⚡️ Demo kabinetga kirish (Mavjud sotuvchi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegName("Lokal Sinov Egasi");
                    setRegOrgName("Lokal Sinov Do'koni");
                    setRegPhone("+998 90 123-45-67");
                    setViewState("not_registered");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 py-2 text-xs font-medium transition"
                >
                  <span>📝 Ro‘yxatdan o‘tish formasini sinash (Yangi sotuvchi)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Telegram orqali ochilgan, lekin hali ro'yxatdan o'tmagan sotuvchi (Onboarding)
  if (viewState === "not_registered") {
    return (
      <div className="min-h-screen bg-zinc-50 pb-12 pt-4 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              <Sparkles size={14} />
              <span>BiznesGO Hamkorlik Ro‘yxati</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900">
              Do‘koningizni tizimga ulang
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Do‘kon yoki mutaxassislik profilingizni kiriting va shaxsiy boshqaruv kabinetingizni oching.
            </p>
          </div>

          {regError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            {/* 1-Qadam: Faoliyat turi */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="text-xs sm:text-sm font-black text-zinc-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  1
                </span>
                <span>Faoliyat va do‘kon turini tanlang</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(MERCHANT_TYPE_META) as MerchantType[]).map((type) => {
                  const meta = MERCHANT_TYPE_META[type];
                  const Icon = meta.icon;
                  const isSelected = regMerchantType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRegMerchantType(type)}
                      className={`flex flex-col p-3.5 rounded-2xl border text-left transition relative ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                          : "border-zinc-200 bg-white hover:border-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        )}
                      </div>
                      <div className="text-xs font-bold text-zinc-900">{meta.label}</div>
                      <div className="text-[11px] text-zinc-500 leading-snug mt-0.5">
                        {meta.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Qadam: Asosiy ma'lumotlar */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="text-xs sm:text-sm font-black text-zinc-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                  2
                </span>
                <span>Do‘kon va mas‘ul shaxs ma‘lumotlari</span>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Do‘kon yoki tashkilot nomi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Aziya Agro Kimyo"
                    value={regOrgName}
                    onChange={(e) => setRegOrgName(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Mas‘ul shaxs (Ism-familiya) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ismingizni kiriting"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Telefon raqami *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123 45 67"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Viloyat</label>
                    <select
                      value={regRegion}
                      onChange={(e) => setRegRegion(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-xs sm:text-sm text-zinc-900 bg-white focus:outline-none focus:border-emerald-500"
                    >
                      {UZBEKISTAN_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Tuman</label>
                    <input
                      type="text"
                      placeholder="Masalan: Zangiota tumani"
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Aniq manzil yoki mo‘ljal
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Dehqon bozori 4-do'kon"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Ish vaqti</label>
                    <input
                      type="text"
                      placeholder="08:00 - 18:00"
                      value={regWorkingHours}
                      onChange={(e) => setRegWorkingHours(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="regDelivery"
                      checked={regDelivery}
                      onChange={(e) => setRegDelivery(e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300"
                    />
                    <label htmlFor="regDelivery" className="text-xs font-bold text-zinc-700 cursor-pointer">
                      Yetkazib berish xizmati bor
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingReg}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 text-xs sm:text-sm font-bold shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {submittingReg ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Kabinet yaratilmoqda...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Ro‘yxatdan o‘tish va Kabinetni ochish</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 4. Sotuvchi boshqaruv kabineti (Dashboard)
  const meta = merchant ? MERCHANT_TYPE_META[merchant.merchantType] || MERCHANT_TYPE_META.agro_shop : MERCHANT_TYPE_META.agro_shop;
  const MetaIcon = meta.icon;

  return (
    <div className="min-h-screen bg-zinc-50 pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              B
            </div>
            <div>
              <div className="text-xs font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
                <span>{merchant?.organizationName || "BiznesGO"}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  <ShieldCheck size={12} />
                  <span>Faol</span>
                </span>
              </div>
              <div className="text-[11px] text-zinc-500">{meta.label}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openEditProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
            >
              <Edit3 size={14} />
              <span className="hidden sm:inline">Tahrirlash</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-bold text-zinc-600 transition"
              title="Chiqish"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5">
        {/* Bo'limlar tab navigatsiyasi: Kassa | Mahsulotlar | Qarz daftari | Mijozlar | Profil */}
        <div className="grid grid-cols-5 gap-1 p-1 sm:p-1.5 rounded-2xl bg-zinc-200/70">
          <button
            type="button"
            onClick={() => setActiveTab("pos")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-black transition ${
              activeTab === "pos"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ShoppingCart size={15} />
            <span className="truncate">Kassa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-black transition ${
              activeTab === "products"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Package size={15} />
            <span className="truncate">Mahsulotlar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("debts")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-black transition ${
              activeTab === "debts"
                ? "bg-white text-red-600 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <HandCoins size={15} />
            <span className="truncate">Qarz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-black transition ${
              activeTab === "customers"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Users size={15} />
            <span className="truncate">Mijozlar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-2 px-1 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-black transition ${
              activeTab === "profile"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Store size={15} />
            <span className="truncate">Do‘kon</span>
          </button>
        </div>

        {/* Success message */}
        {profileSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        {activeTab === "pos" && (
          <PosSection
            initDataString={initDataString}
            onModalStateChange={handlePosModalStateChange}
            onNavigateToDebts={() => setActiveTab("debts")}
          />
        )}

        {activeTab === "products" && (
          <ProductsCatalogSection
            initDataString={initDataString}
            onModalStateChange={handleProductModalStateChange}
          />
        )}

        {activeTab === "debts" && (
          <DebtsSection
            initDataString={initDataString}
            onModalStateChange={handleDebtModalStateChange}
            onNavigateToCustomers={() => setActiveTab("customers")}
          />
        )}

        {activeTab === "customers" && (
          <CustomersSection
            initDataString={initDataString}
            onModalStateChange={handleCustomerModalStateChange}
            onNavigateToDebts={() => setActiveTab("debts")}
          />
        )}

        {activeTab === "profile" && (
          <>
            {/* Sotuvchi Profil Kartochkasi */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
                    <MetaIcon size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-zinc-900">
                      {merchant?.organizationName}
                    </h3>
                    <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{meta.label}</span>
                      <span>•</span>
                      <span>Mas‘ul: {merchant?.name}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openEditProfile}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition self-start sm:self-auto"
                >
                  <Edit3 size={14} />
                  <span>Ma‘lumotlarni o‘zgartirish</span>
                </button>
              </div>

              {/* Ma'lumotlar to'ri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Phone size={13} />
                    <span>Telefon raqami</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {merchant?.phone ? formatPhoneDisplay(merchant.phone) : "Kiritilmagan"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <MapPin size={13} />
                    <span>Hudud (Viloyat / Tuman)</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {merchant?.region || "O'zbekiston"}
                    {merchant?.district ? `, ${merchant.district}` : ""}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Ish vaqti</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {merchant?.workingHours || "08:00 - 18:00"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1 sm:col-span-2">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Building2 size={13} />
                    <span>Aniq manzil yoki mo‘ljal</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {merchant?.address || "Kiritilmagan"}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-1">
                  <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Truck size={13} />
                    <span>Yetkazib berish</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-800">
                    {merchant?.deliveryAvailable ? (
                      <span className="text-emerald-700 font-bold">Mavjud (Bor)</span>
                    ) : (
                      <span className="text-zinc-500">Mavjud emas</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Xavfsizlik va Sessiya holati */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-zinc-900">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Xavfsizlik va Telegram autentifikatsiyasi</span>
              </div>
              <div className="text-xs text-zinc-600 leading-relaxed space-y-1.5">
                <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Telegram hisob:</span>
                  <span className="font-bold text-zinc-800">
                    {merchant?.telegramId ? `ID: ${merchant.telegramId} (Tasdiqlangan)` : "Lokal sinov hisobi"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-zinc-100">
                  <span className="text-zinc-500">Sessiya holati:</span>
                  <span className="font-bold text-emerald-700">30 kunlik himoyalangan token faol</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-zinc-500">Ruxsat darajasi:</span>
                  <span className="font-bold text-zinc-800">Faqat o‘z do‘kon va mahsulotlarini boshqarish</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Profil tahrirlash Modal oynasi */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <Edit3 size={16} className="text-emerald-600" />
                <span>Profil ma‘lumotlarini tahrirlash</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {profileErrorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Do‘kon / Tashkilot nomi *
                </label>
                <input
                  type="text"
                  required
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Mas‘ul shaxs (Ism-familiya) *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Do‘kon turi</label>
                <select
                  value={editMerchantType}
                  onChange={(e) => setEditMerchantType(e.target.value as MerchantType)}
                  className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 bg-white focus:outline-none focus:border-emerald-500"
                >
                  {(Object.keys(MERCHANT_TYPE_META) as MerchantType[]).map((t) => (
                    <option key={t} value={t}>
                      {MERCHANT_TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Viloyat</label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-2.5 py-2.5 text-xs text-zinc-900 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {UZBEKISTAN_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Tuman</label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Manzil</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Ish vaqti</label>
                  <input
                    type="text"
                    value={editWorkingHours}
                    onChange={(e) => setEditWorkingHours(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="editDelivery"
                    checked={editDelivery}
                    onChange={(e) => setEditDelivery(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300"
                  />
                  <label htmlFor="editDelivery" className="text-xs font-bold text-zinc-700 cursor-pointer">
                    Yetkazib berish bor
                  </label>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Saqlash</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
