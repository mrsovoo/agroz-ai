"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  History,
  X,
  CreditCard,
  Banknote,
  HandCoins,
  ArrowRight,
  Loader2,
  Receipt,
  User,
  Ban,
  Calendar,
  Layers,
  ChevronRight,
  Phone,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";
import { money } from "@/lib/format";

export interface PosProduct {
  id: number;
  merchantId: number;
  name: string;
  category: string;
  description: string | null;
  price: number;
  unit: string;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  status: string;
}

export interface CartItem {
  product: PosProduct;
  quantity: number;
  unitPrice: number;
}

export interface PosSaleItem {
  id: number;
  saleId: number;
  merchantId: number;
  productId: number | null;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface PosSale {
  id: number;
  merchantId: number;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: "cash" | "card" | "credit";
  status: "completed" | "cancelled";
  debtId: number | null;
  note: string | null;
  createdAt: string;
  items?: PosSaleItem[];
}

export interface CustomerOption {
  id: number;
  name: string;
  phone: string | null;
  debtBalance: number;
}

interface PosSectionProps {
  initDataString?: string;
  onModalStateChange?: (isOpen: boolean, closeFn: () => void) => void;
  onNavigateToDebts?: () => void;
}

export default function PosSection({
  initDataString,
  onModalStateChange,
  onNavigateToDebts,
}: PosSectionProps) {
  // Asosiy rejim: "kassa" (savdo qilish) yoki "history" (sotuvlar tarixi)
  const [activeSubTab, setActiveSubTab] = useState<"kassa" | "history">("kassa");

  // Mahsulotlar katalogi holati
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Savat (Cart) holati
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash");
  const [noteInput, setNoteInput] = useState("");

  // Nasiya uchun mijoz tanlash
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("+998 ");
  const [submittingSale, setSubmittingSale] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Muvaffaqiyatli yakunlangan sotuv cheki (Receipt modal)
  const [completedSale, setCompletedSale] = useState<PosSale | null>(null);

  // Sotuvlar tarixi holati
  const [salesHistory, setSalesHistory] = useState<PosSale[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");
  const [historyPeriod, setHistoryPeriod] = useState<"today" | "7days" | "30days" | "all">("today");
  const [historyMethod, setHistoryMethod] = useState<"all" | "cash" | "card" | "credit">("all");
  const [viewingSaleDetails, setViewingSaleDetails] = useState<PosSale | null>(null);
  const [cancellingSaleId, setCancellingSaleId] = useState<number | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const buildAuthHeaders = useCallback(
    (extra: Record<string, string> = {}) => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("agroz_biznesgo_token") ||
            localStorage.getItem("agroz_business_token")
          : null;
      return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(initDataString ? { "x-telegram-init-data": initDataString } : {}),
        ...extra,
      };
    },
    [initDataString],
  );

  // Qidiruv kechiktiruvi (Kassa mahsulotlari)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(productSearch.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Qidiruv kechiktiruvi (Sotuvlar tarixi)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedHistorySearch(historySearch.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [historySearch]);

  // Kassa mahsulotlarini yuklash
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      const res = await apiFetch(`/api/biznesgo/pos/products?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setProducts(data.products || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingProducts(false);
    }
  }, [debouncedSearch, selectedCategory, buildAuthHeaders]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Mijozlarni tanlash uchun yuklash
  const loadCustomers = useCallback(async () => {
    try {
      const res = await apiFetch("/api/biznesgo/customers?limit=100", {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && Array.isArray(data.customers)) {
        setCustomerOptions(
          data.customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            debtBalance: c.debtBalance || 0,
          })),
        );
      }
    } catch {
      // ignore
    }
  }, [buildAuthHeaders]);

  // Sotuvlar tarixini yuklash
  const fetchSalesHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (historyPeriod !== "all") params.set("period", historyPeriod);
      if (historyMethod !== "all") params.set("paymentMethod", historyMethod);
      if (debouncedHistorySearch) params.set("search", debouncedHistorySearch);

      const res = await apiFetch(`/api/biznesgo/pos/sales?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setSalesHistory(data.sales || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPeriod, historyMethod, debouncedHistorySearch, buildAuthHeaders]);

  useEffect(() => {
    if (activeSubTab === "history") {
      fetchSalesHistory();
    }
  }, [activeSubTab, fetchSalesHistory]);

  // Modallarni yopish
  const closeAllModals = useCallback(() => {
    setIsCheckoutOpen(false);
    setCompletedSale(null);
    setViewingSaleDetails(null);
    setCheckoutError(null);
  }, []);

