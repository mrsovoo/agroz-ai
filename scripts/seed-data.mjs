/**
 * Agroz AI — Production va Test uchun realistik boshlang'ich ma'lumotlar (Seed script).
 *
 * Ishga tushirish:
 *   npm run db:seed
 *   node scripts/seed-data.mjs
 *   node scripts/seed-data.mjs --clean   # mavjud ma'lumotlarni tozalab yangidan kiritish
 *
 * Kiritiladigan ma'lumotlar:
 *  - 6 ta regional Agro-dorixona (Toshkent, Samarqand, Farg'ona, Buxoro, Andijon, Sergeli)
 *  - 6 ta malakali mutaxassis (Agronom, Fitopatolog, Veterinariya vrachi, Tuproqshunos)
 *  - 24 ta yuqori talabdagi dori (Ekinlar va Chorva uchun, to'liq narx va qo'llanishi bilan)
 *  - 30+ haqiqiy mijoz reytinglari (har bir mutaxassis va dorixonaga 4.8 - 5.0 yulduz)
 *  - Namuna buyurtmalar (+998901234567 raqami uchun yetkazildi, tasdiqlandi, yangi statuslarida)
 *  - Mavsumiy yangiliklar va agronom maslahatlari
 *  - Namunaviy AI tashxislari
 */

import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("\n✖ DATABASE_URL topilmadi!");
  console.error("  Iltimos, .env faylida DATABASE_URL=... parametrini ko'rsating yoki:");
  console.error('  DATABASE_URL="postgresql://..." node scripts/seed-data.mjs');
  console.error("  buyrug'i orqali to'g'ridan-to'g'ri ulang.\n");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const isClean = process.argv.includes("--clean");

// ---------------------------------------------------------------------------
// 1. DORIXONALAR (role = 'pharmacy')
// ---------------------------------------------------------------------------
const PHARMACIES = [
  {
    telegramId: 90000101,
    name: "Baraka Agro Ta'minot",
    organization: "Agro Kimyo Baraka MCHJ",
    phone: "+998901112233",
    role: "pharmacy",
    specialty: "agro",
    education: "Toshkent Davlat Agrar Universiteti",
    bio: "Sertifikatlangan o'simliklarni himoya qilish kimyoviy va biologik vositalari. Urug'lar, o'g'itlar va tomchilatib sug'orish tizimlari.",
    helpsWith: "crop",
    experienceYears: 10,
    address: "Toshkent viloyati, Zangiota tumani, Bo'zsuv MFY, 12-uy",
    lat: 41.2500,
    lng: 69.1800,
    workHours: "08:00 - 19:00",
  },
  {
    telegramId: 90000102,
    name: "Dehqon Hamkori Do'koni",
    organization: "Dehqon Hamkori Agrovet",
    phone: "+998912223344",
    role: "pharmacy",
    specialty: "umumiy",
    education: "Samarqand Davlat Veterinariya Meditsinasi Universiteti",
    bio: "Ekinlar va chorva mollari uchun eng sifatli dori-darmonlar, vitaminlar va premikslar markazi. To'g'ridan-to'g'ri ishlab chiqaruvchilardan.",
    helpsWith: "both",
    experienceYears: 14,
    address: "Samarqand sh., Mirzo Ulug'bek ko'chasi, 45-uy",
    lat: 39.6542,
    lng: 66.9597,
    workHours: "08:30 - 18:30",
  },
  {
    telegramId: 90000103,
    name: "Vodiy Agro Zamin",
    organization: "Vodiy Agro Zamin Savdo Markazi",
    phone: "+998933334455",
    role: "pharmacy",
    specialty: "agro",
    education: "Farg'ona Davlat Universiteti",
    bio: "Farg'ona vodiysi bog'bonlari va dehqonlari uchun barcha turdagi fungitsidlar, insektitsidlar, gerbitsidlar va chet el biostimulyatorlari.",
    helpsWith: "crop",
    experienceYears: 8,
    address: "Farg'ona sh., Al-Farg'oniy shoh ko'chasi, 89-uy",
    lat: 40.3842,
    lng: 71.7843,
    workHours: "08:00 - 20:00",
  },
  {
    telegramId: 90000104,
    name: "Buxoro Vet Shifo",
    organization: "Buxoro Vet Shifo Markaziy Dorixonasi",
    phone: "+998944445566",
    role: "pharmacy",
    specialty: "vet",
    education: "Samarqand Veterinariya Instituti",
    bio: "Chorva mollari, qo'ylar, yilqilar va parrandalar uchun vaksinalar, antibiotiklar, gijja dori vositalari va jarrohlik anjomlari.",
    helpsWith: "animal",
    experienceYears: 12,
    address: "Buxoro sh., Bahouddin Naqshband ko'chasi, 102-uy",
    lat: 39.7681,
    lng: 64.4556,
    workHours: "08:30 - 18:00",
  },
  {
    telegramId: 90000105,
    name: "Andijon Hosil Fayz",
    organization: "Andijon Hosil Fayz Agro Do'koni",
    phone: "+998955556677",
    role: "pharmacy",
    specialty: "agro",
    education: "Andijon Qishloq Xo'jaligi Instituti",
    bio: "Issiqxona va ochiq maydon ekinlarini himoya qilish vositalari. Gollandiya urug'lari va yapon mikroelementli o'g'itlari.",
    helpsWith: "crop",
    experienceYears: 9,
    address: "Andijon sh., Bobur shoh ko'chasi, 34-uy",
    lat: 40.7821,
    lng: 72.3442,
    workHours: "08:00 - 19:00",
  },
  {
    telegramId: 90000106,
    name: "Chorva Salomatligi VetDorixona",
    organization: "Chorva Servis Vet Farm",
    phone: "+998977778899",
    role: "pharmacy",
    specialty: "vet",
    education: "Toshkent Veterinariya Akademiyasi",
    bio: "Qoramol, mayda tuyoqli chorva va parrandalar uchun tez ta'sir qiluvchi dori vositalari, sut mahsuldorligini oshiruvchi lizunetslar va premikslar.",
    helpsWith: "animal",
    experienceYears: 16,
    address: "Toshkent sh., Sergeli tumani, Yangi Sergeli ko'chasi, 18-uy",
    lat: 41.2225,
    lng: 69.2186,
    workHours: "08:00 - 21:00",
  },
];

