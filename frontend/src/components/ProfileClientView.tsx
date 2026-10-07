"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Check, Trash2, Shield, FileText } from "lucide-react";
import OrderTrackingStatusCard from "@/components/OrderTrackingStatusCard";
import SupportTicketsPanel from "@/components/SupportTicketsPanel";
import { AddToHomeScreenButton } from "@/components/HomeScreenPromptBanner";
import { getTelegramUser } from "@/lib/telegram";
import { apiUrl, apiFetch } from "@/lib/api-config";
import { loadLastOrder } from "@/lib/cart-store";
import { getSpecialistCalls, saveSpecialistCalls } from "@/lib/specialist-calls";
import { unregisterPushTokenOnBackend } from "@/lib/capacitor";

type UserProfile = {
  id?: number;
  name?: string | null;
  phone?: string | null;
  secondPhone?: string | null;
  region?: string | null;
  district?: string | null;
  telegramId?: number | null;
};

export default function ProfileClientView({ initialUser }: { initialUser?: UserProfile | null }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(initialUser ?? null);
  const [orders, setOrders] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | number | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Profil va real aktivliklarni (buyurtmalar, chaqiruvlar) yuklash
  useEffect(() => {
    // 1. Profil ma'lumotlarini yuklash (Telegram ID avtomatik uzatiladi)
    apiFetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setUser(data.user);
          if (data.user.name) {
            try { localStorage.setItem("agroz_customer_name", data.user.name); } catch {}
          }
          if (data.user.phone) {
            try { localStorage.setItem("agroz_customer_phone", data.user.phone); } catch {}
          }
        } else {
          // Serverda sessiya topilmasa, bot orqali avval kiritilgan ma'lumotlarni tekshiramiz
          try {
            const savedName = localStorage.getItem("agroz_customer_name");
            const savedPhone = localStorage.getItem("agroz_customer_phone");
            if (savedName || savedPhone) {
              setUser((prev) => ({
                id: prev?.id,
                name: savedName || prev?.name || null,
                phone: savedPhone || prev?.phone || null,
                telegramId: prev?.telegramId,
              }));
              return;
            }
          } catch {}
          setUser(null);
        }
      })
      .catch(() => {});

    // 2. Buyurtma va chaqiruvlarni yuklash (va real-time davriy yangilash)
    const loadActivity = () => {
      let storedPhone = "";
      try {
        storedPhone = localStorage.getItem("agroz_customer_phone") || "";
      } catch {}
      const phoneToUse = storedPhone || user?.phone || "";
      const url = phoneToUse
        ? `/api/profile/activity?phone=${encodeURIComponent(phoneToUse)}`
        : "/api/profile/activity";

      apiFetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.ok) {
            if (Array.isArray(data.orders)) setOrders(data.orders);
            if (Array.isArray(data.specialistCalls)) {
              setCalls(data.specialistCalls);

              // Serverdagi yangilangan holatlarni lokal ombor bilan ham sinxronlashtirish
              const localCalls = getSpecialistCalls();
              let changed = false;
              for (const sc of data.specialistCalls) {
                const match = localCalls.find((lc) => String(lc.id) === String(sc.id));
                if (match && match.status !== sc.status) {
                  match.status = sc.status;
                  changed = true;
                }
              }
              if (changed) saveSpecialistCalls(localCalls);
            }
          }
        })
        .catch(() => {});
    };

    loadActivity();
    const pollInterval = setInterval(loadActivity, 4000);
    return () => clearInterval(pollInterval);
  }, [user?.phone]);

  // Mahaliy (local) buyurtma va chaqiruvlarni birlashtirish (faqat real ma'lumotlar)
  const displayOrders = useMemo(() => {
    const list = [...orders];
    const last = loadLastOrder();
    if (last && !list.some((o) => o.id === last.id)) {
      list.unshift({
        id: last.id,
        totalSum: last.total,
        status: "yangi",
        deliveryType: last.deliveryType,
        pharmacyName: last.pharmacyName,
        customerAddress: last.customerAddress,
        items: last.items || [],
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [orders]);

  const displayCalls = useMemo(() => {
    const list = [...calls];
    const localCalls = getSpecialistCalls();
    for (const lc of localCalls) {
      const matchIndex = list.findIndex((c) => String(c.id) === String(lc.id));
      if (matchIndex >= 0) {
        list[matchIndex] = {
          ...lc,
          ...list[matchIndex],
          status: list[matchIndex].status || lc.status,
        };
      } else {
        list.unshift(lc);
      }
    }
    return list;
  }, [calls]);

  const handleToggleCall = (callId: string | number) => {
    if (expandedCallId === callId) {
      setExpandedCallId(null);
    } else {
      setExpandedCallId(callId);
      // Darhol serverdan chaqiruv holatini yangilash
      let storedPhone = "";
      try {
        storedPhone = localStorage.getItem("agroz_customer_phone") || "";
      } catch {}
      const query = storedPhone ? `?phone=${encodeURIComponent(storedPhone)}` : "";
      fetch(apiUrl(`/api/specialists/call/${callId}/status${query}`))
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok && d?.status) {
            setCalls((prev) =>
              prev.map((c) => (String(c.id) === String(callId) ? { ...c, status: d.status } : c))
            );
            const localCalls = getSpecialistCalls();
            const target = localCalls.find((c) => String(c.id) === String(callId));
            if (target && target.status !== d.status) {
              target.status = d.status;
              saveSpecialistCalls(localCalls);
            }
          }
        })
        .catch(() => {});
    }
  };

  const displayName = user?.name?.trim() || "Sizning ismingiz";
  const displayPhone = user?.phone || "Telefon raqam kiritilmagan";
  const authSource = user?.telegramId ? "· Telegramdan" : "· Saytdan";

  const displayAddress = useMemo(() => {
    if (user?.region || user?.district) {
      return [user.region, user.district].filter(Boolean).join(", ");
    }
    try {
      const saved = localStorage.getItem("agroz_customer_address");
      if (saved) return saved;
    } catch {}
    return "Manzil kiritilmagan";
  }, [user]);

  // Ism bosh harflari (SI, SS ...)
  const initials = useMemo(() => {
    if (!displayName || displayName === "Sizning ismingiz") return "SI";
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await unregisterPushTokenOnBackend().catch(() => {});
      await apiFetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {}

    try {
      localStorage.removeItem("agroz_session");
      localStorage.removeItem("agroz_user");
      sessionStorage.clear();
      if (typeof document !== "undefined") {
        document.cookie = "agroai_session=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
        document.cookie = "agroz_session=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
      }
    } catch {}

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.close === "function") {
        tg.close();
      }
    } catch {}

    window.location.href = "/kirish";
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await unregisterPushTokenOnBackend().catch(() => {});
      await apiFetch("/api/profile", {
        method: "DELETE",
      });
      await apiFetch("/api/auth/delete-account", {
        method: "DELETE",
      }).catch(() => {});
    } catch {}

    try {
      localStorage.clear();
      sessionStorage.clear();
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        }
      }
    } catch {}

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.close === "function") {
        tg.close();
      }
    } catch {}

    window.location.href = "/kirish";
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-5 pt-8 pb-32 text-neutral-900 max-w-[500px] mx-auto animate-in fade-in duration-200">
      {/* 1. Foydalanuvchi ma'lumoti bosh qismi (Light UI) */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#039e1e] text-[20px] font-bold shadow-2xs">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-neutral-900 tracking-tight leading-snug truncate">
            {displayName}
          </h1>
          <p className="text-[14px] text-neutral-500 font-normal mt-0.5 truncate">
            {displayPhone} {authSource}
          </p>
        </div>
      </div>

      {/* 2. Manzil kartochkasi */}
      <div className="mt-5 rounded-2xl bg-white border border-neutral-200/90 p-4 shadow-2xs">
        <p className="text-[13px] text-neutral-500 font-normal">Manzil</p>
        <p className="text-[15.5px] font-bold text-neutral-900 mt-0.5">
          {displayAddress}
        </p>
      </div>

      {/* 2.5. Telefon ekraniga qo'shish (1-bosishda) */}
      <AddToHomeScreenButton variant="profile" />

      {/* 3. Buyurtmalarim bo'limi */}
      <div className="mt-6">
        <h2 className="text-[18px] font-bold text-neutral-900 mb-2.5">
          Buyurtmalarim
        </h2>

        {displayOrders.length === 0 ? (
          <div className="rounded-2xl bg-white border border-neutral-200/90 p-5 text-center text-neutral-500 shadow-2xs">
            <p className="text-[14.5px] font-medium">Hozircha buyurtmalar mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayOrders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const formattedTotal = Number(order.totalSum || order.total || 0)
                .toLocaleString("ru-RU")
                .replace(/\u00a0/g, " ");

              const statusLabel =
                order.status === "yangi"
                  ? "Yuborildi"
                  : order.status === "tasdiqlandi"
                  ? "Qabul qilindi"
                  : order.status === "yolda"
                  ? "Yo'lda"
                  : order.status === "yetkazildi"
                  ? (order.deliveryType === "pickup" ? "Olib ketildi" : "Yetkazildi")
                  : order.status === "bekor"
                  ? "Bekor qilingan"
                  : "Yuborildi";

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl bg-white border border-neutral-200/90 transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 active:scale-[0.99] transition"
                  >
                    <div>
                      <p className="text-[16px] font-bold text-neutral-900 tracking-tight">
                        #{order.id} · {formattedTotal} so&apos;m
                      </p>
                      <p className="text-[13px] text-neutral-500 font-medium mt-0.5">
                        {statusLabel}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-neutral-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-[#039e1e]" : ""
                      }`}
                    />
                  </button>

                  {/* Bosilganda to'liq 4 bosqichli kuzatuv paneli ochiladi */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 bg-neutral-50/70 p-4 animate-in fade-in duration-200">
                      <OrderTrackingStatusCard
                        orderId={order.id}
                        status={order.status || "yangi"}
                        totalSum={Number(order.totalSum || order.total || 0)}
                        items={order.items || []}
                        deliveryType={order.deliveryType}
                        customerAddress={order.customerAddress}
                        pharmacyName={order.pharmacyName}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Chaqiruvlarim bo'limi */}
      <div className="mt-6">
        <h2 className="text-[18px] font-bold text-neutral-900 mb-2.5">
          Chaqiruvlarim
        </h2>

        {displayCalls.length === 0 ? (
          <div className="rounded-2xl bg-white border border-neutral-200/90 p-5 text-center text-neutral-500 shadow-2xs">
            <p className="text-[14.5px] font-medium">Hozircha mutaxassis chaqiruvlari mavjud emas</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayCalls.map((call) => {
              const isExpanded = expandedCallId === call.id;
              const isDone = call.status === "completed" || call.status === "bajarildi";
              const isAccepted = call.status === "tasdiqlandi" || call.status === "qabul_qilindi" || isDone;

              const statusLabel =
                call.status === "pending" || call.status === "yangi"
                  ? "So'rov yuborildi"
                  : call.status === "tasdiqlandi" || call.status === "qabul_qilindi"
                  ? "Qabul qilindi"
                  : isDone
                  ? "Yakunlandi"
                  : "So'rov yuborildi";

              return (
                <div
                  key={call.id}
                  className="overflow-hidden rounded-2xl bg-white border border-neutral-200/90 transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleCall(call.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 active:scale-[0.99] transition"
                  >
                    <div>
                      <p className="text-[16px] font-bold text-neutral-900 tracking-tight">
                        #{call.id} · {call.specialistSpecialty ? `${call.specialistSpecialty} ` : ""}{call.specialistName || "Mutaxassis"}
                      </p>
                      <p className="text-[13px] text-neutral-500 font-medium mt-0.5">
                        {statusLabel}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-neutral-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-90 text-[#039e1e]" : ""
                      }`}
                    />
                  </button>

                  {/* Bosilganda faqat tarix va 3 bosqichli status ma'lumotlari ochiladi (qayta chaqiruv so'rovi yuborilmaydi) */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 bg-neutral-50/70 p-4 animate-in fade-in duration-200 space-y-4">
                      {/* 3 ta bosqich (faqat tarixni ko'rish uchun) */}
                      <div className="rounded-2xl bg-white border border-neutral-200/90 p-4 space-y-3.5 shadow-2xs">
                        {/* 1-bosqich: So'rov yuborildi */}
                        <div className="relative flex items-center gap-3">
                          <div className="absolute left-[13px] top-[26px] h-4 w-[2px] bg-[#039e1e]" />
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                            <Check size={16} strokeWidth={3} />
                          </div>
                          <span className="text-[14.5px] font-bold text-neutral-900">
                            So&apos;rov yuborildi
                          </span>
                        </div>

                        {/* 2-bosqich: Qabul qilindi */}
                        <div className="relative flex items-center gap-3">
                          <div
                            className={`absolute left-[13px] top-[26px] h-4 w-[2px] ${
                              isDone ? "bg-[#039e1e]" : "bg-neutral-200"
                            }`}
                          />
                          {isAccepted ? (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                              <Check size={16} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100" />
                          )}
                          <span
                            className={`text-[14.5px] ${
                              isAccepted ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                            }`}
                          >
                            Qabul qilindi
                          </span>
                        </div>

                        {/* 3-bosqich: Yakunlandi */}
                        <div className="relative flex items-center gap-3">
                          {isDone ? (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#039e1e] text-white shadow-xs">
                              <Check size={16} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100" />
                          )}
                          <span
                            className={`text-[14.5px] ${
                              isDone ? "font-bold text-neutral-900" : "font-medium text-neutral-400"
                            }`}
                          >
                            Yakunlandi
                          </span>
                        </div>
                      </div>

                      {/* Qo'shimcha ma'lumotlar bloki */}
                      <div className="rounded-2xl bg-white border border-neutral-200/90 p-3.5 text-[13.5px] text-neutral-600 space-y-1.5 shadow-2xs">
                        {(call.specialistPhone || call.phone) && (
                          <p className="flex items-center justify-between">
                            <span className="text-neutral-500">Mutaxassis telefoni:</span>
                            <a href={`tel:${String(call.specialistPhone || call.phone).replace(/[^\d+]/g, "")}`} className="font-bold text-[#039e1e] hover:underline">
                              {call.specialistPhone || call.phone}
                            </a>
                          </p>
                        )}
                        {call.address && (
                          <p className="flex items-center justify-between">
                            <span className="text-neutral-500">Manzil:</span>
                            <span className="font-semibold text-neutral-800 text-right">{call.address}</span>
                          </p>
                        )}
                        {call.problem && (
                          <p className="pt-1 text-[12.5px] text-neutral-500 border-t border-neutral-100">
                            Masala: <span className="text-neutral-700 font-medium">{call.problem}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Yordam / Bog'lanish (Support Tickets) bo'limi */}
      <SupportTicketsPanel />

      {/* 6. Huquqiy ma'lumotlar va maxfiylik (Apple / Google talabi) */}
      <div className="mt-8 pt-4 border-t border-neutral-200/80">
        <h4 className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5">
          Qoidalar va Maxfiylik
        </h4>
        <div className="bg-white rounded-2xl border border-neutral-200/70 overflow-hidden divide-y divide-neutral-100">
          <Link
            href="/maxfiylik"
            className="flex items-center justify-between p-3.5 hover:bg-neutral-50 transition text-neutral-700"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-emerald-600" />
              <span className="text-[14px] font-medium">Maxfiylik siyosati</span>
            </div>
            <ChevronRight size={16} className="text-neutral-400" />
          </Link>
          <Link
            href="/shartlar"
            className="flex items-center justify-between p-3.5 hover:bg-neutral-50 transition text-neutral-700"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-emerald-600" />
              <span className="text-[14px] font-medium">Foydalanish shartlari</span>
            </div>
            <ChevronRight size={16} className="text-neutral-400" />
          </Link>
        </div>
      </div>

      {/* 7. Profil amallari: Chiqish va Hisobni o'chirish */}
      <div className="mt-6 pt-4 border-t border-neutral-200/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 text-[14px] font-medium text-neutral-600 hover:text-neutral-900 transition"
          >
            <LogOut size={16} />
            <span>Tizimdan chiqish</span>
          </button>
          <Link
            href="/dorilar"
            className="text-[13px] font-semibold text-[#039e1e] hover:underline"
          >
            Dorilar katalogi &rarr;
          </Link>
        </div>

        {/* Apple App Store majburiy talabi: Hisobni o'chirish (Delete Account) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-[13.5px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50/70 px-2.5 py-1.5 rounded-lg -ml-2.5 transition"
          >
            <Trash2 size={15} />
            <span>Hisobni butunlay o&apos;chirish</span>
          </button>
        </div>
      </div>

      {/* Tizimdan chiqishni tasdiqlash modali */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-[24px] bg-white p-6 shadow-xl border border-neutral-100 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 mb-4">
              <LogOut size={26} className="stroke-[2.2]" />
            </div>

            <h3 className="text-[19px] font-bold text-neutral-900 tracking-tight">
              Tizimdan chiqishni tasdiqlaysizmi?
            </h3>

            <p className="mt-2 text-[14px] text-neutral-500 leading-relaxed">
              Profildan chiqiladi va keyingi safar qayta tizimga kirishingiz kerak bo&apos;ladi.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-xl border border-neutral-300 py-3 text-[14.5px] font-bold text-neutral-700 hover:bg-neutral-100 active:scale-95 transition disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="rounded-xl bg-neutral-800 py-3 text-[14.5px] font-bold text-white hover:bg-neutral-900 active:scale-95 transition shadow-xs disabled:opacity-50"
              >
                {isLoggingOut ? "Chiqilmoqda..." : "Ha, chiqish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hisobni butunlay o'chirish (Account Deletion) modali - Apple App Store Guideline 5.1.1 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isDeletingAccount && setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-[24px] bg-white p-6 shadow-xl border border-red-100 text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <Trash2 size={26} className="stroke-[2.2]" />
            </div>

            <h3 className="text-[19px] font-bold text-neutral-900 tracking-tight">
              Hisobni o&apos;chirishni tasdiqlaysizmi?
            </h3>

            <p className="mt-2 text-[13.5px] text-neutral-600 leading-relaxed text-left bg-red-50/60 p-3 rounded-xl border border-red-100">
              ⚠️ <b>Diqqat:</b> Hisobingiz o&apos;chirilganda buyurtmalar tarixi, qishloq xo&apos;jalik tahlillari va barcha shaxsiy ma&apos;lumotlaringiz tizimdan butunlay o&apos;chiriladi. Bu amalni ortga qaytarib bo&apos;lmaydi.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-neutral-300 py-3 text-[14.5px] font-bold text-neutral-700 hover:bg-neutral-100 active:scale-95 transition disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleConfirmDeleteAccount}
                className="rounded-xl bg-red-600 py-3 text-[14.5px] font-bold text-white hover:bg-red-700 active:scale-95 transition shadow-xs disabled:opacity-50"
              >
                {isDeletingAccount ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
