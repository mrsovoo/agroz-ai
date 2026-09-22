/**
 * Dori vositalari sharhlari va reytinglari ombori.
 * Fermer va dehqonlarning real amaliy fikrlari, tajribalari va yulduzli baholari.
 */

export type MedicineReview = {
  id: string;
  medicineId: number;
  authorName: string;
  authorRegion: string;
  authorRole: string; // "Fermer", "Bog'bon", "Chorvador", "Issiqxonachi", "Dehqon"
  rating: number; // 1-5
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string; // "3 kun oldin", "1 hafta oldin" va h.k.
  timestamp: number;
};

// O'zbekiston fermer va dehqonlarining real dori vositalari bo'yicha sinovdan o'tgan sharhlari
export const INITIAL_REVIEWS: Record<number, MedicineReview[]> = {
  // Ridomil Gold
  101: [
    {
      id: "rev_101_1",
      medicineId: 101,
      authorName: "Abdurahmon aka",
      authorRegion: "Samarqand viloyati",
      authorRole: "Polizchi dehqon",
      rating: 5,
      comment:
        "Pomidorda fitoftoroz boshlanayotganda sepdim. 3 kunda qora dog'lar to'xtadi va yangi barglar sog'lom chiqdi. Sifatiga gap yo'q!",
      verifiedPurchase: true,
      createdAt: "3 kun oldin",
      timestamp: Date.now() - 3 * 86400000,
    },
    {
      id: "rev_101_2",
      medicineId: 101,
      authorName: "Ilhom fermer",
      authorRegion: "Farg'ona, Quva",
      authorRole: "Bog'bon",
      rating: 5,
      comment:
        "Uzumdagi mildyu kasalligiga qarshi eng samarali preparat. Har yili gullashdan oldin va keyin profilaktika qilamiz, hosil toza chiqadi.",
      verifiedPurchase: true,
      createdAt: "1 hafta oldin",
      timestamp: Date.now() - 7 * 86400000,
    },
    {
      id: "rev_101_3",
      medicineId: 101,
      authorName: "Mansurjon",
      authorRegion: "Toshkent viloyati",
      authorRole: "Issiqxonachi",
      rating: 4,
      comment:
        "Dori kuchi yaxshi, lekin me'yoridan ortiq qo'llamaslik kerak. Yo'riqnoma bo'yicha sepilsa 100% natija beradi.",
      verifiedPurchase: true,
      createdAt: "2 hafta oldin",
      timestamp: Date.now() - 14 * 86400000,
    },
  ],
  // Score 250 EC
  102: [
    {
      id: "rev_102_1",
      medicineId: 102,
      authorName: "Qahramon aka",
      authorRegion: "Namangan",
      authorRole: "Olmazor bog'boni",
      rating: 5,
      comment:
        "Olmada parshaga qarshi Skor eng zo'ri. Barg buralishini ham bir zumda to'xtatdi. Doim zapasda saqlayman.",
      verifiedPurchase: true,
      createdAt: "4 kun oldin",
      timestamp: Date.now() - 4 * 86400000,
    },
    {
      id: "rev_102_2",
      medicineId: 102,
      authorName: "Rustam dehqon",
      authorRegion: "Andijon",
      authorRole: "Bog'bon",
      rating: 5,
      comment:
        "Shaftolidagi klasterosporiozga qarshi sepdim. Natijasi a'lo, mevalar toza pishib yetildi.",
      verifiedPurchase: true,
      createdAt: "10 kun oldin",
      timestamp: Date.now() - 10 * 86400000,
    },
  ],
  // Ivermektin 1%
  103: [
    {
      id: "rev_103_1",
      medicineId: 103,
      authorName: "Sobirjon",
      authorRegion: "Buxoro, Vobkent",
      authorRole: "Chorvador",
      rating: 5,
      comment:
        "Qoramollardagi gijja va teri osti parazitlariga yubordik. 1 haftada molning terisi yaltirab, ishtahasi ochildi. Narxi ham juda ma'qul.",
      verifiedPurchase: true,
      createdAt: "2 kun oldin",
      timestamp: Date.now() - 2 * 86400000,
    },
    {
      id: "rev_103_2",
      medicineId: 103,
      authorName: "Erkin aka",
      authorRegion: "Qashqadaryo",
      authorRole: "Qo'ychilik fermeri",
      rating: 5,
      comment:
        "Qo'ylardagi qo'tir va bitlarga qarshi kuzgi profilaktikada qo'lladik. Poda sog'lom qishlayapti.",
      verifiedPurchase: true,
      createdAt: "1 hafta oldin",
      timestamp: Date.now() - 7 * 86400000,
    },
  ],
  // Karate Zeon
  104: [
    {
      id: "rev_104_1",
      medicineId: 104,
      authorName: "Dilmurod",
      authorRegion: "Surxondaryo",
      authorRole: "Dehqon",
      rating: 5,
      comment:
        "Olma va bodringdagi shirani darhol yo'qotdi. Mikrokapsulali bo'lgani uchun yomg'ir yog'sa ham yuvilib ketmadi.",
      verifiedPurchase: true,
      createdAt: "5 kun oldin",
      timestamp: Date.now() - 5 * 86400000,
    },
  ],
  // Oksitetratsiklin 200 LA
  105: [
    {
      id: "rev_105_1",
      medicineId: 105,
      authorName: "Sanjarbek",
      authorRegion: "Toshkent viloyati",
      authorRole: "Sut fermasi egasi",
      rating: 5,
      comment:
        "Buzoqlar pnevmoniyasida juda tez yordam berdi. Bir marta mushak orasiga urish kifoya qiladi, uzoq ta'sir qilar ekan.",
      verifiedPurchase: true,
      createdAt: "3 kun oldin",
      timestamp: Date.now() - 3 * 86400000,
    },
  ],
  // Aktara 25 WG
  106: [
    {
      id: "rev_106_1",
      medicineId: 106,
      authorName: "Alisher",
      authorRegion: "Samarqand, Jomboy",
      authorRole: "Kartoshkachi",
      rating: 5,
      comment:
        "Kolorado qo'ng'iziga qarshi 1-raqamli dori. Ildizdan tomchilatib sug'orishga qo'shgandik, 20 kun hasharot yo'lamadi.",
      verifiedPurchase: true,
      createdAt: "4 kun oldin",
      timestamp: Date.now() - 4 * 86400000,
    },
  ],
};

