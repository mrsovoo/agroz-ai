import React, { useState } from 'react';
import { useApp } from '../../app/providers/AppContext';
import { telegramHaptic } from '../../core/platform/telegram';
import {
  Calendar,
  ChevronDown,
  Info,
  Filter,
  Plus,
  X,
  Table as TableIcon,
  Hash,
  BarChart2,
  PieChart,
  FileText,
  TrendingUp,
  RotateCw,
  ArrowUpDown,
  Download,
  Check,
} from 'lucide-react';

type ReportViewType = 'table' | 'number' | 'barchart' | 'donut' | 'text' | 'line';

interface ReportRow {
  id: string;
  checkNo: string;
  clientName: string;
  category: string;
  paymentType: 'cash' | 'card' | 'debt';
  date: string;
  profit: string;
  total: number;
}

export const ReportsPage: React.FC = () => {
  const { business } = useApp();

  // Holat: Davr va Ko'rinish (View)
  const [dateRange, setDateRange] = useState('Okt 2026');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [activeView, setActiveView] = useState<ReportViewType>('table');

  // Filtrlar holati
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'debt'>('all');
  const [sectorFilter, setSectorFilter] = useState<'all' | 'dorixona' | 'yem' | 'issiqxona'>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Jadval ma'lumotlari
  const reportRows: ReportRow[] = [
    {
      id: 'row-1',
      checkNo: '#766',
      clientName: 'Jamshid aka (Issiqxona)',
      category: 'Issiqxona plyonkasi & plyonka qisqichlari',
      paymentType: 'cash',
      date: '25 Oktabr, 2026 · 14:20',
      profit: '280 000 so‘m',
      total: 850000,
    },
    {
      id: 'row-2',
      checkNo: '#720',
      clientName: 'Rustam Karimov (Fermer)',
      category: 'Oksitetrasiklin 20% & Vitamin B-Kompleks',
      paymentType: 'card',
      date: '24 Oktabr, 2026 · 11:45',
      profit: '620 000 so‘m',
      total: 2250000,
    },
    {
      id: 'row-3',
      checkNo: '#424',
      clientName: 'Bahrom aka (Qibray Yem)',
      category: 'Kombikorm Broyler Start (5 qop)',
      paymentType: 'debt',
      date: '23 Oktabr, 2026 · 16:30',
      profit: '310 000 so‘m',
      total: 1450000,
    },
    {
      id: 'row-4',
      checkNo: '#398',
      clientName: 'Dilshodbek Toshmatov',
      category: 'Tomchilatib sug‘orish lentasi (1 o‘ram)',
      paymentType: 'cash',
      date: '22 Oktabr, 2026 · 09:15',
      profit: '180 000 so‘m',
      total: 680000,
    },
    {
      id: 'row-5',
      checkNo: '#312',
      clientName: 'Shohrux Mirzo (Agro Servis)',
      category: 'Motoblok moyi & havo filtrlari (4 komplekt)',
      paymentType: 'card',
      date: '21 Oktabr, 2026 · 17:50',
      profit: '840 000 so‘m',
      total: 3120000,
    },
    {
      id: 'row-6',
      checkNo: '#289',
      clientName: 'Sherzodbek Qosimov',
      category: 'Pomidor "Bella" F1 & Bodring urug‘lari',
      paymentType: 'cash',
      date: '20 Oktabr, 2026 · 13:05',
      profit: '220 000 so‘m',
      total: 790000,
    },
  ];

  // Filtrланган qatorlar
  const filteredRows = reportRows.filter((r) => {
    if (paymentFilter !== 'all' && r.paymentType !== paymentFilter) return false;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRows.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const handleRefresh = () => {
    telegramHaptic.medium();
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Chek No,Mijoz,Kategoriya,To‘lov turi,Sana,Foyda,Jami Summa\n' +
      filteredRows
        .map(
          (r) =>
            `"${r.checkNo}","${r.clientName}","${r.category}","${r.paymentType}","${r.date}","${r.profit}","${r.total}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hisobot_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      
      {/* 1. ASOSIY SARLAVHA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111215] tracking-tight">
            Hisobotlar & Tahlil (Reporting)
          </h1>
          <p className="text-xs text-neutral-400 font-semibold mt-0.5">
            {business?.name} · Umumiy savdo aylanmasi, qarzlar tahlili va to‘lovlar taqsimoti
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-white hover:bg-neutral-50 text-[#111215] text-xs font-bold px-4 py-2.5 rounded-full flex items-center gap-2 shadow-2xs transition-all border-0 cursor-pointer self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5 text-neutral-500" />
          <span>Eksport (CSV)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. YUQORI KARTA: Opportunity Growth & Donut Charts       */}
      {/* (Referens rasm asosida aniq shakllantirilgan)            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xs border-0 space-y-6">
        
        {/* Karta Headeri: Sarlavha va Date Range */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-black text-[#111215] tracking-tight">
              Savdo & Moliyaviy O‘sish (Opportunity Growth)
            </h2>
            <p className="text-xs text-neutral-400 font-medium">
              Barcha kassa tushumlari va nasiyalar balansi
            </p>
          </div>

          {/* Date Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="bg-[#f7f7f5] hover:bg-[#efefec] text-[#111215] rounded-2xl px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-2xs border-0 transition-all cursor-pointer"
            >
              <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-neutral-400 font-normal">Date Range:</span>
              <span>{dateRange}</span>
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400 ml-1" />
            </button>

            {dateDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 border-0">
                {['Bugun · 26 Okt', 'Bu hafta (19 - 25 Okt)', 'Okt 2026', 'Yil 2026'].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDateRange(d);
                      setDateDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                      dateRange === d ? 'bg-[#f7f7f5] text-[#111215]' : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <span>{d}</span>
                    {dateRange === d && <Check className="h-3.5 w-3.5 text-[#35ca56]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Asosiy grid: Chapda 4 ta metrik subkarta (2x2), O'ngda 2 ta Donut chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* CHAP: 4 ta kichik metrik kartochka (2x2) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3.5">
            
            {/* 1. MQA / Jami Savdolar Soni */}
            <div className="bg-[#f7f7f5] rounded-2xl p-4 flex flex-col justify-between min-h-[105px] relative group hover:bg-[#efefec] transition-colors">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  MQA (Savdolar Soni)
                </span>
                <h3 className="text-2xl font-black text-[#111215] mt-1 tracking-tight">
                  1,120
                </h3>
              </div>
              <div className="flex justify-end">
                <Info className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </div>
            </div>

            {/* 2. SQA / Faol Qarzdorlar */}
            <div className="bg-[#f7f7f5] rounded-2xl p-4 flex flex-col justify-between min-h-[105px] relative group hover:bg-[#efefec] transition-colors">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  SQA (Faol Qarzdor)
                </span>
                <h3 className="text-2xl font-black text-[#111215] mt-1 tracking-tight">
                  18
                </h3>
              </div>
              <div className="flex justify-end">
                <Info className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </div>
            </div>

            {/* 3. MQA/SQA Rate / Sof Foyda Marjasi */}
            <div className="bg-[#f7f7f5] rounded-2xl p-4 flex flex-col justify-between min-h-[105px] relative group hover:bg-[#efefec] transition-colors">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Sof Foyda Marjasi
                </span>
                <h3 className="text-2xl font-black text-[#111215] mt-1 tracking-tight">
                  24.0%
                </h3>
              </div>
              <div className="flex justify-end">
                <Info className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </div>
            </div>

            {/* 4. Average Deal Size / O'rtacha Chek */}
            <div className="bg-[#f7f7f5] rounded-2xl p-4 flex flex-col justify-between min-h-[105px] relative group hover:bg-[#efefec] transition-colors">
              <div>
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  O‘rtacha Chek
                </span>
                <h3 className="text-2xl font-black text-[#111215] mt-1 tracking-tight">
                  101,960 <span className="text-xs font-bold text-neutral-400">so‘m</span>
                </h3>
              </div>
              <div className="flex justify-end">
                <Info className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
              </div>
            </div>

          </div>

          {/* O'NG: 2 ta Doiraviy Donut Diagramma (Rasmdagidek) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              
              {/* Donut 1: Total Pipeline */}
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f0f0ed"
                      strokeWidth="14"
                    />
                    {/* Grade A (BiznesGO Yashil / 65%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#35ca56"
                      strokeWidth="14"
                      strokeDasharray="238.76"
                      strokeDashoffset="83.56"
                      strokeLinecap="round"
                    />
                    {/* Grade B (BiznesGO Obsidian / 35%) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#111215"
                      strokeWidth="14"
                      strokeDasharray="238.76"
                      strokeDashoffset="179.07"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Markazdagi yozuv */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-neutral-400">Total Pipeline</span>
                    <span className="text-xs font-black text-[#111215] leading-tight">114.2M so‘m</span>
                  </div>
                </div>
              </div>

              {/* Donut 2: Total Closed */}
              <div className="flex flex-col items-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#f0f0ed"
                      strokeWidth="14"
                    />
                    {/* Grade C & D (Qoplangan qarzlar & Qaytarilgan) */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#249b3e"
                      strokeWidth="14"
                      strokeDasharray="238.76"
                      strokeDashoffset="71.62"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="#86efac"
                      strokeWidth="14"
                      strokeDasharray="238.76"
                      strokeDashoffset="191.0"
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Markazdagi yozuv */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-neutral-400">Total Closed</span>
                    <span className="text-xs font-black text-[#111215] leading-tight">34.5M so‘m</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Diagramma Legendasi (Grade A, Grade B, Grade C, Grade D) */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-neutral-600 pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#35ca56]" />
                <span className="text-[11px]">Grade A (Naqd)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#111215]" />
                <span className="text-[11px]">Grade B (Karta)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#249b3e]" />
                <span className="text-[11px]">Grade C (Nasiya)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#86efac]" />
                <span className="text-[11px]">Grade D (Qaytarilgan)</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. O'RTA QISM: FILTRLAR PANELI (Rasmdagi x Location, x Social) */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-2.5 px-1">
        {/* Filtr 1: To'lov turi */}
        <div className="inline-flex items-center gap-2 bg-white rounded-2xl px-3.5 py-2 text-xs font-bold text-neutral-700 shadow-2xs border-0">
          <button
            onClick={() => setPaymentFilter('all')}
            className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span>To‘lov turi:</span>
          <span className="bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded-lg text-[11px]">
            {paymentFilter === 'cash' ? 'Naqd' : paymentFilter === 'card' ? 'Karta' : paymentFilter === 'debt' ? 'Nasiya' : 'Barchasi (6)'}
          </span>
        </div>

        {/* Filtr 2: Sektor */}
        <div className="inline-flex items-center gap-2 bg-white rounded-2xl px-3.5 py-2 text-xs font-bold text-neutral-700 shadow-2xs border-0">
          <button
            onClick={() => setSectorFilter('all')}
            className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span>Sektor:</span>
          <span className="bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded-lg text-[11px]">
            Barchasi (5)
          </span>
        </div>

        {/* Add Filter Tugmasi (BiznesGO Identikasida) */}
        <button
          onClick={() => {
            const next = paymentFilter === 'all' ? 'cash' : paymentFilter === 'cash' ? 'card' : paymentFilter === 'card' ? 'debt' : 'all';
            setPaymentFilter(next);
          }}
          className="bg-[#111215] hover:bg-[#383838] text-white text-xs font-bold px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          <Filter className="h-3.5 w-3.5 text-[#35ca56]" />
          <span>Add Filter</span>
        </button>

        {/* Clear filter tugmasi */}
        {(paymentFilter !== 'all' || sectorFilter !== 'all') && (
          <button
            onClick={() => {
              setPaymentFilter('all');
              setSectorFilter('all');
            }}
            className="text-xs font-bold text-neutral-500 hover:text-rose-600 flex items-center gap-1 ml-1 cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Clear filter</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. PASTKI QISM: VIEW TABS & INTERAKTIV JADVAL             */}
      {/* (Table, Number, Barchart, Donut, Text, Line)            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-2xs border-0 space-y-6">
        
        {/* View Switcher Tabs (Rasmdagi [Table] [Number] [Barchart] [Donut] [Text] [Line]) */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-neutral-100">
          {[
            { id: 'table', label: 'Table', icon: TableIcon },
            { id: 'number', label: 'Number', icon: Hash },
            { id: 'barchart', label: 'Barchart', icon: BarChart2 },
            { id: 'donut', label: 'Donut', icon: PieChart },
            { id: 'text', label: 'Text', icon: FileText },
            { id: 'line', label: 'Line', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  telegramHaptic.selection();
                  setActiveView(tab.id as ReportViewType);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#eafaf0] text-[#1f7a34] shadow-2xs ring-1 ring-[#35ca56]/30'
                    : 'text-neutral-500 hover:bg-neutral-100/70 hover:text-[#111215]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: TABLE (JADVAL) */}
        {activeView === 'table' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-100">
                  <tr>
                    {/* Checkbox ustuni */}
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === filteredRows.length && filteredRows.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded-md accent-[#35ca56] cursor-pointer h-3.5 w-3.5"
                      />
                    </th>
                    <th className="py-3 px-3">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-neutral-700">
                        <span>OPP NO.</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-neutral-700">
                        <span>MIJOZ / KORXONA NOMI</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">
                      <div className="flex items-center gap-1 cursor-pointer hover:text-neutral-700">
                        <span>TO‘LOV TURI & VAQTI</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-neutral-700">
                        <span>SOF FOYDA</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 cursor-pointer hover:text-neutral-700">
                        <span>JAMI SUMMA (ACV)</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 font-medium">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-neutral-400 font-bold">
                        Ushbu filtr bo‘yicha chek va savdolar topilmadi
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const isSelected = selectedRows.includes(row.id);
                      return (
                        <tr
                          key={row.id}
                          className={`hover:bg-neutral-50/70 transition-colors ${
                            isSelected ? 'bg-[#f9f7fe]' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(row.id)}
                              className="rounded-md accent-[#35ca56] cursor-pointer h-3.5 w-3.5"
                            />
                          </td>

                          {/* Chek No */}
                          <td className="py-3.5 px-3 font-mono font-bold text-neutral-600">
                            {row.checkNo}
                          </td>

                          {/* Mijoz nomi va kategoriya */}
                          <td className="py-3.5 px-3">
                            <p className="font-extrabold text-[#111215] text-xs leading-tight">
                              {row.clientName}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-xs">
                              {row.category}
                            </p>
                          </td>

                          {/* To'lov turi va vaqti */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                row.paymentType === 'cash'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : row.paymentType === 'card'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {row.paymentType === 'cash'
                                ? 'Naqd pul'
                                : row.paymentType === 'card'
                                ? 'Karta / Terminal'
                                : 'Nasiya (Qarz)'}
                            </span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">
                              {row.date}
                            </span>
                          </td>

                          {/* Sof foyda */}
                          <td className="py-3.5 px-3 text-right font-bold text-emerald-700 text-xs">
                            +{row.profit}
                          </td>

                          {/* Jami Summa */}
                          <td className="py-3.5 px-3 text-right font-black text-[#111215] text-xs sm:text-sm">
                            {row.total.toLocaleString()} so‘m
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Jadval pastki qismi: Tanlanganlar va Aylana yangilash tugmasi (Rasmdagi ↻) */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-400">
              <div>
                {selectedRows.length > 0 ? (
                  <span className="font-bold text-[#249b3e]">
                    {selectedRows.length} ta chek tanlandi
                  </span>
                ) : (
                  <span>Jami {filteredRows.length} ta chek ko‘rsatilmoqda</span>
                )}
              </div>

              {/* Aylana Refresh Tugmasi (Rasmdagi ↻) */}
              <button
                onClick={handleRefresh}
                title="Hisobotni qayta yangilash"
                className="w-8 h-8 rounded-full bg-[#f7f7f5] hover:bg-[#efefec] text-[#111215] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#35ca56]' : 'text-neutral-600'}`} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: NUMBER (KPI SONLAR) */}
        {activeView === 'number' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
            <div className="bg-[#f7f7f5] p-5 rounded-2xl">
              <span className="text-xs font-bold text-neutral-400">Jami Naqd Pul Kassa</span>
              <h3 className="text-2xl font-black text-[#111215] mt-1">74,000,000 so‘m</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">64.8% umumiy ulush</p>
            </div>
            <div className="bg-[#f7f7f5] p-5 rounded-2xl">
              <span className="text-xs font-bold text-neutral-400">Karta & Terminal Aylanmasi</span>
              <h3 className="text-2xl font-black text-blue-700 mt-1">40,200,000 so‘m</h3>
              <p className="text-[11px] text-neutral-400 mt-1">35.2% umumiy ulush</p>
            </div>
            <div className="bg-[#f7f7f5] p-5 rounded-2xl">
              <span className="text-xs font-bold text-neutral-400">Kutilayotgan Nasiya Qarzlar</span>
              <h3 className="text-2xl font-black text-amber-700 mt-1">18,500,000 so‘m</h3>
              <p className="text-[11px] text-amber-700 font-bold mt-1">18 ta qarzdor mijoz</p>
            </div>
          </div>
        )}

        {/* TAB 3: BARCHART (USTUNLI GRAFIK) */}
        {activeView === 'barchart' && (
          <div className="py-6 space-y-4">
            <h4 className="text-xs font-black text-[#111215]">Haftalik Tushum Dinamikasi (mln so‘m)</h4>
            <div className="h-56 flex items-end gap-3 pt-6 border-b border-neutral-100">
              {[
                { day: 'Dush', val: 45, sum: '18.2M' },
                { day: 'Sesh', val: 62, sum: '24.8M' },
                { day: 'Chor', val: 38, sum: '15.4M' },
                { day: 'Pay', val: 95, sum: '38.0M', active: true },
                { day: 'Juma', val: 55, sum: '22.1M' },
                { day: 'Shan', val: 70, sum: '28.0M' },
                { day: 'Yak', val: 30, sum: '12.0M' },
              ].map((b) => (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {b.sum}
                  </span>
                  <div
                    style={{ height: `${b.val}%` }}
                    className={`w-full rounded-2xl transition-all ${
                      b.active ? 'bg-[#35ca56]' : 'bg-[#eafaf0] hover:bg-[#d2f5dc]'
                    }`}
                  />
                  <span className={`text-[11px] font-bold ${b.active ? 'text-[#249b3e]' : 'text-neutral-400'}`}>
                    {b.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DONUT (TOIFAVIY TAQSIMOT) */}
        {activeView === 'donut' && (
          <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#111215]">Sektorlar Bo‘yicha Savdo Hajmi</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="font-bold text-neutral-600">Agro & Vet Dorixona</span>
                  <span className="font-black text-[#111215]">42% (48.0 mln)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="font-bold text-neutral-600">Yem-xashak Ombori</span>
                  <span className="font-black text-[#111215]">28% (32.0 mln)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="font-bold text-neutral-600">Issiqxona Jihozlari</span>
                  <span className="font-black text-[#111215]">18% (20.5 mln)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-neutral-100">
                  <span className="font-bold text-neutral-600">Urug‘chilik & Texnika</span>
                  <span className="font-black text-[#111215]">12% (13.7 mln)</span>
                </div>
              </div>
            </div>

            <div className="bg-[#f7f7f5] p-6 rounded-2xl text-center space-y-2">
              <p className="text-xs font-bold text-neutral-400">Yetakchi Mahsulot</p>
              <h3 className="text-xl font-black text-[#111215]">Kombikorm Broyler (50 kg)</h3>
              <p className="text-xs font-bold text-emerald-700">112 qop sotildi · 16 240 000 so‘m</p>
            </div>
          </div>
        )}

        {/* TAB 5: TEXT (XULOSA MATNI) */}
        {activeView === 'text' && (
          <div className="bg-[#f7f7f5] p-6 rounded-2xl text-xs space-y-3">
            <h4 className="font-black text-[#111215] text-sm">Oylik Boshqaruv Xulosasi</h4>
            <p className="text-neutral-600 leading-relaxed">
              Oktabr oyida jami savdo aylanmasi 114.2 mln so‘mga yetdi. Naqd pul to‘lovlari 64.8% ni tashkil qilib, eng barqaror tushum manbai bo‘lib qolmoqda. Nasiyalar bo‘yicha 34.5 mln so‘m qaytarildi, qoldiq 18.5 mln so‘mni tashkil etadi.
            </p>
            <p className="text-neutral-600 leading-relaxed">
              Tavsiya: Vet dorixona va yem mahsulotlari eng yuqori marja berayotganligi sababli, partiya buyurtmasini o‘z vaqtida yangilash tavsiya etiladi.
            </p>
          </div>
        )}

        {/* TAB 6: LINE (TREND CHIZIQLI) */}
        {activeView === 'line' && (
          <div className="py-6 space-y-4">
            <h4 className="text-xs font-black text-[#111215]">Kunlik Tushum Trend Chizig‘i (Oktabr)</h4>
            <div className="relative h-44 w-full bg-[#f7f7f5] rounded-2xl p-4 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                <path
                  d="M0,90 Q70,40 140,70 T280,30 T420,50 T500,10"
                  fill="none"
                  stroke="#35ca56"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-400 px-2">
              <span>1-Oktabr</span>
              <span>10-Oktabr</span>
              <span>20-Oktabr</span>
              <span>30-Oktabr</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
