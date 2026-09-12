import { db } from "@/db";
import { medicines, news, pharmacies, pharmacyStocks } from "@/db/schema";
import { sql } from "drizzle-orm";

type PharmacySeed = {
  name: string;
  kind: "agro" | "vet";
  lat: number;
  lng: number;
  phone: string;
  address: string;
  specialist?: string;
};

const PHARMACIES: PharmacySeed[] = [
  { name: "AgroHimiya Savdo", kind: "agro", lat: 41.3111, lng: 69.2797, phone: "+998 71 200 11 22", address: "Toshkent sh., Yunusobod t., Amir Temur ko'chasi 12" },
  { name: "Dehqon Yordam Do'koni", kind: "agro", lat: 41.2995, lng: 69.2401, phone: "+998 90 123 45 67", address: "Toshkent sh., Chilonzor t., Bunyodkor 45" },
  { name: "Vet-Servis Klinikasi", kind: "vet", lat: 41.3265, lng: 69.2285, phone: "+998 93 555 77 88", address: "Toshkent sh., Shayxontohur t., Navoiy 8", specialist: "Vet. shifokor Alisher Qodirov" },
  { name: "Hosil Plus Agromarket", kind: "agro", lat: 41.2755, lng: 69.2035, phone: "+998 71 244 30 30", address: "Toshkent sh., Sergeli t., Yangi Sergeli 3" },
  { name: "Chorva Dori Markazi", kind: "vet", lat: 41.3402, lng: 69.3341, phone: "+998 94 700 60 50", address: "Toshkent sh., Mirzo Ulug'bek t., Mirzo Ulug'bek 77", specialist: "Vet. Dilshod Ergashev" },
  { name: "Agro Bozor Samarqand", kind: "agro", lat: 39.6542, lng: 66.9597, phone: "+998 66 233 12 12", address: "Samarqand sh., Registon ko'chasi 21" },
  { name: "Zarafshon Veterinariya", kind: "vet", lat: 39.6721, lng: 66.9446, phone: "+998 91 300 22 44", address: "Samarqand sh., Bo'stonsaroy 14", specialist: "Vet. Sanjar Toirov" },
  { name: "Buxoro AgroKimyo", kind: "agro", lat: 39.7747, lng: 64.4286, phone: "+998 65 221 44 55", address: "Buxoro sh., Mustaqillik 9" },
  { name: "Qorako'l Chorva Dorixonasi", kind: "vet", lat: 39.7480, lng: 64.4155, phone: "+998 90 611 33 77", address: "Buxoro sh., Gijduvon yo'li 4", specialist: "Vet. Nodira Rasulova" },
  { name: "Farg'ona Agro Ta'minot", kind: "agro", lat: 40.3864, lng: 71.7864, phone: "+998 73 244 55 66", address: "Farg'ona sh., Mustaqillik 102" },
  { name: "Marg'ilon Vet Punkti", kind: "vet", lat: 40.4712, lng: 71.7243, phone: "+998 99 512 18 19", address: "Marg'ilon sh., Turkiston 5", specialist: "Vet. Bekzod Ismoilov" },
  { name: "Andijon Dehqon Servis", kind: "agro", lat: 40.7821, lng: 72.3442, phone: "+998 74 223 77 88", address: "Andijon sh., Bobur shoh 31" },
  { name: "Namangan AgroMarket", kind: "agro", lat: 40.9983, lng: 71.6726, phone: "+998 69 227 90 90", address: "Namangan sh., Uychi ko'chasi 18" },
  { name: "Namangan Vet Klinikasi", kind: "vet", lat: 41.0071, lng: 71.6432, phone: "+998 88 404 50 60", address: "Namangan sh., Davlatobod 7", specialist: "Vet. Ozoda Yo'ldosheva" },
  { name: "Qashqadaryo Agro Ta'minot", kind: "agro", lat: 38.8610, lng: 65.7847, phone: "+998 75 221 33 44", address: "Qarshi sh., Nasaf 60" },
  { name: "Surxon Chorva Markazi", kind: "vet", lat: 37.2242, lng: 67.2783, phone: "+998 97 330 10 20", address: "Termiz sh., Al-Hakim at-Termiziy 22", specialist: "Vet. Rustam Xolmatov" },
  { name: "Xorazm Agro Do'kon", kind: "agro", lat: 41.5500, lng: 60.6333, phone: "+998 62 224 66 77", address: "Urganch sh., Al-Xorazmiy 15" },
  { name: "Nukus Veterinariya Xizmati", kind: "vet", lat: 42.4600, lng: 59.6166, phone: "+998 61 222 80 90", address: "Nukus sh., Do'stlik 40", specialist: "Vet. Aybek Seytov" },
  { name: "Jizzax Hosil Agro", kind: "agro", lat: 40.1158, lng: 67.8422, phone: "+998 72 226 12 34", address: "Jizzax sh., Sharof Rashidov 3" },
  { name: "Navoiy Agro-Vet Market", kind: "agro", lat: 40.1030, lng: 65.3735, phone: "+998 79 223 45 56", address: "Navoiy sh., Galaba 11", specialist: "Vet. Shuhrat Nazarov" },
];