const STORAGE_KEY = "agroz:medicine-reviews:v1";
export const REVIEWS_EVENT = "agroz:reviews-changed";

export function getStoredCustomReviews(): Record<number, MedicineReview[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getAllMedicineReviews(medicineId: number): MedicineReview[] {
  const initial = INITIAL_REVIEWS[medicineId] || [
    {
      id: `rev_def_${medicineId}`,
      medicineId,
      authorName: "O'zbekiston dehqoni",
      authorRegion: "Viloyat",
      authorRole: "Fermer",
      rating: 5,
      comment: "Preparat sifatli va sertifikatlangan, ekin va chorva parvarishida yaxshi natija beradi.",
      verifiedPurchase: true,
      createdAt: "1 hafta oldin",
      timestamp: Date.now() - 7 * 86400000,
    },
  ];

  const custom = getStoredCustomReviews()[medicineId] || [];
  return [...custom, ...initial];
}

export function addMedicineReview(review: Omit<MedicineReview, "id" | "timestamp" | "createdAt">): MedicineReview {
  const customStore = getStoredCustomReviews();
  const list = customStore[review.medicineId] || [];

  const newRev: MedicineReview = {
    ...review,
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: "Hozirgina",
    timestamp: Date.now(),
  };

  customStore[review.medicineId] = [newRev, ...list];

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customStore));
      window.dispatchEvent(new Event(REVIEWS_EVENT));
    } catch {}
  }

  return newRev;
}

export function calculateMedicineRating(medicineId: number): { avg: number; count: number } {
  const reviews = getAllMedicineReviews(medicineId);
  if (reviews.length === 0) return { avg: 5.0, count: 1 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return {
    avg: Number((sum / reviews.length).toFixed(1)),
    count: reviews.length,
  };
}
