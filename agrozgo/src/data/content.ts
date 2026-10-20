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
  { label: 'Mahsulotlar', href: '#products' },
  { label: 'Xarid oqimi', href: '#order-flow' },
  { label: 'Texnologiyalar', href: '#technology' },
  { label: 'Yangiliklar', href: '#articles' },
  { label: "Bog'lanish", href: '#contact' },
];

export type SectorId = 'agro_vet' | 'feed' | 'warehouse' | 'seeds' | 'machinery';

export interface Sector {
  id: SectorId;
  emoji?: string;
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
    icon: Leaf,
    title: 'O‘g‘itlar va Vet-Dorilar',
    subtitle: 'Agro-Vet',
    description:
      "Biostimulyatorlar, NPK mineral o‘g‘itlar, vet-antibiotiklar va vaksinalar — partiya №, saqlash sharoiti va yaroqlilik muddati qat’iy kafolati bilan.",
    guarantee: 'Yaroqlilik muddati & saqlash kafolati',
    tags: ['Vet-antibiotiklar', 'NPK mineral o‘g‘itlar', 'Biostimulyatorlar', 'Vaksinalar'],
    metric: { value: '100%', label: 'Muddati tekshirilgan' },
  },
  {
    id: 'feed',
    icon: Wheat,
    title: 'Yem va Ozuqalar',
    subtitle: 'Feed',
    description:
      "Qoramol, parranda va baliq ozuqalari, omuxta yem, kepak va kunjara — butun 50 kg qop yoki kerakli kilogramm miqdorida bo‘lib sotib olish imkoniyati.",
    guarantee: 'Qoplab yoki kg-lab xarid',
    tags: ['Parranda ozuqasi', 'Qoramol yemi', 'Baliq granulasi', 'Kepak & Kunjara'],
    metric: { value: '1 kg', label: 'dan boshlab xarid' },
  },
  {
    id: 'warehouse',
    icon: Warehouse,
    title: 'Ombor va Qadoqlash',
    subtitle: 'Warehouse',
    description:
      "Ko‘p yillik issiqxona plyonkalari, tomchilatib sug‘orish tizimlari va qadoqlash taralari — shaffof chakana va minimal ulgurji partiya narxlari bilan.",
    guarantee: 'Shaffof 2 bosqichli narx',
    tags: ['Issiqxona plyonkasi', 'Tomchilatib sug‘orish', 'Karbamid N46%', 'Qadoqlash qoplari'],
    metric: { value: '2x', label: 'narx shaffofligi' },
  },
  {
    id: 'seeds',
    icon: Sprout,
    title: 'Urug‘lar va Ko‘chatlar',
    subtitle: 'Seeds',
    description:
      "Sertifikatlangan pomidor, bodring, g‘alla elita urug‘lari hamda meva ko‘chatlari — 98% unuvchanlik foizi va nav tozaligi kafolati bilan.",
    guarantee: '98% Unuvchanlik kafolati',
    tags: ['Pomidor F1 gibrid', 'Bodring F1 Mirage', 'Krasnodar elita bug‘doy', 'Meva ko‘chatlari'],
    metric: { value: '98%', label: 'unuvchanlik kafolati' },
  },
  {
    id: 'machinery',
    icon: Wrench,
    title: 'Jihozlar va Agro-Texnika',
    subtitle: 'Machinery',
    description:
      "Motobloklar, 25L motorli purkagichlar, suv nasoslari va ehtiyot qismlar — zavod seriya raqami (S/N) va POS-chekda rasmiy kafolat bilan.",
    guarantee: 'S/N va chekda kafolat',
    tags: ['Motobloklar', 'Motorli purkagichlar', 'Suv nasoslari', 'Ehtiyot qismlar'],
    metric: { value: '12+ oy', label: 'rasmiy kafolat' },
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

export const SEARCH_SUGGESTIONS = [
  'Arpa omuxta yem',
  'Enrofloksatsin 10%',
  'Pomidor F1 Red Bull',
  'Karbamid N46%',
  'Motorli purkagich 25L',
  'Tomchilatib sug‘orish',
  'Bug‘doy kepagi',
];

export const DEMO_RESULTS: Record<string, { store: string; distance: string; price: string; sector: SectorId; address: string }[]> = {
  default: [
    { store: 'Vet-Farm Plus', distance: '1.2 km', price: '45 000 so‘m / dona', sector: 'agro_vet', address: 'Toshkent, Chilonzor' },
    { store: 'Chinoz Baraka Yem', distance: '2.4 km', price: '220 000 so‘m / qop (4 400 s/kg)', sector: 'feed', address: 'Chinoz tumani' },
    { store: 'Dehqon Bobo Urug‘lari', distance: '3.8 km', price: '85 000 so‘m / pachka', sector: 'seeds', address: 'Samarqand, Jomboy' },
    { store: 'Optom Agro Baza', distance: '4.5 km', price: '20 000 so‘m (Ulgurji)', sector: 'warehouse', address: 'Farg‘ona, Qo‘qon' },
    { store: 'AgroTexnika Savdo', distance: '5.1 km', price: '1 800 000 so‘m (12 oy kafolat)', sector: 'machinery', address: 'Toshkent, Sergeli' },
  ],
};

export const CONTACT_INFO = {
  email: 'info@biznesgo.uz',
  phone: '+998 90 838 37 72',
  phoneRaw: '+998908383772',
  address: 'Toshkent, O‘zbekiston',
};

/** BiznesGO va AgrozGO ekotizimining 3 ta tayanch texnologik ustuni */
export const OPERATION_PILLARS = [
  {
    id: 'sync',
    title: '1:1 Jonli Kassa Sinxronizatsiyasi',
    subtitle: 'Haqiqiy vaqtli ombor qoldig‘i',
    tag: '0 soniya kechikish',
    desc: 'BiznesGO POS kassa orqali do‘konda sotilgan har bir dori, urug‘ yoki yem AgrozGO qoldig‘idan avtomatik kamayadi. Fermer faqat do‘konda bor tovargagina buyurtma beradi.',
    image: '/images/smart-controller.jpg',
  },
  {
    id: 'feed-calc',
    title: 'Qoplab yoki Kg-lab Bo‘lib Sotish',
    subtitle: 'Ozuqa va yem kalkulyatori',
    tag: '1 kg dan boshlab',
    desc: 'Yem va ozuqa do‘konlarida 50 kg qopdagi yemni mijoz xohishiga ko‘ra 5–10 kg qilib bo‘lib sotish kalkulyatori. Tizim qoldiqni avtomatik to‘g‘ri hisoblab boradi.',
    image: '/images/livestock.jpg',
  },
  {
    id: 'wholesale',
    title: 'Shaffof Ikki Bosqichli Narx',
    subtitle: 'Chakana va ulgurji savdo',
    tag: 'Ulgurji chegirma',
    desc: 'Omborlar uchun chakana va minimal ulgurji partiyalar (masalan, 10 qopdan boshlab) narxi oldindan ochiq ko‘rsatiladi. Dilerlik va qarz daftari to‘liq avtomatlashtirilgan.',
    image: '/images/aerial-fields.jpg',
  },
];

/** BiznesGO dagi real B2B do'konlardan olingan mahsulotlar (5 sektor bo'yicha to'liq vitrina) */
export const PRODUCTS = [
  {
    id: 'enrofloksatsin',
    name: 'Enrofloksatsin 10% (Vet-antibiotik)',
    category: 'Agro-Vet',
    store: 'Vet-Farm Plus',
    location: 'Toshkent, Chilonzor',
    oldPrice: '52 000 so‘m',
    price: '45 000 so‘m',
    unit: 'flakon',
    image: '/images/seedlings.jpg',
    badge: 'Yaroqlilik kafolati (2028)',
    rating: '4.9',
    stock: '28 dona mavjud (Partiya №0428)',
    guaranteeDetail: 'Saqlash sharoiti: +5...+25°C, sertifikatlangan',
  },
  {
    id: 'humate-npk',
    name: 'Biostimulyator Humate Active + NPK 20-20-20',
    category: 'Agro-Vet',
    store: 'AgroKimyo Savdo',
    location: 'Samarqand, Pastdarg‘om',
    oldPrice: '75 000 so‘m',
    price: '65 000 so‘m',
    unit: 'litr',
    image: '/images/aerial-fields.jpg',
    badge: 'Organik biostimulyator',
    rating: '4.8',
    stock: '42 litr qoldi',
    guaranteeDetail: 'Hosilni 25-30% oshiruvchi bargdan oziqlantirish',
  },
  {
    id: 'arpa-yem',
    name: 'Arpa omuxta yemi №1 (50 kg qop / kg-lab)',
    category: 'Yem va Ozuqa',
    store: 'Chinoz Baraka Yem',
    location: 'Toshkent vil., Chinoz',
    oldPrice: '240 000 so‘m',
    price: '220 000 so‘m',
    unit: 'qop',
    image: '/images/livestock.jpg',
    badge: '1 kg = 4 400 so‘m bo‘lib sotish',
    rating: '5.0',
    stock: '45 qop mavjud (kg-lab bo‘linadi)',
    guaranteeDetail: 'To‘yimli toza don, 100% tabiiy aralashma',
  },
  {
    id: 'baliq-yem',
    name: 'Ekstrudirlangan granula baliq ozuqasi (3 mm)',
    category: 'Yem va Ozuqa',
    store: 'Oqsuv Ozuqa Baza',
    location: 'Sirdaryo, Boyovut',
    oldPrice: '22 000 so‘m',
    price: '18 000 so‘m',
    unit: 'kg',
    image: '/images/livestock.jpg',
    badge: 'Oqsil 42% (Suzuvchi)',
    rating: '4.9',
    stock: '350 kg zaxira mavjud',
    guaranteeDetail: 'Sazan va laqqa baliqlar uchun yuqori oqsil',
  },
  {
    id: 'issiqxona-plyonka',
    name: '3 qatlamli UV issiqxona plyonkasi (120 mkr, 8x50m)',
    category: 'Ulgurji Ombor',
    store: 'Optom Agro Baza',
    location: 'Farg‘ona, Qo‘qon',
    oldPrice: '1 050 000 so‘m',
    price: '950 000 so‘m',
    unit: 'o‘ram',
    image: '/images/aerial-fields.jpg',
    badge: '3 yil UV kafolat',
    rating: '4.9',
    stock: '18 o‘ram mavjud',
    guaranteeDetail: 'Yorug‘lik o‘tkazuvchanligi 92%, yorilishga chidamli',
  },
  {
    id: 'drip-irrigation',
    name: 'Tomchilatib sug‘orish lentasi (16mm, 1000m)',
    category: 'Ulgurji Ombor',
    store: 'Optom Agro Baza',
    location: 'Toshkent, Bektemir',
    oldPrice: '480 000 so‘m',
    price: '420 000 so‘m',
    unit: 'o‘ram',
    image: '/images/tractor.jpg',
    badge: '16 mm / 20 sm oraliq',
    rating: '4.9',
    stock: '35 o‘ram mavjud',
    guaranteeDetail: 'Suv va o‘g‘it sarfini 50% tejash tizimi',
  },
  {
    id: 'karbamid-n46',
    name: 'Karbamid N46% mineral o‘g‘it',
    category: 'Ulgurji Ombor',
    store: 'Agro Kimyo Baza',
    location: 'Namangan, Pop',
    oldPrice: '25 000 so‘m',
    price: '20 000 so‘m',
    unit: 'qop',
    image: '/images/aerial-fields.jpg',
    badge: 'Ulgurji (min 10 qop)',
    rating: '4.8',
    stock: '120 qop mavjud',
    guaranteeDetail: 'NavoiyAzot davlat sertifikati bilan',
  },
  {
    id: 'pomidor-redbull',
    name: 'Pomidor F1 Red Bull gibrid urug‘i (Gollandiya)',
    category: "Urug'chilik",
    store: 'Dehqon Bobo Urug‘lari',
    location: 'Samarqand, Jomboy',
    oldPrice: '95 000 so‘m',
    price: '85 000 so‘m',
    unit: 'pachka',
    image: '/images/seedlings.jpg',
    badge: '98% Unuvchanlik kafolati',
    rating: '4.9',
    stock: 'Sertifikatlangan urug‘',
    guaranteeDetail: 'Erta pishar, kasalliklarga chidamli nav',
  },
  {
    id: 'bodring-mirage',
    name: 'Bodring F1 Mirage partenokarpik urug‘i',
    category: "Urug'chilik",
    store: 'Agro Elita Urug‘ Markazi',
    location: 'Buxoro, Vobkent',
    oldPrice: '85 000 so‘m',
    price: '75 000 so‘m',
    unit: 'pachka',
    image: '/images/seedlings.jpg',
    badge: '96% Unuvchanlik kafolati',
    rating: '4.9',
    stock: '50 pachka mavjud',
    guaranteeDetail: 'Ochiq va yopiq grunt uchun serhosil duragay',
  },
  {
    id: 'purkagich-25l',
    name: 'Benzinli motorli purkagich 25L (MS-073D)',
    category: 'Texnika va Jihozlar',
    store: 'AgroTexnika Savdo',
    location: 'Toshkent, Sergeli',
    oldPrice: '2 050 000 so‘m',
    price: '1 800 000 so‘m',
    unit: 'dona',
    image: '/images/agro-drone.jpg',
    badge: '12 oy kafolat (S/N)',
    rating: '4.9',
    stock: '8 dona qoldi',
    guaranteeDetail: 'Zavod seriya raqami va POS-chekda kafolat',
  },
  {
    id: 'motoblok-7hp',
    name: 'Dizelli 7 O.K. kultivator-motoblok (frezasi bilan)',
    category: 'Texnika va Jihozlar',
    store: 'AgroTexnika Savdo',
    location: 'Andijon, Asaka',
    oldPrice: '5 300 000 so‘m',
    price: '4 900 000 so‘m',
    unit: 'to‘plam',
    image: '/images/tractor.jpg',
    badge: '12 oy rasmiy kafolat',
    rating: '5.0',
    stock: '5 to‘plam mavjud',
    guaranteeDetail: 'Dala va bog‘lar uchun qulay, tejamkor dizel dvigatel',
  },
];

/** B2C xaridorining do'konga buyurtma berish jarayoni (Direct Store Order Flow) */
export const ORDER_FLOW_STEPS = [
  {
    num: '01',
    title: 'Qidirish va Tanlash',
    desc: 'Yaqin atrofdagi vet-dorixona, yem yoki urug‘ do‘konlarini geolokatsiya bo‘yicha topasiz va kerakli mahsulotni tanlaysiz.',
    badge: 'Geolokatsiya',
  },
  {
    num: '02',
    title: 'Haqiqiy Qoldiq va Narx',
    desc: 'BiznesGO POS kassa bilan 1:1 sinxron — do‘konda mavjud real qoldiq, qoplab yoki kg-lab narxlar ochiq ko‘rinadi.',
    badge: '1:1 Kassa',
  },
  {
    num: '03',
    title: 'To‘g‘ridan-to‘g‘ri Buyurtma',
    desc: 'Vositachilarsiz — buyurtma to‘g‘ridan-to‘g‘ri do‘kon kassasiga tushadi va tovar siz uchun zaxiralanadi.',
    badge: 'Vositachisiz',
  },
  {
    num: '04',
    title: 'Kafolatli Qabul Qilish',
    desc: 'Do‘kondan olib ketish yoki manzilga yetkazish. Mahsulot cheki va rasmiy kafolati bilan topshiriladi.',
    badge: '100% Kafolat',
  },
];

/** O'zbekistonlik fermerlar uchun foydali agro-maslahatlar */
export const ARTICLES = [
  {
    id: 'autumn-feeding',
    title: 'Chorvachilikda qishki yem zaxirasini to‘g‘ri tuzish: Omuxta yem va kepak mutanosibligi',
    category: 'Yem va Ozuqa',
    date: '18 Oktyabr, 2026',
    readTime: '4 daqiqa',
    image: '/images/livestock.jpg',
    author: 'Aziz Rahimov (Zootexnik)',
  },
  {
    id: 'greenhouse-hybrid-seeds',
    title: 'Issiqxonalarda F1 gibrid urug‘lar unuvchanligini 98% ga yetkazish va parvarish sirlari',
    category: 'Urug‘chilik',
    date: '15 Oktyabr, 2026',
    readTime: '6 daqiqa',
    image: '/images/farmer.jpg',
    author: 'Dilshod Karimov (Agronom)',
  },
  {
    id: 'agro-vet-safety',
    title: 'Veterinariya preparatlarida partiya va yaroqlilik muddati nazorati nega muhim?',
    category: 'Agro-Vet',
    date: '12 Oktyabr, 2026',
    readTime: '5 daqiqa',
    image: '/images/seedlings.jpg',
    author: 'Dr. Alisher Valiyev (Vet-vrach)',
  },
];


