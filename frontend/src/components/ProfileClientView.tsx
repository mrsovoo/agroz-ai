"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Check } from "lucide-react";
import OrderTrackingStatusCard from "@/components/OrderTrackingStatusCard";
import SupportTicketsPanel from "@/components/SupportTicketsPanel";
import { AddToHomeScreenButton } from "@/components/HomeScreenPromptBanner";
import { getTelegramUser } from "@/lib/telegram";
import { apiUrl, apiFetch } from "@/lib/api-config";
import { loadLastOrder } from "@/lib/cart-store";
import { getSpecialistCalls } from "@/lib/specialist-calls";

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

  // Profil va real aktivliklarni (buyurtmalar, chaqiruvlar) yuklash
  useEffect(() => {
    // 1. Profil ma'lumotlarini yuklash (Telegram ID avtomatik uzatiladi)
    apiFetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setUser(data.user);
        } else {
          const tg = getTelegramUser();
          if (tg) {
            const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(" ");
            setUser({
              id: tg.id,
              name: fullName || tg.username || "Sizning ismingiz",
              phone: null,
              telegramId: tg.id,
            });
          }
        }
      })
      .catch(() => {});

    // 2. Buyurtma va chaqiruvlarni yuklash
    apiFetch("/api/profile/activity")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok) {
          if (Array.isArray(data.orders)) setOrders(data.orders);
          if (Array.isArray(data.specialistCalls)) setCalls(data.specialistCalls);
        }
      })
      .catch(() => {});
  }, []);

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
      if (!list.some((c) => String(c.id) === String(lc.id))) {
        list.unshift(lc);
      }
    }
    return list;
  }, [calls]);

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
      await apiFetch("/api/profile", {
        method: "DELETE",
      });
    } catch {}

    try {
      // 1. Mahalliy barcha saqlangan ma'lumotlar va amallarni to'liq tozalash
      localStorage.clear();
      sessionStorage.clear();

      // 2. Cookie fayllarini tozalash
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        }
      }
    } catch {}

    // 3. Telegram Mini App oynasini darhol yopish
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && typeof tg.close === "function") {
        tg.close();
      }
    } catch {}

    // 4. Ilovani bosh holatga to'liq yangilab ochish
    window.location.href = "/";
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
                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                    className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 active:scale-[0.99] transition"
                  >
                    <div>
                      <p className="text-[16px] font-bold text-neutral-900 tracking-tight">
                        #{call.id} · {call.specialistSpecialty ? `${call.specialistSpecialty} ` : ""}{call.specialistName || "Agronom B. Rahmonov"}
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
                        {call.phone && (
                          <p className="flex items-center justify-between">
                            <span className="text-neutral-500">Mutaxassis telefoni:</span>
                            <a href={`tel:${call.phone.replace(/[^\d+]/g, "")}`} className="font-bold text-[#039e1e] hover:underline">
                              {call.phone}
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

      {/* 6. Pastki qo'shimcha amallar (Chiqish) */}
      <div className="mt-9 pt-4 border-t border-neutral-200/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-2 text-[14px] font-medium text-neutral-500 hover:text-red-500 transition"
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
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
              <LogOut size={26} className="stroke-[2.2]" />
            </div>

            <h3 className="text-[19px] font-bold text-neutral-900 tracking-tight">
              Tizimdan chiqishni tasdiqlaysizmi?
            </h3>

            <p className="mt-2 text-[14px] text-neutral-500 leading-relaxed">
              Profildan chiqish bo&apos;ladi va barcha mahalliy ma&apos;lumotlar hamda amallar o&apos;chiriladi. Shuni tasdiqlaysizmi?
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
                className="rounded-xl bg-red-600 py-3 text-[14.5px] font-bold text-white hover:bg-red-700 active:scale-95 transition shadow-xs disabled:opacity-50"
              >
                {isLoggingOut ? "Chiqilmoqda..." : "Ha, chiqish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
