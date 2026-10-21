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
import { BiznesGoLogo } from './BiznesGoLogo';

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
    <>
      {/* Desktop & Tablet Vertical Sidebar Dock */}
      <aside className="hidden sm:flex w-16 sm:w-20 bg-[#F6F6F3] flex-col items-center justify-between py-6 shrink-0 border-r border-slate-200/50">
        {/* Top Brand Logo */}
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={() => onSelectView('dashboard')}
            className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center hover:scale-105 transition-all duration-300 cursor-pointer p-2 group"
            title="BiznesGO Boshqaruv Markazi"
          >
            <BiznesGoLogo variant="icon" className="w-7 h-7 transition-transform group-hover:scale-110" iconColor="#35ca56" />
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
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#35ca56] ring-2 ring-white"></span>
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

      {/* Mobile Ergonomic Bottom Navigation Dock (< sm) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F6F6F3]/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around shadow-lg safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all cursor-pointer ${
                isActive ? 'text-black font-bold scale-105' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isActive ? 'bg-black text-white shadow-xs' : 'bg-transparent text-slate-500'
              }`}>
                <Icon className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[54px]">
                {item.id === 'dashboard' ? 'Panel' : item.id === 'merchants' ? 'Do‘kon' : item.id === 'map' ? 'Xarita' : item.id === 'support' ? 'Chat' : item.id === 'broadcast' ? 'Push' : 'Arxiv'}
              </span>
              {item.id === 'support' && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#35ca56] ring-2 ring-white"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
