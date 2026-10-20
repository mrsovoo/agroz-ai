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
    title: 'Yaqin do‘kondan bron qilish',
    subtitle: 'Nimalarni bron qilsa bo‘ladi?',
    text: 'Vet-dorilar, antibiotiklar, vaksinalar, premikslar, qoplab yoki kg-lab omuxta yem, kepak, kunjara hamda sabzavot urug‘lari. 5–15 km yaqin atrofdagi do‘kondan 1 tugma bilan bepul bron qilinadi va o‘zingiz borib navbatsiz olib ketasiz.',
    items: [
      'Vet-dorilar, antibiotik va vaksinalar',
      'Qoplab va kg-lab omuxta yem, kepak, kunjara',
      'Pomidor, bodring, sabzavot elita urug‘lari',
      'Qo‘l purkagichlari va biologik himoya vositalari',
    ],
    chips: ['Vet-dorilar', 'Yem-ozuqa', 'Urug‘chilik', 'Bepul bron', 'O‘zi olib ketish'],
    action: 'Do‘kondan olib ketish',
    badgeColor: 'text-agroGreen-800 bg-agroGreen/15',
  },
  {
    num: '(02)',
    title: 'Sektor transportida yetkazish',
    subtitle: 'Nimalarni yetkazib beriladi?',
    text: 'Oddiy do‘konga sig‘maydigan yirik tovarlar: motobloklar, mini-traktorlar, 25L motorli purkagichlar, suv nasoslari, ko‘p yillik issiqxona plyonkalari, tomchilatib sug‘orish lentalari va tonna o‘g‘itlar. Yirik hududiy sektordan to‘g‘ridan-to‘g‘ri dala yoki fermangizga yetkazib beriladi.',
    items: [
      'Motobloklar, kultivator va mini-traktorlar',
      '25L motorli purkagichlar va suv nasoslari',
      'Ko‘p yillik issiqxona plyonkalari (150–200 mkr)',
      'Tomchilatib sug‘orish tizimlari va quvurlar',
    ],
    chips: ['Motoblok', 'Agro-texnika', 'Issiqxona', 'Sug‘orish', 'Sektor logistikasi'],
    action: 'Dala va fermagacha yetkazish',
    badgeColor: 'text-amber-800 bg-amber/20',
  },
  {
    num: '(03)',
    title: 'Rasmiy chek va kafolat nazorati',
    subtitle: 'Qanday kafolatlar beriladi?',
    text: 'Barcha texnikalar zavod seriya raqami (S/N) bilan kassaga kiritiladi va POS-chekda 12+ oy rasmiy kafolat beriladi. Vet-dorilar partiya raqami va saqlash sharoiti, urug‘lar esa 98% unuvchanlik sertifikati bilan ta’minlanadi.',
    items: [
      'Zavod seriya raqami (S/N) kassa nazorati',
      'Fiskal POS-chekda 12+ oy rasmiy kafolat',
      'Partiya № va yaroqlilik muddati qat’iy nazorati',
      '98% unuvchanlik sertifikati va nav tozaligi',
    ],
    chips: ['S/N Nazorati', '12+ oy kafolat', 'Partiya №', '98% Unuvchanlik', 'Rasmiy chek'],
    action: '100% Sifat kafolati',
    badgeColor: 'text-forest-dark bg-agroGreen',
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
  'Arpa omuxta yem 50kg',
  'Enrofloksatsin 10%',
  'Pomidor F1 Red Bull',
  'Karbamid N46.2%',
  'Motorli purkagich 25L',
  'Tomchilatib sug‘orish 16mm',
  'Paxta kunjarasi shrot',
  'Ammofos 12:52',
];

export const DEMO_RESULTS: Record<string, { store: string; distance: string; price: string; sector: SectorId; address: string }[]> = {
  default: [
    { store: 'Vet-Farm Plus Dorixona', distance: '1.2 km', price: '45 000 so‘m / flakon', sector: 'agro_vet', address: 'Toshkent, Chilonzor tumani' },
    { store: 'Chinoz Baraka Yem Baza', distance: '2.4 km', price: '210 000 so‘m / qop (4 200 s/kg)', sector: 'feed', address: 'Toshkent vil., Chinoz tumani' },
    { store: 'Samarqand Elita Urug‘ Markazi', distance: '3.8 km', price: '145 000 so‘m / pachka', sector: 'seeds', address: 'Samarqand, Jomboy tumani' },
    { store: 'Qo‘qon Ulgurji Agro Baza', distance: '4.5 km', price: '185 000 so‘m (Ulgurji)', sector: 'warehouse', address: 'Farg‘ona, Qo‘qon shahri' },
    { store: 'AgroTexnika Weima Markazi', distance: '5.1 km', price: '4 800 000 so‘m (12 oy kafolat)', sector: 'machinery', address: 'Toshkent, Sergeli Agro-Baza' },
  ],
};

