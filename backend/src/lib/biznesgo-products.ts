import {
  BIZNESGO_PRODUCT_CATEGORIES,
  BIZNESGO_PRODUCT_STATUSES,
  BIZNESGO_PRODUCT_UNITS,
  type BiznesGoProductCategory,
  type BiznesGoProductStatus,
  type BiznesGoProductUnit,
} from "../db/schema.js";

/**
 * Maksimal ruxsat etilgan rasm hajmi: 200 KB (siqilgan rasm uchun).
 * Katta Base64 rasmlar PostgreSQL bazasiga yozilmaydi.
 */
export const MAX_PRODUCT_IMAGE_BYTES = 200 * 1024; // 200 KB

export interface ProductImageValidationResult {
  ok: boolean;
  imageUrl: string | null;
  error?: string;
}

/**
 * Mahsulot rasmini tekshirish va saqlashga tayyorlash.
 * Arxitektura kelajakda Cloudflare R2 yoki Railway Volume'ga oson ulanish uchun mo'ljallangan.
 */
export function validateAndPrepareProductImage(rawInput: unknown): ProductImageValidationResult {
  if (rawInput === undefined || rawInput === null || rawInput === "") {
    return { ok: true, imageUrl: null };
  }

  if (typeof rawInput !== "string") {
    return { ok: false, imageUrl: null, error: "Rasm formati noto‘g‘ri" };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { ok: true, imageUrl: null };
  }

  // 1. Tashqi URL (https:// yoki http://) yoki nisbiy /uploads/... yo'li
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/uploads/")) {
    if (trimmed.length > 1024) {
      return {
        ok: false,
        imageUrl: null,
        error: "Rasm URL manzili juda uzun (maksimum 1024 belgi)",
      };
    }
    return { ok: true, imageUrl: trimmed };
  }

  // 2. Kichik hajmdagi siqilgan data:image/... format
  const dataUriMatch = trimmed.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!dataUriMatch) {
    return {
      ok: false,
      imageUrl: null,
      error: "Faqat JPG, PNG, WEBP formatdagi rasm yoki to‘g‘ri URL manzil qabul qilinadi",
    };
  }

  const base64Payload = dataUriMatch[2].replace(/\s+/g, "");
  const approxByteLength = Math.floor((base64Payload.length * 3) / 4);

  if (approxByteLength > MAX_PRODUCT_IMAGE_BYTES) {
    const kb = Math.round(approxByteLength / 1024);
    return {
      ok: false,
      imageUrl: null,
      error: `Rasm hajmi juda katta (${kb} KB). Maksimal ruxsat etilgan hajm — 200 KB.`,
    };
  }

  return { ok: true, imageUrl: `data:image/${dataUriMatch[1].toLowerCase()};base64,${base64Payload}` };
}

export function isValidProductCategory(val: unknown): val is BiznesGoProductCategory {
  return typeof val === "string" && (BIZNESGO_PRODUCT_CATEGORIES as readonly string[]).includes(val);
}

export function isValidProductUnit(val: unknown): val is BiznesGoProductUnit {
  return typeof val === "string" && (BIZNESGO_PRODUCT_UNITS as readonly string[]).includes(val);
}

export function isValidProductStatus(val: unknown): val is BiznesGoProductStatus {
  return typeof val === "string" && (BIZNESGO_PRODUCT_STATUSES as readonly string[]).includes(val);
}

/**
 * Qoldiq (stock) o'zgarganda mahsulot statusini avtomatik hisoblash.
 * - Agar joriy yoki yangi status 'archived' bo'lsa va faollashtirish so'ralmagan bo'lsa -> 'archived'
 * - stock === 0 bo'lsa -> 'out_of_stock'
 * - stock > 0 bo'lsa -> 'active'
 */
export function resolveProductStatusFromStock(
  stock: number,
  requestedStatus?: string | null,
): BiznesGoProductStatus {
  if (requestedStatus === "archived") {
    return "archived";
  }
  if (stock <= 0) {
    return "out_of_stock";
  }
  return "active";
}

export interface ValidatedProductCreateInput {
  name: string;
  category: BiznesGoProductCategory;
  description: string | null;
  price: number;
  unit: BiznesGoProductUnit;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  status: BiznesGoProductStatus;
}

export function validateCreateProductPayload(
  body: Record<string, unknown> | null | undefined,
): { ok: true; data: ValidatedProductCreateInput } | { ok: false; error: string } {
  const payload = body || {};

  const rawName = typeof payload.name === "string" ? payload.name.trim() : "";
  if (rawName.length < 2) {
    return { ok: false, error: "Mahsulot nomi kamida 2 ta belgidan iborat bo‘lishi shart" };
  }
  if (rawName.length > 200) {
    return { ok: false, error: "Mahsulot nomi 200 ta belgidan oshmasligi kerak" };
  }

  if (payload.price === undefined || payload.price === null || payload.price === "") {
    return { ok: false, error: "Mahsulot narxi kiritilishi shart" };
  }
  const parsedPrice = Number(payload.price);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
    return { ok: false, error: "Mahsulot narxi 0 dan katta son bo‘lishi kerak" };
  }
  const price = Math.round(parsedPrice);

  const rawUnit = typeof payload.unit === "string" ? payload.unit.trim().toLowerCase() : "";
  if (!isValidProductUnit(rawUnit)) {
    return { ok: false, error: "Mahsulot o‘lchov birligi tanlanishi shart" };
  }

  if (payload.stock === undefined || payload.stock === null || payload.stock === "") {
    return { ok: false, error: "Ombor qoldig‘i kiritilishi shart" };
  }
  const parsedStock = Number(payload.stock);
  if (!Number.isFinite(parsedStock) || parsedStock < 0) {
    return { ok: false, error: "Ombor qoldig‘i 0 yoki undan katta son bo‘lishi kerak" };
  }
  const stock = Math.floor(parsedStock);

  const rawMinStock = payload.minStock ?? payload.min_stock ?? 5;
  const parsedMinStock = Number(rawMinStock);
  if (!Number.isFinite(parsedMinStock) || parsedMinStock < 0) {
    return { ok: false, error: "Minimal qoldiq chegarasi 0 yoki undan katta son bo‘lishi kerak" };
  }
  const minStock = Math.floor(parsedMinStock);

  const rawCategory =
    typeof payload.category === "string" && payload.category.trim()
      ? payload.category.trim()
      : "general";
  if (!isValidProductCategory(rawCategory)) {
    return { ok: false, error: "Noto‘g‘ri mahsulot kategoriyasi tanlandi" };
  }

  const rawDescription =
    typeof payload.description === "string" ? payload.description.trim().slice(0, 1000) : null;

  const rawImage = payload.imageUrl ?? payload.image_url ?? payload.image ?? null;
  const imgResult = validateAndPrepareProductImage(rawImage);
  if (!imgResult.ok) {
    return { ok: false, error: imgResult.error || "Rasm tekshiruvdan o‘tmadi" };
  }

  const status = resolveProductStatusFromStock(
    stock,
    typeof payload.status === "string" ? payload.status : undefined,
  );

  return {
    ok: true,
    data: {
      name: rawName,
      category: rawCategory,
      description: rawDescription || null,
      price,
      unit: rawUnit,
      stock,
      minStock,
      imageUrl: imgResult.imageUrl,
      status,
    },
  };
}