  // BackButton integratsiyasi
  const anyModalOpen = isCheckoutOpen || Boolean(completedSale) || Boolean(viewingSaleDetails);

  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(anyModalOpen, closeAllModals);
    }
  }, [anyModalOpen, onModalStateChange, closeAllModals]);

  // Savat hisob-kitoblari
  const cartSubtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const parsedDiscount = Math.max(0, parseInt(discountInput.replace(/\D/g, ""), 10) || 0);
  const cartFinalAmount = Math.max(0, cartSubtotal - parsedDiscount);

  // Savatga qo'shish
  const addToCart = (product: PosProduct) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotification("error", `Omborda boshqa ortiqcha qoldiq yo'q (${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
  };

  // Savat miqdorini kamaytirish
  const decreaseQuantity = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
      );
    });
  };

  // Savatdan o'chirish
  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Savat miqdorini to'g'ridan-to'g'ri o'zgartirish
  const updateCartItemQuantity = (productId: number, newQty: number, maxStock: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const finalQty = Math.min(newQty, maxStock);
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: finalQty } : item,
      ),
    );
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // To'lov / Savat oynasini ochish
  const openCheckoutDrawer = () => {
    if (cart.length === 0) return;
    loadCustomers();
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  // Tanlangan mijoz ma'lumotlari
  const selectedCustomer = customerOptions.find((c) => String(c.id) === selectedCustomerId);

  // Sotuvni yakunlash (POST /api/biznesgo/pos/sales)
  const handleCompleteSale = async () => {
    setCheckoutError(null);

    if (cart.length === 0) {
      setCheckoutError("Savat bo'sh");
      return;
    }

    if (parsedDiscount > cartSubtotal) {
      setCheckoutError("Chegirma summasi umumiy summadan katta bo'lishi mumkin emas");
      return;
    }

    if (paymentMethod === "credit") {
      if (!selectedCustomerId && !newCustomerName.trim()) {
        setCheckoutError("Nasiya savdosi uchun mijozni tanlang yoki ismini kiriting");
        return;
      }
    }

    setSubmittingSale(true);
    try {
      const payload: any = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discountAmount: parsedDiscount,
        paymentMethod,
        note: noteInput.trim() || null,
      };

      if (selectedCustomerId) {
        payload.customerId = Number(selectedCustomerId);
      } else if (newCustomerName.trim()) {
        payload.customerName = newCustomerName.trim();
        payload.customerPhone =
          newCustomerPhone.replace(/\D/g, "").length >= 9 ? newCustomerPhone.trim() : null;
      }

      const res = await apiFetch("/api/biznesgo/pos/sales", {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data.sale) {
        setCheckoutError(data?.error || "Sotuvni yakunlashda xatolik yuz berdi");
        setSubmittingSale(false);
        return;
      }

      // Muvaffaqiyatli yakunlandi
      setIsCheckoutOpen(false);
      setCompletedSale(data.sale);
      setCart([]);
      setDiscountInput("");
      setNoteInput("");
      setSelectedCustomerId("");
      setNewCustomerName("");
      setNewCustomerPhone("+998 ");

      // Mahsulotlar qoldig'ini yangilash
      fetchProducts();
    } catch {
      setCheckoutError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmittingSale(false);
    }
  };

  // Sotuvni bekor qilish (PATCH /api/biznesgo/pos/sales/:id/cancel)
  const handleCancelSale = async (sale: PosSale) => {
    if (sale.status === "cancelled") return;

    if (
      !window.confirm(
        `#${sale.id} raqamli sotuvni bekor qilmoqchimisiz? Ombor qoldig'i avtomatik ravishda qaytariladi.`,
      )
    ) {
      return;
    }

    setCancellingSaleId(sale.id);
    try {
      const res = await apiFetch(`/api/biznesgo/pos/sales/${sale.id}/cancel`, {
        method: "PATCH",
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        showNotification("success", "Sotuv bekor qilindi va qoldiqlar qaytarildi");
        fetchSalesHistory();
        fetchProducts();
        if (viewingSaleDetails?.id === sale.id) {
          setViewingSaleDetails((prev) => (prev ? { ...prev, status: "cancelled" } : null));
        }
      } else {
        alert(data?.error || "Sotuvni bekor qilishda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan aloqa uzildi");
    } finally {
      setCancellingSaleId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header va SubTab Switcher (Kassa va Tarix) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <ShoppingCart size={20} className="text-emerald-600" />
            <span>Tezkor Kassa (POS)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Tezkor savdo qilish, qoldiqni avtomatik hisoblash va nasiya qaydnomasi
          </p>
        </div>

        {/* SubTab tugmalari */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab("kassa")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition ${
              activeSubTab === "kassa"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <ShoppingCart size={14} />
            <span>Kassa</span>
            {cart.length > 0 && (
              <span className="h-5 min-w-[20px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition ${
              activeSubTab === "history"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <History size={14} />
            <span>Sotuvlar tarixi</span>
          </button>
        </div>
      </div>

      {/* Xabarlar */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center gap-2 text-xs font-bold animate-in fade-in ${
            notificationMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notificationMsg.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* 2. KASSA REJIMI (SAVDO) */}
      {activeSubTab === "kassa" && (
        <div className="space-y-4 pb-24 sm:pb-20">
          {/* Qidiruv va Kategoriya filtri */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Mahsulot nomi bo‘yicha qidiruv..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Kategoriya pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { value: "all", label: "Hammasi" },
                { value: "agro_chemicals", label: "Agrokimyo" },
                { value: "veterinary_products", label: "Veterinariya" },
                { value: "feed", label: "Yem-ozuqa" },
                { value: "seeds_seedlings", label: "Urug‘ va ko‘chat" },
                { value: "equipment", label: "Jihozlar" },
                { value: "general", label: "Umumiy" },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCategory(c.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    selectedCategory === c.value
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mahsulotlar to'ri */}
          {loadingProducts ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-2xs">
              <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <div className="text-xs font-bold text-zinc-600">Mahsulotlar yuklanmoqda...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center shadow-2xs space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
                <ShoppingCart size={24} />
              </div>
              <div className="text-xs font-bold text-zinc-700">
                {debouncedSearch ? "Qidiruv bo‘yicha mahsulot topilmadi" : "Do‘konda faol mahsulotlar mavjud emas"}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {products.map((p) => {
                const inCart = cart.find((item) => item.product.id === p.id);
                const isOutOfStock = p.stock <= 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white border rounded-2xl p-3 shadow-2xs transition flex flex-col justify-between select-none cursor-pointer relative ${
                      isOutOfStock
                        ? "border-zinc-200 opacity-60 cursor-not-allowed"
                        : inCart
                        ? "border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500/20"
                        : "border-zinc-200 hover:border-zinc-300 active:scale-[0.98]"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-xs font-black text-zinc-900 leading-snug line-clamp-2">
                          {p.name}
                        </div>
                        {inCart && (
                          <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-black text-emerald-700">
                        {money(p.price)} so‘m
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                      {isOutOfStock ? (
                        <span className="font-bold text-red-600">Qoldiq yo‘q</span>
                      ) : (
                        <span className="text-zinc-500 font-semibold">
                          Qoldiq: <strong className="text-zinc-800">{p.stock}</strong> {p.unit}
                        </span>
                      )}

                      {!isOutOfStock && (
                        <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                          <Plus size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pastki yopishqoq Savat Paneli (Sticky Bar) */}
          {cart.length > 0 && (
            <div className="fixed bottom-3 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 bg-zinc-900 text-white rounded-3xl p-3.5 sm:p-4 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
              <div>
                <div className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                  Savat: {cart.reduce((a, b) => a + b.quantity, 0)} dona
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-400">
                  {money(cartSubtotal)} so‘m
                </div>
              </div>

              <button
                type="button"
                onClick={openCheckoutDrawer}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition active:scale-95"
              >
                <span>To‘lovga o‘tish</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. SOTUVLAR TARIXI REJIMI */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          {/* Filtrlash va Qidiruv */}
          <div className="space-y-2.5">
            {/* Davr filtri */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { value: "today", label: "Bugun" },
                { value: "7days", label: "Oxirgi 7 kun" },
                { value: "30days", label: "30 kun" },
                { value: "all", label: "Barcha davr" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setHistoryPeriod(p.value as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    historyPeriod === p.value
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Qidiruv */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Mijoz ismi yoki telefoni bo‘yicha qidiruv..."
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Sotuvlar ro'yxati */}
          {loadingHistory ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-2xs">
              <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
              <div className="text-xs font-bold text-zinc-600">Sotuvlar tarixi yuklanmoqda...</div>
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center shadow-2xs space-y-3">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
                <Receipt size={24} />
              </div>
              <div className="text-xs font-bold text-zinc-700">
                {debouncedHistorySearch ? "Qidiruv bo‘yicha sotuv topilmadi" : "Hozircha sotuvlar amalga oshirilmagan"}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {salesHistory.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900">Sotuv #{s.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-200 text-zinc-600"
                          }`}
                        >
                          {s.status === "completed" ? "Bajarildi" : "Bekor qilingan"}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-0.5">
                        {s.customerName || "Do‘kon xaridori"}
                        {s.customerPhone ? ` • ${s.customerPhone}` : ""}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-zinc-900">{money(s.finalAmount)} so‘m</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block mt-0.5 ${
                          s.paymentMethod === "credit"
                            ? "bg-red-50 text-red-700"
                            : s.paymentMethod === "card"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {s.paymentMethod === "credit"
                          ? "Nasiya"
                          : s.paymentMethod === "card"
                          ? "Karta"
                          : "Naqd pul"}
                      </span>
                    </div>
                  </div>

                  {/* Sana va Harakatlar */}
                  <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-zinc-400" />
                      <span>{new Date(s.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setViewingSaleDetails(s)}
                        className="px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition"
                      >
                        Chekni ko‘rish
                      </button>

                      {s.status === "completed" && (
                        <button
                          type="button"
                          disabled={cancellingSaleId === s.id}
                          onClick={() => handleCancelSale(s)}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition"
                          title="Sotuvni bekor qilish"
                        >
                          {cancellingSaleId === s.id ? (
                            <Loader2 size={14} className="animate-spin text-red-600" />
                          ) : (
                            <Ban size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: SAVAT VA TO'LOVNI YAKUNLASH (CHECKOUT DRAWER) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-600" />
                <h3 className="text-sm sm:text-base font-black text-zinc-900">
                  Savat va To‘lov ({cart.length} xil mahsulot)
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Savatdagi mahsulotlar ro'yxati */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-2.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {money(item.unitPrice)} so‘m / {item.product.unit}
                    </div>
                  </div>

                  {/* Miqdor tugmalari */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.product.id)}
                      className="h-7 w-7 rounded-lg bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center hover:bg-zinc-100 active:scale-95"
                    >
                      <Minus size={12} />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={item.product.stock}
                      value={item.quantity}
                      onChange={(e) =>
                        updateCartItemQuantity(
                          item.product.id,
                          parseInt(e.target.value, 10) || 1,
                          item.product.stock,
                        )
                      }
                      className="w-10 text-center py-1 rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-900 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => addToCart(item.product)}
                      className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95"
                    >
                      <Plus size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition ml-1"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summalar va chegirma */}
            <div className="p-3.5 rounded-2xl bg-zinc-100/70 border border-zinc-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-600">
                <span>Jami savdo:</span>
                <span className="font-bold text-zinc-900">{money(cartSubtotal)} so‘m</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-600">Chegirma:</span>
                <input
                  type="text"
                  placeholder="0 so‘m"
                  value={discountInput ? Number(discountInput.replace(/\D/g, "")).toLocaleString() : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setDiscountInput(raw);
                  }}
                  className="w-32 text-right px-2.5 py-1 rounded-xl border border-zinc-200 bg-white text-xs font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-sm">
                <span className="font-bold text-zinc-900">Yakuniy to‘lov:</span>
                <span className="font-black text-emerald-700 text-base">
                  {money(cartFinalAmount)} so‘m
                </span>
              </div>
            </div>

            {/* To'lov usuli tanlash */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-700">To‘lov turi *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                    paymentMethod === "cash"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <Banknote size={18} className="mb-1" />
                  <span>Naqd pul</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                    paymentMethod === "card"
                      ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <CreditCard size={18} className="mb-1" />
                  <span>Karta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit")}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                    paymentMethod === "credit"
                      ? "border-red-600 bg-red-50/70 text-red-800 ring-2 ring-red-500/20"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <HandCoins size={18} className="mb-1" />
                  <span>Nasiya (Qarz)</span>
                </button>
              </div>
            </div>

            {/* Agar Nasiya bo'lsa -> Mijoz tanlash majburiy */}
            {paymentMethod === "credit" && (
              <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-black text-red-800">
                  <HandCoins size={14} />
                  <span>Nasiya oluvchi mijozni tanlang *</span>
                </div>

                {customerOptions.length > 0 && (
                  <div>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        if (e.target.value) {
                          setNewCustomerName("");
                        }
                      }}
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                    >
                      <option value="">-- Mijozlar bazasidan tanlash --</option>
                      {customerOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""} {c.debtBalance > 0 ? `[Qarzi: ${money(c.debtBalance)} so'm]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedCustomer && (
                  <div className="p-2 rounded-xl bg-white border border-red-200 text-[11px] flex items-center justify-between">
                    <span className="text-zinc-600">Joriy qarz balansi:</span>
                    <span className="font-bold text-red-600">
                      {money(selectedCustomer.debtBalance)} so‘m
                    </span>
                  </div>
                )}

                {!selectedCustomerId && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      placeholder="Yangi mijoz ismi (Ism-sharif) *"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder="Telefon raqami (ixtiyoriy)"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:outline-none"
                    />
                  </div>
                )}

                <div className="text-[10px] text-red-700 italic">
                  * Sotuv yakunlangach, mijoz hisobiga {money(cartFinalAmount)} so‘mlik yangi qarz yozuvi avtomatik kiritiladi.
                </div>
              </div>
            )}

            {/* Izoh */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Izoh yoki eslatma (ixtiyoriy)
              </label>
              <input
                type="text"
                placeholder="Chek izohi..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Yakunlash tugmasi */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAllModals}
                className="px-4 py-2.5 rounded-2xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={submittingSale}
                onClick={handleCompleteSale}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition disabled:opacity-50"
              >
                {submittingSale ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Sotuvni yakunlash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Muvaffaqiyatli yakunlangan sotuv cheki (Receipt Modal) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-zinc-900">Sotuv muvaffaqiyatli yakunlandi!</h3>
              <p className="text-xs text-zinc-500">Chek raqami: #{completedSale.id}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-zinc-500">Jami to‘lov:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {money(completedSale.finalAmount)} so‘m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">To‘lov usuli:</span>
                <span className="font-bold text-zinc-800">
                  {completedSale.paymentMethod === "credit"
                    ? "Nasiya"
                    : completedSale.paymentMethod === "card"
                    ? "Karta"
                    : "Naqd pul"}
                </span>
              </div>
              {completedSale.customerName && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Xaridor:</span>
                  <span className="font-bold text-zinc-800">{completedSale.customerName}</span>
                </div>
              )}
            </div>

            {completedSale.paymentMethod === "credit" && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-[11px] font-bold">
                Mijoz nomiga qarz yozuvi muvaffaqiyatli yaratildi!
              </div>
            )}

            <button
              type="button"
              onClick={() => setCompletedSale(null)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition"
            >
              Yangi savdo boshlash
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Sotuv tafsilotlari va cheki (History Details) */}
      {viewingSaleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900">
                  Sotuv tafsilotlari #{viewingSaleDetails.id}
                </h3>
                <div className="text-[11px] text-zinc-500">
                  {new Date(viewingSaleDetails.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Xaridor ma'lumoti */}
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">Mijoz:</span>
                <span className="font-bold text-zinc-900">
                  {viewingSaleDetails.customerName || "Do‘kon xaridori"}
                </span>
              </div>
              {viewingSaleDetails.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Telefon:</span>
                  <span className="font-bold text-zinc-900">{viewingSaleDetails.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Holat:</span>
                <span
                  className={`font-bold ${
                    viewingSaleDetails.status === "completed" ? "text-emerald-700" : "text-zinc-500"
                  }`}
                >
                  {viewingSaleDetails.status === "completed" ? "Bajarildi" : "Bekor qilingan"}
                </span>
              </div>
            </div>

            {/* Mahsulotlar ro'yxati */}
            <div className="space-y-1.5">
              <div className="text-xs font-black text-zinc-900">Mahsulotlar</div>
              {viewingSaleDetails.items?.map((it) => (
                <div
                  key={it.id}
                  className="p-2 rounded-xl bg-zinc-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-zinc-900">{it.productName}</div>
                    <div className="text-[10px] text-zinc-500">
                      {it.quantity} {it.unit} × {money(it.unitPrice)} so‘m
                    </div>
                  </div>
                  <div className="font-black text-zinc-900">{money(it.totalAmount)} so‘m</div>
                </div>
              ))}
            </div>

            {/* Summalar */}
            <div className="pt-2 border-t border-zinc-200 text-xs space-y-1">
              <div className="flex justify-between text-zinc-600">
                <span>Jami savdo:</span>
                <span>{money(viewingSaleDetails.totalAmount)} so‘m</span>
              </div>
              {viewingSaleDetails.discountAmount > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>Chegirma:</span>
                  <span>-{money(viewingSaleDetails.discountAmount)} so‘m</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-zinc-900 pt-1">
                <span>Yakuniy to‘lov:</span>
                <span className="text-emerald-700">{money(viewingSaleDetails.finalAmount)} so‘m</span>
              </div>
            </div>

            {/* Bekor qilish tugmasi */}
            {viewingSaleDetails.status === "completed" && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={cancellingSaleId === viewingSaleDetails.id}
                  onClick={() => handleCancelSale(viewingSaleDetails)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition disabled:opacity-50"
                >
                  {cancellingSaleId === viewingSaleDetails.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Ban size={14} />
                  )}
                  <span>Sotuvni bekor qilish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