export const CONTACT_INFO = {
  email: 'info@agrozgo.uz',
  phone: '+998 71 200 44 22',
  phoneRaw: '+998712004422',
  mobile: '+998 90 838 37 72',
  address: 'Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko‘chasi, 42-uy (Agro-Tech Hub)',
  workingHours: 'Dushanba – Shanba: 08:30 – 19:00',
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
    name: 'Enrofloksatsin 10% (Vet-antibiotik, 100 ml)',
    category: 'Agro-Vet',
    store: 'Vet-Farm Plus Dorixona',
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
    name: 'Biostimulyator Gumat Kaliy + NPK 20-20-20 (5L)',
    category: 'Agro-Vet',
    store: 'AgroKimyo Savdo MCHJ',
    location: 'Samarqand, Pastdarg‘om',
    oldPrice: '140 000 so‘m',
    price: '120 000 so‘m',
    unit: 'kanistra',
    image: '/images/aerial-fields.jpg',
    badge: 'Organik biostimulyator',
    rating: '4.8',
    stock: '42 dona qoldi',
    guaranteeDetail: 'Hosilni 25-30% oshiruvchi ildiz va bargdan oziqlantirish',
  },
  {
    id: 'ivermektin',
    name: 'Ivermektin 1% in’yektsiya (Parazitlarga qarshi, 50 ml)',
    category: 'Agro-Vet',
    store: 'Vodiy Agro Vet Farm',
    location: 'Andijon, Asaka shoh ko‘chasi',
    oldPrice: '45 000 so‘m',
    price: '38 000 so‘m',
    unit: 'flakon',
    image: '/images/livestock.jpg',
    badge: 'Qo‘tir va gijjalarga qarshi',
    rating: '4.9',
    stock: '65 dona mavjud',
    guaranteeDetail: 'Katta qoramol va qo‘ylarda teri osti parazitlariga qarshi',
  },
  {
    id: 'arpa-yem',
    name: 'Qoramol semirtirish uchun granula omuxta yem (50 kg)',
    category: 'Yem va Ozuqa',
    store: 'Chinoz Baraka Yem Baza',
    location: 'Toshkent vil., Chinoz tumani',
    oldPrice: '235 000 so‘m',
    price: '210 000 so‘m',
    unit: 'qop',
    image: '/images/livestock.jpg',
    badge: '1 kg = 4 200 so‘m bo‘lib sotish',
    rating: '5.0',
    stock: '45 qop mavjud (kg-lab bo‘linadi)',
    guaranteeDetail: 'Arpa, makkajo‘xori, shrot va premiksli 100% to‘yimli yem',
  },
  {
    id: 'paxta-kunjara',
    name: 'Paxta kunjarasi (Shrot 42% xom oqsil, 50 kg)',
    category: 'Yem va Ozuqa',
    store: 'Qashqadaryo Don va Yem Klasteri',
    location: 'Qarshi, Temiryo‘lchilar ko‘chasi',
    oldPrice: '260 000 so‘m',
    price: '235 000 so‘m',
    unit: 'qop',
    image: '/images/hero-wheat.jpg',
    badge: '42% Yuqori oqsil',
    rating: '4.9',
    stock: '80 qop zaxirada',
    guaranteeDetail: 'Sutdor sigirlar va bo‘rdoqi mollar uchun yuqori kaloriyali',
  },
  {
    id: 'baliq-yem',
    name: 'Ekstrudirlangan suzuvchi baliq ozuqasi (3 mm, 20 kg)',
    category: 'Yem va Ozuqa',
    store: 'Oqsuv Ozuqa Baza',
    location: 'Sirdaryo, Boyovut tumani',
    oldPrice: '380 000 so‘m',
    price: '340 000 so‘m',
    unit: 'qop',
    image: '/images/livestock.jpg',
    badge: 'Oqsil 38% (Suzuvchi granula)',
    rating: '4.9',
    stock: '350 kg zaxira mavjud',
    guaranteeDetail: 'Sazan, karp va oq amur baliqlari uchun to‘liq ratsionli',
  },
  {
    id: 'pomidor-redbull',
    name: 'Pomidor F1 Red Bull gibrid urug‘i (Gollandiya, 1000 dona)',
    category: "Urug'chilik",
    store: 'Samarqand Elita Urug‘ Markazi',
    location: 'Samarqand, Jomboy tumani',
    oldPrice: '165 000 so‘m',
    price: '145 000 so‘m',
    unit: 'pachka',
    image: '/images/seedlings.jpg',
    badge: '98% Unuvchanlik kafolati',
    rating: '4.9',
    stock: 'Sertifikatlangan urug‘',
    guaranteeDetail: 'Erta pishar, go‘shtdor, kasalliklarga yuqori chidamli',
  },
  {
    id: 'bodring-mirage',
    name: 'Bodring F1 Mirage partenokarpik duragay (500 dona)',
    category: "Urug'chilik",
    store: 'Buxoro Agro Standart',
    location: 'Buxoro, Vobkent tumani',
    oldPrice: '110 000 so‘m',
    price: '95 000 so‘m',
    unit: 'pachka',
    image: '/images/seedlings.jpg',
    badge: '97% Unuvchanlik kafolati',
    rating: '4.9',
    stock: '50 pachka mavjud',
    guaranteeDetail: 'Ochiq va yopiq grunt uchun serhosil, o‘z-o‘zidan changlanuvchi',
  },
  {
    id: 'krasnodar-bugdoy',
    name: 'Krasnodar-99 elita g‘alla urug‘i (1-reproduktsiya, 50 kg)',
    category: "Urug'chilik",
    store: 'Dehqon Bobo Urug‘lari',
    location: 'Jizzax, G‘allaorol tumani',
    oldPrice: '340 000 so‘m',
    price: '310 000 so‘m',
    unit: 'qop',
    image: '/images/hero-wheat.jpg',
    badge: '75-80 s/ga hosildorlik',
    rating: '5.0',
    stock: '60 qop mavjud',
    guaranteeDetail: 'Davlat urug‘chilik inspeksiyasi sertifikati bilan',
  },
  {
    id: 'issiqxona-plyonka',
    name: '3 qatlamli UV issiqxona plyonkasi (150 mkr, 8x50 metr)',
    category: 'Ulgurji Ombor',
    store: 'Qo‘qon Ulgurji Agro Baza',
    location: 'Farg‘ona, Qo‘qon shahri',
    oldPrice: '1 250 000 so‘m',
    price: '1 150 000 so‘m',
    unit: 'o‘ram',
    image: '/images/aerial-fields.jpg',
    badge: '3 yil rasmiy UV kafolat',
    rating: '4.9',
    stock: '24 o‘ram mavjud',
    guaranteeDetail: 'Yorug‘lik o‘tkazuvchanligi 92%, muzlash va shamolga bardoshli',
  },
  {
    id: 'drip-irrigation',
    name: 'Tomchilatib sug‘orish lentasi (16 mm, 20 sm, 1000 metr)',
    category: 'Ulgurji Ombor',
    store: 'Optom Agro Baza',
    location: 'Toshkent, Bektemir tumani',
    oldPrice: '450 000 so‘m',
    price: '390 000 so‘m',
    unit: 'o‘ram',
    image: '/images/tractor.jpg',
    badge: '16 mm / 20 sm oraliq',
    rating: '4.9',
    stock: '45 o‘ram mavjud',
    guaranteeDetail: 'Suv va mineral o‘g‘it sarfini 50% ga tejovchi professional tizim',
  },
  {
    id: 'karbamid-n46',
    name: 'Karbamid N46.2% mineral o‘g‘it (NavoiyAzot AJ, 50 kg)',
    category: 'Ulgurji Ombor',
    store: 'Agro Kimyo Baza',
    location: 'Namangan, Pop tumani',
    oldPrice: '210 000 so‘m',
    price: '185 000 so‘m',
    unit: 'qop',
    image: '/images/aerial-fields.jpg',
    badge: 'Ulgurji narx (min 10 qop)',
    rating: '4.8',
    stock: '150 qop mavjud',
    guaranteeDetail: 'NavoiyAzot davlat sertifikati va partiya laboratoriya xulosasi bilan',
  },
  {
    id: 'motoblok-7hp',
    name: 'Kultivator-motoblok 7 O.K. Weima dizel (frezasi bilan)',
    category: 'Texnika va Jihozlar',
    store: 'AgroTexnika Weima Markazi',
    location: 'Toshkent, Sergeli Agro-Baza',
    oldPrice: '5 200 000 so‘m',
    price: '4 800 000 so‘m',
    unit: 'to‘plam',
    image: '/images/tractor.jpg',
    badge: '12 oy rasmiy kafolat',
    rating: '5.0',
    stock: '6 to‘plam mavjud',
    guaranteeDetail: 'Zavod seriya raqami (S/N) va rasmiy kafolat taloni bilan',
  },
  {
    id: 'purkagich-25l',
    name: 'Benzinli motorli purkagich 25L (MS-073D yuqori bosim)',
    category: 'Texnika va Jihozlar',
    store: 'Vodiy AgroTexnika',
    location: 'Andijon, Asaka tumani',
    oldPrice: '1 650 000 so‘m',
    price: '1 450 000 so‘m',
    unit: 'dona',
    image: '/images/agro-drone.jpg',
    badge: '12 oy servis kafolati',
    rating: '4.9',
    stock: '12 dona qoldi',
    guaranteeDetail: 'Bog‘ va dala ekinlarini dorilash uchun 25 metrga purkash kuchi',
  },
  {
    id: 'suv-nasos-15kw',
    name: 'Chuqur quduq suv nasosi 1.5 kW (Tomchilatish va sug‘orish)',
    category: 'Texnika va Jihozlar',
    store: 'Agro Nasos Servis',
    location: 'Samarqand, Pastdarg‘om tumani',
    oldPrice: '2 350 000 so‘m',
    price: '2 100 000 so‘m',
    unit: 'dona',
    image: '/images/smart-controller.jpg',
    badge: '12 m³/soat suv berish quvvati',
    rating: '4.9',
    stock: '9 dona mavjud',
    guaranteeDetail: 'Zanglamas po‘lat korpus, 60 metrgacha ko‘tarish quvvati',
  },
];

