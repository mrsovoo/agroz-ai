"use client";

import type { ReactNode, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Heart, Pill, Sprout, Syringe, MapPin, Star } from "lucide-react";
import FadeImage from "@/components/FadeImage";
import ProductCardConnected from "@/components/ProductCardConnected";
import type { CartStorePharmacy } from "@/lib/cart-store";

export type ProductCardMedicine = {
  id: number;
  name: string;
  hasPhoto?: boolean;
  price?: number | null;
  type?: string | null;
  usage?: string | null;
  photoVersion?: string | null;
  status?: string | null;
  stockUnit?: string | null;
  ratingAvg?: number | null;
  ratingCount?: number;
  updatedAt?: string | null;
  pharmacyName?: string | null;
};

export type PharmacyMedicine = ProductCardMedicine;

export type ProductCardVariant = "lg" | "md" | "sm" | "row";

export interface ProductCardProps {
  /** Asosiy mahsulot obyekti */
  product?: ProductCardMedicine;
  /** Eskicha chaqiruvlar bilan moslik uchun */
  medicine?: ProductCardMedicine;
  /** Dorixona ma'lumotlari (agar uzatilsa, avtomatik bog'langan rejimda ishlaydi) */
  pharmacy?: CartStorePharmacy | null;
  /** Kartochka varianti: lg (katalog), md (bosh sahifa), sm (slayder), row (savat) */
  variant?: ProductCardVariant;
  /** Savatdagi soni (agar 0 dan katta bo'lsa stepper chiqadi) */
  qty?: number;
  /** Sevimlilar ro'yxatida bormi */
  isFavorite?: boolean;
  /** O'rtacha reyting */
  ratingAvg?: number | null;
  /** Sharhlar soni */
  ratingCount?: number;
  /** Joylashgan shahar yoki hudud matni */
  city?: string | null;
  /** Havola manzili (standart: /dori/:id) */
  linkHref?: string;
  /** Qo'shimcha amallar slot (masalan, maxsus tugma yoki savat boshqaruvi) */
  actions?: ReactNode;
  /** Chap tomondagi element slot (masalan, savatdagi checkbox) */
  leading?: ReactNode;
  /** Pastki/o'ngdagi qo'shimcha slot */
  subtitle?: ReactNode;
  /** Maxsus nishon (badge) */
  badge?: ReactNode;
  /** Qo'shimcha CSS klasslar */
  className?: string;
  /** Savat tugmasini yashirish */
  hideCartButton?: boolean;
  /** Savatga qo'shish callback */
  onAdd?: () => void;
  /** Miqdorni o'zgartirish (+1 / -1) callback */
  onChangeQty?: (delta: number) => void;
  /** Sevimlilarga qo'shish/olib tashlash callback */
  onToggleFavorite?: () => void;
  /** Kartochka bosilganda maxsus callback */
  onClick?: () => void;
  /** Eski nom bilan moslik */
  onCardClick?: () => void;
}

/**
 * Yagona standart narx formatlash funksiyasi:
 * Masalan: 12 000 so'm, 1 250 000 so'm yoki "Kelishiladi"
 */
export function formatPrice(price?: number | null): string {
  if (price === null || price === undefined || price <= 0) {
    return "Kelishiladi";
  }
  return new Intl.NumberFormat("ru-RU").format(price).replace(/\u00a0/g, " ") + " so'm";
}

/**
 * O'lchov birligini qisqartirish va tozalash
 */
export function formatUnit(stockUnit?: string | null): string {
  if (!stockUnit) return "dona";
  const u = stockUnit.toLowerCase().trim();
  if (u === "kg" || u === "kilo" || u === "kilogram" || u === "кг") return "kg";
  if (u === "litr" || u === "l" || u === "liter" || u === "литр" || u === "л") return "litr";
  if (u === "dona" || u === "donasi" || u === "ta" || u === "дона" || u === "sht") return "dona";
  return u;
}

/**
 * Qisqa shahar nomini aniqlash
 */
