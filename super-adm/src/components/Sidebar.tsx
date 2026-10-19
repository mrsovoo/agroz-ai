import React from 'react';
import { 
  Home, 
  Store, 
  MapPin,
  Send, 
  Archive, 
  MessageSquare, 
  Key, 
  RotateCcw,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'merchants' | 'map' | 'broadcast' | 'archive' | 'support';
  onSelectView: (view: 'dashboard' | 'merchants' | 'map' | 'broadcast' | 'archive' | 'support') => void;
  onOpenKeyModal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView, onOpenKeyModal, onLogout }) => {
  const navItems = [
    { id: 'dashboard' as const, label: 'Boshqaruv Paneli', icon: Home },
    { id: 'merchants' as const, label: "Do'konlar Ro‘yxati", icon: Store },
    { id: 'map' as const, label: 'Viloyatlar Xaritasi', icon: MapPin },
    { id: 'support' as const, label: 'Murojaatlar & Chat', icon: MessageSquare },
    { id: 'broadcast' as const, label: 'Push Xabarnoma', icon: Send },
    { id: 'archive' as const, label: 'Arxiv & Baza', icon: Archive },
  ];

  return (
    <aside className="w-16 sm:w-20 bg-[#F6F6F3] flex flex-col items-center justify-between py-6 shrink-0 border-r border-slate-200/50">
      {/* Top Brand Sunburst Logo */}
      <div className="flex flex-col items-center gap-6">
        <button 
          onClick={() => onSelectView('dashboard')}
          className="w-10 h-10 flex items-center justify-center hover:rotate-45 transition-transform duration-300 cursor-pointer"
          title="BiznesGO Boshqaruv Markazi"
        >
          {/* 12-ray sunburst asterisk icon matching reference image */}
          <svg className="w-8 h-8 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
        </button>

        {/* Vertical Icon Navigation Dock */}
        <nav className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                title={item.label}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-md shadow-black/10 scale-105'
                    : 'text-slate-500 hover:text-black hover:bg-white/80'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
                {item.id === 'support' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#22C55E] ring-2 ring-white"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions Dock */}
      <div className="flex flex-col items-center gap-3">
        {onOpenKeyModal && (
          <button
            onClick={onOpenKeyModal}
            title="Admin Kalitini Sozlash"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-black hover:bg-white/80 transition cursor-pointer"
          >
            <Key className="w-4 h-4 stroke-[2]" />
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          title="Sahifani yangilash"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-black hover:bg-white/80 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 stroke-[2]" />
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            title="Tizimdan Chiqish (Logout)"
            className="w-10 h-10 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 stroke-[2]" />
          </button>
        )}
      </div>
    </aside>
  );
};
