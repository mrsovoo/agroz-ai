/**
 * Agro-mahsulotlar sharhlari va reytinglari ombori.
 * Standart/demo sharhlar yo'q: yangi loyiha 0 data bilan boshlanadi.
 */

export type MedicineReview = {
  id: string;
  medicineId: number;
  orderId?: number;
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

export function hasRatedOrderItem(orderId: number, medicineId: number): boolean {
  const reviews = getAllMedicineReviews(medicineId);
  return reviews.some((r) => r.orderId === orderId);
}

export function getOrderItemRating(orderId: number, medicineId: number): MedicineReview | undefined {
  const reviews = getAllMedicineReviews(medicineId);
  return reviews.find((r) => r.orderId === orderId);
}

export function addMedicineReview(
  review: Omit<MedicineReview, "id" | "timestamp" | "createdAt">,
): MedicineReview {
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

export function calculateMedicineRating(medicineId: number): {
  avg: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
} {
  const reviews = getAllMedicineReviews(medicineId);
  if (reviews.length === 0) {
    return {
      avg: 0,
      count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
    sum += star;
  }

  return {
    avg: Number((sum / reviews.length).toFixed(1)),
    count: reviews.length,
    distribution,
  };
}
