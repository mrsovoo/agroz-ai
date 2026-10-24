import React from 'react';
import { LayoutDashboard, ShoppingCart, Package, BookOpen } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'pos' | 'products' | 'debts' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartCount?: number;
  criticalCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  cartCount = 0,
  criticalCount = 0
}) => {
  const tabs = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Boshqaruv Paneli',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: criticalCount > 0 ? `${criticalCount} ta xavf` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'pos' as ActiveTab,
      label: 'Tezkor Kassa',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: cartCount > 0 ? cartCount : undefined,
      badgeColor: 'bg-emerald-600 text-white'
    },
    {
      id: 'products' as ActiveTab,
      label: 'Ombor & Dorilar',
      icon: <Package className="w-4 h-4" />
    },
    {
      id: 'debts' as ActiveTab,
      label: 'Qarz Daftari',
      icon: <BookOpen className="w-4 h-4" />
    }
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex space-x-2 sm:space-x-4 py-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-[11px] font-bold rounded-full ${
                      isActive ? 'bg-white text-black' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
