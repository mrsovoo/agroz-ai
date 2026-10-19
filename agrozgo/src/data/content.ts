/**
 * AgrozGO statik kontent (Standalone rejim — backend API'ga ulanmaydi).
 */
import type { LucideIcon } from 'lucide-react';
import { Leaf, Wheat, Warehouse, Sprout, Wrench } from 'lucide-react';

export const BIZNESGO_URL = 'https://biznesgo.uz';

/** Rasmlar `public/images/` ichida. Fayl topilmasa komponentlar gradient fallback ko'rsatadi. */
export const IMAGES = {
  aerial: '/images/aerial-fields.jpg',
  drone: '/images/agro-drone.jpg',
  controller: '/images/smart-controller.jpg',
  spraying: '/images/drone-spraying.jpg',
  hero: '/images/aerial-fields.jpg', // Use aerial as default hero
  heroWheat: '/images/hero-wheat.jpg',
  farmer: '/images/farmer.jpg',
  tractor: '/images/tractor.jpg',
  seedlings: '/images/seedlings.jpg',
  livestock: '/images/livestock.jpg',
};

export const NAV_LINKS = [
  { label: 'Bosh sahifa', href: '#top' },
  { label: 'Sektorlar', href: '#sectors' },
  { label: 'Texnologiyalar', href: '#technology' },
  { label: 'Mahsulotlar', href: '#products' },
  { label: 'Yangiliklar', href: '#articles' },
  { label: "Bog'lanish", href: '#contact' },
];

export type SectorId = 'agro_vet' | 'feed' | 'warehouse' | 'seeds' | 'machinery';

export interface Sector {
  id: SectorId;
  emoji: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  guarantee: string;
  tags: string[];
  metric: { value: string; label: string };
}

export const SECTORS: Sector[] = [
  {
    id: 'agro_vet',
    emoji: '🌿',
    icon: Leaf,
    title: 'Agro-Vet',
    subtitle: 'Vet-dorixonalar',
    description:
      "Chorva va parrandalar uchun dori-darmonlar, vitaminlar va vaksinalar — saqlash sharoiti va yaroqlilik muddati kafolati bilan.",
    guarantee: 'Yaroqlilik muddati nazorati',
    tags: ['Vaksinalar', 'Vitaminlar', 'Antibiotiklar', 'Dezinfeksiya'],
    metric: { value: '100%', label: 'Muddati tekshirilgan' },
  },
  {
    id: 'feed',
    emoji: '🌾',
    icon: Wheat,
    title: 'Yem va Ozuqa',
    subtitle: 'Feed',
    description:
      "Omuxta yem, kepak, arpa va premikslar — butun qop yoki kerakli kilogramm miqdorida bo'lib sotib olish imkoniyati.",
    guarantee: 'Qop yoki kg-lab xarid',
    tags: ['Omuxta yem', 'Kepak', 'Premiks', 'Arpa'],
    metric: { value: '1 kg', label: 'dan boshlab' },
  },
  {
    id: 'warehouse',
    emoji: '🏢',
    icon: Warehouse,
    title: 'Ulgurji Ombor',
    subtitle: 'Warehouse',
    description:
      "Diler va ulgurji omborlar bilan to'g'ridan-to'g'ri aloqa. Chakana va ulgurji narxlar oldindan ochiq ko'rsatiladi.",
    guarantee: 'Shaffof ikki bosqichli narx',
    tags: ['Ulgurji narx', 'Chakana narx', 'Diler', 'Yetkazib berish'],
    metric: { value: '2x', label: 'narx shaffofligi' },
  },
  {
    id: 'seeds',
    emoji: '🌱',
    icon: Sprout,
    title: "Urug' va Ko'chat",
    subtitle: 'Seeds',
    description:
      "Sertifikatlangan navlar, unuvchanlik foizi va hosil yili ko'rsatilgan urug'lar hamda sog'lom ko'chatlar.",
    guarantee: 'Unuvchanlik % kafolati',
    tags: ["Sabzavot urug'i", "G'alla", "Mevali ko'chat", 'Issiqxona'],
    metric: { value: '95%+', label: 'unuvchanlik' },
  },
  {
    id: 'machinery',
    emoji: '🔧',
    icon: Wrench,
    title: 'Texnika va Jihozlar',
    subtitle: 'Machinery',
    description:
      "Agro-texnika, nasoslar, tomchilatib sug'orish tizimlari va ehtiyot qismlar — seriya raqami va rasmiy kafolat bilan.",
    guarantee: 'S/N va kafolat nazorati',
    tags: ['Traktor qismlari', 'Nasoslar', "Sug'orish", 'Asboblar'],
    metric: { value: '12+ oy', label: 'kafolat' },
  },
];

