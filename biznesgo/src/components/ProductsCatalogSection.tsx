"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Edit3,
  Archive,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Minus,
  Loader2,
  Image as ImageIcon,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Wheat,
  Sprout,
  Wrench,
  FlaskConical,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";

export type ProductCategory =
  | "agro_chemicals"
  | "veterinary_products"
  | "feed"
  | "seeds_seedlings"
  | "equipment"
  | "general";

export type ProductUnit =
  | "dona"
  | "kg"
  | "litr"
  | "gr"
  | "ml"
  | "flakon"
  | "qop"
  | "tonna"
  | "pachka"
  | "metr"
  | "rulon";

export type ProductStatus = "active" | "out_of_stock" | "archived";

export interface BiznesGoProduct {
  id: number;
  merchantId: number;
  name: string;
  category: ProductCategory;
  description: string | null;
  price: number;
  unit: ProductUnit;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  totalCount: number;
  activeCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  archivedCount: number;
}

export const CATEGORY_OPTIONS: {
  value: ProductCategory;
  label: string;
  shortLabel: string;
  icon: typeof Package;
}[] = [
  {
    value: "agro_chemicals",
    label: "Agro-kimyo va o‘g‘itlar",
    shortLabel: "Agro-kimyo",
    icon: FlaskConical,
  },
  {
    value: "veterinary_products",
    label: "Veterinar mahsulotlar",
    shortLabel: "Veterinariya",
    icon: Sparkles,
  },
  {
    value: "feed",
    label: "Yem-ozuqa",
    shortLabel: "Yem-ozuqa",
    icon: Wheat,
  },
  {
    value: "seeds_seedlings",
    label: "Urug‘ va ko‘chat",
    shortLabel: "Urug‘/ko‘chat",
    icon: Sprout,
  },
  {
    value: "equipment",
    label: "Jihoz va uskunalar",
    shortLabel: "Jihozlar",
    icon: Wrench,
  },
  {
    value: "general",
    label: "Umumiy",
    shortLabel: "Umumiy",
    icon: Layers,
  },
];

export const UNIT_OPTIONS: { value: ProductUnit; label: string }[] = [
  { value: "dona", label: "dona" },
  { value: "kg", label: "kg" },
  { value: "litr", label: "litr" },
  { value: "gr", label: "gr" },
  { value: "ml", label: "ml" },
  { value: "flakon", label: "flakon" },
  { value: "qop", label: "qop" },
  { value: "tonna", label: "tonna" },
  { value: "pachka", label: "pachka" },
  { value: "metr", label: "metr" },
  { value: "rulon", label: "rulon" },
];

export type StatusFilterType = "all" | "active" | "low_stock" | "out_of_stock" | "archived";

function formatSom(amount: number): string {
  return Number(amount || 0).toLocaleString("ru-RU") + " so‘m";
}

function getCategoryLabel(category: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label || "Umumiy";
}

/**
 * Rasmni brauzerda <canvas> yordamida kichik hajmga (maks 480x480, JPEG ~30-80 KB) siqish.
 * Katta Base64 PostgreSQL bazasiga ketmasligini ta'minlaydi.
 */
async function compressImageFile(file: File): Promise<string> {
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Tanlangan rasm 8 MB dan katta. Iltimos, kichikroq rasm tanlang.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasmni o‘qishda xatolik yuz berdi"));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Tanlangan fayl yaroqli rasm emas"));
      img.onload = () => {
        const maxDim = 480;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Rasmni siqish imkoni bo‘lmadi"));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.75;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 240_000 && quality > 0.35) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface ProductsCatalogSectionProps {
  initDataString?: string;
  onModalStateChange?: (isOpen: boolean, closeFn: () => void) => void;
}

