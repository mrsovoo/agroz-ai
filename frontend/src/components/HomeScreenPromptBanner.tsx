"use client";

import { useEffect, useState } from "react";
import { Smartphone, X } from "lucide-react";
import {
  onTelegramReady,
  canAddToHomeScreen,
  checkTelegramHomeScreenStatus,
  promptAddToHomeScreen,
  haptic,
} from "@/lib/telegram";

const VISIT_COUNT_KEY = "agroz:visit_count";
const VISIT_SESSION_KEY = "agroz:visit_session_counted";
const DISMISSED_AT_KEY = "agroz:homescreen_dismissed_at";
const DISMISSED_ORDER_ID_KEY = "agroz:homescreen_dismissed_order_id";
const ADDED_FLAG_KEY = "agroz:homescreen_added";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export default function HomeScreenPromptBanner() {
  const [visible, setVisible] = useState(false);
  const [latestDeliveredOrderId, setLatestDeliveredOrderId] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    // Har yangi sessiyada visit_count ni 1 taga oshiramiz
    let visitCount = 1;
    try {
      const prev = Number(localStorage.getItem(VISIT_COUNT_KEY) || "0") || 0;
      const alreadyCountedThisSession = sessionStorage.getItem(VISIT_SESSION_KEY) === "1";
      if (!alreadyCountedThisSession) {
        visitCount = prev + 1;
        localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));
        sessionStorage.setItem(VISIT_SESSION_KEY, "1");
      } else {
        visitCount = Math.max(1, prev);
      }
    } catch {
      /* ignore storage errors */
    }

    let eventCleanup: (() => void) | null = null;

    const cleanup = onTelegramReady((tg) => {
      if (cancelled) return;

      void (async () => {
        // 1. Funksiya mavjud bo'lmasa (eski Telegram versiyasi), tugmani yashir
        if (!canAddToHomeScreen(tg)) {
          return;
        }

        try {
          if (localStorage.getItem(ADDED_FLAG_KEY) === "1") {
            return;
          }
        } catch {
          /* ignore */
        }

        // 2. checkHomeScreenStatus() bilan avval tekshir, qo'shgan bo'lsa ko'rsatma
        const status = await checkTelegramHomeScreenStatus(tg);
        if (cancelled) return;
        if (status === "added" || status === "unsupported") {
          if (status === "added") {
            try {
              localStorage.setItem(ADDED_FLAG_KEY, "1");
            } catch {
              /* ignore */
            }
          }
          return;
        }

        // 3. Foydalanuvchi buyurtmalarini tekshiramiz ("yetkazildi" holatidagi buyurtma bormi?)
        let maxDeliveredId = 0;
        try {
          const res = await fetch("/api/orders/track", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            for (const item of items) {
              if (item?.status === "yetkazildi" && typeof item?.id === "number") {
                if (item.id > maxDeliveredId) maxDeliveredId = item.id;
              }
            }
          }
        } catch {
          /* ignore network/unauthenticated errors */
        }
        if (cancelled) return;
        setLatestDeliveredOrderId(maxDeliveredId);

        const isSecondVisitOrMore = visitCount >= 2;
        const hasDeliveredOrder = maxDeliveredId > 0;

        // Faqat ikkinchi marta kirganda yoki birinchi buyurtmasi "yetkazildi" holatiga o'tgach ko'rsatamiz
        if (!isSecondVisitOrMore && !hasDeliveredOrder) {
          return;
        }

        // 4. Rad etilgan bo'lsa: kamida 3 kun yoki keyingi yetkazilgan buyurtmagacha qayta so'rama
        try {
          const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) || "0") || 0;
          const dismissedOrderId = Number(localStorage.getItem(DISMISSED_ORDER_ID_KEY) || "0") || 0;
          if (dismissedAt > 0) {
            const withinThreeDays = Date.now() - dismissedAt < THREE_DAYS_MS;
            const hasNewDeliveredOrderSinceDismiss = maxDeliveredId > dismissedOrderId;
            if (withinThreeDays && !hasNewDeliveredOrderSinceDismiss) {
              return;
            }
          }
        } catch {
          /* ignore */
        }

        const handleHomeScreenAdded = () => {
          try {
            localStorage.setItem(ADDED_FLAG_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        };

        tg.onEvent?.("homeScreenAdded", handleHomeScreenAdded);
        eventCleanup = () => {
          tg.offEvent?.("homeScreenAdded", handleHomeScreenAdded);
        };
        setVisible(true);
      })();
    });

    return () => {
      cancelled = true;
      cleanup();
      if (eventCleanup) eventCleanup();
    };
  }, []);

  if (!visible) return null;

  function handleDismiss() {
    haptic("light");
    try {
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
      localStorage.setItem(DISMISSED_ORDER_ID_KEY, String(latestDeliveredOrderId));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  function handleAdd() {
    haptic("medium");
    const called = promptAddToHomeScreen();
    if (called) {
      // Foydalanuvchi oynani yopib rad etsa ham 3 kun qayta bezovta qilmaslik uchun yozib qo'yamiz
      try {
        localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
        localStorage.setItem(DISMISSED_ORDER_ID_KEY, String(latestDeliveredOrderId));
      } catch {
        /* ignore */
      }
      setVisible(false);
    }
  }

  return (
    <div className="mt-3.5 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#039e1e] text-white shadow-2xs">
            <Smartphone size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-black text-neutral-900 leading-tight">
              AgrozGO&apos;ni bosh ekraningizga qo&apos;shing
            </p>
            <p className="mt-0.5 text-[11.5px] text-neutral-600 leading-snug">
              Bir bosishda tez kirish uchun yorliq yarating
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAdd}
            className="flex min-h-[44px] items-center justify-center rounded-xl bg-[#039e1e] px-3.5 py-2 text-[12.5px] font-bold text-white shadow-2xs transition active:scale-95 hover:bg-[#028518]"
          >
            Qo&apos;shish
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Yopish"
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-neutral-500 transition hover:bg-emerald-100/60 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
