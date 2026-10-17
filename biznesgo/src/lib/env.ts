"use client";

import { useState, useEffect } from "react";

export type EnvType = "telegram" | "desktop" | "phone" | "admin" | null;

export function useEnvironment(isAdmin = false): EnvType {
  const [env, setEnv] = useState<EnvType>(null);

  useEffect(() => {
    if (isAdmin) {
      setEnv("admin");
      return;
    }

    // Dev force override
    if (process.env.NODE_ENV === "development") {
      const urlParams = new URLSearchParams(window.location.search);
      const force = urlParams.get("force");
      if (force === "tg" || force === "telegram") {
        setEnv("telegram");
        return;
      }
      if (force === "desktop" || force === "phone") {
        setEnv(force);
        return;
      }
    }

    const checkEnv = () => {
      // 1. Telegram Mini App
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initData) {
        setEnv("telegram");
        return;
      }

      // 2. Desktop Telegram keng oynasi ham Mini App ochilsin (initData mavjud bo'ladi)
      // Agar initData yo'q bo'lsa, brauzer deb qabul qilinadi
      const width = window.innerWidth;
      
      // Kenglik < 768px yoki touch qurilma bo'lsa -> phone
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (width < 768 || (width < 1024 && isTouch)) {
        setEnv("phone");
      } else {
        setEnv("desktop");
      }
    };

    // Telegram scripti yuklanishini ozgina kutamiz, chunki initData salkam kech yuklanishi mumkin
    if (typeof (window as any).Telegram !== "undefined") {
      checkEnv();
    } else {
      setTimeout(checkEnv, 50); 
    }
  }, [isAdmin]);

  return env;
}
