export interface RegionInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  storesCount: number;
  sectorsCount: number;
  farmersCount: string;
  popularSector: string;
  deliverySpeed: string;
  badge: string;
}

export const UZBEKISTAN_REGIONS: RegionInfo[] = [
  {
    id: 'tashkent',
    name: 'Toshkent & Viloyat',
    x: 527,
    y: 428,
    storesCount: 124,
    sectorsCount: 5,
    farmersCount: '8 400+',
    popularSector: 'Agro-Vet & Texnika',
    deliverySpeed: '1-2 soat',
    badge: 'Markaziy hub',
  },
  {
    id: 'samarkand',
    name: 'Samarqand',
    x: 433,
    y: 451,
    storesCount: 98,
    sectorsCount: 5,
    farmersCount: '6 200+',
    popularSector: 'Urug‘chilik & O‘g‘itlar',
    deliverySpeed: '2-3 soat',
    badge: 'Urug‘chilik markazi',
  },
  {
    id: 'fergana',
    name: 'Farg‘ona vodiysi',
    x: 566,
    y: 440,
    storesCount: 142,
    sectorsCount: 5,
    farmersCount: '9 800+',
    popularSector: 'Issiqxona & Ozuqa',
    deliverySpeed: '1-2 soat',
    badge: 'Eng yuqori talab',
  },
  {
    id: 'bukhara',
    name: 'Buxoro & Navoiy',
    x: 372,
    y: 422,
    storesCount: 64,
    sectorsCount: 5,
    farmersCount: '4 100+',
    popularSector: 'Chorva yemi & Vet',
    deliverySpeed: '2-4 soat',
    badge: 'Chorvachilik',
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo & Surxondaryo',
    x: 458,
    y: 507,
    storesCount: 86,
    sectorsCount: 5,
    farmersCount: '5 500+',
    popularSector: 'G‘alla & Omuxta yem',
    deliverySpeed: '2-4 soat',
    badge: 'Agrar zaxira',
  },
  {
    id: 'khorezm',
    name: 'Xorazm & Qoraqalpog‘iston',
    x: 274,
    y: 366,
    storesCount: 52,
    sectorsCount: 5,
    farmersCount: '3 200+',
    popularSector: 'Sug‘orish & Urug‘',
    deliverySpeed: '3-5 soat',
    badge: 'Rivojlanayotgan',
  },
  {
    id: 'jizzakh',
    name: 'Jizzax & Sirdaryo',
    x: 483,
    y: 452,
    storesCount: 48,
    sectorsCount: 5,
    farmersCount: '3 600+',
    popularSector: 'Paxta & Don yemi',
    deliverySpeed: '2-3 soat',
    badge: 'Don klasteri',
  },
];

export const CENTRAL_ASIA_COUNTRIES = [
  {
    name: 'O‘zbekiston',
    flag: '🇺🇿',
    status: 'active' as const,
    statusText: 'Hozirda faol (14 viloyat)',
  },
  {
    name: 'Qozog‘iston',
    flag: '🇰🇿',
    status: 'locked' as const,
    statusText: '2027 Rejada',
  },
  {
    name: 'Qirg‘iziston',
    flag: '🇰🇬',
    status: 'locked' as const,
    statusText: '2027 Rejada',
  },
  {
    name: 'Tojikiston',
    flag: '🇹🇯',
    status: 'locked' as const,
    statusText: '2027 Rejada',
  },
  {
    name: 'Turkmaniston',
    flag: '🇹🇲',
    status: 'locked' as const,
    statusText: '2028 Rejada',
  },
];

export interface SectorStat {
  id: string;
  name: string;
  category: string;
  emoji: string;
  storesCount: number;
  farmersCount: string;
  highlight: string;
}

export const UZBEKISTAN_SECTOR_SUMMARY = {
  totalB2B: 618,
  totalB2C: '40 800+',
  totalRegions: 14,
  deliveryAvg: '1-3 soat',
  sectors: [
    {
      id: 'agro_vet',
      name: 'O‘g‘itlar va Vet-Dorilar',
      category: 'Agro-Vet',
      emoji: '🌿',
      storesCount: 185,
      farmersCount: '14 200+',
      highlight: 'Biostimulyator & NPK',
    },
    {
      id: 'feed',
      name: 'Yem va Ozuqalar',
      category: 'Feed',
      emoji: '🌾',
      storesCount: 142,
      farmersCount: '11 500+',
      highlight: 'Qoplab va kg-lab',
    },
    {
      id: 'warehouse',
      name: 'Ombor va Qadoqlash',
      category: 'Warehouse',
      emoji: '🏢',
      storesCount: 88,
      farmersCount: '5 400+',
      highlight: 'Issiqxona & sug‘orish',
    },
    {
      id: 'seeds',
      name: 'Urug‘lar va Ko‘chatlar',
      category: 'Seeds',
      emoji: '🌱',
      storesCount: 125,
      farmersCount: '6 800+',
      highlight: '98% unuvchanlik navi',
    },
    {
      id: 'machinery',
      name: 'Jihozlar va Texnika',
      category: 'Machinery',
      emoji: '🔧',
      storesCount: 78,
      farmersCount: '2 900+',
      highlight: 'Motoblok & purkagich',
    },
  ] as SectorStat[],
};

