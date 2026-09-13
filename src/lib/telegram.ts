"use client";

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    [k: string]: unknown;
  };
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  viewportHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  disableVerticalSwipes?: () => void;
  isExpanded?: boolean;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    setText: (t: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    enable: () => void;
    disable: () => void;
  };
};

export function getTelegram(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { Telegram?: { WebApp?: TelegramWebApp } };
  return w.Telegram?.WebApp ?? null;
}

export function isTelegram(): boolean {
  return getTelegram() !== null;
}

export function getTelegramUser(): TelegramUser | null {
  return getTelegram()?.initDataUnsafe?.user ?? null;
}

export function haptic(style: "light" | "medium" | "heavy" = "light") {
  try {
    getTelegram()?.HapticFeedback?.impactOccurred(style);
  } catch {
    /* noop */
  }
}

/** User-Agent bo'yicha Telegram ichida ochilganini aniqlash (SDK hali yuklanmagan bo'lishi mumkin). */
export function isTelegramUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Telegram/i.test(navigator.userAgent || "");
}

/**
 * Telegram SDK kech (async) yuklanadi — shuning uchun tayyor bo'lishini kutamiz.
 * To'g'ridan-to'g'ri `getTelegram()` chaqirish sekin internetda null qaytarishi mumkin.
 * Qaytarilgan funksiya kutishni to'xtatadi (komponent unmount bo'lganda chaqiriladi).
 */
export function onTelegramReady(
  cb: (tg: TelegramWebApp) => void | (() => void),
  timeoutMs = 6000,
): () => void {
  if (typeof window === "undefined") return () => {};

  let stopped = false;
  let timer: number | undefined;
  let cbCleanup: void | (() => void);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (timer !== undefined) window.clearInterval(timer);
    if (typeof cbCleanup === "function") cbCleanup();
  };

  const existing = getTelegram();
  if (existing) {
    cbCleanup = cb(existing);
    return stop;
  }

  const startedAt = Date.now();
  timer = window.setInterval(() => {
    const tg = getTelegram();
    if (!tg) {
      // SDK hech qachon yuklanmasa (masalan, telegram.org bloklangan) kutishni to'xtatamiz.
      if (Date.now() - startedAt > timeoutMs && timer !== undefined) {
        window.clearInterval(timer);
      }
      return;
    }
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
    if (stopped) return;
    cbCleanup = cb(tg);
  }, 100);

  return stop;
}