export function getShortCity(address?: string | null, orgName?: string | null): string {
  const text = `${address || ""} ${orgName || ""}`.toLowerCase();
  if (text.includes("toshkent vil")) return "Toshkent vil.";
  if (
    text.includes("toshkent sh") ||
    text.includes("toshkent") ||
    text.includes("chilonzor") ||
    text.includes("sergeli") ||
    text.includes("yunusobod")
  ) {
    return "Toshkent sh.";
  }
  if (text.includes("samarqand")) return "Samarqand";
  if (text.includes("farg'ona") || text.includes("fargona") || text.includes("vodiy")) return "Farg'ona";
  if (text.includes("andijon")) return "Andijon";
  if (text.includes("namangan")) return "Namangan";
  if (text.includes("buxoro") || text.includes("zarafshon")) return "Buxoro";
  if (text.includes("navoiy")) return "Navoiy";
  if (text.includes("qashqadaryo") || text.includes("qarshi")) return "Qashqadaryo";
  if (text.includes("surxondaryo") || text.includes("termiz")) return "Surxondaryo";
  if (text.includes("xorazm") || text.includes("urganch")) return "Xorazm";
  if (text.includes("jizzax")) return "Jizzax";
  if (text.includes("sirdaryo") || text.includes("guliston")) return "Sirdaryo";
  if (text.includes("qoraqalpog'iston") || text.includes("nukus")) return "Qoraqalpog'iston";
  if (address) {
    const first = address.split(",")[0].trim();
    return first.length <= 16 ? first : first.slice(0, 14) + "..";
  }
  return "O'zbekiston";
}

/**
 * Rasmsiz holat uchun bitta yagona toza placeholder
 */
export function renderMedicinePlaceholder(type?: string | null, iconSize = 22) {
  if (type === "crop") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 p-2 text-center select-none">
        <div className="flex items-center justify-center rounded-xl bg-white p-1.5 shadow-2xs border border-emerald-100/80">
          <Sprout size={iconSize} className="text-[#039e1e]" />
        </div>
        <span className="text-[9.5px] font-bold text-emerald-900/70">Ekin</span>
      </div>
    );
  }
  if (type === "animal") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-amber-50/80 to-amber-100/40 p-2 text-center select-none">
        <div className="flex items-center justify-center rounded-xl bg-white p-1.5 shadow-2xs border border-amber-100/80">
          <Syringe size={iconSize} className="text-amber-600" />
        </div>
        <span className="text-[9.5px] font-bold text-amber-900/70">Veterinariya</span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-neutral-50 to-neutral-100/70 p-2 text-center select-none">
      <div className="flex items-center justify-center rounded-xl bg-white p-1.5 shadow-2xs border border-neutral-200/70">
        <Pill size={iconSize} className="text-neutral-500" />
      </div>
      <span className="text-[9.5px] font-bold text-neutral-600/70">Dori</span>
    </div>
  );
}

