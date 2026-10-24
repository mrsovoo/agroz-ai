import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ActiveTab } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { ProductsView } from './views/ProductsView';
import { DebtsView } from './views/DebtsView';
import { ReportsView } from './views/ReportsView';
import { AuthView } from './views/AuthView';
import { api, getToken, getUser } from './lib/api';
import { DashboardMetrics } from './types';

export const App: React.FC = () => {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [currentUser, setCurrentUser] = useState<any | null>(() => getUser());

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [storeName, setStoreName] = useState<string>(() => {
    const u = getUser();
    if (u?.name) return u.name;
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('store') || params.get('name') || params.get('merchant_name');
    if (fromParam) {
      try { localStorage.setItem('biznesgo_store_name', fromParam); } catch (_) {}
      return fromParam;
    }
    try {
      const saved = localStorage.getItem('biznesgo_store_name');
      if (saved) return saved;
    } catch (_) {}
    return 'Agro-Vet Dorixona';
  });

  const loadGlobalMetrics = async () => {
    if (!token) return;
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Metrics fetch error:', err.message);
      // Agar 401 qaytsa, tokenni tozalab qayta loginga yo'naltiramiz
      if (err.message && err.message.includes('Avtorizatsiyadan')) {
        handleLogout();
      }
    }
  };

  useEffect(() => {
    // Telegram WebApp orqali ochilganda to'liq mobil ilova rejimiga o'tkazish
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#fafafa');
        tg.setBackgroundColor('#fafafa');
        tg.enableClosingConfirmation();
      } catch (err) {
        console.warn('Telegram WebApp custom styling qo\'llab-quvvatlanmadi:', err);
      }
    }

    if (token) {
      loadGlobalMetrics();
      const interval = setInterval(loadGlobalMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const handleAuthSuccess = (tenant: any, newToken: string) => {
    setTokenState(newToken);
    setCurrentUser(tenant);
    const name = tenant.name || 'Agro-Vet Dorixona';
    setStoreName(name);
    try {
      localStorage.setItem('biznesgo_store_name', name);
    } catch (_) {}
  };

  const handleLogout = () => {
    api.logout();
    setTokenState(null);
    setCurrentUser(null);
  };

  // Agar token bo'lmasa -> Faqat Agro-Vet Dorixona uchun Ro'yxatdan o'tish yoki Kirish ekranini chiqaramiz
  if (!token) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen w-full bg-[#fafafa] flex flex-row overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Chap Vertikal Sidebar (Logo + 5 ta Bo'lim + Pastda Dorixona Nomi & Chiqish) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        criticalCount={metrics?.critical_expiry_count || 0}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        storeName={storeName}
        onLogout={handleLogout}
      />

      {/* 2. Asosiy Maydon (TopBar + Scrollable Kontent) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fafafa]">
        {/* Yuqori Panel: Ombor qidiruvi, Bildirishnoma, Chiqish */}
        <TopBar
          activeTab={activeTab}
          criticalCount={metrics?.critical_expiry_count || 0}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={handleLogout}
        />

        {/* Kontent Bo'limi (Faqat 1-sektor Agro-Vet dorixona ekranlari) */}
        <main
          className={`flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 ${
            activeTab === 'pos' ? 'pb-24 lg:pb-6' : ''
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddProduct={() => {
                setActiveTab('products');
                setIsAddProductOpen(true);
              }}
            />
          )}
          {activeTab === 'pos' && <PosView />}
          {activeTab === 'products' && (
            <ProductsView
              isAddModalOpenInitially={isAddProductOpen}
              onCloseAddModal={() => setIsAddProductOpen(false)}
              externalSearch={searchQuery}
              onExternalSearchChange={setSearchQuery}
            />
          )}
          {activeTab === 'debts' && <DebtsView />}
          {activeTab === 'reports' && (
            <ReportsView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
