import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SectorCode } from '../../core/types';
import { initTelegramApp, type TelegramWebAppUser } from '../../core/platform/telegram';

export interface BusinessProfile {
  name: string;
  phone: string;
  sector: SectorCode;
  address?: string;
  storeType?: 'retail' | 'wholesale';
}

interface AppContextType {
  business: BusinessProfile | null;
  registerBusiness: (profile: BusinessProfile) => void;
  updateBusiness: (profile: Partial<BusinessProfile>) => void;
  currentSector: SectorCode;
  isTelegram: boolean;
  telegramUser: TelegramWebAppUser | null;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'biznesgo_active_business';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Boshida saqlangan do'konni yoki Telegram Launch App parametrlarini o'qiymiz
  const [business, setBusiness] = useState<BusinessProfile | null>(() => {
    try {
      // 1. Agar Telegram Launch App orqali parametrlar bilan ochilgan bo'lsa
      if (typeof window !== 'undefined' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlName = urlParams.get('name') || urlParams.get('store_name');
        const urlSector = urlParams.get('sector');
        const urlPhone = urlParams.get('phone');
        const urlRegion = urlParams.get('region');

        if (urlName && urlSector) {
          const profile: BusinessProfile = {
            name: decodeURIComponent(urlName),
            sector: urlSector as SectorCode,
            phone: urlPhone ? decodeURIComponent(urlPhone) : '+998 90 123 45 67',
            address: urlRegion ? decodeURIComponent(urlRegion) : undefined,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
          return profile;
        }
      }

      // 2. LocalStorage dan saqlangan profilni o'qish
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);

      // 3. Telegram WebApp ichida ochilgan bo'lsa, Telegram foydalanuvchisi uchun avtomatik profil
      const tgUser = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser) {
        const autoProfile: BusinessProfile = {
          name: tgUser.first_name ? `${tgUser.first_name} Agro Savdo` : 'BiznesGO Do‘kon',
          sector: 'pharmacy',
          phone: '+998 90 123 45 67',
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(autoProfile));
        return autoProfile;
      }

      return null;
    } catch {
      return null;
    }
  });

  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramWebAppUser | null>(null);

  useEffect(() => {
    const res = initTelegramApp();
    if (res.isTelegram) {
      setIsTelegram(true);
      setTelegramUser(res.user);

      // Agar Telegram ichida bo'lib profil bo'lmasa, avtomatik profiling yaratish
      if (!business && res.user) {
        const autoProfile: BusinessProfile = {
          name: res.user.first_name ? `${res.user.first_name} Do‘koni` : 'BiznesGO Do‘kon',
          sector: 'pharmacy',
          phone: '+998 90 123 45 67',
        };
        registerBusiness(autoProfile);
      }
    }
  }, []);

  const registerBusiness = (profile: BusinessProfile) => {
    setBusiness(profile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const updateBusiness = (partial: Partial<BusinessProfile>) => {
    setBusiness((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        business,
        registerBusiness,
        updateBusiness,
        currentSector: business?.sector ?? 'pharmacy',
        isTelegram,
        telegramUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};