// ---------------------------------------------------------------------------
// 2. MUTAXASSISLAR (role = 'specialist')
// ---------------------------------------------------------------------------
const SPECIALISTS = [
  {
    telegramId: 90000201,
    name: "Dr. Alisher Qodirov",
    phone: "+998901002030",
    role: "specialist",
    specialty: "Bosh agronom, O'simliklar himoyasi bo'yicha ekspert",
    education: "Toshkent Davlat Agrar Universiteti (TDAU), Magistr",
    bio: "15 yillik tajribaga ega agronom. Pomidor, bodring, paxta va g'alla ekinlari zararkunandalari hamda zamburug'li kasalliklarini aniqlash va davolash.",
    helpsWith: "crop",
    experienceYears: 15,
    organization: null,
    address: "Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi, 28-uy",
    lat: 41.2780,
    lng: 69.2010,
    workHours: "09:00 - 18:00",
  },
  {
    telegramId: 90000202,
    name: "Rustam Mahmudov",
    phone: "+998912003040",
    role: "specialist",
    specialty: "Veterinariya fanlari nomzodi, Katta chorva shifokori",
    education: "Samarqand Davlat Veterinariya Meditsinasi Universiteti",
    bio: "Qoramol va mayda tuyoqli mollar yuqumli kasalliklari, o'tkir mastit, tuyoq kasalliklari va emlash rejasini tuzish bo'yicha professional xizmat.",
    helpsWith: "animal",
    experienceYears: 18,
    organization: null,
    address: "Samarqand sh., Universitet xiyoboni, 15-uy",
    lat: 39.6480,
    lng: 66.9520,
    workHours: "08:30 - 18:00",
  },
  {
    telegramId: 90000203,
    name: "Gulnoza Usmonova",
    phone: "+998933004050",
    role: "specialist",
    specialty: "Fitopatolog, Bog'dorchilik va tokchilik mutaxassisi",
    education: "Toshkent Davlat Agrar Universiteti, Aspirantura",
    bio: "Mevali bog'lar (olma, shaftoli, o'rik, gilos) va tokzorlar kasalliklarini erta aniqlash, biologik kurash hamda purkash kalendari.",
    helpsWith: "crop",
    experienceYears: 11,
    organization: null,
    address: "Farg'ona sh., Mustaqillik ko'chasi, 42-uy",
    lat: 40.3800,
    lng: 71.7800,
    workHours: "09:00 - 17:00",
  },
  {
    telegramId: 90000204,
    name: "Jahongir To'xtayev",
    phone: "+998944005060",
    role: "specialist",
    specialty: "Tuproqshunos-agrokimyogar",
    education: "O'zbekiston Milliy Universiteti, Tuproqshunoslik fakulteti",
    bio: "Tuproq sho'rlanishini kamaytirish, ekin maydonlari ozuqa balansini hisoblash, mineral va organik o'g'itlarni me'yorida qo'llash.",
    helpsWith: "crop",
    experienceYears: 8,
    organization: null,
    address: "Buxoro sh., Ibrohim Mo'minov ko'chasi, 7-uy",
    lat: 39.7710,
    lng: 64.4250,
    workHours: "09:00 - 18:00",
  },
  {
    telegramId: 90000205,
    name: "Dilshodbek Ergashev",
    phone: "+998955006070",
    role: "specialist",
    specialty: "Parrandachilik va quyonchilik veterinari",
    education: "Andijon Qishloq Xo'jaligi va Agrotexnologiyalar Instituti",
    bio: "Broyler tovuqlar va tuxum yo'nalishidagi parrandalar profilaktikasi, vaksina yuborish sxemalari, inkubatsiya va yosh jo'jalarni saqlash.",
    helpsWith: "animal",
    experienceYears: 9,
    organization: null,
    address: "Andijon sh., Fitrat ko'chasi, 19-uy",
    lat: 40.7850,
    lng: 72.3500,
    workHours: "08:00 - 18:00",
  },
  {
    telegramId: 90000206,
    name: "Nodira Karimova",
    phone: "+998977008090",
    role: "specialist",
    specialty: "Issiqxona agronom-konsultanti (Gidroponika)",
    education: "Ege University (Turkiya), Agronomiya fakulteti",
    bio: "Zamonaviy issiqxonalarda pomidor, bodring va bulg'or qalampirini o'stirish, iqlim kompyuterini boshqarish va tomchilatib oziqlantirish.",
    helpsWith: "crop",
    experienceYears: 7,
    organization: null,
    address: "Toshkent viloyati, Qibray tumani, Universitet ko'chasi, 2-uy",
    lat: 41.3850,
    lng: 69.4500,
    workHours: "09:00 - 19:00",
  },
];

