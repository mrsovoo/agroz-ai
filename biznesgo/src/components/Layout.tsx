import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { tg } from '../lib/telegram';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  Wheat,
  Warehouse,
  Sprout,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import type { BusinessType } from '../types';

interface LayoutProps {
  currentView?: string;
  onNavigate?: (view: any) => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView: propsView,
  onNavigate: propsNavigate,
  onLogout: propsLogout,
  children
}) => {
  const { merchant, currentView: storeView, setCurrentView, getBusinessInfo } = useStore();
  const currentView = propsView || storeView;
  const onNavigate = propsNavigate || ((v: any) => setCurrentView(v));
  const onLogout = propsLogout || (() => {
    localStorage.removeItem('biznesgo_token');
    window.location.reload();
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const bInfo = getBusinessInfo();

  const getBusinessIcon = (type: BusinessType | undefined) => {
    switch (type) {
      case 'feed': return Wheat;
      case 'warehouse': return Warehouse;
      case 'seeds': return Sprout;
      case 'machinery': return Wrench;
      default: return Store;
    }
  };

  const BusinessIcon = getBusinessIcon(merchant?.business_type);

  const BUSINESS_TYPE_TITLES: Record<string, string> = {
    agro_vet: 'Agro-Vet dorixona',
    feed: 'Yem-ozuqa savdosi',
    warehouse: 'Ulgurji ombor',
    seeds: 'Urug‘ va ko‘chat',
    machinery: 'Jihoz va texnika',
  };

  const businessLabel = merchant?.business_type ? (BUSINESS_TYPE_TITLES[merchant.business_type] || merchant.business_type) : 'Do‘kon';

  const navItems = [
    { key: 'dashboard', label: 'Asosiy panel', icon: LayoutDashboard, shortLabel: 'Asosiy' },
    { key: 'pos', label: 'Kassa', icon: ShoppingCart, shortLabel: 'Kassa' },
    { key: 'products', label: 'Ombor', icon: Package, shortLabel: 'Ombor' },
    { key: 'debts', label: 'Qarzlar', icon: BookOpen, shortLabel: 'Qarzlar' },
    { key: 'settings', label: 'Sozlamalar', icon: Settings, shortLabel: 'Sozlamalar' },
  ];

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileDrawerOpen(false);
    tg.haptic('light');
  };

  const currentTitle = navItems.find((n) => n.key === currentView)?.label || 'BiznesGO';

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 leading-tight">BiznesGO</h1>
            <span className="text-[11px] font-medium text-slate-500">
              Savdo boshqaruvi
            </span>
          </div>
        </div>

        {/* Store Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="font-bold text-sm text-slate-800 truncate">
            {merchant?.store_name || 'Mening Do‘konim'}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-bold">
            <BusinessIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{businessLabel}</span>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] font-medium text-slate-400">
            v1.0.0
          </div>
          <button
            onClick={onLogout}
            title="Tizimdan chiqish"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 pb-20 md:pb-6">
        {/* Topbar */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Menyu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-slate-800">
              {currentTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-semibold text-slate-500">
              {merchant?.store_name}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Faol
            </span>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer (Sidebar) Overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 bg-white flex flex-col h-full z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-slate-800 text-sm">BiznesGO</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 mx-3 my-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="font-bold text-xs text-slate-800 truncate">{merchant?.store_name}</div>
              <div className="text-[11px] text-slate-600 font-bold">{businessLabel}</div>
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile / Telegram Mini App Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleNavClick(item.key)}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
                active ? 'text-emerald-600 font-bold' : 'text-slate-400 font-medium hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${active ? 'scale-110 bg-emerald-50 text-emerald-600' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

