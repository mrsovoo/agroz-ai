import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ActiveTab } from './components/Navbar';
import { DashboardView } from './views/DashboardView';
import { PosView } from './views/PosView';
import { ProductsView } from './views/ProductsView';
import { DebtsView } from './views/DebtsView';
import { ReportsView } from './views/ReportsView';
import { api } from './lib/api';
import { DashboardMetrics } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadGlobalMetrics = async () => {
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGlobalMetrics();
    const interval = setInterval(loadGlobalMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-[#fafafa] flex flex-row overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 1. Chap Vertikal Sidebar (Logo + 4 ta Bo'lim + Pastda Bitta Holat Kartasi) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        criticalCount={metrics?.critical_expiry_count || 0}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Asosiy Maydon (TopBar + Scrollable Kontent) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#fafafa]">
        {/* Yuqori Panel: Ombor qidiruvi, Bildirishnoma, Yagona Profil Avatari */}
        <TopBar
          activeTab={activeTab}
          criticalCount={metrics?.critical_expiry_count || 0}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Kontent Bo'limi (Faqat 4 ta asosiy ekran) */}
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
