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
    storesCount: 120,
    sectorsCount: 5,
    farmersCount: '8 000+',
    popularSector: 'Agro-Vet & Texnika',
    deliverySpeed: '1-2 soat',
    badge: 'Markaziy hub',
  },
  {
    id: 'samarkand',
    name: 'Samarqand',
    x: 433,
    y: 451,
    storesCount: 100,
    sectorsCount: 5,
    farmersCount: '6 000+',
    popularSector: 'Urug‘chilik & O‘g‘itlar',
    deliverySpeed: '2-3 soat',
    badge: 'Urug‘chilik',
  },
  {
    id: 'fergana',
    name: 'Farg‘ona vodiysi',
    x: 566,
    y: 440,
    storesCount: 140,
    sectorsCount: 5,
    farmersCount: '10 000+',
    popularSector: 'Issiqxona & Ozuqa',
    deliverySpeed: '1-2 soat',
    badge: 'Yetakchi talab',
  },
  {
    id: 'bukhara',
    name: 'Buxoro & Navoiy',
    x: 372,
    y: 422,
    storesCount: 60,
    sectorsCount: 5,
    farmersCount: '4 000+',
    popularSector: 'Chorva yemi & Vet',
    deliverySpeed: '2-4 soat',
    badge: 'Chorvachilik',
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo & Surxondaryo',
    x: 458,
    y: 507,
    storesCount: 80,
    sectorsCount: 5,
    farmersCount: '5 000+',
    popularSector: 'G‘alla & Omuxta yem',
    deliverySpeed: '2-4 soat',
    badge: 'Agrar zaxira',
  },
  {
    id: 'khorezm',
    name: 'Xorazm & Qoraqalpog‘iston',
    x: 274,
    y: 366,
    storesCount: 50,
    sectorsCount: 5,
    farmersCount: '3 000+',
    popularSector: 'Sug‘orish & Urug‘',
    deliverySpeed: '3-5 soat',
    badge: 'Ekin maydoni',
  },
  {
    id: 'jizzakh',
    name: 'Jizzax & Sirdaryo',
    x: 483,
    y: 452,
    storesCount: 50,
    sectorsCount: 5,
    farmersCount: '3 500+',
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
  emoji?: string;
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
      storesCount: 185,
      farmersCount: '14 200+',
      highlight: 'Biostimulyator & NPK',
    },
    {
      id: 'feed',
      name: 'Yem va Ozuqalar',
      category: 'Feed',
      storesCount: 142,
      farmersCount: '11 500+',
      highlight: 'Qoplab va kg-lab',
    },
    {
      id: 'warehouse',
      name: 'Ombor va Qadoqlash',
      category: 'Warehouse',
      storesCount: 88,
      farmersCount: '5 400+',
      highlight: 'Issiqxona & sug‘orish',
    },
    {
      id: 'seeds',
      name: 'Urug‘lar va Ko‘chatlar',
      category: 'Seeds',
      storesCount: 125,
      farmersCount: '6 800+',
      highlight: '98% unuvchanlik navi',
    },
    {
      id: 'machinery',
      name: 'Jihozlar va Texnika',
      category: 'Machinery',
      storesCount: 78,
      farmersCount: '2 900+',
      highlight: 'Motoblok & purkagich',
    },
  ] as SectorStat[],
};