export default function ProductsCatalogSection({
  initDataString = "",
  onModalStateChange,
}: ProductsCatalogSectionProps) {
  const [products, setProducts] = useState<BiznesGoProduct[]>([]);
  const [summary, setSummary] = useState<ProductSummary>({
    totalCount: 0,
    activeCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    archivedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Qidiruv, filtr va sahifalash
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Qoldiqni tez yangilash holati
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);

  // Qo'shish / Tahrirlash modal holati
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BiznesGoProduct | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<ProductCategory>("agro_chemicals");
  const [formPrice, setFormPrice] = useState("");
  const [formUnit, setFormUnit] = useState<ProductUnit>("dona");
  const [formStock, setFormStock] = useState("10");
  const [formMinStock, setFormMinStock] = useState("5");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formStatus, setFormStatus] = useState<ProductStatus>("active");
  const [submittingForm, setSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [compressingImage, setCompressingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Qidiruv matnini kechiktirib yuborish (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const res = await apiFetch(`/api/biznesgo/products?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Mahsulotlar ro‘yxatini yuklashda xatolik yuz berdi");
        setLoading(false);
        return;
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
      if (data.summary) {
        setSummary(data.summary);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.total || 0);
      }
    } catch {
      setErrorMsg("Serverga ulanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, statusFilter, buildAuthHeaders]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setFormError(null);
  }, []);

  useEffect(() => {
    onModalStateChange?.(isFormOpen, closeFormModal);
  }, [isFormOpen, closeFormModal, onModalStateChange]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("agro_chemicals");
    setFormPrice("");
    setFormUnit("dona");
    setFormStock("10");
    setFormMinStock("5");
    setFormDescription("");
    setFormImageUrl("");
    setFormStatus("active");
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product: BiznesGoProduct) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory((product.category as ProductCategory) || "general");
    setFormPrice(String(product.price));
    setFormUnit((product.unit as ProductUnit) || "dona");
    setFormStock(String(product.stock));
    setFormMinStock(String(product.minStock ?? 5));
    setFormDescription(product.description || "");
    setFormImageUrl(product.imageUrl || "");
    setFormStatus(product.status || "active");
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressingImage(true);
    setFormError(null);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setFormImageUrl(compressedDataUrl);
    } catch (err: any) {
      setFormError(err?.message || "Rasmni yuklashda xatolik yuz berdi");
    } finally {
      setCompressingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formName.trim();
    if (cleanName.length < 2) {
      setFormError("Mahsulot nomi kamida 2 ta belgidan iborat bo‘lishi shart");
      return;
    }

    const numericPrice = Number(formPrice.replace(/\s+/g, ""));
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setFormError("Mahsulot narxi 0 dan katta son bo‘lishi kerak");
      return;
    }

    const numericStock = Number(formStock);
    if (!Number.isFinite(numericStock) || numericStock < 0) {
      setFormError("Ombor qoldig‘i 0 yoki undan katta son bo‘lishi kerak");
      return;
    }

    const numericMinStock = Number(formMinStock);
    if (!Number.isFinite(numericMinStock) || numericMinStock < 0) {
      setFormError("Minimal qoldiq 0 yoki undan katta son bo‘lishi kerak");
      return;
    }

    setSubmittingForm(true);
    try {
      const payload = {
        name: cleanName,
        category: formCategory,
        price: Math.round(numericPrice),
        unit: formUnit,
        stock: Math.floor(numericStock),
        minStock: Math.floor(numericMinStock),
        description: formDescription.trim() || null,
        imageUrl: formImageUrl.trim() || null,
        ...(editingProduct ? { status: formStatus } : {}),
      };

      const url = editingProduct
        ? `/api/biznesgo/products/${editingProduct.id}`
        : "/api/biznesgo/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setFormError(data?.error || "Mahsulotni saqlashda xatolik yuz berdi");
        setSubmittingForm(false);
        return;
      }

      closeFormModal();
      setSuccessMsg(
        data.message ||
          (editingProduct
            ? "Mahsulot ma‘lumotlari muvaffaqiyatli yangilandi!"
            : "Yangi mahsulot omborga qo‘shildi!"),
      );
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchProducts();
    } catch {
      setFormError("Serverga ulanishda xatolik yuz berdi");
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleQuickStockChange = async (
    product: BiznesGoProduct,
    change: { delta?: number; stock?: number },
  ) => {
    setUpdatingStockId(product.id);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/biznesgo/products/${product.id}/stock`, {
        method: "PATCH",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(change),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Qoldiqni o‘zgartirishda xatolik yuz berdi");
        return;
      }

      if (data.product) {
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? data.product : item)),
        );
      }
      await fetchProducts();
    } catch {
      setErrorMsg("Qoldiqni yangilashda internet xatosi yuz berdi");
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleArchiveProduct = async (product: BiznesGoProduct) => {
    setUpdatingStockId(product.id);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/biznesgo/products/${product.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Mahsulotni arxivlashda xatolik yuz berdi");
        return;
      }

      setSuccessMsg(`"${product.name}" arxivga o‘tkazildi`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchProducts();
    } catch {
      setErrorMsg("Mahsulotni arxivlashda server xatosi yuz berdi");
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleRestoreArchivedProduct = async (product: BiznesGoProduct) => {
    setUpdatingStockId(product.id);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/biznesgo/products/${product.id}`, {
        method: "PATCH",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          status: product.stock > 0 ? "active" : "out_of_stock",
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Mahsulotni qayta tiklashda xatolik yuz berdi");
        return;
      }

      setSuccessMsg(`"${product.name}" ombor ro‘yxatiga qayta tiklandi!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchProducts();
    } catch {
      setErrorMsg("Serverga ulanishda xatolik yuz berdi");
    } finally {
      setUpdatingStockId(null);
    }
  };

  const scrollInputIntoView = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  return (
    <div className="space-y-4">
      {/* Yuqori amal paneli va statistika */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-zinc-900 flex items-center gap-2">
              <Package size={20} className="text-emerald-600" />
              <span>Mahsulot katalogi va ombor qoldig‘i</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Do‘koningizdagi mahsulotlar, narxlar va ombor qoldig‘ini tezkor boshqaring
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-sm transition active:scale-95"
          >
            <Plus size={18} />
            <span>Yangi mahsulot qo‘shish</span>
          </button>
        </div>

        {/* Ombor ko'rsatkichlari */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`p-3 rounded-2xl border text-left transition ${
              statusFilter === "all"
                ? "border-emerald-600 bg-emerald-50/70"
                : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100/70"
            }`}
          >
            <div className="text-[11px] font-semibold text-zinc-500">Jami omborda</div>
            <div className="text-lg font-black text-zinc-900 mt-0.5">{summary.totalCount} ta</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("active");
              setPage(1);
            }}
            className={`p-3 rounded-2xl border text-left transition ${
              statusFilter === "active"
                ? "border-emerald-600 bg-emerald-50/70"
                : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100/70"
            }`}
          >
            <div className="text-[11px] font-semibold text-emerald-700">Sotuvda bor</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">{summary.activeCount} ta</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("low_stock");
              setPage(1);
            }}
            className={`p-3 rounded-2xl border text-left transition ${
              statusFilter === "low_stock"
                ? "border-amber-500 bg-amber-50"
                : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100/70"
            }`}
          >
            <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
              <span>Kam qolgan</span>
              {summary.lowStockCount > 0 && <AlertTriangle size={12} />}
            </div>
            <div className="text-lg font-black text-amber-700 mt-0.5">{summary.lowStockCount} ta</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("out_of_stock");
              setPage(1);
            }}
            className={`p-3 rounded-2xl border text-left transition ${
              statusFilter === "out_of_stock"
                ? "border-red-500 bg-red-50"
                : "border-zinc-100 bg-zinc-50 hover:bg-zinc-100/70"
            }`}
          >
            <div className="text-[11px] font-semibold text-red-600">Tugagan (0)</div>
            <div className="text-lg font-black text-red-600 mt-0.5">{summary.outOfStockCount} ta</div>
          </button>
        </div>

        {/* Kam qolgan mahsulotlar ogohlantiruvi */}
        {summary.lowStockCount > 0 && statusFilter !== "low_stock" && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <AlertTriangle size={16} className="text-amber-600 shrink-0" />
              <span>
                Omborda <strong>{summary.lowStockCount} ta</strong> mahsulot qoldig‘i minimal chegaradan kam qoldi!
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("low_stock");
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto"
            >
              Kam qolganlarni ko‘rish
            </button>
          </div>
        )}

        {/* Qidiruv va Kategoriya / Status filtrlari */}
        <div className="space-y-3 pt-1">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi bo‘yicha qidirish..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white pl-10 pr-9 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Kategoriya tugmalari */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              Barcha kategoriyalar
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat.value
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {cat.shortLabel}
              </button>
            ))}
          </div>

          {/* Status filtri: barchasi, bor, kam, tugagan, arxiv */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { id: "all", label: `Barchasi (${summary.totalCount})` },
                { id: "active", label: `Bor (${summary.activeCount})` },
                { id: "low_stock", label: `Kam (${summary.lowStockCount})` },
                { id: "out_of_stock", label: `Tugagan (${summary.outOfStockCount})` },
                { id: "archived", label: `Arxiv (${summary.archivedCount})` },
              ] as { id: StatusFilterType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition ${
                  statusFilter === tab.id
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Xabarlar */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mahsulotlar ro'yxati */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-10 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 size={28} className="animate-spin text-emerald-600" />
          <p className="text-xs font-semibold text-zinc-500">Mahsulotlar yuklanmoqda...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-black text-zinc-900">
              {statusFilter === "archived"
                ? "Arxivda mahsulotlar yo‘q"
                : debouncedSearch || selectedCategory !== "all" || statusFilter !== "all"
                  ? "Qidiruv bo‘yicha mahsulot topilmadi"
                  : "Omborda hali mahsulot yo‘q"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {statusFilter === "archived"
                ? "O‘chirilgan mahsulotlar shu yerda tarix uchun saqlanadi."
                : "Yangi mahsulot qo‘shish tugmasini bosib, do‘koningiz mahsulotlarini kiriting."}
            </p>
          </div>
          {statusFilter !== "archived" && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition"
            >
              <Plus size={16} />
              <span>Birinchi mahsulotni qo‘shish</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const isArchived = product.status === "archived";
            const isOutOfStock = !isArchived && (product.stock <= 0 || product.status === "out_of_stock");
            const isLowStock =
              !isArchived && !isOutOfStock && product.stock <= (product.minStock ?? 5);
            const isBusy = updatingStockId === product.id;

            return (
              <div
                key={product.id}
                className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-2xs transition ${
                  isOutOfStock
                    ? "border-red-200 bg-red-50/20"
                    : isLowStock
                      ? "border-amber-200"
                      : "border-zinc-200"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Surat yoki piktogramma */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={26} className="text-emerald-600/70" />
                    )}
                  </div>

                  {/* Asosiy ma'lumot */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-zinc-900 leading-snug">
                          {product.name}
                        </h3>
                        <span className="inline-block text-[11px] font-semibold text-zinc-500">
                          {getCategoryLabel(product.category)}
                        </span>
                      </div>

                      {/* Holat belgisi */}
                      {isArchived ? (
                        <span className="px-2.5 py-1 rounded-full bg-zinc-200 text-zinc-700 text-[11px] font-bold">
                          Arxivda
                        </span>
                      ) : isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-black">
                          Tugagan (0 {product.unit})
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black flex items-center gap-1">
                          <AlertTriangle size={12} />
                          <span>Kam qoldi</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          Sotuvda bor
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-xs text-zinc-600 line-clamp-2">{product.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                      <div className="text-sm sm:text-base font-black text-emerald-700">
                        {formatSom(product.price)}{" "}
                        <span className="text-xs font-semibold text-zinc-500">
                          / 1 {product.unit}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-zinc-700">
                        Qoldiq:{" "}
                        <span
                          className={
                            isOutOfStock
                              ? "text-red-600 font-black"
                              : isLowStock
                                ? "text-amber-700 font-black"
                                : "text-zinc-900 font-black"
                          }
                        >
                          {product.stock} {product.unit}
                        </span>{" "}
                        <span className="text-[11px] font-normal text-zinc-400">
                          (min: {product.minStock ?? 5})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pastki tezkor qoldiq va tahrirlash tugmalari */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2.5">
                  {!isArchived ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isBusy || product.stock <= 0}
                        onClick={() => handleQuickStockChange(product, { delta: -1 })}
                        className="h-9 px-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40 text-xs font-black text-zinc-800 flex items-center gap-1 transition active:scale-95"
                        title="1 taga kamaytirish"
                      >
                        <Minus size={14} />
                        <span>1</span>
                      </button>

                      <div className="px-3 py-1.5 rounded-xl bg-zinc-100 text-xs font-black text-zinc-900 min-w-[72px] text-center">
                        {isBusy ? "..." : `${product.stock} ${product.unit}`}
                      </div>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickStockChange(product, { delta: 1 })}
                        className="h-9 px-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-xs font-black text-emerald-800 flex items-center gap-1 transition active:scale-95"
                        title="1 taga oshirish"
                      >
                        <Plus size={14} />
                        <span>1</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleQuickStockChange(product, { delta: 5 })}
                        className="h-9 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-xs font-bold text-emerald-800 transition active:scale-95"
                      >
                        +5
                      </button>

                      {product.stock > 0 && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleQuickStockChange(product, { stock: 0 })}
                          className="h-9 px-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-[11px] font-bold text-amber-800 transition"
                        >
                          Tugadi (0)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      Arxivlangan mahsulot (asosiy ro‘yxatda ko‘rinmaydi)
                    </div>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => openEditModal(product)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
                    >
                      <Edit3 size={14} />
                      <span>Tahrirlash</span>
                    </button>

                    {isArchived ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleRestoreArchivedProduct(product)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        <span>Tiklash</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleArchiveProduct(product)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-xs font-bold text-zinc-600 transition disabled:opacity-50"
                        title="Arxivga o‘tkazish"
                      >
                        <Archive size={14} />
                        <span>Arxivlash</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Sahifalash */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-2xl px-4 py-3">
              <div className="text-xs text-zinc-500">
                Jami: <strong>{totalItems}</strong> ta • Sahifa {page} / {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Oldingi</span>
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Keyingi</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mahsulot qo'shish va tahrirlash Modal oynasi */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[92vh] overflow-y-auto pb-28 sm:pb-6">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <div className="text-sm sm:text-base font-black text-zinc-900 flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Edit3 size={18} className="text-emerald-600" />
                    <span>Mahsulotni tahrirlash</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} className="text-emerald-600" />
                    <span>Yangi mahsulot qo‘shish</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="h-8 w-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Mahsulot nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bento Max 5 kg yoki Ammofos"
                  value={formName}
                  onFocus={scrollInputIntoView}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Kategoriya *
                </label>
                <select
                  value={formCategory}
                  onFocus={scrollInputIntoView}
                  onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 bg-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Narxi (so‘m) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="Masalan: 45000"
                    value={formPrice}
                    onFocus={scrollInputIntoView}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    O‘lchov birligi *
                  </label>
                  <select
                    value={formUnit}
                    onFocus={scrollInputIntoView}
                    onChange={(e) => setFormUnit(e.target.value as ProductUnit)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Ombor qoldig‘i *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onFocus={scrollInputIntoView}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Kam qoldiq chegarasi
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinStock}
                    onFocus={scrollInputIntoView}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qo‘llanilishi / Izoh (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Masalan: G‘alla va sabzavotlar uchun o‘g‘it, gektariga 200 kg..."
                  value={formDescription}
                  onFocus={scrollInputIntoView}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Surat yuklash (ixtiyoriy, avtomatik siqiladi) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Mahsulot surati (ixtiyoriy)
                </label>

                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {formImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={22} className="text-zinc-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={compressingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-800 transition"
                      >
                        {compressingImage ? "Siqilmoqda..." : "Galereyadan tanlash"}
                      </button>
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl("")}
                          className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
                        >
                          O‘chirish
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Rasm avtomatik ravishda kichik hajmga (&lt;200 KB) siqiladi yoki tayyor URL kiriting.
                    </p>
                  </div>
                </div>

                <input
                  type="url"
                  placeholder="Yoki rasm URL manzilini kiriting (https://...)"
                  value={formImageUrl.startsWith("data:") ? "" : formImageUrl}
                  onFocus={scrollInputIntoView}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 py-3.5 rounded-2xl border border-zinc-200 text-xs sm:text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingForm || compressingImage}
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {submittingForm ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingProduct ? "O‘zgarishlarni saqlash" : "Omborga qo‘shish"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

