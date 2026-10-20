import React, { useState } from 'react';
import { MapPin, Lock, Store, Users, Layers, Zap, Globe2, ChevronRight } from 'lucide-react';
import { UZBEKISTAN_REGIONS, CENTRAL_ASIA_COUNTRIES, type RegionInfo } from '../data/regions';

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
          AgrozGO hozirda butun O‘zbekiston bo‘ylab 14 hududda 5 ta agro-sektorni qamrab olgan. Keyingi bosqichda butun O‘rta Osiyo davlatlariga integratsiya qilinadi.
        </p>
      </div>

      {/* SVG XARITA KONTEYNERI */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B150E] border border-forest-border/80 p-3 sm:p-4 shadow-inner">
        {/* Yuqori o'ng burchakdagi xarita holati */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-agroGreen/20 px-2.5 py-1 text-[10px] font-bold text-agroGreen border border-agroGreen/30 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-agroGreen animate-ping" />
            🇺🇿 O‘zbekiston: Faol (14 hudud)
          </span>
        </div>

        {/* Xarita SVG */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] select-none">
          <svg
            viewBox="0 0 620 360"
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* O'zbekiston yashil gradienti */}
              <linearGradient id="uzbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1A4A26" />
                <stop offset="50%" stopColor="#153B1F" />
                <stop offset="100%" stopColor="#0F2B16" />
              </linearGradient>

              {/* Qo'shni davlatlar to'q gradienti */}
              <linearGradient id="lockedCountry" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#111A13" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0B130D" stopOpacity="0.9" />
              </linearGradient>

              {/* Yashil glow filtri */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#35CA56" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* --- 1. QOZOG'ISTON (Shimol - Xira/Qulflangan) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qozog‘iston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-100 opacity-60"
            >
              <path
                d="M 40,110 Q 70,30 180,25 Q 320,15 460,30 Q 560,40 590,110 Q 540,115 500,105 Q 430,95 385,120 L 405,145 Q 340,135 270,140 Q 185,115 150,120 Z"
                fill="url(#lockedCountry)"
                stroke="#1F3223"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text x="320" y="70" fill="#4E6B53" fontSize="11" fontWeight="700" letterSpacing="2">
                QOZOG‘ISTON
              </text>
              {/* Qulf ramzi */}
              <circle cx="370" cy="85" r="10" fill="#142417" stroke="#25422A" strokeWidth="1" />
              <text x="366" y="89" fill="#719477" fontSize="10">🔒</text>
              <text x="385" y="89" fill="#5E7D63" fontSize="9" fontWeight="600">2027 Rejada</text>
            </g>

            {/* --- 2. TURKMANISTON (Janub-g'arb - Xira/Qulflangan) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Turkmaniston (2028 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-100 opacity-60"
            >
              <path
                d="M 70,215 Q 130,195 200,210 Q 230,240 270,245 L 240,325 Q 170,345 90,305 Z"
                fill="url(#lockedCountry)"
                stroke="#1F3223"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text x="135" y="270" fill="#4E6B53" fontSize="10" fontWeight="700" letterSpacing="1.5">
                TURKMANISTON
              </text>
              <circle cx="160" cy="288" r="9" fill="#142417" stroke="#25422A" strokeWidth="1" />
              <text x="156" y="292" fill="#719477" fontSize="9">🔒</text>
              <text x="174" y="292" fill="#5E7D63" fontSize="8" fontWeight="600">2028 Rejada</text>
            </g>

            {/* --- 3. TOJIKISTON (Janub-sharq - Xira/Qulflangan) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Tojikiston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-100 opacity-60"
            >
              <path
                d="M 375,255 Q 415,240 475,255 Q 515,285 495,335 Q 435,345 385,315 Z"
                fill="url(#lockedCountry)"
                stroke="#1F3223"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text x="420" y="295" fill="#4E6B53" fontSize="9" fontWeight="700" letterSpacing="1">
                TOJIKISTON
              </text>
              <circle cx="435" cy="310" r="8" fill="#142417" stroke="#25422A" strokeWidth="1" />
              <text x="432" y="313" fill="#719477" fontSize="8">🔒</text>
              <text x="447" y="313" fill="#5E7D63" fontSize="8" fontWeight="600">2027</text>
            </g>

            {/* --- 4. QIRG'IZISTON (Sharq - Xira/Qulflangan) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qirg‘iziston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-100 opacity-60"
            >
              <path
                d="M 455,150 Q 535,135 585,160 Q 575,215 520,225 Q 470,220 445,190 Z"
                fill="url(#lockedCountry)"
                stroke="#1F3223"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text x="500" y="175" fill="#4E6B53" fontSize="9" fontWeight="700" letterSpacing="1">
                QIRG‘IZISTON
              </text>
              <circle cx="510" cy="192" r="8" fill="#142417" stroke="#25422A" strokeWidth="1" />
              <text x="507" y="195" fill="#719477" fontSize="8">🔒</text>
              <text x="522" y="195" fill="#5E7D63" fontSize="8" fontWeight="600">2027</text>
            </g>

            {/* --- 5. O‘ZBEKISTON (ASOSIY FAOL DAVLAT - YASHIL YORQIN KONTUR) --- */}
            <g filter="url(#glow)">
              <path
                d="M 60,140 
                   Q 120,120 180,125 
                   Q 240,135 290,145 
                   L 370,150 
                   Q 410,135 440,150 
                   Q 460,170 540,175 
                   Q 560,195 530,215 
                   Q 490,210 460,195 
                   L 420,195 
                   Q 390,205 380,240 
                   L 355,305 
                   Q 330,315 315,265 
                   Q 290,245 250,230 
                   Q 200,205 160,210 
                   Q 120,200 80,205 
                   Q 50,175 60,140 Z"
                fill="url(#uzbGradient)"
                stroke="#35CA56"
                strokeWidth="2.2"
                className="transition-all duration-500"
              />
              {/* Orol dengizi havzasi konturi */}
              <ellipse cx="110" cy="148" rx="14" ry="10" fill="#0C1F13" stroke="#1D4327" strokeWidth="1" opacity="0.6" />
            </g>

            {/* O'zbekiston nomi matni */}
            <text x="210" y="175" fill="#35CA56" fontSize="13" fontWeight="900" letterSpacing="3" opacity="0.9">
              O‘ZBEKISTON
            </text>
            <text x="210" y="190" fill="#8CE8A0" fontSize="8.5" fontWeight="700" letterSpacing="1" opacity="0.8">
              ★ 100% FAOL EKOTIZIM
            </text>

            {/* --- 6. HUDUDLAR BO'YICHA LOCATION PINLARI --- */}
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
                    <circle cx={r.x} cy={r.y} r="12" fill="#35CA56" opacity="0.35" className="animate-ping" />
                  )}

                  {/* Asosiy nuqta / Pin */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isSelected ? '6.5' : '4.5'}
                    fill={isSelected ? '#35CA56' : '#22B343'}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? '2' : '1.2'}
                    className="transition-all duration-300 group-hover:scale-125"
                  />

                  {/* Pin yorlig'i */}
                  <text
                    x={r.x}
                    y={r.y - 9}
                    textAnchor="middle"
                    fill={isSelected ? '#FFFFFF' : '#A3EBB1'}
                    fontSize={isSelected ? '9.5' : '8'}
                    fontWeight={isSelected ? '900' : '700'}
                    className="select-none transition-all duration-200"
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