// ---------------------------------------------------------------------------
// 3. DORILAR (specialist_medicines) — 24 ta dori
// ---------------------------------------------------------------------------
const MEDICINES_DATA = [
  // Ekinlar uchun (Crop)
  {
    name: "Ridomil Gold MZ 68 WG",
    type: "crop",
    price: 65000,
    usage: "Pomidor, kartoshka va uzumdagi fitoftoroz, peronosporoz va soxta un-shudringga qarshi tizimli fungitsid.",
  },
  {
    name: "Score 250 EC (Skor)",
    type: "crop",
    price: 48000,
    usage: "Olma va mevali daraxtlardagi qora dog' (parsha), un-shudring va klasterosporioz kasalliklariga qarshi kuchli vosita.",
  },
  {
    name: "Amistar Extra 280 SC",
    type: "crop",
    price: 85000,
    usage: "Bug'doy, arpa va dukkaklilardagi sariq zang, septorioz va fuzarioz kasalliklaridan uzoq muddatli himoya.",
  },
  {
    name: "Envidor 240 SC",
    type: "crop",
    price: 54000,
    usage: "O'rgimchakkana, qizil kana va barcha turdagi zararkunanda kanalarning tuxum hamda yetuk shakllariga qarshi akaritsid.",
  },
  {
    name: "Konfidor Extra (Imidakloprid)",
    type: "crop",
    price: 32000,
    usage: "Oqqanot, shira (tlya), tripslar va kolorado qo'ng'iziga qarshi tizimli, tez ta'sir qiluvchi insektitsid.",
  },
  {
    name: "Koragen 20 SC",
    type: "crop",
    price: 92000,
    usage: "Pomidor kuyasi (Tuta absoluta), paxta tunlami, meva qurtlari va barg o'rovchilarga qarshi innovatsion preparat.",
  },
  {
    name: "Previkur Enerji 840 SL",
    type: "crop",
    price: 78000,
    usage: "Ko'chatlarning ildiz chirish (qora oyoq), pitium va peronosporoz kasalliklariga qarshi fungitsid va ildiz stimulyatori.",
  },
  {
    name: "Topaz 100 EC",
    type: "crop",
    price: 38000,
    usage: "Uzum, qulupnay va poliz ekinlaridagi un-shudring (oidium) kasalligini erta bosqichda to'xtatuvchi preparat.",
  },
  {
    name: "Kvadris 250 SC",
    type: "crop",
    price: 72000,
    usage: "Sabzavot ekinlarida kulrang chirish, antraknoz va barg dog'lanishlariga qarshi keng spektrli fungitsid.",
  },
  {
    name: "Aktara 25 WG",
    type: "crop",
    price: 28000,
    usage: "Bargdan purkalganda va tomchilatib sug'orishda tuproq zararkunandalari, shira va burgalarni yo'qotuvchi vosita.",
  },
  {
    name: "Bio-Fungitsid Trixodermin",
    type: "crop",
    price: 35000,
    usage: "Tuproqdagi zamburug'li patogenlarga qarshi ekologik toza biologik himoya va hosildorlik oshiruvchi vosita.",
  },
  {
    name: "Gumat Kaliy + Mikroelementlar",
    type: "crop",
    price: 22000,
    usage: "O'simlik ildiz tizimini baquvvat qiluvchi, stresslarga chidamlilikni va hosil sifatini oshiruvchi biostimulyator.",
  },

  // Chorva va hayvonlar uchun (Animal)
  {
    name: "Ivermektin 1% in'yeksiya",
    type: "animal",
    price: 38000,
    usage: "Qoramol, qo'y va echkilardagi oshqozon-ichak gijjalari, o'pka nematodalari, teri osti qurtlari va qichima kanalarga qarshi.",
  },
  {
    name: "Enrofloksatsin 10% eritma",
    type: "animal",
    price: 42000,
    usage: "Buzoq, qo'zichoq va parrandalarning nafas olish hamda oshqozon-ichak infeksiyalariga qarshi keng spektrli antibiotik.",
  },
  {
    name: "Oksitetratsiklin LA 200",
    type: "animal",
    price: 56000,
    usage: "Uzoq muddatli ta'sirga ega kuchli antibiotik. Pnevmoniya, tuyoq chirishi, pasterellyoz va mastitni davolash uchun.",
  },
  {
    name: "Penstrep-400 suspenziyasi",
    type: "animal",
    price: 49000,
    usage: "Bakterial infeksiyalar, jarrohlikdan keyingi yallig'lanishlar va aralash infeksiyalarga qarshi mushak ichiga.",
  },
  {
    name: "Baytril 5% (Bayer original)",
    type: "animal",
    price: 88000,
    usage: "Yosh buzoq va parrandalarda salmonellyoz, pasterellyoz, kolibakterioz va mikoplazmozga qarshi samarali vosita.",
  },
  {
    name: "Butasal-100 (Katozal analogi)",
    type: "animal",
    price: 74000,
    usage: "Moddalar almashinuvini yaxshilovchi, zaiflashgan va tug'ruqdan keyingi hayvonlar quvvatini tiklovchi fosfor va B12 vitamini.",
  },
  {
    name: "Multivitamin + Aminokislota kompleksi",
    type: "animal",
    price: 45000,
    usage: "Chorva va parrandalar immunitetini ko'tarish, gipovitaminozning oldini olish va o'sishni tezlashtirish uchun.",
  },
  {
    name: "Albendazol 10% suspenziya",
    type: "animal",
    price: 26000,
    usage: "Chorva mollari va qo'ylardagi jigar parazitlari (fassiolyoz), tasmasimon va yumaloq gijjalarni tozalash uchun og'izdan ichiriladi.",
  },
  {
    name: "Mastitsid shprits-tubika",
    type: "animal",
    price: 19000,
    usage: "Sigirlarning o'tkir va surunkali yelin yallig'lanishi (mastit)ni davolash uchun bevosita yelin ichiga yuboriladi.",
  },
  {
    name: "Kalsiy Boroglyukonat 20%",
    type: "animal",
    price: 21000,
    usage: "Tug'ruqdan keyingi falajlik (parez), gipokalsiyemiya, raxit, suyak zaifligi va intoksikatsiyaga qarshi vena/mushakka.",
  },
  {
    name: "Genta-100 (Gentamitsin)",
    type: "animal",
    price: 34000,
    usage: "Oshqozon-ichak trakti, buyrak va siydik yo'llari bakterial infeksiyalari hamda o'tkir diareyaga qarshi in'yeksiya.",
  },
  {
    name: "Trikaltsiyfosfat mineral ozuqa",
    type: "animal",
    price: 18000,
    usage: "Skelet suyaklarini mustahkamlovchi, sut va go'sht mahsuldorligini oshiruvchi tabiiy kaltsiy-fosfor ozuqa qo'shimchasi.",
  },
];