/** B2C xaridorining do'konga buyurtma berish jarayoni (Direct Store Order Flow) */
export const ORDER_FLOW_STEPS = [
  {
    num: '01',
    title: '5 Sektor Bo‘yicha Qidirish',
    desc: 'Yaqin atrofdagi dorixona, yem, urug‘, ombor yoki texnika do‘konlaridagi 1:1 real ombor qoldig‘i va shaffof narxlarni ko‘rasiz.',
    badge: '1:1 Kassa Qoldig‘i',
  },
  {
    num: '02',
    title: 'Kichik Tovarlar: Bron Qilish',
    desc: 'Dori, urug‘ yoki kundalik yemni onlayn bron qilasiz. Do‘konda tovar sizga zaxiralanadi, borib navbatsiz olib ketasiz.',
    badge: 'Bron & Olib Ketish',
  },
  {
    num: '03',
    title: 'Yirik Partiyalar: Sektor Yetkazishi',
    desc: 'Ko‘p tonnalik yem, o‘g‘it yoki yirik texnikalarni boshqa viloyatdan buyurtma qilsangiz, sektorlarning o‘z maxsus yuk xizmati yetkazishga mas’ul bo‘ladi.',
    badge: 'Sektor Logistikasi',
  },
  {
    num: '04',
    title: 'Kassa Cheki va Rasmiy Kafolat',
    desc: 'Mahsulotni qabul qilib, BiznesGO POS kassa cheki, partiya sertifikati va rasmiy kafolati bilan xaridni yakunlaysiz.',
    badge: '100% Rasmiy Chek',
  },
];

