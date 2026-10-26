import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  ShoppingCart,
  Boxes,
  BookOpenCheck,
  BarChart3,
  Settings,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Bell,
  AlertTriangle,
  Clock,
  Truck,
  Banknote,
  CheckCheck,
  ArrowRight,
  Plus,
  HelpCircle,
  SlidersHorizontal,
  Printer,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useApp } from '../providers/AppContext';
import { useTelegram } from '../../core/platform/telegram/useTelegram';
import { StarburstLogo } from '../../shared/components/StarburstLogo';
import { BiznesGoLogo } from '../../shared/components/BiznesGoLogo';
import { ItemIcon } from '../../shared/components/ItemIcon';

interface NotificationItem {
  id: string;
  type: 'stock' | 'debt' | 'delivery' | 'cash';
  title: string;
  desc: string;
  time: string;
  link: string;
  isRead: boolean;
}

interface ProductSearchItem {
  id: string;
  name: string;
  category: string;
  stock: string;
  price: string;
  iconType: string;
  sector: string;
  expiry?: string;
}

export const MainLayout: React.FC = () => {
  const { business } = useApp();
  const { isTelegram, tg, haptic, user: tgUser } = useTelegram();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Qidiruv holati (Live Search)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dori va mahsulotlar ma'lumotlar bazasi (Qidiruv uchun)
  const productsCatalog: ProductSearchItem[] = [
    {
      id: 'dori-1',
      name: 'Enrofloksatsin 10% (100ml flakon)',
      category: 'Antibiotik veterinariya preparati',
      stock: '42 dona omborda',
      price: '45 000 so‘m',
      iconType: 'pill',
      sector: 'Agro & Vet Dorixona',
      expiry: 'Yaroqlilik: 12.2027',
    },
    {
      id: 'dori-2',
      name: 'Oksitetrasiklin 20% L.A. (100ml)',
      category: 'Keng qamrovli inyeksiya antibiotigi',
      stock: '18 dona omborda',
      price: '62 000 so‘m',
      iconType: 'pill',
      sector: 'Agro & Vet Dorixona',
      expiry: 'Yaroqlilik: 08.2027',
    },
    {
      id: 'dori-3',
      name: 'Vitamin B-Kompleks (100ml flakon)',
      category: 'Organizm quvvatlovchi dori va vitamin',
      stock: '65 dona omborda',
      price: '38 000 so‘m',
      iconType: 'pill',
      sector: 'Agro & Vet Dorixona',
      expiry: 'Yaroqlilik: 05.2028',
    },
    {
      id: 'dori-4',
      name: 'Ivermektin 1% (50ml inyeksiya)',
      category: 'Parazit va gijjalarga qarshi dori',
      stock: '24 dona omborda',
      price: '55 000 so‘m',
      iconType: 'pill',
      sector: 'Agro & Vet Dorixona',
      expiry: 'Yaroqlilik: 03.2027',
    },
    {
      id: 'dori-5',
      name: 'Amoksisillin 15% Suspenziya (100ml)',
      category: 'Bakterial infeksiyalarga qarshi dori',
      stock: '15 dona omborda',
      price: '75 000 so‘m',
      iconType: 'pill',
      sector: 'Agro & Vet Dorixona',
      expiry: 'Yaroqlilik: 11.2027',
    },
    {
      id: 'dori-6',
      name: 'Biostimulyator Gumat Kaliy (1 litr)',
      category: 'O‘simlik hosildorlik preparati va o‘g‘it',
      stock: '50 litr omborda',
      price: '65 000 so‘m',
      iconType: 'sprout',
      sector: 'Urug‘ & Bog‘dorchilik',
    },
    {
      id: 'feed-1',
      name: 'Kombikorm Broyler Start (50 kg qop)',
      category: 'Parranda ozuqa yem-xashak',
      stock: '28 qop omborda',
      price: '290 000 so‘m',
      iconType: 'wheat',
      sector: 'Yem-xashak Ombori',
    },
    {
      id: 'seed-1',
      name: 'Pomidor urug‘i "Bella" F1 (500 dona)',
      category: 'Gollandiya birinchi avlod urug‘i (98% unuvchanlik)',
      stock: '14 pachka omborda',
      price: '90 000 so‘m',
      iconType: 'sprout',
      sector: 'Urug‘chilik',
    },
    {
      id: 'green-1',
      name: 'Issiqxona plyonkasi (120 mkr uch qatlam)',
      category: 'Issiqxona jihozi · Ultrabinafsha himoyali',
      stock: '850 metr omborda',
      price: '10 000 so‘m/m',
      iconType: 'leaf',
      sector: 'Issiqxona',
    },
    {
      id: 'mach-1',
      name: 'Motoblok havo filtri & moy to‘plami',
      category: 'Agrotexnika ehtiyot qismlari',
      stock: '10 komplekt omborda',
      price: '130 000 so‘m',
      iconType: 'tractor',
      sector: 'Qishloq Xo‘jalik Texnikasi',
    },
  ];

  // Qidiruv natijalari
  const searchResults = searchQuery.trim().length > 0
    ? productsCatalog.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        return (
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.sector.toLowerCase().includes(query)
        );
      })
    : [];

  // Bildirishnomalar ro'yxati
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      type: 'stock',
      title: 'Kam qolgan tovar zaxirasi',
      desc: 'Kombikorm Broyler (50 kg) atigi 5 qop qoldi. Yangi partiyaga buyurtma bering.',
      time: '12 daqiqa oldin',
      link: '/inventory',
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'debt',
      title: 'Qarz to‘lovi muddati o‘tdi',
      desc: 'Jamshid aka (Issiqxona) — 850 000 so‘m nasiya to‘lovi 3 kunga kechikmoqda.',
      time: '45 daqiqa oldin',
      link: '/debts',
      isRead: false,
    },
    {
      id: 'notif-3',
      type: 'delivery',
      title: 'Yangi yuk partiyasi qabul qilindi',
      desc: 'Toshkent Agro Distribyutordan 3-bosqichli yuk to‘liq omborga kirim qilindi.',
      time: 'Bugun, 11:20',
      link: '/inventory',
      isRead: false,
    },
    {
      id: 'notif-4',
      type: 'cash',
      title: 'Kassa tushumi yangilandi',
      desc: 'Bugungi kassa aylanmasi 4 850 000 so‘mga yetdi (42 ta faol chek).',
      time: 'Bugun, 09:30',
      link: '/pos',
      isRead: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Tashqariga bosilganda dropdownlarni yopish
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Telegram BackButton integratsiyasi
  useEffect(() => {
    if (!tg?.BackButton) return;

    if (location.pathname !== '/') {
      tg.BackButton.show();
      const onBackClick = () => {
        haptic.light();
        navigate(-1);
      };
      tg.BackButton.onClick(onBackClick);
      return () => {
        tg.BackButton.offClick(onBackClick);
      };
    } else {
      tg.BackButton.hide();
    }
  }, [location.pathname, tg, navigate, haptic]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    setNotificationsOpen(false);
    navigate(notif.link);
  };

  const handleSelectProduct = (product: ProductSearchItem, action: 'pos' | 'inventory') => {
    setSearchDropdownOpen(false);
    setSearchQuery('');
    if (action === 'pos') {
      navigate('/pos');
    } else {
      navigate('/inventory');
    }
  };

  if (!business) {
    return <Navigate to="/register" replace />;
  }

  // 5 ta asosiy operatsion bo'lim (Sozlamalar foydalanuvchi profili ichiga joylashtirilgan)
  const navItems = [
    { to: '/', label: 'Boshqaruv', icon: LayoutGrid },
    { to: '/pos', label: 'Kassa (POS)', icon: ShoppingCart },
    { to: '/inventory', label: 'Ombor & Tovar', icon: Boxes },
    { to: '/debts', label: 'Qarz Daftari', icon: BookOpenCheck },
    { to: '/reports', label: 'Hisobotlar', icon: BarChart3 },
  ];

  const sectorLabels: Record<string, string> = {
    pharmacy: 'Agro & Vet Dorixona',
    feed: 'Yem-xashak Ombori',
    seeds: 'Urug‘ & Ko‘chat Do‘koni',
    greenhouse: 'Issiqxona Jihozlari',
    machinery: 'Qishloq Xo‘jalik Texnikasi',
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex antialiased text-slate-900">
      
      {/* ======================================================== */}
      {/* 1. CHAP SIDEBAR: Dribbble Neo-Minimalist Sidebar          */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-60 lg:w-64 bg-white text-slate-400 flex-shrink-0 select-none py-6 px-4 justify-between z-20">
        
        {/* Yuqori qism: Rasmiy BiznesGO Logotipi (Ostida hech qanday ortiqcha matnsiz) */}
        <div className="flex flex-col">
          <NavLink
            to="/"
            className="flex items-center px-1.5 py-1 rounded-2xl hover:opacity-90 transition-opacity cursor-pointer"
            title="BiznesGO Boshqaruv"
          >
            <BiznesGoLogo className="h-8 lg:h-9 w-auto max-w-[200px]" />
          </NavLink>

          {/* O'rta qism: Asosiy bo'limlar (Ikonka + Bo'lim nomi) */}
          <nav className="flex flex-col gap-1.5 mt-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-[#111215] text-white shadow-xs'
                      : 'text-neutral-500 hover:text-[#111215] hover:bg-[#eafaf0]/70'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#35ca56]' : 'text-neutral-400 group-hover:text-[#111215]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#35ca56] shadow-[0_0_8px_#35ca56] flex-shrink-0" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Pastki qism: Yordam */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col gap-2">
          <button
            onClick={() => alert("BiznesGO Yordam Markazi: Email info@biznesgo.uz yoki tel: +998 90 8383772")}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-neutral-500 hover:text-[#111215] hover:bg-[#f7f7f5] transition-colors w-full cursor-pointer text-left"
          >
            <HelpCircle className="h-4 w-4 text-neutral-400 flex-shrink-0" />
            <span className="truncate">Yordam & Qo‘llanma</span>
          </button>
        </div>

      </aside>

      {/* ======================================================== */}
      {/* 2. ASOSIY ISH MAYDONI: Header va jonli qidiruv          */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* YUQORI HEADER */}
        <header className="px-6 lg:px-9 py-4 bg-transparent flex items-center justify-between gap-4 flex-shrink-0">
          
          {/* ======================================================== */}
          {/* CHAP: DORI VA TOVARLARNI JONLI QIDIRISH MAYDONI          */}
          {/* Ombor, Kassa (POS), Qarz daftari, Hisobotlar va          */}
          {/* Sozlamalarda eng tepadagi qidiruv ko'rsatilmaydi         */}
          {/* ======================================================== */}
          {location.pathname.startsWith('/inventory') ||
          location.pathname.startsWith('/pos') ||
          location.pathname.startsWith('/debts') ||
          location.pathname.startsWith('/reports') ||
          location.pathname.startsWith('/settings') ? (
            <div className="flex-1" />
          ) : (
            <div className="flex items-center flex-1 max-w-lg relative" ref={searchRef}>
              <div className="relative w-full">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchDropdownOpen(true);
                  }}
                  placeholder="Dori nomi yoki tovarni yozing (masalan: enro, vita, kombi)..."
                  className="w-full bg-white rounded-full py-3 pl-11 pr-10 text-xs font-semibold text-[#111215] placeholder:text-neutral-400 shadow-2xs border-0 focus:outline-none focus:ring-2 focus:ring-[#111215]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* JONLI QIDIRUV POPUP DROPDOWN OYNASI */}
              {searchDropdownOpen && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 top-14 w-full sm:w-[480px] bg-white rounded-[28px] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[460px] overflow-hidden flex flex-col border-0">
                  
                  {/* Yuqori natija hisoboti */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 px-2 text-xs">
                    <span className="font-extrabold text-[#111215]">
                      Qidiruv natijalari: {searchResults.length} ta dori va tovar topildi
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400">
                      «{searchQuery}» bo‘yicha
                    </span>
                  </div>

                  {/* Natijalar ro'yxati */}
                  <div className="overflow-y-auto divide-y divide-neutral-100 mt-1 pr-1 flex-1">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-10 px-4 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                          <Search className="h-6 w-6 text-neutral-400" />
                        </div>
                        <p className="font-bold text-xs text-neutral-700">
                          «{searchQuery}» nomli dori yoki tovar topilmadi
                        </p>
                        <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                          Nomini to‘g‘ri yozganingizni tekshiring yoki ombor bo‘limidan yangi tovar sifatida qo‘shing.
                        </p>
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 px-2 rounded-2xl hover:bg-[#f7f7f5] transition-colors flex items-center justify-between gap-3 group"
                        >
                          {/* Chap: Ikonka va nom */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-[#efefec] shadow-2xs flex items-center justify-center text-[#111215] flex-shrink-0 group-hover:scale-105 transition-transform border-0">
                              <ItemIcon type={item.iconType} className="h-5 w-5 text-[#111215]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-xs text-[#111215] truncate group-hover:text-emerald-700 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                {item.category}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {item.stock}
                                </span>
                                {item.expiry && (
                                  <span className="text-[10px] font-semibold text-neutral-400">
                                    {item.expiry}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* O'ng: Narx va Tezkor harakat tugmasi */}
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <span className="text-xs font-black text-[#111215]">
                              {item.price}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSelectProduct(item, 'pos')}
                                className="bg-[#111215] hover:bg-[#35ca56] text-white text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Kassaga sotish uchun qo‘shish"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Kassa</span>
                              </button>
                              <button
                                onClick={() => handleSelectProduct(item, 'inventory')}
                                className="bg-[#efefec] text-neutral-700 hover:bg-[#e4e4e0] text-[10px] font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer border-0"
                                title="Omborda ko‘rish"
                              >
                                Ombor
                              </button>
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                  {/* Pastki qism */}
                  <div className="pt-2 border-t border-neutral-100 mt-2 flex items-center justify-between text-[11px] font-semibold text-neutral-400 px-2">
                    <span>Enter tugmasi orqali to‘liq qidiruv</span>
                    <button
                      onClick={() => {
                        navigate('/inventory');
                        setSearchDropdownOpen(false);
                      }}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Barcha tovarlar ombori →
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* O'ng: Bildirishnomalar va Profil */}
          <div className="flex items-center gap-3">
            
            {/* Mobil menyu tugmasi */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-full bg-[#efefec] text-neutral-700 shadow-2xs"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Bildirishnomalar pilli (Dribbble Neo-Minimalist Pill) */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUserDropdownOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs border-0 ${
                  notificationsOpen
                    ? 'bg-[#111215] text-white'
                    : 'bg-[#efefec] hover:bg-[#eaeae6] text-[#111215]'
                }`}
              >
                <Bell className={`h-4 w-4 ${notificationsOpen ? 'text-white' : 'text-[#111215]'}`} />
                <span>Bildirishnomalar</span>
                <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                  notificationsOpen
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-300 text-neutral-800'
                }`}>
                  {unreadCount}
                </span>
              </button>

              {/* Bildirishnomalar oynasi */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[28px] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 border-0">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100 px-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-[#111215]">Bildirishnomalar</h4>
                      {unreadCount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} ta yangi
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>O‘qilgan qilish</span>
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto mt-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">
                        Hozircha yangi bildirishnomalar yo‘q
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        let iconBg = 'bg-slate-100 text-slate-700';
                        let IconComp = Bell;

                        if (notif.type === 'stock') {
                          iconBg = 'bg-rose-50 text-rose-600 border border-rose-200/60';
                          IconComp = AlertTriangle;
                        } else if (notif.type === 'debt') {
                          iconBg = 'bg-amber-50 text-amber-600 border border-amber-200/60';
                          IconComp = Clock;
                        } else if (notif.type === 'delivery') {
                          iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200/60';
                          IconComp = Truck;
                        } else if (notif.type === 'cash') {
                          iconBg = 'bg-blue-50 text-blue-600 border border-blue-200/60';
                          IconComp = Banknote;
                        }

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 my-1 ${
                              notif.isRead
                                ? 'hover:bg-slate-50 opacity-75'
                                : 'bg-slate-50/80 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                              <IconComp className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className={`text-xs font-extrabold truncate ${notif.isRead ? 'text-slate-700' : 'text-[#111215]'}`}>
                                  {notif.title}
                                </p>
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#35ca56] flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.desc}
                              </p>
                              <div className="flex items-center justify-between mt-1.5 pt-1">
                                <span className="text-[10px] font-semibold text-slate-400">
                                  {notif.time}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                                  Ko‘rish <ArrowRight className="h-2.5 w-2.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-2 text-center">
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 py-1 cursor-pointer"
                    >
                      Yopish
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Foydalanuvchi Profili va Sozlamalar (Profile & Settings Dropdown) */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs border-0 ${
                  userDropdownOpen
                    ? 'bg-[#111215] text-white'
                    : 'bg-[#efefec] hover:bg-[#eaeae6] text-[#111215]'
                }`}
                title="Do‘kon profili va sozlamalar"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-white text-[#111215] flex items-center justify-center shadow-2xs border-0 select-none">
                    <ItemIcon type={business.sector} className="h-4 w-4 text-[#111215]" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#35ca56] ring-2 ring-white" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className={`text-[11px] font-extrabold leading-tight max-w-[120px] truncate ${
                    userDropdownOpen ? 'text-white' : 'text-[#111215]'
                  }`}>
                    {business.name}
                  </span>
                  <span className="text-[9px] font-semibold text-neutral-400">
                    Profil & Sozlamalar
                  </span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${userDropdownOpen ? 'rotate-180 text-white' : 'text-neutral-500'}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-[28px] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100 border-0">
                  {/* Profil Bosh Qismi: Sektorga mos ikonka */}
                  <div className="flex items-center gap-3 p-3 bg-[#f7f7f5] rounded-2xl mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#111215] flex items-center justify-center shadow-2xs border-0 flex-shrink-0 select-none">
                      <ItemIcon type={business.sector} className="h-6 w-6 text-[#111215]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-[#111215] truncate">{business.name}</p>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block mt-0.5 truncate max-w-full">
                        {sectorLabels[business.sector] ?? business.sector}
                      </span>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">{business.phone}</p>
                    </div>
                  </div>

                  {/* Profil ichidagi sozlamalar bo'limi */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2 pt-1 pb-1">
                      Sozlamalar & Boshqaruv
                    </p>
                    
                    {/* Asosiy Do'kon Sozlamalari */}
                    <NavLink
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold text-[#111215] hover:bg-[#f7f7f5] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-[#111215] group-hover:text-white text-neutral-700 flex items-center justify-center transition-colors">
                          <Settings className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-extrabold text-xs text-[#111215]">Do‘kon Sozlamalari</p>
                          <p className="text-[10px] text-neutral-400 font-normal">Rekvizitlar, manzil va aloqa</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-[#111215] group-hover:translate-x-0.5 transition-all" />
                    </NavLink>

                    {/* Printer va Chek Sozlamalari */}
                    <NavLink
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl text-xs font-bold text-[#111215] hover:bg-[#f7f7f5] transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-[#111215] group-hover:text-white text-neutral-700 flex items-center justify-center transition-colors">
                          <Printer className="h-4 w-4" />
                        </div>
                        <div className="text-left">
                          <p className="font-extrabold text-xs text-[#111215]">Printer & Chek Formati</p>
                          <p className="text-[10px] text-neutral-400 font-normal">Termal lenta (58/80mm) va xabar</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-[#111215] group-hover:translate-x-0.5 transition-all" />
                    </NavLink>
                  </div>

                  {/* Chiqish tugmasi */}
                  <div className="pt-2 mt-2 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        localStorage.removeItem('biznesgo_active_business');
                        window.location.href = '/register';
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                        <LogOut className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-extrabold text-xs text-rose-600">Tizimdan chiqish</p>
                        <p className="text-[10px] text-rose-400 font-normal">Foydalanuvchi sessiyasini yakunlash</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* MOBIL MENYU */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111215] text-white p-4 space-y-2 z-40 border-b border-neutral-800 animate-in slide-in-from-top-2">
            <div className="flex items-center px-2 pb-3 mb-2 border-b border-neutral-800">
              <BiznesGoLogo className="h-7 w-auto" darkTextColor="#ffffff" />
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  haptic.selection();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl text-xs font-bold transition-all ${
                  location.pathname === item.to
                    ? 'bg-[#35ca56] text-white'
                    : 'text-neutral-400 hover:bg-white/5'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* SAHIFA MAZMUNI */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-9 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. TELEGRAM LAUNCH APP / MOBIL PASTKI NAVIGATSIYA        */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg pb-[calc(env(safe-area-inset-bottom)+6px)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => haptic.selection()}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer select-none relative ${
                isActive
                  ? 'text-[#111215] font-black'
                  : 'text-neutral-400 hover:text-neutral-600 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    isActive ? 'text-[#35ca56] scale-110' : 'text-neutral-400'
                  }`}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#35ca56] shadow-[0_0_6px_#35ca56]" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'text-[#111215] font-black' : 'text-neutral-400 font-semibold'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
};