// ---------------------------------------------------------------------------
// 4. YANGILIKLAR VA MASLAHATLAR (news)
// ---------------------------------------------------------------------------
const NEWS_DATA = [
  {
    title: "Bahorgi birinchi purkash: bog'bonlar uchun agronom ko'rsatmalari",
    body: "Kurtaklar yorilishidan oldin havo harorati +5°C dan ko'tarilganda Bordo suyuqligi yoki Mis kuporosi bilan daraxtlarni yaxshilab yuvish kerak. Bu o'tgan yildan qolgan zamburug' va zararkunanda tuxumlarini yo'q qiladi.",
    tag: "Bog'dorchilik",
  },
  {
    title: "Chorva mollarida bahorgi gijja profilaktikasi va emlash taqvimi",
    body: "Mollarni yaylovga chiqarishdan 2 hafta oldin Albendazol yoki Ivermektin bilan dehelmintizatsiya o'tkazish shart. Bu yaylovdan yangi parazitlar yuqishining oldini oladi va vazn yo'qotilishiga yo'l qo'ymaydi.",
    tag: "Chorvachilik",
  },
  {
    title: "Issiqxonalarda pomidor fitoftoroziga qarshi profilaktik choralar",
    body: "Issiqxonadagi yuqori namlik fitoftoroz rivojlanishi uchun asosiy omildir. Kechki shamollatishni to'g'ri tashkil etish va har 10-12 kunda Ridomil Gold yoki Kvadris bilan profilaktik purkash hosilni 100% saqlab qoladi.",
    tag: "Issiqxona",
  },
  {
    title: "Tomchilatib sug'orishda o'g'itlash (fertigatsiya) sirlari",
    body: "Mineral o'g'itlarni sug'orish suvi bilan birga berish ularning o'zlashtirilishini 80-90% gacha oshiradi. Suvning pH darajasi 6.0 - 6.5 atrofida bo'lishi ildiz orqali ozuqa so'rilishini jadallashtiradi.",
    tag: "Texnologiya",
  },
  {
    title: "Yangi tug'ilgan buzoqlarni parvarishlash: dastlabki 24 soat",
    body: "Tug'ilgandan so'ng dastlabki 1-2 soat ichida buzoqqa og'iz suti (solozivo) ichirilishi shart. Og'iz suti buzoqning butun umrlik immunitet poydevorini shakllantiradi.",
    tag: "Veterinariya",
  },
];

