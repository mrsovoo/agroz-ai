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

