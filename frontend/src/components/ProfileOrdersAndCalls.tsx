"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Pill,
  UsersRound,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  ChevronRight,
  Phone,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import { apiUrl } from "@/lib/api-config";
import { formatOrderNumber } from "@/lib/format";
import OrderTrackingStatusCard from "@/components/OrderTrackingStatusCard";
import {
  hasRatedOrderItem,
  getOrderItemRating,
  addMedicineReview,
  REVIEWS_EVENT,
} from "@/lib/medicine-reviews";

type OrderItem = {
  id?: number;
  medicineId?: number;
  name: string;
  price: number;
  qty: number;
};

type UserOrder = {
  id: number;
  pharmacyId?: number;
  pharmacyName: string;
  pharmacyPhone: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryType: string;
  customerAddress: string | null;
  totalSum: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type UserCall = {
  id: number;
  specialistName: string;
  specialistPhone: string | null;
  specialistSpecialty: string | null;
  problem: string;
  address: string | null;
  status: string;
  createdAt: string;
};

export default function ProfileOrdersAndCalls({ userPhone }: { userPhone?: string | null }) {
  const [activeTab, setActiveTab] = useState<"medicines" | "specialists">("medicines");
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [calls, setCalls] = useState<UserCall[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Baholash va fikr bildirish holati
  const [ratingModalItem, setRatingModalItem] = useState<{
    orderId: number;
    medicineId: number;
    medicineName: string;
    customerName: string;
    customerAddress?: string | null;
  } | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [, setReviewsTick] = useState(0);

  useEffect(() => {
    const onReviewsUpdate = () => setReviewsTick((t) => t + 1);
    window.addEventListener(REVIEWS_EVENT, onReviewsUpdate);
    window.addEventListener("storage", onReviewsUpdate);
    return () => {
      window.removeEventListener(REVIEWS_EVENT, onReviewsUpdate);
      window.removeEventListener("storage", onReviewsUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = userPhone
        ? apiUrl(`/api/profile/activity?phone=${encodeURIComponent(userPhone)}`)
        : apiUrl("/api/profile/activity");
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const ords: UserOrder[] = data.orders || [];
          setOrders(ords);
          setCalls(data.specialistCalls || []);
          // Faol buyurtma bo'lsa, birinchisini avtomatik kengaytirish
          const active = ords.find((o) => o.status === "yangi" || o.status === "tasdiqlandi" || o.status === "yolda");
          if (active) {
            setExpandedOrderId(active.id);
          } else if (ords.length > 0) {
            setExpandedOrderId(ords[0].id);
          }
        }
      }
    } catch {
      // Tarmoq xatosi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userPhone]);

  const getOrderStatusBadge = (status: string, deliveryType?: string) => {
    switch (status) {
      case "yangi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
            <Clock size={11} /> Yangi
          </span>
        );
      case "tasdiqlandi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
            <CheckCircle2 size={11} /> Tasdiqlandi
          </span>
        );
      case "yetkazildi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} /> {deliveryType === "pickup" ? "Olib ketildi" : "Yetkazildi"}
          </span>
        );
      case "bekor":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
            <AlertCircle size={11} /> Bekor qilingan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
            {status}
          </span>
        );
    }
  };

  const getCallStatusBadge = (status: string) => {
    switch (status) {
      case "bajarildi":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} /> Yakunlandi
          </span>
        );
      case "bekor":
      case "bekor_qilindi":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-bold text-red-600 border border-red-200">
            <AlertCircle size={12} /> Bekor qilindi
          </span>
        );
      case "qabul_qilindi":
      case "tasdiqlandi":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11.5px] font-bold text-blue-700 border border-blue-200">
            <CheckCircle2 size={12} /> Qabul qilindi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-bold text-amber-700 border border-amber-200">
            <Clock size={12} /> So&apos;rov yuborildi
          </span>
        );
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-black text-neutral-900 leading-tight">
            Mening Buyurtmalarim
          </h2>
          <p className="text-[12.5px] text-neutral-500 font-medium">
            Dorilar va mutaxassis chaqiruvlari tarixi
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-600 border border-black/10 hover:bg-neutral-50 active:scale-95 transition"
          title="Yangilash"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-neutral-200/60 p-1 border border-black/5 text-xs font-bold mb-4">
        <button
          onClick={() => setActiveTab("medicines")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
            activeTab === "medicines"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <Pill size={15} />
          <span>Dorilar ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("specialists")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition ${
            activeTab === "specialists"
              ? "bg-white text-neutral-900 shadow-xs"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <UsersRound size={15} />
          <span>Mutaxassislar ({calls.length})</span>
        </button>
      </div>

      {/* Tab 1: Dorilar */}
      {activeTab === "medicines" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
                <ShoppingBag size={26} />
              </div>
              <h3 className="text-[16px] font-bold text-neutral-800">
                Hozircha dori buyurtma qilinmagan
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500 max-w-xs mx-auto">
                Katalogdan kerakli dorilarni savatga qo&apos;shib buyurtma bering.
              </p>
              <Link href="/dorilar" className="inline-block mt-4">
                <button className="rounded-xl bg-[var(--brand-green)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition">
                  Dorilar katalogiga o&apos;tish →
                </button>
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-2xs transition hover:border-[var(--brand-green)]/40"
              >
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-neutral-900">
                      Buyurtma {formatOrderNumber(ord.id)}
                    </span>
                    {getOrderStatusBadge(ord.status, ord.deliveryType)}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(ord.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <Store size={14} className="text-neutral-400 shrink-0" />
                    <span className="font-bold">{ord.pharmacyName}</span>
                    {ord.pharmacyPhone && (
                      <a href={`tel:${ord.pharmacyPhone}`} className="text-neutral-500 hover:underline font-mono">
                        ({ord.pharmacyPhone})
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Truck size={14} className="text-neutral-400 shrink-0" />
                    <span>
                      {ord.deliveryType === "delivery"
                        ? `Yetkazib berish: ${ord.customerAddress || "Manzil ko'rsatilgan"}`
                        : "Agro-do&apos;kondan olib ketish"}
                    </span>
                  </div>

                  {/* Agro-mahsulotlar ro'yxati */}
                  <div className="rounded-xl bg-neutral-50 p-2.5 mt-2 border border-neutral-100">
                    <div className="divide-y divide-neutral-200/60">
                      {ord.items.map((it, idx) => (
                        <div key={idx} className="flex flex-col py-1.5 text-[11.5px] gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-800 font-medium">💊 {it.name}</span>
                            <span className="font-mono text-neutral-600">
                              {it.qty} dona × {it.price.toLocaleString()} so&apos;m
                            </span>
                          </div>
                          {it.medicineId ? (
                            <div className="flex items-center justify-end">
                              {hasRatedOrderItem(ord.id, it.medicineId) ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                  <Star size={11} className="fill-amber-400 text-amber-400" />
                                  <span>Baholandi ({getOrderItemRating(ord.id, it.medicineId)?.rating} ★)</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRatingModalItem({
                                      orderId: ord.id,
                                      medicineId: it.medicineId!,
                                      medicineName: it.name,
                                      customerName: ord.customerName || "Xaridor",
                                      customerAddress: ord.customerAddress,
                                    });
                                    setSelectedStars(5);
                                    setReviewComment("");
                                    setRatingSubmitted(false);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 border border-amber-200/90 hover:bg-amber-100 transition active:scale-95"
                                >
                                  <Star size={11} className="fill-amber-400 text-amber-400" />
                                  <span>Baholash va fikr bildirish</span>
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-neutral-200/80 pt-1.5 mt-1.5 flex items-center justify-between font-bold">
                      <span className="text-[11px] text-neutral-500">Jami to&apos;lov:</span>
                      <span className="font-mono text-[13px] text-neutral-900">
                        {ord.totalSum.toLocaleString()} so&apos;m
                      </span>
                    </div>
                  </div>

                  {/* Bosqichli holat kuzatuvi tugmasi */}
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                    className="mt-2.5 flex w-full items-center justify-between rounded-xl bg-neutral-100/90 px-3 py-2 text-[12px] font-bold text-neutral-800 hover:bg-neutral-200 transition"
                  >
                    <span>📊 Buyurtma holati va bot xabarnomasi</span>
                    <ChevronRight
                      size={15}
                      className={`transform transition-transform text-neutral-500 ${
                        expandedOrderId === ord.id ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {expandedOrderId === ord.id && (
                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <OrderTrackingStatusCard
                        orderId={ord.id}
                        status={ord.status}
                        totalSum={ord.totalSum}
                        items={ord.items}
                        deliveryType={ord.deliveryType}
                        customerAddress={ord.customerAddress}
                        pharmacyName={ord.pharmacyName}
                        pharmacyPhone={ord.pharmacyPhone}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Mutaxassislar */}
      {activeTab === "specialists" && (
        <div className="space-y-3">
          {calls.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-7 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
                <UsersRound size={26} />
              </div>
              <h3 className="text-[16px] font-bold text-neutral-800">
                Hozircha mutaxassis chaqirilmagan
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500 max-w-xs mx-auto">
                Ekin yoki chorvangizda kasallik yoki zararkunandalar bo&apos;lsa, malakali agronom va veterinarlarni chaqiring.
              </p>
              <Link href="/mutaxassislar" className="inline-block mt-4">
                <button className="rounded-xl bg-[var(--brand-ink)] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 active:scale-95 transition">
                  Mutaxassislarni ko&apos;rish →
                </button>
              </Link>
            </div>
          ) : (
            calls.map((call) => {
              const roleText = (() => {
                const spec = (call.specialistSpecialty || "").toLowerCase();
                if (/veterinar|chorva|parranda|hayvon|mol|emlash/i.test(spec)) return "Veterinar";
                if (/agronom|ekin|o'simlik|fitopatolog|bog'bon|tuproq/i.test(spec)) return "Agronom";
                return call.specialistSpecialty || "Agronom / Veterinar";
              })();

              return (
                <div
                  key={call.id}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 shadow-2xs transition hover:border-neutral-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      {/* 1. #0000 chaqiruv raqami va Mutaxassis yo'nalishi (Agronom / Veterinar) */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[14.5px] sm:text-[15.5px] font-black text-neutral-900 tracking-tight">
                          #{String(call.id).padStart(4, "0")}
                        </span>
                        <span className="text-neutral-300 font-bold">•</span>
                        <span className="text-[14px] sm:text-[15px] font-extrabold text-neutral-800 truncate">
                          {roleText}
                        </span>
                      </div>

                      {/* 2. Pastda sal kichikroqda va opasitisi tushgan holatda mutaxassis ismi */}
                      <p className="text-[12px] font-medium text-neutral-400 mt-0.5 truncate">
                        {call.specialistName || "Mutaxassis"}
                      </p>
                    </div>

                    {/* 3. O'ng tomonda toza status va telefon tugmasi */}
                    <div className="flex items-center gap-2 shrink-0">
                      {call.specialistPhone && (call.status === "qabul_qilindi" || call.status === "tasdiqlandi") && (
                        <a
                          href={`tel:${String(call.specialistPhone).replace(/[^\d+]/g, "")}`}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
                          title="Mutaxassisga qo'ng'iroq qilish"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {getCallStatusBadge(call.status)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {/* Baholash va fikr bildirish modali */}
      {ratingModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-5 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-[16px] font-black text-neutral-900 leading-tight">
                  Mahsulotni baholash
                </h3>
                <p className="text-[12px] font-medium text-neutral-500 truncate max-w-[240px]">
                  {ratingModalItem.medicineName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRatingModalItem(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition"
              >
                <X size={15} />
              </button>
            </div>

            {ratingSubmitted ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-[15px] font-bold text-neutral-900">
                  Fikringiz uchun rahmat!
                </p>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  Baholash muvaffaqiyatli saqlandi.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!ratingModalItem) return;
                  addMedicineReview({
                    medicineId: ratingModalItem.medicineId,
                    orderId: ratingModalItem.orderId,
                    authorName: ratingModalItem.customerName || "Xaridor",
                    authorRegion:
                      ratingModalItem.customerAddress?.split(",")[0] || "O'zbekiston",
                    authorRole: "Xaridor",
                    rating: selectedStars,
                    comment:
                      reviewComment.trim() ||
                      `${selectedStars} yulduzli baho qo'yildi`,
                    verifiedPurchase: true,
                  });
                  setRatingSubmitted(true);
                  setTimeout(() => {
                    setRatingModalItem(null);
                    setRatingSubmitted(false);
                  }, 1200);
                }}
                className="mt-4 space-y-4"
              >
                {/* Yulduzchalar */}
                <div className="text-center">
                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active =
                        star <= (hoveredStars !== null ? hoveredStars : selectedStars);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredStars(star)}
                          onMouseLeave={() => setHoveredStars(null)}
                          onClick={() => setSelectedStars(star)}
                          className="p-1 transition-transform hover:scale-115 active:scale-95"
                        >
                          <Star
                            size={28}
                            className={
                              active
                                ? "text-amber-400 fill-amber-400"
                                : "text-neutral-200 fill-neutral-50"
                            }
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-[12px] font-bold text-amber-600">
                    {selectedStars === 5
                      ? "A'lo darajada samarali! 🌟"
                      : selectedStars === 4
                        ? "Yaxshi ta'sir qildi 👍"
                        : selectedStars === 3
                          ? "O'rtacha natija 😐"
                          : selectedStars === 2
                            ? "Qoniqarsiz 👎"
                            : "Juda qoniqarsiz 🙁"}
                  </p>
                </div>

                {/* Sharh / Fikr */}
                <div>
                  <label className="block text-[11.5px] font-bold text-neutral-600 uppercase tracking-wider mb-1">
                    Fikringiz yoki maslahatingiz (ixtiyoriy)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Preparat ekin yoki chorvaga qanday yordam berdi? Boshqa dehqonlarga tavsiya qilasizmi?"
                    className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-[var(--brand-green)] focus:outline-hidden"
                  />
                </div>

                {/* Tugmalar */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRatingModalItem(null)}
                    className="flex-1 rounded-xl bg-neutral-100 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-200 transition"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-[var(--brand-green)] py-2.5 text-xs font-bold text-white shadow-xs hover:brightness-105 active:scale-95 transition"
                  >
                    Bahoni saqlash
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

