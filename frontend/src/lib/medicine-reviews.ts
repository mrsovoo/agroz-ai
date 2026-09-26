/**
 * Dori vositalari sharhlari va reytinglari ombori.
 * Standart/demo sharhlar yo'q: yangi loyiha 0 data bilan boshlanadi.
 */

export type MedicineReview = {
  id: string;
  medicineId: number;
  authorName: string;
  authorRegion: string;
  authorRole: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
  timestamp: number;
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
  return getStoredCustomReviews()[medicineId] || [];
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
  if (reviews.length === 0) return { avg: 0, count: 0 };

  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return {
    avg: Number((sum / reviews.length).toFixed(1)),
    count: reviews.length,
  };
}
