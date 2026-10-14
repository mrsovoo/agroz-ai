"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronDown,
  ShoppingCart,
  Star,
  MapPin,
  Users,
  Sprout,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  CloudSun,
  Store,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  Package,
  Receipt,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-config";

// Bazadagi haqiqiy tasdiqlangan 24 ta dori vositasi
const REAL_PRODUCTS = [
  {
    id: 1,
    name: "Ridomil Gold MZ 68 WG",
    category: "Fungitsid",
    type: "crop",
    desc: "Pomidor, kartoshka va uzumdagi fitoftoroz, peronosporoz va soxta un-shudringga qarshi tizimli fungitsid.",
    price: "65 000 so‘m",
    store: "Agro Kimyo Baraka MCHJ",
    location: "Toshkent",
    stock: 10,
    badge: "Himoya",
    badgeIcon: Sprout,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 2,
    name: "Score 250 EC (Skor)",
    category: "Fungitsid",
    type: "crop",
    desc: "Olma va mevali daraxtlardagi qora dog' (parsha), un-shudring va klasterosporioz kasalliklariga qarshi kuchli vosita.",
    price: "48 000 so‘m",
    store: "Dehqon Hamkori Agrovet",
    location: "Samarqand",
    stock: 10,
    badge: "Bog‘dorchilik",
    badgeIcon: Sprout,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Amistar Extra 280 SC",
    category: "Fungitsid",
    type: "crop",
    desc: "Bug'doy, arpa va dukkaklilardagi sariq zang, septorioz va fuzarioz kasalliklaridan uzoq muddatli himoya.",
    price: "85 000 so‘m",
    store: "Vodiy Agro Zamin Savdo Markazi",
    location: "Farg‘ona",
    stock: 10,
    badge: "G‘allachilik",
    badgeIcon: Sprout,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 4,
    name: "Envidor 240 SC",
    category: "Akaritsid",
    type: "crop",
    desc: "O'rgimchakkana, qizil kana va barcha turdagi zararkunanda kanalarning tuxum hamda yetuk shakllariga qarshi akaritsid.",
    price: "54 000 so‘m",
    store: "Buxoro Vet Shifo Markaziy Dorixonasi",
    location: "Buxoro",
    stock: 10,
    badge: "Kana himoyasi",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-amber-100/90 text-amber-900 border border-amber-200",
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 5,
    name: "Konfidor Extra (Imidakloprid)",
    category: "Insektitsid",
    type: "crop",
    desc: "Oqqanot, shira (tlya), tripslar va kolorado qo'ng'iziga qarshi tizimli, tez ta'sir qiluvchi insektitsid.",
    price: "32 000 so‘m",
    store: "Andijon Hosil Fayz Agro Do'koni",
    location: "Andijon",
    stock: 10,
    badge: "Zararkunandalarga",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 6,
    name: "Koragen 20 SC",
    category: "Insektitsid",
    type: "crop",
    desc: "Pomidor kuyasi (Tuta absoluta), paxta tunlami, meva qurtlari va barg o'rovchilarga qarshi innovatsion preparat.",
    price: "92 000 so‘m",
    store: "Chorva Servis Vet Farm",
    location: "Toshkent",
    stock: 10,
    badge: "Tuta Absoluta",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 7,
    name: "Previkur Enerji 840 SL",
    category: "Fungitsid & Stimulyator",
    type: "crop",
    desc: "Ko'chatlarning ildiz chirish (qora oyoq), pitium va peronosporoz kasalliklariga qarshi fungitsid va ildiz stimulyatori.",
    price: "78 000 so‘m",
    store: "Agro Kimyo Baraka MCHJ",
    location: "Toshkent",
    stock: 10,
    badge: "Ildiz himoyasi",
    badgeIcon: Sprout,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 8,
    name: "Topaz 100 EC",
    category: "Fungitsid",
    type: "crop",
    desc: "Uzum, qulupnay va poliz ekinlaridagi un-shudring (oidium) kasalligini erta bosqichda to'xtatuvchi preparat.",
    price: "38 000 so‘m",
    store: "Dehqon Hamkori Agrovet",
    location: "Samarqand",
    stock: 10,
    badge: "Uzumchilik",
    badgeIcon: Sprout,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 9,
    name: "Kvadris 250 SC",
    category: "Fungitsid",
    type: "crop",
    desc: "Sabzavot ekinlarida kulrang chirish, antraknoz va barg dog'lanishlariga qarshi keng spektrli fungitsid.",
    price: "72 000 so‘m",
    store: "Vodiy Agro Zamin Savdo Markazi",
    location: "Farg‘ona",
    stock: 10,
    badge: "Sabzavotchilik",
    badgeIcon: Sprout,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 10,
    name: "Aktara 25 WG",
    category: "Insektitsid",
    type: "crop",
    desc: "Bargdan purkalganda va tomchilatib sug'orishda tuproq zararkunandalari, shira va burgalarni yo'qotuvchi vosita.",
    price: "28 000 so‘m",
    store: "Buxoro Vet Shifo Markaziy Dorixonasi",
    location: "Buxoro",
    stock: 10,
    badge: "Tomchilatish",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-amber-100/90 text-amber-900 border border-amber-200",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 11,
    name: "Bio-Fungitsid Trixodermin",
    category: "Biologik himoya",
    type: "crop",
    desc: "Tuproqdagi zamburug'li patogenlarga qarshi ekologik toza biologik himoya va hosildorlik oshiruvchi vosita.",
    price: "35 000 so‘m",
    store: "Andijon Hosil Fayz Agro Do'koni",
    location: "Andijon",
    stock: 10,
    badge: "Organik Eko",
    badgeIcon: Sparkles,
    badgeColor: "bg-teal-100/90 text-teal-900 border border-teal-200",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 12,
    name: "Gumat Kaliy + Mikroelementlar",
    category: "Biostimulyator",
    type: "crop",
    desc: "O'simlik ildiz tizimini baquvvat qiluvchi, stresslarga chidamlilikni va hosil sifatini oshiruvchi biostimulyator.",
    price: "22 000 so‘m",
    store: "Chorva Servis Vet Farm",
    location: "Toshkent",
    stock: 10,
    badge: "Yuqori hosil",
    badgeIcon: TrendingUp,
    badgeColor: "bg-blue-100/90 text-blue-900 border border-blue-200",
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 13,
    name: "Ivermektin 1% in'yeksiya",
    category: "Antiparazitar",
    type: "animal",
    desc: "Qoramol, qo'y va echkilardagi oshqozon-ichak gijjalari, o'pka nematodalari, teri osti qurtlari va qichima kanalarga qarshi.",
    price: "38 000 so‘m",
    store: "Agro Kimyo Baraka MCHJ",
    location: "Toshkent",
    stock: 9,
    badge: "Chorvachilik",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 14,
    name: "Enrofloksatsin 10% eritma",
    category: "Antibiotik",
    type: "animal",
    desc: "Buzoq, qo'zichoq va parrandalarning nafas olish hamda oshqozon-ichak infeksiyalariga qarshi keng spektrli antibiotik.",
    price: "42 000 so‘m",
    store: "Dehqon Hamkori Agrovet",
    location: "Samarqand",
    stock: 10,
    badge: "Veterinariya",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 15,
    name: "Oksitetratsiklin LA 200",
    category: "Antibakterial",
    type: "animal",
    desc: "Uzoq muddatli ta'sirga ega kuchli antibiotik. Pnevmoniya, tuyoq chirishi, pasterellyoz va mastitni davolash uchun.",
    price: "56 000 so‘m",
    store: "Vodiy Agro Zamin Savdo Markazi",
    location: "Farg‘ona",
    stock: 10,
    badge: "Uzoq ta'sirli",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 16,
    name: "Penstrep-400 suspenziyasi",
    category: "Antibiotik",
    type: "animal",
    desc: "Bakterial infeksiyalar, jarrohlikdan keyingi yallig'lanishlar va aralash infeksiyalarga qarshi mushak ichiga.",
    price: "49 000 so‘m",
    store: "Buxoro Vet Shifo Markaziy Dorixonasi",
    location: "Buxoro",
    stock: 10,
    badge: "Kompleks",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 17,
    name: "Baytril 5% (Bayer original)",
    category: "Veterinariya",
    type: "animal",
    desc: "Yosh buzoq va parrandalarda salmonellyoz, pasterellyoz, kolibakterioz va mikoplazmozga qarshi samarali vosita.",
    price: "88 000 so‘m",
    store: "Andijon Hosil Fayz Agro Do'koni",
    location: "Andijon",
    stock: 10,
    badge: "Bayer Original",
    badgeIcon: Award,
    badgeColor: "bg-blue-100/90 text-blue-900 border border-blue-200",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 18,
    name: "Butasal-100 (Katozal analogi)",
    category: "Vitamin & Quvvat",
    type: "animal",
    desc: "Moddalar almashinuvini yaxshilovchi, zaiflashgan va tug'ruqdan keyingi hayvonlar quvvatini tiklovchi fosfor va B12 vitamini.",
    price: "74 000 so‘m",
    store: "Chorva Servis Vet Farm",
    location: "Toshkent",
    stock: 10,
    badge: "Metabolik",
    badgeIcon: TrendingUp,
    badgeColor: "bg-amber-100/90 text-amber-900 border border-amber-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 19,
    name: "Multivitamin + Aminokislota kompleksi",
    category: "Vitaminlar",
    type: "animal",
    desc: "Chorva va parrandalar immunitetini ko'tarish, gipovitaminozning oldini olish va o'sishni tezlashtirish uchun.",
    price: "45 000 so‘m",
    store: "Agro Kimyo Baraka MCHJ",
    location: "Toshkent",
    stock: 10,
    badge: "Immunitet",
    badgeIcon: Sparkles,
    badgeColor: "bg-emerald-100/90 text-emerald-900 border border-emerald-200",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 20,
    name: "Albendazol 10% suspenziya",
    category: "Antigelment",
    type: "animal",
    desc: "Chorva mollari va qo'ylardagi jigar parazitlari (fassiolyoz), tasmasimon va yumaloq gijjalarni tozalash uchun og'izdan ichiriladi.",
    price: "26 000 so‘m",
    store: "Dehqon Hamkori Agrovet",
    location: "Samarqand",
    stock: 10,
    badge: "Parazitga qarshi",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 21,
    name: "Mastitsid shprits-tubika",
    category: "Yelin dori",
    type: "animal",
    desc: "Sigirlarning o'tkir va surunkali yelin yallig'lanishi (mastit)ni davolash uchun bevosita yelin ichiga yuboriladi.",
    price: "19 000 so‘m",
    store: "Vodiy Agro Zamin Savdo Markazi",
    location: "Farg‘ona",
    stock: 10,
    badge: "Mastit davosi",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 22,
    name: "Kalsiy Boroglyukonat 20%",
    category: "Mineral eritma",
    type: "animal",
    desc: "Tug'ruqdan keyingi falajlik (parez), gipokalsiyemiya, raxit, suyak zaifligi va intoksikatsiyaga qarshi vena/mushakka.",
    price: "21 000 so‘m",
    store: "Buxoro Vet Shifo Markaziy Dorixonasi",
    location: "Buxoro",
    stock: 10,
    badge: "Mineral",
    badgeIcon: Sparkles,
    badgeColor: "bg-blue-100/90 text-blue-900 border border-blue-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 23,
    name: "Genta-100 (Gentamitsin)",
    category: "Antibiotik",
    type: "animal",
    desc: "Oshqozon-ichak trakti, buyrak va siydik yo'llari bakterial infeksiyalari hamda o'tkir diareyaga qarshi in'yeksiya.",
    price: "34 000 so‘m",
    store: "Andijon Hosil Fayz Agro Do'koni",
    location: "Andijon",
    stock: 10,
    badge: "Diareyaga qarshi",
    badgeIcon: ShieldCheck,
    badgeColor: "bg-rose-100/90 text-rose-900 border border-rose-200",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 24,
    name: "Trikaltsiyfosfat mineral ozuqa",
    category: "Ozuqa qo‘shimchasi",
    type: "animal",
    desc: "Skelet suyaklarini mustahkamlovchi, sut va go'sht mahsuldorligini oshiruvchi tabiiy kaltsiy-fosfor ozuqa qo'shimchasi.",
    price: "18 000 so‘m",
    store: "Chorva Servis Vet Farm",
    location: "Toshkent",
    stock: 10,
    badge: "Suyak & Quvvat",
    badgeIcon: TrendingUp,
    badgeColor: "bg-amber-100/90 text-amber-900 border border-amber-200",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80",
  },
];