const VARIANTS = {
  lg: {
    root: "group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-[20px] bg-white border border-neutral-200/80 p-2.5 sm:p-3 shadow-2xs transition-all duration-200 hover:shadow-xs hover:border-emerald-400/80 active:scale-[0.99]",
    imgWrap: "relative mb-2 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[14px] bg-white border border-neutral-200/70",
    title: "text-[13.5px] sm:text-[14.5px] font-black leading-snug text-neutral-900 line-clamp-2 min-h-[2.4rem] sm:min-h-[2.6rem] group-hover:text-[#039e1e] transition-colors",
    price: "text-[14px] sm:text-[15.5px] font-black text-neutral-900 tracking-tight whitespace-nowrap",
    badge: "text-[9.5px] px-2 py-0.5",
    city: "text-[11px] sm:text-[11.5px]",
  },
  md: {
    root: "group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-[18px] bg-white border border-neutral-200/80 p-2 sm:p-2.5 shadow-2xs transition-all duration-200 hover:shadow-xs hover:border-emerald-400/80 active:scale-[0.99]",
    imgWrap: "relative mb-1.5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[13px] bg-white border border-neutral-200/70",
    title: "text-[13px] sm:text-[13.5px] font-black leading-snug text-neutral-900 line-clamp-2 min-h-[2.3rem] sm:min-h-[2.4rem] group-hover:text-[#039e1e] transition-colors",
    price: "text-[13.5px] sm:text-[14.5px] font-black text-neutral-900 tracking-tight whitespace-nowrap",
    badge: "text-[9px] px-1.5 py-0.5",
    city: "text-[10.5px] sm:text-[11px]",
  },
  sm: {
    root: "group relative flex w-[110px] shrink-0 cursor-pointer flex-col justify-between rounded-[14px] bg-white border border-neutral-200/80 p-2 shadow-2xs transition-all duration-150 hover:border-emerald-400 active:scale-95",
    imgWrap: "relative mb-1 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[10px] bg-white border border-neutral-200/60",
    title: "text-[11px] font-bold leading-tight text-neutral-900 line-clamp-2 min-h-[1.85rem]",
    price: "text-[11px] font-black text-[#039e1e] tracking-tight truncate",
    badge: "hidden",
    city: "hidden",
  },
  row: {
    root: "group relative flex w-full cursor-pointer items-center justify-between rounded-[18px] bg-white border border-neutral-200/80 p-2 sm:p-2.5 shadow-2xs transition-all duration-150 hover:border-emerald-300 active:scale-[0.995]",
    imgWrap: "relative flex h-14 w-14 aspect-square shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white border border-neutral-200/70",
    title: "text-[13px] sm:text-[13.5px] font-bold text-neutral-900 line-clamp-2 leading-snug",
    price: "text-[12.5px] sm:text-[13.5px] font-black text-[var(--brand-green)] tracking-tight whitespace-nowrap",
    badge: "text-[9px] px-1.5 py-0.2",
    city: "text-[10.5px]",
  },
};

/**
 * Sof ko'rinish (Presentational) ProductCard komponenti.
 * Ichida loadCart/saveCart/confirm() mavjud emas, barcha ma'lumot va
 * amallar props orqali keladi.
 */