export const HERO_METRICS = [
  { value: '100%', label: 'Sertifikatlangan mahsulotlar', highlight: true },
  { value: '5+', label: 'Agro sektor bir joyda' },
  { value: '14', label: "Respublika bo'ylab viloyatlar" },
];

export const ECOSYSTEM_STATS = [
  { value: '5', unit: 'sektor', label: 'Agro-biznes yo‘nalishlari', highlight: true },
  { value: '24/7', unit: '', label: 'Onlayn katalog' },
  { value: '0', unit: "so'm", label: 'Fermer uchun komissiya' },
];

/** Viloyatlar bo'yicha do'konlar qamrovi (taqdimot uchun namunaviy ko'rsatkichlar). */
export const REGION_COVERAGE = [
  { name: 'Toshkent', value: 92 },
  { name: 'Samarqand', value: 78 },
  { name: "Farg'ona", value: 71 },
  { name: 'Qashqadaryo', value: 64 },
  { name: 'Surxondaryo', value: 52 },
];

/** Oylik buyurtmalar dinamikasi (namunaviy) — stacked bar uchun. */
export const MONTHLY_ORDERS = [
  { m: 'Yan', vet: 28, feed: 34 },
  { m: 'Fev', vet: 32, feed: 38 },
  { m: 'Mar', vet: 41, feed: 46 },
  { m: 'Apr', vet: 48, feed: 52 },
  { m: 'May', vet: 55, feed: 50 },
  { m: 'Iyn', vet: 50, feed: 58 },
  { m: 'Iyl', vet: 58, feed: 62 },
  { m: 'Avg', vet: 62, feed: 60 },
  { m: 'Sen', vet: 66, feed: 68 },
  { m: 'Okt', vet: 70, feed: 72 },
  { m: 'Noy', vet: 64, feed: 66 },
  { m: 'Dek', vet: 60, feed: 64 },
];

export const QUALITY_BADGES = [
  { rank: '№1', label: 'Fermerlar uchun yagona katalog' },
  { rank: '№5', label: 'Agro sektor bitta ilovada' },
  { rank: '№1', label: "Sifat nazorati B2B do'konlarda" },
];

export const VALUES = [
  {
    num: '(01)',
    title: 'Fermerga yaqinlik',
    text: "Eng yaqin agro-do'konni geolokatsiya orqali topib, vaqt va yo'l xarajatini tejash.",
    chips: ['Geolokatsiya', 'Yaqin do‘konlar', 'Tezkor', 'Qulay'],
    dark: false,
  },
  {
    num: '(02)',
    title: "To'g'ridan-to'g'ri xarid",
    text: "Vositachilarsiz — do'kon egasi bilan to'g'ridan-to'g'ri aloqa va real ombor qoldig'i.",
    chips: ['Real qoldiq', 'Ochiq narx', 'Buyurtma', 'Chat'],
    dark: true,
  },
  {
    num: '(03)',
    title: 'Kafolatlangan sifat',
    text: "Yaroqlilik muddati, unuvchanlik foizi va texnika kafolati har bir mahsulotda ko'rsatiladi.",
    chips: ['Sertifikat', 'Muddat', 'Kafolat', 'S/N'],
    dark: false,
  },
];

export const FEATURES = [
  {
    title: "Yaqin do'konlarni xaritada topish",
    text: 'Joylashuvingiz bo‘yicha 5–50 km radiusdagi vet-dorixona, yem va urug‘ do‘konlari.',
  },
  {
    title: 'Real vaqtli ombor qoldig‘i',
    text: "BiznesGO kassasi bilan sinxron — do'konda bor mahsulotgina ko'rsatiladi.",
  },
  {
    title: 'Onlayn buyurtma va bron',
    text: "Mahsulotni oldindan bron qiling, do'konga borib tayyor holda oling.",
  },
  {
    title: 'Telegram orqali bildirishnoma',
    text: 'Buyurtma holati, aksiya va yangi mahsulotlar haqida darhol xabar.',
  },
];

export const SEARCH_SUGGESTIONS = ['Omuxta yem', 'Ivermektin', "Pomidor urug'i", 'Nasos', 'Kepak'];

