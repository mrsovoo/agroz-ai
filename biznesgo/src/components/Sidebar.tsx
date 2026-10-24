import React, { useState } from 'react';
import {
  LayoutGrid,
  ShoppingCart,
  Package,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Clock
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { BiznesGoLogo } from './BiznesGoLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  criticalCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  criticalCount = 0,
  isOpen = false,
  onClose
}) => {
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<'standard' | 'basic' | 'pro'>('standard');
  const [extendSuccess, setExtendSuccess] = useState(false);

  // Asosiy bo'limlar (Qarz daftari tagiga Hisobotlar qo'shildi)
  const mainNavItems = [
    {
      id: 'dashboard' as ActiveTab,
      icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
      label: 'Dashboard'
    },
    {
      id: 'pos' as ActiveTab,
      icon: <ShoppingCart className="w-4 h-4 shrink-0" />,
      label: 'Tezkor Kassa'
    },
    {
      id: 'products' as ActiveTab,
      icon: <Package className="w-4 h-4 shrink-0" />,
      label: 'Ombor & Dorilar'
    },
    {
      id: 'debts' as ActiveTab,
      icon: <BookOpen className="w-4 h-4 shrink-0" />,
      label: 'Qarz Daftari'
    },
    {
      id: 'reports' as ActiveTab,
      icon: <FileSpreadsheet className="w-4 h-4 shrink-0" />,
      label: 'Hisobotlar'
    }
  ];

  return (
    <>
      {/* Mobil fon pardasi */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between p-4 sm:p-5 shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Yuqori Bo'lim: Logotip va 4 ta Asosiy Bo'lim */}
        <div className="space-y-6">
          {/* Rasmiy BiznesGO Logotipi + Mobil Yopish Tugmasi */}
          <div className="flex items-center justify-between px-1">
            <BiznesGoLogo className="h-7 sm:h-8 w-auto shrink-0" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 lg:hidden cursor-pointer"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4 ta Asosiy Menyu */}
          <nav className="space-y-1.5">
            {mainNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                    isActive
                      ? 'bg-black text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={isActive ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-bold truncate">{item.label}</span>
                  </div>

                  {/* Xavfli FEFO badge */}
                  {item.id === 'dashboard' && criticalCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full font-mono shrink-0 ml-1 ${
                        isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {criticalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Pastki Qism: Soddalashtirilgan Dorixona va Tarif Kartasi */}
        <div className="pt-3 border-t border-slate-100">
          <div
            onClick={() => setIsTariffModalOpen(true)}
            className="p-3 bg-slate-50 hover:bg-slate-100/90 transition-all rounded-2xl border border-slate-200/80 cursor-pointer text-xs group shadow-2xs"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#111111] text-[#35ca56] flex items-center justify-center font-bold font-mono text-xs shrink-0">
                AV
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 truncate">Agro-Vet Dorixona</span>
                  <span className="w-2 h-2 rounded-full bg-[#35ca56] animate-pulse shrink-0" title="Kassa faol"></span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5 flex items-center justify-between">
                  <span>Standart • 15.10 — 15.11</span>
                  <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">Tarif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Oylik Tariflarni Ko'rish va Boshqarish Modali */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Sarlavhasi */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Tarif Rejalari & Obuna</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  BiznesGO: 1-Sektor Agro-Vet dorixona va o'g'it do'konlari tariflari
                </p>
              </div>

              <button
                onClick={() => {
                  setIsTariffModalOpen(false);
                  setExtendSuccess(false);
                }}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Joriy Faol Tarif Kartasi (Sanadan sanagacha) */}
            <div className="bg-[#111111] text-white rounded-[24px] p-4 sm:p-5 border border-slate-800 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#35ca56]/20 border border-[#35ca56]/40 text-[#35ca56] font-bold text-[10px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35ca56] animate-pulse"></span>
                    <span>Joriy Faol Tarif</span>
                  </div>
                  <h4 className="text-xl font-extrabold text-white">Standart Agro-Vet (Oylik)</h4>
                  <div className="text-xs text-slate-400 flex items-center space-x-2 pt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Amal qilish muddati:</span>
                    <strong className="text-white font-mono">15.10.2026 dan 15.11.2026 gacha</strong>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div className="text-2xl font-extrabold font-mono text-[#35ca56]">
                    290,000 <span className="text-xs font-normal text-slate-400">so'm/oy</span>
                  </div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-bold">
                    22 kun qoldi
                  </span>
                </div>
              </div>
            </div>

            {/* Oylik Tariflar Tanlovi (3 ta tarif) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Tarif 1: Boshlang'ich */}
              <div
                onClick={() => setSelectedTariff('basic')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTariff === 'basic'
                    ? 'border-black bg-slate-50/90 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">Boshlang'ich (Start)</div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 mt-1">
                    150,000 <span className="text-[10px] font-normal text-slate-400">so'm/oy</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1.5 mt-3">
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>1 ta kassa terminali</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>500 tagacha preparat</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Standart savdo jurnali</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Tanlash
                </button>
              </div>

              {/* Tarif 2: Standart Agro-Vet (Joriy) */}
              <div
                onClick={() => setSelectedTariff('standard')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                  selectedTariff === 'standard'
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
                    : 'border-emerald-500/80 bg-white'
                }`}
              >
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wide">
                  Joriy Tarif
                </div>

                <div>
                  <div className="font-bold text-xs text-slate-900">Standart Agro-Vet</div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 mt-1">
                    290,000 <span className="text-[10px] font-normal text-slate-400">so'm/oy</span>
                  </div>
                  <ul className="text-[11px] text-slate-700 space-y-1.5 mt-3">
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Cheksiz dori & partiyalar</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">FEFO 30 kunlik ogohlantirish</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Qarz daftari (CRM)</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Chek chiqarish va Telegram</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4 w-full py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center">
                  Faol reja
                </div>
              </div>

              {/* Tarif 3: Premium Pro */}
              <div
                onClick={() => setSelectedTariff('pro')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedTariff === 'pro'
                    ? 'border-black bg-slate-50/90 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">Premium Pro (Tarmoq)</div>
                  <div className="text-lg font-extrabold font-mono text-slate-900 mt-1">
                    490,000 <span className="text-[10px] font-normal text-slate-400">so'm/oy</span>
                  </div>
                  <ul className="text-[11px] text-slate-600 space-y-1.5 mt-3">
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ko'p filialli tarmoq</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Fermerlarga SMS eslatma</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>24/7 VIP shaxsiy yordam</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  className="mt-4 w-full py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  O'tish
                </button>
              </div>
            </div>

            {/* Amalga oshirish xabarnomasi */}
            {extendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Obuna muvaffaqiyatli uzaytirildi! Yangi amal qilish muddati: <strong>15.12.2026</strong> gacha.
                </span>
              </div>
            )}

            {/* Pastki Harakat Tugmalari */}
            <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsTariffModalOpen(false);
                  setExtendSuccess(false);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Yopish
              </button>

              <button
                type="button"
                onClick={() => setExtendSuccess(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center justify-center space-x-2 active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>Tarifni 1 oyga uzaytirish (290,000 so'm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