// Bazadagi haqiqiy tasdiqlangan 6 nafar mutaxassis
const REAL_SPECIALISTS = [
  {
    id: 7,
    name: "Dr. Alisher Qodirov",
    role: "Bosh agronom, O‘simliklar himoyasi bo‘yicha ekspert",
    specialty: "Pomidor, bodring, paxta va g‘alla ekinlari zararkunandalari hamda zamburug‘li kasalliklarini aniqlash va davolash.",
    education: "Toshkent Davlat Agrar Universiteti (TDAU), Magistr",
    exp: "15 yillik tajriba",
    rating: "5.0",
    reviews: "14",
    phone: "+998901002030",
    region: "Toshkent sh., Chilonzor",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: 8,
    name: "Rustam Mahmudov",
    role: "Veterinariya fanlari nomzodi, Katta chorva shifokori",
    specialty: "Qoramol va mayda tuyoqli mollar yuqumli kasalliklari, o‘tkir mastit, tuyoq kasalliklari va emlash rejasini tuzish.",
    education: "Samarqand Davlat Veterinariya Meditsinasi Universiteti",
    exp: "18 yillik tajriba",
    rating: "5.0",
    reviews: "18",
    phone: "+998912003040",
    region: "Samarqand sh.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: 9,
    name: "Gulnoza Usmonova",
    role: "Fitopatolog, Bog‘dorchilik va tokchilik mutaxassisi",
    specialty: "Mevali bog‘lar (olma, shaftoli, o‘rik, gilos) va tokzorlar kasalliklarini erta aniqlash, biologik kurash.",
    education: "Toshkent Davlat Agrar Universiteti, Aspirantura",
    exp: "11 yillik tajriba",
    rating: "4.9",
    reviews: "12",
    phone: "+998933004050",
    region: "Farg‘ona sh.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: 10,
    name: "Jahongir To‘xtayev",
    role: "Tuproqshunos-agrokimyogar",
    specialty: "Tuproq sho‘rlanishini kamaytirish, ekin maydonlari ozuqa balansini hisoblash, mineral va organik o‘g‘itlar me'yori.",
    education: "O‘zbekiston Milliy Universiteti, Tuproqshunoslik",
    exp: "8 yillik tajriba",
    rating: "4.9",
    reviews: "9",
    phone: "+998944005060",
    region: "Buxoro sh.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: 11,
    name: "Dilshodbek Ergashev",
    role: "Parrandachilik va quyonchilik veterinari",
    specialty: "Broyler tovuqlar va tuxum yo‘nalishidagi parrandalar profilaktikasi, vaksina yuborish sxemalari va inkubatsiya.",
    education: "Andijon Qishloq Xo‘jaligi va Agrotexnologiyalar Instituti",
    exp: "9 yillik tajriba",
    rating: "4.8",
    reviews: "8",
    phone: "+998955006070",
    region: "Andijon sh.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
  },
  {
    id: 12,
    name: "Nodira Karimova",
    role: "Issiqxona agronom-konsultanti (Gidroponika)",
    specialty: "Zamonaviy issiqxonalarda pomidor, bodring yetishtirish, iqlim kompyuterini boshqarish va tomchilatib oziqlantirish.",
    education: "Ege University (Turkiya), Agronomiya fakulteti",
    exp: "7 yillik tajriba",
    rating: "4.9",
    reviews: "11",
    phone: "+998977008090",
    region: "Toshkent vil., Qibray",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80",
  },
];

// Bazadagi haqiqiy tasdiqlangan 6 ta hamkor agro-dorixona
const REAL_PHARMACIES = [
  {
    id: 1,
    name: "Baraka Agro Ta'minot",
    org: "Agro Kimyo Baraka MCHJ",
    region: "Toshkent viloyati, Zangiota",
    address: "Bo'zsuv MFY, 12-uy",
    phone: "+998 90 111 22 33",
    experience: "10 yillik tajriba",
    type: "O‘simliklar himoyasi & Urug‘lar",
  },
  {
    id: 2,
    name: "Dehqon Hamkori Do'koni",
    org: "Dehqon Hamkori Agrovet",
    region: "Samarqand sh.",
    address: "Mirzo Ulug'bek ko'chasi, 45-uy",
    phone: "+998 91 222 33 44",
    experience: "14 yillik tajriba",
    type: "Universal (Ekin & Chorva)",
  },
  {
    id: 3,
    name: "Vodiy Agro Zamin",
    org: "Vodiy Agro Zamin Savdo Markazi",
    region: "Farg‘ona sh.",
    address: "Al-Farg'oniy shoh ko'chasi, 89-uy",
    phone: "+998 93 333 44 55",
    experience: "8 yillik tajriba",
    type: "Fungitsid, O‘g‘it & Biostimulyator",
  },
  {
    id: 4,
    name: "Buxoro Vet Shifo",
    org: "Buxoro Vet Shifo Markaziy Dorixonasi",
    region: "Buxoro sh.",
    address: "Bahouddin Naqshband ko'chasi, 102-uy",
    phone: "+998 94 444 55 66",
    experience: "12 yillik tajriba",
    type: "Veterinariya & Vaksinalar",
  },
  {
    id: 5,
    name: "Andijon Hosil Fayz",
    org: "Andijon Hosil Fayz Agro Do'koni",
    region: "Andijon sh.",
    address: "Bobur shoh ko'chasi, 34-uy",
    phone: "+998 95 555 66 77",
    experience: "9 yillik tajriba",
    type: "Insektitsid & Bio-preparatlar",
  },
  {
    id: 6,
    name: "Chorva Salomatligi VetDorixona",
    org: "Chorva Servis Vet Farm",
    region: "Toshkent sh., Sergeli",
    address: "Yangi Sergeli ko'chasi, 18-uy",
    phone: "+998 97 777 88 99",
    experience: "16 yillik tajriba",
    type: "Chorva preparatlari & Premikslar",
  },
];

