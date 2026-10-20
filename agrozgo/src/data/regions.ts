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

/** O'zbekistonning barcha 14 ta hududi bo'yicha real geolokatsiya va B2B/B2C ko'rsatkichlari */
export const UZBEKISTAN_REGIONS: RegionInfo[] = [
  {
    id: 'tashkent',
    name: 'Toshkent shahri va viloyati',
    x: 527,
    y: 428,
    storesCount: 184,
    sectorsCount: 5,
    farmersCount: '8 400+',
    popularSector: 'Agro-Vet & Texnika',
    deliverySpeed: '1-2 soat',
    badge: 'Markaziy Hub',
  },
  {
    id: 'samarkand',
    name: 'Samarqand viloyati',
    x: 433,
    y: 451,
    storesCount: 128,
    sectorsCount: 5,
    farmersCount: '6 500+',
    popularSector: 'Urug‘chilik & Bog‘dorchilik',
    deliverySpeed: '1-3 soat',
    badge: 'Urug‘chilik klasteri',
  },
  {
    id: 'fergana',
    name: 'Farg‘ona viloyati',
    x: 575,
    y: 440,
    storesCount: 142,
    sectorsCount: 5,
    farmersCount: '7 200+',
    popularSector: 'Issiqxona & Ozuqa',
    deliverySpeed: '1-2 soat',
    badge: 'Yetakchi talab',
  },
  {
    id: 'andijan',
    name: 'Andijon viloyati',
    x: 605,
    y: 436,
    storesCount: 115,
    sectorsCount: 5,
    farmersCount: '5 800+',
    popularSector: 'Ko‘chatchilik & Vet-dorilar',
    deliverySpeed: '1-2 soat',
    badge: 'Intensiv bog‘dorchilik',
  },
  {
    id: 'namangan',
    name: 'Namangan viloyati',
    x: 565,
    y: 418,
    storesCount: 104,
    sectorsCount: 5,
    farmersCount: '4 900+',
    popularSector: 'Mineral o‘g‘itlar & Urug‘',
    deliverySpeed: '1-3 soat',
    badge: 'Sabzavotchilik',
  },
  {
    id: 'bukhara',
    name: 'Buxoro viloyati',
    x: 372,
    y: 422,
    storesCount: 84,
    sectorsCount: 5,
    farmersCount: '3 800+',
    popularSector: 'Chorva ozuqasi & Vet',
    deliverySpeed: '2-3 soat',
    badge: 'Qorako‘lchilik & Chorva',
  },
  {
    id: 'kashkadarya',
    name: 'Qashqadaryo viloyati',
    x: 448,
    y: 485,
    storesCount: 96,
    sectorsCount: 5,
    farmersCount: '4 200+',
    popularSector: 'G‘alla & Omuxta yem',
    deliverySpeed: '2-4 soat',
    badge: 'G‘allachilik zaxirasi',
  },
  {
    id: 'surkhandarya',
    name: 'Surxondaryo viloyati',
    x: 475,
    y: 530,
    storesCount: 76,
    sectorsCount: 5,
    farmersCount: '3 400+',
    popularSector: 'Erta bahorgi sabzavot',
    deliverySpeed: '2-4 soat',
    badge: 'Subtropik hudud',
  },
  {
    id: 'khorezm',
    name: 'Xorazm viloyati',
    x: 274,
    y: 366,
    storesCount: 68,
    sectorsCount: 5,
    farmersCount: '3 100+',
    popularSector: 'Sholichilik & Sug‘orish',
    deliverySpeed: '2-4 soat',
    badge: 'Agro-melioratsiya',
  },
  {
    id: 'karakalpakstan',
    name: 'Qoraqalpog‘iston Resp.',
    x: 235,
    y: 325,
    storesCount: 52,
    sectorsCount: 5,
    farmersCount: '2 600+',
    popularSector: 'Chorva yemi & Sug‘orish',
    deliverySpeed: '3-5 soat',
    badge: 'Sho‘rga chidamli ekinlar',
  },
  {
    id: 'navoiy',
    name: 'Navoiy viloyati',
    x: 405,
    y: 400,
    storesCount: 48,
    sectorsCount: 5,
    farmersCount: '2 100+',
    popularSector: 'Karbamid & Yaylov yemi',
    deliverySpeed: '2-4 soat',
    badge: 'Kimyo & Yaylov',
  },
  {
    id: 'jizzakh',
    name: 'Jizzax viloyati',
    x: 483,
    y: 452,
    storesCount: 62,
    sectorsCount: 5,
    farmersCount: '2 800+',
    popularSector: 'Lalmikor bug‘doy & Ozuqa',
    deliverySpeed: '1-3 soat',
    badge: 'Lalmi dehqonchilik',
  },
  {
    id: 'syrdarya',
    name: 'Sirdaryo viloyati',
    x: 512,
    y: 442,
    storesCount: 54,
    sectorsCount: 5,
    farmersCount: '2 400+',
    popularSector: 'Baliqchilik & Don yemi',
    deliverySpeed: '1-2 soat',
    badge: 'Baliqchilik klasteri',
  },
  {
    id: 'agro_hub',
    name: 'Toshkent Viloyati Agro-Baza',
    x: 545,
    y: 420,
    storesCount: 40,
    sectorsCount: 5,
    farmersCount: '1 900+',
    popularSector: 'Texnika & Ulgurji Ombor',
    deliverySpeed: '1-2 soat',
    badge: 'Ulgurji Logistika Hubi',
  },
];

export const CENTRAL_ASIA_COUNTRIES = [
  {
    name: 'O‘zbekiston',
    flag: '🇺🇿',
    status: 'active' as const,
    statusText: 'Hozirda faol (14 hudud)',
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
  totalB2B: 1213,
  totalB2C: '57 200+',
  totalRegions: 14,
  deliveryAvg: '1-3 soat',
  sectors: [
    {
      id: 'agro_vet',
      name: 'O‘g‘itlar va Vet-Dorilar',
      category: 'Agro-Vet',
      storesCount: 365,
      farmersCount: '19 400+',
      highlight: 'Biostimulyator & NPK o‘g‘itlar',
    },
    {
      id: 'feed',
      name: 'Yem va Ozuqalar',
      category: 'Feed',
      storesCount: 295,
      farmersCount: '15 800+',
      highlight: 'Qoplab va kg-lab tortib berish',
    },
    {
      id: 'warehouse',
      name: 'Ombor va Sug‘orish',
      category: 'Warehouse',
      storesCount: 185,
      farmersCount: '8 600+',
      highlight: 'Issiqxona plyonkasi & Tomchilatish',
    },
    {
      id: 'seeds',
      name: 'Urug‘lar va Ko‘chatlar',
      category: 'Seeds',
      storesCount: 225,
      farmersCount: '9 200+',
      highlight: '98% unuvchanlik elita navlari',
    },
    {
      id: 'machinery',
      name: 'Jihozlar va Texnika',
      category: 'Machinery',
      storesCount: 143,
      farmersCount: '4 200+',
      highlight: 'Motoblok, purkagich & kafolat',
    },
  ] as SectorStat[],
};
