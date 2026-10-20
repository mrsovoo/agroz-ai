import React from 'react';
import { Store, Users, MapPin, TrendingUp } from 'lucide-react';
import { CENTRAL_ASIA_PATHS } from '../data/centralAsiaPaths';

/**
 * Minimalist Mintaqaviy Qamrov Xaritasi:
 * - Sarlavha: O‘zbekiston va O‘rta Osiyo Qamrovi
 * - SVG Xarita: O'rta Osiyo silueti, O'zbekiston markazda (uzb ustida ortiqcha location pinsiz)
 * - Pastki 4 ta metrika: B2B soni, B2C soni, Savdo aylanmasi (Daromad), Viloyatlar soni
 */
export const CentralAsiaMap: React.FC = () => {
  const STAT_METRICS = [
    {
      num: '+1,200',
      label: 'B2B DO‘KONLAR',
      desc: 'Kassa va ombor hisobi ulangan',
      icon: Store,
      accent: 'text-forest-dark',
    },
    {
      num: '+45,000',
      label: 'B2C FERMERLAR',
      desc: 'Faol xaridor va chorvadorlar',
      icon: Users,
      accent: 'text-agroGreen-800',
    },
    {
      num: '18.5 mlrd',
      label: 'SAVDO AYLANMASI',
      desc: 'Oylik shaffof agro-savdo',
      icon: TrendingUp,
      accent: 'text-amber-800',
    },
    {
      num: '14 / 14',
      label: 'VILOYATLAR',
      desc: 'Respublika bo‘ylab 100% qamrov',
      icon: MapPin,
      accent: 'text-agroGreen',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[#F9F8F3] border border-charcoal/10 p-6 sm:p-8 lg:p-10 shadow-xs">
      {/* 1. MINIMAL YUQORI SARLAVHA */}
      <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
        <h3 className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
          O‘zbekiston va O‘rta Osiyo Qamrovi
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-charcoal/65">
          O‘zbekiston bo‘ylab to‘liq faoliyat va 2027–2028 yillarda O‘rta Osiyo bozorlariga kengayish
        </p>
      </div>

      {/* 2. MINIMALIST SVG CENTRAL ASIA MAP (O'zbekiston ustida ortiqcha locationlarsiz) */}
      <div className="relative w-full aspect-[917.5/500] select-none rounded-2xl bg-[#F6F4EB]/80 border border-charcoal/5 overflow-hidden">
        <svg
          viewBox="0 0 917.5 593.94"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Qo'shni davlatlar uchun yengil dot-matrix */}
            <pattern id="dotGridMuted" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill="#C8C3B4" opacity="0.6" />
            </pattern>

            {/* O'zbekiston uchun yashil dot-matrix */}
            <pattern id="dotGridGreen" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.3" fill="#35CA56" opacity="0.55" />
            </pattern>

            {/* O'zbekiston konturi nuri */}
            <filter id="uzbDropGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#35CA56" floodOpacity="0.25" />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#162117" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* --- QO'SHNI DAVLATLAR SILUETLARI --- */}
          {/* 1. Qozog'iston (Shimol) */}
          <g className="opacity-60">
            <path
              d={CENTRAL_ASIA_PATHS.kazakhstan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.kazakhstan} fill="url(#dotGridMuted)" />
            <g transform="translate(415, 145)">
              <rect width="112" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="56" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇰🇿 Qozog‘iston • 2027
              </text>
            </g>
          </g>

          {/* 2. Turkmaniston (Janub-g'arb) */}
          <g className="opacity-60">
            <path
              d={CENTRAL_ASIA_PATHS.turkmenistan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.turkmenistan} fill="url(#dotGridMuted)" />
            <g transform="translate(230, 420)">
              <rect width="126" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="63" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇹🇲 Turkmaniston • 2028
              </text>
            </g>
          </g>

          {/* 3. Qirg'iziston (Sharq) */}
          <g className="opacity-60">
            <path
              d={CENTRAL_ASIA_PATHS.kyrgyzstan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.kyrgyzstan} fill="url(#dotGridMuted)" />
            <g transform="translate(670, 345)">
              <rect width="120" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="60" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇰🇬 Qirg‘iziston • 2027
              </text>
            </g>
          </g>

          {/* 4. Tojikiston (Janub-sharq) */}
          <g className="opacity-60">
            <path
              d={CENTRAL_ASIA_PATHS.tajikistan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.tajikistan} fill="url(#dotGridMuted)" />
            <g transform="translate(565, 455)">
              <rect width="112" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="56" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇹🇯 Tojikiston • 2027
              </text>
            </g>
          </g>

          {/* --- 5. O‘ZBEKISTON SILUETI (Markazda yorqin zumrad rangda, ustida ortiqcha locationlarsiz) --- */}
          <g>
            {/* O'zbekiston yorqin foni va yashil konturi */}
            <path
              d={CENTRAL_ASIA_PATHS.uzbekistan}
              fill="#FFFFFF"
              stroke="#22B343"
              strokeWidth="2.2"
              filter="url(#uzbDropGlow)"
            />
            {/* Yashil dot-matrix naqshi */}
            <path
              d={CENTRAL_ASIA_PATHS.uzbekistan}
              fill="url(#dotGridGreen)"
              opacity="0.75"
            />

            {/* O'zbekiston markazidagi toza, ixcham brend badge */}
            <g transform="translate(420, 340)">
              <rect
                width="168"
                height="34"
                rx="17"
                fill="#FFFFFF"
                stroke="#22B343"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))"
              />
              <circle cx="20" cy="17" r="5" fill="#35CA56" />
              <circle cx="20" cy="17" r="9" fill="#35CA56" opacity="0.25" />
              <text x="36" y="21" fill="#1A2218" fontSize="11" fontWeight="900" letterSpacing="0.5">
                O‘ZBEKISTON
              </text>
              <rect x="114" y="9" width="46" height="16" rx="8" fill="#E8F8EC" />
              <text x="137" y="20" textAnchor="middle" fill="#1C7E34" fontSize="8" fontWeight="800">
                FAOL HUB
              </text>
            </g>
          </g>
        </svg>

        {/* Legend ko'rsatkichi (Burchakda toza va yengil) */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 text-xs font-bold bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-charcoal/10 shadow-xs">
          <span className="flex items-center gap-1.5 text-forest-dark text-[11px]">
            <span className="h-2 w-2 rounded-full bg-agroGreen" />
            <span>O‘zbekiston (Faol Hub)</span>
          </span>
          <span className="text-charcoal/20">|</span>
          <span className="flex items-center gap-1.5 text-charcoal/50 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-charcoal/30" />
            <span>O‘rta Osiyo (2027–2028 Reja)</span>
          </span>
        </div>
      </div>

      {/* 3. PASTKI 4 TA ASOSIY METRIKA: B2B, B2C, DAROMAD VA VILOYATLAR */}
      <div className="mt-8 pt-6 border-t border-charcoal/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_METRICS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="group flex flex-col justify-between rounded-2xl bg-white p-5 border border-charcoal/10 shadow-xs transition-all duration-200 hover:border-agroGreen hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
                    {item.num}
                  </div>
                  <div className="mt-1 text-[11px] font-black uppercase tracking-wider text-charcoal/70">
                    {item.label}
                  </div>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-agroGreen-50 text-agroGreen-800 border border-agroGreen/20 transition group-hover:bg-agroGreen group-hover:text-forest-dark shrink-0">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-xs text-charcoal/65 font-medium leading-relaxed border-t border-charcoal/5 pt-2.5">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
