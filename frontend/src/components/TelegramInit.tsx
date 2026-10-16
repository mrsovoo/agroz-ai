"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getTelegram, isTelegramUserAgent, onTelegramReady } from "@/lib/telegram";
import { initNativeApp, isNativeApp } from "@/lib/capacitor";
import { isLaunchRoute } from "@/lib/env";

/**
 * Telegram Mini App, Launch App va Native Mobil Ilova (Capacitor) muhitini ishga tushiradi
 */
export default function TelegramInit() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const inLaunchRoute = isLaunchRoute(pathname);

    // 1. Agar native ilovada (Capacitor Android / iOS) bo'lsak:
    if (isNativeApp()) {
      root.classList.add("is-telegram");
      root.classList.remove("is-web");
      initNativeApp().catch((err) => console.debug("[NativeInit] error:", err));
      return;
    }

    // 2. Agar Launch App marshrutida bo'lsak (mobil telefon formatida turishi shart):
    if (inLaunchRoute) {
      root.classList.add("is-telegram");
      root.classList.remove("is-web");
    } else if (!getTelegram()?.initData && !isTelegramUserAgent()) {
      // 3. Tashqi brauzerda Web Sayt sahifasida bo'lsak:
      root.classList.add("is-web");
      root.classList.remove("is-telegram");
    }

    const stopWaiting = onTelegramReady((tg) => {
      // Haqiqiy Telegram ichida initData mavjud bo'lsa yoki Launch marshrutda bo'lsa Mini App rejimi
      if (tg.initData || isLaunchRoute(window.location.pathname)) {
        root.classList.add("is-telegram");
        root.classList.remove("is-web");
      } else {
        root.classList.add("is-web");
        root.classList.remove("is-telegram");
        return;
      }

      try {
        tg.ready();
        tg.expand();
        tg.disableVerticalSwipes?.();
        tg.setHeaderColor?.("#fcbd00");
        tg.setBackgroundColor?.("#f2f3f5");

        // Telegram Mini App ochilganda, agar foydalanuvchi bot orqali ro'yxatdan o'tgan bo'lsa,
        // sessiyani va profil ma'lumotlarini avtomatik faollashtirish
        if (tg.initData) {
          fetch("/api/auth/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData: tg.initData }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.ok && data.user) {
                if (data.sessionId && typeof document !== "undefined") {
                  document.cookie = `agroai_session=${data.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
                  document.cookie = `agroz_session=${data.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
                  localStorage.setItem("agroz_session", data.sessionId);
                }
                localStorage.setItem("agroz_user", JSON.stringify(data.user));
                window.dispatchEvent(new CustomEvent("agroz_user_loaded", { detail: data.user }));
              }
            })
            .catch(() => {});
        }
      } catch {
        /* ignore */
      }
    });

    return () => {
      stopWaiting();
    };
  }, [pathname]);

  return null;
}
