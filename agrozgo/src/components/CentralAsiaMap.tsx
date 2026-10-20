import React, { useState } from 'react';
import { MapPin, Store, Users, Layers, Zap, Globe2 } from 'lucide-react';
import { UZBEKISTAN_REGIONS, CENTRAL_ASIA_COUNTRIES, type RegionInfo } from '../data/regions';
import { CENTRAL_ASIA_PATHS } from '../data/centralAsiaPaths';

export const CentralAsiaMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionInfo>(UZBEKISTAN_REGIONS[0]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Sarlavha & Ekotizim Ko'lami */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agroGreen">
              <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
              O‘zbekiston & O‘rta Osiyo Qamrovi
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-white/70 border border-white/10">
              <Globe2 className="h-3 w-3 text-agroGreen" />
              2026–2028 Reja
            </span>
          </div>

          <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl text-white">
            O‘zbekiston bo‘ylab <span className="text-agroGreen">faol</span>,{' '}
            <span className="text-white/40">O‘rta Osiyoga tayyor</span>
          </h3>
        </div>

        <p className="text-xs text-white/60 max-w-md leading-relaxed sm:text-right">
          AgrozGO hozirda butun O‘zbekistonning 14 hududida 5 ta sektor bo‘yicha ishlayapti. 2027–2028 yillarda butun Markaziy Osiyo bo‘ylab ekspansiya qilinadi.
        </p>
      </div>

      {/* KATTA XARITA KONTEYNERI (Oq-qora opacity + zumrad glow) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#060A07]/90 border border-white/10 p-2 sm:p-5 shadow-2xl backdrop-blur-xl">
        {/* Xarita ustidagi DAVLATLAR BLOKI (Floating Frosted Glass Pills) */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Chap: O'zbekiston Faol status */}
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/60 border border-white/10 px-3.5 py-1.5 backdrop-blur-md shadow-lg">
            <span className="h-2 w-2 rounded-full bg-agroGreen animate-ping" />
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              🇺🇿 O‘zbekiston <span className="text-agroGreen font-bold">● Faol (14 hudud)</span>
            </span>
          </div>

          {/* O'ng: O'rta Osiyo ekspansiya davlatlari nishoni */}
          <div className="pointer-events-auto hidden md:flex items-center gap-1.5 rounded-full bg-black/60 border border-white/10 px-3 py-1.5 backdrop-blur-md shadow-lg">
            {CENTRAL_ASIA_COUNTRIES.slice(1).map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-white/60 border border-white/5"
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-white/30 text-[9px] font-medium">🔒 {c.statusText}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Xarita SVG - Katta, keng va yuqori aniqlikda */}
        <div className="relative w-full aspect-[917.5/540] select-none mt-10 md:mt-6">
          <svg
            viewBox="0 0 917.5 593.94"
            className="h-full w-full filter"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* O'zbekiston yashil/zumrad chuqur gradienti */}
              <linearGradient id="uzbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E5A2E" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#133C1E" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0A2211" stopOpacity="0.85" />
              </linearGradient>

              {/* Qo'shni davlatlar uchun oq-qora past opacity gradienti */}
              <linearGradient id="lockedMonochrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </linearGradient>

              {/* Kuchli zumrad neon nuri */}
              <filter id="uzbNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#35CA56" floodOpacity="0.4" />
                <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#35CA56" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* --- 1. QOZOG'ISTON (Shimol - Oq-qora past opacity) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qozog‘iston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-all duration-300 hover:opacity-90 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.kazakhstan}
                fill="url(#lockedMonochrome)"
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1.6"
                strokeDasharray="6 4"
                className="transition-colors duration-300 group-hover:stroke-white/30"
              />
              <text x="450" y="155" textAnchor="middle" fill="rgba(255, 255, 255, 0.45)" fontSize="16" fontWeight="800" letterSpacing="4">
                QOZOG‘ISTON
              </text>
              <g transform="translate(405, 172)">
                <rect width="90" height="22" rx="11" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="14" y="15" fill="rgba(255,255,255,0.65)" fontSize="10" fontWeight="700">🔒 2027 Reja</text>
              </g>
            </g>

            {/* --- 2. TURKMANISTON (Janub-g'arb - Oq-qora past opacity) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Turkmaniston (2028 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-all duration-300 hover:opacity-90 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.turkmenistan}
                fill="url(#lockedMonochrome)"
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1.6"
                strokeDasharray="6 4"
                className="transition-colors duration-300 group-hover:stroke-white/30"
              />
              <text x="270" y="475" textAnchor="middle" fill="rgba(255, 255, 255, 0.45)" fontSize="14" fontWeight="800" letterSpacing="3">
                TURKMANISTON
              </text>
              <g transform="translate(225, 492)">
                <rect width="90" height="22" rx="11" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="14" y="15" fill="rgba(255,255,255,0.65)" fontSize="10" fontWeight="700">🔒 2028 Reja</text>
              </g>
            </g>

            {/* --- 3. TOJIKISTON (Janub-sharq - Oq-qora past opacity) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Tojikiston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-all duration-300 hover:opacity-90 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.tajikistan}
                fill="url(#lockedMonochrome)"
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1.6"
                strokeDasharray="6 4"
                className="transition-colors duration-300 group-hover:stroke-white/30"
              />
              <text x="560" y="495" textAnchor="middle" fill="rgba(255, 255, 255, 0.45)" fontSize="13" fontWeight="800" letterSpacing="2">
                TOJIKISTON
              </text>
              <g transform="translate(525, 510)">
                <rect width="70" height="20" rx="10" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="12" y="14" fill="rgba(255,255,255,0.65)" fontSize="9" fontWeight="700">🔒 2027</text>
              </g>
            </g>

            {/* --- 4. QIRG'IZISTON (Sharq - Oq-qora past opacity) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qirg‘iziston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-all duration-300 hover:opacity-90 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.kyrgyzstan}
                fill="url(#lockedMonochrome)"
                stroke="rgba(255, 255, 255, 0.16)"
                strokeWidth="1.6"
                strokeDasharray="6 4"
                className="transition-colors duration-300 group-hover:stroke-white/30"
              />
              <text x="645" y="420" textAnchor="middle" fill="rgba(255, 255, 255, 0.45)" fontSize="14" fontWeight="800" letterSpacing="3">
                QIRG‘IZISTON
              </text>
              <g transform="translate(605, 435)">
                <rect width="80" height="22" rx="11" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="12" y="15" fill="rgba(255,255,255,0.65)" fontSize="10" fontWeight="700">🔒 2027 Reja</text>
              </g>
            </g>

            {/* --- 5. O‘ZBEKISTON (ASOSIY FAOL DAVLAT - YASHIL YORQIN KONTUR & SHU’LA) --- */}
            <g filter="url(#uzbNeonGlow)">
              <path
                d={CENTRAL_ASIA_PATHS.uzbekistanMain}
                fill="url(#uzbGradient)"
                stroke="#35CA56"
                strokeWidth="2.8"
                className="transition-all duration-300 hover:brightness-110"
              />
              <path
                d={CENTRAL_ASIA_PATHS.uzbekistanSub}
                fill="url(#uzbGradient)"
                stroke="#35CA56"
                strokeWidth="2"
              />
            </g>

            {/* O'zbekiston markaziy yozuvi */}
            <text x="345" y="340" fill="#35CA56" fontSize="19" fontWeight="900" letterSpacing="4" opacity="0.95">
              O‘ZBEKISTON
            </text>
            <text x="345" y="358" fill="#8CE8A0" fontSize="10.5" fontWeight="700" letterSpacing="1.5" opacity="0.85">
              ★ 100% FAOL EKOTIZIM (14 VILOYAT)
            </text>

            {/* --- 6. HUDUDLAR BO'YICHA LOCATION PINLARI (7 TA MARKAZ) --- */}
            {UZBEKISTAN_REGIONS.map((r) => {
              const isSelected = selectedRegion.id === r.id;
              return (
                <g
                  key={r.id}
                  onClick={() => setSelectedRegion(r)}
                  className="cursor-pointer group"
                >
                  {/* Ping to'lqini */}
                  {isSelected && (
                    <circle cx={r.x} cy={r.y} r="18" fill="#35CA56" opacity="0.35" className="animate-ping" />
                  )}

                  {/* Tashqi halo */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isSelected ? '11' : '7.5'}
                    fill={isSelected ? '#35CA56' : '#22B343'}
                    opacity={isSelected ? '0.35' : '0.15'}
                    className="transition-all duration-300 group-hover:scale-150"
                  />

                  {/* Asosiy nuqta / Pin */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isSelected ? '7.5' : '5'}
                    fill={isSelected ? '#35CA56' : '#22B343'}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all duration-300 group-hover:scale-125 shadow-md"
                  />

                  {/* Pin tagidagi yorliq fon (Oq-qora glassmorphism) */}
                  <rect
                    x={r.x - 36}
                    y={r.y - 25}
                    width="72"
                    height="16"
                    rx="8"
                    fill={isSelected ? '#0F2B16' : 'rgba(0, 0, 0, 0.75)'}
                    stroke={isSelected ? '#35CA56' : 'rgba(255, 255, 255, 0.2)'}
                    strokeWidth="1"
                    className="transition-all duration-200 group-hover:stroke-agroGreen"
                  />

                  {/* Pin yorlig'i matni */}
                  <text
                    x={r.x}
                    y={r.y - 14}
                    textAnchor="middle"
                    fill={isSelected ? '#35CA56' : '#FFFFFF'}
                    fontSize="9.5"
                    fontWeight={isSelected ? '900' : '700'}
                    className="select-none transition-all duration-200 pointer-events-none"
                  >
                    {r.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hoverda davlat haqida ma'lumot */}
        {hoveredCountry && (
          <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/90 border border-agroGreen/40 px-3 py-1.5 text-center text-xs text-agroGreen font-bold backdrop-blur-md shadow-xl">
            🔒 {hoveredCountry} — 2-bosqichda Markaziy Osiyo bozoriga integratsiya
          </div>
        )}
      </div>

      {/* QISQAROQ VA IXCHAM TANLANGAN HUDUD STATISTIKASI (Glass Bento Strip) */}
      <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-3 sm:p-4 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tanlangan hudud nomi va nishoni */}
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-agroGreen/20 text-agroGreen border border-agroGreen/30">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base sm:text-lg font-black text-white">{selectedRegion.name}</h4>
                <span className="rounded-md bg-agroGreen/20 px-2 py-0.5 text-[10px] font-bold text-agroGreen border border-agroGreen/30">
                  {selectedRegion.badge}
                </span>
              </div>
              <p className="text-[11px] text-white/50">Hozirda faol B2B va B2C ma’lumotlari</p>
            </div>
          </div>

          {/* 4 ta Ixcham Ko'rsatkichlar (Bir qatorda) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center lg:flex-1 lg:max-w-2xl">
            {/* Do'konlar */}
            <div className="rounded-xl bg-white/[0.04] p-2 sm:p-2.5 border border-white/5">
              <span className="flex items-center justify-center gap-1 text-[11px] font-medium text-white/50">
                <Store className="h-3 w-3 text-agroGreen" /> Do‘konlar
              </span>
              <p className="mt-0.5 text-base sm:text-lg font-black text-white">{selectedRegion.storesCount}</p>
              <p className="text-[9px] text-white/40">B2B kassa ulangan</p>
            </div>

            {/* Sektorlar */}
            <div className="rounded-xl bg-white/[0.04] p-2 sm:p-2.5 border border-white/5">
              <span className="flex items-center justify-center gap-1 text-[11px] font-medium text-white/50">
                <Layers className="h-3 w-3 text-agroGreen" /> Sektorlar
              </span>
              <p className="mt-0.5 text-base sm:text-lg font-black text-agroGreen">{selectedRegion.sectorsCount}/5</p>
              <p className="text-[9px] text-agroGreen/70 font-semibold">100% barcha yo‘nalish</p>
            </div>

            {/* Fermerlar */}
            <div className="rounded-xl bg-white/[0.04] p-2 sm:p-2.5 border border-white/5">
              <span className="flex items-center justify-center gap-1 text-[11px] font-medium text-white/50">
                <Users className="h-3 w-3 text-agroGreen" /> Fermerlar
              </span>
              <p className="mt-0.5 text-base sm:text-lg font-black text-white">{selectedRegion.farmersCount}</p>
              <p className="text-[9px] text-white/40">Faol xaridor</p>
            </div>

            {/* Yetkazish & Ommabop */}
            <div className="rounded-xl bg-white/[0.04] p-2 sm:p-2.5 border border-white/5 text-left">
              <span className="flex items-center gap-1 text-[10px] font-semibold text-agroGreen">
                <Zap className="h-3 w-3 shrink-0" /> {selectedRegion.deliverySpeed}
              </span>
              <p className="mt-0.5 text-[11px] font-bold text-white truncate" title={selectedRegion.popularSector}>
                {selectedRegion.popularSector}
              </p>
              <p className="text-[9px] text-white/40">Eng ko‘p xarid</p>
            </div>
          </div>
        </div>

        {/* 7 TA HUDUD TEZKOR TUGMALARI (Bir qatorda) */}
        <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-white/40 mr-1">Hududni tanlang:</span>
          {UZBEKISTAN_REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRegion(r)}
              className={`rounded-full px-3 py-1 text-[10px] font-bold transition cursor-pointer ${
                selectedRegion.id === r.id
                  ? 'bg-agroGreen text-forest-dark font-black shadow-glow-subtle'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {r.name.split(' ')[0]} ({r.storesCount})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