/** O'zbekistonlik fermerlar uchun foydali agro-maslahatlar */
export const ARTICLES = [
  {
    id: 'autumn-wheat-fertilization',
    title: 'Kuzgi bug‘doy ekishda Ammofos va fosforli o‘g‘itlarni solish me’yorlari hamda unuvchanlikni oshirish sirlari',
    category: 'Urug‘chilik & O‘g‘itlar',
    date: '18 Oktyabr, 2026',
    readTime: '5 daqiqa',
    image: '/images/hero-wheat.jpg',
    author: 'Dilshod Qodirov (Q.x.f.n., bosh agronom)',
  },
  {
    id: 'cattle-feed-ration',
    title: 'Sut yo‘nalishidagi qoramollarda omuxta yem, kunjara va premikslar balansini to‘g‘ri taqsimlash qoidalari',
    category: 'Yem va Ozuqa',
    date: '15 Oktyabr, 2026',
    readTime: '6 daqiqa',
    image: '/images/livestock.jpg',
    author: 'Jasur Ahmedov (Bosh zootexnik-mutaxassis)',
  },
  {
    id: 'agro-vet-antibiotics-control',
    title: 'Veterinariya dorilari: Partiya raqami, saqlash harorati va yaroqlilik muddatini tekshirish nima uchun hal qiluvchi omil?',
    category: 'Agro-Vet',
    date: '12 Oktyabr, 2026',
    readTime: '4 daqiqa',
    image: '/images/seedlings.jpg',
    author: 'Dr. Shavkat Ergashev (Bosh vet-vrach)',
  },
];


