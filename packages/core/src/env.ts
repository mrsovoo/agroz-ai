import { isNativeApp } from "./capacitor";
import { getTelegram } from "./telegram";

export type AppEnvironment = "telegram" | "app" | "desktop" | "phone";

/**
 * 4 ta muhitni aniqlash:
 * 1. Force override (faqat development rejimida ?force=telegram|app|desktop|phone)
 * 2. Telegram Mini App (haqiqiy initData mavjud bo'lsa, ekran kengligidan qat'i nazar)
 * 3. Native App (Capacitor orqali iOS yoki Android'da ishlayotgan bo'lsa)
 * 4. Kenglik bo'yicha: < 768px yoki sensorli (touch) ekran -> "phone", aks holda -> "desktop"
 */
export function detectEnvironment(): AppEnvironment {
  if (typeof window === "undefined") return "desktop";

  // 1. Force override (faqat development'da)
  const isDev = Boolean(
    (typeof import.meta !== "undefined" && (import.meta as any).env?.DEV) ||
    (typeof process !== "undefined" && process.env?.NODE_ENV === "development")
  );

  if (isDev) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const force = urlParams.get("force");
      if (force === "telegram" || force === "tg") return "telegram";
      if (force === "app") return "app";
      if (force === "desktop") return "desktop";
      if (force === "phone") return "phone";
    } catch {}
  }

  // 2. Telegram Mini App (initData bor bo'lsa)
  const tg = getTelegram();
  if (tg && tg.initData && tg.initData.length > 0) {
    return "telegram";
  }

  // 3. Native App (Capacitor)
  if (isNativeApp()) {
    return "app";
  }

  // 4. Kenglik va Touch bo'yicha
  const width = window.innerWidth;
  const isTouch = "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  if (width < 768 || (width < 1024 && isTouch)) {
    return "phone";
  }

  return "desktop";
}