export const DEMO_RESULTS: Record<string, { store: string; distance: string; price: string; sector: SectorId }[]> = {
  default: [
    { store: 'Vet-Farm Plus', distance: '1.2 km', price: '45 000 so‘m', sector: 'agro_vet' },
    { store: 'Barakali Yem', distance: '2.8 km', price: '210 000 so‘m / qop', sector: 'feed' },
    { store: 'Hosil Urug‘lari', distance: '4.1 km', price: '18 000 so‘m', sector: 'seeds' },
  ],
};

export const CONTACT_INFO = {
  email: 'info@biznesgo.uz',
  phone: '+998 90 838 37 72',
  phoneRaw: '+998908383772',
  address: 'Toshkent, O‘zbekiston',
};

/** Referens dizayndagi "Elevates drone agricultural operations new heights" bloklari */
export const OPERATION_PILLARS = [
  {
    id: 'payload',
    title: 'Yuqori Hosildorlik',
    en: 'Heavy Payload',
    tag: '50 kg yuklama',
    desc: '40–50 kg bak sig‘imi bilan bir parvozda 21 gektargacha maydonga dori purkash.',
    image: '/images/drone-spraying.jpg',
  },
  {
    id: 'spreading',
    title: 'Tekis Don Sochish',
    en: 'Smooth Spreading',
    tag: 'Santimetr aniqlik',
    desc: 'Omuxta yem, don va mineral o‘g‘itlarni butun maydon bo‘ylab teng taqsimlash.',
    image: '/images/aerial-fields.jpg',
  },
  {
    id: 'sprinkler',
    title: 'To‘rtlamchi Purkagich',
    en: 'Four Sprinkler Kit',
    tag: 'Dispers tuman',
    desc: 'Santrifugal atomizatorlar orqali dori sarfini 30% tejab, chuqur barg qatlamigacha yetkazish.',
    image: '/images/agro-drone.jpg',
  },
];

/** Referens dizayndagi "Explore Our Products" mahsulotlar ro'yxati */
export const PRODUCTS = [
  {
    id: 'dji-t50',
    name: 'DJI Agras T50 Smart Dron',
    category: 'Agro-Texnika',
    oldPrice: '$2,100',
    price: '$1,880',
    image: '/images/agro-drone.jpg',
    badge: 'Yangi Model',
    rating: '4.9',
    stock: 'Omborda mavjud',
  },
  {
    id: 'controller-pro',
    name: 'Agro Remote Controller Pro',
    category: 'Monitoring & Boshqaruv',
    oldPrice: '$1,200',
    price: '$980',
    image: '/images/smart-controller.jpg',
    badge: 'Smart Ekran',
    rating: '5.0',
    stock: '12 dona qoldi',
  },
  {
    id: 'premium-feed',
    name: 'Yuqori Proteinli Granula Yem',
    category: 'Yem va Ozuqa',
    oldPrice: '7,500 so‘m',
    price: '6,200 so‘m / kg',
    image: '/images/livestock.jpg',
    badge: 'Ulgurji Narx',
    rating: '4.8',
    stock: '5 tonna mavjud',
  },
  {
    id: 'wheat-seeds',
    name: 'Elita Navli Bug‘doy Urug‘i',
    category: "Urug'chilik",
    oldPrice: '15,000 so‘m',
    price: '12,000 so‘m / kg',
    image: '/images/seedlings.jpg',
    badge: '98% Unuvchanlik',
    rating: '4.9',
    stock: 'Sertifikatlangan',
  },
];

/** Referens dizayndagi "News & Articles" agro maqolalar */
export const ARTICLES = [
  {
    id: 'drones-efficiency',
    title: 'Agro-dronlar bilan purkash: Yoqilg‘i va dori xarajatini 3 barobarga kamaytirish sirlari',
    category: 'Agro-Texnologiya',
    date: '18 Oktyabr, 2026',
    readTime: '4 daqiqa',
    image: '/images/drone-spraying.jpg',
    author: 'Aziz Rahimov',
  },
  {
    id: 'autumn-crop-care',
    title: 'Kuzgi ekinlarni qishlashga tayyorlash: Ozuqa va mineral moddalar balansi',
    category: 'Agronom Maslahati',
    date: '15 Oktyabr, 2026',
    readTime: '6 daqiqa',
    image: '/images/farmer.jpg',
    author: 'Dilshod Karimov',
  },
  {
    id: 'biznesgo-agrozgo-sync',
    title: 'BiznesGO kassa tizimi va AgrozGO: Do‘konlar savdosini 40% oshirish amaliyoti',
    category: 'B2B & B2C Ekotizim',
    date: '12 Oktyabr, 2026',
    readTime: '5 daqiqa',
    image: '/images/tractor.jpg',
    author: 'AgrozGO Tahlilchilari',
  },
];


