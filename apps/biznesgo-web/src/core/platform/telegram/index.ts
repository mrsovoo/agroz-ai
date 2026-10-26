export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: {
    query_id?: string;
    user?: TelegramWebAppUser;
    auth_date?: string;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }> }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: { text?: string }, callback?: (data: string) => boolean | void) => void;
  closeScanQrPopup: () => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Telegram WebApp obyekti mavjudligini tekshirish
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;
  if (typeof tg.ready === 'function') {
    return tg;
  }
  return null;
}

/**
 * Telegram Launch App muhitini sozlash (Expand, Ranglar, Closing Confirmation)
 */
export function initTelegramApp(): { isTelegram: boolean; user: TelegramWebAppUser | null } {
  const tg = getTelegramWebApp();
  if (!tg) {
    return { isTelegram: false, user: null };
  }

  try {
    tg.ready();
    tg.expand();
    
    // Tasodifiy surib yopib qo'yishdan himoya (Closing confirmation)
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }

    // BiznesGO brend ranglari identikasiga moslashtirish
    if (typeof tg.setHeaderColor === 'function') {
      tg.setHeaderColor('#f6f8f6');
    }
    if (typeof tg.setBackgroundColor === 'function') {
      tg.setBackgroundColor('#f6f8f6');
    }

    const user = tg.initDataUnsafe?.user || null;
    return { isTelegram: true, user };
  } catch (err) {
    console.warn('Telegram WebApp init error:', err);
    return { isTelegram: true, user: null };
  }
}

/**
 * Haptic tebranish funksiyalari (Native Telegram taassuroti berish uchun)
 */
export const telegramHaptic = {
  light: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('light');
    } catch {
      // ignore
    }
  },
  medium: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium');
    } catch {
      // ignore
    }
  },
  heavy: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.impactOccurred('heavy');
    } catch {
      // ignore
    }
  },
  success: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success');
    } catch {
      // ignore
    }
  },
  warning: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning');
    } catch {
      // ignore
    }
  },
  error: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error');
    } catch {
      // ignore
    }
  },
  selection: () => {
    try {
      getTelegramWebApp()?.HapticFeedback?.selectionChanged();
    } catch {
      // ignore
    }
  },
};
