import React, { useState } from 'react';
import { useApp } from '../../app/providers/AppContext';
import {
  Calendar,
  SlidersHorizontal,
  ArrowUpRight,
  ChevronDown,
  Check,
  Search,
  BookOpenCheck,
  Phone,
  ArrowRight,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ItemIcon } from '../../shared/components/ItemIcon';
import { telegramHaptic } from '../../core/platform/telegram';

type PeriodType = 'daily' | 'weekly' | 'monthly';

export const DashboardPage: React.FC = () => {
  const { business } = useApp();

  // Holat: Sana/Davr (Bugun, Haftalik, Oylik)
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Holat: Filtr va Saralash
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'debt'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Davr bo'yicha dinamik kassa va aktiv ko'rsatkichlari (O'zbek tilida)
  const periodMetrics = {
    daily: {
      dateLabel: 'Bugun · 25 Oktabr 2026',
      totalRevenueUz: '4 850 000 so‘m',
      revenueSubUz: 'Naqd: 3 200 000 · Karta: 1 650 000',
      todayRevenueUz: '1 248 ta',
      revenueSub2Uz: 'Zaxira • 7 ta tovar kam qolgan',
      todaySessionsUz: '12.4 mln so‘m',
      sessionsSubUz: 'Nasiya • 18 ta qarzdor mijoz',
      highlightAmount: '243K',
    },
    weekly: {
      dateLabel: 'Bu hafta · 19 - 25 Okt 2026',
      totalRevenueUz: '28 400 000 so‘m',
      revenueSubUz: 'Naqd: 18 100 000 · Karta: 10 300 000',
      todayRevenueUz: '1 180 ta',
      revenueSub2Uz: 'Zaxira • 14 ta tovar kam qolgan',
      todaySessionsUz: '14.8 mln so‘m',
      sessionsSubUz: 'Nasiya • 6.2 mln qaytarilgan',
      highlightAmount: '1.2M',
    },
    monthly: {
      dateLabel: 'Bu oy · Oktabr 2026',
      totalRevenueUz: '114 200 000 so‘m',
      revenueSubUz: 'Naqd: 74 000 000 · Karta: 40 200 000',
      todayRevenueUz: '1 420 ta',
      revenueSub2Uz: 'Zaxira • 96% to‘la holatda',
      todaySessionsUz: '18.2 mln so‘m',
      sessionsSubUz: 'Nasiya • 34.5 mln yopilgan',
      highlightAmount: '4.8M',
    },
  };

  const currentMetric = periodMetrics[period];

  // Faol qarzdorlar ro'yxati (Ism, Qarzi, Muddati, Tezkor To'lov)
  const activeDebtors = [
    {
      id: 'deb-1',
      name: 'Jamshid aka (Issiqxona)',
      phone: '+998 90 234 56 78',
      debtAmount: '850 000 so‘m',
      dueStatus: '3 kun o‘tgan',
      dueBadgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/80',
      iconType: 'leaf',
      overdue: true,
    },
    {
      id: 'deb-2',
      name: 'Rustam Karimov (Fermer)',
      phone: '+998 93 456 78 90',
      debtAmount: '2 250 000 so‘m',
      dueStatus: 'Bugun to‘lov kuni',
      dueBadgeColor: 'bg-amber-50 text-amber-800 border border-amber-200/80',
      iconType: 'tractor',
      overdue: false,
    },
    {
      id: 'deb-3',
      name: 'Bahrom aka (Qibray Yem)',
      phone: '+998 97 789 01 23',
      debtAmount: '1 450 000 so‘m',
      dueStatus: '3 kun qoldi',
      dueBadgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80',
      iconType: 'wheat',
      overdue: false,
    },
    {
      id: 'deb-4',
      name: 'Dilshodbek Toshmatov',
      phone: '+998 91 112 33 44',
      debtAmount: '680 000 so‘m',
      dueStatus: '5 kun qoldi',
      dueBadgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
      iconType: 'user',
      overdue: false,
    },
  ];

  // Faqat mahsulot nomlari bilan
  const productsSalesData = [
    {
      id: 'prod-1',
      productName: 'Kombikorm Broyler (50 kg)',
      category: 'Ozuqa & yem-xashak · 5 qop sotildi',
      iconType: 'wheat',
      date: 'Bugun, 14:25',
      amount: '1 450 000 so‘m',
      type: 'Naqd pul',
      typeCode: 'cash',
      typeColor: 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60',
    },
    {
      id: 'prod-2',
      productName: 'Enrofloksatsin 10% (100ml flakon)',
      category: 'Veterinariya preparati · 12 dona sotildi',
      iconType: 'pill',
      date: 'Bugun, 13:10',
      amount: '540 000 so‘m',
      type: 'Karta orqali',
      typeCode: 'card',
      typeColor: 'bg-blue-100/90 text-blue-800 border border-blue-200/60',
    },
    {
      id: 'prod-3',
      productName: 'Issiqxona plyonkasi (120 mkr uch qatlam)',
      category: 'Issiqxona jihozi · 85 metr sotildi',
      iconType: 'leaf',
      date: 'Bugun, 11:45',
      amount: '850 000 so‘m',
      type: 'Nasiya (Qarz)',
      typeCode: 'debt',
      typeColor: 'bg-amber-100/90 text-amber-900 border border-amber-200/60',
    },
    {
      id: 'prod-4',
      productName: 'Tomchilatib sug‘orish lentasi (200m o‘ram)',
      category: 'Sug‘orish tizimlari · 2 o‘ram sotildi',
      iconType: 'droplet',
      date: 'Bugun, 10:15',
      amount: '900 000 so‘m',
      type: 'Naqd pul',
      typeCode: 'cash',
      typeColor: 'bg-emerald-100/90 text-emerald-800 border border-emerald-200/60',
    },
    {
      id: 'prod-5',
      productName: 'Motoblok havo filtri & moy to‘plami',
      category: 'Agrotexnika ehtiyot qismlari · 2 komplekt',
      iconType: 'tractor',
      date: 'Kecha, 18:40',
      amount: '280 000 so‘m',
      type: 'Karta orqali',
      typeCode: 'card',
      typeColor: 'bg-blue-100/90 text-blue-800 border border-blue-200/60',
    },
  ];

  const filteredSalesRaw = paymentFilter === 'all'
    ? [...productsSalesData]
    : productsSalesData.filter((s) => s.typeCode === paymentFilter);

  const filteredSales = [...filteredSalesRaw].sort((a, b) => {
    if (sortBy === 'highest') {
      return parseInt(b.amount.replace(/\D/g, ''), 10) - parseInt(a.amount.replace(/\D/g, ''), 10);
    }
    if (sortBy === 'lowest') {
      return parseInt(a.amount.replace(/\D/g, ''), 10) - parseInt(b.amount.replace(/\D/g, ''), 10);
    }
    return 0;
  });

  // CSV yuklab olish
  const handleExportCSV = () => {
    const csvHeader = 'Mahsulot nomi,Kategoriya,To‘lov turi,Sana,Summa\n';
    const csvRows = filteredSales
      .map((s) => `"${s.productName}","${s.category}","${s.type}","${s.date}","${s.amount}"`)
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `savdolar_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* ======================================================== */}
      {/* 1. SARLAVHA VA FILTRLAR QATORI                           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        
        {/* Chap: Savdo va Kassa Tahlili */}
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111215] tracking-tight leading-tight">
            Savdo va Kassa
          </h1>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#111215] tracking-tight leading-tight mt-0.5">
            Tahlili
          </h1>
        </div>

        {/* O'ng: 3 ta pill tugma (Sana, Filtr, CSV Eksport) */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* 1-PILL: Sana tanlash */}
          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="bg-[#efefec] hover:bg-[#eaeae6] rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer group"
            >
              <Calendar className="h-4 w-4 text-neutral-500" />
              <span className="text-xs font-bold text-[#111215]">{currentMetric.dateLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400 group-hover:text-[#111215] transition-colors" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Hisobot Davrini Tanlang
                </p>
                {[
                  { id: 'daily', label: 'Bugun (Kunlik)', sub: '25 Oktabr 2026' },
                  { id: 'weekly', label: 'Haftalik (Bu hafta)', sub: '19 - 25 Oktabr 2026' },
                  { id: 'monthly', label: 'Oylik (Bu oy)', sub: 'Oktabr 2026' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPeriod(item.id as PeriodType);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-bold transition-colors ${
                      period === item.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <p>{item.label}</p>
                      <p className="text-[10px] font-medium text-neutral-400">{item.sub}</p>
                    </div>
                    {period === item.id && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2-PILL: Interaktiv Filtr */}
          <div className="relative">
            <button
              onClick={() => {
                setFilterDropdownOpen(!filterDropdownOpen);
                setDateDropdownOpen(false);
              }}
              className={`rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-2xs transition-all cursor-pointer ${
                paymentFilter !== 'all' || sortBy !== 'newest'
                  ? 'bg-[#111215] text-white'
                  : 'bg-[#efefec] hover:bg-[#eaeae6] text-[#111215]'
              }`}
            >
              <SlidersHorizontal className={`h-4 w-4 ${paymentFilter !== 'all' || sortBy !== 'newest' ? 'text-[#35ca56]' : 'text-neutral-500'}`} />
              <span className="text-xs font-bold">
                {paymentFilter === 'cash'
                  ? 'Naqd'
                  : paymentFilter === 'card'
                  ? 'Karta'
                  : paymentFilter === 'debt'
                  ? 'Nasiya'
                  : 'Filtr'}
              </span>
              {(paymentFilter !== 'all' || sortBy !== 'newest') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#35ca56]" />
              )}
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 border-0">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 px-2">
                  <span className="text-xs font-black text-[#111215]">Savdo Filtrlari</span>
                  {(paymentFilter !== 'all' || sortBy !== 'newest') && (
                    <button
                      onClick={() => {
                        setPaymentFilter('all');
                        setSortBy('newest');
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Tozalash
                    </button>
                  )}
                </div>

                {/* To'lov turi */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2">
                    To‘lov turi bo‘yicha
                  </p>
                  {[
                    { id: 'all', label: 'Barcha to‘lovlar' },
                    { id: 'cash', label: 'Naqd pul' },
                    { id: 'card', label: 'Karta / Terminal' },
                    { id: 'debt', label: 'Nasiya (Qarz)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPaymentFilter(p.id as any);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        paymentFilter === p.id
                          ? 'bg-neutral-100 text-[#111215]'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {paymentFilter === p.id && <Check className="h-3.5 w-3.5 text-[#35ca56]" />}
                    </button>
                  ))}
                </div>

                {/* Saralash */}
                <div className="space-y-1 mt-3 pt-2 border-t border-neutral-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-2">
                    Summa bo‘yicha saralash
                  </p>
                  {[
                    { id: 'newest', label: 'Eng so‘nggilari' },
                    { id: 'highest', label: 'Summasi katta' },
                    { id: 'lowest', label: 'Summasi kichik' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSortBy(s.id as any);
                        setFilterDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        sortBy === s.id
                          ? 'bg-neutral-100 text-[#111215]'
                          : 'text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortBy === s.id && <Check className="h-3.5 w-3.5 text-[#35ca56]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3-PILL: CSV Eksport ↗ */}
          <button
            onClick={handleExportCSV}
            className="bg-[#111215] hover:bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <span>CSV Eksport</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. YUQORI 3 TA KARTA                                     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1-KARTA (QORA / MAVJUD KASSA BALANSI) */}
        <div className="bg-[#111215] text-white rounded-[32px] p-7 flex flex-col justify-between min-h-[195px] shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">Yechib olish mumkin (Kassa)</span>
            <Link
              to="/pos"
              className="w-9 h-9 rounded-full bg-white text-[#111215] flex items-center justify-center font-bold hover:scale-105 transition-transform"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight leading-tight">
              {currentMetric.totalRevenueUz}
            </h2>
            <p className="text-xs font-medium text-neutral-400 mt-2 flex items-center gap-1.5">
              <span>To‘lov</span>
              <span>•</span>
              <span>{currentMetric.revenueSubUz}</span>
            </p>
          </div>
        </div>

        {/* 2-KARTA (OCH KULRANG / OMBOR QOLDIG'I) */}
        <div className="bg-[#efefec] text-[#111215] rounded-[32px] p-7 flex flex-col justify-between min-h-[195px] shadow-2xs transition-all hover:bg-[#eaeae7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">Bugungi tushum</span>
            <Link
              to="/inventory"
              className="w-9 h-9 rounded-full bg-[#dfdfdc] text-[#111215] flex items-center justify-center font-bold hover:scale-105 transition-transform"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight leading-tight text-[#111215]">
              {currentMetric.todayRevenueUz}
            </h2>
            <p className="text-xs font-medium text-neutral-500 mt-2 flex items-center gap-1.5">
              <span>To‘lov</span>
              <span>•</span>
              <span>{currentMetric.revenueSub2Uz}</span>
            </p>
          </div>
        </div>

        {/* 3-KARTA (OCH KULRANG / QARZ DAFTARI) */}
        <div className="bg-[#efefec] text-[#111215] rounded-[32px] p-7 flex flex-col justify-between min-h-[195px] shadow-2xs transition-all hover:bg-[#eaeae7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600">Bugungi xaridlar soni</span>
            <Link
              to="/debts"
              className="w-9 h-9 rounded-full bg-[#dfdfdc] text-[#111215] flex items-center justify-center font-bold hover:scale-105 transition-transform"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black tracking-tight leading-tight text-[#111215]">
              {currentMetric.todaySessionsUz}
            </h2>
            <p className="text-xs font-medium text-neutral-500 mt-2 flex items-center gap-1.5">
              <span>To‘lov</span>
              <span>•</span>
              <span>{currentMetric.sessionsSubUz}</span>
            </p>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. O'RTA QATOR: SAVDO DINAMIKASI VA FAOL QARZDORLAR       */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* CHAP: Haftalik Savdo Dinamikasi (Sales Funnel) */}
        <div className="lg:col-span-6 bg-[#efefec] rounded-[32px] p-7 flex flex-col justify-between shadow-2xs min-h-[360px] border-0">
          
          <div className="flex items-center justify-between pb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#111215]">Savdo Dinamikasi</h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">Oylik va haftalik savdolar hajmi</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-white px-4 py-2 rounded-full text-xs font-bold text-[#111215] shadow-2xs flex items-center gap-1.5 border-0 cursor-pointer">
                <span>Oylik</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>
              <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#111215] shadow-2xs border-0 cursor-pointer">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Ustunli grafik (Dribbble Neo-Minimalist Bars) */}
          <div className="py-6 flex-1 flex flex-col justify-end">
            <div className="flex items-end justify-between gap-3 sm:gap-4 h-48 px-2">
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full bg-[#dfdfdc] rounded-2xl h-24 hover:bg-[#d4d4cf] transition-colors" />
                <span className="text-[11px] font-semibold text-neutral-400">Dush</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full bg-[#dfdfdc] rounded-2xl h-32 hover:bg-[#d4d4cf] transition-colors" />
                <span className="text-[11px] font-semibold text-neutral-400">Sesh</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full bg-[#dfdfdc] rounded-2xl h-20 hover:bg-[#d4d4cf] transition-colors" />
                <span className="text-[11px] font-semibold text-neutral-400">Chor</span>
              </div>
              
              {/* PAYSHANBA (Faol, Neon Yashil ustun va qora pill ko'rsatkich) */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative">
                <div className="absolute -top-3.5 bg-[#111215] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {currentMetric.highlightAmount}
                </div>
                <div className="w-full bg-[#35ca56] rounded-2xl h-40 shadow-sm" />
                <span className="text-[11px] font-black text-[#35ca56]">Pay</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full bg-[#dfdfdc] rounded-2xl h-22 hover:bg-[#d4d4cf] transition-colors" />
                <span className="text-[11px] font-semibold text-neutral-400">Juma</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full bg-[#dfdfdc] rounded-2xl h-28 hover:bg-[#d4d4cf] transition-colors" />
                <span className="text-[11px] font-semibold text-neutral-400">Shan</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-300/40 flex items-center justify-between text-[11px] font-semibold text-neutral-500 px-1">
            <span>Eng yuqori savdo kuni: <b className="text-emerald-700">Payshanba</b></span>
            <span className="text-neutral-400">Real vaqt yangilanishi</span>
          </div>

        </div>

        {/* ======================================================== */}
        {/* O'NG: FAOL QARZDORLAR (O'TA SODDA VA TOZA USLUBDA)      */}
        {/* ======================================================== */}
        <div className="lg:col-span-6 bg-[#efefec] rounded-[32px] p-7 flex flex-col justify-between shadow-2xs min-h-[360px] border-0">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2">
            <div>
              <h3 className="text-base font-extrabold text-[#111215]">Faol Qarzdorlar</h3>
              <p className="text-xs text-neutral-400 font-medium mt-0.5">To‘lov muddati kelgan va qarzi bor mijozlar</p>
            </div>

            <Link
              to="/debts"
              className="text-xs font-bold text-[#111215] bg-white hover:bg-neutral-100 px-4 py-2 rounded-full shadow-2xs flex items-center gap-1.5 transition-colors border-0"
            >
              <span>Daftar</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
            </Link>
          </div>

          {/* O'ta sodda va yengil ro'yxat */}
          <div className="divide-y divide-neutral-200/70 my-2">
            {activeDebtors.map((debtor) => (
              <Link
                key={debtor.id}
                to="/debts"
                className="py-3 px-1 flex items-center justify-between hover:bg-white/40 rounded-xl transition-colors group cursor-pointer"
              >
                {/* Chap: Ism va telefon */}
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <ItemIcon type={debtor.iconType} variant="badge" className="h-3.5 w-3.5" />
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs text-[#111215] truncate group-hover:text-[#35ca56] transition-colors">
                      {debtor.name}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {debtor.phone}
                    </p>
                  </div>
                </div>

                {/* O'ng: Qarz summasi va muddati */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-xs text-[#111215]">{debtor.debtAmount}</p>
                  <p
                    className={`text-[10px] font-bold mt-0.5 inline-flex items-center justify-end gap-1 ${
                      debtor.overdue
                        ? 'text-rose-600'
                        : debtor.dueStatus.includes('Bugun')
                        ? 'text-amber-600'
                        : 'text-neutral-500'
                    }`}
                  >
                    {debtor.overdue && <AlertTriangle className="h-3 w-3 text-rose-600 flex-shrink-0" />}
                    <span>{debtor.dueStatus}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pastki qism: ixcham qator */}
          <div className="pt-2 border-t border-neutral-300/40 flex items-center justify-between text-[11px] font-semibold text-neutral-500 px-1">
            <span>Jami 18 nafar qarzdor · 12.4 mln so‘m</span>
            <Link to="/debts" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
              <span>Barchasi</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. PASTKI QATOR: SO'NGGI SAVDOLAR JURNALI (O'zbekcha)     */}
      {/* ======================================================== */}
      <div className="bg-[#efefec] rounded-[32px] p-7 shadow-2xs space-y-6 border-0">
        
        {/* Header qismi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#111215]">Tranzaksiyalar</h3>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">Jami 456 ta operatsiya · Mahsulotlar kesimida</p>
          </div>

          {/* 3 ta to'lov turi komponenti markazda */}
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-full bg-white p-1 shadow-2xs border-0 text-xs font-bold text-neutral-600">
              <button
                onClick={() => setPaymentFilter('all')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  paymentFilter === 'all'
                    ? 'bg-[#111215] text-white shadow-xs'
                    : 'hover:text-[#111215]'
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setPaymentFilter('cash')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  paymentFilter === 'cash'
                    ? 'bg-[#35ca56] text-white shadow-xs'
                    : 'hover:text-[#111215]'
                }`}
              >
                Naqd pul
              </button>
              <button
                onClick={() => setPaymentFilter('card')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  paymentFilter === 'card'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:text-[#111215]'
                }`}
              >
                Karta
              </button>
              <button
                onClick={() => setPaymentFilter('debt')}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  paymentFilter === 'debt'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'hover:text-[#111215]'
                }`}
              >
                Nasiya (Qarz)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="bg-white px-4 py-2 rounded-full text-xs font-bold text-[#111215] shadow-2xs flex items-center gap-1.5 border-0 cursor-pointer">
              <span>Oylik</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#111215] shadow-2xs border-0 cursor-pointer">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-[#111215] shadow-2xs border-0 cursor-pointer">
              <Search className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-300/40">
              <tr>
                <th className="py-3 px-3 text-left">Mahsulot Nomi</th>
                <th className="py-3 px-3 text-center">To‘lov Turi</th>
                <th className="py-3 px-3 text-center">Savdo Sanasi / Vaqti</th>
                <th className="py-3 px-3 text-right">Summasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300/30">
              {filteredSales.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-200/50 transition-colors">
                  
                  {/* 1. FAQAT MAHSULOT NOMI */}
                  <td className="py-3.5 px-3 text-left">
                    <div className="flex items-center gap-3">
                      <ItemIcon type={row.iconType} variant="contained" className="h-5 w-5" containerClassName="!w-10 !h-10" />
                      <div>
                        <p className="font-extrabold text-[#111215] text-sm leading-tight">{row.productName}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{row.category}</p>
                      </div>
                    </div>
                  </td>

                  {/* 2. TO'LOV TURI (Markazda) */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[11px] font-bold shadow-2xs ${row.typeColor}`}>
                        {row.type}
                      </span>
                    </div>
                  </td>

                  {/* 3. Sanasi / Vaqti */}
                  <td className="py-3.5 px-3 text-center font-semibold text-neutral-600 whitespace-nowrap">
                    {row.date}
                  </td>

                  {/* 4. Narxi (Summasi) */}
                  <td className="py-3.5 px-3 text-right font-black text-[#111215] text-sm whitespace-nowrap">
                    {row.amount}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};