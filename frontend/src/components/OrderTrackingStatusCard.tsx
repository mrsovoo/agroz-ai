"use client";

import { useState } from "react";
import { Check, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { formatOrderNumber } from "@/lib/format";
import { apiFetch } from "@/lib/api-config";

export type OrderTrackingItem = {
  name: string;
  qty: number;
  price?: number | null;
};

export type OrderTrackingStatus = "yangi" | "tasdiqlandi" | "yolda" | "yetkazildi" | "bekor" | string;

export interface OrderTrackingProps {
  orderId: number | string;
  status: OrderTrackingStatus;
  totalSum: number;
  items: OrderTrackingItem[];
  deliveryType?: "pickup" | "delivery" | string;
  customerAddress?: string | null;
  pharmacyName?: string;
  pharmacyPhone?: string | null;
  compact?: boolean;
  onStatusChange?: (newStatus: OrderTrackingStatus) => void;
}

function shortSum(val: number): string {
  return new Intl.NumberFormat("ru-RU").format(val).replace(/\u00a0/g, " ");
}

export default function OrderTrackingStatusCard({
  orderId,
  status: initialStatus,
  totalSum,
  items,
  deliveryType = "delivery",
  customerAddress,
  pharmacyName,
  onStatusChange,
}: OrderTrackingProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderTrackingStatus>(initialStatus);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const status = currentStatus;

  // 4 ta bosqich:
  // 1: Yuborildi (yangi)
  // 2: Agro-do'kon qabul qildi (tasdiqlandi)
  // 3: Yo'lda (yolda)
  // 4: Olib ketildi / Yetkazildi (yetkazildi)
  const isPickup = deliveryType === "pickup";
  const step3Label = isPickup ? "Olib ketishga tayyor" : "Yo'lda";
  const step4Label = isPickup ? "Olib ketildi" : "Yetkazildi";

  const canCancel = status === "yangi" || status === "tasdiqlandi";

  async function handleCancelOrder() {
    if (!canCancel || cancelling) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Bronni bekor qilishda xatolik yuz berdi");
      }
      setCurrentStatus("bekor");
      onStatusChange?.("bekor");
    } catch (err: any) {
      setCancelError(err?.message || "Tarmoq xatosi yuz berdi");
    } finally {
      setCancelling(false);
    }
  }

  const getStepState = (stepNumber: 1 | 2 | 3 | 4) => {
    if (status === "bekor") return { done: false, active: false, cancelled: true };
    if (status === "yetkazildi") return { done: true, active: false, cancelled: false };

    if (stepNumber === 1) {
      return { done: true, active: status === "yangi", cancelled: false };
    }
    if (stepNumber === 2) {
      const isDone = status === "tasdiqlandi" || status === "yolda";
      return { done: isDone, active: status === "tasdiqlandi", cancelled: false };
    }
    if (stepNumber === 3) {
      const isDone = status === "yolda";
      return { done: isDone, active: status === "yolda", cancelled: false };
    }
    return { done: false, active: false, cancelled: false };
  };

  const steps: { num: 1 | 2 | 3 | 4; label: string }[] = [
    { num: 1, label: "Yuborildi" },
    { num: 2, label: "Agro-do'kon qabul qildi" },
    { num: 3, label: step3Label },
    { num: 4, label: step4Label },
  ];

  const itemsSummary = items && items.length > 0
    ? items.map((i) => `${i.name} x${i.qty}`).join(", ")
    : "Agro-mahsulotlar";

  return (
    <div className="w-full space-y-3.5 text-neutral-900">
      {/* Sarlavha: Buyurtma #... va summa */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[20px] font-black tracking-tight text-neutral-900 leading-tight">
            Buyurtma {typeof orderId === "number" ? formatOrderNumber(orderId) : orderId}
          </h3>
          <p className="text-[13.5px] font-medium text-neutral-500 mt-0.5">
            {shortSum(totalSum)} so&apos;m · {itemsSummary}
          </p>
        </div>

        {canCancel && (
          <button
            type="button"
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-100 active:scale-95 transition disabled:opacity-50"
          >
            {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            <span>Bekor qilish</span>
          </button>
        )}
      </div>

      {cancelError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-[12px] font-semibold text-red-600">
          {cancelError}
        </div>
      )}

      {status === "bekor" ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-red-50 p-3.5 text-red-700 border border-red-200">
          <AlertCircle size={20} className="shrink-0" />
          <div>
            <p className="text-[14px] font-bold">Buyurtma bekor qilingan</p>
            <p className="text-[12px] opacity-80 mt-0.5">Agro-do&apos;kon bilan bog&apos;lanib ma&apos;lumot olishingiz mumkin.</p>
          </div>
        </div>
      ) : (
        /* Yorug' (Light UI) bosqichlar kartochkasi */
        <div className="rounded-[22px] bg-white border border-neutral-200/90 p-4.5 text-neutral-900 shadow-2xs">
          <div className="space-y-3.5">
            {steps.map((st, idx) => {
              const state = getStepState(st.num);
              const isLast = idx === steps.length - 1;

              return (
                <div key={st.num} className="relative flex items-center gap-3.5">
                  {/* Vertikal chiziq */}
                  {!isLast && (
                    <div
                      className={`absolute left-[13px] top-[26px] h-4 w-[2px] ${
                        state.done ? "bg-[#10b981]" : "bg-neutral-200"
                      }`}
                    />
                  )}

                  {/* Bosqich belgisi */}
                  {state.done ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-white shadow-xs">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  ) : state.active ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#10b981] bg-emerald-50 text-[#10b981]">
                      <Clock size={14} className="animate-spin" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-neutral-100" />
                  )}

                  {/* Bosqich nomi */}
                  <span
                    className={`text-[14.5px] ${
                      state.done
                        ? "font-bold text-neutral-900"
                        : state.active
                          ? "font-bold text-[#10b981]"
                          : "font-medium text-neutral-400"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agro-do'kon egasi botiga kelgan xabar bloki */}
      <div className="pt-1">
        <p className="text-[12px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
          Agro-do&apos;kon egasi botiga kelgan xabar (real):
        </p>

        <div className="rounded-[20px] bg-[#f0f4f9] p-4 text-neutral-900 border border-neutral-200/90 shadow-2xs">
          <p className="text-[14.5px] font-black text-[#0f3d63] leading-snug">
            Yangi buyurtma {typeof orderId === "number" ? formatOrderNumber(orderId) : orderId}
          </p>

          <div className="mt-1 space-y-0.5 text-[13px] text-neutral-700 font-medium">
            {items && items.length > 0 ? (
              items.map((it, idx) => (
                <p key={idx}>
                  {it.name} x{it.qty}
                </p>
              ))
            ) : (
              <p>{itemsSummary}</p>
            )}
          </div>

          <p className="mt-1.5 text-[12.5px] text-neutral-600">
            <span className="font-semibold text-neutral-800">Manzil:</span>{" "}
            {isPickup ? (
              <span>{pharmacyName ? `${pharmacyName} (Olib ketish)` : "Agro-do'kondan olib ketish"}</span>
            ) : (
              <span>{customerAddress || "Ko'rsatilmagan"}</span>
            )}
          </p>

          <p className="mt-2 text-[14px] font-black text-neutral-900">
            Jami: {shortSum(totalSum)} so&apos;m
          </p>
        </div>
      </div>
    </div>
  );
}
