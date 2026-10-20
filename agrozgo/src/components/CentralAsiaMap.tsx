import React, { useState } from 'react';
import { Store, Users, MapPin, Zap, ShieldCheck } from 'lucide-react';
import { UZBEKISTAN_REGIONS, CENTRAL_ASIA_COUNTRIES, UZBEKISTAN_SECTOR_SUMMARY, type RegionInfo } from '../data/regions';
import { CENTRAL_ASIA_PATHS } from '../data/centralAsiaPaths';

export const CentralAsiaMap: React.FC = () => {
  const [hoveredRegion, setHoveredRegion] = useState<RegionInfo | null>(UZBEKISTAN_REGIONS[0]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const activeRegion = hoveredRegion || UZBEKISTAN_REGIONS[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. ASOSIY XARITA KONTEYNERI (Loyiha Warm Cream foni + To'q zumrad O'zbekiston + Xira qo'shnilar) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#F5F4EE] border border-charcoal/10 p-3 sm:p-6 shadow-soft">
        {/* Xarita ustidagi mini status sarlavhasi va davlatlar holati */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 pb-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-agroGreen animate-pulse" />
            <h3 className="text-base sm:text-lg font-black text-charcoal">
              O‘zbekiston va O‘rta Osiyo Qamrovi
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-agroGreen-100 px-2.5 py-0.5 text-[11px] font-bold text-agroGreen-900 border border-agroGreen/20">
              14 hudud faol
            </span>
          </div>

          {/* O'rta Osiyo davlatlari status pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-agroGreen/15 px-2.5 py-1 font-bold text-agroGreen-800 border border-agroGreen/30">
              🇺🇿 O‘zbekiston (● Faol)
            </span>
            {CENTRAL_ASIA_COUNTRIES.slice(1).map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1 rounded-full bg-charcoal/5 px-2 py-0.5 text-[10px] font-medium text-charcoal/50 border border-charcoal/5"
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
                <span className="text-charcoal/40 text-[9px]">🔒 {c.statusText}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Xarita SVG — Toza, keng va aniq */}
        <div className="relative w-full aspect-[917.5/540] select-none">
          <svg
            viewBox="0 0 917.5 593.94"
            className="h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* O'zbekiston uchun to'q, aniq ko'rinadigan zumrad/charcoal gradient */}
              <linearGradient id="uzbDeepGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#132B1A" />
                <stop offset="50%" stopColor="#183622" />
                <stop offset="100%" stopColor="#0F2416" />
              </linearGradient>

              {/* Qo'shni davlatlar uchun past opacity va engil soyalanish */}
              <linearGradient id="neighborMuted" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2DED3" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#D5D0C3" stopOpacity="0.35" />
              </linearGradient>

              {/* O'zbekiston chegarasi nuri */}
              <filter id="uzbShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#183622" floodOpacity="0.3" />
                <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#35CA56" floodOpacity="0.35" />
              </filter>
            </defs>

            {/* --- 1. QOZOG'ISTON (Shimol - Opacity pastroq, xira) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qozog‘iston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-80 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.kazakhstan}
                fill="url(#neighborMuted)"
                stroke="#A8A395"
                strokeWidth="1.4"
                strokeDasharray="5 4"
              />
              <text x="450" y="155" textAnchor="middle" fill="#6B6658" fontSize="15" fontWeight="800" letterSpacing="4">
                QOZOG‘ISTON
              </text>
              <g transform="translate(405, 172)">
                <rect width="90" height="22" rx="11" fill="#ECE8DD" stroke="#B8B3A4" strokeWidth="1" />
                <text x="14" y="15" fill="#5C5749" fontSize="10" fontWeight="700">🔒 2027 Reja</text>
              </g>
            </g>

            {/* --- 2. TURKMANISTON (Janub-g'arb - Opacity pastroq) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Turkmaniston (2028 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-80 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.turkmenistan}
                fill="url(#neighborMuted)"
                stroke="#A8A395"
                strokeWidth="1.4"
                strokeDasharray="5 4"
              />
              <text x="270" y="475" textAnchor="middle" fill="#6B6658" fontSize="13" fontWeight="800" letterSpacing="3">
                TURKMANISTON
              </text>
              <g transform="translate(225, 492)">
                <rect width="90" height="22" rx="11" fill="#ECE8DD" stroke="#B8B3A4" strokeWidth="1" />
                <text x="14" y="15" fill="#5C5749" fontSize="10" fontWeight="700">🔒 2028 Reja</text>
              </g>
            </g>

            {/* --- 3. TOJIKISTON (Janub-sharq - Opacity pastroq) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Tojikiston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-80 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.tajikistan}
                fill="url(#neighborMuted)"
                stroke="#A8A395"
                strokeWidth="1.4"
                strokeDasharray="5 4"
              />
              <text x="560" y="495" textAnchor="middle" fill="#6B6658" fontSize="12" fontWeight="800" letterSpacing="2">
                TOJIKISTON
              </text>
              <g transform="translate(525, 510)">
                <rect width="70" height="20" rx="10" fill="#ECE8DD" stroke="#B8B3A4" strokeWidth="1" />
                <text x="12" y="14" fill="#5C5749" fontSize="9" fontWeight="700">🔒 2027</text>
              </g>
            </g>

            {/* --- 4. QIRG'IZISTON (Sharq - Opacity pastroq) --- */}
            <g
              onMouseEnter={() => setHoveredCountry('Qirg‘iziston (2027 Rejada)')}
              onMouseLeave={() => setHoveredCountry(null)}
              className="cursor-help transition-opacity duration-300 hover:opacity-80 opacity-40 group"
            >
              <path
                d={CENTRAL_ASIA_PATHS.kyrgyzstan}
                fill="url(#neighborMuted)"
                stroke="#A8A395"
                strokeWidth="1.4"
                strokeDasharray="5 4"
              />
              <text x="645" y="420" textAnchor="middle" fill="#6B6658" fontSize="13" fontWeight="800" letterSpacing="3">
                QIRG‘IZISTON
              </text>
              <g transform="translate(605, 435)">
                <rect width="80" height="22" rx="11" fill="#ECE8DD" stroke="#B8B3A4" strokeWidth="1" />
                <text x="12" y="15" fill="#5C5749" fontSize="10" fontWeight="700">🔒 2027 Reja</text>
              </g>
            </g>

            {/* --- 5. O‘ZBEKISTON (QORAROQ, ANIQLIK BILAN AJRALIB TURUVCHI ASOSIY DAVLAT) --- */}
            <g filter="url(#uzbShadow)">
              <path
                d={CENTRAL_ASIA_PATHS.uzbekistanMain}
                fill="url(#uzbDeepGreen)"
                stroke="#25B446"
                strokeWidth="2.8"
                className="transition-all duration-300 hover:brightness-110"
              />
              <path
                d={CENTRAL_ASIA_PATHS.uzbekistanSub}
                fill="url(#uzbDeepGreen)"
                stroke="#25B446"
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

            {/* --- 6. HUDUDLAR BO'YICHA LOCATION PINLARI VA HOVER FOYDALANUVCHILAR POPUP'I --- */}
            {UZBEKISTAN_REGIONS.map((r) => {
              const isHovered = activeRegion?.id === r.id;
              return (
                <g
                  key={r.id}
                  onMouseEnter={() => setHoveredRegion(r)}
                  onClick={() => setHoveredRegion(r)}
                  className="cursor-pointer group"
                >
                  {/* Ping to'lqini */}
                  {isHovered && (
                    <circle cx={r.x} cy={r.y} r="16" fill="#35CA56" opacity="0.4" className="animate-ping" />
                  )}

                  {/* Tashqi halo */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isHovered ? '10' : '6.5'}
                    fill={isHovered ? '#35CA56' : '#22B343'}
                    opacity={isHovered ? '0.35' : '0.2'}
                    className="transition-all duration-200 group-hover:scale-150"
                  />

                  {/* Asosiy nuqta / Pin */}
                  <circle
                    cx={r.x}
                    cy={r.y}
                    r={isHovered ? '7' : '4.5'}
                    fill={isHovered ? '#35CA56' : '#22B343'}
                    stroke="#FFFFFF"
                    strokeWidth={isHovered ? '2' : '1.2'}
                    className="transition-all duration-200 group-hover:scale-125 shadow-sm"
                  />

                  {/* Pin tagidagi mitti yorliq */}
                  <rect
                    x={r.x - 30}
                    y={r.y - 20}
                    width="60"
                    height="14"
                    rx="7"
                    fill={isHovered ? '#0F2416' : '#142B1A'}
                    stroke={isHovered ? '#35CA56' : '#2B5735'}
                    strokeWidth="1"
                    className="transition-all duration-200"
                  />
                  <text
                    x={r.x}
                    y={r.y - 10}
                    textAnchor="middle"
                    fill={isHovered ? '#35CA56' : '#E8F5EB'}
                    fontSize="8.5"
                    fontWeight={isHovered ? '900' : '700'}
                    className="select-none pointer-events-none"
                  >
                    {r.name.split(' ')[0]}
                  </text>

                  {/* HOVER QILINGANDA TO'G'RIDAN-TO'G'RI XARITA USTIDA CHIQADIGAN FOYDALANUVCHILAR POPUP'I */}
                  {isHovered && (
                    <g
                      transform={`translate(${r.x > 500 ? r.x - 170 : r.x - 10}, ${r.y > 450 ? r.y - 85 : r.y - 75})`}
                      className="pointer-events-none transition-all duration-200"
                    >
                      <rect
                        width="170"
                        height="58"
                        rx="12"
                        fill="#0A160E"
                        stroke="#35CA56"
                        strokeWidth="1.2"
                        filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.5))"
                      />
                      <text x="12" y="18" fill="#FFFFFF" fontSize="11" fontWeight="800">
                        📍 {r.name}
                      </text>
                      <text x="158" y="17" textAnchor="end" fill="#8CE8A0" fontSize="8.5" fontWeight="700">
                        {r.badge}
                      </text>
                      <line x1="12" y1="24" x2="158" y2="24" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <text x="12" y="38" fill="#35CA56" fontSize="10" fontWeight="800">
                        👥 {r.farmersCount} faol fermer
                      </text>
                      <text x="12" y="50" fill="#D1DFD5" fontSize="9" fontWeight="600">
                        🏪 {r.storesCount}+ do‘kon • ⚡ {r.deliverySpeed}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Qo'shni davlatga hover qilinganda bildirishnoma */}
        {hoveredCountry && (
          <div className="mt-2 text-center text-xs font-bold text-charcoal/70 bg-cream p-1.5 rounded-xl border border-charcoal/10">
            🔒 {hoveredCountry} — 2-bosqichda Markaziy Osiyo bozoriga chiqish
          </div>
        )}
      </div>

      {/* 2. PASTIDA: 5 TA SEKTOR BO'YICHA BUTUN O'ZBEKISTON STATISTIKASI (B2B & B2C) */}
      <div className="rounded-3xl bg-cream-soft border border-charcoal/10 p-5 sm:p-6 shadow-xs">
        {/* Umumiy Respublika B2B & B2C Metrikalari */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-charcoal/10 pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-forest-dark">
              <ShieldCheck className="h-4 w-4 text-agroGreen-700" />
              Respublika Ekotizim Qamrovi
            </span>
            <h4 className="mt-1 text-lg sm:text-xl font-black text-charcoal">
              5 ta sektor bo‘yicha O‘zbekiston umumiy ko‘rsatkichlari
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-1.5 border border-charcoal/10 shadow-xs">
              <Store className="h-4 w-4 text-agroGreen-700" />
              <div>
                <p className="text-[10px] font-medium text-charcoal/50 leading-none">Jami B2B do‘konlar</p>
                <p className="text-sm sm:text-base font-black text-forest-dark mt-0.5">{UZBEKISTAN_SECTOR_SUMMARY.totalB2B}+</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-1.5 border border-charcoal/10 shadow-xs">
              <Users className="h-4 w-4 text-agroGreen-700" />
              <div>
                <p className="text-[10px] font-medium text-charcoal/50 leading-none">Jami B2C fermerlar</p>
                <p className="text-sm sm:text-base font-black text-forest-dark mt-0.5">{UZBEKISTAN_SECTOR_SUMMARY.totalB2C}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-1.5 border border-charcoal/10 shadow-xs">
              <MapPin className="h-4 w-4 text-agroGreen-700" />
              <div>
                <p className="text-[10px] font-medium text-charcoal/50 leading-none">Qamrov</p>
                <p className="text-sm sm:text-base font-black text-forest-dark mt-0.5">{UZBEKISTAN_SECTOR_SUMMARY.totalRegions} hudud</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white px-3.5 py-1.5 border border-charcoal/10 shadow-xs">
              <Zap className="h-4 w-4 text-agroGreen-700" />
              <div>
                <p className="text-[10px] font-medium text-charcoal/50 leading-none">Yetkazish</p>
                <p className="text-sm sm:text-base font-black text-forest-dark mt-0.5">{UZBEKISTAN_SECTOR_SUMMARY.deliveryAvg}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 Ta Sektor Bo'yicha B2B va B2C Bo'linishi */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {UZBEKISTAN_SECTOR_SUMMARY.sectors.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-2xl bg-white p-3.5 border border-charcoal/10 shadow-xs transition-colors duration-200 hover:border-agroGreen"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl">{s.emoji}</span>
                  <span className="rounded-md bg-cream px-2 py-0.5 text-[10px] font-bold text-charcoal/60 border border-charcoal/5">
                    {s.category}
                  </span>
                </div>

                <h5 className="mt-2 text-xs sm:text-sm font-extrabold text-charcoal">
                  {s.name}
                </h5>
                <p className="mt-0.5 text-[10px] text-charcoal/50 font-medium truncate">
                  {s.highlight}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-charcoal/10 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal/60 text-[11px] font-medium flex items-center gap-1">
                    <Store className="h-3 w-3 text-agroGreen-700" /> B2B do‘kon:
                  </span>
                  <span className="font-black text-forest-dark">{s.storesCount} ta</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal/60 text-[11px] font-medium flex items-center gap-1">
                    <Users className="h-3 w-3 text-agroGreen-700" /> B2C xaridor:
                  </span>
                  <span className="font-black text-forest-dark">{s.farmersCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
