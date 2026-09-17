"use client";

/**
 * Dorilar bozori — platformadagi barcha ro'yxatdan o'tgan dorixonalar dorilari.
 *
 * • Ekin / hayvon bo'limlari (dori `type` maydoni bo'yicha)
 * • Radius: 5/10/25 km — foydalanuvchi joylashuvidan
 * • Savat: bir vaqtda bitta dorixona dorilari; buyurtma Telegram orqali
 *   dorixona egasiga yetib boradi, holatini mijoz telefon raqami bilan kuzatadi
 * • Reyting: yetkazilgan buyurtmani 1–5 yulduz bilan baholash — qancha yaxshi
 *   baholansa, dorixona reytingi shuncha oshadi
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Phone,
  Pill,
  Plus,
  ShoppingCart,
  Sprout,
  Star,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { RADIUS_OPTIONS } from "@/lib/constants";

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

type CartLine = { medicine: Medicine; qty: number };

function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

export default function MarketClient() {
  const [items, setItems] = useState<Pharmacy[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [loading, setLoading] = useState(true);
  const [locError, setLocError] = useState<string | null>(null);

  // Bo'limlar: all | crop | animal
  const [section, setSection] = useState<"all" | "crop" | "animal">("all");
  // Savat: faqat bitta dorixona dorilari
  const [cartPharmacy, setCartPharmacy] = useState<Pharmacy | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
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

  // Bo'lim bo'yicha filtr — dori turi bo'yicha.
  const visible = useMemo(
    () =>
      items
        .map((p) => ({
          ...p,
          // Umumiy (general) dorilar ikkala bo'limda ham ko'rinadi.
          medicines: p.medicines.filter(
            (m) => m.status === "bor" && (section === "all" || m.type === section || m.type === "general"),
          ),
        }))
        .filter((p) => p.medicines.length > 0),
    [items, section],
  );

  const cartCount = cart.reduce((acc, l) => acc + l.qty, 0);
  const cartTotal = cart.reduce((acc, l) => acc + (l.medicine.price ?? 0) * l.qty, 0);

  function addToCart(pharmacy: Pharmacy, medicine: Medicine) {
    // Boshqa dorixonadan dori qo'shilsa — savatni yangilaymiz (bitta dorixona qoidasi).
    if (cartPharmacy && cartPharmacy.id !== pharmacy.id) {
      if (!confirm(`Savatda boshqa dorixona (${cartPharmacy.name}) dorilari bor. Yangi dorixona dorilari savatni almashtiradi. Davom etamizmi?`)) {
        return;
      }
    }
    if (cartPharmacy?.id !== pharmacy.id) {
      setCartPharmacy(pharmacy);
      setCart([{ medicine: medicine, qty: 1 }]);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.medicine.id === medicine.id);
      if (existing) {
        return prev.map((l) =>
          l.medicine.id === medicine.id ? { ...l, qty: Math.min(99, l.qty + 1) } : l,
        );
      }
      return [...prev, { medicine, qty: 1 }];
    });
  }

  function changeQty(medicineId: number, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.medicine.id === medicineId ? { ...l, qty: Math.max(0, Math.min(99, l.qty + delta)) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  }

  async function submitOrder() {
    if (!cartPharmacy || cart.length === 0) return;
    setCartBusy(true);
    setCartError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacySpecialistId: cartPharmacy.id,
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
      setCart([]);
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

  return (
    <div className="px-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between pt-3">
        <div>
          <p className="ios-sub">Bozor</p>
          <h1 className="ios-title">Dorilar</h1>
          <p className="mt-1 text-[13px] font-medium text-[var(--brand-muted)]">
            Ro&apos;yxatdan o&apos;tgan dorixonalar dorilari · {radiusKm} km radius
          </p>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="relative mt-2 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--brand-green)] shadow-sm active:scale-95"
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

      {/* Bo'limlar */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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

      {/* Ro'yxat */}
      {      loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="animate-spin text-[var(--brand-green)]" size={28} />
        </div>
      ) : visible.length === 0 ? (
        <div className="ios-card mt-4 px-5 py-7 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
          >
            <Store size={26} />
          </span>
          <p className="mt-3 text-[16px] font-black text-[var(--brand-ink)]">
            Bu bo&apos;limda hozircha dori yo&apos;q
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--brand-muted)]">
            Dorixonalar dorilarini <b>@agroz_auth_bot</b> orqali qo&apos;shadi. Radiusni kattalashtirib ko&apos;ring yoki boshqa bo&apos;limga o&apos;ting.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          {visible.map((p) => (
            <section key={p.id}>
              {/* Dorixona kartasi */}
              <div className="flex items-start justify-between gap-3 rounded-[22px] bg-white p-4 shadow-sm">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
                    style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                  >
                    <Store size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold leading-tight text-[var(--brand-ink)]">
                      {p.organization ?? p.name}
                    </p>
                    <p className="mt-0.5 flex items-start gap-1 text-[12.5px] text-[var(--brand-muted)]">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{p.address}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {p.ratingAvg ? (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#b8860b]">
                          <Star size={11} fill="currentColor" className="text-[#fcbd00]" />
                          {p.ratingAvg.toFixed(1)}
                          <span className="text-[var(--brand-muted)]">({p.ratingCount})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-[var(--brand-muted)]">
                          ★ Reyting yo&apos;q
                        </span>
                      )}
                      {p.distanceKm !== null && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                          style={{ background: p.locked ? "var(--brand-muted)" : "var(--brand-green)" }}
                        >
                          {p.distanceKm.toFixed(1)} km
                        </span>
                      )}
                      {p.locked && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: "var(--brand-red-soft)", color: "#d7263d" }}
                        >
                          <Lock size={9} /> uzoqda
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <a
                  href={`tel:${p.phone.replace(/\s/g, "")}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
                  style={{ background: "var(--brand-green)" }}
                >
                  <Phone size={13} /> Qo&apos;ng&apos;iroq
                </a>
              </div>

              {/* Dorilar */}
              <ul className="mt-2 space-y-2">
                {p.medicines.map((m) => {
                  const inCart = cartPharmacy?.id === p.id && cart.find((l) => l.medicine.id === m.id);
                  return (
                    <li key={m.id} className="rounded-[20px] bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        {m.hasPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/medicines/${m.id}/photo`}
                            alt={m.name}
                            className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: "var(--brand-green-soft)", color: "var(--brand-green)" }}
                          >
                            <Pill size={22} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-bold leading-tight text-[var(--brand-ink)]">
                            {m.name}
                          </p>
                          {m.usage && (
                            <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--brand-muted)]">
                              {m.usage}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2">
                            {m.price ? (
                              <span className="text-[14px] font-black text-[var(--brand-green)]">
                                {shortSum(m.price)} so&apos;m
                              </span>
                            ) : (
                              <span className="text-[12px] font-bold text-[var(--brand-muted)]">
                                Narx so&apos;rang
                              </span>
                            )}
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                background: m.type === "crop" ? "var(--brand-green-soft)" : m.type === "animal" ? "var(--brand-yellow-soft)" : "#ccfbf1",
                                color: m.type === "crop" ? "var(--brand-green)" : m.type === "animal" ? "var(--brand-ink)" : "#0d9488",
                              }}
                            >
                              {m.type === "crop" ? "🌱 Ekin" : m.type === "animal" ? "🐄 Hayvon" : "📦 Umumiy"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => addToCart(p, m)}
                          className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2.5 text-[12.5px] font-bold text-white active:scale-95"
                          style={
                            inCart
                              ? { background: "var(--brand-green-soft)", color: "var(--brand-green)" }
                              : { background: "var(--brand-green)" }
                          }
                        >
                          {inCart ? <Check size={14} /> : <Plus size={14} />}
                          {inCart ? `Savatda (${inCart.qty})` : "Savatga"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
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
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <ShoppingCart size={32} className="text-[var(--brand-muted)]" />
                <p className="text-[15px] font-bold text-[var(--brand-ink)]">Savat bo&apos;sh</p>
                <p className="text-[13px] text-[var(--brand-muted)]">
                  Dorilardan «Savatga» tugmasini bosing
                </p>
                <button onClick={() => setCartOpen(false)} className="ios-btn secondary mt-2 w-full">
                  <X size={17} /> Yopish
                </button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-[18px] font-black text-[var(--brand-ink)]">
                  Savat · {cartPharmacy?.organization ?? cartPharmacy?.name}
                </p>
                <ul className="mt-3 space-y-2">
                  {cart.map((l) => (
                    <li key={l.medicine.id} className="flex items-center gap-2 rounded-2xl bg-[var(--brand-bg)] p-2.5">
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
