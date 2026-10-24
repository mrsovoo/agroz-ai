import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  X,
  Menu,
  FlaskConical,
  Calendar,
  Layers,
  ArrowRight,
  AlertTriangle,
  PackageCheck,
  BookOpen,
  Package,
  Receipt,
  CheckCheck,
  Clock,
  LogOut
} from 'lucide-react';
import { Product } from '../types';
import { api, formatUZS } from '../lib/api';

interface NotificationItem {
  id: string;
  type: 'expiry' | 'debt' | 'stock' | 'sale';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionTab?: string;
}

interface TopBarProps {
  activeTab?: string;
  criticalCount: number;
  onNavigateTab: (tab: any) => void;
  onOpenMobileMenu?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  criticalCount,
  onNavigateTab,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  onLogout
}) => {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Bildirishnomalar holati (Productionda faqat real ogohlantirishlar)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Real FEFO xavfi bo'lganda bildirishnoma yaratish
  useEffect(() => {
    if (criticalCount > 0) {
      setNotifications(prev => {
        if (prev.some(n => n.id === 'fefo-critical-alert')) return prev;
        return [
          {
            id: 'fefo-critical-alert',
            type: 'expiry',
            title: 'FEFO: Muddati Tugayotgan Dori',
            message: `${criticalCount} ta preparatning yaroqlilik muddatiga 30 kun yoki undan kam qoldi. Birinchi bo'lib sotilishi shart!`,
            time: 'Hozir',
            isRead: false,
            actionTab: 'products'
          },
          ...prev
        ];
      });
    }
  }, [criticalCount]);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Tashqi bosishni tekshirish (Qidiruv va Bildirishnomalar yopilishi uchun)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape bosilganda modal va dropdownlarni yopish
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        setIsNotificationOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time avto qidiruv takliflarini yuklash
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setShowSuggestions(true);
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await api.getProducts(query);
        setSuggestions(data.products || []);
      } catch (err) {
        console.error('Avto-qidiruv xatosi:', err);
      } finally {
        setIsLoading(false);
      }
    }, 120); // 120ms debounce orqali real-time chaqqon javob

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onSearchChange(val);
    setShowSuggestions(true);
  };

  const handleSelectProduct = (product: Product) => {
    onSearchChange(product.name);
    setShowSuggestions(false);
    onNavigateTab('products');
  };

  const handleViewAll = () => {
    setShowSuggestions(false);
    onNavigateTab('products');
  };

  // Qidirilayotgan qismni (masalan "iver") matnda yorqin ajratib ko'rsatish
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="bg-emerald-100 text-emerald-800 font-extrabold rounded-xs px-0.5">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications(
      notifications.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setIsNotificationOpen(false);
    if (item.actionTab) {
      onNavigateTab(item.actionTab);
    }
  };

  return (
    <>
      <header className="h-16 sm:h-20 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/60 bg-[#fafafa]/80 backdrop-blur-xs sticky top-0 z-30">
        {/* Chap Tomon: Mobil Menu Tugmasi + Ombor Real-time Qidiruv Inputi */}
        <div className="flex items-center space-x-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:hidden shrink-0 shadow-2xs"
            title="Menyuni ochish"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Agar Tezkor Kassa (POS) yoki Ombor (products) bo'lsa, qidiruv bo'lim ichida bo'ladi */}
          {activeTab === 'pos' ? (
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900">Tezkor Kassa</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Kassa Faol
              </span>
            </div>
          ) : activeTab === 'products' ? (
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-900">Ombor & Dori Vositalari</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Agro-Vet Dorixona
              </span>
            </div>
          ) : (
            /* Dashboard, Qarz Daftari yoki Hisobotlarda real-time qidiruv */
            <div ref={searchContainerRef} className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowSuggestions(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleViewAll();
                }
              }}
              placeholder="Mahsulotlar, partiya yoki shtrix-kodni qidirish..."
              className="w-full bg-white pl-10 pr-9 py-2 sm:py-2.5 rounded-full border border-slate-200/90 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-black shadow-2xs font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* REAL-TIME AVTO-QIDIRUV DROPDOWN PANELI */}
            {showSuggestions && searchQuery.trim().length > 0 && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-0 sm:top-full sm:mt-2 w-auto sm:w-full sm:min-w-[500px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header: Holat */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center space-x-1.5">
                    <span>Qidiruv natijasi:</span>
                    <span className="text-emerald-700 font-extrabold font-mono">"{searchQuery}"</span>
                    <span className="text-slate-400 font-normal">
                      ({suggestions.length} ta dori topildi)
                    </span>
                  </div>
                  {isLoading && (
                    <div className="text-[10px] text-slate-400 animate-pulse font-medium">
                      Qidirilmoqda...
                    </div>
                  )}
                </div>

                {/* Ro'yxat */}
                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100">
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => {
                      const isCritical = (item.days_to_expiry ?? 999) <= 30;
                      const isOut = item.stock <= 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectProduct(item)}
                          className="p-3 sm:p-3.5 hover:bg-emerald-50/50 cursor-pointer transition flex items-center space-x-3 group"
                        >
                          {/* Mahsulot Rasmi yoki Ikonka */}
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <FlaskConical className="w-5 h-5 text-slate-400" />
                            )}
                          </div>

                          {/* Mahsulot Tafsilotlari */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-slate-900 truncate">
                                {highlightMatch(item.name, searchQuery)}
                              </h4>
                              <span className="font-extrabold text-xs text-slate-900 ml-2 shrink-0">
                                {formatUZS(item.price)}
                              </span>
                            </div>

                            {/* Faol modda (Agro-Vet uchun eng muhim qidiruv) */}
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              <span className="text-slate-400 font-medium">Faol modda: </span>
                              {highlightMatch(item.active_ingredient || '—', searchQuery)}
                            </div>

                            {/* Seriya, Qoldiq va Muddat bitta toza qatorda */}
                            <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500 font-mono">
                              <span>{item.batch_number}</span>
                              <span>•</span>
                              <span className={isOut ? 'text-rose-600 font-bold' : 'text-slate-700 font-semibold'}>
                                {isOut ? 'Tugagan' : `${item.stock} ta qoldiq`}
                              </span>
                              <span>•</span>
                              <span className={isCritical ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                                {item.expiry_date}
                              </span>
                            </div>
                          </div>

                          {/* O'tish belgisi */}
                          <div className="shrink-0 text-slate-300 group-hover:text-emerald-600 transition pl-1">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        "{searchQuery}" bo'yicha hech qanday dori topilmadi
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dori nomi, faol modda yoki seriya raqami bo'yicha boshqacha qidirib ko'ring
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer: Barchasini Ombor & Dorilarda ochish */}
                {suggestions.length > 0 && (
                  <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={handleViewAll}
                      className="w-full py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition shadow-xs"
                    >
                      <span>Omborda to'liq ko'rish ({suggestions.length} ta dori)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
            </div>
          )}
        </div>

        {/* O'ng Tomon: Bildirishnomalar va Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 ml-2">
          {/* Notifications Dropdown Container */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-white px-3 sm:px-4 py-2 rounded-full border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer active:scale-95"
            >
              <Bell className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Bildirishnomalar</span>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Bildirishnomalar Paneli Dropdown */}
            {isNotificationOpen && (
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-slate-700" />
                    <span className="font-extrabold text-xs text-slate-900">Bildirishnomalar</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] font-mono">
                        {unreadCount} yangi
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>O'qildi</span>
                    </button>
                  )}
                </div>

                {/* Ro'yxat */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Hozircha yangi bildirishnomalar yo'q
                    </div>
                  ) : (
                    notifications.map((item) => {
                    const isExpiry = item.type === 'expiry';
                    const isDebt = item.type === 'debt';
                    const isStock = item.type === 'stock';

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start space-x-3 ${
                          !item.isRead ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        {/* Ikonka */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isExpiry
                              ? 'bg-rose-100 text-rose-600'
                              : isDebt
                              ? 'bg-amber-100 text-amber-600'
                              : isStock
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {isExpiry && <AlertTriangle className="w-4 h-4" />}
                          {isDebt && <BookOpen className="w-4 h-4" />}
                          {isStock && <Package className="w-4 h-4" />}
                          {item.type === 'sale' && <Receipt className="w-4 h-4" />}
                        </div>

                        {/* Kontent */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5
                              className={`text-xs truncate ${
                                !item.isRead
                                  ? 'font-extrabold text-slate-900'
                                  : 'font-bold text-slate-700'
                              }`}
                            >
                              {item.title}
                            </h5>
                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1"></span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {item.message}
                          </p>

                          <div className="flex items-center justify-between mt-2 pt-1 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{item.time}</span>
                            </span>
                            <span className="text-emerald-700 font-semibold hover:underline flex items-center space-x-0.5">
                              <span>O'tish</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                </div>

                {/* Footer */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(false);
                      onNavigateTab('dashboard');
                    }}
                    className="text-xs font-bold text-slate-700 hover:text-black py-1 block w-full cursor-pointer"
                  >
                    Barcha ogohlantirishlar tahlilini ko'rish
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chiqish (Logout) Tugmasi - Notification bilan bir qatorda */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center space-x-1.5 bg-white px-3 sm:px-3.5 py-2 rounded-full border border-slate-200/90 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition shadow-2xs cursor-pointer active:scale-95 shrink-0"
              title="Hisobdan chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          )}
        </div>
      </header>
    </>
  );
};