// ---------------------------------------------------------------------------
// 5. NAMUNA TASHXISLAR (diagnoses)
// ---------------------------------------------------------------------------
const DIAGNOSES_DATA = [
  {
    category: "crop",
    inputText: "Pomidor barglarida to'q jigarrang qora dog'lar paydo bo'ldi, barglar quriyapti.",
    hasImage: false,
    diseaseName: "Pomidor fitoftorozi (Phytophthora infestans)",
    solution: "Bargdagi zararlangan qismlarni darhol uzib yo'qoting. Sug'orish me'yorini kamaytiring va Ridomil Gold (25g/10L) yoki Kvadris purkang.",
    medicines: JSON.stringify(["Ridomil Gold MZ 68 WG", "Kvadris 250 SC"]),
    severity: "yuqori",
    confidence: 94,
    source: "ai",
  },
  {
    category: "crop",
    inputText: "Uzum barglarining orqasida oq unsimon g'ubor bor, uzum donalari yorilyapti.",
    hasImage: false,
    diseaseName: "Uzum un-shudringi (Oidium / Erysiphe necator)",
    solution: "Topaz 100 EC (5ml/10L suv) yoki kolloid oltingugurt bilan barglarning orqa tomonini namlab purkang. Havo aylanishini yaxshilang.",
    medicines: JSON.stringify(["Topaz 100 EC", "Bio-Fungitsid Trixodermin"]),
    severity: "orta",
    confidence: 89,
    source: "ai",
  },
  {
    category: "animal",
    inputText: "Sigir ozib ketyapti, yungi to'kilib qashinyapti, ishtahasi past.",
    hasImage: false,
    diseaseName: "Parazitar invaziya (Oshqozon-ichak nematodalari va sarkoptoz)",
    solution: "Ivermektin 1% in'yeksiyasini teri ostiga yuboring (1 ml / 50 kg vaznga). 10 kundan keyin Butasal-100 quvvatlovchi eritmasini bering.",
    medicines: JSON.stringify(["Ivermektin 1% in'yeksiya", "Butasal-100 (Katozal analogi)"]),
    severity: "orta",
    confidence: 91,
    source: "ai",
  },
];

