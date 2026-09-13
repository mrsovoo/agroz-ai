"use client";

import { useEffect } from "react";
import { onTelegramReady } from "@/lib/telegram";

/**
 * Telegram Mini App muhitini ishga tushiradi:
 * - ready() signali va expand() (to'liq ekran)
 * - brend ranglari (header/background)
 * - layout klassini tasdiqlash (birinchi kadrda skript qo'ygan klassni tuzatadi)
 */
export default function TelegramInit() {
  useEffect(() => {
    return onTelegramReady((tg) => {
      const root = document.documentElement;
      root.classList.add("is-telegram");
      root.classList.remove("is-web");

      try {
        tg.ready();
        tg.expand();
        tg.disableVerticalSwipes?.();
        tg.setHeaderColor?.("#fcbd00");
        tg.setBackgroundColor?.("#f2f3f5");
      } catch {
        /* ignore */
      }
    });
  }, []);

  return null;
}
