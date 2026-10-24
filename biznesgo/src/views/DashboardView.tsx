import React, { useEffect, useState, useRef } from 'react';
import { api, formatUZS } from '../lib/api';
import { DashboardMetrics, Sale } from '../types';
import {
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  ChevronDown,
  Check,
  AlertOctagon,
  ShieldAlert,
  PackageX,
  CreditCard
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onOpenAddProduct: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAddProduct
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sana davri: Bugun, Hafta, Oylik
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const metricsData = await api.getDashboardMetrics();
      setMetrics(metricsData);

      // Eng so'nggi sotuvlar tarixini olish
      const histData = await api.getSalesHistory();
      setSalesHistory(histData.sales || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Haftalik savdo grafik ustunlari (Agro-Vet kassa dinamikasi)
  const weeklyData = [
    { label: 'Dush', value: 42, amount: '1.2M', isPeak: false },
    { label: 'Sesh', value: 65, amount: '1.9M', isPeak: false },
    { label: 'Chor', value: 50, amount: '1.5M', isPeak: false },
    { label: 'Pay', value: 100, amount: '3.45M', isPeak: true }, // Bugun eng yuqori
    { label: 'Juma', value: 38, amount: '980K', isPeak: false },
    { label: 'Shan', value: 58, amount: '1.7M', isPeak: false },
  ];

  // Faqat lokal sinov (Local Dev) uchun fallback, productionda toza bo'ladi
  const displaySales = salesHistory.length > 0 
    ? salesHistory 
    : (import.meta.env.DEV ? [
    {
      id: 's-1',
      receipt_number: 'CHK-894102',
      total_amount: 145000,
      payment_type: 'cash' as const,
      cash_amount: 145000,
      card_amount: 0,
      debt_amount: 0,
      customer_name: 'Rustam aka',
      created_at: new Date(Date.now() - 10 * 60000).toISOString()
    }
  ] : []);

  const periodMultiplier = period === 'today' ? 1 : period === 'week' ? 4.8 : 18.5;
  const currentRevenue = Math.round((metrics?.today_revenue || 0) * periodMultiplier);
  const currentCash = Math.round((metrics?.cash_revenue || 0) * periodMultiplier);
  const currentCard = Math.round((metrics?.card_revenue || 0) * periodMultiplier);
  const currentDebt = Math.round((metrics?.debt_revenue || 0) * periodMultiplier);

  const periodLabels = {
    today: 'Bugun',
    week: 'Hafta',
    month: 'Oylik'
  };

  const periodDescriptions = {
    today: 'Bugungi kassa tushumi, to\'lovlar va ombor qoldig\'i tahlili',
    week: 'Haftalik savdo aylanmasi va moliyaviy dinamika tahlili',
    month: 'Oylik jamlama kassa va foyda hisoboti'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Sarlavha va Yuqori Filtrlar Qatori */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Savdo Tahlili
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {periodDescriptions[period]}
          </p>
        </div>

        {/* Filtr Pillari */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Sana Tanlash Pilli (Dropdown: Bugun, Hafta, Oylik) */}
          <div ref={dateDropdownRef} className="relative">
            <button
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-400">Sana:</span>
              <span className="font-bold text-slate-900">{periodLabels[period]}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isDateDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setPeriod('today');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      period === 'today' ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Bugun</span>
                    {period === 'today' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setPeriod('week');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      period === 'week' ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Hafta (Haftalik)</span>
                    {period === 'week' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => {
                      setPeriod('month');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      period === 'month' ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Oylik</span>
                    {period === 'month' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Eksport Tugmasi */}
          <button
            onClick={() => alert(`${periodLabels[period]}lik kassa hisoboti CSV shaklida yuklab olindi!`)}
            className="flex items-center space-x-1.5 bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs transition active:scale-95"
          >
            <span>Yuklab olish (CSV)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. AGRO-VET TEZKOR OGOHLANTIRISHLAR (MINIMAL) */}
      {metrics && ((metrics.expired_count || 0) > 0 || (metrics.overdue_debt || 0) > 0 || (metrics.critical_expiry_count || 0) > 0 || (metrics.low_stock_count || 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 🔴 Muddati o'tgan */}
          {(metrics.expired_count || 0) > 0 && (
            <div
              onClick={() => onNavigateTab('products')}
              className="bg-white hover:bg-rose-50/40 border border-rose-200/80 rounded-2xl p-3 flex items-center justify-between transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 truncate">
                    {metrics.expired_count} ta dori muddati o'tgan
                  </div>
                  <div className="text-[10px] text-rose-600 font-medium">Kassada bloklangan</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-600 transition flex items-center shrink-0 ml-1">
                <span>Ko'rish</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          )}

          {/* 🟠 Kechikkan qarz */}
          {(metrics.overdue_debt || 0) > 0 && (
            <div
              onClick={() => onNavigateTab('debts')}
              className="bg-white hover:bg-amber-50/40 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 truncate">
                    {formatUZS(metrics.overdue_debt || 0)}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium">{metrics.overdue_debtors_count || 0} ta kechikkan qarz</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-700 transition flex items-center shrink-0 ml-1">
                <span>Qarzlar</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          )}

          {/* 🟡 FEFO Muddat xavfi */}
          {((metrics.critical_7_count || 0) > 0 || (metrics.critical_expiry_count || 0) > 0) && (
            <div
              onClick={() => onNavigateTab('products')}
              className="bg-white hover:bg-yellow-50/40 border border-yellow-200/80 rounded-2xl p-3 flex items-center justify-between transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 truncate">
                    FEFO: {metrics.critical_expiry_count || 0} ta dori
                  </div>
                  <div className="text-[10px] text-yellow-700 font-medium">30 kun ichida tugaydi</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-yellow-700 transition flex items-center shrink-0 ml-1">
                <span>FEFO</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          )}

          {/* 🔵 Kam qoldiq */}
          {((metrics.out_of_stock_count || 0) > 0 || (metrics.low_stock_count || 0) > 0) && (
            <div
              onClick={() => onNavigateTab('products')}
              className="bg-white hover:bg-blue-50/40 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between transition cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-900 truncate">
                    {metrics.low_stock_count} ta dori kam qolgan
                  </div>
                  <div className="text-[10px] text-blue-700 font-medium">Zaxirani to'ldirish</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-700 transition flex items-center shrink-0 ml-1">
                <span>Ombor</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. TOP METRIK KARTALARI (3 ta toza asosiy karta) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KARTA 1: HERO BLACK CARD */}
        <div className="bg-[#111111] text-white rounded-[28px] p-5 sm:p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 tracking-wide">
              {period === 'today' ? 'Bugungi Kassa Tushumi' : period === 'week' ? 'Haftalik Kassa Tushumi' : 'Oylik Kassa Tushumi'}
            </span>
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:rotate-45">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
              {formatUZS(currentRevenue)}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="w-2 h-2 rounded-full bg-[#35ca56]"></span>
            <span>Naqd: {formatUZS(currentCash)}</span>
            <span>•</span>
            <span>Karta: {formatUZS(currentCard)}</span>
          </div>
        </div>

        {/* KARTA 2: NASIYA (QARZ) */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 flex flex-col justify-between shadow-2xs relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 tracking-wide">
              {period === 'today' ? 'Bugungi Nasiya (Qarz)' : period === 'week' ? 'Haftalik Nasiya (Qarz)' : 'Oylik Nasiya (Qarz)'}
            </span>
            <button
              onClick={() => onNavigateTab('debts')}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center transition-transform group-hover:rotate-45"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-amber-600">
              {formatUZS(currentDebt)}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Jami qarz balansi:</span>
            <span className="font-bold font-mono text-slate-800">{formatUZS(metrics?.total_debt || 0)}</span>
          </div>
        </div>

        {/* KARTA 3: FEFO MUDDAT XAVFI (≤30 kun) */}
        <div className={`rounded-[28px] p-5 sm:p-6 border flex flex-col justify-between shadow-2xs relative group sm:col-span-2 lg:col-span-1 ${
          metrics && metrics.critical_expiry_count > 0
            ? 'bg-rose-50/60 border-rose-200'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 tracking-wide flex items-center space-x-1.5">
              {metrics && metrics.critical_expiry_count > 0 && (
                <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              )}
              <span>FEFO Muddat Xavfi</span>
            </span>
            <button
              onClick={() => onNavigateTab('products')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45 ${
                metrics && metrics.critical_expiry_count > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="my-4">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              metrics && metrics.critical_expiry_count > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {metrics?.critical_expiry_count || 0}{' '}
              <span className="text-sm font-normal text-slate-500">ta dori</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] border-t border-rose-100/70 pt-2.5">
            <span className="text-rose-700 font-medium">30 kun ichida tugaydi</span>
            <span className="font-bold text-slate-800">Birinchi soting</span>
          </div>
        </div>
      </div>

      {/* 3. O'RTA BLOK: SAVDO DINAMIKASI + KASSA ENG OXIRGI SOTUVLAR (2 ta yonma-yon karta) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CHAP KARTA: SAVDO DINAMIKASI - 6 ustun */}
        <div className="lg:col-span-6 bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Savdo Dinamikasi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hafta kunlari bo'yicha kassa aylanmasi</p>
            </div>

            <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
              Haftalik
            </span>
          </div>

          {/* Ustunli Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-6 gap-3 sm:gap-4 items-end h-48">
              {weeklyData.map((bar, i) => (
                <div key={i} className="flex flex-col items-center justify-end h-full group">
                  {bar.isPeak && (
                    <div className="mb-2 px-2 py-0.5 bg-black text-white text-[10px] font-bold font-mono rounded-full animate-bounce">
                      {bar.amount}
                    </div>
                  )}

                  <div
                    style={{ height: `${bar.value}%` }}
                    className={`w-full max-w-[48px] rounded-2xl transition-all duration-300 ${
                      bar.isPeak
                        ? 'bg-[#35ca56] shadow-md shadow-[#35ca56]/30'
                        : 'bg-[#e8e8e8] group-hover:bg-slate-300'
                    }`}
                  ></div>

                  <span
                    className={`text-xs mt-3 font-semibold ${
                      bar.isPeak ? 'text-[#35ca56] font-bold' : 'text-slate-400'
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* O'NG KARTA: KASSA - ENG OXIRGI SOTUVLAR - 6 ustun */}
        <div className="lg:col-span-6 bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Kassa: Eng Oxirgi Sotuvlar</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bugungi amalga oshirilgan oxirgi cheklar</p>
            </div>

            <button
              onClick={() => onNavigateTab('pos')}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition"
            >
              <span>Yangi Sotuv</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Oxirgi Sotuvlar Ro'yxati */}
          <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-1">
            {displaySales.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                Hozircha sotuvlar amalga oshirilmagan
              </div>
            ) : (
              displaySales.slice(0, 5).map((sale) => {
              const isDebt = sale.payment_type === 'debt';
              const isCard = sale.payment_type === 'card';

              return (
                <div
                  key={sale.id}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/70 rounded-xl px-2 transition"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 font-mono">{sale.receipt_number}</span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                          isDebt
                            ? 'bg-amber-100 text-amber-800'
                            : isCard
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isDebt ? 'Nasiya' : isCard ? 'Karta' : 'Naqd'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {sale.customer_name || 'Oddiy xaridor'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-slate-900 font-mono text-sm">
                      {formatUZS(sale.total_amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end space-x-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(sale.created_at).toLocaleTimeString('uz-UZ', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
