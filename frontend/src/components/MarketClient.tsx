"use client";

/**
 * Agro Bozor — platformadagi barcha ro'yxatdan o'tgan agro-do&apos;konlar agro-mahsulotlari.
 *
 * • Bo'limlar: Hammasi / 🌱 Ekin uchun / 🐄 Hayvonlar uchun (agro-mahsulot `type` maydoni)
 * • Qidiruv: agro-mahsulot nomi, qo'llanishi va agro-do&apos;kon nomi bo'yicha
 * • Radius: 5/10/25/50 km — foydalanuvchi joylashuvidan
 * • Kartochka: rasm tepada, ostida agro-mahsulot nomi, narxi va agro-do&apos;kon nomi
 * • Savat: bir vaqtda bitta agro-do&apos;kon agro-mahsulotlari; buyurtma Telegram orqali
 *   agro-do&apos;kon egasiga yetib boradi, holatini mijoz telefon raqami bilan kuzatadi
 * • ❤️ Yoqtirilganlar: brauzerda (localStorage) saqlanadi, alohida ro'yxatda
 * • Reyting: yetkazilgan buyurtmani 1–5 yulduz bilan baholash — qancha yaxshi
 *   baholansa, agro-do&apos;kon reytingi shuncha oshadi
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Minus,
  Navigation,
  Phone,
  Pill,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Sprout,
  Star,
  Store,
  Syringe,
  Trash2,
  User,
  X,
} from "lucide-react";
import CartButton from "@/components/CartButton";
import { RADIUS_OPTIONS, AUTH_BOT_URL } from "@/lib/constants";
import FadeImage from "@/components/FadeImage";
import {
  loadCart,
  saveCart,
  openCart,
  notifyCartChanged,
  CART_EVENT,
  type CartStoreState,
} from "@/lib/cart-store";
import ProductCard from "@/components/ProductCard";
import {
  loadFavorites,
  toggleFavorite as toggleFavStore,
  FAV_EVENT,
  type FavKey,
} from "@/lib/favorites-store";
import { formatOrderNumber } from "@/lib/format";
import { apiFetch } from "@/lib/api-config";

type Medicine = {
  id: number;
  name: string;
  status: string;
  hasPhoto: boolean;
  photoVersion?: string | null;
  type: string;
  usage: string | null;
  price: number | null;
  stockUnit?: string;
  updatedAt?: string | null;
};

type Pharmacy = {
  id: number;
  name: string;
  phone: string;
  role: string;
  specialty: string | null;
  organization: string | null;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number | null;
  locked: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  medicines: Medicine[];
};

/** Kartochka — agro-mahsulot + uning agro-do&apos;konsi (grid'da flat ko'rsatiladi). */
type Card = { pharmacy: Pharmacy; medicine: Medicine };

function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

function TypeIcon({ type, size = 30 }: { type: string; size?: number }) {
  if (type === "animal") return <Syringe size={size} />;
  if (type === "crop") return <Sprout size={size} />;
  return <Pill size={size} />;
}

function typeBadge(type: string): { label: string; bg: string; color: string } {
  if (type === "crop") return { label: "🌱 Ekin", bg: "var(--brand-green-soft)", color: "var(--brand-green)" };
  if (type === "animal") return { label: "🐄 Hayvon", bg: "var(--brand-yellow-soft)", color: "var(--brand-ink)" };
  return { label: "📦 Umumiy", bg: "#ccfbf1", color: "#0d9488" };
}


