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
import { onTelegramReady } from "@/lib/telegram";

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

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{ id: number; total: number } | null>(null);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  // Har safar foydalanuvchi boshqa sahifaga (mutaxassis, dorilar, profil va h.k.) o'tsa savat yopiladi
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const sync = () => setCart(loadCart());
    sync();

    const handleOpen = () => {
      setCart(loadCart());
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

  // Telegram Mini App orqaga qaytish tugmasi savat ochiqligida uni yopadi
  useEffect(() => {
    if (!open) return;
    return onTelegramReady((tg) => {
      const back = tg.BackButton;
      const handler = () => setOpen(false);
      back.show();
      back.onClick(handler);
      return () => {
        back.offClick(handler);
        // Agar bosh sahifada bo'lmasa qayta ko'rsatiladi, aks holda yashiriladi
        if (pathname === "/") {
          back.hide();
        }
      };
    });
  }, [open, pathname]);

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
    notifyCartChanged();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cart || cart.lines.length === 0) return;

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

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacySpecialistId: cart.lines[0]?.pharmacy?.id || cart.pharmacy?.id || 1,
          customerName: name.trim(),
          customerPhone: `+998${cleanPhoneDigits}`,
          deliveryType,
          customerAddress: deliveryType === "delivery" ? address.trim() : null,
          items: cart.lines.map((l) => ({
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
        total: cartTotal,
      });

      // Savatni tozalaymiz
      clearAll();
    } catch (err: any) {
      setError(err.message || "Tarmoq xatosi yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const cartTotal = cart?.lines.reduce((s, l) => s + (l.medicine.price ?? 0) * l.qty, 0) ?? 0;
  const cartQty = cart?.lines.reduce((s, l) => s + l.qty, 0) ?? 0;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-[500px] flex-col bg-white shadow-2xl animate-in slide-in-from-bottom web:slide-in-from-right"
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
                  {cart.pharmacy.name} ({cartQty} ta)
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
              Buyurtmangiz qabul qilindi!
            </h3>
            <p className="mt-2 text-[14px] text-neutral-600 max-w-sm">
              Buyurtma raqami: <strong className="text-neutral-900 font-mono">#{successOrder.id}</strong>.
              Dorixona tez orada xabarnoma orqali siz bilan bog&apos;lanadi.
            </p>
            {successOrder.total > 0 && (
              <p className="mt-3 text-[16px] font-black text-[var(--brand-green)]">
                Jami: {shortSum(successOrder.total)} so&apos;m
              </p>
            )}
            <button
              onClick={() => setOpen(false)}
              className="mt-8 rounded-2xl bg-[var(--brand-green)] px-8 py-3 text-[14px] font-bold text-white shadow-sm hover:brightness-105 active:scale-95 transition"
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
              Agro Bozor yoki bosh sahifadagi dori kartochkalaridan kerakli dori vositalarini savatga qo&apos;shing.
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
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Dorixona ma'lumoti */}
              <div className="rounded-2xl bg-neutral-50 p-3.5 border border-black/5">
                <div className="flex items-center gap-2 text-[13px] font-extrabold text-neutral-900">
                  <Store size={15} className="text-[var(--brand-green)]" />
                  <span>{cart.pharmacy.name}</span>
                </div>
                {cart.pharmacy.address && (
                  <p className="mt-1 text-[12px] text-neutral-500 flex items-center gap-1.5 truncate">
                    <MapPin size={12} className="shrink-0" />
                    <span>{cart.pharmacy.address}</span>
                  </p>
                )}
              </div>

              {/* Dori vositalari ro'yxati */}
              <ul className="space-y-2">
                {cart.lines.map((line) => (
                  <li
                    key={line.medicine.id}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-2.5 shadow-2xs"
                  >
                    {/* Rasm yoki belgi */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-100 overflow-hidden border border-black/5">
                      {line.medicine.hasPhoto ? (
                        <FadeImage
                          src={`/api/medicines/${line.medicine.id}/photo`}
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
                      <p className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 truncate">
                        <MapPin size={10} className="text-[var(--brand-green)] shrink-0" />
                        <span className="truncate">
                          {line.pharmacy?.name} ({line.pharmacy?.address ? line.pharmacy.address.split(",")[0] : "O'zbekiston"})
                        </span>
                      </p>
                      <p className="text-[12.5px] font-extrabold text-[var(--brand-green)]">
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
                ))}
              </ul>

              {/* Jami hisob */}
              <div className="flex items-center justify-between border-t border-black/5 pt-3">
                <span className="text-[14px] font-bold text-neutral-600">Jami hisob:</span>
                <span className="text-[17px] font-black text-[var(--brand-green)]">
                  {cartTotal > 0 ? `${shortSum(cartTotal)} so'm` : "Kelishiladi"}
                </span>
              </div>

              {/* Yetkazib berish usuli */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider">
                  Yetkazib berish usuli:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition ${
                      deliveryType === "pickup"
                        ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="text-lg">🏬</span>
                    <div>
                      <p className="text-[13px] font-bold text-neutral-900 leading-tight">Olib ketish</p>
                      <p className="text-[11px] text-neutral-500">Dorixonadan</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition ${
                      deliveryType === "delivery"
                        ? "border-[var(--brand-green)] bg-[var(--brand-green-soft)]"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <span className="text-lg">🚚</span>
                    <div>
                      <p className="text-[13px] font-bold text-neutral-900 leading-tight">Yetkazib berish</p>
                      <p className="text-[11px] text-neutral-500">Kuryer orqali</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mijoz ma'lumotlari */}
              <div className="space-y-3 pt-1">
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
                    <label className="text-[12px] font-bold text-neutral-700">
                      Yetkazish manzili <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Tuman, ko'cha, uy raqami"
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

            {/* Pastki Harakatlar Paneli */}
            <div className="border-t border-black/10 bg-neutral-50 p-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand-green)] py-3.5 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                <span>Buyurtmani tasdiqlash</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
