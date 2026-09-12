"use client";

import { useEffect } from "react";
import { getTelegram } from "@/lib/telegram";

/**
 * Telegram Mini App muhitini ishga tushiradi:
 * - ready() signali
 * - expand() to'liq ekran
 * - brend ranglari (header/background)
 */
export default function TelegramInit() {
  useEffect(() => {
    const tg = getTelegram();
    document.body.classList.toggle("is-telegram", Boolean(tg));
    document.body.classList.toggle("is-web", !tg);
    if (!tg) return;
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.("#fcbd00");
      tg.setBackgroundColor?.("#f2f3f5");
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