export default function MarketClient() {
  const [items, setItems] = useState<Pharmacy[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(1000);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  // Bo'limlar: all | crop | animal
  const [section, setSection] = useState<"all" | "crop" | "animal">("all");
  // Qidiruv
  const [query, setQuery] = useState("");

  // Yoqtirilganlar (localStorage)
  const [favorites, setFavorites] = useState<FavKey[]>([]);
  const [favsOpen, setFavsOpen] = useState(false);

  // Savat: umumiy localStorage ombori — bosh sahifa kartochkalari bilan bir xil savat.
  const [cartState, setCartStateLocal] = useState<CartStoreState>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    name?: string | null;
    phone?: string | null;
    secondPhone?: string | null;
  } | null>(null);
  const [cartNote, setCartNote] = useState("");
  const [cartDelivery, setCartDelivery] = useState<"pickup" | "delivery">("pickup");
  const [cartAddress, setCartAddress] = useState("");
  const [cartBusy, setCartBusy] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [orderDone, setOrderDone] = useState<{
    orderId: number;
    total: number;
    deliveryType: "pickup" | "delivery";
    pharmacyName: string;
    pharmacyPhone: string;
    pharmacyAddress?: string | null;
    customerAddress?: string | null;
    customerPhone: string;
  } | null>(null);
  const [locDetecting, setLocDetecting] = useState(false);


  // ---- Yoqtirilganlar: umumiy store'dan yuklash ----
  useEffect(() => {
    const sync = () => setFavorites(loadFavorites());
    sync();
    window.addEventListener(FAV_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(FAV_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agroz_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name) setCurrentUser(parsed);
      }
    } catch {}

    apiFetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("agroz_user", JSON.stringify(data.user));
        }
      })
      .catch(() => {});
  }, []);



  function toggleFavorite(pharmacyId: number, medicineId: number) {
    toggleFavStore(pharmacyId, medicineId);
  }

  const isFavorite = (pharmacyId: number, medicineId: number) =>
    favorites.some((f) => f.pharmacyId === pharmacyId && f.medicineId === medicineId);

  const [userRegion, setUserRegion] = useState<string | null>(null);

  // ---- Joylashuv ----
  useEffect(() => {
    const fallback = () => {
      setCoords({ lat: 41.3111, lng: 69.2797 });
      setUserRegion("Toshkent");
      setLocError("Lokatsiya ruxsati berilmagan — Toshkent markazi bo'yicha ko'rsatilmoqda");
    };
    if (!navigator.geolocation) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setLocError(null);
        fetch(`/api/location?lat=${lat}&lng=${lng}`)
          .then((r) => r.json())
          .then((d: { region?: string | null }) => {
            if (d?.region) setUserRegion(d.region);
          })
          .catch(() => {});
      },
      fallback,
      { maximumAge: 5 * 60 * 1000, timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  // ---- Agro-do&apos;konlar (agro-mahsulotlari bilan) ----
  useEffect(() => {
    const params = new URLSearchParams({ radius: String(radiusKm), role: "pharmacy" });
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    if (userRegion) {
      params.set("region", userRegion);
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/specialists?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items?: Pharmacy[] }) => {
        if (cancelled) return;
        const list = Array.isArray(d?.items) ? d.items : [];
        // Barcha faol agro-do'konlar va ularning dorilarini to'liq ko'rsatamiz
        setItems(
          list.filter(
            (s) => s.role === "pharmacy" && (s.medicines?.length ?? 0) > 0,
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, radiusKm, userRegion]);

  function expandRadius() {
    const nextOption = RADIUS_OPTIONS.find((r) => r > radiusKm);
    setRadiusKm(nextOption ?? 1000);
  }

  // ---- Filtrlash: bo'lim + qidiruv → flat kartochkalar ----
  const cards = useMemo<Card[]>(() => {
    const q = query.trim().toLowerCase();
    const list: Card[] = [];
    for (const p of items) {
      if (p.locked) continue;
      for (const m of p.medicines) {
        if (m.status === "yoq") continue;
        if (section !== "all" && m.type !== section && m.type !== "general") continue;
        if (q) {
          const haystack = `${m.name} ${m.usage ?? ""} ${p.organization ?? p.name}`.toLowerCase();
          if (!haystack.includes(q)) continue;
        }
        list.push({ pharmacy: p, medicine: m });
      }
    }
    return list;
  }, [items, section, query]);

  const displayCards = cards;

  // Yoqtirilgan kartochkalar (agro-mahsulotlar o'chirilgan bo'lsa ro'yxatdan tushadi).
  const favCards = useMemo<Card[]>(
    () =>
      cards.filter((c) =>
        favorites.some((f) => f.pharmacyId === c.pharmacy.id && f.medicineId === c.medicine.id),
      ),
    [cards, favorites],
  );

  const favCount = favorites.length;
  const cartPharmacyId = cartState?.pharmacy.id ?? null;
  const cartCount = (cartState?.lines ?? []).reduce((acc, l) => acc + l.qty, 0);
  const cartTotal = (cartState?.lines ?? []).reduce(
    (acc, l) => acc + (l.medicine.price ?? 0) * l.qty,
    0,
  );

  /** Savatni omborga yozadi va boshqa komponentlarga xabar beradi. */
  function updateCart(next: CartStoreState) {
    setCartStateLocal(next);
    saveCart(next);
    notifyCartChanged();
  }

  /** Kartochkadan agro-mahsulot qo'shish — savatga to'g'ridan-to'g'ri qo'shiladi. */
  function addToCart(pharmacy: Pharmacy, medicine: Medicine) {
    const newPharmacy = {
      id: pharmacy.id,
      name: pharmacy.organization ?? pharmacy.name,
      phone: pharmacy.phone,
      address: pharmacy.address,
    };
    if (!cartState || !Array.isArray(cartState.lines) || cartState.lines.length === 0) {
      updateCart({
        pharmacy: newPharmacy,
        lines: [{ medicine, pharmacy: newPharmacy, qty: 1 }],
      });
      return;
    }
    const existing = cartState.lines.find((l) => l.medicine.id === medicine.id);
    const lines = existing
      ? cartState.lines.map((l) =>
          l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
        )
      : [...cartState.lines, { medicine, pharmacy: newPharmacy, qty: 1 }];
    updateCart({ pharmacy: cartState.pharmacy || newPharmacy, lines });
  }

  function changeQty(medicineId: number, delta: number) {
    if (!cartState) return;
    const lines = cartState.lines
      .map((l) =>
          l.medicine.id === medicineId ? { ...l, qty: Math.max(0, Math.min(99, l.qty + delta)) } : l,
      )
      .filter((l) => l.qty > 0);
    updateCart({ ...cartState, lines });
  }

  /** Mijozning joriy GPS joylashuvidan manzilini aniqlab inputga yozadi */
  async function detectLocationAddress() {
    if (!navigator.geolocation) {
      setCartError("Qurilmangizda geolokatsiya qo'llab-quvvatlanmaydi");
      return;
    }
    setLocDetecting(true);
    setCartError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`/api/location?lat=${lat}&lng=${lng}&full=1`);
          const data = (await res.json()) as { ok?: boolean; place?: string | null };
          if (data.ok && data.place) {
            setCartAddress(data.place);
          } else {
            setCartAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        } catch {
          setCartError("Manzilni avtomatik aniqlab bo'lmadi, iltimos qo'lda yozing");
        } finally {
          setLocDetecting(false);
        }
      },
      () => {
        setLocDetecting(false);
        setCartError("Geolokatsiya ruxsati berilmadi. Iltimos, manzilni o'zingiz yozing");
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }

  async function submitOrder() {
    if (!cartState || cartState.lines.length === 0) return;
    const cleanPhone = (currentUser?.phone || currentUser?.secondPhone || "").replace(/\D/g, "").replace(/^998/, "").slice(-9);
    if (!cleanPhone || cleanPhone.length !== 9) {
      setCartError("Buyurtma berish uchun avval tizimga kiring yoki profilingizda telefon raqamingizni kiriting");
      return;
    }
    if (cartDelivery === "delivery" && !cartAddress.trim()) {
      setCartError("Iltimos, yetkazib berish manzilini kiriting");
      return;
    }

    const currentPharmacy = cartState.pharmacy;
    const cartPharmacyId = currentPharmacy.id;
    const cart = cartState.lines;
    const phoneFull = `+998${cleanPhone}`;
    const customerName = currentUser?.name?.trim() || "Mijoz";

    setCartBusy(true);
    setCartError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacySpecialistId: cartPharmacyId,
          items: cart.map((l) => ({ medicineId: l.medicine.id, qty: l.qty })),
          customerName,
          customerPhone: phoneFull,
          note: cartNote.trim() || undefined,
          deliveryType: cartDelivery,
          customerAddress: cartDelivery === "delivery" ? cartAddress.trim() : undefined,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        orderId?: number;
        total?: number;
        deliveryType?: string;
        customerAddress?: string;
        pharmacy?: { id: number; name: string; phone: string; address?: string | null };
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Buyurtma yuborilmadi");
      setOrderDone({
        orderId: data.orderId!,
        total: data.total ?? cartTotal,
        deliveryType: cartDelivery,
        pharmacyName: data.pharmacy?.name ?? currentPharmacy.name,
        pharmacyPhone: data.pharmacy?.phone ?? currentPharmacy.phone,
        pharmacyAddress: data.pharmacy?.address ?? currentPharmacy.address ?? null,
        customerAddress: cartDelivery === "delivery" ? cartAddress.trim() : null,
        customerPhone: cleanPhone,
      });
      updateCart(null);
      setCartNote("");
    } catch (e) {
      setCartError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setCartBusy(false);
    }
  }


  const sectionTabs: { v: typeof section; l: string }[] = [
    { v: "all", l: "Hammasi" },
    { v: "crop", l: "🌱 Ekin uchun" },
    { v: "animal", l: "🐄 Hayvonlar uchun" },
  ];

  /** Kartochka tanasi — bozor grid'i va yoqtirilganlar ro'yxatida umumiy. */

  return (
    <div className="min-h-screen bg-white px-4 pt-3 pb-24 text-neutral-900 web:bg-transparent web:px-0 web:pt-0 web:pb-12">
      {/* 1. Header: Dorilar + Heart (Sevimlilar) tugmasi */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <h1 className="text-[28px] font-black tracking-tight text-neutral-900 web:text-[34px]">Dorilar</h1>
        <button
          onClick={() => setFavsOpen(true)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white border border-neutral-200/90 shadow-2xs transition active:scale-95 hover:bg-neutral-50"
          aria-label="Sevimlilar"
        >
          <Heart size={21} strokeWidth={2} className="text-[#ef4444]" />
          {favCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-black text-white border-2 border-white shadow-xs">
              {favCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Qidiruv — rasmda 'qidiruv' placeholder bilan */}
      <div className="mt-2 flex items-center gap-3 rounded-[20px] bg-white px-4 py-3.5 border border-neutral-200/90 shadow-2xs focus-within:border-[#039e1e] transition">
        <Search size={20} className="shrink-0 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="qidiruv"
          maxLength={80}
          className="w-full bg-transparent text-[15.5px] font-medium text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Tozalash"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* 3. Toifalar: Hammasi | 🌱 Ekin uchun | 🐄 Hayvonlar uchun */}
      <div className="mt-3.5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {sectionTabs.map((t) => {
          const active = section === t.v;
          return (
            <button
              key={t.v}
              onClick={() => setSection(t.v)}
              className={`shrink-0 rounded-xl px-4 py-2 text-[13px] font-bold transition-all active:scale-95 ${
                active
                  ? "bg-[#039e1e] text-white shadow-2xs"
                  : "bg-[#f4f5f7] text-neutral-700 hover:bg-neutral-200/80"
              }`}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Kartochkalar grid'i */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="animate-spin text-[#039e1e]" size={28} />
        </div>
      ) : displayCards.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-white p-6 sm:p-8 text-center border border-black/5 shadow-xs">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf5e1] text-[#039e1e]"
          >
            <Store size={32} />
          </span>

          {query ? (
            <>
              <p className="mt-3.5 text-[17px] font-bold text-neutral-900">
                «{query}» bo&apos;yicha dori topilmadi
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500 max-w-md mx-auto">
                Qidiruv so&apos;zini tekshirib ko&apos;ring, boshqa bo&apos;limga o&apos;ting yoki qidiruvni tozalang.
              </p>
              <button
                onClick={() => setQuery("")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-[13px] font-bold text-white hover:bg-neutral-800 active:scale-95 transition"
              >
                <X size={15} /> Qidiruvni tozalash
              </button>
            </>
          ) : (
            <>
              <p className="mt-3.5 text-[17px] font-bold text-neutral-900">
                Hozircha dorilar ro&apos;yxati mavjud emas
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500 max-w-md mx-auto">
                Yaqin orada agro-do&apos;konlar tomonidan yangi dorilar joylashtiriladi.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {displayCards.map((c) => (
            <ProductCard
              key={`${c.pharmacy.id}:${c.medicine.id}`}
              variant="lg"
              medicine={c.medicine}
              pharmacy={{
                id: c.pharmacy.id,
                name: c.pharmacy.organization ?? c.pharmacy.name,
                phone: c.pharmacy.phone,
                address: c.pharmacy.address,
                ratingAvg: c.pharmacy.ratingAvg,
                ratingCount: c.pharmacy.ratingCount,
              }}
            />
          ))}
        </div>
      )}


      {/* Yoqtirilganlar bottom sheet */}
      {favsOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setFavsOpen(false)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[18px] font-black text-[var(--brand-ink)]">
                ❤️ Yoqtirilganlar {favCards.length > 0 && `(${favCards.length})`}
              </p>
              <button onClick={() => setFavsOpen(false)} aria-label="Yopish" className="p-1 text-[var(--brand-muted)]">
                <X size={20} />
              </button>
            </div>
            {favCards.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Heart size={30} className="text-[var(--brand-muted)]" />
                <p className="text-[15px] font-bold text-[var(--brand-ink)]">Ro&apos;yxat bo&apos;sh</p>
                <p className="text-[13px] leading-relaxed text-[var(--brand-muted)]">
                  Dorilar kartochkasidagi ❤️ belgisini bosib, keyinroq uchun saqlab qo&apos;ying.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2 pb-2">
                {favCards.map((c) => {
                  const inCart =
                    cartState?.pharmacy.id === c.pharmacy.id
                      ? cartState.lines.find((l) => l.medicine.id === c.medicine.id)
                      : undefined;
                  return (
                    <ProductCard
                      key={`${c.pharmacy.id}:${c.medicine.id}`}
                      product={{
                        id: c.medicine.id,
                        name: c.medicine.name,
                        price: c.medicine.price,
                        type: c.medicine.type,
                        hasPhoto: c.medicine.hasPhoto,
                        photoVersion: c.medicine.photoVersion,
                        stockUnit: c.medicine.stockUnit,
                      }}
                      variant="row"
                      subtitle={
                        <p className="flex items-center gap-1 text-[11px] text-neutral-400">
                          <Store size={10} className="shrink-0" />
                          <span className="line-clamp-1">{c.pharmacy.organization ?? c.pharmacy.name}</span>
                        </p>
                      }
                      actions={
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => addToCart(c.pharmacy, c.medicine)}
                            className="flex items-center justify-center gap-1 rounded-xl px-2.5 py-1.5 text-[11.5px] font-bold text-white shadow-2xs"
                            style={inCart ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" } : { background: "var(--brand-green)" }}
                          >
                            {inCart ? <Check size={12} /> : <ShoppingCart size={12} />}
                            {inCart ? `(${inCart.qty})` : "Savatga"}
                          </button>
                          <a
                            href={`tel:${c.pharmacy.phone.replace(/\s/g, "")}`}
                            className="flex items-center justify-center gap-1 rounded-xl bg-white border border-neutral-200/80 px-2 py-1.5 text-[11.5px] font-bold text-neutral-700 shadow-2xs"
                          >
                            <Phone size={12} />
                          </a>
                          <button
                            onClick={() => toggleFavorite(c.pharmacy.id, c.medicine.id)}
                            aria-label="Yoqtirilganlardan olib tashlash"
                            className="p-1 text-neutral-400 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Savat bottom sheet */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setCartOpen(false)}
        >
          <div
            className="max-h-[88dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle" />
            {orderDone ? (
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                  >
                    <Check size={32} />
                  </span>
                  <p className="text-[20px] font-black text-[var(--brand-ink)]">
                    Buyurtma qabul qilindi!
                  </p>
                  <p className="text-[13px] leading-relaxed text-[var(--brand-muted)]">
                    Buyurtmangiz <b>{formatOrderNumber(orderDone.orderId)}</b> raqami bilan agro-do&apos;kon egasiga Telegram orqali yuborildi.
                  </p>
                </div>

                {/* Buyurtma cheki / vaucheri */}
                <div className="space-y-3 rounded-2xl border border-[var(--brand-sep)] bg-[var(--brand-bg)] p-4">
                  <div className="flex items-center justify-between border-b border-[var(--brand-sep)] pb-2.5">
                    <span className="text-[12px] font-bold text-[var(--brand-muted)]">Buyurtma raqami</span>
                    <span className="text-[15px] font-black text-[var(--brand-ink)] font-mono">{formatOrderNumber(orderDone.orderId)}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-[var(--brand-sep)] pb-2.5">
                    <span className="text-[12px] font-bold text-[var(--brand-muted)]">Qabul qilish usuli</span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold shadow-xs"
                      style={
                        orderDone.deliveryType === "delivery"
                          ? { background: "#dbeafe", color: "#1e40af" }
                          : { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
                      }
                    >
                      {orderDone.deliveryType === "delivery" ? "🛵 Yetkazib berish" : "🏪 O'zim olib ketaman"}
                    </span>
                  </div>

                  {orderDone.deliveryType === "delivery" ? (
                    <div className="border-b border-[var(--brand-sep)] pb-2.5">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                        Yetkazish manzili
                      </span>
                      <p className="mt-1 text-[13px] font-semibold text-[var(--brand-ink)]">
                        {orderDone.customerAddress || "Manzil ko'rsatilmadi"}
                      </p>
                    </div>
                  ) : (
                    <div className="border-b border-[var(--brand-sep)] pb-2.5">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                        Agro-do&apos;kondan olib ketish manzili
                      </span>
                      <p className="mt-1 text-[13px] font-semibold text-[var(--brand-ink)]">
                        {orderDone.pharmacyAddress || "Agro-do&apos;kon manzili ko'rsatilmagan"}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-[var(--brand-sep)] pb-2.5">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                        Agro-do&apos;kon
                      </span>
                      <p className="text-[13.5px] font-bold text-[var(--brand-ink)]">
                        {orderDone.pharmacyName}
                      </p>
                    </div>
                    {orderDone.pharmacyPhone && (
                      <a
                        href={`tel:${orderDone.pharmacyPhone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--brand-green)] shadow-xs hover:bg-zinc-50"
                      >
                        <Phone size={12} /> Qo&apos;ng&apos;iroq
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[14px] font-bold text-[var(--brand-ink)]">Jami to&apos;lov:</span>
                    <span className="text-[17px] font-black text-[var(--brand-green)]">
                      {shortSum(orderDone.total)} so&apos;m
                    </span>
                  </div>
                </div>

                <p className="text-[12px] leading-relaxed text-[var(--brand-muted)] text-center">
                  Agro-do&apos;kon buyurtmangizni qabul qilgach sizga aloqaga chiqishi mumkin.
                </p>

                {/* Tugmalar */}
                <div className="space-y-2">
                  <Link
                    href="/profil"
                    onClick={() => {
                      setOrderDone(null);
                      setCartOpen(false);
                    }}
                    className="ios-btn w-full flex items-center justify-center gap-1.5"
                  >
                    Profilga o&apos;tish va kuzatish
                  </Link>

                  <button
                    onClick={() => {
                      setOrderDone(null);
                      setCartOpen(false);
                    }}
                    className="ios-btn secondary w-full"
                  >
                    <Check size={16} /> Yopish
                  </button>
                </div>
              </div>
            ) : cartState === null || cartState.lines.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <ShoppingCart size={32} className="text-[var(--brand-muted)]" />
                <p className="text-[15px] font-bold text-[var(--brand-ink)]">Savat bo&apos;sh</p>
                <p className="text-[13px] text-[var(--brand-muted)]">
                  Dorilardagi «Savatga» tugmasini bosing
                </p>
                <button onClick={() => setCartOpen(false)} className="ios-btn secondary mt-2 w-full">
                  <X size={17} /> Yopish
                </button>
              </div>
            ) : (
              <>
                <div className="mt-2 flex items-start justify-between">
                  <div>
                    <p className="text-[18px] font-black text-[var(--brand-ink)]">
                      Savat · {cartState.pharmacy.name}
                    </p>
                    {cartState.pharmacy.address && (
                      <p className="flex items-center gap-1 text-[11.5px] text-[var(--brand-muted)]">
                        <MapPin size={11} className="shrink-0" />
                        <span className="line-clamp-1">{cartState.pharmacy.address}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setCartOpen(false)}
                    aria-label="Yopish"
                    className="p-1 text-[var(--brand-muted)]"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {cartState.lines.map((l) => (
                    <ProductCard
                      key={l.medicine.id}
                      product={{
                        id: l.medicine.id,
                        name: l.medicine.name,
                        price: l.medicine.price,
                        type: l.medicine.type,
                        hasPhoto: l.medicine.hasPhoto,
                        photoVersion: l.medicine.photoVersion,
                        stockUnit: l.medicine.stockUnit,
                      }}
                      variant="row"
                      actions={
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => changeQty(l.medicine.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 shadow-2xs font-bold"
                            aria-label="Kamaytirish"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="w-5 text-center text-[13px] font-black">{l.qty}</span>
                          <button
                            onClick={() => changeQty(l.medicine.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 shadow-2xs font-bold"
                            aria-label="Oshirish"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => changeQty(l.medicine.id, -l.qty)}
                            className="p-1 text-neutral-400 hover:text-red-500 ml-1"
                            aria-label="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      }
                    />
                  ))}
                </div>
                <p className="mt-3 text-right text-[15px] font-black text-[var(--brand-ink)]">
                  Jami: <span className="text-[var(--brand-green)]">{shortSum(cartTotal)} so&apos;m</span>
                </p>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Buyurtmachi ma&apos;lumotlari
                    </label>
                    {currentUser ? (
                      <div className="flex items-center justify-between rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/90 shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-neutral-900 leading-tight">
                              {currentUser.name || "Ro'yxatdan o'tgan mijoz"}
                            </p>
                            <p className="text-[12px] font-medium text-neutral-500 mt-0.5">
                              {currentUser.phone || currentUser.secondPhone || "Telefon ko'rsatilmagan"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-800">
                          Profil
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-amber-50/80 p-3 border border-amber-200 text-[12px] text-amber-900">
                        <p className="font-bold">⚠️ Buyurtma berish uchun tizimga kiring</p>
                        <Link
                          href="/kirish"
                          className="mt-1.5 inline-block text-[11.5px] font-bold text-[var(--brand-green)] underline"
                        >
                          Tizimga kirish / Ro&apos;yxatdan o&apos;tish
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Qabul qilish usulini tanlash */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Qabul qilish usuli <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCartDelivery("pickup")}
                        className={`relative flex flex-col items-start justify-between rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] ${
                          cartDelivery === "pickup"
                            ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]/50 shadow-xs"
                            : "border-[var(--brand-sep)] bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xl">🏪</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              cartDelivery === "pickup"
                                ? "bg-[var(--brand-green)] text-white"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Bepul
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-[13px] font-black text-[var(--brand-ink)]">
                            O&apos;zim olib ketaman
                          </p>
                          <p className="text-[11px] text-[var(--brand-muted)]">
                            Agro-do&apos;kondan olish
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCartDelivery("delivery")}
                        className={`relative flex flex-col items-start justify-between rounded-2xl border-2 p-3 text-left transition active:scale-[0.98] ${
                          cartDelivery === "delivery"
                            ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]/50 shadow-xs"
                            : "border-[var(--brand-sep)] bg-white hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-xl">🛵</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              cartDelivery === "delivery"
                                ? "bg-[var(--brand-green)] text-white"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            Kuryer
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-[13px] font-black text-[var(--brand-ink)]">
                            Yetkazib berilsin
                          </p>
                          <p className="text-[11px] text-[var(--brand-muted)]">
                            Manzilga yetkazish
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Qabul qilish usuliga mos ma'lumotlar bloki */}
                  {cartDelivery === "pickup" ? (
                    <div className="space-y-2 rounded-2xl border border-[var(--brand-sep)] bg-[var(--brand-bg)] p-3.5">
                      <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--brand-ink)]">
                        <Store size={15} className="text-[var(--brand-green)] shrink-0" />
                        <span>Agro-do&apos;kondan olib ketish manzili:</span>
                      </div>
                      <p className="flex items-start gap-1.5 text-[12.5px] font-medium text-[var(--brand-ink)]">
                        <MapPin size={14} className="mt-0.5 text-[var(--brand-green)] shrink-0" />
                        <span>{cartState.pharmacy.address || "Agro-do&apos;kon manzili ko'rsatilmagan"}</span>
                      </p>
                      {cartState.pharmacy.phone && (
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--brand-sep)]">
                          <span className="text-[11.5px] text-[var(--brand-muted)]">Agro-do&apos;kon telefoni:</span>
                          <a
                            href={`tel:${cartState.pharmacy.phone.replace(/\s/g, "")}`}
                            className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--brand-green)] hover:underline"
                          >
                            <Phone size={12} /> +998 {cartState.pharmacy.phone}
                          </a>
                        </div>
                      )}
                      <p className="text-[11px] leading-relaxed text-[var(--brand-muted)]">
                        💡 Buyurtma berganingizdan so&apos;ng, agro-do&apos;kon xodimi dorilarni tayyorlab qo&apos;yadi va siz istalgan vaqtda borib olib ketishingiz mumkin.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 rounded-2xl border border-[var(--brand-sep)] bg-[var(--brand-bg)] p-3.5">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                          <MapPin size={13} className="text-[var(--brand-green)]" />
                          Yetkazish manzili <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={detectLocationAddress}
                          disabled={locDetecting}
                          className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[var(--brand-green)] hover:underline active:scale-95 disabled:opacity-50"
                        >
                          {locDetecting ? (
                            <>
                              <Loader2 size={12} className="animate-spin" /> Aniqlanmoqda...
                            </>
                          ) : (
                            <>
                              <Navigation size={12} /> Joylashuvimni aniqlash
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={cartAddress}
                        onChange={(e) => setCartAddress(e.target.value)}
                        placeholder="Viloyat/tuman, qishloq/mahalla, ko'cha, uy raqami yoki mo'ljal..."
                        rows={2}
                        maxLength={300}
                        className="ios-input resize-none bg-white text-[13px]"
                      />
                      <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-2.5 text-[11.5px] leading-snug text-amber-900 border border-amber-200/60">
                        <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                        <span>
                          Yetkazib berish narxi va vaqti masofaga qarab agro-do&apos;kon kuryeri tomonidan belgilanadi va siz bilan telefon orqali kelishiladi.
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Izoh (ixtiyoriy)
                    </label>
                    <textarea
                      value={cartNote}
                      onChange={(e) => setCartNote(e.target.value)}
                      placeholder="Qo'shimcha istaklaringiz (masalan, ertalab soat 10 gacha kerak)"
                      rows={2}
                      maxLength={300}
                      className="ios-input resize-none"
                    />
                  </div>
                </div>

                {cartError && (
                  <p className="mt-2.5 rounded-xl bg-[var(--brand-red-soft)] p-2.5 text-[12.5px] font-semibold text-[#d7263d]">
                    {cartError}
                  </p>
                )}

                <button
                  onClick={submitOrder}
                  disabled={
                    cartBusy ||
                    !currentUser ||
                    !(currentUser.phone || currentUser.secondPhone) ||
                    (cartDelivery === "delivery" && !cartAddress.trim())
                  }
                  className="ios-btn mt-3.5 w-full disabled:opacity-50"
                >
                  <ShoppingCart size={17} />
                  {cartBusy ? "Yuborilmoqda..." : "Buyurtma berish"}
                </button>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--brand-muted)]">
                  Buyurtma agro-do&apos;kon egasiga Telegram orqali yetib boradi. Yetkazilgach
                  yulduzcha bilan baholaysiz — reyting shunga qarab oshadi.
                </p>
              </>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
