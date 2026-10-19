import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { RegionsResponse, RegionData, BusinessType } from '../types';
import {
  MapPin,
  RefreshCw,
  Search,
  Store,
  TrendingUp,
  Download,
  CheckCircle2,
  Navigation,
  Globe2,
  SlidersHorizontal,
  Phone,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const BIZ_MAP: Record<BusinessType, { label: string; color: string; dot: string }> = {
  agro_vet: { label: 'Agro-Vet', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  feed: { label: 'Yem-Ozuqa', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  warehouse: { label: 'Ulgurji Ombor', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  seeds: { label: 'Urug‘chilik', color: 'bg-lime-50 text-lime-700 border-lime-200', dot: 'bg-lime-500' },
  machinery: { label: 'Texnika & Jihoz', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

// O'zbekiston viloyatlari xarita koordinata gridi (vizual sxematik xarita uchun)
const REGION_COORDINATES: Record<string, { x: number; y: number; w: number; h: number }> = {
  karakalpakstan: { x: 30, y: 35, w: 180, h: 100 },
  khorezm: { x: 140, y: 155, w: 75, h: 55 },
  bukhara: { x: 230, y: 160, w: 90, h: 80 },
  navoiy: { x: 250, y: 70, w: 110, h: 85 },
  samarkand: { x: 350, y: 175, w: 80, h: 60 },
  kashkadarya: { x: 330, y: 245, w: 90, h: 70 },
  surkhandarya: { x: 410, y: 285, w: 75, h: 65 },
  jizzakh: { x: 420, y: 150, w: 75, h: 65 },
  sirdaryo: { x: 475, y: 130, w: 60, h: 50 },
  tashkent_region: { x: 500, y: 75, w: 85, h: 65 },
  tashkent_city: { x: 535, y: 105, w: 45, h: 35 },
  namangan: { x: 580, y: 80, w: 70, h: 50 },
  fergana: { x: 580, y: 140, w: 75, h: 50 },
  andijan: { x: 655, y: 105, w: 60, h: 55 },
};

export const MapView: React.FC = () => {
  const [data, setData] = useState<RegionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRegions();
      setData(res);
      // Dastlab eng ko'p do'koni bor viloyatni tanlaymiz
      if (res.summary.top_region) {
        setSelectedRegionId(res.summary.top_region.id);
      } else if (res.regions.length > 0) {
        setSelectedRegionId(res.regions[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Hududiy statistikani yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val || 0)) + " so'm";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <RefreshCw className="w-8 h-8 text-black animate-spin mb-3" />
        <p className="text-slate-500 text-xs font-medium">Viloyatlar bo‘yicha B2B xaritasi yuklanmoqda...</p>
      </div>
    );
  }

  const selectedRegion = data?.regions.find((r) => r.id === selectedRegionId) || data?.regions[0] || null;

  // Filtrlangan do'konlar (tanlangan viloyat ichida)
  const regionMerchants = (selectedRegion?.merchants || []).filter((m) => {
    if (sectorFilter !== 'all' && m.business_type !== sectorFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (m.store_name || '').toLowerCase().includes(q);
      const matchOwner = (m.owner_name || '').toLowerCase().includes(q);
      const matchPhone = (m.phone || '').toLowerCase().includes(q);
      const matchAddr = (m.address || '').toLowerCase().includes(q);
      return matchName || matchOwner || matchPhone || matchAddr;
    }
    return true;
  });

  // Viloyatlar ro'yxatini do'konlar soniga qarab saralash
  const sortedRegions = [...(data?.regions || [])].sort((a, b) => b.merchants_count - a.merchants_count);

  const handleExportCSV = () => {
    if (!data?.regions.length) return;

    const headers = ['Viloyat Kodi', 'Viloyat Nomi', 'Jami B2B Do‘konlar', 'Faol Do‘konlar', 'Jami Savdo Summasi', 'Agro-Vet', 'Yem-Ozuqa', 'Ombor', 'Urug‘chilik', 'Texnika'];
    const rows = data.regions.map((r) => [
      r.code,
      `"${r.name}"`,
      r.merchants_count,
      r.active_count,
      r.total_sales,
      r.by_business_type.agro_vet || 0,
      r.by_business_type.feed || 0,
      r.by_business_type.warehouse || 0,
      r.by_business_type.seeds || 0,
      r.by_business_type.machinery || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `biznesgo_viloyatlar_xaritasi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      {/* Sarlavha va Eksport */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Hududiy B2B<br />Xaritasi
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            O‘zbekistonning 14 ta hududi bo‘yicha ro‘yxatdan o‘tgan do‘konlar, savdo aylanmasi va tarmoqlanishi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-full text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-700" />
            <span>Yangilash</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-slate-800 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Viloyatlar CSV</span>
          </button>
        </div>
      </div>

      {/* 4 ta Bento Statistik Kartochka */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Jami Do'konlar */}
        <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-500">Jami B2B Do‘konlar</span>
            <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-slate-800" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {data?.summary.total_merchants || 0}
            <span className="text-xs font-semibold text-slate-400 ml-1.5">do‘kon</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Platformada ro‘yxatdan o‘tgan</p>
        </div>

        {/* Qamrab olingan hududlar */}
        <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-500">Qamrov (Viloyatlar)</span>
            <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
              <Globe2 className="w-3.5 h-3.5 text-slate-800" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {data?.summary.covered_regions || 0}
            <span className="text-xs font-semibold text-slate-400 ml-1.5">/ 14 hudud</span>
          </div>
          <p className="text-[10px] text-emerald-600 font-semibold mt-1">
            Faol B2B savdo nuqtalari mavjud
          </p>
        </div>

        {/* Yetakchi Viloyat */}
        <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-emerald-700">Yetakchi Hudud</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2 truncate">
            {data?.summary.top_region?.name || '—'}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            {data?.summary.top_region?.count || 0} ta B2B sotuvchi
          </p>
        </div>

        {/* GPS Koordinatali */}
        <div className="bg-white rounded-[28px] p-5 shadow-xs border border-slate-200/60 flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-500">Aniq Lokatsiya (GPS)</span>
            <div className="w-7 h-7 rounded-full bg-[#F6F6F3] flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5 text-slate-800" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {data?.summary.geocoded_pins_count || 0}
            <span className="text-xs font-semibold text-slate-400 ml-1.5">nuqta</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Xaritada tasdiqlangan manzil</p>
        </div>
      </div>

      {/* Asosiy 2 Ustun: Interaktiv Xarita + Viloyat Tafsiloti */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chap 7 Ustun: Interaktiv O'zbekiston Sxematik Vektor Xaritasi */}
        <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-black" />
                <span>O‘zbekiston Respublikasi Xaritasi</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Viloyatni tanlash uchun ustiga bosing (yashil rang do‘konlar soni yuqoriligini bildiradi)
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></span>
              <span className="font-semibold text-[11px]">Ko‘p B2B</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 ml-2"></span>
              <span className="font-semibold text-[11px]">Hali yo‘q</span>
            </div>
          </div>

          {/* SVG Sxematik Interaktiv Xarita */}
          <div className="relative w-full aspect-16/10 bg-[#F8F8F6] rounded-2xl p-4 overflow-hidden border border-slate-100 flex items-center justify-center">
            <svg
              viewBox="0 0 740 370"
              className="w-full h-full select-none"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.03))' }}
            >
              {data?.regions.map((reg) => {
                const coord = REGION_COORDINATES[reg.id] || { x: 350, y: 150, w: 70, h: 50 };
                const isSelected = selectedRegionId === reg.id;
                const hasMerchants = reg.merchants_count > 0;
                const isTop = data.summary.top_region?.id === reg.id;

                // Do'konlar zichligiga qarab rang
                let fillColor = '#EAEAEC';
                let strokeColor = '#D4D4D8';
                let textColor = '#71717A';

                if (isTop) {
                  fillColor = '#22C55E';
                  strokeColor = '#16A34A';
                  textColor = '#000000';
                } else if (reg.merchants_count >= 15) {
                  fillColor = '#4ADE80';
                  strokeColor = '#22C55E';
                  textColor = '#000000';
                } else if (reg.merchants_count > 0) {
                  fillColor = '#BBF7D0';
                  strokeColor = '#86EFAC';
                  textColor = '#14532D';
                }

                if (isSelected) {
                  strokeColor = '#000000';
                }

                return (
                  <g
                    key={reg.id}
                    onClick={() => setSelectedRegionId(reg.id)}
                    className="cursor-pointer transition-all duration-200 group"
                  >
                    {/* Viloyat hududi to'rtburchagi (yumaloq) */}
                    <rect
                      x={coord.x}
                      y={coord.y}
                      width={coord.w}
                      height={coord.h}
                      rx={16}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-200 group-hover:brightness-95"
                    />

                    {/* Viloyat nomi */}
                    <text
                      x={coord.x + coord.w / 2}
                      y={coord.y + coord.h / 2 - (hasMerchants ? 6 : 0)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={textColor}
                      className="text-[11px] font-bold select-none pointer-events-none"
                    >
                      {reg.name.replace(' viloyati', '').replace(' Respublikasi', '')}
                    </text>

                    {/* Do'konlar soni nishoni */}
                    {hasMerchants && (
                      <g>
                        <rect
                          x={coord.x + coord.w / 2 - 16}
                          y={coord.y + coord.h / 2 + 6}
                          width={32}
                          height={16}
                          rx={8}
                          fill={isTop ? '#000000' : '#FFFFFF'}
                        />
                        <text
                          x={coord.x + coord.w / 2}
                          y={coord.y + coord.h / 2 + 15}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={isTop ? '#FFFFFF' : '#000000'}
                          className="text-[9px] font-extrabold select-none pointer-events-none"
                        >
                          {reg.merchants_count}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Viloyatlar tezkor paneli */}
          <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {sortedRegions.map((r) => {
              const isSelected = selectedRegionId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegionId(r.id)}
                  className={`px-3 py-1.5 rounded-full font-semibold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-black text-white shadow-xs'
                      : r.merchants_count > 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-[#F6F6F3] text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{r.name.replace(' viloyati', '')}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white text-black' : 'bg-black/10 text-slate-800'
                  }`}>
                    {r.merchants_count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* O'ng 5 Ustun: Tanlangan Viloyat Tafsilotlari */}
        <div className="lg:col-span-5 bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60 flex flex-col justify-between">
          <div>
            {/* Viloyat Sarlavhasi */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanlangan Hudud</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedRegion?.name}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kodi: <span className="font-mono font-bold text-slate-700">{selectedRegion?.code}</span> • Markaz koordinatasi: {selectedRegion?.lat}, {selectedRegion?.lng}
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{selectedRegion?.merchants_count || 0}</span>
                <span className="block text-[10px] text-slate-400 font-semibold">B2B Do‘kon</span>
              </div>
            </div>

            {/* Sektorlar bo'yicha taqsimot */}
            <div className="py-4 border-b border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 block">Sektorlar bo‘yicha taqsimot:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {Object.entries(BIZ_MAP).map(([key, meta]) => {
                  const count = selectedRegion?.by_business_type[key as BusinessType] || 0;
                  return (
                    <div key={key} className={`p-2.5 rounded-2xl border ${meta.color} flex flex-col justify-between`}>
                      <span className="text-[10px] font-medium">{meta.label}</span>
                      <span className="text-sm font-black mt-1">{count} ta</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Savdo aylanmasi ko'rsatkichi */}
            <div className="py-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Ushbu hudud umumiy savdosi:</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatMoney(selectedRegion?.total_sales || 0)}
              </span>
            </div>
          </div>

          {/* Tanlangan viloyatdagi do'konlar ro'yxati */}
          <div className="mt-4 flex flex-col flex-1 min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900">
                Do‘konlar ({regionMerchants.length})
              </span>

              {/* Sektor filtri */}
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-[#F6F6F3] border-none rounded-full px-3 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="all">Barcha sektorlar</option>
                <option value="agro_vet">Agro-Vet</option>
                <option value="feed">Yem-Ozuqa</option>
                <option value="warehouse">Ombor</option>
                <option value="seeds">Urug‘</option>
                <option value="machinery">Texnika</option>
              </select>
            </div>

            {/* Do'konlar ro'yxati scroll qismi */}
            <div className="flex-1 overflow-y-auto max-h-[260px] divide-y divide-slate-100 pr-1">
              {regionMerchants.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Ushbu viloyatda hozircha tanlangan filtr bo‘yicha do‘kon yo‘q
                </div>
              ) : (
                regionMerchants.map((m) => {
                  const bMeta = BIZ_MAP[m.business_type] || { label: m.business_type, color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' };
                  return (
                    <div key={m.id} className="py-2.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 truncate">{m.store_name}</span>
                          <span className={`w-2 h-2 rounded-full ${m.is_active ? 'bg-[#22C55E]' : 'bg-rose-500'}`} title={m.is_active ? 'Faol' : 'Bloklangan'}></span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {m.address || 'Manzil kiritilmagan'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${bMeta.color}`}>
                            {bMeta.label}
                          </span>
                          <a href={`tel:${m.phone}`} className="text-[10px] text-slate-600 hover:text-black font-mono">
                            {m.phone}
                          </a>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatMoney(m.total_sales)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.products_count} tovar
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Umumiy Reyting Jadvali (Barcha 14 ta viloyat kesimida) */}
      <div className="bg-white rounded-[32px] p-6 sm:p-7 shadow-xs border border-slate-200/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hududlar Bo‘yicha To‘liq Reyting</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Barcha 14 ta ma’muriy birlik bo‘yicha taqqoslama hisobot</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 text-[11px] font-semibold uppercase">
                <th className="pb-3 font-semibold">Viloyat / Hudud</th>
                <th className="pb-3 font-semibold">B2B Do‘konlar</th>
                <th className="pb-3 font-semibold">Faol Nuqtalar</th>
                <th className="pb-3 font-semibold">Agro-Vet</th>
                <th className="pb-3 font-semibold">Yem</th>
                <th className="pb-3 font-semibold">Ombor</th>
                <th className="pb-3 font-semibold">Urug‘</th>
                <th className="pb-3 font-semibold">Texnika</th>
                <th className="pb-3 font-semibold text-right">Umumiy Savdo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRegions.map((reg, idx) => (
                <tr
                  key={reg.id}
                  onClick={() => setSelectedRegionId(reg.id)}
                  className={`hover:bg-slate-50/80 transition cursor-pointer ${selectedRegionId === reg.id ? 'bg-slate-50' : ''}`}
                >
                  <td className="py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 text-slate-400 text-[11px] font-mono">{idx + 1}.</span>
                    <span>{reg.name}</span>
                    {idx === 0 && reg.merchants_count > 0 && (
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                        Top 1
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 font-black text-slate-900">
                    {reg.merchants_count}
                  </td>
                  <td className="py-3.5 text-emerald-600 font-semibold">
                    {reg.active_count}
                  </td>
                  <td className="py-3.5 text-slate-600">{reg.by_business_type.agro_vet || 0}</td>
                  <td className="py-3.5 text-slate-600">{reg.by_business_type.feed || 0}</td>
                  <td className="py-3.5 text-slate-600">{reg.by_business_type.warehouse || 0}</td>
                  <td className="py-3.5 text-slate-600">{reg.by_business_type.seeds || 0}</td>
                  <td className="py-3.5 text-slate-600">{reg.by_business_type.machinery || 0}</td>
                  <td className="py-3.5 text-right font-bold text-slate-900">
                    {formatMoney(reg.total_sales)}
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

