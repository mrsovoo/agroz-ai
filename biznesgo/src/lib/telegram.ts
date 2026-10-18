/**
 * Telegram WebApp SDK integratsiyasi (Dual-bot TMA)
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        requestFullscreen?: () => void;
        enableClosingConfirmation?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        };
      };
    };
  }
}

class TelegramService {
  isAvailable = false;
  initData = '';
  user: { id: number; first_name?: string; last_name?: string; username?: string } | null = null;

  init() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const wa = window.Telegram.WebApp;
      this.initData = wa.initData || '';
      this.user = wa.initDataUnsafe?.user || null;
      this.isAvailable = Boolean(this.initData);

      if (this.isAvailable) {
        document.body.classList.add('telegram-app');
        try {
          wa.ready();
          wa.expand();
          wa.requestFullscreen?.();
          wa.enableClosingConfirmation?.();
          wa.setHeaderColor?.('#059669');
          wa.setBackgroundColor?.('#f8fafc');
        } catch (e) {
          console.warn('TMA init error:', e);
        }
      }
    }
    return this.isAvailable;
  }

  isTelegramWebApp(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(window.Telegram?.WebApp && window.Telegram.WebApp.initData);
  }

  getInitData(): string {
    return this.initData || (typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '');
  }

  haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
    const hf = window.Telegram?.WebApp?.HapticFeedback;
    if (!hf) return;
    try {
      if (['light', 'medium', 'heavy'].includes(type)) {
        hf.impactOccurred(type as 'light');
      } else {
        hf.notificationOccurred(type as 'success');
      }
    } catch {}
  }

  hapticImpact(style: 'light' | 'medium' | 'heavy' = 'light') {
    this.haptic(style);
  }

  hapticNotification(type: 'success' | 'warning' | 'error') {
    this.haptic(type);
  }

  close() {
    window.Telegram?.WebApp?.close();
  }
}

export const tg = new TelegramService();
