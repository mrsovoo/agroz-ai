import { useEffect, useState, useCallback } from 'react';
import {
  getTelegramWebApp,
  initTelegramApp,
  telegramHaptic,
  type TelegramWebApp,
  type TelegramWebAppUser,
} from './index';

export function useTelegram() {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (webApp) {
      setTg(webApp);
      const res = initTelegramApp();
      setIsTelegram(res.isTelegram);
      setUser(res.user);
    }
  }, []);

  const expand = useCallback(() => {
    try {
      tg?.expand();
    } catch {
      // ignore
    }
  }, [tg]);

  const close = useCallback(() => {
    try {
      tg?.close();
    } catch {
      // ignore
    }
  }, [tg]);

  const openTelegramLink = useCallback((url: string) => {
    try {
      if (tg?.openTelegramLink) {
        tg.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch {
      window.open(url, '_blank');
    }
  }, [tg]);

  const showAlert = useCallback((message: string) => {
    if (tg?.showAlert) {
      tg.showAlert(message);
    } else {
      alert(message);
    }
  }, [tg]);

  // Native Telegram QR / Shtrix-kod kamerasi
  const scanQr = useCallback((text = 'Dori yoki tovar shtrix-kodini skanerlang'): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!tg?.showScanQrPopup) {
        resolve(null);
        return;
      }
      try {
        telegramHaptic.light();
        tg.showScanQrPopup({ text }, (scannedText: string) => {
          telegramHaptic.success();
          tg.closeScanQrPopup();
          resolve(scannedText);
          return true;
        });
      } catch {
        resolve(null);
      }
    });
  }, [tg]);

  return {
    tg,
    user,
    isTelegram,
    haptic: telegramHaptic,
    expand,
    close,
    openTelegramLink,
    showAlert,
    scanQr,
  };
}