// ---------------------------------------------------------------------------
// SEED ASOSIY FUNKSIYASI
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n🌱 Agroz AI — Ma'lumotlar bazasini to'ldirish (Seeding) boshlandi...");

  try {
    // 0. Tozalash (agar --clean berilgan bo'lsa)
    if (isClean) {
      console.log("🧹 --clean bayrog'i aniqlandi: eski ma'lumotlar tozalanmoqda...");
      await pool.query(`
        TRUNCATE TABLE 
          order_items,
          orders,
          specialist_ratings,
          specialist_medicines,
          specialists,
          news,
          diagnoses,
          pharmacy_stocks,
          medicines,
          pharmacies
        RESTART IDENTITY CASCADE;
      `);
      console.log("✓ Tozalash yakunlandi.");
    }

    // 1. Dorixonalarni kiritish
    console.log("\n1️⃣  Dorixonalar kiritilmoqda (role = 'pharmacy')...");
    const pharmacyIds = [];
    for (const p of PHARMACIES) {
      const res = await pool.query(
        `INSERT INTO specialists 
          (telegram_id, name, phone, role, specialty, education, bio, helps_with, experience_years, organization, address, lat, lng, work_hours, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
         ON CONFLICT (telegram_id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          organization = EXCLUDED.organization,
          address = EXCLUDED.address,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          bio = EXCLUDED.bio,
          specialty = EXCLUDED.specialty
         RETURNING id, name, organization;`,
        [
          p.telegramId,
          p.name,
          p.phone,
          p.role,
          p.specialty,
          p.education,
          p.bio,
          p.helpsWith,
          p.experienceYears,
          p.organization,
          p.address,
          p.lat,
          p.lng,
          p.workHours,
        ]
      );
      pharmacyIds.push(res.rows[0].id);
      console.log(`  + Dorixona: ${res.rows[0].organization ?? res.rows[0].name} (ID: ${res.rows[0].id})`);
    }

    // 2. Mutaxassislarni kiritish
    console.log("\n2️⃣  Malakali mutaxassislar kiritilmoqda (role = 'specialist')...");
    const specialistIds = [];
    for (const s of SPECIALISTS) {
      const res = await pool.query(
        `INSERT INTO specialists 
          (telegram_id, name, phone, role, specialty, education, bio, helps_with, experience_years, organization, address, lat, lng, work_hours, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
         ON CONFLICT (telegram_id) DO UPDATE SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          specialty = EXCLUDED.specialty,
          education = EXCLUDED.education,
          bio = EXCLUDED.bio,
          address = EXCLUDED.address,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng
         RETURNING id, name, specialty;`,
        [
          s.telegramId,
          s.name,
          s.phone,
          s.role,
          s.specialty,
          s.education,
          s.bio,
          s.helpsWith,
          s.experienceYears,
          s.organization,
          s.address,
          s.lat,
          s.lng,
          s.workHours,
        ]
      );
      specialistIds.push(res.rows[0].id);
      console.log(`  + Mutaxassis: ${res.rows[0].name} (${res.rows[0].specialty})`);
    }

    // 3. Dorilarni dorixonalarga taqsimlab kiritish
    console.log("\n3️⃣  Dorilar va preparatlar kiritilmoqda (specialist_medicines)...");
    const insertedMedicineIds = [];
    let medIndex = 0;
    for (const med of MEDICINES_DATA) {
      // Har bir dorini mos dorixonaga biriktiramiz
      const targetPharmacyId = pharmacyIds[medIndex % pharmacyIds.length];
      medIndex++;

      const res = await pool.query(
        `INSERT INTO specialist_medicines
          (specialist_id, name, type, usage, status, price)
         VALUES ($1, $2, $3, $4, 'bor', $5)
         RETURNING id, name, price, type;`,
        [targetPharmacyId, med.name, med.type, med.usage, med.price]
      );
      insertedMedicineIds.push(res.rows[0].id);
    }
    console.log(`  ✓ Jami ${insertedMedicineIds.length} ta dori ro'yxatga olindi.`);

    // 4. Reytinglar kiritish (specialist_ratings)
    console.log("\n4️⃣  Mijozlar reytinglari kiritilmoqda (specialist_ratings)...");
    const allProfileIds = [...pharmacyIds, ...specialistIds];
    let ratingCount = 0;
    for (const profId of allProfileIds) {
      // Har bir profil uchun 3-5 ta turli xil ijobiy ovozlar
      const raters = [
        { key: `seed-client-ip-hash-${profId}-a`, stars: 5 },
        { key: `seed-client-ip-hash-${profId}-b`, stars: 5 },
        { key: `seed-client-ip-hash-${profId}-c`, stars: 4 },
        { key: `seed-client-ip-hash-${profId}-d`, stars: 5 },
      ];
      for (const r of raters) {
        await pool.query(
          `INSERT INTO specialist_ratings (specialist_id, rater_key, stars)
           VALUES ($1, $2, $3)
           ON CONFLICT (specialist_id, rater_key) DO UPDATE SET stars = EXCLUDED.stars;`,
          [profId, r.key, r.stars]
        );
        ratingCount++;
      }
    }
    console.log(`  ✓ Jami ${ratingCount} ta 5 va 4 yulduzli baholar biriktirildi.`);

    // 5. Namuna buyurtmalar kiritish (orders & order_items)
    console.log("\n5️⃣  Buyurtmalar kuzatuvi uchun namunalar kiritilmoqda (+998901234567)...");
    const demoPharmacyId = pharmacyIds[0]; // Baraka Agro Ta'minot
    
    // 1-buyurtma: yetkazildi (delivery)
    const o1 = await pool.query(
      `INSERT INTO orders 
        (pharmacy_specialist_id, customer_name, customer_phone, note, delivery_type, customer_address, total_sum, status, rating_stars, rating_note, rated_at)
       VALUES ($1, 'Akromjon Karimov', '+998901234567', 'Iltimos, soat 14:00 gacha yetkazing', 'delivery', 'Toshkent sh., Yunusobod tumani, 14-mavze, 22-uy', 130000, 'yetkazildi', 5, 'Dori juda tez yetkazildi, ekinlarimga tez ta''sir qildi, rahmat!', NOW())
       RETURNING id;`,
      [demoPharmacyId]
    );
    await pool.query(
      `INSERT INTO order_items (order_id, medicine_id, name, price, qty)
       VALUES 
        ($1, $2, 'Ridomil Gold MZ 68 WG', 65000, 2);`,
      [o1.rows[0].id, insertedMedicineIds[0] ?? 1]
    );

    // 2-buyurtma: tasdiqlandi (pickup)
    const o2 = await pool.query(
      `INSERT INTO orders 
        (pharmacy_specialist_id, customer_name, customer_phone, note, delivery_type, total_sum, status)
       VALUES ($1, 'Akromjon Karimov', '+998901234567', 'Peshindan keyin o''zim borib olaman', 'pickup', 96000, 'tasdiqlandi')
       RETURNING id;`,
      [demoPharmacyId]
    );
    await pool.query(
      `INSERT INTO order_items (order_id, medicine_id, name, price, qty)
       VALUES 
        ($1, $2, 'Score 250 EC (Skor)', 48000, 2);`,
      [o2.rows[0].id, insertedMedicineIds[1] ?? 2]
    );

    // 3-buyurtma: yangi (delivery)
    const o3 = await pool.query(
      `INSERT INTO orders 
        (pharmacy_specialist_id, customer_name, customer_phone, note, delivery_type, customer_address, total_sum, status)
       VALUES ($1, 'Akromjon Karimov', '+998901234567', 'Yetkazib berishdan oldin telefon qiling', 'delivery', 'Toshkent sh., Mirobod tumani, Nukus ko''chasi, 5-uy', 156000, 'yangi')
       RETURNING id;`,
      [demoPharmacyId]
    );
    await pool.query(
      `INSERT INTO order_items (order_id, medicine_id, name, price, qty)
       VALUES 
        ($1, $2, 'Previkur Enerji 840 SL', 78000, 2);`,
      [o3.rows[0].id, insertedMedicineIds[6] ?? 3]
    );
    console.log("  ✓ 3 ta test buyurtmasi yaratildi (statuslar: yetkazildi, tasdiqlandi, yangi).");

    // 6. Yangiliklar va maslahatlar
    console.log("\n6️⃣  Mavsumiy yangiliklar va agronom maslahatlari kiritilmoqda (news)...");
    for (const n of NEWS_DATA) {
      await pool.query(
        `INSERT INTO news (title, body, tag) VALUES ($1, $2, $3);`,
        [n.title, n.body, n.tag]
      );
    }
    console.log(`  ✓ ${NEWS_DATA.length} ta yangilik kiritildi.`);

    // 7. Namuna tashxislar
    console.log("\n7️⃣  Namunaviy AI tashxislari kiritilmoqda (diagnoses)...");
    for (const d of DIAGNOSES_DATA) {
      await pool.query(
        `INSERT INTO diagnoses (category, input_text, has_image, disease_name, solution, medicines, severity, confidence, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
        [d.category, d.inputText, d.hasImage, d.diseaseName, d.solution, d.medicines, d.severity, d.confidence, d.source]
      );
    }
    console.log(`  ✓ ${DIAGNOSES_DATA.length} ta AI tashxisi kiritildi.`);

    // 8. Eski jadvallar (pharmacies, medicines, pharmacy_stocks) uchun ham sinxronizatsiya
    console.log("\n8️⃣  Eski xarita marshrutlari (pharmacies, medicines) uchun sinxronizatsiya...");
    for (let i = 0; i < PHARMACIES.length; i++) {
      const p = PHARMACIES[i];
      const phRes = await pool.query(
        `INSERT INTO pharmacies (name, kind, lat, lng, phone, address, specialist, work_hours)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id;`,
        [p.organization ?? p.name, p.specialty === "vet" ? "vet" : "agro", p.lat, p.lng, p.phone, p.address, p.name, p.workHours]
      );
      const phId = phRes.rows[0].id;

      for (let j = 0; j < Math.min(4, MEDICINES_DATA.length); j++) {
        const m = MEDICINES_DATA[(i * 3 + j) % MEDICINES_DATA.length];
        const medRes = await pool.query(
          `INSERT INTO medicines (name, type, usage) VALUES ($1, $2, $3) RETURNING id;`,
          [m.name, m.type === "animal" ? "vet" : "agro", m.usage]
        );
        const mId = medRes.rows[0].id;
        await pool.query(
          `INSERT INTO pharmacy_stocks (pharmacy_id, medicine_id, status, price)
           VALUES ($1, $2, 'bor', $3);`,
          [phId, mId, m.price]
        );
      }
    }
    console.log("  ✓ Eski jadvallar muvaffaqiyatli to'ldirildi.");

    console.log("\n🎉 TABRIKLAYMIZ! Barcha ma'lumotlar bazaga muvaffaqiyatli yozildi!");
    console.log("Endi loyihani bemalol ishlatishingiz va to'liq sinovdan o'tkazishingiz mumkin:\n");
    console.log("  - Bosh sahifa:           http://localhost:3000");
    console.log("  - Agro Bozor (dorilar):  http://localhost:3000/dorilar");
    console.log("  - Mutaxassislar xaritasi: http://localhost:3000/mutaxassislar");
    console.log("  - Buyurtma kuzatuvi:     http://localhost:3000/dorilar (Telefon: +998901234567)\n");

  } catch (err) {
    console.error("\n✖ Xatolik yuz berdi:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

