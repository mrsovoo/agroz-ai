"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { haptic } from "@/lib/telegram";

/**
 * Mobil ilovadek (Native App) surish (swipe) navigatsiyasi:
 * Asosiy tablar: / -> /agro-mahsulotlar -> /mutaxassislar -> /profil
 * - Chapga sursa (swipe left): keyingi tabga o'tish
 * - O'ngga sursa (swipe right): oldingi tabga o'tish
 * - Ichki sahifalarda chap chetdan o'ngga sursa (edge swipe): router.back()
 */
const MAIN_TABS = ["/", "/dorilar", "/mutaxassislar", "/profil"];

export default function MobileSwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const touchStartRef = useRef<{ x: number; y: number; time: number; shouldIgnore: boolean } | null>(null);

  useEffect(() => {
    // Faqat touch ekranlarda va mobil/telegram rejimida ishlaydi
    if (typeof window === "undefined") return;
    if (document.documentElement.classList.contains("is-web")) return;

    function isInteractiveOrScrollable(target: EventTarget | null): boolean {
      if (!target || !(target instanceof HTMLElement)) return false;

      // Input, button yoki form elementlari
      const interactiveTags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
      if (interactiveTags.includes(target.tagName)) return true;

      // Xarita (Leaflet), modal yoki o'yin/chizish bloklari
      if (
        document.body.classList.contains("modal-open") ||
        target.closest("[role='dialog']") ||
        target.closest(".no-swipe") ||
        target.closest(".cart-drawer-sheet") ||
        target.closest("pre") ||
        target.closest("code")
      ) {
        return true;
      }

      // Gorizontal scroll bo'ladigan element (faqat explicit scrollable elementlar, masalan gorizontal toifalar ro'yxati)
      let el: HTMLElement | null = target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.getAttribute("data-horizontal-scroll") === "true") {
          return true;
        }
        const style = window.getComputedStyle(el);
        const overflowX = style.overflowX;
        // Scrollable elementda real gorizontal aylanish imkoniyati bo'lsa
        if ((overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth + 24) {
          return true;
        }
        el = el.parentElement;
      }

      return false;
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.touches[0];
      const ignore = isInteractiveOrScrollable(e.target);

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
        shouldIgnore: ignore,
      };
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStartRef.current) return;
      const start = touchStartRef.current;
      touchStartRef.current = null;

      if (start.shouldIgnore) return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const deltaTime = Date.now() - start.time;

      // Tabiiy mobil swipe (650ms dan kam, kamida 45px va gorizontal harakat vertikaldan aniq ustun)
      if (deltaTime > 650) return;
      if (Math.abs(deltaX) < 45) return;
      if (Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

      // Yo'nalishni normallashtirish (/agro-mahsulotlar -> /dorilar)
      let normalized = pathname || "/";
      if (normalized.endsWith("/") && normalized.length > 1) {
        normalized = normalized.slice(0, -1);
      }
      if (normalized === "/agro-mahsulotlar") {
        normalized = "/dorilar";
      }

      const tabIndex = MAIN_TABS.indexOf(normalized);

      // 1. Asosiy tablar orasida o'tish
      if (tabIndex !== -1) {
        if (deltaX < 0) {
          // Chapga surildi -> keyingi tab
          if (tabIndex < MAIN_TABS.length - 1) {
            const nextTab = MAIN_TABS[tabIndex + 1];
            haptic("light");
            router.push(nextTab);
          }
        } else {
          // O'ngga surildi -> oldingi tab
          if (tabIndex > 0) {
            const prevTab = MAIN_TABS[tabIndex - 1];
            haptic("light");
            router.push(prevTab);
          }
        }
        return;
      }

      // 2. Ichki sahifalarda (masalan, /dori/..., /tashxis, /chat)
      // Chap chetdan o'ngga sursa (edge swipe, iOS/Android orqaga qaytish effekti)
      if (deltaX > 50 && start.x < 60) {
        haptic("light");
        router.back();
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pathname, router]);

  return null;
}

