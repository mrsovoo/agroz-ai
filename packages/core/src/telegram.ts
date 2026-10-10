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
  LocationManager?: {
    isInited: boolean;
    isLocationAvailable: boolean;
    isAccessRequested: boolean;
    isAccessGranted: boolean;
    init: (callback?: () => void) => void;
    getLocation: (callback: (location: { latitude: number; longitude: number } | null) => void) => void;
    openSettings: () => void;
  };
  addToHomeScreen?: () => void;
  checkHomeScreenStatus?: (
    callback: (status: "unsupported" | "unknown" | "added" | "missed") => void,
  ) => void;
  onEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
  offEvent?: (eventType: string, callback: (...args: unknown[]) => void) => void;
};

export function hasTelegramSession(tg: TelegramWebApp | null): boolean {
  if (!tg) return false;
  if (typeof tg.initData === "string" && tg.initData.length > 0) return true;
  const unsafe = tg.initDataUnsafe ?? {};
  return Boolean(unsafe.user || unsafe.query_id || unsafe.start_param);
}

export function getTelegramSdk(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { Telegram?: { WebApp?: TelegramWebApp } };
  return w.Telegram?.WebApp ?? null;
}

export function getTelegram(): TelegramWebApp | null {
  const tg = getTelegramSdk();
  return hasTelegramSession(tg) ? tg : null;
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

export function isTelegramUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Telegram/i.test(navigator.userAgent || "");
}

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

export async function requestDeviceLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    const tg = getTelegram();

    function fallbackBrowserGeo() {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolokatsiya qurilmangizda qo'llab-quvvatlanmaydi"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    }

    if (tg && tg.LocationManager) {
      const lm = tg.LocationManager;
      const onInit = () => {
        if (!lm.isLocationAvailable) {
          fallbackBrowserGeo();
          return;
        }
        lm.getLocation((data) => {
          if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
            resolve({ lat: data.latitude, lng: data.longitude });
          } else {
            fallbackBrowserGeo();
          }
        });
      };

      try {
        if (lm.isInited) {
          onInit();
        } else {
          lm.init(onInit);
        }
        return;
      } catch {
        fallbackBrowserGeo();
        return;
      }
    }

    fallbackBrowserGeo();
  });
}