export function ProductCardUI({
  product,
  medicine,
  pharmacy,
  variant = "md",
  qty = 0,
  isFavorite = false,
  ratingAvg = 0,
  ratingCount = 0,
  city,
  linkHref,
  actions,
  leading,
  subtitle,
  badge,
  className,
  hideCartButton = false,
  onAdd,
  onChangeQty,
  onToggleFavorite,
  onClick,
  onCardClick,
}: ProductCardProps) {
  const router = useRouter();
  const item = product ?? medicine;
  if (!item) return null;

  const href = linkHref ?? `/dori/${item.id}`;
  const vConfig = VARIANTS[variant];
  const photoSrc = item.photoVersion
    ? `/api/medicines/${item.id}/photo?v=${item.photoVersion}`
    : `/api/medicines/${item.id}/photo`;

  const effectiveCity = city ?? (pharmacy ? getShortCity(pharmacy.address, pharmacy.name) : null);

  const handleCardClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
      return;
    }
    const cb = onClick ?? onCardClick;
    if (cb) {
      cb();
      return;
    }
    router.push(href);
  };

  // ===================== VARIANT: ROW (Savat va Buyurtma gorizontal) =====================
  if (variant === "row") {
    return (
      <div
        onClick={handleCardClick}
        className={`${vConfig.root} ${className ?? ""}`}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {leading && <div className="shrink-0">{leading}</div>}

          {/* Kvadrat Rasm */}
          <div className={vConfig.imgWrap}>
            {item.hasPhoto ? (
              <FadeImage
                src={photoSrc}
                alt={item.name}
                className="h-full w-full"
                fit="cover"
                fallback={renderMedicinePlaceholder(item.type, 18)}
              />
            ) : (
              renderMedicinePlaceholder(item.type, 18)
            )}
          </div>

          {/* Ma'lumot: Nom, Narx, Dona */}
          <div className="min-w-0 flex-1">
            <Link href={href} className="block group/title">
              <h4 className={`${vConfig.title} group-hover/title:text-[#039e1e] transition-colors`} title={item.name}>
                {item.name}
              </h4>
            </Link>

            {subtitle && <div className="mt-0.5">{subtitle}</div>}

            <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span className={vConfig.price}>{formatPrice(item.price)}</span>
              <span className="text-[10.5px] text-neutral-400 font-medium">
                / 1 {formatUnit(item.stockUnit)}
              </span>
            </div>
          </div>
        </div>

        {/* O'ng tomon amallari (stepper yoki o'chirish) */}
        {actions && <div className="shrink-0 ml-2">{actions}</div>}
      </div>
    );
  }

  // ===================== VARIANT: SM (Gorizontal slayder / Xarita) =====================
  if (variant === "sm") {
    return (
      <div
        onClick={handleCardClick}
        className={`${vConfig.root} ${className ?? ""}`}
        title={item.name}
      >
        <div className={vConfig.imgWrap}>
          {item.hasPhoto ? (
            <FadeImage
              src={photoSrc}
              alt={item.name}
              className="h-full w-full"
              fit="cover"
              fallback={renderMedicinePlaceholder(item.type, 16)}
            />
          ) : (
            renderMedicinePlaceholder(item.type, 16)
          )}
        </div>

        <div className="flex flex-col justify-between flex-1">
          <h4 className={vConfig.title}>{item.name}</h4>
          <p className={`mt-0.5 ${vConfig.price}`}>
            {formatPrice(item.price)}
          </p>
        </div>
      </div>
    );
  }

  // ===================== VARIANT: LG & MD (Tik cho'zilgan vertikal kartochka) =====================
  const hasReviews = ratingCount > 0 && ratingAvg && ratingAvg > 0;

  return (
    <div
      onClick={handleCardClick}
      className={`${vConfig.root} ${className ?? ""}`}
    >
      {/* 1. Rasm (aspect-[4/5] tik cho'zilgan, toza oq fonda, burchaklarda nishon va yurakcha) */}
      <div className={vConfig.imgWrap}>
        {/* Nishon (Toifa yoki Maxsus badge) */}
        <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
          {badge ? (
            badge
          ) : item.type === "crop" ? (
            <span className={`inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md font-bold text-emerald-800 shadow-2xs border border-emerald-200/60 ${vConfig.badge}`}>
              <Sprout size={10} className="text-[#039e1e]" /> Ekin
            </span>
          ) : item.type === "animal" ? (
            <span className={`inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md font-bold text-amber-900 shadow-2xs border border-amber-200/60 ${vConfig.badge}`}>
              <Syringe size={10} className="text-amber-600" /> Hayvon
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-md font-bold text-neutral-700 shadow-2xs border border-neutral-200/60 ${vConfig.badge}`}>
              <Pill size={10} className="text-neutral-500" /> Umumiy
            </span>
          )}
        </div>

        {/* Yurakcha ❤️ (faqat onToggleFavorite mavjud bo'lsa) */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? "Yoqtirilganlardan o'chirish" : "Sevimlilarga qo'shish"}
            className="absolute top-1.5 right-1.5 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-2xs border border-black/5 hover:bg-white active:scale-90 transition"
          >
            <Heart
              size={14}
              className={isFavorite ? "text-red-500 fill-red-500" : "text-neutral-400 hover:text-red-400"}
            />
          </button>
        )}

        <Link href={href} aria-label={item.name} className="block h-full w-full">
          {item.hasPhoto ? (
            <FadeImage
              src={photoSrc}
              alt={item.name}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
              fit="cover"
              fallback={renderMedicinePlaceholder(item.type, 24)}
            />
          ) : (
            renderMedicinePlaceholder(item.type, 24)
          )}
        </Link>
      </div>

      {/* 2. Ma'lumot qismi: Matnlar hech qachon kesilmaydi, overflow-hidden yo'q */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          {/* Manzil / Shahar */}
          {effectiveCity && (
            <div className={`flex items-center gap-1 font-medium text-neutral-400 mb-0.5 ${vConfig.city}`}>
              <MapPin size={10} className="text-[#039e1e] shrink-0" />
              <span className="truncate">{effectiveCity}</span>
            </div>
          )}

          {/* Dori Nomi: line-clamp-2 va min-h bilan hamma kartochkalar balandligi bir xil */}
          <Link href={href} className="block group/title">
            <h3 className={vConfig.title} title={item.name}>
              {item.name}
            </h3>
          </Link>

          {/* lg variantda qisqa tavsifdan 1 qator */}
          {variant === "lg" && item.usage && (
            <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 line-clamp-1 font-medium">
              {item.usage}
            </p>
          )}
        </div>

        {/* 3. Pastki blok: Reyting, Dona, Narx va Savat tugmasi / Stepper */}
        <div className="mt-2 pt-1 border-t border-neutral-100/90">
          {/* Reyting va o'lchov birligi qatori */}
          <div className="flex items-center justify-between gap-1 mb-1">
            {hasReviews ? (
              <div className="inline-flex items-center gap-0.5 text-amber-500 font-extrabold text-[10.5px] whitespace-nowrap">
                <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                <span>{ratingAvg?.toFixed(1)}</span>
                <span className="text-[9.5px] text-neutral-400 font-medium">
                  ({ratingCount})
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-0.5 text-[10px] text-neutral-400 font-medium whitespace-nowrap">
                <Star size={9.5} className="text-neutral-300 shrink-0" />
                <span>Yangi</span>
              </div>
            )}

            <span className="text-[10px] text-neutral-400 font-medium whitespace-nowrap">
              1 {formatUnit(item.stockUnit)}
            </span>
          </div>

          {/* Pastki qator: Chapda narx, o'ngda yumaloq "+" tugmasi yoki [- 2 +] stepper */}
          <div className="flex items-center justify-between gap-1 min-h-[36px]">
            {/* Chapda narx: whitespace-nowrap */}
            <div className="min-w-0 shrink">
              <p className={vConfig.price} title={formatPrice(item.price)}>
                {formatPrice(item.price)}
              </p>
            </div>

            {/* O'ngda tugma / stepper / slot */}
            {!hideCartButton && (
              <div className="shrink-0 ml-1">
                {actions ? (
                  actions
                ) : qty > 0 && onChangeQty ? (
                  /* Stepper: [-  2  +], kartochka kengligidan chiqib ketmaydi */
                  <div className="flex items-center rounded-full bg-[#eaf5e1] border border-[#039e1e]/30 p-0.5 text-[#039e1e] shadow-2xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChangeQty(-1);
                      }}
                      className="flex h-6 w-6 min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-white text-[#039e1e] shadow-2xs active:scale-90 transition font-black hover:bg-neutral-50"
                      aria-label="Kamaytirish"
                    >
                      <Minus size={11} strokeWidth={2.8} />
                    </button>

                    <span className="px-1.5 text-[11.5px] font-black tracking-tight select-none">
                      {qty}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChangeQty(1);
                      }}
                      className="flex h-6 w-6 min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-[#039e1e] text-white shadow-2xs active:scale-90 transition font-black hover:bg-[#028518]"
                      aria-label="Ko'paytirish"
                    >
                      <Plus size={11} strokeWidth={2.8} />
                    </button>
                  </div>
                ) : onAdd ? (
                  /* Yumaloq "+" tugmasi: h-9 w-9, bosish maydoni >= 40x40px */
                  <div className="relative p-0.5 -m-0.5 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAdd();
                      }}
                      className="flex h-9 w-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-[#039e1e] hover:bg-[#028518] text-white shadow-2xs hover:shadow-xs active:scale-90 transition-all duration-150"
                      aria-label="Savatga qo'shish"
                    >
                      <Plus size={16} strokeWidth={2.8} />
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standart eksport:
 * Agar props ichida pharmacy berilgan bo'lsa va onAdd/actions berilmagan bo'lsa,
 * avtomatik ravishda ProductCardConnected orqali to'liq savat/sevimli/reyting bilan ishlaydi.
 * Aks holda toza ProductCardUI sifatida render bo'ladi.
 */
export default function ProductCard(props: ProductCardProps) {
  if (props.pharmacy && !props.onAdd && !props.actions) {
    return <ProductCardConnected {...props} />;
  }
  return <ProductCardUI {...props} />;
}
