"use client";

const DELIVERY_ENABLED = false;

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
  Sparkles,
  ArrowRight,
  ChevronRight,
  User,
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
  recordOrderItems,
  getUserOrderPrefs,
  saveLastOrder,
  loadLastOrder,
  clearLastOrder,
  addItemToCart,
  closeCart,
} from "@/lib/cart-store";
import FadeImage from "@/components/FadeImage";
import OrderTrackingStatusCard from "@/components/OrderTrackingStatusCard";
import { onTelegramReady, getTelegramUser, requestDeviceLocation } from "@/lib/telegram";
import { apiUrl, apiFetch } from "@/lib/api-config";
import { formatOrderNumber } from "@/lib/format";

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

  // Tanlangan agro-mahsulotlar (id'lar to'plami) — mijoz faqat tanlanganlarini buyurtma qiladi
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Ro'yxatdan o'tgan foydalanuvchi ma'lumotlari (ism, telefon profil orqali olinadi)
  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    name?: string | null;
    phone?: string | null;
    secondPhone?: string | null;
  } | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  // Form states
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [deliveryConfig, setDeliveryConfig] = useState<{
    enabled: boolean;
    minOrderQty: number;
    pricePerKm: number;
    basePrice: number;
    maxDistanceKm: number;
  }>({
    enabled: true,
    minOrderQty: 5,
    pricePerKm: 3000,
    basePrice: 10000,
    maxDistanceKm: 50,
  });
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locDetecting, setLocDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    id: number;
    total: number;
    deliveryType: string;
    pharmacyName: string;
    items?: { name: string; qty: number }[];
    customerAddress?: string | null;
  } | null>(null);



  // Foydalanuvchining avvalgi va joriy buyurtmalari
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const fetchUserOrders = useCallback(async (phone?: string | null) => {
    try {
      const path = phone
        ? `/api/profile/activity?phone=${encodeURIComponent(phone)}`
        : "/api/profile/activity";
      const res = await apiFetch(path);
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.orders)) {
          setUserOrders(data.orders);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const allOrders = useMemo(() => {
    const list = [...userOrders];
    if (successOrder && !list.some((o) => o.id === successOrder.id)) {
      list.unshift({
        id: successOrder.id,
        totalSum: successOrder.total,
        status: "yangi",
        deliveryType: successOrder.deliveryType,
        pharmacyName: successOrder.pharmacyName,
        customerAddress: successOrder.customerAddress,
        items: successOrder.items || [],
        createdAt: new Date().toISOString(),
      });
    }
    return list;
  }, [userOrders, successOrder]);

  // Tavsiya etilgan agro-mahsulotlar va xaridor buyurtma statistikasi
  const [recommendedMeds, setRecommendedMeds] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recFilter, setRecFilter] = useState<"all" | "crop" | "animal">("all");
  const [orderPrefs, setOrderPrefs] = useState<{ crop: number; animal: number; total: number }>({ crop: 0, animal: 0, total: 0 });

  useEffect(() => {
    if (!open) return;
    setOrderPrefs(getUserOrderPrefs());

    let cancelled = false;
    if (recommendedMeds.length === 0) {
      setRecLoading(true);
    }

    async function loadRecommendedMeds() {
      try {
        const [specRes, medRes] = await Promise.allSettled([
          fetch("/api/specialists?role=pharmacy"),
          fetch(apiUrl("/api/medicines?limit=60&random=1")),
        ]);

        const medMap = new Map<number, any>();

        if (specRes.status === "fulfilled" && specRes.value.ok) {
          const specData = await specRes.value.json();
          const items = Array.isArray(specData?.items) ? specData.items : [];
          for (const p of items) {
            for (const m of p.medicines || []) {
              if (m.status === "yoq") continue;
              medMap.set(m.id, {
                id: m.id,
                name: m.name,
                type: m.type || "general",
                usage: m.usage ?? null,
                price: m.price ?? null,
                stockUnit: m.stockUnit ?? "dona",
                hasPhoto: Boolean(m.hasPhoto),
                photoVersion: m.photoVersion ?? null,
                pharmacyId: p.id,
                pharmacyName: p.organization || p.name || "Agroz Agro-do&apos;kon",
                pharmacyPhone: p.phone || "",
                pharmacyAddress: p.address || null,
              });
            }
          }
        }

        if (medRes.status === "fulfilled" && medRes.value.ok) {
          const medData = await medRes.value.json();
          if (Array.isArray(medData)) {
            for (const m of medData) {
              if (!medMap.has(m.id)) {
                medMap.set(m.id, {
                  id: m.id,
                  name: m.name,
                  type: m.type || "general",
                  usage: m.usage ?? null,
                  price: m.price ?? null,
                  stockUnit: m.stockUnit ?? "dona",
                  hasPhoto: Boolean(m.hasPhoto),
                  photoVersion: m.photoVersion ?? null,
                  pharmacyId: m.pharmacyId,
                  pharmacyName: m.pharmacyName || "Agroz Agro-do&apos;kon",
                  pharmacyPhone: m.pharmacyPhone || "",
                  pharmacyAddress: m.pharmacyAddress || null,
                });
              }
            }
          }
        }

        if (!cancelled && medMap.size > 0) {
          const allList = Array.from(medMap.values()).sort(() => Math.random() - 0.5);
          setRecommendedMeds(allList);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setRecLoading(false);
      }
    }

    loadRecommendedMeds();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const sortedRecommendations = useMemo(() => {
    let list = [...recommendedMeds];
    if (recFilter === "crop") {
      list = list.filter((m) => m.type === "crop" || m.type === "general");
    } else if (recFilter === "animal") {
      list = list.filter((m) => m.type === "animal" || m.type === "general");
    } else {
      // Foydalanuvchi qaysi turga ko'proq buyurtma bergan bo'lsa, o'shani birinchi ko'rsatish
      if (orderPrefs.crop > orderPrefs.animal) {
        list.sort((a, b) => {
          if (a.type === "crop" && b.type !== "crop") return -1;
          if (a.type !== "crop" && b.type === "crop") return 1;
          return 0;
        });
      } else if (orderPrefs.animal > orderPrefs.crop) {
        list.sort((a, b) => {
          if (a.type === "animal" && b.type !== "animal") return -1;
          if (a.type !== "animal" && b.type === "animal") return 1;
          return 0;
        });
      }
    }
    return list;
  }, [recommendedMeds, recFilter, orderPrefs]);

  const recTitle = useMemo(() => {
    if (orderPrefs.crop > orderPrefs.animal) {
      return {
        title: "🌱 Siz uchun tavsiya: Ekin parvarishi vositalari",
        desc: "Oldingi buyurtmalaringizga asosan saralangan",
      };
    }
    if (orderPrefs.animal > orderPrefs.crop) {
      return {
        title: "🐄 Siz uchun tavsiya: Veterinariya va chorva vositalari",
        desc: "Oldingi buyurtmalaringizga asosan saralangan",
      };
    }
    return {
      title: "✨ Tavsiya etilgan agro-mahsulotlar",
      desc: "Platformadagi mavjud va mashhur agro-mahsulotlar",
    };
  }, [orderPrefs]);

  useEffect(() => {
    fetch("/api/orders/delivery-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.config) {
          setDeliveryConfig(data.config);
        }
      })
      .catch(() => {});
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    closeCart();
  }, []);

  // Har safar foydalanuvchi boshqa sahifaga o'tsa savat yopiladi (/savat sahifasidan tashqari)
  useEffect(() => {
    if (pathname === "/savat") {
      setOpen(true);
      return;
    }
    setOpen(false);
    closeCart();
  }, [pathname]);

  // Savat va tanlangan agro-mahsulotlarni sinxronlash
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
      setSuccessOrder((prev) => prev || loadLastOrder());
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

  // Ro'yxatdan o'tgan foydalanuvchi ma'lumotlarini yuklash
  useEffect(() => {
    if (!open) return;
    setUserLoading(true);

    // Darhol localStorage dan foydalanuvchini olamiz (flicker bo'lmasligi uchun)
    try {
      const savedUserStr = localStorage.getItem("agroz_user");
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.name) {
          setCurrentUser(parsed);
          if (parsed.phone) fetchUserOrders(parsed.phone);
        }
      }
    } catch {}

    apiFetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("agroz_user", JSON.stringify(data.user));
          fetchUserOrders(data.user.phone);
        } else {
          const tgUser = getTelegramUser();
          if (tgUser) {
            const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
            setCurrentUser((prev) => (prev?.name ? prev : {
              id: tgUser.id,
              name: fullName || tgUser.username || "Telegram foydalanuvchisi",
              phone: null,
            }));
          } else {
            setCurrentUser((prev) => prev);
          }
          fetchUserOrders(null);
        }
      })
      .catch(() => {
        fetchUserOrders(null);
      })
      .finally(() => setUserLoading(false));
  }, [open, fetchUserOrders]);

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

  // Bitta agro-mahsulotni tanlash / bekor qilish
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
      setError("Buyurtma berish uchun kamida bitta agro-mahsulot tanlang");
      return;
    }

    const customerName = currentUser?.name?.trim() || "Mijoz";
    const customerPhoneRaw = currentUser?.phone || currentUser?.secondPhone;
    const cleanPhoneDigits = (customerPhoneRaw || "").replace(/\D/g, "").replace(/^998/, "").slice(-9);

    if (!cleanPhoneDigits || cleanPhoneDigits.length !== 9) {
      setError("Buyurtma berish uchun avval tizimga kiring yoki profilingizda telefon raqamingizni kiriting.");
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
          customerName,
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

      const orderInfo = {
        id: Number(data.orderId ?? 0),
        total: selectedTotal,
        deliveryType,
        pharmacyName: data.pharmacy?.name || cart.pharmacy.name,
        items: selectedLines.map((l) => ({ name: l.medicine.name, qty: l.qty })),
        customerAddress: deliveryType === "delivery" ? address.trim() : null,
      };
      setSuccessOrder(orderInfo);
      saveLastOrder(orderInfo);
      setExpandedOrderId(orderInfo.id);
      fetchUserOrders(currentUser?.phone || `+998${cleanPhoneDigits}`);
      recordOrderItems(selectedLines.map((l) => ({ type: l.medicine.type })));
      setOrderPrefs(getUserOrderPrefs());

      // Faqat buyurtma qilingan agro-mahsulotlarni savatdan o'chiramiz
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

  // Faqat tanlangan agro-mahsulotlar hisoblanadi
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
                  {cart.pharmacy.name} ({cart.lines.length} xil agro-mahsulot)
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart && (
              <button
                onClick={clearAll}
                className="min-h-[44px] px-3 text-[12px] font-bold text-red-600 hover:underline flex items-center justify-center"
              >
                Tozalash
              </button>
            )}
            <button
              onClick={close}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200 active:scale-95 transition"
              aria-label="Yopish"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Agar savat bo'sh bo'lsa (yoki buyurtma qabul qilingan bo'lsa) */}
        {!cart || cart.lines.length === 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-6">
            {/* 1. Savat bo'sh holati va "Agro-mahsulotlarni ko'rish" tugmasi (Foydalanuvchi yuborgan rasmga 1:1) */}
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <h3 className="text-[20px] font-black text-neutral-900 tracking-tight">
                Savatingiz bo&apos;sh
              </h3>
              <p className="mt-1 text-[13.5px] text-neutral-500 font-medium">
                Agro-mahsulotlarni tanlab, buyurtma bering.
              </p>
              <Link
                href="/dorilar"
                onClick={close}
                className="mt-4 inline-flex items-center justify-center rounded-full border border-[#22c55e] px-7 py-2 text-[14px] font-bold text-[#22c55e] hover:bg-[#22c55e]/10 active:scale-95 transition shadow-2xs"
              >
                Agro-mahsulotlarni ko&apos;rish
              </Link>
            </div>

            {/* 2. Buyurtmalarim bo'limi (Mockupdagi #1001 · 85 000 so'm / Yuborildi kartochkasi) */}
            {allOrders.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between px-0.5">
                  <h4 className="text-[18px] font-black text-neutral-900 tracking-tight">
                    Buyurtmalarim
                  </h4>
                  <span className="text-[12px] font-semibold text-neutral-400">
                    {allOrders.length} ta
                  </span>
                </div>

                <div className="space-y-2.5">
                  {allOrders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const statusLabel =
                      order.status === "yangi"
                        ? "Yuborildi"
                        : order.status === "tasdiqlandi"
                        ? "Qabul qilindi"
                        : order.status === "yolda"
                        ? "Yo'lda"
                        : order.status === "yetkazildi"
                        ? (order.deliveryType === "pickup" ? "Olib ketildi" : "Yetkazildi")
                        : order.status === "bekor"
                        ? "Bekor qilingan"
                        : "Yuborildi";

                    const formattedTotal = Number(order.totalSum || order.total || 0)
                      .toLocaleString("ru-RU")
                      .replace(/\u00a0/g, " ");

                    return (
                      <div
                        key={order.id}
                        className="overflow-hidden rounded-2xl bg-[#1c1c1e] text-white shadow-md transition-all border border-neutral-800"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="flex w-full items-center justify-between p-4 text-left hover:bg-[#252528] active:scale-[0.99] transition"
                        >
                          <div>
                            <p className="text-[16px] font-bold text-white tracking-tight">
                              #{order.id} · {formattedTotal} so&apos;m
                            </p>
                            <p className="text-[13px] text-neutral-400 font-medium mt-0.5">
                              {statusLabel}
                            </p>
                          </div>
                          <ChevronRight
                            size={20}
                            className={`text-neutral-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-[#22c55e]" : ""
                            }`}
                          />
                        </button>

                        {/* Bosilganda 4 bosqichli to'liq kuzatuv paneli ochiladi */}
                        {isExpanded && (
                          <div className="border-t border-white/10 bg-[#252528] p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <OrderTrackingStatusCard
                              orderId={order.id}
                              status={order.status || "yangi"}
                              totalSum={Number(order.totalSum || order.total || 0)}
                              items={order.items || []}
                              deliveryType={order.deliveryType}
                              customerAddress={order.customerAddress}
                              pharmacyName={order.pharmacyName}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. PASTIDA DORI VOSITALARI RO'YXATI (BUYURTMA TURLARI ASOSIDA TAVSIYA) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[14px] font-black text-neutral-900 flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500 shrink-0" />
                    <span>{recTitle.title}</span>
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {recTitle.desc}
                  </p>
                </div>
              </div>

              {/* Filtr tablari */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(
                  [
                    { id: "all", label: "Barchasi" },
                    { id: "crop", label: "🌱 Ekinlar" },
                    { id: "animal", label: "🐄 Hayvonlar" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRecFilter(tab.id)}
                    className={`rounded-full px-3 py-1 text-[11.5px] font-bold transition ${
                      recFilter === tab.id
                        ? "bg-[var(--brand-green)] text-white shadow-2xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tavsiya agro-mahsulotlar ro'yxati */}
              {recLoading ? (
                <div className="flex items-center justify-center py-8 text-neutral-400">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : sortedRecommendations.length === 0 ? (
                <p className="text-center py-6 text-xs text-neutral-400">
                  Bu toifada agro-mahsulotlar topilmadi.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sortedRecommendations.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-2xs transition hover:border-emerald-300"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100 border border-black/5">
                        {m.hasPhoto ? (
                          <FadeImage
                            src={apiUrl(`/api/medicines/${m.id}/photo${m.photoVersion ? `?v=${m.photoVersion}` : ""}`)}
                            alt={m.name}
                            className="h-full w-full object-cover"
                            fallback={
                              <span
                                className={`flex h-full w-full items-center justify-center ${
                                  m.type === "animal"
                                    ? "bg-amber-50/70 text-amber-600"
                                    : m.type === "crop"
                                    ? "bg-emerald-50/70 text-[#039e1e]"
                                    : "bg-slate-50 text-slate-500"
                                }`}
                              >
                                <TypeIcon type={m.type} size={22} />
                              </span>
                            }
                          />
                        ) : (
                          <span
                            className={`flex h-full w-full items-center justify-center ${
                              m.type === "animal"
                                ? "bg-amber-50/70 text-amber-600"
                                : m.type === "crop"
                                ? "bg-emerald-50/70 text-[#039e1e]"
                                : "bg-slate-50 text-slate-500"
                            }`}
                          >
                            <TypeIcon type={m.type} size={22} />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9.5px] font-bold ${
                              m.type === "crop"
                                ? "bg-emerald-50 text-emerald-700"
                                : m.type === "animal"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {m.type === "crop" ? "🌱 Ekin" : m.type === "animal" ? "🐄 Hayvon" : "📦 Umumiy"}
                          </span>
                        </div>
                        <h5 className="mt-0.5 text-[13px] font-bold text-neutral-900 leading-snug line-clamp-1">
                          {m.name}
                        </h5>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                          🏪 {m.pharmacyName}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          {m.price != null && m.price > 0 ? (
                            <span className="text-[12.5px] font-black text-[var(--brand-green)]">
                              {shortSum(m.price)} so&apos;m
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-neutral-400">
                              Narxi ko&apos;rsatilmagan
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              addItemToCart(
                                {
                                  id: m.id,
                                  name: m.name,
                                  price: m.price,
                                  type: m.type,
                                  hasPhoto: m.hasPhoto,
                                  photoVersion: m.photoVersion,
                                  usage: m.usage,
                                  status: "bor",
                                },
                                {
                                  id: m.pharmacyId,
                                  name: m.pharmacyName,
                                  phone: m.pharmacyPhone,
                                  address: m.pharmacyAddress,
                                },
                                1,
                              );
                              setSuccessOrder(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-[var(--brand-green)] hover:brightness-105 active:scale-95 px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs transition"
                          >
                            <Plus size={13} strokeWidth={2.5} /> Savatga
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mahsulotlar va Buyurtma Formasi */
          <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              {/* Agro-do&apos;kon ma'lumoti */}
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

              {/* Agro-mahsulot tanlash paneli (Select all) */}
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

              {/* Agro-mahsulotlar ro'yxati */}
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
                            src={apiUrl(`/api/medicines/${line.medicine.id}/photo${line.medicine.photoVersion ? `?v=${line.medicine.photoVersion}` : ""}`)}
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
                          {shortSum(line.medicine.price || 0)} so'm
                        </p>
                      </div>

                      {/* Miqdor tugmalari */}
                      <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => changeQty(line.medicine.id, -1)}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white text-neutral-800 shadow-xs active:scale-90 transition"
                          aria-label="Kamaytirish"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-6 text-center text-[13px] font-black text-neutral-900 select-none">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(line.medicine.id, 1)}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white text-neutral-800 shadow-xs active:scale-90 transition"
                          aria-label="Ko'paytirish"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => changeQty(line.medicine.id, -line.qty)}
                        className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-red-50 hover:text-red-600 transition"
                        aria-label="O'chirish"
                      >
                        <Trash2 size={17} />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Tanlanganlar jami hisobi */}
              <div className="flex items-center justify-between border-t border-black/5 pt-3">
                <div>
                  <span className="text-[13px] font-bold text-neutral-600">Tanlanganlar hisobi:</span>
                  <p className="text-[11px] text-neutral-400">{selectedCount} dona agro-mahsulot</p>
                </div>
                <span className="text-[18px] font-black text-[var(--brand-green)]">
                  {selectedTotal > 0 ? `${shortSum(selectedTotal)} so'm` : "0 so'm"}
                </span>
              </div>

              {/* Yetkazib berish usuli: Olib ketish / Yetkazib berish */}
              {DELIVERY_ENABLED ? (<div className="space-y-1.5 pt-2">
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
                      <p className="text-[11px] font-medium text-neutral-500 mt-0.5">Agro-do&apos;kondan (bepul)</p>
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
                    💡 Buyurtma tasdiqlangach, agro-do&apos;konga borib o&apos;zingiz olib ketasiz.
                    {cart.pharmacy.address && (
                      <span className="block font-semibold mt-0.5">Manzil: {cart.pharmacy.address}</span>
                    )}
                  </div>
                ) : (
                  (() => {
                    const selectedTotalCount =
                      cart?.lines
                        .filter((l) => selectedIds.has(l.medicine.id))
                        .reduce((s, l) => s + l.qty, 0) ?? 0;
                    const isFree = selectedTotalCount >= deliveryConfig.minOrderQty;
                    return isFree ? (
                      <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[12px] text-emerald-900 shadow-sm">
                        <div className="flex items-center gap-1.5 font-black text-emerald-800 text-[13px]">
                          <span>🎉</span> Bepul Yetkazib Berish!
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-emerald-700 leading-relaxed">
                          Savatdagi agro-mahsulotlar soni <b>{selectedTotalCount} ta</b> ({deliveryConfig.minOrderQty} tadan ko&apos;p). Buyurtmangiz agro-do&apos;kon tomonidan <b>bepul</b> yetkazib beriladi!
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-[12px] text-blue-900 shadow-sm">
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <span>🚚</span> Yetkazib berish shartlari:
                        </div>
                        <p className="mt-0.5 text-[11.5px] text-blue-800 leading-relaxed">
                          Masofaga qarab har 1 km uchun <b>{deliveryConfig.pricePerKm.toLocaleString("uz-UZ")} so&apos;m</b> to&apos;lanadi.
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-100/80 px-2.5 py-1.5 text-[11.5px] font-semibold text-blue-900">
                          <span>💡</span> Yana <b>{deliveryConfig.minOrderQty - selectedTotalCount} ta</b> agro-mahsulot qo&apos;shsangiz, yetkazib berish <b>mutlaqo BEPUL</b> bo&apos;ladi!
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              ) : (
    <div className="mt-2 rounded-xl bg-amber-50/70 border border-amber-200/60 p-2.5 text-[12px] text-amber-900">
      💡 Buyurtma tasdiqlangach, agro-do&apos;konga borib o'zingiz olib ketasiz.
      {cart.pharmacy.address && (
        <span className="block font-semibold mt-0.5">Manzil: {cart.pharmacy.address}</span>
      )}
    </div>
  )}

  {/* Buyurtmachi ma'lumotlari (profil orqali avtomatik) */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11.5px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
                    Buyurtmachi ma&apos;lumotlari:
                  </label>
                  {currentUser ? (
                    <div className="rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/90 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-green-soft)] text-[var(--brand-green)] font-bold">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-[14px] font-black text-neutral-900 leading-tight">
                              {currentUser.name || "Ro'yxatdan o'tgan mijoz"}
                            </p>
                            <p className="text-[12px] font-medium text-neutral-500 mt-0.5">
                              {currentUser.phone || currentUser.secondPhone ? (
                                <span className="font-semibold text-neutral-700">
                                  {currentUser.phone || currentUser.secondPhone}
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold">Telefon kiritilmagan</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-black text-emerald-800">
                          Profil
                        </span>
                      </div>
                    </div>
                  ) : userLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-50 p-3.5 border border-neutral-200/70 text-[12.5px] text-neutral-500">
                      <Loader2 size={16} className="animate-spin text-[var(--brand-green)]" />
                      <span>Profil ma&apos;lumotlari yuklanmoqda...</span>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200/80 text-[12.5px] text-amber-900">
                      <p className="font-bold">⚠️ Buyurtma berish uchun tizimga kiring</p>
                      <p className="mt-1 text-[11.5px] text-amber-800 leading-relaxed">
                        Buyurtma ro&apos;yxatdan o&apos;tgan profilingizdagi ism va telefon raqamingiz orqali rasmiylashtiriladi.
                      </p>
                      <Link
                        href="/kirish"
                        onClick={() => setOpen(false)}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#039e1e] px-3.5 py-1.5 text-[12px] font-bold text-white shadow-xs hover:bg-[#028519]"
                      >
                        Tizimga kirish
                      </Link>
                    </div>
                  )}
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

            {/* Pastki Harakatlar Paneli (Har doim ko'rinib turishi uchun shrink-0 va BottomNav balandligini hisobga olgan safe-area) */}
            <div className="shrink-0 border-t border-black/10 bg-white p-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
              {!currentUser ? (
                <Link
                  href="/kirish"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#039e1e] py-3.5 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-[0.98] transition"
                >
                  <User size={18} />
                  <span>Buyurtma berish uchun tizimga kiring</span>
                </Link>
              ) : (
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
                      ? "Agro-mahsulotni tanlang"
                      : `Buyurtma berish (${shortSum(selectedTotal)} so'm)`}
                  </span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