const MEDICINES: { name: string; type: "agro" | "vet"; usage: string }[] = [
  { name: "Mis kuporosi (Bordo suyuqligi)", type: "agro", usage: "Zamburug' kasalliklari: mildyu, parsha, dog'lanish." },
  { name: "Ridomil Gold", type: "agro", usage: "Fitoftoroz va mildyuga qarshi kuchli fungitsid." },
  { name: "Karate Zeon", type: "agro", usage: "Shira, tripslar va kapalak qurtlariga qarshi insektitsid." },
  { name: "Aktara", type: "agro", usage: "Shira (o'simlik biti), oq qanotli pashshaga qarshi." },
  { name: "Oltingugurt (kolloid)", type: "agro", usage: "Un-shudring (mildew) va kanalarga qarshi." },
  { name: "Konfidor", type: "agro", usage: "So'ruvchi zararkunandalarga qarshi tizimli preparat." },
  { name: "Fitosporin-M", type: "agro", usage: "Biologik fungitsid, ildiz chirishiga qarshi." },
  { name: "Topaz", type: "agro", usage: "Un-shudringga qarshi fungitsid." },
  { name: "Okstetratsiklin 200 LA", type: "vet", usage: "Bakterial infeksiyalar, pnevmoniya, mastit." },
  { name: "Nitoks 200", type: "vet", usage: "Nafas yo'llari va yuqumli kasalliklar uchun antibiotik." },
  { name: "Ivermektin 1%", type: "vet", usage: "Ichki va tashqi parazitlar (qo'tir, gijja)." },
  { name: "Albendazol 10%", type: "vet", usage: "Gijjaga qarshi (dehelmintizatsiya)." },
  { name: "Kalsiy borglyukonat", type: "vet", usage: "Tug'ruqdan keyingi parez, kalsiy yetishmovchiligi." },
  { name: "Vitam (vitamin kompleksi)", type: "vet", usage: "Immunitetni mustahkamlash, vitamin yetishmovchiligi." },
  { name: "Mastimetrin", type: "vet", usage: "Sigirlarda mastit davolash." },
  { name: "Biseptim ko'z tomchisi", type: "vet", usage: "Ko'z shilliq pardasi yallig'lanishi." },
];

const NEWS: { title: string; body: string; tag: string }[] = [
  {
    title: "Bahorgi purkash mavsumi boshlandi",
    body: "Mevali daraxtlarga birinchi purkashni kurtak yorilishidan oldin, havo harorati +5°C dan yuqori bo'lganda Bordo suyuqligi bilan bajaring. Shamol tezligi 4 m/s dan oshsa purkamang.",
    tag: "Agro",
  },
  {
    title: "Qorako'l qo'ylarida gijja profilaktikasi",
    body: "Har 3 oyda bir marta Albendazol bilan dehelmintizatsiya o'tkazing. Dori berishdan oldin hayvonni 8 soat och saqlash tavsiya etiladi.",
    tag: "Chorva",
  },
  {
    title: "Kartoshkada fitoftoroz xavfi ortdi",
    body: "Namlik yuqori va harorat 15-20°C bo'lgan kunlarda fitoftoroz tez tarqaladi. Profilaktika uchun Ridomil Gold ni 10 kunda bir marta qo'llang.",
    tag: "Agro",
  },
  {
    title: "Issiq kunlarda sigirlarni parvarishlash",
    body: "Harorat 30°C dan oshganda sut mahsuldorligi 20% gacha tushadi. Soyabon, doimiy toza suv va tuzli lizunets bilan ta'minlang.",
    tag: "Chorva",
  },
  {
    title: "Bug'doyda sariq zang belgilarini erta aniqlang",
    body: "Bargda sariq chiziqli dog'lar paydo bo'lsa, darhol fungitsid purkang. Kechiktirilsa hosilning 40% gacha qismi yo'qoladi.",
    tag: "Agro",
  },
];

// Which medicines are available in which pharmacy (deterministic pseudo-random)
function stockStatus(pharmacyId: number, medicineId: number) {
  return (pharmacyId * 7 + medicineId * 13) % 3 === 0 ? "yoq" : "bor";
}

let seeded = false;

export async function ensureSeed() {
  if (seeded) return;
  const rows = await db.execute<{ count: string }>(
    sql`select count(*)::text as count from pharmacies`,
  );
  const count = Number(rows.rows[0]?.count ?? "0");
  if (count > 0) {
    seeded = true;
    return;
  }

  const insertedPharmacies = await db
    .insert(pharmacies)
    .values(PHARMACIES.map((p) => ({ ...p, specialist: p.specialist ?? null })))
    .returning({ id: pharmacies.id });

  const insertedMedicines = await db
    .insert(medicines)
    .values(MEDICINES)
    .returning({ id: medicines.id });

  const stockRows: { pharmacyId: number; medicineId: number; status: string; price: number }[] = [];
  for (const p of insertedPharmacies) {
    for (const m of insertedMedicines) {
      stockRows.push({
        pharmacyId: p.id,
        medicineId: m.id,
        status: stockStatus(p.id, m.id),
        price: 20000 + ((p.id * m.id * 3700) % 180000),
      });
    }
  }
  await db.insert(pharmacyStocks).values(stockRows);
  await db.insert(news).values(NEWS);
  seeded = true;
}
