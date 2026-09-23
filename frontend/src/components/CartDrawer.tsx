"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  Loader2,
  Store,
  MapPin,
  Pill,
  Sprout,
  Syringe,
  Check,
  Navigation,
} from "lucide-react";
import {
  loadCart,
  saveCart,
  notifyCartChanged,
  CART_EVENT,
  OPEN_CART_EVENT,
  CLOSE_CART_EVENT,
  TOGGLE_CART_EVENT,
  type CartStoreState,
} from "@/lib/cart-store";
import FadeImage from "@/components/FadeImage";
import { onTelegramReady, getTelegramUser, requestDeviceLocation } from "@/lib/telegram";
import { apiUrl } from "@/lib/api-config";

function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

function TypeIcon({ type, size = 18 }: { type: string; size?: number }) {
  if (type === "animal") return <Syringe size={size} />;
  if (type === "crop") return <Sprout size={size} />;
  return <Pill size={size} />;
}

export default function CartDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartStoreState>(null);

  // Tanlangan dorilar (id'lar to'plami) — mijoz faqat tanlanganlarini buyurtma qiladi
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locDetecting, setLocDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    id: number;
    total: number;
    deliveryType: string;
    pharmacyName: string;
  } | null>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Har safar foydalanuvchi boshqa sahifaga o'tsa savat yopiladi
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Savat va tanlangan dorilarni sinxronlash
  useEffect(() => {
    const sync = () => {
      const c = loadCart();
      setCart(c);
      if (c && c.lines.length > 0) {
        setSelectedIds((prev) => {
          if (prev.size === 0) {
            return new Set(c.lines.map((l) => l.medicine.id));
          }
          const next = new Set<number>();
          for (const l of c.lines) {
            if (prev.has(l.medicine.id)) next.add(l.medicine.id);
          }
          return next.size > 0 ? next : new Set(c.lines.map((l) => l.medicine.id));
        });
      } else {
        setSelectedIds(new Set());
      }
    };

    sync();

    const handleOpen = () => {
      sync();
      setOpen(true);
      setError(null);
      setSuccessOrder(null);
    };

    const handleClose = () => setOpen(false);
    const handleToggle = () => setOpen((prev) => !prev);

    window.addEventListener(CART_EVENT, sync);
    window.addEventListener(OPEN_CART_EVENT, handleOpen);
    window.addEventListener(CLOSE_CART_EVENT, handleClose);
    window.addEventListener(TOGGLE_CART_EVENT, handleToggle);
    window.addEventListener("storage", sync);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener(OPEN_CART_EVENT, handleOpen);
      window.removeEventListener(CLOSE_CART_EVENT, handleClose);
      window.removeEventListener(TOGGLE_CART_EVENT, handleToggle);
      window.removeEventListener("storage", sync);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  // Telegram foydalanuvchi ma'lumotlarini auto-fill qilish
  useEffect(() => {
    if (!open) return;
    const tgUser = getTelegramUser();
    if (tgUser && !name) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      if (fullName) setName(fullName);
    }
  }, [open, name]);

  // Telegram Mini App orqaga qaytish tugmasi
  useEffect(() => {
    if (!open) return;
    return onTelegramReady((tg) => {
      const back = tg.BackButton;
      const handler = () => setOpen(false);
      back.show();
      back.onClick(handler);
      return () => {
        back.offClick(handler);
        if (pathname === "/") {
          back.hide();
        }
      };
    });
  }, [open, pathname]);

  // Bitta dorini tanlash / bekor qilish
  function toggleSelect(medId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(medId)) next.delete(medId);
      else next.add(medId);
      return next;
    });
  }

  // Barchasini tanlash / yechish
  function toggleSelectAll() {
    if (!cart) return;
    if (selectedIds.size === cart.lines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cart.lines.map((l) => l.medicine.id)));
    }
  }

  function changeQty(medicineId: number, delta: number) {
    if (!cart) return;
    const existing = cart.lines.find((l) => l.medicine.id === medicineId);
    if (!existing) return;
    const nextQty = existing.qty + delta;
    const lines =
      nextQty <= 0
        ? cart.lines.filter((l) => l.medicine.id !== medicineId)
        : cart.lines.map((l) =>
            l.medicine.id === medicineId ? { ...l, qty: Math.min(99, nextQty) } : l,
          );
    const nextCart = lines.length > 0 ? { ...cart, lines } : null;
    saveCart(nextCart);
    setCart(nextCart);
    notifyCartChanged();
  }

  function clearAll() {
    saveCart(null);
    setCart(null);
    setSelectedIds(new Set());
    notifyCartChanged();
  }

  // GPS orqali joylashuvni aniqlash
  async function detectLocation() {
    try {
      setLocDetecting(true);
      setError(null);
      const loc = await requestDeviceLocation();
      setAddress(`GPS: ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`);
    } catch {
      setError("Joylashuvni avtomatik aniqlab bo'lmadi. Manzilni o'zingiz yozing.");
    } finally {
      setLocDetecting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart || cart.lines.length === 0) return;

    const selectedLines = cart.lines.filter((l) => selectedIds.has(l.medicine.id));
    if (selectedLines.length === 0) {
      setError("Buyurtma berish uchun kamida bitta dori tanlang");
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, "").replace(/^998/, "");
    if (cleanPhoneDigits.length !== 9) {
      setError("Telefon raqamingizni to'liq kiriting (9 xonali, masalan: 90 123 45 67)");
      return;
    }

    if (deliveryType === "delivery" && (!address.trim() || address.trim().length < 3)) {
      setError("Yetkazib berish manzilini kiriting");
      return;
    }

    setSubmitting(true);
    setError(null);

    const pharmacyId = selectedLines[0]?.pharmacy?.id || cart.pharmacy?.id || 1;
    const selectedTotal = selectedLines.reduce(
      (s, l) => s + (l.medicine.price ?? 0) * l.qty,
      0,
    );

    try {
      const res = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacySpecialistId: pharmacyId,
          customerName: name.trim(),
          customerPhone: `+998${cleanPhoneDigits}`,
          deliveryType,
          customerAddress: deliveryType === "delivery" ? address.trim() : null,
          items: selectedLines.map((l) => ({
            medicineId: l.medicine.id,
            qty: l.qty,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Buyurtma qabul qilinmadi");
      }

      setSuccessOrder({
        id: Number(data.orderId ?? 0),
        total: selectedTotal,
        deliveryType,
        pharmacyName: data.pharmacy?.name || cart.pharmacy.name,
      });

      // Faqat buyurtma qilingan dorilarni savatdan o'chiramiz
      const remaining = cart.lines.filter((l) => !selectedIds.has(l.medicine.id));
      if (remaining.length > 0) {
        const nextCart = { pharmacy: cart.pharmacy, lines: remaining };
        saveCart(nextCart);
        setCart(nextCart);
        setSelectedIds(new Set(remaining.map((l) => l.medicine.id)));
      } else {
        clearAll();
      }
    } catch (err: any) {
      setError(err.message || "Tarmoq xatosi yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  // Faqat tanlangan dorilar hisoblanadi
  const selectedLines = cart?.lines.filter((l) => selectedIds.has(l.medicine.id)) ?? [];
  const selectedTotal = selectedLines.reduce(
    (s, l) => s + (l.medicine.price ?? 0) * l.qty,
    0,
  );
  const selectedCount = selectedLines.reduce((s, l) => s + l.qty, 0);
  const allSelected = cart ? selectedIds.size === cart.lines.length && cart.lines.length > 0 : false;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[500px] flex-col bg-white shadow-2xl animate-in slide-in-from-bottom web:slide-in-from-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-green-soft)] text-[var(--brand-green)]">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-[17px] font-black text-neutral-900 leading-tight">
                Savat
              </h2>
              {cart && (
                <p className="text-[12px] font-medium text-neutral-500">
                  {cart.pharmacy.name} ({cart.lines.length} xil dori)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart && (
              <button
                onClick={clearAll}
                className="text-[12px] font-bold text-red-600 hover:underline px-2 py-1"
              >
                Tozalash
              </button>
            )}
            <button
              onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Muvaffaqiyat xabari */}
        {successOrder ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-extrabold text-neutral-900">
              Buyurtmangiz muvaffaqiyatli qabul qilindi!
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-sm">
              Buyurtma raqami: <strong className="text-neutral-900 font-mono">#{successOrder.id}</strong>
            </p>
            <div className="mt-4 rounded-2xl bg-neutral-50 p-4 border border-black/5 text-left w-full max-w-sm space-y-1.5 text-[13px]">
              <p className="text-neutral-700">
                🏪 <b>Dorixona:</b> {successOrder.pharmacyName}
              </p>
              <p className="text-neutral-700">
                {successOrder.deliveryType === "delivery" ? "🚚 Yetkazib berish (Kuryer)" : "🏬 Olib ketish (Dorixonadan)"}
              </p>
              {successOrder.total > 0 && (
                <p className="font-extrabold text-[var(--brand-green)] pt-1 text-[15px]">
                  Jami: {shortSum(successOrder.total)} so&apos;m
                </p>
              )}
            </div>
            <p className="mt-3 text-[12.5px] text-neutral-500 max-w-xs">
              Dorixona egasiga Telegram orqali xabarnoma yuborildi. Tez orada siz bilan bog&apos;lanishadi.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-2xl bg-[var(--brand-green)] px-8 py-3 text-[14px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
            >
              Tushunarli
            </button>
          </div>
        ) : !cart || cart.lines.length === 0 ? (
          /* Bo'sh savat */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-3">
              <ShoppingCart size={32} />
            </div>
            <h3 className="text-[17px] font-bold text-neutral-800">
              Savatingiz hozircha bo&apos;sh
            </h3>
            <p className="mt-1 text-[13px] text-neutral-500 max-w-xs">
              Dorilar bozoridan kerakli dori vositalarini savatga qo&apos;shing.
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 rounded-xl bg-neutral-900 px-6 py-2.5 text-[13px] font-bold text-white hover:bg-neutral-800 active:scale-95 transition"
            >
              Dorilarni ko&apos;rish
            </button>
          </div>
        ) : (
          /* Mahsulotlar va Buyurtma Formasi */
          <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              {/* Dorixona ma'lumoti */}
              <div className="rounded-2xl bg-neutral-50 p-3.5 border border-black/5">
                <div className="flex items-center gap-2 text-[13px] font-extrabold text-neutral-900">
                  <Store size={15} className="text-[var(--brand-green)]" />
                  <span>{cart.pharmacy.name}</span>
                </div>
                {cart.pharmacy.address && (
                  <p className="mt-1 text-[12px] text-neutral-500 flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="shrink-0 text-neutral-400" />
                    <span>{cart.pharmacy.address}</span>
                  </p>
                )}
              </div>

              {/* Dori tanlash paneli (Select all) */}
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-[13px] font-bold text-neutral-800 hover:text-[var(--brand-green)] transition"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                      allSelected
                        ? "bg-[var(--brand-green)] border-[var(--brand-green)] text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {allSelected && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span>Barchasini tanlash</span>
                </button>
                <span className="text-[12px] font-semibold text-neutral-500">
                  {selectedIds.size} / {cart.lines.length} ta tanlandi
                </span>
              </div>

              {/* Dori vositalari ro'yxati */}
              <ul className="space-y-2.5">
                {cart.lines.map((line) => {
                  const isSelected = selectedIds.has(line.medicine.id);
                  return (
                    <li
                      key={line.medicine.id}
                      className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-all ${
                        isSelected
                          ? "border-[var(--brand-green)]/40 bg-white shadow-2xs"
                          : "border-neutral-200 bg-neutral-50/60 opacity-70"
                      }`}
                    >
                      {/* Tanlash checkboxi */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(line.medicine.id)}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? "bg-[var(--brand-green)] border-[var(--brand-green)] text-white shadow-xs"
                            : "border-neutral-300 bg-white hover:border-neutral-400"
                        }`}
                        aria-label={isSelected ? "Tanlangan" : "Tanlanmagan"}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </button>

                      {/* Rasm yoki belgi */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 overflow-hidden border border-black/5">
                        {line.medicine.hasPhoto ? (
                          <FadeImage
                            src={apiUrl(`/api/medicines/${line.medicine.id}/photo`)}
                            alt={line.medicine.name}
                            className="h-full w-full object-cover"
                            fallback={
                              <span className="text-[var(--brand-green)]">
                                <TypeIcon type={line.medicine.type} size={20} />
                              </span>
                            }
                          />
                        ) : (
                          <span className="text-[var(--brand-green)]">
                            <TypeIcon type={line.medicine.type} size={20} />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-neutral-900 truncate">
                          {line.medicine.name}
                        </p>
                        <p className="text-[12.5px] font-black text-[var(--brand-green)]">
                          {line.medicine.price ? `${shortSum(line.medicine.price)} so'm` : "Kelishiladi"}
                        </p>
                      </div>

                      {/* Miqdor tugmalari */}
                      <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1">
                        <button
                          type="button"
                          onClick={() => changeQty(line.medicine.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-neutral-800 shadow-xs active:scale-90"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-[13px] font-black text-neutral-900">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(line.medicine.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-neutral-800 shadow-xs active:scale-90"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => changeQty(line.medicine.id, -line.qty)}
                        className="text-neutral-400 hover:text-red-600 p-1 transition"
                        aria-label="O'chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Tanlanganlar jami hisobi */}
              <div className="flex items-center justify-between border-t border-black/5 pt-3">
                <div>
                  <span className="text-[13px] font-bold text-neutral-600">Tanlanganlar hisobi:</span>
                  <p className="text-[11px] text-neutral-400">{selectedCount} dona dori</p>
                </div>
                <span className="text-[18px] font-black text-[var(--brand-green)]">
                  {selectedTotal > 0 ? `${shortSum(selectedTotal)} so'm` : "0 so'm"}
                </span>
              </div>

              {/* Yetkazib berish usuli: Olib ketish / Yetkazib berish */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">
                  Yetkazib berish usuli:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition ${
                      deliveryType === "pickup"
                        ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]/50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="text-xl">🏬</span>
                    <div>
                      <p className="text-[13.5px] font-black text-neutral-900 leading-tight">Olib ketish</p>
                      <p className="text-[11px] font-medium text-neutral-500 mt-0.5">Dorixonadan (bepul)</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition ${
                      deliveryType === "delivery"
                        ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]/50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="text-xl">🚚</span>
                    <div>
                      <p className="text-[13.5px] font-black text-neutral-900 leading-tight">Yetkazib berish</p>
                      <p className="text-[11px] font-medium text-neutral-500 mt-0.5">Kuryer orqali</p>
                    </div>
                  </button>
                </div>

                {deliveryType === "pickup" ? (
                  <div className="mt-2 rounded-xl bg-amber-50/70 border border-amber-200/60 p-2.5 text-[12px] text-amber-900">
                    💡 Buyurtma tasdiqlangach, dorixonaga borib o&apos;zingiz olib ketasiz.
                    {cart.pharmacy.address && (
                      <span className="block font-semibold mt-0.5">Manzil: {cart.pharmacy.address}</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl bg-blue-50/70 border border-blue-200/60 p-2.5 text-[12px] text-blue-900">
                    🚚 Dorixona kuryeri buyurtmani ko&apos;rsatilgan manzilga yetkazib beradi.
                  </div>
                )}
              </div>

              {/* Mijoz ma'lumotlari */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[12px] font-bold text-neutral-700">
                    Ismingiz <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Jamshid Aliyev"
                    className="ios-input mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-neutral-700">
                    Telefon raqamingiz <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-2xl bg-[var(--brand-bg)] pl-3 mt-1">
                    <span className="pr-1 text-[14px] font-bold text-neutral-500">+998</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").replace(/^998/, "").slice(0, 9))
                      }
                      placeholder="90 123 45 67"
                      className="ios-input !bg-transparent !pl-0"
                      required
                    />
                  </div>
                </div>

                {deliveryType === "delivery" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-neutral-700">
                        Yetkazish manzili <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locDetecting}
                        className="flex items-center gap-1 text-[11.5px] font-bold text-[var(--brand-green)] hover:underline"
                      >
                        <Navigation size={12} className={locDetecting ? "animate-spin" : ""} />
                        <span>{locDetecting ? "Aniqlanmoqda..." : "📍 Joylashuvni olish"}</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Tuman, ko'cha, uy raqami yoki mo'ljal"
                      className="ios-input mt-1"
                      required
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-[13px] font-semibold text-red-600 border border-red-200">
                  {error}
                </div>
              )}
            </div>

            {/* Pastki Harakatlar Paneli (Har doim ko'rinib turishi uchun shrink-0 va safe-area) */}
            <div className="shrink-0 border-t border-black/10 bg-white p-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              <button
                type="submit"
                disabled={submitting || selectedLines.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] py-3.5 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                <span>
                  {selectedLines.length === 0
                    ? "Dorini tanlang"
                    : `Buyurtma berish (${shortSum(selectedTotal)} so'm)`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
