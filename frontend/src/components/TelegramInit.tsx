"use client";

import { useEffect } from "react";
import { getTelegram, isTelegramUserAgent, onTelegramReady } from "@/lib/telegram";

/** Keng ekranmi — globals.css'dagi media query bilan aynan bir xil shart. */
function isWideScreen(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 900 && window.innerHeight >= 500;
}

/**
 * Telegram Mini App muhitini ishga tushiradi:
 * - ready() / expand() / brend ranglari
 * - layout klassini ikki tomonga ham tuzatadi (birinchi kadrda skript qo'ygan
 *   klass noto'g'ri bo'lib qolsa):
 *     Telegram aniqlandi        → mobil ilova ko'rinishi
 *     Telegram yo'q + keng ekran → web sayt ko'rinishi
 */
export default function TelegramInit() {
  useEffect(() => {
    const root = document.documentElement;

    const stopWaiting = onTelegramReady((tg) => {
      root.classList.add("is-telegram");
      root.classList.remove("is-web");

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

    // Telegram SDK yuklanmasa (yoki tashqi brauzerda Telegram havolasidan
    // ochilgan bo'lsa) keng ekranda web ko'rinishga qaytaramiz.
    const timer = window.setTimeout(() => {
      if (isWideScreen() && !getTelegram() && !isTelegramUserAgent()) {
        root.classList.add("is-web");
        root.classList.remove("is-telegram");
      }
    }, 1500);

    return () => {
      stopWaiting();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
