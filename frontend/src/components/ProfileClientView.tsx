"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Check } from "lucide-react";
import OrderTrackingStatusCard from "@/components/OrderTrackingStatusCard";
import SpecialistCallModal from "@/components/SpecialistCallModal";
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

const DEFAULT_ORDERS = [
  {
    id: 1001,
    totalSum: 85000,
    status: "yangi",
    deliveryType: "delivery",
    pharmacyName: "Agro Dorixona",
    customerAddress: "Toshkent viloyati, Zangiota tumani",
    items: [{ name: "Bioglobin", qty: 2 }],
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_CALLS = [
  {
    id: "501",
    specialistId: 1,
    specialistName: "Agronom B. Rahmonov",
    specialistSpecialty: "Agronom",
    phone: "+998 90 123 45 67",
    status: "pending",
    problem: "Ekin kasalliklari bo'yicha ko'rik",
    address: "Toshkent viloyati, Zangiota tumani",
    createdAt: new Date().toISOString(),
  },
];

export default function ProfileClientView({ initialUser }: { initialUser?: UserProfile | null }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (initialUser) return initialUser;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("agroz_user");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [selectedCallForModal, setSelectedCallForModal] = useState<any | null>(null);

  // Profil va real aktivliklarni (buyurtmalar, chaqiruvlar) yuklash
  useEffect(() => {
    // 1. Agar localStorage'da oldin saqlangan user bo'lsa
    try {
      const saved = localStorage.getItem("agroz_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) setUser(parsed);
      }
    } catch {}

    // 2. Profil ma'lumotlarini yuklash (Telegram x-telegram-user-id / session orqali)
    apiFetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setUser(data.user);
          localStorage.setItem("agroz_user", JSON.stringify(data.user));
        } else {
          const tg = getTelegramUser();
          if (tg) {
            const fullName = [tg.first_name, tg.last_name].filter(Boolean).join(" ");
            setUser((prev) => (prev?.name ? prev : {
              id: tg.id,
              name: fullName || tg.username || "Sizning ismingiz",
              phone: null,
              telegramId: tg.id,
            }));
          }
        }
      })
      .catch(() => {});

    // 3. Buyurtma va chaqiruvlarni yuklash
    apiFetch("/api/profile/activity")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok) {
          if (Array.isArray(data.orders)) setOrders(data.orders);
          if (Array.isArray(data.specialistCalls)) setCalls(data.specialistCalls);
        }
      })
      .catch(() => {});

    // 4. Background auth voqeasini tinglash
    const handleUserLoaded = (e: any) => {
      if (e?.detail) {
        setUser(e.detail);
      }
    };
    window.addEventListener("agroz_user_loaded", handleUserLoaded);
    return () => {
      window.removeEventListener("agroz_user_loaded", handleUserLoaded);
    };
  }, []);

  // Mahaliy (local) buyurtma va chaqiruvlarni birlashtirish
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
    return list.length > 0 ? list : DEFAULT_ORDERS;
  }, [orders]);

  const displayCalls = useMemo(() => {
    const list = [...calls];
    const localCalls = getSpecialistCalls();
    for (const lc of localCalls) {
      if (!list.some((c) => String(c.id) === String(lc.id))) {
        list.unshift(lc);
      }
    }
    return list.length > 0 ? list : DEFAULT_CALLS;
  }, [calls]);

  const displayName = user?.name?.trim() || "Sizning ismingiz";
  const displayPhone = user?.phone || "+998 90 123 45 67";
  const authSource = user?.telegramId ? "· Telegramdan" : "· Saytdan";

  const displayAddress = useMemo(() => {
    if (user?.region || user?.district) {
      return [user.region, user.district].filter(Boolean).join(", ");
    }
    try {
      const saved = localStorage.getItem("agroz_customer_address");
      if (saved) return saved;
    } catch {}
    return "Toshkent viloyati, Zangiota tumani";
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

  const handleLogout = async () => {
    try {
      await fetch(apiUrl("/api/auth/logout"), { method: "POST" });
    } catch {}
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#121212] px-5 pt-8 pb-32 text-white max-w-[500px] mx-auto animate-in fade-in duration-200">
      {/* 1. Foydalanuvchi ma'lumoti bosh qismi (Mockup bilan 1:1) */}
      <div className="flex items-center gap-3.5">
        {/* To'q yashil doirali avatar */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#18311d] text-[#22c55e] text-[20px] font-bold shadow-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-white tracking-tight leading-snug truncate">
            {displayName}
          </h1>
          <p className="text-[14px] text-neutral-400 font-normal mt-0.5 truncate">
            {displayPhone} {authSource}
          </p>
        </div>
      </div>

      {/* 2. Manzil kartochkasi (Mockup bilan 1:1) */}
      <div className="mt-5 rounded-2xl bg-[#242426] border border-neutral-800/80 p-4 shadow-xs">
        <p className="text-[13px] text-neutral-400 font-normal">Manzil</p>
        <p className="text-[15.5px] font-bold text-white mt-0.5">
          {displayAddress}
        </p>
      </div>

      {/* 3. Buyurtmalarim bo'limi (Mockup bilan 1:1) */}
      <div className="mt-6">
        <h2 className="text-[18px] font-bold text-white mb-2.5">
          Buyurtmalarim
        </h2>

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
                className="overflow-hidden rounded-2xl bg-[#242426] border border-neutral-800/80 transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-[#2c2c2f] active:scale-[0.99] transition"
                >
                  <div>
                    <p className="text-[16px] font-bold text-white tracking-tight">
                      #{order.id} · {formattedTotal} so&apos;m
                    </p>
                    <p className="text-[13px] text-neutral-400 font-medium mt-0.5">
                      {statusLabel}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className={`text-neutral-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-90 text-[#22c55e]" : ""
                    }`}
                  />
                </button>

                {/* Bosilganda to'liq 4 bosqichli kuzatuv paneli ochiladi */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-[#1c1c1e] p-4 animate-in fade-in duration-200">
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
      </div>

      {/* 4. Chaqiruvlarim bo'limi (Mockup bilan 1:1) */}
      <div className="mt-6">
        <h2 className="text-[18px] font-bold text-white mb-2.5">
          Chaqiruvlarim
        </h2>

        <div className="space-y-2.5">
          {displayCalls.map((call) => {
            const statusLabel =
              call.status === "pending" || call.status === "yangi"
                ? "So'rov yuborildi"
                : call.status === "tasdiqlandi" || call.status === "qabul_qilindi"
                ? "Mutaxassis qabul qildi"
                : call.status === "completed" || call.status === "bajarildi"
                ? "Aloqaga chiqdi"
                : "So'rov yuborildi";

            return (
              <div
                key={call.id}
                className="overflow-hidden rounded-2xl bg-[#242426] border border-neutral-800/80 transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCallForModal({
                      id: Number(call.specialistId || 1),
                      name: call.specialistName || "B. Rahmonov",
                      specialty: call.specialistSpecialty || "Agronom",
                      phone: call.phone || "+998 90 123 45 67",
                    });
                  }}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-[#2c2c2f] active:scale-[0.99] transition"
                >
                  <div>
                    <p className="text-[16px] font-bold text-white tracking-tight">
                      {call.specialistSpecialty ? `${call.specialistSpecialty} ` : ""}{call.specialistName || "Agronom B. Rahmonov"}
                    </p>
                    <p className="text-[13px] text-neutral-400 font-medium mt-0.5">
                      {statusLabel}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-neutral-400" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Pastki qo'shimcha amallar (Chiqish) */}
      <div className="mt-9 pt-4 border-t border-neutral-800/60 flex items-center justify-between">
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-[14px] font-medium text-neutral-400 hover:text-red-400 transition"
        >
          <LogOut size={16} />
          <span>Tizimdan chiqish</span>
        </button>
        <Link
          href="/dorilar"
          className="text-[13px] font-medium text-[#22c55e] hover:underline"
        >
          Dorilar katalogi &rarr;
        </Link>
      </div>

      {/* Agar chaqiruv bosilsa, 3-bosqichli chaqiruv status ekranini ochish */}
      {selectedCallForModal && (
        <SpecialistCallModal
          specialist={selectedCallForModal}
          isOpen={!!selectedCallForModal}
          onClose={() => setSelectedCallForModal(null)}
          onSuccess={() => setSelectedCallForModal(null)}
        />
      )}
    </div>
  );
}