export default function MainWebLanding() {
  const { lang, t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showAllProducts, setShowAllProducts] = useState<boolean>(false);

  // Haqiqiy shaffof statistika (baza ko'rsatkichlari)
  const [stats, setStats] = useState({
    users: 4,
    pharmacies: 6,
    specialists: 6,
    medicines: 24,
    regions: 5,
  });

  const [products, setProducts] = useState(REAL_PRODUCTS);
  const [specialistsList, setSpecialistsList] = useState(REAL_SPECIALISTS);

  useEffect(() => {
    // 1. Shaffof statistika yuklash
    apiFetch("/api/web/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) {
          setStats({
            users: Number(d.users ?? 4),
            pharmacies: Number(d.pharmacies ?? 6),
            specialists: Number(d.specialists ?? 6),
            medicines: Number(d.medicines ?? 24),
            regions: Number(d.regions ?? 5),
          });
        }
      })
      .catch(() => {});

    // 2. Jonli dorilar ro'yxatini yuklash
    apiFetch("/api/medicines?limit=24")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        if (items.length > 0) {
          const mapped = items.map((m: any, idx: number) => {
            const isCrop = m.type === "crop";
            return {
              id: m.id ?? idx + 1,
              name: m.name,
              category: isCrop ? "Agro preparat" : "Veterinariya",
              type: isCrop ? "crop" : "animal",
              desc: m.usage || "Sertifikatlangan yuqori samarali vosita",
              price: m.price ? `${Number(m.price).toLocaleString()} so‘m` : "Kelishilgan",
              store: m.pharmacyName || "Agro Dorixona",
              location: m.pharmacyAddress ? m.pharmacyAddress.split(",")[0] : "O‘zbekiston",
              stock: m.stock ?? 10,
              badge: isCrop ? "Ekin himoyasi" : "Chorva salomatligi",
              badgeIcon: isCrop ? Sprout : ShieldCheck,
              badgeColor: isCrop
                ? "bg-emerald-100/90 text-emerald-900 border border-emerald-200"
                : "bg-rose-100/90 text-rose-900 border border-rose-200",
              image: REAL_PRODUCTS[idx % REAL_PRODUCTS.length]?.image || "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80",
            };
          });
          setProducts(mapped);
        }
      })
      .catch(() => {});

    // 3. Jonli mutaxassislar ro'yxatini yuklash
    apiFetch("/api/specialists?role=specialist")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        if (items.length > 0) {
          const mapped = items.map((s: any, idx: number) => ({
            id: s.id ?? idx + 1,
            name: s.name,
            role: s.specialty || "Agro mutaxassis",
            specialty: s.bio || s.education || "Malakali agro/veterinar konsultant",
            education: s.education || "Oliy ma'lumotli agronom",
            exp: s.experienceYears ? `${s.experienceYears} yillik tajriba` : "Ko‘p yillik tajriba",
            rating: s.ratingAvg ? Number(s.ratingAvg).toFixed(1) : "5.0",
            reviews: s.ratingCount ? String(s.ratingCount) : "10+",
            phone: s.phone || "+998901002030",
            region: s.address ? s.address.split(",")[0] : "O‘zbekiston",
            avatar: REAL_SPECIALISTS[idx % REAL_SPECIALISTS.length]?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80",
          }));
          setSpecialistsList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const filteredProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.type === activeCategory);

  const visibleProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 8);


  const faqs = [
    {
      q: lang === "ru"
        ? "Что такое AgrozGO и чем платформа полезна фермерам?"
        : lang === "en"
        ? "What is AgrozGO and how does it help farmers?"
        : lang === "kk"
        ? "AgrozGO деген не және ол фермерлерге қалай көмектеседі?"
        : lang === "ky"
        ? "AgrozGO деген эмне жана ал дыйкандарга кандай жардам берет?"
        : lang === "tg"
        ? "AgrozGO чист ва он ба деҳқонон чӣ гуна кӯмак мекунад?"
        : "AgrozGO nima va u dehqon hamda fermerlarga qanday yordam beradi?",
      a: lang === "ru"
        ? "AgrozGO — единая агротехнологическая платформа Узбекистана. Вы можете покупать сертифицированные препараты в ближайших аптеках, вызывать проверенных агрономов и ветеринаров в поле, определять болезни растений за 5 секунд через ИИ и следить за специализированной агро-погодой."
        : lang === "en"
        ? "AgrozGO is Uzbekistan's unified agritech platform. You can buy certified crop/animal medicines from nearby pharmacies, dispatch agronomists and vets to your field, diagnose diseases in 5 seconds via AI, and receive real-time agro-weather alerts."
        : lang === "kk"
        ? "AgrozGO — Өзбекстанның бірыңғай агротехнологиялық платформасы. Жақын дәріханалардан дәрі-дәрмектерді салыстырып сатып алуға, егістікке агроном немесе ветеринар шақыруға, ИИ арқылы 5 секундта дертті анықтауға болады."
        : lang === "ky"
        ? "AgrozGO — Өзбекстандын бирдиктүү агротехнологиялык платформасы. Сиз жакын дарыканалардан дарыларды сатып ала аласыз, талаага адис чакыра аласыз жана 5 секундда ИИ аркылуу ооруларды аныктай аласыз."
        : lang === "tg"
        ? "AgrozGO — платформаи ягонаи агротехнологии Ӯзбекистон мебошад. Шумо метавонед аз дорухонаҳои наздик доруҳоро харед, мутахассисро ба саҳро даъват кунед ва тавассути ИИ дар 5 сония ташхис гузоред."
        : "AgrozGO — O‘zbekistondagi yagona agrotexnologik platforma. Siz uning yordamida eng yaqin dorixonalardan sertifikatlangan dori va o‘g‘itlarni xarid qilishingiz, agronom va veterinarlarni dalangizga chaqirishingiz, 5 soniyada AI bilan kasallikni aniqlashingiz va hududiy agro ob-havoni kuzatishingiz mumkin.",
    },
    {
      q: lang === "ru"
        ? "Как вызвать агронома или ветеринара прямо на поле?"
        : lang === "en"
        ? "How can I call an agronomist or veterinarian to my field?"
        : lang === "kk"
        ? "Агрономды немесе ветеринарды егістікке қалай шақыруға болады?"
        : lang === "ky"
        ? "Агрономду же ветеринарды талаага кантип чакырса болот?"
        : lang === "tg"
        ? "Чӣ тавр агроном ё ветеринарро бевосита ба саҳро даъват кардан мумкин аст?"
        : "Agronom yoki veterinar mutaxassisini dalaga qanday chaqirish mumkin?",
      a: lang === "ru"
        ? "В разделе «Мутахассислар» выберите профиль подходящего эксперта и нажмите «Вызвать специалиста». Специалист согласует время и приедет прямо на ваш участок или ферму."
        : lang === "en"
        ? "Go to the 'Specialists' section, select a qualified expert profile, and click 'Call specialist'. The expert will confirm the time and visit your farm directly."
        : lang === "kk"
        ? "«Мамандар» бөлімінде қажетті маманды таңдап, «Маман шақыру» түймесін басыңыз. Маман сізбен хабарласып, егістікке немесе фермаға келеді."
        : lang === "ky"
        ? "«Адистер» бөлүмүнөн ылайыктуу адисти тандап, «Адис чакыруу» баскычын басыңыз. Адис сиз менен байланышып, чарбаңызга барат."
        : lang === "tg"
        ? "Дар бахши «Мутахассисон» коршиноси мувофиқро интихоб карда, тугмаи «Даъвати мутахассис»-ро пахш намоед. Мутахассис бо шумо тамос гирифта, ба саҳро меояд."
        : "«Mutaxassislar» bo‘limida o‘zingizga ma’qul mutaxassisni tanlang va «Mutaxassis chaqirish» tugmasini bosing. Mutaxassis siz bilan bog‘lanadi va belgilangan vaqtda dalangiz yoki fermangizga yetib boradi.",
    },
    {
      q: lang === "ru"
        ? "Действительно ли Agroz Business бесплатен?"
        : lang === "en"
        ? "Is Agroz Business really free of charge?"
        : lang === "kk"
        ? "Agroz Business жүйесі шынымен тегін бе?"
        : lang === "ky"
        ? "Agroz Business тутуму чын эле акысызбы?"
        : lang === "tg"
        ? "Оё истифодаи Agroz Business дар ҳақиқат ройгон аст?"
        : "Agroz Business tizimidan foydalanish haqiqatan ham bepulmi?",
      a: lang === "ru"
        ? "Да, сейчас платформа находится в периоде БЕТА-тестирования. Первые 50 партнерских агроаптек получают долговую книгу, кассу, склад и онлайн-заказы бесплатно (0 сум)."
        : lang === "en"
        ? "Yes, the platform is currently in BETA. The first 50 partner agro-pharmacies receive the debt ledger, POS, warehouse control, and online orders completely free ($0)."
        : lang === "kk"
        ? "Иә, қазір платформа БЕТА сынақ кезеңінде. Алғашқы 50 серіктес дүкен қарыз дәптері, касса, қойма және онлайн тапсырыстарды мүлдем тегін пайдаланады."
        : lang === "ky"
        ? "Ооба, азыр платформа БЕТА сыноо мезгилинде. Алгачкы 50 өнөктөш дүкөн карыз китебин, касса жана кампаны акысыз пайдалана алышат."
        : lang === "tg"
        ? "Бале, ҳоло платформа дар давраи озмоишии БЕТА қарор дорад. 50 мағозаи аввалини агро дафтари қарз, хазина ва анборро комилан ройгон дастрас мекунанд."
        : "Ha, hozirda platforma BETA sinov davrida. Dastlabki 50 ta hamkor dorixona va agro-do‘kon uchun Qarz daftari, kassa, ombor va onlayn buyurtmalar mutlaqo bepul (0 so‘m) taqdim etiladi.",
    },
    {
      q: lang === "ru"
        ? "Безопасно ли хранятся данные магазина, кассы и склада?"
        : lang === "en"
        ? "Are store, POS, inventory, and debt ledger records stored securely?"
        : lang === "kk"
        ? "Дүкен, касса, қойма және қарыз дәптерінің деректері қауіпсіз сақтала ма?"
        : lang === "ky"
        ? "Дүкөн, касса, кампа жана карыз китебинин маалыматтары коопсуз сакталабы?"
        : lang === "tg"
        ? "Оё маълумоти мағоза, хазина, анбор ва дафтари қарз бехатар нигоҳ дошта мешавад?"
        : "Agroz Business kassa, ombor va nasiya ma'lumotlari xavfsiz saqlanadimi?",
      a: lang === "ru"
        ? "На 100% безопасно. Ваши данные кассы, остатков склада и расчетов хранятся на зашифрованных облачных серверах. Они не потеряются как бумажная тетрадь. Ни один другой магазин не имеет доступа к вашей бухгалтерии и клиентуре."
        : lang === "en"
        ? "100% secure. Your POS sales, inventory records, and customer accounts are encrypted and safely backed up on cloud servers. No other store can ever access your business data."
        : lang === "kk"
        ? "100% қауіпсіз. Кассалық саудаңыз, қойма қалдықтарыңыз бен есептеріңіз шифрланған бұлтты серверлерде сақталады. Қағаз дәптердей жоғалмайды, басқа ешбір дүкен деректеріңізді көре алмайды."
        : lang === "ky"
        ? "100% коопсуз. Касса, кампа жана эсептериңиз булут серверлеринде шифрланып сакталат. Эч бир башка дүкөн сиздин эсептериңизди көрө албайт."
        : lang === "tg"
        ? "100% бехатар. Маълумоти хазина, анбор ва дафтари қарз дар серверҳои абрии рамзгузоришуда нигоҳ дошта шуда, ба ҳеҷ кас дастрас нест."
        : "100% xavfsiz. Kunlik kassa savdolaringiz, ombor qoldiqlari, oylik hisobotlar va mijozlar hisobi shifrlangan bulutli serverda saqlanadi. Qog‘oz daftar kabi yo‘qolmaydi, yirtilmaydi yoki suv tegib o‘chib ketmaydi. Boshqa hech bir do‘kon sizning ma'lumotlaringizni ko‘ra olmaydi.",
    },
    {
      q: lang === "ru"
        ? "Сколько времени занимает подключение магазина?"
        : lang === "en"
        ? "How long does it take to connect a store?"
        : lang === "kk"
        ? "Дүкенді қосу қанша уақыт алады?"
        : lang === "ky"
        ? "Дүкөндү туташтыруу канча убакытты алат?"
        : lang === "tg"
        ? "Пайваст кардани мағоза чӣ қадар вақт мегирад?"
        : "Do‘konimni ulash uchun qancha vaqt ketadi?",
      a: lang === "ru"
        ? "Всего 1 минуту! На странице «Подключить магазин» введите название и телефон, подтвердите через Telegram — и личный бизнес-кабинет готов к работе."
        : lang === "en"
        ? "Just 1 minute! On the 'Connect store' page, enter your business name and phone, confirm with Telegram, and your business cabinet is immediately activated."
        : lang === "kk"
        ? "Бар болғаны 1 минут! «Дүкенді қосу» бетінде атау мен телефонды енгізіп, Telegram арқылы растасаңыз, жеке кабинет бірден іске қосылады."
        : lang === "ky"
        ? "Болгону 1 мүнөт! Аталышын жана телефонду киргизип, Telegram аркылуу тастыктасаңыз, кабинет дароо ишке кирет."
        : lang === "tg"
        ? "Ҳамагӣ 1 дақиқа! Номи мағоза ва рақами худро ворид карда, тавассути Telegram тасдиқ кунед — кабинет фавран омода мешавад."
        : "Atigi 1 daqiqa! «Do‘konni ulash» sahifasida nomingiz va telefoningizni kiritib, Telegram orqali bitta tasdiqlash tugmasini bossangiz bas — shaxsiy biznes kabinetingiz darhol ishga tushadi.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#191B1F] antialiased selection:bg-amber-200 selection:text-amber-950 font-sans">
      {/* =========================================================================
          1. HERO SECTION (Apple aesthetics + Agroton template)
          ========================================================================= */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Chap ustun: Asosiy Sarlavha, Paragraf, Qora Pill CTA, 3 ta Metrika kartasi */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl sm:text-5xl lg:text-[58px] xl:text-[62px] font-extrabold text-[#191B1F] leading-[1.12] tracking-tight">
              {t.hero.title_p1} <br />
              <span className="font-light text-zinc-400">{t.hero.title_p2}</span> <br />
              {t.hero.title_p3}
            </h1>

            <p className="text-sm sm:text-base text-zinc-600 max-w-xl leading-relaxed">
              {t.hero.desc}
            </p>

            {/* Harakat Tugmalari: 1-to-1 template uslubidagi CTA tugmalar */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/agrozgo"
                className="inline-flex items-center gap-3 bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-semibold pl-6 pr-2 py-2 rounded-full transition-all shadow-md shadow-black/10 active:scale-95 group"
              >
                <span>AgrozGO Ilovasi</span>
                <span className="w-8 h-8 rounded-full bg-amber-400 text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0">
                  <ArrowUpRight size={16} strokeWidth={2.5} />
                </span>
              </Link>
              <Link
                href="/hamkorlik"
                className="inline-flex items-center justify-center gap-2 bg-[#F4F1EA] hover:bg-[#eae6dc] text-[#191B1F] border border-black/8 text-xs sm:text-sm font-semibold px-6 py-3.5 rounded-full transition-all active:scale-95 shadow-2xs"
              >
                <span>Do‘konni ulash</span>
              </Link>
            </div>

            {/* Pastki Chap: 4 ta Haqiqiy Shaffof Metrika kartochkasi */}
            <div className="pt-6 sm:pt-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">{stats.pharmacies} ta</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Agro-dorixonalar<br/><span className="text-[10px] text-zinc-400 font-normal">5 ta viloyatda</span>
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">{stats.specialists} nafar</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Agronom & Veterinar<br/><span className="text-[10px] text-zinc-400 font-normal">Malakali mutaxassis</span>
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">{stats.medicines} ta</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Sertifikatlangan dori<br/><span className="text-[10px] text-zinc-400 font-normal">Ekin & chorva preparati</span>
                </div>
              </div>

              <div className="bg-[#F4F1EA] rounded-2xl p-3 sm:p-4 border border-black/5 text-left">
                <div className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">{stats.users} ta</div>
                <div className="text-[11px] font-semibold text-zinc-600 mt-0.5 leading-tight">
                  Foydalanuvchi<br/><span className="text-[10px] text-zinc-400 font-normal">Tizimda faol ro‘yxatda</span>
                </div>
              </div>
            </div>
          </div>

          {/* O'ng ustun: Bug'doyzor foni va pastki o'ngdagi suzuvchi qora karta */}
          <div className="lg:col-span-5 relative flex justify-end">
            <div className="relative w-full aspect-4/5 sm:aspect-square max-h-[520px] rounded-[36px] overflow-hidden shadow-xl border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"
                alt="Golden wheat harvest"
                loading="lazy"
                className="w-full h-full object-cover"
              />

              {/* Gradient qorong'ulik */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Pastki o'ng suzuvchi qora karta */}
              <div className="absolute bottom-5 right-5 left-5 sm:left-auto sm:w-72 bg-[#1E2024]/95 backdrop-blur-md text-white p-4 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-xs font-semibold leading-snug text-zinc-200">
                    {t.hero.leader_card_text}
                  </p>
                  <Link
                    href="/agrozgo"
                    className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 hover:scale-105 transition"
                    aria-label="AgrozGO Ilovasi"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                </div>

                {/* Ichki kichik foto */}
                <div className="w-full h-24 rounded-2xl overflow-hidden border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=400&q=80"
                    alt="Agro silos and field"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          IMKONIYATLAR: Agroz Platformasi berayotgan to'liq imkoniyatlar (Left-aligned cards)
          ========================================================================= */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
              <Sparkles size={13} className="text-emerald-700" />
              <span>AgrozGO Ekotizimi</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight">
              Biz berayotgan to‘liq imkoniyatlar
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 max-w-2xl leading-relaxed">
              AgrozGO — qishloq xo‘jaligi mahsulotlarini sotib olish, mutaxassis chaqirish, AI diagnostika va do‘kon boshqaruvini yagona raqamli tizimda taqdim etadi.
            </p>
          </div>

          <Link
            href="/agrozgo"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 group shrink-0"
          >
            <span>Ilovani ochish</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 5 ta Imkoniyat Kartochkasi (Left-aligned, Apple clean cards) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Agro Bozor */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <ShoppingCart size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-1.5">
                Agro Bozor & Onlayn Savat
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Platformadagi {stats.pharmacies} ta sertifikatlangan agro-dorixona, {stats.medicines} ta sifatli dori va o‘g‘itlar, bio-preparatlar hamda urug‘larni to‘g‘ridan-to‘g‘ri ko‘ring va buyurtma bering.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700">100% Sertifikatlangan</span>
              <Link href="/agrozgo#bozor" className="text-xs font-bold text-zinc-900 hover:text-emerald-700 flex items-center gap-1">
                <span>Ko‘rish</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 2. Mutaxassislar */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Users size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-1.5">
                Agronom & Veterinar Chaqirish
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Ekin kasalliklari yoki chorva parvarishida malakali mutaxassisni bevosita dalangiz yoki fermangizga onlayn chaqiring.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700">Dalaga tezkor yetib borish</span>
              <Link href="/agrozgo#mutaxassislar" className="text-xs font-bold text-zinc-900 hover:text-blue-700 flex items-center gap-1">
                <span>Ekspertlar</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 3. AI Diagnostika */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Sparkles size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-1.5">
                AI Agro-Diagnostika (5 soniya)
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Kasal barg, meva yoki hayvon belgisini suratga olib yuklang — sun’iy intellekt darhol kasallik nomi va O‘zbekiston bozoridagi dorisini chiqarib beradi.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-700">Tezkor tahlil</span>
              <Link href="/tashxis" className="text-xs font-bold text-zinc-900 hover:text-purple-700 flex items-center gap-1">
                <span>Tashxis qo‘yish</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 4. Ob-havo */}
          <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <CloudSun size={20} />
              </div>
              <h3 className="text-base font-extrabold text-[#191B1F] mb-1.5">
                Hududiy Agro Ob-havo
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Shamol tezligi, tuproq harorati, namlik va sovuq urish xavfi haqida ogohlantirishlar hamda purkash uchun qulay soatlar tavsiyasi.
              </p>
            </div>
            <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700">Haqiqiy vaqt rejimi</span>
              <Link href="/agrozgo#ob-havo" className="text-xs font-bold text-zinc-900 hover:text-amber-700 flex items-center gap-1">
                <span>Ob-havo</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 5. Agroz Business: To'liq boshqaruv ekotizimi */}
          <div className="bg-[#191B1F] text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between text-left sm:col-span-2 lg:col-span-2 group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center">
                  <Store size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  Agroz Business ERP
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-2">
                Agro-dorixonalar uchun to‘liq boshqaruv ekotizimi
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl mb-5">
                Qarz daftari bilan cheklanib qolmang. Kunlik kassa, tovarlar ombori, oylik moliyaviy hisobotlar va mijozlar hisob-kitobini yagona xavfsiz bulutda boshqaring.
              </p>

              {/* 4 ta asosiy modul */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 pb-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                    <Receipt size={14} />
                    <span>Kunlik Kassa</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Har bir savdoni qayd etish, naqd va karta tushumi nazorati
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Package size={14} />
                    <span>Ombor qoldiqlari</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Dori turlari, kelish/sotish narxi va yaroqlilik muddatlari
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1">
                    <BarChart3 size={14} />
                    <span>Oylik hisobotlar</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Savdo aylanmasi, sof foyda va xarajatlar tahlili
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold mb-1">
                    <BookOpen size={14} />
                    <span>Mijozlar & Nasiya</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Qog‘oz daftarsiz, shifrlangan bulutli qarz hisob-kitobi
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-amber-400">BETA 0 so‘m • 1 daqiqada ulanish</span>
              <Link href="/hamkorlik" className="text-xs font-bold bg-amber-400 text-black px-5 py-2.5 rounded-full hover:bg-amber-300 transition flex items-center gap-2 shadow-sm">
                <span>Do‘konni ulash</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SECTION 2: AGROZGO O‘ZI NIMA VA U KIMLAR UCHUN?
          ========================================================================= */}
      <section id="about" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24 border-t border-black/5">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            <Sparkles size={13} className="text-emerald-700" />
            <span>{t.story1.tag}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight">
            {t.story1.title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-2xl mx-auto">
            {t.story1.p1}
          </p>
        </div>

        {/* 3 ta Kategoriya Kartochkasi (Apple clean cards, uniform, left-aligned) */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. Dehqon va Fermerlar */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/5 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Sprout size={24} />
              </div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                {lang === "ru" ? "Для фермеров" : lang === "en" ? "For Farmers" : "Fermerlar uchun"}
              </div>
              <h3 className="text-lg font-extrabold text-[#191B1F] mb-3">
                {lang === "ru" ? "Дехкане и Фермеры" : lang === "en" ? "Farmers & Growers" : "Dehqon va Fermerlar"}
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Покупка сертифицированных препаратов из проверенных аптек" : lang === "en" ? "Certified crop & livestock inputs from nearby verified pharmacies" : "Yaqin dorixonalardan sertifikatlangan dori va o‘g‘itlar xaridi"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Вызов агронома и ветеринара прямо на поле или ферму" : lang === "en" ? "Direct on-field visits by qualified agronomists and veterinarians" : "Agronom va veterinarlarni to‘g‘ridan-to‘g‘ri dalaga chaqirish"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Определение болезней растений и скота за 5 секунд через ИИ" : lang === "en" ? "5-second AI diagnosis for crop diseases and livestock symptoms" : "5 soniyada AI bilan o‘simlik yoki chorva kasalligini aniqlash"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Агро-погода: скорость ветра, температура почвы и часы опрыскивания" : lang === "en" ? "Hyperlocal agro-weather: wind, soil temp, and spray window forecasts" : "Shamol, tuproq harorati va dori purkashga qulay agro ob-havo"}</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700">AgrozGO Ilovasi</span>
              <Link href="/agrozgo" className="text-xs font-bold text-zinc-900 hover:text-emerald-700 flex items-center gap-1.5">
                <span>{lang === "ru" ? "Открыть" : lang === "en" ? "Open app" : "Ilovani ochish"}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 2. Agro-dorixonalar (Agroz Business) */}
          <div className="bg-[#191B1F] text-white rounded-3xl p-6 sm:p-7 shadow-xl hover:border-amber-400/50 transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center mb-5">
                <Store size={24} />
              </div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Agroz Business
              </div>
              <h3 className="text-lg font-extrabold text-white mb-3">
                {lang === "ru" ? "Агроаптеки и Магазины" : lang === "en" ? "Agro-Pharmacies & Shops" : "Agro-dorixonalar & Do‘konlar"}
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>{lang === "ru" ? "Касса и POS:" : lang === "en" ? "Daily POS:" : "Kunlik Kassa:"}</strong> {lang === "ru" ? "фиксация продаж, учет наличных и карточных оплат" : lang === "en" ? "fast sales recording, cash & card split" : "har bir savdoni qayd etish, naqd va karta tushumi"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>{lang === "ru" ? "Склад:" : lang === "en" ? "Inventory:" : "Ombor qoldiqlari:"}</strong> {lang === "ru" ? "остатки препаратов, цены прихода/продажи, сроки годности" : lang === "en" ? "stock levels, cost/selling prices, expiration alerts" : "dori qoldiqlari, kelish/sotish narxlari va muddatlari"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>{lang === "ru" ? "Отчеты:" : lang === "en" ? "Reports:" : "Oylik hisobotlar:"}</strong> {lang === "ru" ? "месячный оборот, чистая прибыль и аналитика расходов" : lang === "en" ? "monthly turnover, net profit, and expense analytics" : "savdo aylanmasi, sof foyda va xarajatlar tahlili"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>{lang === "ru" ? "Долги:" : lang === "en" ? "Debt Ledger:" : "Nasiya daftari:"}</strong> {lang === "ru" ? "зашифрованная облачная книга долгов вместо бумаги" : lang === "en" ? "encrypted private cloud debt ledger instead of paper" : "qog‘oz daftarsiz xavfsiz shifrlangan bulutli qarzlar"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>{lang === "ru" ? "Заказы:" : lang === "en" ? "Orders:" : "Onlayn buyurtmalar:"}</strong> {lang === "ru" ? "прием заказов из приложения AgrozGO" : lang === "en" ? "receive incoming orders from farmers on AgrozGO" : "AgrozGO ilovasidan yangi xaridorlar oqimi"}</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400">BETA 0 so‘m</span>
              <Link href="/hamkorlik" className="text-xs font-bold bg-amber-400 text-black px-4 py-2 rounded-full hover:bg-amber-300 transition flex items-center gap-1.5 shadow-sm">
                <span>{lang === "ru" ? "Подключить" : lang === "en" ? "Connect" : "Do‘konni ulash"}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* 3. Agronom va Veterinarlar */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-black/5 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all flex flex-col justify-between text-left group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-5 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Users size={24} />
              </div>
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">
                {lang === "ru" ? "Для экспертов" : lang === "en" ? "For Specialists" : "Mutaxassislar uchun"}
              </div>
              <h3 className="text-lg font-extrabold text-[#191B1F] mb-3">
                {lang === "ru" ? "Агрономы и Ветеринары" : lang === "en" ? "Agronomists & Vets" : "Agronom va Veterinarlar"}
              </h3>
              <ul className="space-y-2.5 text-xs text-zinc-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Получение вызовов на поля от фермеров своего района" : lang === "en" ? "Receive field dispatch requests from farmers in your region" : "O‘z viloyati va tumanida fermerlardan dala chaqiruvlarini olish"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Создание профессионального профиля и отзывов клиентов" : lang === "en" ? "Build a verified expert profile, ratings, and client reviews" : "Kasbiy profil, mijozlar sharhlari va reytingni shakllantirish"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Заработок на платных выездах и экспертных консультациях" : lang === "en" ? "Earn income through paid field inspections and consultations" : "Dala ko‘riklari va professional maslahatlar orqali daromad topish"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Статус официального эксперта в экосистеме AgrozGO" : lang === "en" ? "Official accredited specialist status in AgrozGO" : "AgrozGO rasmiy agro-maslahatchilar tarmog‘iga a'zo bo‘lish"}</span>
                </li>
              </ul>
            </div>
            <div className="pt-6 mt-5 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700">Hamkorlik</span>
              <Link href="/hamkorlik" className="text-xs font-bold text-zinc-900 hover:text-blue-700 flex items-center gap-1.5">
                <span>{lang === "ru" ? "Регистрация" : lang === "en" ? "Register" : "Profil ochish"}</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SECTION 3: DARK BENTO BOX
          ========================================================================= */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#1E2024] text-white rounded-[36px] sm:rounded-[48px] p-6 sm:p-10 lg:p-12 shadow-2xl border border-white/10">
          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            {/* Chap tomon: Sales by locations & 3 Stat Pills */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {t.bento.title}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">{t.bento.subtitle}</p>
              </div>

              {/* Viloyatlar bo'yicha haqiqiy taqsimot */}
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_tashkent}</span>
                    <span className="text-amber-400 font-bold">2 ta dorixona • 2 mutaxassis</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[100%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_fergana}</span>
                    <span className="text-amber-400 font-bold">2 ta dorixona • 2 mutaxassis</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[100%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_samarkand}</span>
                    <span className="text-amber-400 font-bold">1 ta dorixona • 1 mutaxassis</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[65%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-300 font-semibold">
                    <span>{t.bento.reg_bukhara}</span>
                    <span className="text-amber-400 font-bold">1 ta dorixona • 1 mutaxassis</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[65%]" />
                  </div>
                </div>
              </div>

              {/* 3 ta pastki oq/krem pill statslar: Aniq va Shaffof ko'rsatkichlar */}
              <div className="grid grid-cols-3 gap-2.5 pt-4">
                <div className="bg-[#F8F6F0] text-[#191B1F] p-3 rounded-2xl text-left">
                  <div className="text-xs sm:text-sm font-black">{stats.medicines} ta</div>
                  <div className="text-[9px] text-zinc-600 font-medium mt-0.5">{t.bento.stat_export}</div>
                </div>
                <div className="bg-[#F8F6F0] text-[#191B1F] p-3 rounded-2xl text-left">
                  <div className="text-xs sm:text-sm font-black">{stats.pharmacies} ta</div>
                  <div className="text-[9px] text-zinc-600 font-medium mt-0.5">{t.bento.stat_yield}</div>
                </div>
                <div className="bg-[#F8F6F0] text-[#191B1F] p-3 rounded-2xl text-left">
                  <div className="text-xs sm:text-sm font-black">{stats.specialists} nafar</div>
                  <div className="text-[9px] text-zinc-600 font-medium mt-0.5">Tasdiqlangan mutaxassis</div>
                </div>
              </div>
            </div>

            {/* O'ng tomon: Oq grafik kartasi va Sariq "Join Our team" kartasi */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              {/* Oq karta: Agroz Business Real-time Boshqaruv Paneli */}
              <div className="bg-white text-[#191B1F] rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-200 px-2.5 py-0.5 rounded-full mb-1">
                      <Store size={12} className="text-amber-700" />
                      <span>Agroz Business Dashboard</span>
                    </div>
                    <h4 className="text-base font-extrabold text-[#191B1F]">
                      {lang === "ru"
                        ? "Панель управления агроаптекой"
                        : lang === "en"
                        ? "Agro-Pharmacy Management Dashboard"
                        : "Agro-dorixona boshqaruv paneli"}
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {lang === "ru"
                        ? "Касса, остатки на складе, аналитика и расчеты в реальном времени"
                        : lang === "en"
                        ? "Real-time POS, inventory balances, analytics, and debt tracking"
                        : "Haqiqiy vaqt rejimida kassa, ombor qoldiqlari, tahlil va hisob-kitoblar"}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0">
                    BETA: 0 so‘m
                  </span>
                </div>

                {/* 4 ta asosiy Modul Ko'rsatkichlari */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-5 border-b border-zinc-100">
                  {/* 1. Kassa */}
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <div className="text-[10px] text-zinc-500 font-semibold leading-tight">
                      {lang === "ru" ? "Касса сегодня" : lang === "en" ? "Today's POS" : "Bugungi Kassa"}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#191B1F] mt-1">
                      2 430 000
                    </div>
                    <div className="text-[9px] text-zinc-400">so‘m (Naqd + Karta)</div>
                  </div>

                  {/* 2. Ombor */}
                  <div className="border-l-2 border-blue-500 pl-3">
                    <div className="text-[10px] text-zinc-500 font-semibold leading-tight">
                      {lang === "ru" ? "Товары на складе" : lang === "en" ? "Active Stock" : "Ombordagi tovarlar"}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#191B1F] mt-1">
                      428 ta
                    </div>
                    <div className="text-[9px] text-zinc-400">4 ta kam qolgan</div>
                  </div>

                  {/* 3. Oylik Tahlil */}
                  <div className="border-l-2 border-amber-500 pl-3">
                    <div className="text-[10px] text-zinc-500 font-semibold leading-tight">
                      {lang === "ru" ? "Оборот за месяц" : lang === "en" ? "Monthly Turnover" : "Oylik aylanma"}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#191B1F] mt-1">
                      34.2 mln
                    </div>
                    <div className="text-[9px] text-emerald-600 font-bold">+22.8% foyda</div>
                  </div>

                  {/* 4. Nasiya */}
                  <div className="border-l-2 border-purple-500 pl-3">
                    <div className="text-[10px] text-zinc-500 font-semibold leading-tight">
                      {lang === "ru" ? "Долговая книга" : lang === "en" ? "Debt Ledger" : "Mijozlar Nasiyasi"}
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#191B1F] mt-1">
                      12 ta
                    </div>
                    <div className="text-[9px] text-purple-600 font-bold">100% shifrlangan</div>
                  </div>
                </div>

                {/* Jonli Operatsiyalar namunasi */}
                <div className="pt-4 space-y-2">
                  <div className="text-[11px] font-bold text-zinc-700 flex items-center justify-between">
                    <span>{lang === "ru" ? "Последние операции кассы и склада" : lang === "en" ? "Recent POS & Inventory Activity" : "Oxirgi kassa va ombor operatsiyalari"}</span>
                    <span className="text-[10px] font-normal text-zinc-400">{lang === "ru" ? "Синхронизировано" : lang === "en" ? "Synced" : "Bulutda sinxron"}</span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2">
                    <div className="bg-[#FAF8F3] border border-black/5 rounded-2xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Receipt size={13} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-zinc-800">Ridomil Gold</div>
                          <div className="text-[9px] text-zinc-500">Kassa sotuvi • Naqd</div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700">+120 000</span>
                    </div>

                    <div className="bg-[#FAF8F3] border border-black/5 rounded-2xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Package size={13} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-zinc-800">Bento Max 5kg</div>
                          <div className="text-[9px] text-zinc-500">Ombor kirimi • 20 dona</div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-amber-800">Qoldiq: 45</span>
                    </div>

                    <div className="bg-[#FAF8F3] border border-black/5 rounded-2xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                          <BookOpen size={13} />
                        </div>
                        <div className="text-left">
                          <div className="text-xs font-bold text-zinc-800">Gumifos 1L</div>
                          <div className="text-[9px] text-zinc-500">Nasiya to‘lovi yopildi</div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-purple-700">Qoldiq: 0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sariq Karta: "Join Our team" */}
              <div className="bg-[#FDF2D5] text-[#191B1F] rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-md">
                <div className="space-y-2 text-left">
                  <h4 className="text-lg font-extrabold text-[#191B1F]">
                    {t.bento.join_title}
                  </h4>
                  <p className="text-xs text-zinc-700 max-w-sm leading-relaxed">
                    {t.bento.join_desc}
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/hamkorlik"
                      className="inline-flex items-center gap-2 bg-[#191B1F] hover:bg-black text-white text-xs font-bold pl-5 pr-2 py-2 rounded-full transition active:scale-95 group"
                    >
                      <span>{t.bento.join_btn}</span>
                      <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <ArrowUpRight size={13} />
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Overlapping team avatars */}
                <div className="flex items-center -space-x-3 shrink-0">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
                    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&q=80",
                  ].map((img, i) => (
                    <div
                      key={i}
                      className="w-11 h-11 rounded-full border-2 border-[#FDF2D5] overflow-hidden shadow-sm"
                    >
                      <img src={img} alt="Team member" loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION 4: FULL-BLEED PHOTOGRAPHIC BANNER
          ========================================================================= */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-[36px] sm:rounded-[48px] overflow-hidden shadow-2xl min-h-[460px] sm:min-h-[540px] flex flex-col justify-between p-6 sm:p-12 lg:p-14">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1800&q=80"
            alt="Farmer in the golden wheat field"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover brightness-75"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

          {/* Yuqori/O'rtadagi Sarlavha */}
          <div className="relative z-10 max-w-2xl mx-auto text-center pt-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-snug">
              {t.banner.statement}
            </h2>
          </div>

          {/* Pastki Qism: 3 ta doira nishon va 3 ta medal */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 pt-12">
            {/* Chap: Apple vector agro-badges */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E5B54F]/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Sprout size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E5B54F]/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <ShieldCheck size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-[#E5B54F]/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Award size={20} />
              </div>
            </div>

            {/* O'ng: 3 ta medal kartasi */}
            <div className="flex items-center gap-3">
              <div className="bg-[#FAF6EC] text-[#191B1F] rounded-2xl px-5 py-3 text-left min-w-[90px] shadow-lg">
                <div className="text-lg sm:text-xl font-black text-amber-700">{t.banner.badge1_title}</div>
                <div className="text-[9px] font-semibold text-zinc-500 mt-0.5">{t.banner.badge1_desc}</div>
              </div>

              <div className="bg-[#FAF6EC] text-[#191B1F] rounded-2xl px-5 py-3 text-left min-w-[90px] shadow-lg">
                <div className="text-lg sm:text-xl font-black text-amber-700">{t.banner.badge2_title}</div>
                <div className="text-[9px] font-semibold text-zinc-500 mt-0.5">{t.banner.badge2_desc}</div>
              </div>

              <div className="bg-[#FAF6EC] text-[#191B1F] rounded-2xl px-5 py-3 text-left min-w-[90px] shadow-lg">
                <div className="text-lg sm:text-xl font-black text-amber-700">{t.banner.badge3_title}</div>
                <div className="text-[9px] font-semibold text-zinc-500 mt-0.5">{t.banner.badge3_desc}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SECTION 5: SECONDARY STORY & VISION
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          {/* Chap kichik foto */}
          <div className="md:col-span-3 hidden md:flex justify-start">
            <div className="w-44 h-32 rounded-2xl overflow-hidden shadow-md border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=400&q=80"
                alt="Agronomist examining crops"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* O'rta: Sarlavha, Paragraf, Qora Pill Tugma */}
          <div className="md:col-span-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>{t.story2.tag}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight leading-snug">
              {t.story2.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl mx-auto">
              {t.story2.p1}
            </p>

            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-xl mx-auto">
              {t.story2.p2}
            </p>

            <div className="pt-2">
              <Link
                href="/hamkorlik"
                className="inline-flex items-center gap-3 bg-[#191B1F] hover:bg-black text-white text-xs sm:text-sm font-semibold pl-6 pr-2 py-2 rounded-full transition active:scale-95 group"
              >
                <span>{t.story2.contact_btn}</span>
                <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </div>
          </div>

          {/* O'ng kichik foto */}
          <div className="md:col-span-3 hidden md:flex justify-end">
            <div className="w-44 h-32 rounded-2xl overflow-hidden shadow-md border border-black/5">
              <img
                src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=400&q=80"
                alt="Agricultural fields and sunny sky"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. SECTION 6: VALUES BLOCK
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Chap ustun: Sarlavha va Pagination doiralari */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#191B1F] tracking-tight leading-snug whitespace-pre-line">
              {t.values.title}
            </h3>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-[#F4F1EA] hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition"
                aria-label="Oldingi"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-500 flex items-center justify-center text-black transition"
                aria-label="Keyingi"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* O'ng ustun: 3 ta qadriyatlar kartochkasi */}
          <div className="lg:col-span-8 grid sm:grid-cols-3 gap-5">
            {/* Karta 01 */}
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-3">{t.values.v1_tag}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {t.values.v1_pills.map((tag) => (
                    <div
                      key={tag}
                      className="text-left text-[11px] font-semibold py-1.5 px-3 rounded-xl bg-[#FAF8F3] border border-black/5 text-zinc-700"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                {t.values.v1_desc}
              </p>
            </div>

            {/* Karta 02 */}
            <div className="bg-[#1E2024] text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-3">{t.values.v2_tag}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {t.values.v2_pills.map((tag) => (
                    <div
                      key={tag}
                      className="text-left text-[11px] font-semibold py-1.5 px-3 rounded-xl bg-white/10 text-zinc-200"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pt-2">
                {t.values.v2_desc}
              </p>
            </div>

            {/* Karta 03 */}
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 mb-3">{t.values.v3_tag}</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {t.values.v3_pills.map((tag) => (
                    <div
                      key={tag}
                      className="text-left text-[11px] font-semibold py-1.5 px-3 rounded-xl bg-[#FAF8F3] border border-black/5 text-zinc-700"
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed pt-2">
                {t.values.v3_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. SECTION 7: JONLI AGRO BOZOR (Apple Style Category Pills & Badges)
          ========================================================================= */}
      <section id="bozor" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full mb-3">
              <ShoppingCart size={13} className="text-emerald-700" />
              <span>{t.bozor.tag}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#191B1F]">
              {t.bozor.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-2xl">
              {t.bozor.desc}
            </p>
          </div>

          <Link
            href="/agrozgo#bozor"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 group shrink-0"
          >
            <span>{t.bozor.view_all}</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Kategoriya Tablari (Apple Vector Icon Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {[
            { id: "all", label: t.bozor.cat_all, icon: null },
            { id: "crop", label: t.bozor.cat_crop, icon: Sprout },
            { id: "animal", label: t.bozor.cat_animal, icon: ShieldCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat.id
                    ? "bg-[#191B1F] text-white shadow-xs"
                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {Icon && <Icon size={13} className={activeCategory === cat.id ? "text-amber-400" : "text-zinc-500"} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mahsulotlar Kartochkalari (Haqiqiy sertifikatlangan dori vositalari) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {visibleProducts.map((p) => {
            const BadgeIcon = p.badgeIcon || Sprout;
            return (
              <Link
                key={p.id}
                href={`/agrozgo?q=${encodeURIComponent(p.name)}`}
                className="bg-white rounded-3xl p-4 border border-black/5 shadow-xs hover:shadow-xl hover:border-amber-300 transition-all flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  <div className="h-48 rounded-2xl overflow-hidden relative mb-4 bg-zinc-100">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 ${p.badgeColor}`}>
                      <BadgeIcon size={11} />
                      <span>{p.badge}</span>
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 text-[9px] font-bold bg-black/70 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                      Omborda bor
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-emerald-700 mb-1">{p.category}</div>
                  <h3 className="text-base font-extrabold text-[#191B1F] line-clamp-1 group-hover:text-emerald-700 transition">
                    {p.name}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-medium">{p.store} • {p.location}</div>
                    <div className="text-base font-black text-[#191B1F] mt-0.5">{p.price}</div>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-[#191B1F] group-hover:text-white transition shadow-2xs">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Barcha 24 ta dorilarni ko'rish / qisqartirish */}
        {filteredProducts.length > 8 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="inline-flex items-center gap-2 bg-[#191B1F] hover:bg-black text-white text-xs font-bold px-6 py-3 rounded-full transition shadow-md active:scale-95"
            >
              <span>{showAllProducts ? "Kamroq ko‘rsatish" : `Barcha ${filteredProducts.length} ta dori vositasini ko‘rish`}</span>
              <ArrowRight size={14} className={showAllProducts ? "-rotate-90 transition-transform" : "rotate-90 transition-transform"} />
            </button>
          </div>
        )}
      </section>

      {/* =========================================================================
          8. SECTION 8: MUTAXASSISLAR VA HAMKOR DORIXONALAR
          ========================================================================= */}
      <section id="mutaxassislar" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full mb-3">
              <Users size={13} className="text-emerald-700" />
              <span>{t.specialists.tag}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#191B1F]">
              {t.specialists.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-2xl">
              Platformamizda faoliyat yurituvchi {specialistsList.length} nafar sertifikatlangan agronom, fitopatolog va veterinarlar — bevosita dalangizga chaqiruv yoki onlayn maslahat uchun.
            </p>
          </div>

          <Link
            href="/agrozgo#mutaxassislar"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 group shrink-0"
          >
            <span>Barcha mutaxassislar ({specialistsList.length})</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 6 nafar real mutaxassis kartochkalari */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {specialistsList.map((sp) => (
            <div
              key={sp.id}
              className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all flex flex-col justify-between text-left"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-13 h-13 rounded-2xl overflow-hidden shrink-0 border border-zinc-200">
                    <img src={sp.avatar} alt={sp.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#191B1F]">{sp.name}</h3>
                    <div className="text-xs font-semibold text-emerald-700 mt-0.5 line-clamp-1">{sp.role}</div>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed min-h-[48px] line-clamp-3">
                  {sp.specialty}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    <Star size={12} fill="currentColor" />
                    {sp.rating} ({sp.reviews})
                  </span>
                  <span className="text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
                    {sp.exp}
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                    Tasdiqlangan
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                  <MapPin size={13} className="text-zinc-400" />
                  {sp.region}
                </span>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${sp.phone}`}
                    className="p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                    title="Qo‘ng‘iroq qilish"
                  >
                    <Phone size={13} />
                  </a>
                  <Link
                    href="/mutaxassislar"
                    className="px-4 py-2 rounded-full bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white font-bold text-xs transition"
                  >
                    Dalaga chaqirish
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 6 ta Hamkor Agro-dorixona bloklari (Shaffof ma'lumotlar) */}
        <div className="bg-[#FAF8F3] rounded-[36px] p-6 sm:p-10 border border-black/5 mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 border border-amber-200 px-2.5 py-0.5 rounded-full mb-2">
                <Store size={12} className="text-amber-800" />
                <span>Hamkor Tarmoq</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight">
                Platformadagi {REAL_PHARMACIES.length} ta Rasmiy Agro-dorixona
              </h3>
              <p className="text-xs text-zinc-600 mt-1">
                Barcha tovarlar litsenziyalangan, sertifikatlangan va bevosita ushbu rasmiy dorixonalardan yetkaziladi.
              </p>
            </div>

            <Link
              href="/agrozgo#bozor"
              className="text-xs font-bold bg-[#191B1F] hover:bg-black text-white px-5 py-2.5 rounded-full transition flex items-center gap-2 shrink-0 shadow-sm"
            >
              <span>Dorilarni xarid qilish</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REAL_PHARMACIES.map((pharm) => (
              <div
                key={pharm.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-black/5 shadow-2xs hover:shadow-md transition text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {pharm.experience}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      ID #{pharm.id}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#191B1F] mb-0.5">
                    {pharm.name}
                  </h4>
                  <div className="text-[11px] font-medium text-zinc-500 mb-2">
                    {pharm.org}
                  </div>
                  <div className="text-xs text-zinc-600 bg-zinc-50 p-2 rounded-xl mb-3 border border-black/5">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase mb-0.5">Yo‘nalishi:</div>
                    <div className="font-semibold">{pharm.type}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-500 font-medium truncate mr-2">
                    <MapPin size={12} className="shrink-0 text-zinc-400" />
                    <span className="truncate">{pharm.region}</span>
                  </div>
                  <a
                    href={`tel:${pharm.phone.replace(/\s+/g, "")}`}
                    className="shrink-0 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-full transition"
                  >
                    <Phone size={10} />
                    <span>Bog‘lanish</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. SECTION 9: SHAFFAF TARIFLAR
          ========================================================================= */}
      <section id="tariffs" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            {t.tariffs.tag}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight mt-3">
            {t.tariffs.title_p1}
            <span className="text-emerald-700">{t.tariffs.title_highlight}</span>
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-600">
            {t.tariffs.desc}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* BETA Start */}
          <div className="rounded-3xl border-2 border-emerald-600 bg-white p-7 shadow-xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-6 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full">
              {t.tariffs.recommended}
            </div>

            <div>
              <div className="text-lg font-bold text-[#191B1F]">{t.tariffs.plan1_name}</div>
              <p className="text-xs text-zinc-500 mt-1">{t.tariffs.plan1_sub}</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-emerald-700">{t.tariffs.plan1_price}</span>
                <span className="text-sm font-semibold text-zinc-500">{t.tariffs.plan1_period}</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-700 font-medium">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Ежедневная касса и учет продаж (POS)" : lang === "en" ? "Daily POS sales register" : "Kunlik Kassa va savdo nazorati (POS)"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Складской учет и остатки препаратов" : lang === "en" ? "Inventory tracking and expiration alerts" : "Ombor qoldiqlari va dori muddatlari"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Ежемесячные финансовые отчеты и прибыль" : lang === "en" ? "Monthly profit & expense reports" : "Oylik moliyaviy hisobotlar va sof foyda"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Зашифрованная книга долгов (насия)" : lang === "en" ? "Encrypted customer debt ledger" : "Xavfsiz shifrlangan qarz daftari (Nasiya)"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{lang === "ru" ? "Прием онлайн-заказов из AgrozGO" : lang === "en" ? "Receive online orders from AgrozGO" : "Agroz Bozoridan onlayn buyurtmalar qabuli"}</span>
                </li>
              </ul>
            </div>

            <Link
              href="/hamkorlik"
              className="mt-8 w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 text-center transition shadow-md shadow-emerald-600/20 active:scale-95 block"
            >
              {t.tariffs.plan1_btn}
            </Link>
          </div>

          {/* Standart */}
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition">
            <div>
              <div className="text-lg font-bold text-[#191B1F]">{t.tariffs.plan2_name}</div>
              <p className="text-xs text-zinc-500 mt-1">{t.tariffs.plan2_sub}</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-[#191B1F]">{t.tariffs.plan2_price}</span>
                <span className="text-sm font-semibold text-zinc-500">{t.tariffs.plan2_period}</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-emerald-700">
                {t.tariffs.plan2_beta}
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-600">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Barcha BETA Start imkoniyatlari</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Cheksiz dori va mahsulotlar kiritish</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Kengaytirilgan oylik tahliliy hisobotlar</span>
                </li>
              </ul>
            </div>

            <Link
              href="/hamkorlik"
              className="mt-8 w-full rounded-full bg-[#191B1F] hover:bg-black text-white font-bold text-xs py-3.5 text-center transition shadow-xs active:scale-95 block"
            >
              {t.tariffs.plan2_btn}
            </Link>
          </div>

          {/* Tarmoq */}
          <div className="rounded-3xl border border-black/5 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition">
            <div>
              <div className="text-lg font-bold text-[#191B1F]">{t.tariffs.plan3_name}</div>
              <p className="text-xs text-zinc-500 mt-1">{t.tariffs.plan3_sub}</p>

              <div className="mt-5 pb-5 border-b border-zinc-100 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[#191B1F]">{t.tariffs.plan3_price}</span>
                <span className="text-sm font-semibold text-zinc-500">{t.tariffs.plan3_period}</span>
              </div>

              <ul className="mt-6 space-y-3 text-xs text-zinc-600">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Bir nechta filiallar va xodimlar</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Shaxsiy menejer yordami</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                  <span>Maxsus tahliliy hisobotlar</span>
                </li>
              </ul>
            </div>

            <Link
              href="/hamkorlik"
              className="mt-8 w-full rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs py-3.5 text-center transition active:scale-95 block"
            >
              {t.tariffs.plan3_btn}
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. SECTION 10: FAQ & ALOQA
          ========================================================================= */}
      <section id="aloqa" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-black/5 scroll-mt-24">
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            {lang === "ru" ? "Связь и Поддержка" : lang === "en" ? "Contact & Support" : "Aloqa va Qo‘llab-quvvatlash"}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#191B1F] tracking-tight mt-3">
            {lang === "ru" ? "Мы всегда на связи" : lang === "en" ? "We are always here to help" : "Biz bilan bog‘laning"}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
            {lang === "ru"
              ? "Вопросы по заказам, подключению магазинов или вызову агрономов и ветеринаров"
              : lang === "en"
              ? "Questions about orders, store onboarding, or calling agronomists and veterinarians"
              : "Buyurtmalar, do‘konni ulash yoki agronom va veterinar chaqirish bo‘yicha har qanday savolingizga javob beramiz"}
          </p>
        </div>

        {/* 4 ta Aloqa Kartochkasi (Apple clean rounded cards) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14 text-left">
          {/* 1. Telefon */}
          <a
            href="tel:+998908383772"
            className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Phone size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {lang === "ru" ? "Колл-центр" : lang === "en" ? "Call Center" : "Aloqa markazi"}
              </div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1">
                +998 90 838 37 72
              </div>
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-3 flex items-center gap-1">
              <span>{lang === "ru" ? "Позвонить" : lang === "en" ? "Call now" : "Qo‘ng‘iroq qilish"}</span>
              <ArrowRight size={12} />
            </div>
          </a>

          {/* 2. Telegram */}
          <a
            href="https://t.me/agroz_support"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <MessageSquare size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {lang === "ru" ? "Telegram поддержка" : lang === "en" ? "Telegram Support" : "Telegram yordam"}
              </div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1">
                @agroz_support
              </div>
            </div>
            <div className="text-[11px] font-bold text-blue-700 mt-3 flex items-center gap-1">
              <span>{lang === "ru" ? "Написать" : lang === "en" ? "Chat now" : "Xabar yozish"}</span>
              <ArrowRight size={12} />
            </div>
          </a>

          {/* 3. Email */}
          <a
            href="mailto:support@agroz.uz"
            className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs hover:shadow-md hover:border-amber-300 transition flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-[#191B1F] group-hover:text-white transition">
                <Mail size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {lang === "ru" ? "Электронная почта" : lang === "en" ? "Email Address" : "Elektron pochta"}
              </div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1 truncate">
                support@agroz.uz
              </div>
            </div>
            <div className="text-[11px] font-bold text-amber-800 mt-3 flex items-center gap-1">
              <span>{lang === "ru" ? "Отправить" : lang === "en" ? "Send email" : "Xat yuborish"}</span>
              <ArrowRight size={12} />
            </div>
          </a>

          {/* 4. Ish vaqti */}
          <div className="bg-white rounded-3xl p-5 border border-black/5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-800 flex items-center justify-center mb-3">
                <Clock size={18} />
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {lang === "ru" ? "График работы" : lang === "en" ? "Working Hours" : "Ish tartibi"}
              </div>
              <div className="text-sm font-extrabold text-[#191B1F] mt-1">
                08:00 — 20:00
              </div>
            </div>
            <div className="text-[11px] font-bold text-zinc-500 mt-3">
              {lang === "ru" ? "ИИ-диагностика: 24/7" : lang === "en" ? "AI Diagnosis: 24/7" : "AI tashxis: 24/7"}
            </div>
          </div>
        </div>

        {/* FAQ qismi */}
        <div className="text-center mb-8 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
            {t.faq.tag}
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#191B1F] tracking-tight mt-2">
            {t.faq.title}
          </h3>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-black/5 overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => toggleFaq(i)}
                className="w-full p-5 text-left font-bold text-xs sm:text-sm text-[#191B1F] flex items-center justify-between gap-4 hover:bg-zinc-50 transition"
                aria-expanded={openFaq === i}
                aria-controls={`faq-item-${i}`}
              >
                <span>{f.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-zinc-400 transition-transform shrink-0 ${
                    openFaq === i ? "rotate-180 text-emerald-700" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div id={`faq-item-${i}`} className="px-5 pb-5 pt-1 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          11. FINAL CALL TO ACTION (CTA)
          ========================================================================= */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-[36px] sm:rounded-[48px] bg-[#191B1F] text-white p-8 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto relative z-10 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {t.cta.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              {t.cta.desc}
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/hamkorlik"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs sm:text-sm transition shadow-lg active:scale-95"
              >
                {t.cta.free_btn}
              </Link>
              <Link
                href="/hamkorlik?mode=login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition"
              >
                {t.cta.login_btn}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
