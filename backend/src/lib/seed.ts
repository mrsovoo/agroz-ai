import { db } from "@/db";
import {
  news,
  specialists,
  specialistMedicines,
  specialistRatings,
  orders,
  orderItems,
} from "@/db/schema";
import { sql } from "drizzle-orm";

let seeded = false;
const SEED_LOCK_KEY = 771_204;

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
    lat: 41.25,
    lng: 69.18,
    workHours: "08:00 - 19:00",
  },
  {
    telegramId: 90000102,
    name: "Dehqon Hamkori Do'koni",
    organization: "Dehqon Hamkori Agrovet MCHJ",
    phone: "+998912223344",
    role: "pharmacy",
    specialty: "umumiy",
    education: "Samarqand Davlat Veterinariya Meditsinasi Universiteti",
    bio: "Ekinlar va chorva mollari uchun barcha turdagi dori-darmonlar, o'g'itlar va yem qo'shimchalari. Mahsulot sifatiga to'liq kafolat.",
    helpsWith: "both",
    experienceYears: 14,
    address: "Samarqand shahri, Mirzo Ulug'bek ko'chasi, 45-uy",
    lat: 39.6542,
    lng: 66.9597,
    workHours: "08:30 - 18:30",
  },
  {
    telegramId: 90000103,
    name: "Vodiy Agro Kimyo",
    organization: "Farg'ona Hosil Dorixona XK",
    phone: "+998933334455",
    role: "pharmacy",
    specialty: "agro",
    education: "Andijon Qishloq Xo'jaligi va Agrotexnologiyalar Instituti",
    bio: "Farg'ona vodiysi bog'bonlari va dehqonlari uchun maxsus fungitsidlar, insektitsidlar va o'sish stimulyatorlari.",
    helpsWith: "crop",
    experienceYears: 8,
    address: "Farg'ona shahri, Al-Farg'oniy ko'chasi, 88-uy",
    lat: 40.3864,
    lng: 71.7864,
    workHours: "08:00 - 18:00",
  },
  {
    telegramId: 90000104,
    name: "Zarafshon Agro-Vet",
    organization: "Buxoro Chorva Ta'minot MCHJ",
    phone: "+998944445566",
    role: "pharmacy",
    specialty: "vet",
    education: "SamDVMU",
    bio: "Qorako'lchilik, qoramolchilik va parrandachilik uchun eng samarali vaksinalar, antibiotiklar va parazitlarga qarshi vositalar.",
    helpsWith: "animal",
    experienceYears: 16,
    address: "Buxoro shahri, G'ijduvon ko'chasi, 19-uy",
    lat: 39.7747,
    lng: 64.4286,
    workHours: "09:00 - 18:00",
  },
  {
    telegramId: 90000105,
    name: "Andijon Hosil Dorixonasi",
    organization: "Agro Servis Vodiy MCHJ",
    phone: "+998955556677",
    role: "pharmacy",
    specialty: "agro",
    education: "TDAU Andijon filiali",
    bio: "Issiqxonalar (pomidor, bodring, ko'katlar) va ochiq dala ekinlari uchun import va mahalliy preparatlar.",
    helpsWith: "crop",
    experienceYears: 11,
    address: "Andijon shahri, Bobur shoh ko'chasi, 102-uy",
    lat: 40.7821,
    lng: 72.3442,
    workHours: "08:00 - 19:00",
  },
  {
    telegramId: 90000106,
    name: "Chorva va Parranda Dori Markazi",
    organization: "Vet Servis Toshkent XK",
    phone: "+998977778899",
    role: "pharmacy",
    specialty: "vet",
    education: "Samarqand Davlat Veterinariya Universiteti",
    bio: "Qoramol, qo'y-echki, ot va uy parrandalari uchun sifatli veterinariya preparatlari, vitaminlar va antiseptiklar.",
    helpsWith: "animal",
    experienceYears: 12,
    address: "Toshkent shahri, Sergeli tumani, Yangi Sergeli yo'li, 7-bino",
    lat: 41.225,
    lng: 69.218,
    workHours: "08:30 - 20:00",
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
    specialty: "Bosh agronom, O'simliklar himoyasi eksperti",
    education: "Toshkent Davlat Agrar Universiteti (PhD)",
    bio: "15 yillik tajribaga ega agronom. Issiqxona va ochiq daladagi pomidor, bodring, g'alla va bog'dorchilik kasalliklarini erta aniqlash va davolash sxemalarini tuzish.",
    helpsWith: "crop",
    experienceYears: 15,
    address: "Toshkent shahri, Chilonzor tumani, Bunyodkor shoh ko'chasi",
    lat: 41.278,
    lng: 69.201,
    workHours: "09:00 - 18:00",
  },
  {
    telegramId: 90000202,
    name: "Dilshod Ergashev",
    phone: "+998912003040",
    role: "specialist",
    specialty: "Veterinariya bosh vrachi, Jarroh",
    education: "Samarqand Davlat Veterinariya Meditsinasi Universiteti",
    bio: "Qoramol va mayda tuyoqli hayvonlarning yuqumli va ichki kasalliklari, tug'ruq asoratlari, mastit va oqsoqlikni samarali davolash.",
    helpsWith: "animal",
    experienceYears: 18,
    address: "Toshkent viloyati, Yangiyo'l tumani, Markaziy shifoxona yaqinida",
    lat: 41.116,
    lng: 69.05,
    workHours: "08:00 - 19:00",
  },
  {
    telegramId: 90000203,
    name: "Ozodbek Mirzayev",
    phone: "+998933004050",
    role: "specialist",
    specialty: "Fitopatolog, Issiqxona va ochiq maydon maslahatchisi",
    education: "TDAU, Qishloq xo'jaligi fanlari nomzodi",
    bio: "Zamburug'li (fitoftoroz, un-shudring, klasterosporioz) va virusli kasalliklarga qarshi kompleks kurash dasturlarini ishlab chiqish.",
    helpsWith: "crop",
    experienceYears: 12,
    address: "Samarqand shahri, Dahbed ko'chasi",
    lat: 39.662,
    lng: 66.97,
    workHours: "09:00 - 17:30",
  },
  {
    telegramId: 90000204,
    name: "Sanjar Toirov",
    phone: "+998944005060",
    role: "specialist",
    specialty: "Chorva mollari parvarishi va oziqlantirish eksperti",
    education: "SamDVMU Zooinjeneriya fakulteti",
    bio: "Sut va go'sht yo'nalishidagi qoramollarning ratsionini hisoblash, mahsuldorlikni oshirish, yosh mollarning o'sish sur'atini nazorat qilish.",
    helpsWith: "animal",
    experienceYears: 10,
    address: "Buxoro viloyati, Vobkent tumani",
    lat: 40.03,
    lng: 64.51,
    workHours: "08:30 - 18:00",
  },
  {
    telegramId: 90000205,
    name: "Gulchehra Rahimova",
    phone: "+998975006070",
    role: "specialist",
    specialty: "Agrokimyogar, Tuproq tahlili va o'g'itlash bo'yicha mutaxassis",
    education: "O'zbekiston Milliy Universiteti Biologiya-tuproqshunoslik",
    bio: "Tuproqning mineral va organik tarkibini tahlil qilish, NPK me'yorlarini belgilash va mikroelementlar yetishmovchiligini bartaraf qilish.",
    helpsWith: "crop",
    experienceYears: 14,
    address: "Farg'ona shahri, Sayilgoh ko'chasi",
    lat: 40.389,
    lng: 71.782,
    workHours: "09:00 - 18:00",
  },
  {
    telegramId: 90000206,
    name: "Bekzod Ismoilov",
    phone: "+998996007080",
    role: "specialist",
    specialty: "Veterinar-epizootolog, Parrandachilik va mayda shoxli mollar",
    education: "SamDVMU",
    bio: "Parrandachilik fermalari va chorva podalarida emlash taqvimini tuzish, pnevmoniya, enterit va koksidiozning oldini olish.",
    helpsWith: "both",
    experienceYears: 9,
    address: "Andijon shahri, Mashinaozlar ko'chasi",
    lat: 40.77,
    lng: 72.33,
    workHours: "08:00 - 18:00",
  },
];

