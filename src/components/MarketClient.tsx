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
import {
  Check,
  Heart,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Phone,
  Pill,
  Plus,
  Search,
  ShoppingCart,
  Sprout,
  Star,
  Store,
  Syringe,
  Trash2,
  X,
} from "lucide-react";
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
  const [radiusKm, setRadiusKm] = useState(25);
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
  const [orderDone, setOrderDone] = useState<{ orderId: number; total: number } | null>(null);

  // Buyurtma kuzatuvi va reyting
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState<
    { id: number; status: string; totalSum: number | null; pharmacyName: string | null; ratingStars: number | null; items: { name: string; qty: number }[] }[] | null
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

  /** Kartochkadan dori qo'shish —savat boshqa dorixonadan bo'lsa so'raymiz. */
  function addToCart(pharmacy: Pharmacy, medicine: Medicine) {
    // Boshqa dorixonadan dori qo'shilsa — savatni yangilaymiz (bitta dorixona qoidasi).
    if (cartState && cartState.pharmacy.id !== pharmacy.id) {
      if (!confirm(`Savatda boshqa dorixona (${cartState.pharmacy.name}) dorilari bor. Yangi dorixona dorilari savatni almashtiradi. Davom etamizmi?`)) {
        return;
      }
    }
    if (!cartState || cartState.pharmacy.id !== pharmacy.id) {
      updateCart({
        pharmacy: { id: pharmacy.id, name: pharmacy.organization ?? pharmacy.name, phone: pharmacy.phone },
        lines: [{ medicine, qty: 1 }],
      });
      return;
    }
    const existing = cartState.lines.find((l) => l.medicine.id === medicine.id);
    const lines = existing
      ? cartState.lines.map((l) =>
          l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
        )
      : [...cartState.lines, { medicine, qty: 1 }];
    updateCart({ ...cartState, lines });
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

  async function submitOrder() {
    if (!cartState || cartState.lines.length === 0) return;
    const cartPharmacyId = cartState.pharmacy.id;
    const cart = cartState.lines;
    setCartBusy(true);
    setCartError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacySpecialistId: cartPharmacyId,
          items: cart.map((l) => ({ medicineId: l.medicine.id, qty: l.qty })),
          customerName: cartName,
          customerPhone: cartPhone,
          note: cartNote,
          deliveryType: cartDelivery,
          customerAddress: cartDelivery === "delivery" ? cartAddress : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; orderId?: number; total?: number; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Buyurtma yuborilmadi");
      setOrderDone({ orderId: data.orderId!, total: data.total ?? cartTotal });
      updateCart(null);
      setCartOpen(false);
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
          <p className="ios-sub">Bozor</p>
          <h1 className="ios-title">Agro Bozor</h1>
          <p className="mt-1 text-[13px] font-medium text-[var(--brand-muted)]">
            Agro Bozor · {radiusKm} km radius
          </p>
        </div>
        <div className="mt-2 flex gap-2">
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

      {/* Radius */}
      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-[12px] font-bold text-[var(--brand-muted)]">Radius:</span>
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRadiusKm(r)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-95 ${
              radiusKm === r ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"
            }`}
            style={radiusKm === r ? { background: "var(--brand-ink)" } : undefined}
          >
            {r} km
          </button>
        ))}
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
            Dorixonalar dorilarini <b>@agroz_auth_bot</b> orqali qo&apos;shadi. Radiusni kattalashtirib
            ko&apos;ring, boshqa bo&apos;limga o&apos;ting yoki qidiruvni tozalang.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <ProductCard
              key={`${c.pharmacy.id}:${c.medicine.id}`}
              medicine={c.medicine}
              pharmacy={{ id: c.pharmacy.id, name: c.pharmacy.organization ?? c.pharmacy.name, phone: c.pharmacy.phone }}
            />
          ))}
        </div>
      )}

      {/* Buyurtmalarni kuzatish */}
      <section className="mt-8">
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
                  <p className="mt-1 text-[12px] text-[var(--brand-muted)]">
                    {o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                    {o.totalSum !== null ? ` · ${shortSum(o.totalSum)} so'm` : ""}
                  </p>
                  {o.status === "yetkazildi" && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[12px] font-semibold text-[var(--brand-muted)]">
                        {o.ratingStars ? "Bahoyingiz:" : "Baholash:"}
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => !o.ratingStars && rateOrder(o.id, n)}
                            aria-label={`${n} yulduz`}
                            className="p-0.5 text-[#d1d1d6] transition hover:scale-110 hover:text-[#fcbd00] disabled:cursor-default"
                            disabled={Boolean(o.ratingStars)}
                          >
                            <Star
                              size={15}
                              fill={o.ratingStars && o.ratingStars >= n ? "#fcbd00" : "none"}
                              className={o.ratingStars && o.ratingStars >= n ? "text-[#fcbd00]" : ""}
                            />
                          </button>
                        ))}
                      </div>
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
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                >
                  <Check size={32} />
                </span>
                <p className="text-[18px] font-black text-[var(--brand-ink)]">Buyurtma qabul qilindi!</p>
                <p className="text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
                  Buyurtma <b>#{orderDone.orderId}</b> dorixona egasiga Telegram orqali yuborildi.
                  Holatini «Buyurtmamni kuzatish» bo&apos;limida telefon raqamingiz bilan kuzatasiz.
                </p>
                <p className="text-[15px] font-black text-[var(--brand-green)]">
                  Jami: {shortSum(orderDone.total)} so&apos;m
                </p>
                <button
                  onClick={() => {
                    setOrderDone(null);
                    setCartOpen(false);
                  }}
                  className="ios-btn mt-2 w-full"
                >
                  <Check size={17} /> Yaxshi
                </button>
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
                <p className="mt-2 text-[18px] font-black text-[var(--brand-ink)]">
                  Savat · {cartState.pharmacy.name}
                </p>
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

                <div className="mt-3 space-y-2.5">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Ismingiz
                    </label>
                    <input
                      value={cartName}
                      onChange={(e) => setCartName(e.target.value)}
                      placeholder="Ism"
                      maxLength={120}
                      className="ios-input"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      Telefon
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCartDelivery("pickup")}
                      className={`flex-1 rounded-2xl py-2.5 text-[13px] font-bold ${cartDelivery === "pickup" ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"}`}
                      style={cartDelivery === "pickup" ? { background: "var(--brand-green)" } : undefined}
                    >
                      🏪 Olib ketaman
                    </button>
                    <button
                      onClick={() => setCartDelivery("delivery")}
                      className={`flex-1 rounded-2xl py-2.5 text-[13px] font-bold ${cartDelivery === "delivery" ? "text-white" : "bg-white text-[var(--brand-ink)] shadow-sm"}`}
                      style={cartDelivery === "delivery" ? { background: "var(--brand-green)" } : undefined}
                    >
                      🛵 Yetkazib berish
                    </button>
                  </div>
                  {cartDelivery === "delivery" && (
                    <input
                      value={cartAddress}
                      onChange={(e) => setCartAddress(e.target.value)}
                      placeholder="Manzilingiz (qishloq, ko'cha, uy)"
                      maxLength={300}
                      className="ios-input"
                    />
                  )}
                  <textarea
                    value={cartNote}
                    onChange={(e) => setCartNote(e.target.value)}
                    placeholder="Izoh (ixtiyoriy): masalan, ertalab kerak bo'ladi"
                    rows={2}
                    maxLength={300}
                    className="ios-input resize-none"
                  />
                </div>

                {cartError && (
                  <p className="mt-2 rounded-xl bg-[var(--brand-red-soft)] p-2.5 text-[12.5px] font-semibold text-[#d7263d]">
                    {cartError}
                  </p>
                )}

                <button
                  onClick={submitOrder}
                  disabled={cartBusy || !cartName.trim() || cartPhone.length < 9}
                  className="ios-btn mt-3 w-full disabled:opacity-50"
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
