import React, { useState } from 'react';
import { MapPin, Store, Users, Layers, Zap, Globe2 } from 'lucide-react';
import { UZBEKISTAN_REGIONS, CENTRAL_ASIA_COUNTRIES, type RegionInfo } from '../data/regions';
import { CENTRAL_ASIA_PATHS } from '../data/centralAsiaPaths';

export const CentralAsiaMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionInfo>(UZBEKISTAN_REGIONS[0]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  return (
    <div className="flex flex-col justify-between gap-6 p-2 sm:p-4">
      {/* Sarlavha & Ekotizim Ko'lami */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-agroGreen">
            <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
            O‘zbekiston & O‘rta Osiyo Qamrovi
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80 border border-white/10">
            <Globe2 className="h-3 w-3 text-agroGreen" />
            Markaziy Osiyo ekspansiyasi
          </span>
        </div>

        <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl text-white">
          O‘zbekiston bo‘ylab <span className="text-agroGreen">faol</span>,{' '}
          <br className="hidden sm:inline" />
          <span className="text-white/50">O‘rta Osiyoga tayyor</span>
        </h3>
        <p className="mt-2 text-xs text-white/70 leading-relaxed">
          AgrozGO hozirda butun O‘zbekiston bo‘ylab 14 hududda 5 ta agro-sektorni qamrab olgan. Qo‘shni Markaziy Osiyo davlatlari (Qozog‘iston, Qirg‘iziston, Tojikiston va Turkmaniston) esa 2027–2028 yillarga rejalashtirilgan.
        </p>
      </div>

      {/* SVG XARITA KONTEYNERI */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B150E] border border-forest-border/80 p-2 sm:p-4 shadow-inner">
        {/* Yuqori o'ng burchakdagi xarita holati */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-agroGreen/20 px-3 py-1 text-[10px] sm:text-xs font-bold text-agroGreen border border-agroGreen/30 shadow-sm backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-agroGreen animate-ping" />
            🇺🇿 O‘zbekiston: Faol (14 hudud)
          </span>
        </div>

        {/* Xarita SVG - Rasmiy O'rta Osiyo xaritasi */}
        <div className="relative w-full aspect-[917.5/593.94] select-none">
          <svg
            viewBox="0 0 917.5 593.94"
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* O'zbekiston yashil gradienti */}
              <linearGradient id="uzbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E5A2E" />
                <stop offset="50%" stopColor="#153E20" />
                <stop offset="100%" stopColor="#0D2B15" />
              </linearGradient>

              {/* Qo'shni davlatlar qoramtir gradienti */}
              <linearGradient id="lockedCountry" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#131C15" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0B130D" stopOpacity="0.95" />
              </linearGradient>

              {/* Yashil glow filtri */}
              <filter id="uzbGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="12" floodColor="#35CA56" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* --- 1. QOZOG'ISTON (Shimol - Xira / 2027 Rejada) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qozog‘iston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-90 opacity-60"
            >
              <path
                d={CENTRAL_ASIA_PATHS.kazakhstan}
                fill="url(#lockedCountry)"
                stroke="#243829"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />
              <text x="450" y="160" textAnchor="middle" fill="#587A5E" fontSize="16" fontWeight="800" letterSpacing="4">
                QOZOG‘ISTON
              </text>
              <g transform="translate(405, 180)">
                <rect width="90" height="24" rx="12" fill="#142417" stroke="#2B4630" strokeWidth="1" />
                <text x="14" y="16" fill="#8EAA92" fontSize="11" fontWeight="700">🔒 2027 Reja</text>
              </g>
            </g>

            {/* --- 2. TURKMANISTON (Janub-g'arb - Xira / 2028 Rejada) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Turkmaniston (2028 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-90 opacity-60"
            >
              <path
                d={CENTRAL_ASIA_PATHS.turkmenistan}
                fill="url(#lockedCountry)"
                stroke="#243829"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />
              <text x="270" y="475" textAnchor="middle" fill="#587A5E" fontSize="14" fontWeight="800" letterSpacing="3">
                TURKMANISTON
              </text>
              <g transform="translate(225, 492)">
                <rect width="90" height="22" rx="11" fill="#142417" stroke="#2B4630" strokeWidth="1" />
                <text x="14" y="15" fill="#8EAA92" fontSize="10.5" fontWeight="700">🔒 2028 Reja</text>
              </g>
            </g>

            {/* --- 3. TOJIKISTON (Janub-sharq - Xira / 2027 Rejada) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Tojikiston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-90 opacity-60"
            >
              <path
                d={CENTRAL_ASIA_PATHS.tajikistan}
                fill="url(#lockedCountry)"
                stroke="#243829"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />
              <text x="560" y="495" textAnchor="middle" fill="#587A5E" fontSize="13" fontWeight="800" letterSpacing="2">
                TOJIKISTON
              </text>
              <g transform="translate(525, 510)">
                <rect width="70" height="20" rx="10" fill="#142417" stroke="#2B4630" strokeWidth="1" />
                <text x="12" y="14" fill="#8EAA92" fontSize="9.5" fontWeight="700">🔒 2027</text>
              </g>
            </g>

            {/* --- 4. QIRG'IZISTON (Sharq - Xira / 2027 Rejada) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qirg‘iziston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-90 opacity-60"
            >
              <path
                d={CENTRAL_ASIA_PATHS.kyrgyzstan}
                fill="url(#lockedCountry)"
                stroke="#243829"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />
              <text x="645" y="420" textAnchor="middle" fill="#587A5E" fontSize="14" fontWeight="800" letterSpacing="3">
                QIRG‘IZISTON
              </text>
              <g transform="translate(605, 435)">
                <rect width="80" height="22" rx="11" fill="#142417" stroke="#2B4630" strokeWidth="1" />
                <text x="12" y="15" fill="#8EAA92" fontSize="10.5" fontWeight="700">🔒 2027 Reja</text>
              </g>
            </g>

            {/* --- 5. O‘ZBEKISTON (ASOSIY FAOL DAVLAT - YASHIL YORQIN KONTUR & SHU’LA) --- */}
            <g filter="url(#uzbGlow)">
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
            <text x="345" y="340" fill="#35CA56" fontSize="18" fontWeight="900" letterSpacing="4" opacity="0.95">
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
                    <circle cx={r.x} cy={r.y} r="16" fill="#35CA56" opacity="0.4" className="animate-ping" />
                  )}

                  {/* Tashqi halo */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isSelected ? '10' : '7'}
                    fill={isSelected ? '#35CA56' : '#22B343'}
                    opacity={isSelected ? '0.3' : '0.15'}
                    className="transition-all duration-300 group-hover:scale-150"
                  />

                  {/* Asosiy nuqta / Pin */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isSelected ? '7' : '5'}
                    fill={isSelected ? '#35CA56' : '#22B343'}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all duration-300 group-hover:scale-125"
                  />

                  {/* Pin tagidagi yorliq fon */}
                  <rect
                    x={r.x - 35}
                    y={r.y - 25}
                    width="70"
                    height="16"
                    rx="8"
                    fill={isSelected ? '#0F2B16' : '#0B150E'}
                    stroke={isSelected ? '#35CA56' : '#24452B'}
                    strokeWidth="1"
                    className="transition-all duration-200 group-hover:stroke-agroGreen"
                  />

                  {/* Pin yorlig'i matni */}
                  <text
                    x={r.x}
                    y={r.y - 14}
                    textAnchor="middle"
                    fill={isSelected ? '#35CA56' : '#D1F5D8'}
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
          <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-forest-dark/95 border border-agroGreen/30 px-3 py-1.5 text-center text-xs text-agroGreen font-bold backdrop-blur-md">
            🔒 {hoveredCountry} — 2-bosqichda Markaziy Osiyo bozoriga chiqish
          </div>
        )}
      </div>

      {/* TANLANGAN HUDUDNING JONLI STATISTIKASI (BENTO CARD) */}
      <div className="rounded-2xl bg-white/95 p-4 sm:p-5 text-charcoal shadow-soft border border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-charcoal/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-agroGreen-50 text-agroGreen-800">
              <MapPin className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-base font-extrabold text-charcoal flex items-center gap-1.5">
                {selectedRegion.name}
                <span className="rounded-md bg-agroGreen-100 px-2 py-0.5 text-[10px] font-bold text-agroGreen-900">
                  {selectedRegion.badge}
                </span>
              </h4>
              <p className="text-[11px] text-charcoal/50">Hozirda faol B2B va B2C ma’lumotlari</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-agroGreen-800 bg-agroGreen-50 px-2.5 py-1 rounded-full border border-agroGreen/20 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Yetkazish: {selectedRegion.deliverySpeed}
            </span>
          </div>
        </div>

        {/* 3 ta Katta Ko'rsatkich */}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div className="rounded-xl bg-cream p-2.5 sm:p-3 border border-charcoal/5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-charcoal/60">
              <Store className="h-3.5 w-3.5 text-agroGreen-800" /> Do‘konlar
            </div>
            <p className="mt-1 text-lg sm:text-xl font-black text-forest-dark">{selectedRegion.storesCount}</p>
            <p className="text-[9px] text-charcoal/40 font-medium">B2B kassa ulangan</p>
          </div>

          <div className="rounded-xl bg-cream p-2.5 sm:p-3 border border-charcoal/5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-charcoal/60">
              <Layers className="h-3.5 w-3.5 text-agroGreen-800" /> Sektorlar
            </div>
            <p className="mt-1 text-lg sm:text-xl font-black text-forest-dark">{selectedRegion.sectorsCount}/5</p>
            <p className="text-[9px] text-agroGreen-800 font-bold">100% barcha yo‘nalish</p>
          </div>

          <div className="rounded-xl bg-cream p-2.5 sm:p-3 border border-charcoal/5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-charcoal/60">
              <Users className="h-3.5 w-3.5 text-agroGreen-800" /> Fermerlar
            </div>
            <p className="mt-1 text-lg sm:text-xl font-black text-forest-dark">{selectedRegion.farmersCount}</p>
            <p className="text-[9px] text-charcoal/40 font-medium">Faol xaridor</p>
          </div>
        </div>

        {/* Ommabop sektor */}
        <div className="mt-3 flex items-center justify-between text-xs bg-cream-soft rounded-xl px-3 py-2 border border-charcoal/5">
          <span className="text-charcoal/70 font-medium">Eng ko‘p xarid qilinayotgan toifalar:</span>
          <span className="font-bold text-forest-dark">{selectedRegion.popularSector}</span>
        </div>
      </div>

      {/* Barcha 7 ta hudud tezkor selektori */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-semibold text-white/50 mr-1">Hududni tanlang:</span>
        {UZBEKISTAN_REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedRegion(r)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition cursor-pointer ${
              selectedRegion.id === r.id
                ? 'bg-agroGreen text-forest-dark shadow-sm'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            {r.name.split(' ')[0]} ({r.storesCount})
          </button>
        ))}
      </div>

      {/* O'RTA OSIYO EKSPANSIYA HOLATI RO'YXATI */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
        <div className="flex items-center justify-between text-xs text-white/60 mb-2 font-medium">
          <span>O‘rta Osiyo qamrovi xaritasi</span>
          <span className="text-agroGreen font-bold">2026–2028 Reja</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {CENTRAL_ASIA_COUNTRIES.map((c) => (
            <div
              key={c.name}
              className={`rounded-xl p-2 text-center border transition ${
                c.status === 'active'
                  ? 'bg-agroGreen/20 border-agroGreen/40 text-white'
                  : 'bg-white/[0.03] border-white/5 text-white/40'
              }`}
            >
              <p className="text-base">{c.flag}</p>
              <p className="text-[11px] font-bold mt-0.5">{c.name}</p>
              <p className={`text-[9px] mt-0.5 font-medium ${c.status === 'active' ? 'text-agroGreen' : 'text-white/40'}`}>
                {c.status === 'active' ? '● Faol' : '🔒 ' + c.statusText}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
