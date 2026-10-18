import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { api } from './lib/api';
import { tg } from './lib/telegram';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/Toast';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { ProductsView } from './views/ProductsView';
import { DebtsView } from './views/DebtsView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const { merchant, setMerchant, currentView, addToast } = useStore();
  const [initializing, setInitializing] = useState(true);
  const [telegramOnboarding, setTelegramOnboarding] = useState<{
    telegram_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  } | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize Telegram WebApp fullscreen and viewport
        tg.init();

        if (tg.isTelegramWebApp()) {
          const initData = tg.getInitData();
          if (initData) {
            try {
              const res = await api.auth.telegram(initData);
              if (res.token) {
                api.setToken(res.token);
              }
              if (res.merchant) {
                setMerchant(res.merchant);
              } else if (res.needs_onboarding && res.user) {
                setTelegramOnboarding({
                  telegram_id: res.user.telegram_id,
                  first_name: res.user.first_name,
                  last_name: res.user.last_name,
                  username: res.user.username,
                });
              }
            } catch (tgErr: any) {
              console.warn('Telegram auth verification fallback:', tgErr.message);
              // Check existing token if any
              const savedToken = api.getToken();
              if (savedToken) {
                try {
                  const me = await api.auth.me();
                  setMerchant(me.merchant);
                } catch {
                  api.setToken(null);
                }
              }
            }
          }
        } else {
          // Standard Web Browser: check saved JWT token
          const token = api.getToken();
          if (token) {
            try {
              const me = await api.auth.me();
              setMerchant(me.merchant);
            } catch {
              api.setToken(null);
            }
          }
        }
      } catch (err: any) {
        console.error('App init error:', err);
      } finally {
        setInitializing(false);
      }
    };

    initApp();
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-slate-800 font-bold text-base">BiznesGO B2B yuklanmoqda...</h3>
        <p className="text-slate-500 text-xs mt-1">Tizim va xavfsizlik tekshirilmoqda</p>
      </div>
    );
  }

  // Not authenticated or needs onboarding
  if (!merchant) {
    return (
      <>
        <AuthView
          telegramOnboarding={telegramOnboarding}
          onSuccess={() => setTelegramOnboarding(null)}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <Layout>
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'pos' && <PosView />}
      {currentView === 'products' && <ProductsView />}
      {currentView === 'debts' && <DebtsView />}
      {currentView === 'settings' && <SettingsView />}
      <ToastContainer />
    </Layout>
  );
};

