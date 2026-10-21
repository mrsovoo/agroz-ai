import { BusinessType } from '../types';

export interface SubscriptionPlan {
  plan_name: string;
  price_uzs: number;
  period: string;
  status: 'active' | 'trial' | 'expired';
  expires_at: string;
  days_left: number;
  features: string[];
}

export interface SectorSupportContact {
  sector_key: BusinessType;
  sector_title: string;
  specialist_name: string;
  specialist_role: string;
  phone: string;
  telegram_username: string;
  email: string;
  working_hours: string;
  topics: string[];
}

export const SUPPORT_EMAIL = 'info@biznesgo.uz';
export const SUPPORT_PHONE = '+998 90 838 37 72';
export const SUPPORT_TELEGRAM = 'bydsgn';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'feature' | 'agro' | 'important';
  date: string;
  badge: string;
}

export const DEFAULT_SUBSCRIPTION_PLAN: SubscriptionPlan = {
  plan_name: 'BiznesGO B2B Pro',
  price_uzs: 199000,
  period: 'Oylik',
  status: 'active',
  expires_at: '2026-11-18',
  days_left: 30,
  features: [
    'Barcha 5 ta yo‘nalish bo‘yicha to‘liq funksional',
    'Cheksiz tovarlar, partiyalar va qoldiq monitoringi',
    'Sektorga mos aqlli Kassa va POS chek chiqarish',
    'CRM va Qarz daftari (Kredit limiti va bo‘lib to‘lash)',
    'Telegram bot va Web ilova ikki tomonlama sinxronizatsiyasi',
    'Sektor bo‘yicha 24/7 shaxsiy mutaxassis yordami',
  ],
};

export const SECTOR_SUPPORT_CONTACTS: Record<BusinessType, SectorSupportContact> = {
  agro_vet: {
    sector_key: 'agro_vet',
    sector_title: 'Agro-Vet dorixona va himoya preparatlari',
    specialist_name: 'Dr. Jamshid Olimov',
    specialist_role: 'Agro-kimyo va Fitosanitariya bosh mutaxassisi',
    phone: '+998 90 838 37 72',
    telegram_username: 'bydsgn',
    email: 'info@biznesgo.uz',
    working_hours: 'Dush - Shan, 08:00 - 20:00 (24/7 navbatchi)',
    topics: [
      'Dori-darmonlar sertifikatlari va standartlari',
      'Yaroqlilik muddati va partiya (batch) nazorati',
      'Veterinariya va o‘simlik himoyasi me’yorlari',
      'Zaharli va taqiqlangan preparatlar tahlili',
    ],
  },
  feed: {
    sector_key: 'feed',
    sector_title: 'Yem va Ozuqa mahsulotlari savdosi',
    specialist_name: 'Muzaffar Yoqubov',
    specialist_role: 'Chorvachilik va Parrandachilik ozuqa texnologi',
    phone: '+998 90 838 37 72',
    telegram_username: 'bydsgn',
    email: 'info@biznesgo.uz',
    working_hours: 'Har kuni 08:00 - 20:00',
    topics: [
      'Ozuqa ratsionlari va aralashmalar tarkibi',
      'Qop va kg bo‘yicha kassa hisob-kitoblari',
      'Ulgurji yem yetkazib beruvchilar bilan aloqa',
      'Fermerlar xarid davriyligi (7-10 kun) eslatmalari',
    ],
  },
  warehouse: {
    sector_key: 'warehouse',
    sector_title: 'Ulgurji ombor va B2B distribyutsiya',
    specialist_name: 'Akmal Rustamov',
    specialist_role: 'B2B Distribyutsiya va Logistika koordinatori',
    phone: '+998 90 838 37 72',
    telegram_username: 'bydsgn',
    email: 'info@biznesgo.uz',
    working_hours: '24/7 Doimiy aloqada',
    topics: [
      'B2B do‘konlar uchun kredit limitlarini sozlash',
      'Yirik omborlar va optom partiyalar boshqaruvi',
      'Yuk xatlari va schyot-faktura integratsiyalari',
      'Kredit limiti oshganda savdoni avtomatik bloklash',
    ],
  },
  seeds: {
    sector_key: 'seeds',
    sector_title: 'Urug‘chilik va Ko‘chat xo‘jaligi',
    specialist_name: 'Olimjon Qodirov',
    specialist_role: 'Urug‘chilik va Seleksiya bo‘yicha bosh agronom',
    phone: '+998 90 838 37 72',
    telegram_username: 'bydsgn',
    email: 'info@biznesgo.uz',
    working_hours: 'Dush - Shan, 08:30 - 19:30',
    topics: [
      'Urug‘lar unuvchanlik foizi va sertifikatlari',
      'Bahoriy va kuzgi ekish mavsumi eslatmalari',
      'Serhosil yangi navlar va fitosanitariya xulosalari',
      'Xo‘jaliklar va fermerlar bazasi bilan ishlash',
    ],
  },
  machinery: {
    sector_key: 'machinery',
    sector_title: 'Jihoz va Texnika, ehtiyot qismlar',
    specialist_name: 'Farhod Ergashov',
    specialist_role: 'Qishloq xo‘jaligi texnikasi bosh muhandisi',
    phone: '+998 90 838 37 72',
    telegram_username: 'bydsgn',
    email: 'info@biznesgo.uz',
    working_hours: 'Har kuni 08:00 - 21:00',
    topics: [
      'Texnikalar zavod kafolatlari va servis monitoringi',
      'Zapchastlar katalogi va kodi bo‘yicha qidiruv',
      'Bo‘lib to‘lash va muddatli qarzlar jadvali',
      'Mijozlarga texnik xizmat ko‘rsatish eslatmalari',
    ],
  },
};

