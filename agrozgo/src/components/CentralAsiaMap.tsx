import React, { useState } from 'react';
import { Store, Users, MapPin, Layers } from 'lucide-react';
import { UZBEKISTAN_REGIONS, type RegionInfo } from '../data/regions';
import { CENTRAL_ASIA_PATHS } from '../data/centralAsiaPaths';

export const CentralAsiaMap: React.FC = () => {
  const [activeRegion, setActiveRegion] = useState<RegionInfo>(UZBEKISTAN_REGIONS[0]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // 4 Asosiy Metrika Badges (Namunadagi kabi +14 | VILOYATLAR formatida)
  const STAT_BADGES = [
    {
      num: '+14',
      label: 'VILOYATLAR',
      desc: 'O‘zbekiston bo‘ylab to‘liq qamrov',
      icon: MapPin,
    },
    {
      num: '+1,200',
      label: 'AGRO-DO‘KONLAR',
      desc: 'B2B hamkorlar va omborlar',
      icon: Store,
    },
    {
      num: '+15,000',
      label: 'FERMERLAR',
      desc: 'Faol B2C foydalanuvchilar',
      icon: Users,
    },
    {
      num: '5',
      label: 'AGRO-SEKTORLAR',
      desc: 'Agro-Vet, Yem, Ombor, Urug‘, Texnika',
      icon: Layers,
    },
  ];

  // Tooltip kartasining dinamik koordinatasi (Faol hudud ustiga silliq bog'lanadi)
  const cardX = Math.min(Math.max(activeRegion.x - 110, 300), 580);
  const cardY = Math.max(activeRegion.y - 120, 240);

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[#F9F8F3] border border-charcoal/10 p-5 sm:p-8 lg:p-10 shadow-xs">
      {/* 1. YUQORI SARLAVHA VA STATUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-charcoal/10">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-agroGreen/15 border border-agroGreen/30 px-3 py-1 text-xs font-black text-agroGreen-800">
            <span className="h-2 w-2 rounded-full bg-agroGreen animate-pulse" />
            Mintaqaviy Qamrov Xaritasi
          </span>
          <h3 className="mt-3 text-2xl sm:text-3xl font-black text-charcoal tracking-tight">
            O‘zbekiston va O‘rta Osiyo Qamrovi
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-charcoal/65 max-w-xl leading-relaxed">
            Hozirda O‘zbekistonning barcha viloyatlarida to‘liq faoliyat. 2027–2028 yillarda O‘rta Osiyo davlatlariga bosqichma-bosqich kengayish.
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-charcoal border border-charcoal/10 shadow-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-agroGreen" />
            <span>O‘zbekiston</span>
            <span className="text-[10px] text-agroGreen-800 font-extrabold bg-agroGreen-50 px-1.5 py-0.5 rounded">Faol Hub</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-charcoal/50 border border-charcoal/10">
            <span className="h-2 w-2 rounded-full bg-charcoal/30" />
            <span>Qo‘shni Davlatlar</span>
            <span className="text-[10px] text-charcoal/40 font-medium">2027–2028 Reja</span>
          </span>
        </div>
      </div>

      {/* 2. MINIMALIST DOT-MATRIX CENTRAL ASIA MAP */}
      <div className="relative mt-6 w-full aspect-[917.5/540] select-none rounded-2xl bg-[#F6F4EB]/70 border border-charcoal/5 overflow-hidden">
        <svg
          viewBox="0 0 917.5 593.94"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Qo'shni davlatlar uchun yengil dot-matrix naqshi */}
            <pattern id="dotGridMuted" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.1" fill="#C8C3B4" opacity="0.65" />
            </pattern>

            {/* O'zbekiston uchun zumrad dot-matrix naqshi */}
            <pattern id="dotGridGreen" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.3" fill="#35CA56" opacity="0.55" />
            </pattern>

            {/* O'zbekiston konturi nuri */}
            <filter id="uzbDropGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#35CA56" floodOpacity="0.25" />
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#162117" floodOpacity="0.1" />
            </filter>

            {/* Floating Tooltip soyasi */}
            <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#1A2218" floodOpacity="0.12" />
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1A2218" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* --- QO'SHNI DAVLATLAR SILUETI VA DOT-MATRIX QATLAMI --- */}
          {/* 1. Qozog'iston (Shimol) */}
          <g
            onMouseEnter={() => setHoveredCountry('Qozog‘iston (2027 Reja)')}
            onMouseLeave={() => setHoveredCountry(null)}
            className="transition-opacity duration-300 opacity-60 hover:opacity-90 cursor-default"
          >
            <path
              d={CENTRAL_ASIA_PATHS.kazakhstan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.kazakhstan} fill="url(#dotGridMuted)" />
            {/* Qozog'iston minimalist badge */}
            <g transform="translate(415, 145)">
              <rect width="112" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="56" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇰🇿 Qozog‘iston • 2027
              </text>
            </g>
          </g>

          {/* 2. Turkmaniston (Janub-g'arb) */}
          <g
            onMouseEnter={() => setHoveredCountry('Turkmaniston (2028 Reja)')}
            onMouseLeave={() => setHoveredCountry(null)}
            className="transition-opacity duration-300 opacity-60 hover:opacity-90 cursor-default"
          >
            <path
              d={CENTRAL_ASIA_PATHS.turkmenistan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.turkmenistan} fill="url(#dotGridMuted)" />
            {/* Turkmaniston minimalist badge */}
            <g transform="translate(230, 420)">
              <rect width="126" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="63" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇹🇲 Turkmaniston • 2028
              </text>
            </g>
          </g>

          {/* 3. Qirg'iziston (Sharq) */}
          <g
            onMouseEnter={() => setHoveredCountry('Qirg‘iziston (2027 Reja)')}
            onMouseLeave={() => setHoveredCountry(null)}
            className="transition-opacity duration-300 opacity-60 hover:opacity-90 cursor-default"
          >
            <path
              d={CENTRAL_ASIA_PATHS.kyrgyzstan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.kyrgyzstan} fill="url(#dotGridMuted)" />
            {/* Qirg'iziston minimalist badge */}
            <g transform="translate(670, 345)">
              <rect width="120" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="60" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇰🇬 Qirg‘iziston • 2027
              </text>
            </g>
          </g>

          {/* 4. Tojikiston (Janub-sharq) */}
          <g
            onMouseEnter={() => setHoveredCountry('Tojikiston (2027 Reja)')}
            onMouseLeave={() => setHoveredCountry(null)}
            className="transition-opacity duration-300 opacity-60 hover:opacity-90 cursor-default"
          >
            <path
              d={CENTRAL_ASIA_PATHS.tajikistan}
              fill="#ECE8DE"
              stroke="#D3CEBE"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
            <path d={CENTRAL_ASIA_PATHS.tajikistan} fill="url(#dotGridMuted)" />
            {/* Tojikiston minimalist badge */}
            <g transform="translate(565, 455)">
              <rect width="112" height="22" rx="11" fill="#FFFFFF" stroke="#D1CCC0" strokeWidth="1" />
              <text x="56" y="15" textAnchor="middle" fill="#6B6658" fontSize="9.5" fontWeight="700">
                🇹🇯 Tojikiston • 2027
              </text>
            </g>
          </g>

          {/* --- 5. O‘ZBEKISTON (MARKAZIY YORQIN AGRO-GREEN/GOLD SHAPED HUB) --- */}
          <g className="filter-uzb">
            {/* Toza oq fon va yashil kontur */}
            <path
              d={CENTRAL_ASIA_PATHS.uzbekistan}
              fill="#FFFFFF"
              stroke="#22B343"
              strokeWidth="2.2"
              filter="url(#uzbDropGlow)"
            />
            {/* Yashil dot-matrix to'ldiruvchi naqsh */}
            <path
              d={CENTRAL_ASIA_PATHS.uzbekistan}
              fill="url(#dotGridGreen)"
              opacity="0.75"
            />
          </g>

          {/* O'ZBEKISTON HUDUDLARI NISHONLARI (Clickable / Hoverable Pins) */}
          {UZBEKISTAN_REGIONS.map((r) => {
            const isSelected = activeRegion.id === r.id;
            return (
              <g
                key={r.id}
                transform={`translate(${r.x}, ${r.y})`}
                onClick={() => setActiveRegion(r)}
                onMouseEnter={() => setActiveRegion(r)}
                className="cursor-pointer group"
              >
                {/* Tanlangan hudud uchun pulsatsiyalanuvchi doira */}
                {isSelected && (
                  <circle
                    r="14"
                    fill="#35CA56"
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}
                {/* Tashqi oq hoshiya doirasi */}
                <circle
                  r={isSelected ? '7' : '5'}
                  fill={isSelected ? '#35CA56' : '#FFFFFF'}
                  stroke={isSelected ? '#FFFFFF' : '#35CA56'}
                  strokeWidth="2"
                  className="transition-all duration-200"
                />
                {/* Oltin markaziy nuqta */}
                <circle
                  r={isSelected ? '3' : '2'}
                  fill="#E2B23B"
                />
              </g>
            );
          })}

          {/* --- 6. FLOATING TOOLTIP CARD (Referensdagi "BRAZIL - Rio De Janeiro" kartochkasi kabi) --- */}
          <g transform={`translate(${cardX}, ${cardY})`} className="transition-all duration-300">
            {/* Pointer chizig'i (kartochkadan hudud piniga yo'naltirilgan) */}
            <line
              x1="110"
              y1="96"
              x2={activeRegion.x - cardX}
              y2={activeRegion.y - cardY}
              stroke="#35CA56"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              opacity="0.75"
            />

            {/* Oq karta konteyneri */}
            <rect
              width="226"
              height="96"
              rx="18"
              fill="#FFFFFF"
              stroke="#22B343"
              strokeWidth="1.2"
              filter="url(#cardShadow)"
            />

            {/* Karta yuqorisi: Yashil glowing pin + UZBEKISTAN + Faol Hub pill */}
            <circle cx="22" cy="24" r="5" fill="#35CA56" />
            <circle cx="22" cy="24" r="9" fill="#35CA56" opacity="0.2" />

            <text x="35" y="27" fill="#1A2218" fontSize="10.5" fontWeight="900" letterSpacing="1">
              UZBEKISTAN
            </text>

            <rect x="148" y="15" width="64" height="18" rx="9" fill="#E8F8EC" />
            <text x="180" y="27" textAnchor="middle" fill="#1C7E34" fontSize="8.5" fontWeight="800">
              ● Faol Hub
            </text>

            {/* Hudud nomi (masalan: Toshkent & Viloyat) */}
            <text x="18" y="49" fill="#1A2218" fontSize="13" fontWeight="900">
              {activeRegion.name}
            </text>

            <line x1="18" y1="58" x2="208" y2="58" stroke="#F0EFEA" strokeWidth="1" />

            {/* Do'konlar va Fermerlar soni (Referensdagi metrikalar kabi) */}
            <text x="18" y="74" fill="#6B7268" fontSize="9.5" fontWeight="600">
              Agro-Do‘konlar: <tspan fill="#1A2218" fontWeight="800">{activeRegion.storesCount}+</tspan>
            </text>
            <text x="18" y="87" fill="#6B7268" fontSize="9.5" fontWeight="600">
              Faol Fermerlar: <tspan fill="#1C7E34" fontWeight="800">{activeRegion.farmersCount}</tspan>
            </text>

            {/* Xarid & Yetkazish statusi: Kichik = Bron qilish, Yirik = Sektor logistikasi */}
            <rect x="130" y="66" width="86" height="20" rx="10" fill="#FAF8F0" stroke="#E2B23B" strokeWidth="0.8" />
            <text x="173" y="80" textAnchor="middle" fill="#996E0A" fontSize="8.5" fontWeight="800">
              Bron & Sektor
            </text>
          </g>
        </svg>

        {/* Mobil uchun pastki xarita usti faol hudud indikatori */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 overflow-x-auto py-1 px-3 rounded-xl bg-white/90 backdrop-blur-md border border-charcoal/10 text-[11px] sm:hidden">
          <span className="font-extrabold text-charcoal/60 shrink-0">Tanlangan:</span>
          <span className="font-black text-forest-dark">{activeRegion.name.split(' ')[0]} ({activeRegion.storesCount} do‘kon)</span>
        </div>
      </div>

      {/* 14 ta Hududni tezkor tanlash paneli (Desktop & Mobil) */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-white border border-charcoal/10 shadow-xs">
        <span className="text-xs font-black text-charcoal/70 mr-1 flex items-center gap-1 shrink-0">
          <MapPin className="h-3.5 w-3.5 text-agroGreen-700" /> Hududni tanlang:
        </span>
        <div className="flex flex-wrap gap-1">
          {UZBEKISTAN_REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRegion(r)}
              className={`px-2.5 py-1 rounded-full font-bold transition text-xs cursor-pointer ${
                activeRegion.id === r.id
                  ? 'bg-forest-dark text-white shadow-xs'
                  : 'bg-cream-soft text-charcoal/70 hover:bg-agroGreen-50 hover:text-agroGreen-900 border border-charcoal/5'
              }`}
            >
              {r.name.split(' ')[0]} <span className="opacity-60 text-[10px]">({r.storesCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2.5. MINTAQAVIY DINAMIKA PROGRESS KO'RSATKICHLARI (Referens dizayn namunasi kabi) */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* O'zbekiston to'liq qamrovi */}
        <div className="rounded-2xl bg-white p-4 border border-charcoal/10 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-charcoal flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-agroGreen" />
              O‘zbekiston (14/14 Viloyat)
            </span>
            <span className="font-black text-agroGreen-800 bg-agroGreen-50 px-2 py-0.5 rounded-md">
              100% Qamrov
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-cream-soft">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-agroGreen-400 to-agroGreen" />
          </div>
          <p className="mt-2 text-[11px] text-charcoal/60 font-medium">
            Respublika bo‘ylab barcha tuman va qishloqlarda to‘liq faoliyat.
          </p>
        </div>

        {/* O'rta Osiyo ekspansiyasi */}
        <div className="rounded-2xl bg-white p-4 border border-charcoal/10 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-charcoal flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber" />
              O‘rta Osiyo Ekspansiyasi (KZ, KG, TJ, TM)
            </span>
            <span className="font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
              2027–2028 Reja
            </span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-cream-soft">
            <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-amber-400 to-amber" />
          </div>
          <p className="mt-2 text-[11px] text-charcoal/60 font-medium">
            Qozog‘iston, Qirg‘iziston, Tojikiston va Turkmaniston bozorlariga kengayish.
          </p>
        </div>
      </div>

      {/* 3. BOTTOM METRICS ROW (4 Stat Badges as shown in reference) */}
      <div className="mt-8 pt-6 border-t border-charcoal/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_BADGES.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.label}
              className="group flex flex-col justify-between rounded-2xl bg-white p-5 border border-charcoal/10 shadow-xs transition-all duration-200 hover:border-agroGreen hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-charcoal tracking-tight">
                    {b.num}
                  </span>
                  <span className="text-sm font-bold text-charcoal/30">|</span>
                  <span className="text-xs font-black uppercase tracking-wider text-charcoal">
                    {b.label}
                  </span>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-agroGreen-50 text-agroGreen-800 border border-agroGreen/20 transition group-hover:bg-agroGreen group-hover:text-forest-dark">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xs text-charcoal/65 font-medium leading-relaxed">
                {b.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

