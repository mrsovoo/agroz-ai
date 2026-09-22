"use client";

/**
 * Agro Bozor — platformadagi barcha ro'yxatdan o'tgan dorixonalar dorilari.
 *
 * • Bo'limlar: Hammasi / 🌱 Ekin uchun / 🐄 Hayvonlar uchun (dori `type` maydoni)
 * • Qidiruv: dori nomi, qo'llanishi va dorixona nomi bo'yicha
 * • Radius: 5/10/25/50 km — foydalanuvchi joylashuvidan
 * • Kartochka: rasm tepada, ostida dori nomi, narxi va dorixona nomi
 * • Savat: bir vaqtda bitta dorixona dorilari; buyurtma Telegram orqali
 *   dorixona egasiga yetib boradi, holatini mijoz telefon raqami bilan kuzatadi
 * • ❤️ Yoqtirilganlar: brauzerda (localStorage) saqlanadi, alohida ro'yxatda
 * • Reyting: yetkazilgan buyurtmani 1–5 yulduz bilan baholash — qancha yaxshi
 *   baholansa, dorixona reytingi shuncha oshadi
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
  X,
} from "lucide-react";
import CartButton from "@/components/CartButton";
import { RADIUS_OPTIONS } from "@/lib/constants";
import FadeImage from "@/components/FadeImage";
import {
  loadCart,
  saveCart,
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

type Medicine = {
  id: number;
  name: string;
  status: string;
  hasPhoto: boolean;
  type: string;
  usage: string | null;
  price: number | null;
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

/** Kartochka — dori + uning dorixonasi (grid'da flat ko'rsatiladi). */
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
  const [radiusKm] = useState(5);
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
  const [cartName, setCartName] = useState("");
  const [cartPhone, setCartPhone] = useState("");
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

  // Buyurtma kuzatuvi va reyting
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState<
    {
      id: number;
      status: string;
      totalSum: number | null;
      pharmacyName: string | null;
      ratingStars: number | null;
      items: { medicineId?: number; name: string; qty: number }[];
    }[] | null
  >(null);
  const [trackBusy, setTrackBusy] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

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

  function toggleFavorite(pharmacyId: number, medicineId: number) {
    toggleFavStore(pharmacyId, medicineId);
  }

  const isFavorite = (pharmacyId: number, medicineId: number) =>
    favorites.some((f) => f.pharmacyId === pharmacyId && f.medicineId === medicineId);

  // ---- Joylashuv ----
  useEffect(() => {
    const fallback = () => {
      setCoords({ lat: 41.3111, lng: 69.2797 });
      setLocError("Lokatsiya ruxsati berilmagan — Toshkent markazi bo'yicha ko'rsatilmoqda");
    };
    if (!navigator.geolocation) {
      fallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError(null);
      },
      fallback,
      { maximumAge: 5 * 60 * 1000, timeout: 8000, enableHighAccuracy: false },
    );
  }, []);

  // ---- Dorixonalar (dorilari bilan) ----
  useEffect(() => {
    const params = new URLSearchParams({ radius: String(radiusKm) });
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/specialists?${params.toString()}`)
      .then((r) => r.json())
      .then((d: { items?: Pharmacy[] }) => {
        if (cancelled) return;
        const list = Array.isArray(d?.items) ? d.items : [];
        setItems(list.filter((s) => s.role === "pharmacy" && (s.medicines?.length ?? 0) > 0));
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
  }, [coords, radiusKm]);

  // ---- Filtrlash: bo'lim + qidiruv → flat kartochkalar ----
  const cards = useMemo<Card[]>(() => {
    const q = query.trim().toLowerCase();
    const list: Card[] = [];
    for (const p of items) {
      for (const m of p.medicines) {
        if (m.status !== "bor") continue;
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

  // Yoqtirilgan kartochkalar (dorilar o'chirilgan bo'lsa ro'yxatdan tushadi).
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

  /** Kartochkadan dori qo'shish — savatga to'g'ridan-to'g'ri qo'shiladi. */
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
    if (!cartName.trim()) {
      setCartError("Iltimos, ismingizni kiriting");
      return;
    }
    const cleanPhone = cartPhone.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
    if (cleanPhone.length < 9) {
      setCartError("Iltimos, to'liq telefon raqamingizni kiriting (+998...)");
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

    setCartBusy(true);
    setCartError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacySpecialistId: cartPharmacyId,
          items: cart.map((l) => ({ medicineId: l.medicine.id, qty: l.qty })),
          customerName: cartName.trim(),
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

  async function trackOrders() {
    setTrackBusy(true);
    setTrackError(null);
    setTrackResult(null);
    try {
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(trackPhone)}`);
      const data = (await res.json()) as {
        orders?: { id: number; status: string; totalSum: number | null; pharmacyName: string | null; ratingStars: number | null; items: { name: string; qty: number }[] }[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      setTrackResult(data.orders ?? []);
    } catch (e) {
      setTrackError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setTrackBusy(false);
    }
  }

  async function rateOrder(orderId: number, stars: number) {
    const res = await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, customerPhone: trackPhone, stars }),
    });
    if (res.ok) {
      await trackOrders();
    } else {
      const data = (await res.json()) as { error?: string };
      setTrackError(data.error ?? "Baho saqlanmadi");
    }
  }

  const sectionTabs: { v: typeof section; l: string }[] = [
    { v: "all", l: "Hammasi" },
    { v: "crop", l: "🌱 Ekin uchun" },
    { v: "animal", l: "🐄 Hayvonlar uchun" },
  ];

  /** Kartochka tanasi — bozor grid'i va yoqtirilganlar ro'yxatida umumiy. */

  return (
    <div className="px-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between pt-3">
        <div>
          <p className="ios-sub">Katalog</p>
          <h1 className="ios-title">Dorilar</h1>
          <p className="mt-1 text-[13px] font-medium text-[var(--brand-muted)]">
            Dorilar katalogi · {radiusKm} km radius
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <CartButton />
          <button
            onClick={() => setFavsOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#e0245e] shadow-sm active:scale-95"
            aria-label="Yoqtirilganlar"
          >
            <Heart size={20} />
            {favCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e0245e] px-1 text-[10px] font-black text-white">
                {favCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-green)] shadow-sm active:scale-95"
            aria-label="Savat"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-red)] px-1 text-[10px] font-black text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Qidiruv */}
      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-sm">
        <Search size={17} className="shrink-0 text-[var(--brand-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Dori nomi, kasallik yoki dorixona..."
          maxLength={80}
          className="w-full bg-transparent text-[14px] font-medium text-[var(--brand-ink)] outline-none placeholder:text-[var(--brand-muted)]"
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Tozalash" className="text-[var(--brand-muted)]">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Bo'limlar */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {sectionTabs.map((t) => {
          const active = section === t.v;
          return (
            <button
              key={t.v}
              onClick={() => setSection(t.v)}
              className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition active:scale-95 ${
                active ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
              }`}
              style={active ? { background: "var(--brand-green)" } : undefined}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {/* Radius (standart 5 km) */}
      <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[12px] text-[var(--brand-muted)] shadow-xs">
        <span className="flex items-center gap-1.5 font-bold">
          <MapPin size={13} className="text-[var(--brand-green)]" />
          Yaqin atrof radiusi: <b className="text-[var(--brand-ink)]">5 km</b>
        </span>
        <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          Eng yaqin dorixonalar
        </span>
      </div>

      {locError && (
        <p className="mt-2 rounded-2xl bg-[var(--brand-yellow-soft)] p-2.5 px-3 text-[12px] font-medium text-[var(--brand-ink)]">
          {locError}
        </p>
      )}

      {/* Kartochkalar grid'i */}
      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="animate-spin text-[var(--brand-green)]" size={28} />
        </div>
      ) : cards.length === 0 ? (
        <div className="ios-card mt-4 px-5 py-7 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
          >
            <Store size={26} />
          </span>
          <p className="mt-3 text-[16px] font-black text-[var(--brand-ink)]">
            {query ? `«${query}» bo'yicha dori topilmadi` : "Bu bo'limda hozircha dori yo'q"}
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
            Radiusni kattalashtirib ko&apos;ring, boshqa bo&apos;limga o&apos;ting yoki qidiruvni tozalang.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 web:grid-cols-4 web:gap-4.5">
          {cards.map((c) => (
            <ProductCard
              key={`${c.pharmacy.id}:${c.medicine.id}`}
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

      {/* Buyurtmalarni kuzatish */}
      <section id="order-tracking-section" className="mt-8">
        <p className="ios-section-title">Buyurtmamni kuzatish</p>
        <div className="ios-card p-4">
          <p className="text-[13px] leading-relaxed text-[var(--brand-muted)]">
            Buyurtma bergan telefon raqamingizni yozing — holati va yetkazilgan buyurtmalarni
            yulduzcha bilan baholaysiz.
          </p>
          <div className="mt-3 flex gap-2">
            <div className="flex flex-1 items-center rounded-2xl bg-[var(--brand-bg)] pl-3">
              <span className="pr-1 text-[15px] font-bold text-[var(--brand-muted)]">+998</span>
              <input
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9))}
                inputMode="tel"
                placeholder="90 123 45 67"
                className="ios-input !bg-transparent !py-2.5 !pl-0"
              />
            </div>
            <button
              onClick={trackOrders}
              disabled={trackBusy || trackPhone.length < 9}
              className="rounded-2xl px-4 text-[13px] font-bold text-white disabled:opacity-50"
              style={{ background: "var(--brand-ink)" }}
            >
              {trackBusy ? "..." : "Ko'rish"}
            </button>
          </div>
          {trackError && (
            <p className="mt-2 rounded-xl bg-[var(--brand-red-soft)] p-2.5 text-[12.5px] font-semibold text-[#d7263d]">
              {trackError}
            </p>
          )}
          {trackResult && (
            <ul className="mt-3 space-y-2">
              {trackResult.length === 0 && (
                <li className="text-[13px] text-[var(--brand-muted)]">Bu raqamga buyurtma topilmadi.</li>
              )}
              {trackResult.map((o) => (
                <li key={o.id} className="rounded-2xl bg-[var(--brand-bg)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-[var(--brand-ink)]">
                      #{o.id} · {o.pharmacyName ?? "Dorixona"}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                      style={
                        o.status === "yetkazildi"
                          ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
                          : o.status === "bekor"
                            ? { background: "var(--brand-red-soft)", color: "#d7263d" }
                            : { background: "var(--brand-yellow-soft)", color: "var(--brand-ink)" }
                      }
                    >
                      {o.status === "yangi" ? "🆕 Yangi" : o.status === "tasdiqlandi" ? "✅ Tasdiqlandi" : o.status === "yetkazildi" ? "📦 Yetkazildi" : "❌ Bekor"}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5 border-t border-[var(--brand-sep)]/60 pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                      Buyurtma qilingan dorilar:
                    </p>
                    <div className="space-y-1">
                      {o.items.map((i, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-[12.5px]">
                          <span className="font-semibold text-[var(--brand-ink)]">
                            {i.name} <span className="font-normal text-[var(--brand-muted)]">×{i.qty}</span>
                          </span>
                          {i.medicineId ? (
                            <Link
                              href={`/dori/${i.medicineId}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <MessageSquare size={11} />
                              {o.status === "yetkazildi" ? "Fikr va baho" : "Batafsil"}
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {o.totalSum !== null && (
                      <p className="text-right text-[12px] font-black text-[var(--brand-ink)] pt-1">
                        Jami: {shortSum(o.totalSum)} so&apos;m
                      </p>
                    )}
                  </div>
                  {o.status === "yetkazildi" && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-[var(--brand-sep)]">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-[var(--brand-ink)]">
                          {o.ratingStars ? "Xizmatga bahoyingiz:" : "Xizmatni baholang:"}
                        </span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => !o.ratingStars && rateOrder(o.id, n)}
                              aria-label={`${n} yulduz`}
                              className="p-0.5 text-[#d1d1d6] transition hover:scale-125 hover:text-[#fcbd00] disabled:cursor-default"
                              disabled={Boolean(o.ratingStars)}
                            >
                              <Star
                                size={17}
                                fill={o.ratingStars && o.ratingStars >= n ? "#fcbd00" : "none"}
                                className={o.ratingStars && o.ratingStars >= n ? "text-[#fcbd00]" : ""}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      {o.ratingStars && (
                        <span className="text-[11px] font-bold text-emerald-700">
                          ✓ Qabul qilindi
                        </span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

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
              <ul className="mt-3 space-y-2 pb-2">
                {favCards.map((c) => {
                  const inCart =
                    cartState?.pharmacy.id === c.pharmacy.id
                      ? cartState.lines.find((l) => l.medicine.id === c.medicine.id)
                      : undefined;
                  return (
                    <li key={`${c.pharmacy.id}:${c.medicine.id}`} className="flex items-center gap-3 rounded-2xl bg-[var(--brand-bg)] p-2.5">
                      {c.medicine.hasPhoto ? (
                        <FadeImage
                          src={`/api/medicines/${c.medicine.id}/photo`}
                          alt={c.medicine.name}
                          className="h-14 w-14 shrink-0 rounded-xl bg-white"
                          fit="contain"
                          fallback={
                            <span
                              className="flex h-full w-full items-center justify-center bg-white"
                              style={{ color: c.medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                            >
                              <TypeIcon type={c.medicine.type} size={22} />
                            </span>
                          }
                        />
                      ) : (
                        <span
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white"
                          style={{ color: c.medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                        >
                          <TypeIcon type={c.medicine.type} size={22} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-[14px] font-bold text-[var(--brand-ink)]">
                          {c.medicine.name}
                        </p>
                        <p className="text-[12px] font-semibold text-[var(--brand-green)]">
                          {c.medicine.price ? `${shortSum(c.medicine.price)} so'm` : "Narx so'rang"}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-[var(--brand-muted)]">
                          <Store size={10} className="shrink-0" />
                          <span className="line-clamp-1">{c.pharmacy.organization ?? c.pharmacy.name}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          onClick={() => addToCart(c.pharmacy, c.medicine)}
                          className="flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold text-white"
                          style={inCart ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" } : { background: "var(--brand-green)" }}
                        >
                          {inCart ? <Check size={12} /> : <ShoppingCart size={12} />}
                          {inCart ? `(${inCart.qty})` : "Savatga"}
                        </button>
                        <a
                          href={`tel:${c.pharmacy.phone.replace(/\s/g, "")}`}
                          className="flex items-center justify-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-[var(--brand-ink)] shadow-sm"
                        >
                          <Phone size={12} /> Qo&apos;ng&apos;iroq
                        </a>
                      </div>
                      <button
                        onClick={() => toggleFavorite(c.pharmacy.id, c.medicine.id)}
                        aria-label="Yoqtirilganlardan olib tashlash"
                        className="shrink-0 self-start p-0.5"
                      >
                        <Trash2 size={15} className="text-[var(--brand-muted)]" />
                      </button>
                    </li>
                  );
                })}
              </ul>
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
                    Buyurtmangiz <b>#{orderDone.orderId}</b> raqami bilan dorixona egasiga Telegram orqali yetkazildi.
                  </p>
                </div>

                {/* Buyurtma cheki / vaucheri */}
                <div className="space-y-3 rounded-2xl border border-[var(--brand-sep)] bg-[var(--brand-bg)] p-4">
                  <div className="flex items-center justify-between border-b border-[var(--brand-sep)] pb-2.5">
                    <span className="text-[12px] font-bold text-[var(--brand-muted)]">Buyurtma raqami</span>
                    <span className="text-[15px] font-black text-[var(--brand-ink)]">#{orderDone.orderId}</span>
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
                        Dorixonadan olib ketish manzili
                      </span>
                      <p className="mt-1 text-[13px] font-semibold text-[var(--brand-ink)]">
                        {orderDone.pharmacyAddress || "Dorixona manzili ko'rsatilmagan"}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-[var(--brand-sep)] pb-2.5">
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                        Dorixona
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
                  Dorixona buyurtmangizni qabul qilgach sizga aloqaga chiqishi mumkin.
                </p>

                {/* Tugmalar */}
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const phoneToTrack = orderDone.customerPhone;
                      setOrderDone(null);
                      setCartOpen(false);
                      setTrackPhone(phoneToTrack);
                      const trackEl = document.getElementById("order-tracking-section");
                      if (trackEl) {
                        trackEl.scrollIntoView({ behavior: "smooth" });
                      }
                      setTimeout(() => {
                        fetch(`/api/orders/track?phone=${encodeURIComponent(phoneToTrack)}`)
                          .then((r) => r.json())
                          .then((d) => setTrackResult(d.orders ?? []))
                          .catch(() => {});
                      }, 400);
                    }}
                    className="ios-btn w-full"
                  >
                    🔍 Buyurtma holatini kuzatish
                  </button>

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

                <ul className="mt-3 space-y-2">
                  {cartState.lines.map((l) => (
                    <li key={l.medicine.id} className="flex items-center gap-2 rounded-2xl bg-[var(--brand-bg)] p-2.5">
                      {l.medicine.hasPhoto ? (
                        <FadeImage
                          src={`/api/medicines/${l.medicine.id}/photo`}
                          alt={l.medicine.name}
                          className="h-11 w-11 shrink-0 rounded-xl bg-white"
                          fit="contain"
                          fallback={
                            <span
                              className="flex h-full w-full items-center justify-center bg-white"
                              style={{ color: l.medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                            >
                              <TypeIcon type={l.medicine.type} size={18} />
                            </span>
                          }
                        />
                      ) : (
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white"
                          style={{ color: l.medicine.type === "animal" ? "var(--brand-ink)" : "var(--brand-green)" }}
                        >
                          <TypeIcon type={l.medicine.type} size={18} />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-[var(--brand-ink)]">{l.medicine.name}</p>
                        <p className="text-[12px] font-semibold text-[var(--brand-green)]">
                          {l.medicine.price ? `${shortSum(l.medicine.price)} so'm` : "narx yo'q"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => changeQty(l.medicine.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[var(--brand-ink)] shadow-sm"
                          aria-label="Kamaytirish"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-[14px] font-black">{l.qty}</span>
                        <button
                          onClick={() => changeQty(l.medicine.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[var(--brand-ink)] shadow-sm"
                          aria-label="Oshirish"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => changeQty(l.medicine.id, -l.qty)}
                        className="p-1 text-[var(--brand-muted)]"
                        aria-label="O'chirish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-right text-[15px] font-black text-[var(--brand-ink)]">
                  Jami: <span className="text-[var(--brand-green)]">{shortSum(cartTotal)} so&apos;m</span>
                </p>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Ismingiz <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={cartName}
                      onChange={(e) => setCartName(e.target.value)}
                      placeholder="Ismingizni kiriting"
                      maxLength={120}
                      className="ios-input"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Telefon raqamingiz <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center rounded-2xl bg-[var(--brand-bg)] pl-3">
                      <span className="pr-1 text-[15px] font-bold text-[var(--brand-muted)]">+998</span>
                      <input
                        value={cartPhone}
                        onChange={(e) => setCartPhone(e.target.value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9))}
                        inputMode="tel"
                        placeholder="90 123 45 67"
                        className="ios-input !bg-transparent !pl-0"
                      />
                    </div>
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
                            Dorixonadan olish
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
                        <span>Dorixonadan olib ketish manzili:</span>
                      </div>
                      <p className="flex items-start gap-1.5 text-[12.5px] font-medium text-[var(--brand-ink)]">
                        <MapPin size={14} className="mt-0.5 text-[var(--brand-green)] shrink-0" />
                        <span>{cartState.pharmacy.address || "Dorixona manzili ko'rsatilmagan"}</span>
                      </p>
                      {cartState.pharmacy.phone && (
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--brand-sep)]">
                          <span className="text-[11.5px] text-[var(--brand-muted)]">Dorixona telefoni:</span>
                          <a
                            href={`tel:${cartState.pharmacy.phone.replace(/\s/g, "")}`}
                            className="inline-flex items-center gap-1 text-[12px] font-bold text-[var(--brand-green)] hover:underline"
                          >
                            <Phone size={12} /> +998 {cartState.pharmacy.phone}
                          </a>
                        </div>
                      )}
                      <p className="text-[11px] leading-relaxed text-[var(--brand-muted)]">
                        💡 Buyurtma berganingizdan so&apos;ng, dorixona xodimi dorilarni tayyorlab qo&apos;yadi va siz istalgan vaqtda borib olib ketishingiz mumkin.
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
                          Yetkazib berish narxi va vaqti masofaga qarab dorixona kuryeri tomonidan belgilanadi va siz bilan telefon orqali kelishiladi.
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
                    !cartName.trim() ||
                    cartPhone.replace(/\D/g, "").length < 9 ||
                    (cartDelivery === "delivery" && !cartAddress.trim())
                  }
                  className="ios-btn mt-3.5 w-full disabled:opacity-50"
                >
                  <ShoppingCart size={17} />
                  {cartBusy ? "Yuborilmoqda..." : "Buyurtma berish"}
                </button>
                <p className="mt-2 text-center text-[11px] leading-relaxed text-[var(--brand-muted)]">
                  Buyurtma dorixona egasiga Telegram orqali yetib boradi. Yetkazilgach
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