// ---------------------------------------------------------------------------
// 3. DORILAR (specialistMedicines)
// ---------------------------------------------------------------------------
const MEDICINES_BY_PHARMACY = [
  // 1-Dorixona: Baraka Agro Ta'minot (crop)
  {
    pharmacyIndex: 0,
    meds: [
      {
        name: "Ridomil Gold MZ 68 WG",
        type: "crop",
        price: 65000,
        usage: "Pomidor, kartoshka va uzumdagi fitoftoroz, peronosporoz va soxta un-shudringga qarshi kuchli tizimli fungitsid. 10 litr suvga 25g qo'llaniladi.",
      },
      {
        name: "Score 250 EC (Skor)",
        type: "crop",
        price: 48000,
        usage: "Olma, nok, shaftoli va o'rikdagi parsha, un-shudring va barg buralishiga qarshi tizimli fungitsid. 10 litr suvga 2-3 ml solinadi.",
      },
      {
        name: "Karate Zeon 050 CS",
        type: "crop",
        price: 35000,
        usage: "Mevali daraxtlar, g'alla va sabzavotlardagi shira, trips, olma qurti va kapalaklarga qarshi mikrokapsulali insektitsid. 10 l suvga 4 ml.",
      },
      {
        name: "Aktara 25 WG",
        type: "crop",
        price: 28000,
        usage: "Kolorado qo'ng'izi, o'simlik biti, oqqanot va barcha so'ruvchi hasharotlarga qarshi ildizdan va bargdan ta'sir qiluvchi preparat.",
      },
    ],
  },
  // 2-Dorixona: Dehqon Hamkori Do'koni (both)
  {
    pharmacyIndex: 1,
    meds: [
      {
        name: "Ivermektin 1% in'yeksiya",
        type: "animal",
        price: 38000,
        usage: "Qoramol, qo'y va echkilardagi gijja, teri osti bo'kayi, qo'tir va qon so'ruvchi bitlarga qarshi. Teri ostiga 1 ml/50 kg tirik vaznga.",
      },
      {
        name: "Oksitetratsiklin 200 LA",
        type: "animal",
        price: 55000,
        usage: "Uzoq muddatli ta'sirga ega keng qamrovli antibiotik. Pnevmoniya, tuyoq chirishi, metrit va jarohat infeksiyalarida mushak orasiga 1 marta.",
      },
      {
        name: "Proclaim 05 SG (Prokleyim)",
        type: "crop",
        price: 72000,
        usage: "Pomidor kuyasi (Tuta absoluta), g'o'za tunlami va meva qurtlariga qarshi yuqori samarali biologik asosli insektitsid.",
      },
      {
        name: "Amistar Top 325 SC",
        type: "crop",
        price: 115000,
        usage: "G'alla, poliz va sabzavotlardagi zang, antraknoz va alternariozga qarshi himoyalovchi va davolovchi fungitsid.",
      },
    ],
  },
  // 3-Dorixona: Vodiy Agro Kimyo (crop)
  {
    pharmacyIndex: 2,
    meds: [
      {
        name: "Match 050 EC (Match)",
        type: "crop",
        price: 52000,
        usage: "Bargxo'r va meva qurtlarining tuxum va lichinkalariga qarshi xitin sintezini to'xtatuvchi insektitsid. Gullashdan so'ng purkaladi.",
      },
      {
        name: "Koragen 20 SC (FMC)",
        type: "crop",
        price: 85000,
        usage: "Makkajo'xori, pomidor va olma qurtlariga qarshi yangi avlod insektitsidi. Yuqori haroratda ham 3 haftagacha ta'sirini saqlaydi.",
      },
      {
        name: "Konfidor Extra 70 WG",
        type: "crop",
        price: 45000,
        usage: "Pomidor, baqlajon va poliz ekinlaridagi trips, shira va oqqanotga qarshi samarali tizimli insektitsid.",
      },
      {
        name: "Antrakol 70 WP",
        type: "crop",
        price: 38000,
        usage: "Rux (Zn) elementi bilan boyitilgan kontakt fungitsid. Sabzavot va mevalarda parsha va dog'lanishning oldini oladi.",
      },
    ],
  },
  // 4-Dorixona: Zarafshon Agro-Vet (animal)
  {
    pharmacyIndex: 3,
    meds: [
      {
        name: "Nitoks 200 (Nita-Farm)",
        type: "animal",
        price: 48000,
        usage: "Qoramol, qo'y va cho'chqalarda nafas yo'llari, hazm a'zolari va siydik yo'llari infeksiyalarida samarali sekin so'riluvchi antibiotik.",
      },
      {
        name: "Albendazol 10% suspenziya",
        type: "animal",
        price: 22000,
        usage: "Oshqozon-ichak va o'pka nematodalari, sestoda va trematodalarga qarshi degelmintizatsiya. Ichishga og'iz orqali beriladi.",
      },
      {
        name: "Butafosfan + B12 (Katosal analogi)",
        type: "animal",
        price: 88000,
        usage: "Moddalar almashinuvini yaxshilovchi, darmonsizlik va tug'ruqdan keyingi charchoqni ketkazuvchi kuchli stimulyator.",
      },
      {
        name: "Kalsiy borglyukonat 20%",
        type: "animal",
        price: 19000,
        usage: "Sigirlarda tug'ruq falaji (gipokalsiyemiya), raxit, osteomalyatsiya va allergik reaksiyalarda tomirga/teri ostiga iliq holda yuboriladi.",
      },
    ],
  },
  // 5-Dorixona: Andijon Hosil Dorixonasi (crop)
  {
    pharmacyIndex: 4,
    meds: [
      {
        name: "Previkur Energy (Bayer)",
        type: "crop",
        price: 95000,
        usage: "Bodring va pomidor ko'chatlaridagi qora oyoq (ildiz chirishi) va soxta un-shudringga qarshi ildizdan sug'oriladigan fungitsid.",
      },
      {
        name: "Fitosporin-M (Biologik)",
        type: "crop",
        price: 18000,
        usage: "Bacillus subtilis bakteriyasi asosidagi tabiiy biologik fungitsid. O'simliklar meva tugish davrida kimyoviy qoldiqsiz davolaydi.",
      },
      {
        name: "Topaz 100 EC",
        type: "crop",
        price: 42000,
        usage: "Uzumdagi oidium (un-shudring), olma va mevali butalardagi zamburug'larga qarshi tez singuvchi dori.",
      },
      {
        name: "Keltan (Okaritsid)",
        type: "crop",
        price: 36000,
        usage: "O'rgamchakkana va qizil kanalarga qarshi barcha rivojlanish bosqichlarida samarali vosita.",
      },
    ],
  },
  // 6-Dorixona: Chorva va Parranda Dori Markazi (animal)
  {
    pharmacyIndex: 5,
    meds: [
      {
        name: "Enrofloksatsin 10% eritma",
        type: "animal",
        price: 42000,
        usage: "Buzoq, qo'zichoq va parrandalarning kolibakterioz, salmonellyoz va mikoplazmoz kasalliklariga qarshi ichiriladigan antibiotik.",
      },
      {
        name: "Mastisan-A (Mastitga qarshi)",
        type: "animal",
        price: 15000,
        usage: "Sigirlardagi kataral va yiringli mastitlarni davolash uchun yelin kanali orqali kiritiladigan maxsus shprits-tubik.",
      },
      {
        name: "Klozantel 5% in'yeksiya",
        type: "animal",
        price: 36000,
        usage: "Jigar qurti (fassiolyoz), oshqozon parazitlari va teri osti burun bo'kaylariga qarshi profilaktika va davolash.",
      },
      {
        name: "Multivitamin kompleksi (In'yeksiya)",
        type: "animal",
        price: 64000,
        usage: "A, D3, E, B guruh vitaminlari va aminokislotalar. Yosh mollarning immunitetini oshirish va o'sishini tezlashtirish uchun.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 4. YANGILIKLAR VA MASLAHATLAR
// ---------------------------------------------------------------------------
const NEWS = [
  {
    title: "Bahorgi birinchi purkash — mevali bog'lar uchun eng muhim bosqich",
    body: "Kurtak yorilishidan oldin havo harorati +5°C dan ko'tarilganda Bordo suyuqligi yoki Mis kuporosi bilan daraxtlarni to'liq yuvish lozim. Bu o'tgan yildan qolgan zamburug' sporalari va qishlagan zararkunandalar tuxumlarini 80% ga yo'q qiladi.",
    tag: "Agro",
  },
  {
    title: "Qorako'l qo'ylar va qoramollarda erta bahorgi degelmintizatsiya",
    body: "Yaylovga chiqarishdan kamida 10 kun oldin butun podaga Albendazol yoki Ivermektin preparatlari berilishi shart. Bu yaylov yerlarining qurt tuxumlari bilan zararlanishini oldini oladi va mollarning vazn olishini 25% ga tezlashtiradi.",
    tag: "Chorva",
  },
  {
    title: "Issiqxonalarda pomidor fitoftorozining oldini olish usullari",
    body: "Havoning yuqori namligi (85% dan ortiq) va haroratning 18-22°C oralig'ida bo'lishi fitoftoroz rivojlanishiga qulay sharoit yaratadi. Doimiy shamollatish va profilaktik maqsadda Ridomil Gold yoki Previkur Energy bilan ildizdan sug'orish tavsiya etiladi.",
    tag: "Agro",
  },
  {
    title: "Sigirlarda tug'ruqdan keyingi parez (falaj) xavfi va profilaktikasi",
    body: "Yuqori mahsuldor sigirlarda tuqqandan keyingi dastlabki 48 soatda qonda kalsiy keskin kamayishi mumkin. Buning oldini olish uchun quruq davrda konsentratlarni me'yorida berish va tuqqan zahoti Kalsiy borglyukonat eritmasini yuborish lozim.",
    tag: "Chorva",
  },
  {
    title: "Tomchilatib sug'orishda o'g'itlarni to'g'ri qo'llash (Fertigatsiya)",
    body: "Faqat 100% suvda eruvchi mineral o'g'itlardan foydalaning. Fosforli o'g'itlar bilan kalsiyli o'g'itlarni bir idishda aralashtirmang, aks holda erimaydigan cho'kma hosil bo'lib, tomizgichlarni tiqib qo'yadi.",
    tag: "Agro",
  },
];

export async function ensureSeed() {
  if (seeded) return;
  try {
    await seedInTransaction();
    seeded = true;
  } catch (err) {
    console.error("[seed] boshlang'ich ma'lumotlarni yozishda xato:", err);
  }
}

async function seedInTransaction() {
  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${SEED_LOCK_KEY})`);

    // Yangiliklar tekshiruvi
    const newsRows = await tx.execute<{ count: string }>(
      sql`select count(*)::text as count from news`
    );
    if (Number(newsRows.rows[0]?.count ?? "0") === 0) {
      await tx.insert(news).values(NEWS);
      console.log("  [seed] 5 ta yangilik/maslahat kiritildi.");
    }

    // Dorixonalar va Mutaxassislar tekshiruvi
    const specRows = await tx.execute<{ count: string }>(
      sql`select count(*)::text as count from specialists`
    );

    if (Number(specRows.rows[0]?.count ?? "0") === 0) {
      console.log("  [seed] Baza bo'sh — to'liq real ma'lumotlar kiritilmoqda...");

      // Dorixonalarni kiritamiz
      const pharmacyIds: number[] = [];
      for (const ph of PHARMACIES) {
        const inserted = await tx
          .insert(specialists)
          .values({
            ...ph,
            isActive: true,
          })
          .returning({ id: specialists.id });
        pharmacyIds.push(inserted[0].id);
      }

      // Mutaxassislarni kiritamiz
      const specialistIds: number[] = [];
      for (const sp of SPECIALISTS) {
        const inserted = await tx
          .insert(specialists)
          .values({
            ...sp,
            isActive: true,
          })
          .returning({ id: specialists.id });
        specialistIds.push(inserted[0].id);
      }

      // Dorilarni har bir dorixonaga biriktirib kiritamiz
      let firstMedicineId: number | null = null;
      for (const group of MEDICINES_BY_PHARMACY) {
        const phId = pharmacyIds[group.pharmacyIndex];
        if (!phId) continue;

        const medsToInsert = group.meds.map((m) => ({
          specialistId: phId,
          name: m.name,
          type: m.type,
          price: m.price,
          usage: m.usage,
          status: "bor",
        }));

        const insertedMeds = await tx
          .insert(specialistMedicines)
          .values(medsToInsert)
          .returning({ id: specialistMedicines.id });

        if (!firstMedicineId && insertedMeds.length > 0) {
          firstMedicineId = insertedMeds[0].id;
        }
      }

      // Har bir dorixona va mutaxassisga ishonchli reytinglar
      const ratingsToInsert: { specialistId: number; raterKey: string; stars: number }[] = [];
      for (const id of [...pharmacyIds, ...specialistIds]) {
        ratingsToInsert.push(
          { specialistId: id, raterKey: `seed-r-${id}-1`, stars: 5 },
          { specialistId: id, raterKey: `seed-r-${id}-2`, stars: 5 },
          { specialistId: id, raterKey: `seed-r-${id}-3`, stars: 4 }
        );
      }
      await tx.insert(specialistRatings).values(ratingsToInsert);

      // Namuna yetkazilgan buyurtma (+998901234567 telefon raqami bilan kuzatish uchun)
      if (pharmacyIds.length > 0 && firstMedicineId) {
        const ord = await tx
          .insert(orders)
          .values({
            pharmacySpecialistId: pharmacyIds[0],
            customerName: "Akromjon Karimov",
            customerPhone: "+998901234567",
            note: "Iltimos, soat 14:00 gacha yetkazing, zudlik bilan kerak",
            deliveryType: "delivery",
            customerAddress: "Toshkent shahri, Yunusobod tumani, 14-mavze",
            totalSum: 130000,
            status: "yetkazildi",
            ratingStars: 5,
            ratingNote: "Dori vositasi juda tez va sifatli yetkazib berildi, rahmat!",
            ratedAt: new Date(),
          })
          .returning({ id: orders.id });

        await tx.insert(orderItems).values({
          orderId: ord[0].id,
          medicineId: firstMedicineId,
          name: "Ridomil Gold MZ 68 WG",
          price: 65000,
          qty: 2,
        });
      }

      console.log(
        `  [seed] Muvaffaqiyatli yakunlandi: ${pharmacyIds.length} ta dorixona, ${specialistIds.length} ta mutaxassis, 24 ta dori preparati, reytinglar va namuna buyurtma qo'shildi.`
      );
    }
  });
}
