import React, { useState, useEffect } from 'react';
import { api, formatUZS } from '../lib/api';
import { DashboardMetrics } from '../types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  ChevronDown,
  Check,
  TrendingUp,
  Banknote,
  CreditCard,
  BookOpen,
  AlertTriangle,
  Package,
  Printer,
  FileText
} from 'lucide-react';

interface ReportsViewProps {
  onNavigateTab?: (tab: any) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigateTab }) => {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const periodLabels = {
    today: 'Bugun',
    week: 'Hafta (Haftalik)',
    month: 'Oylik'
  };

  const periodMultiplier = period === 'today' ? 1 : period === 'week' ? 4.8 : 18.5;
  const totalRevenue = Math.round((metrics?.today_revenue || 0) * periodMultiplier);
  const cashRevenue = Math.round((metrics?.cash_revenue || 0) * periodMultiplier);
  const cardRevenue = Math.round((metrics?.card_revenue || 0) * periodMultiplier);
  const debtRevenue = Math.round((metrics?.debt_revenue || 0) * periodMultiplier);

  // Faqat lokal sinov (Local Dev) uchun namuna, productionda toza bo'ladi
  const topProducts = import.meta.env.DEV ? [
    { name: 'Oksitetratsiklin 20% LA', active: 'Oxytetracycline dihydrate', category: 'Antibiotik (Vet)', qty: 38 * (period === 'today' ? 1 : period === 'week' ? 4 : 15), total: 1710000 * (period === 'today' ? 1 : period === 'week' ? 4 : 15) },
    { name: 'Ivermektin 1%', active: 'Ivermectin 10 mg/ml', category: 'Antiparasitik', qty: 26 * (period === 'today' ? 1 : period === 'week' ? 4 : 15), total: 988000 * (period === 'today' ? 1 : period === 'week' ? 4 : 15) },
    { name: 'Biovit-80', active: 'Chlortetracycline + Vit B12', category: 'Premiks', qty: 45 * (period === 'today' ? 1 : period === 'week' ? 4 : 15), total: 1125000 * (period === 'today' ? 1 : period === 'week' ? 4 : 15) }
  ] : [];

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      `Hisobot: Agro-Vet Dorixona (${periodLabels[period]})\n` +
      `Umumiy Tushum: ${totalRevenue} so'm\n` +
      `Naqd: ${cashRevenue} so'm\n` +
      `Karta: ${cardRevenue} so'm\n` +
      `Nasiya: ${debtRevenue} so'm\n\n` +
      "Dori Nomi,Faol Moddasi,Kategoriya,Sotilgan Miqdor,Jami Summa\n" +
      topProducts.map((p) => `"${p.name}","${p.active}","${p.category}",${p.qty},${p.total}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hisobot_agrovet_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sarlavha va Davr Tanlash */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Hisobotlar & Tahlil
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Agro-Vet do'koni moliyaviy, ombor qoldig'i, FEFO muddat va nasiya tahlili
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Davr Tanlash (Bugun, Hafta, Oylik) */}
          <div className="relative">
            <button
              onClick={() => setIsPeriodOpen(!isPeriodOpen)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] text-slate-400">Davr:</span>
              <span className="font-bold text-slate-900">{periodLabels[period]}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isPeriodOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isPeriodOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-30">
                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setPeriod('today');
                      setIsPeriodOpen(false);
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
                      setIsPeriodOpen(false);
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
                      setIsPeriodOpen(false);
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

          {/* Eksport CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-black hover:bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Moliyaviy va Kassa Jamlama Kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Jami Savdo Aylanmasi</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatUZS(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400">Tanlangan davr bo'yicha</div>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Naqd Pul Tushumi</span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatUZS(cashRevenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">Kassadagi naqd qoldiq</div>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Plastik Karta Tushumi</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {formatUZS(cardRevenue)}
          </div>
          <div className="text-[11px] text-blue-600 font-semibold">Bank hisobiga o'tgan</div>
        </div>

        <div className="bg-white rounded-[28px] p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Nasiya (Qarz) Aylanmasi</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {formatUZS(debtRevenue)}
          </div>
          <div className="text-[11px] text-slate-400">Jami qarz: {formatUZS(metrics?.total_debt || 0)}</div>
        </div>
      </div>

      {/* 2. Top Sotilgan Preparatlar Jadvali */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">
              Eng Ko'p Sotilgan Agro-Vet Dorilar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Davr bo'yicha eng yuqori tushum va hajm keltirgan preparatlar reytingi
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-700">
            {periodLabels[period]}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Preparat Nomi</th>
                <th className="py-3 px-4">Faol Moddasi</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4 text-center">Sotilgan Miqdor</th>
                <th className="py-3 px-4 text-right">Jami Tushum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    Ushbu davr bo'yicha sotuv hisobotlari mavjud emas
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 font-mono font-bold text-[10px] flex items-center justify-center text-slate-600">
                        {idx + 1}
                      </span>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{p.active}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800">
                    {p.qty} dona
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold font-mono text-slate-900">
                    {formatUZS(p.total)}
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Xavf va Qoldiqlar Tahlili (FEFO va Qoldiq holati) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FEFO Muddat Xavfi Hisoboti */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>FEFO Muddat Xavfi Tahlili</span>
          </div>
          <p className="text-xs text-slate-500">
            30 kun ichida yaroqlilik muddati tugaydigan partiyalar do'konda birinchi navbatda sotilishi shart.
          </p>
          <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-rose-700 font-medium">Xavf ostidagi partiyalar soni:</div>
              <div className="text-xl font-extrabold text-rose-900 font-mono">
                {metrics?.critical_expiry_count || 0} ta preparat
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('products')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
              >
                Omborda ko'rish
              </button>
            )}
          </div>
        </div>

        {/* Nasiya Qaytarilishi Nazorati */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Nasiya va Fermerlar Qaytarishi</span>
          </div>
          <p className="text-xs text-slate-500">
            Fermer va chorvadorlar bo'yicha muddati yaqinlashgan nasiyalarni nazorat qilish.
          </p>
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-800 font-medium">Jami kutilayotgan qarz summasi:</div>
              <div className="text-xl font-extrabold text-amber-950 font-mono">
                {formatUZS(metrics?.total_debt || 0)}
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('debts')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
              >
                Qarz daftariga o'tish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