export const PLATFORM_NEWS: NewsItem[] = [
  {
    id: 'news-v1',
    title: 'BiznesGO v1.0.0 rasman ishga tushirildi! 🚀',
    summary: 'Barcha 5 ta biznes yo‘nalishi (Agro-Vet, Yem, Ombor, Urug‘, Texnika) uchun moslashuvchan kassa, ombor va CRM tizimi to‘liq yangilandi.',
    content: 'Platformaning v1.0.0 relizida har bir agrosektor uchun maxsus maydonlar (partiya, yaroqlilik, qop vazni, kredit limiti, nav, unuvchanlik, kafolat) va B2B qarz daftari to‘liq joriy etildi.',
    category: 'feature',
    date: '19-Oktyabr, 2026',
    badge: 'Yangi versiya',
  },
  {
    id: 'news-geo',
    title: 'Geolokatsiya orqali manzilni avtomatik tasdiqlash 📍',
    summary: 'Do‘kon manzilini qo‘lda yozish o‘rniga, xaritadagi aniq GPS geolokatsiya ruxsati orqali avtomatik aniqlash yo‘lga qo‘yildi.',
    content: 'Do‘konlarning geografik o‘rni GPS koordinatalar asosida xaritada avtomatik belgilanadi. Brauzerda lokatsiyaga ruxsat so‘rash xabarlari bilan ta‘minlandi.',
    category: 'important',
    date: '19-Oktyabr, 2026',
    badge: 'Muhim',
  },
  {
    id: 'news-credit',
    title: 'B2B Qarz daftari va Kredit limiti nazorati 💳',
    summary: 'Ulgurji omborlar va do‘konlar uchun har bir mijozga kredit limiti belgilash va limitdan oshganda ogohlantirish tizimi ishga tushirildi.',
    content: 'Nasiya savdolarda xavfsizlikni oshirish maqsadida har bir hamkor do‘konga kredit limiti o‘rnatish va qarzdorlik bo‘yicha eslatmalar yuborish imkoni yaratildi.',
    category: 'agro',
    date: '18-Oktyabr, 2026',
    badge: 'CRM',
  },
  {
    id: 'news-expiry',
    title: 'Agro-Vet preparatlari yaroqlilik muddati ogohlantirishi ⚠️',
    summary: 'Muddati o‘tgan yoki tugashiga 45 kundan kam qolgan preparatlar Dashboardda real vaqtda avtomatik qizil signal bilan ko‘rsatiladi.',
    content: 'Dorixona va kimyoviy preparat sotuvchilari uchun yaroqlilik muddati o‘tgan mahsulotlarni o‘z vaqtida ombordan chiqarish va xaridorlarga xavfsiz mahsulot yetkazish imkoni berildi.',
    category: 'feature',
    date: '17-Oktyabr, 2026',
    badge: 'Dorixona',
  },
];

