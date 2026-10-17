"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  HandCoins,
  Plus,
  Search,
  Phone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Loader2,
  History,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Edit3,
  Ban,
  ChevronDown,
  User,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";
import { money } from "@/lib/format";

export interface BiznesGoPayment {
  id: number;
  debtId: number;
  merchantId: number;
  amount: number;
  paymentMethod: "cash" | "card" | "transfer";
  note: string | null;
  createdAt: string;
}

export interface BiznesGoDebt {
  id: number;
  merchantId: number;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  description: string | null;
  totalAmount: number;
  paidAmount: number;
  dueDate: string | null;
  status: "open" | "partial" | "paid" | "cancelled";
  createdAt: string;
  updatedAt: string;
  remainingBalance: number;
  isOverdue: boolean;
  payments: BiznesGoPayment[];
}

export interface DebtsCounts {
  open: number;
  partial: number;
  paid: number;
  cancelled: number;
  overdue: number;
  total: number;
}

interface DebtsSectionProps {
  initDataString?: string;
  onModalStateChange?: (isOpen: boolean, closeFn: () => void) => void;
  onNavigateToCustomers?: () => void;
}

export default function DebtsSection({
  initDataString,
  onModalStateChange,
  onNavigateToCustomers,
}: DebtsSectionProps) {
  const [debts, setDebts] = useState<BiznesGoDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [totalOutstandingDebt, setTotalOutstandingDebt] = useState(0);
  const [counts, setCounts] = useState<DebtsCounts>({
    open: 0,
    partial: 0,
    paid: 0,
    cancelled: 0,
    overdue: 0,
    total: 0,
  });

  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "partial" | "overdue" | "paid" | "cancelled"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // 1. Yangi qarz yozish modali
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ id: number; name: string; phone: string | null }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [createCustomerName, setCreateCustomerName] = useState("");
  const [createCustomerPhone, setCreateCustomerPhone] = useState("+998 ");
  const [createTotalAmount, setCreateTotalAmount] = useState("");
  const [createInitialPayment, setCreateInitialPayment] = useState("");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 2. To'lov qabul qilish modali
  const [payingDebt, setPayingDebt] = useState<BiznesGoDebt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [payNote, setPayNote] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // 3. To'lovlar tarixi modali
  const [viewingPaymentsDebt, setViewingPaymentsDebt] = useState<BiznesGoDebt | null>(null);

  // 4. Qarzni tahrirlash modali
  const [editingDebt, setEditingDebt] = useState<BiznesGoDebt | null>(null);
  const [editTotalAmount, setEditTotalAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Qidiruv kechiktiruvi
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Qarzlar ro'yxatini olish
  const fetchDebts = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await apiFetch(`/api/biznesgo/debts?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Qarzlar ro'yxatini yuklashda xatolik yuz berdi");
        setLoading(false);
        return;
      }

      setDebts(data.debts || []);
      setTotalOutstandingDebt(data.totalOutstandingDebt || 0);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch {
      setErrorMsg("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, buildAuthHeaders]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // Mijozlar ro'yxatini select uchun olish
  const loadCustomersForSelect = useCallback(async () => {
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
          })),
        );
      }
    } catch {
      // ignore
    }
  }, [buildAuthHeaders]);

  // Barcha modal/drawerlarni yopish
  const closeAllModals = useCallback(() => {
    setIsCreateModalOpen(false);
    setPayingDebt(null);
    setViewingPaymentsDebt(null);
    setEditingDebt(null);
    setCreateError(null);
    setPayError(null);
    setEditError(null);
  }, []);

  // BackButton holatini yangilash
  const anyModalOpen =
    isCreateModalOpen ||
    Boolean(payingDebt) ||
    Boolean(viewingPaymentsDebt) ||
    Boolean(editingDebt);

  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(anyModalOpen, closeAllModals);
    }
  }, [anyModalOpen, onModalStateChange, closeAllModals]);

  // Yangi qarz modalini ochish
  const openCreateModal = () => {
    loadCustomersForSelect();
    setSelectedCustomerId("");
    setCreateCustomerName("");
    setCreateCustomerPhone("+998 ");
    setCreateTotalAmount("");
    setCreateInitialPayment("");
    setCreateDueDate("");
    setCreateDescription("");
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Yangi qarz yozuvini saqlash
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const totalParsed = parseInt(createTotalAmount.replace(/\D/g, ""), 10);
    if (!totalParsed || totalParsed <= 0) {
      setCreateError("Qarz summasi 0 dan katta bo'lishi shart");
      return;
    }

    const initPaidParsed = createInitialPayment
      ? parseInt(createInitialPayment.replace(/\D/g, ""), 10)
      : 0;

    if (initPaidParsed > totalParsed) {
      setCreateError("Boshlang'ich to'lov qarz summasidan ko'p bo'lishi mumkin emas");
      return;
    }

    if (!selectedCustomerId && !createCustomerName.trim()) {
      setCreateError("Iltimos, mijoz ismini kiriting yoki ro‘yxatdan tanlang");
      return;
    }

    setSubmittingCreate(true);
    try {
      const payload: any = {
        totalAmount: totalParsed,
        paidAmount: initPaidParsed,
        dueDate: createDueDate || null,
        description: createDescription.trim() || null,
      };

      if (selectedCustomerId) {
        payload.customerId = Number(selectedCustomerId);
      } else {
        payload.customerName = createCustomerName.trim();
        payload.customerPhone =
          createCustomerPhone.replace(/\D/g, "").length >= 9
            ? createCustomerPhone.trim()
            : null;
      }

      const res = await apiFetch("/api/biznesgo/debts", {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setCreateError(data?.error || "Qarz yozuvini saqlashda xatolik yuz berdi");
        setSubmittingCreate(false);
        return;
      }

      setSuccessMsg("Yangi qarz yozuvi muvaffaqiyatli saqlandi");
      setTimeout(() => setSuccessMsg(null), 3500);

      closeAllModals();
      fetchDebts();
    } catch {
      setCreateError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // To'lov modalini ochish
  const openPaymentModal = (debt: BiznesGoDebt) => {
    setPayingDebt(debt);
    setPayAmount(String(debt.remainingBalance));
    setPayMethod("cash");
    setPayNote("");
    setPayError(null);
  };

  // To'lovni yuborish
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    setPayError(null);

    const amountParsed = parseInt(payAmount.replace(/\D/g, ""), 10);
    if (!amountParsed || amountParsed <= 0) {
      setPayError("To'lov summasi 0 dan katta bo'lishi shart");
      return;
    }

    if (amountParsed > payingDebt.remainingBalance) {
      setPayError(
        `To'lov summasi qarz qoldig'idan (${money(payingDebt.remainingBalance)} so'm) ko'p bo'lishi mumkin emas`,
      );
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await apiFetch(`/api/biznesgo/debts/${payingDebt.id}/payments`, {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          amount: amountParsed,
          paymentMethod: payMethod,
          note: payNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setPayError(data?.error || "To'lovni saqlashda xatolik yuz berdi");
        setSubmittingPayment(false);
        return;
      }

      setSuccessMsg(
        `${money(amountParsed)} so‘m to‘lov qabul qilindi. Qarz yangilandi!`,
      );
      setTimeout(() => setSuccessMsg(null), 3500);

      closeAllModals();
      fetchDebts();
    } catch {
      setPayError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Tahrirlash modalini ochish
  const openEditModal = (debt: BiznesGoDebt) => {
    setEditingDebt(debt);
    setEditTotalAmount(String(debt.totalAmount));
    setEditDueDate(debt.dueDate ? debt.dueDate.split("T")[0] : "");
    setEditDescription(debt.description || "");
    setEditError(null);
  };

  // Tahrirni saqlash
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt) return;
    setEditError(null);

    const parsedTotal = parseInt(editTotalAmount.replace(/\D/g, ""), 10);
    if (!parsedTotal || parsedTotal <= 0) {
      setEditError("Umumiy qarz summasi 0 dan katta bo'lishi shart");
      return;
    }

    if (parsedTotal < editingDebt.paidAmount) {
      setEditError(
        `Umumiy qarz summasi allaqachon to'langan summadan (${money(editingDebt.paidAmount)} so'm) kam bo'lishi mumkin emas`,
      );
      return;
    }

    setSubmittingEdit(true);
    try {
      const res = await apiFetch(`/api/biznesgo/debts/${editingDebt.id}`, {
        method: "PATCH",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          totalAmount: parsedTotal,
          dueDate: editDueDate || null,
          description: editDescription.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setEditError(data?.error || "Qarzni yangilashda xatolik yuz berdi");
        setSubmittingEdit(false);
        return;
      }

      setSuccessMsg("Qarz yozuvi muvaffaqiyatli yangilandi");
      setTimeout(() => setSuccessMsg(null), 3500);

      closeAllModals();
      fetchDebts();
    } catch {
      setEditError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Qarzni bekor qilish
  const handleCancelDebt = async (debt: BiznesGoDebt) => {
    if (debt.status === "paid") {
      alert("To'liq to'langan qarzni bekor qilib bo'lmaydi");
      return;
    }

    if (
      !window.confirm(
        `${debt.customerName || "Mijoz"}ning ${money(debt.totalAmount)} so‘mlik qarzini bekor qilmoqchimisiz?`,
      )
    ) {
      return;
    }

    try {
      const res = await apiFetch(`/api/biznesgo/debts/${debt.id}/cancel`, {
        method: "PATCH",
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.ok) {
        setSuccessMsg("Qarz bekor qilindi");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchDebts();
      } else {
        alert(data?.error || "Qarzni bekor qilishda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan aloqa uzildi");
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sarlavha va Yangi qarz tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <HandCoins size={20} className="text-red-600" />
            <span>Qarz daftari (Nasiya hisobi)</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Mijozlarga berilgan qarzlar, to‘lovlar tarixi va qaytarish muddatlari nazorati
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
        >
          <Plus size={16} />
          <span>Yangi qarz yozish</span>
        </button>
      </div>

      {/* Xabarlar */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-800">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Statistika kartochkalari */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white border border-red-200 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Umumiy qarz qoldig‘i
          </div>
          <div className="text-sm sm:text-base font-black text-red-600 mt-0.5 truncate">
            {money(totalOutstandingDebt)} so‘m
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            {counts.open + counts.partial} ta faol nasiya
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Ochiq qarzlar
          </div>
          <div className="text-sm sm:text-base font-black text-zinc-900 mt-0.5">
            {counts.open} ta
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Hali to‘lanmagan</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Muddati o‘tgan
          </div>
          <div className="text-sm sm:text-base font-black text-amber-700 mt-0.5">
            {counts.overdue} ta
          </div>
          <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Kechikkan</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            To‘langan qarzlar
          </div>
          <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
            {counts.paid} ta
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">To‘liq yopilgan</div>
        </div>
      </div>

      {/* 3. Filtrlash va Qidiruv */}
      <div className="space-y-2.5">
        {/* Status filtrlari */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "all"
                ? "bg-zinc-900 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            Hammasi ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("open")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "open"
                ? "bg-red-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-red-600 hover:border-red-300"
            }`}
          >
            Ochiq ({counts.open})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("partial")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "partial"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-amber-700 hover:border-amber-300"
            }`}
          >
            Qisman ({counts.partial})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("overdue")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "overdue"
                ? "bg-red-700 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-red-700 hover:border-red-300"
            }`}
          >
            Muddati o‘tgan ({counts.overdue})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("paid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-emerald-700 hover:border-emerald-300"
            }`}
          >
            To‘langan ({counts.paid})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("cancelled")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              statusFilter === "cancelled"
                ? "bg-zinc-600 text-white shadow-xs"
                : "bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300"
            }`}
          >
            Bekor qilingan ({counts.cancelled})
          </button>
        </div>

        {/* Qidiruv qatori */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Mijoz ismi, telefon raqami yoki qarz tavsifi bo‘yicha qidiruv..."
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Qarzlar ro'yxati */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-2xs">
          <Loader2 size={24} className="animate-spin text-red-600 mx-auto mb-2" />
          <div className="text-xs font-bold text-zinc-600">Qarzlar yuklanmoqda...</div>
        </div>
      ) : debts.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
            <HandCoins size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-zinc-800">
              {debouncedSearch ? "Qidiruv bo‘yicha qarz topilmadi" : "Hozircha qarzlar mavjud emas"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {debouncedSearch
                ? "Boshqa so‘z yoki telefon raqami orqali qidirib ko‘ring."
                : "Mijozlarga nasiya savdosi qilganingizda, yangi qarz yozuvini kiriting."}
            </p>
          </div>
          {!debouncedSearch && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700 transition"
            >
              <Plus size={16} />
              <span>Yangi qarz yozish</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((d) => {
            const hasRemaining = d.remainingBalance > 0 && d.status !== "cancelled";

            return (
              <div
                key={d.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 transition space-y-3"
              >
                {/* Tepasi: Mijoz va status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-zinc-900">
                        {d.customerName || "Noma'lum mijoz"}
                      </h4>
                      {d.customerPhone && (
                        <a
                          href={`tel:${d.customerPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-emerald-600"
                        >
                          <Phone size={11} />
                          <span>{d.customerPhone}</span>
                        </a>
                      )}
                    </div>

                    {d.description && (
                      <div className="text-xs text-zinc-600 italic">{d.description}</div>
                    )}
                  </div>

                  {/* Status belgisi */}
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                        d.status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : d.status === "cancelled"
                          ? "bg-zinc-100 text-zinc-600"
                          : d.status === "partial"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-red-50 text-red-700 border border-red-200/60"
                      }`}
                    >
                      {d.status === "paid" && <CheckCircle2 size={12} />}
                      {d.status === "paid"
                        ? "To‘liq to‘langan"
                        : d.status === "cancelled"
                        ? "Bekor qilingan"
                        : d.status === "partial"
                        ? "Qisman to‘langan"
                        : "Ochiq qarz"}
                    </span>

                    {d.isOverdue && (
                      <div className="text-[10px] text-red-600 font-bold flex items-center gap-1 justify-end mt-1">
                        <AlertTriangle size={11} />
                        <span>Muddati o‘tgan</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* O'rtasi: Summalar */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-zinc-50 text-xs">
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500">Jami qarz</div>
                    <div className="font-bold text-zinc-900 mt-0.5">
                      {money(d.totalAmount)} so‘m
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500">To‘landi</div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {money(d.paidAmount)} so‘m
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500">Qoldiq</div>
                    <div
                      className={`font-black mt-0.5 ${
                        d.remainingBalance > 0 ? "text-red-600" : "text-zinc-500"
                      }`}
                    >
                      {money(d.remainingBalance)} so‘m
                    </div>
                  </div>
                </div>

                {/* Muddati va yaratilgan sanasi */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-zinc-400" />
                    <span>Sana: {new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>

                  {d.dueDate && (
                    <div
                      className={`flex items-center gap-1 font-semibold ${
                        d.isOverdue ? "text-red-600" : "text-zinc-600"
                      }`}
                    >
                      <Clock size={12} />
                      <span>Muddati: {new Date(d.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Pastki harakatlar paneli */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {hasRemaining && (
                      <button
                        type="button"
                        onClick={() => openPaymentModal(d)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                      >
                        <Banknote size={13} />
                        <span>To‘lov qabul qilish</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewingPaymentsDebt(d)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition"
                      title="To'lovlar tarixi"
                    >
                      <History size={13} />
                      <span>Tarix ({d.payments?.length || 0})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {d.status !== "cancelled" && d.status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => openEditModal(d)}
                        className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition"
                        title="Tahrirlash"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}

                    {d.status !== "cancelled" && d.status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => handleCancelDebt(d)}
                        className="p-1.5 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition"
                        title="Bekor qilish"
                      >
                        <Ban size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Yangi qarz yozish */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm sm:text-base font-black text-zinc-900">Yangi qarz yozish</h3>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="space-y-3.5">
              {/* Mijoz tanlash yoki yangi kiritish */}
              {customerOptions.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Mijozlar bazasidan tanlash
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      if (e.target.value) {
                        setCreateCustomerName("");
                      }
                    }}
                    className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 bg-white focus:outline-none focus:border-red-500"
                  >
                    <option value="">-- Yangi mijoz kiritish --</option>
                    {customerOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedCustomerId && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Mijoz ismi (Ism-sharifi) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Masalan: Nodirbek Karimov"
                      value={createCustomerName}
                      onChange={(e) => setCreateCustomerName(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Telefon raqami (ixtiyoriy)
                    </label>
                    <input
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={createCustomerPhone}
                      onChange={(e) => setCreateCustomerPhone(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Umumiy qarz summasi (so‘m) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 750 000"
                  value={createTotalAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setCreateTotalAmount(raw ? Number(raw).toLocaleString() : "");
                  }}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Boshlang‘ich to‘lov (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 150 000"
                  value={createInitialPayment}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setCreateInitialPayment(raw ? Number(raw).toLocaleString() : "");
                  }}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qaytarish muddati (ixtiyoriy)
                </label>
                <input
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qarz sababi yoki tavsifi (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Masalan: Urug‘lik bug‘doy va dori vositalari..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submittingCreate ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>Qarzni kiritish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: To'lov qabul qilish */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900">
                  To‘lov qabul qilish
                </h3>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Mijoz: {payingDebt.customerName || "Noma'lum"}
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

            {/* Qoldiq ko'rsatgichi */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  To‘lanishi kerak bo‘lgan qoldiq
                </div>
                <div className="text-lg font-black text-red-700 mt-0.5">
                  {money(payingDebt.remainingBalance)} so‘m
                </div>
              </div>
              <HandCoins size={24} className="text-red-500" />
            </div>

            {payError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{payError}</span>
              </div>
            )}

            <form onSubmit={handleSavePayment} className="space-y-3.5">
              {/* Tezkor foiz tugmalari */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700">To‘lov summasi (so‘m) *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(payingDebt.remainingBalance))}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-black transition"
                    >
                      100% (To‘liq)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPayAmount(String(Math.floor(payingDebt.remainingBalance / 2)))
                      }
                      className="px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] font-bold transition"
                    >
                      50%
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  placeholder="To'lov summasi..."
                  value={payAmount ? Number(payAmount.replace(/\D/g, "")).toLocaleString() : ""}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setPayAmount(raw);
                  }}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">To‘lov usuli</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("cash")}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                      payMethod === "cash"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <Banknote size={18} className="mb-1" />
                    <span>Naqd pul</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("card")}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                      payMethod === "card"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <CreditCard size={18} className="mb-1" />
                    <span>Karta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMethod("transfer")}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition ${
                      payMethod === "transfer"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    <ArrowRightLeft size={18} className="mb-1" />
                    <span>O‘tkazma</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Izoh yoki chek raqami (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Click orqali to'landi..."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submittingPayment ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>To‘lovni qabul qilish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Qarz to'lovlar tarixi */}
      {viewingPaymentsDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900">
                  To‘lovlar tarixi
                </h3>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Mijoz: {viewingPaymentsDebt.customerName || "Noma'lum"} • Jami qarz:{" "}
                  {money(viewingPaymentsDebt.totalAmount)} so‘m
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

            {/* Qoldiq va to'langan summa */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs">
              <div>
                <div className="text-[10px] text-zinc-500 font-semibold">To‘langan</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">
                  {money(viewingPaymentsDebt.paidAmount)} so‘m
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 font-semibold">Qoldiq</div>
                <div className="text-sm font-black text-red-600 mt-0.5">
                  {money(viewingPaymentsDebt.remainingBalance)} so‘m
                </div>
              </div>
            </div>

            {/* To'lovlar ro'yxati */}
            <div className="space-y-2">
              {!viewingPaymentsDebt.payments || viewingPaymentsDebt.payments.length === 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-50 text-center text-xs text-zinc-500">
                  Ushbu qarz bo‘yicha to‘lovlar yo‘q
                </div>
              ) : (
                viewingPaymentsDebt.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-emerald-700">+{money(p.amount)} so‘m</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(p.createdAt).toLocaleString()} • {p.paymentMethod}
                      </div>
                    </div>
                    {p.note && (
                      <div className="text-[11px] text-zinc-500 italic max-w-[200px] text-right truncate">
                        {p.note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Qarzni tahrirlash */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm sm:text-base font-black text-zinc-900">
                Qarz yozuvini tahrirlash
              </h3>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Umumiy qarz summasi (so‘m) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summa..."
                  value={
                    editTotalAmount
                      ? Number(editTotalAmount.replace(/\D/g, "")).toLocaleString()
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setEditTotalAmount(raw);
                  }}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 font-bold focus:outline-none focus:border-red-500"
                />
                <div className="text-[10px] text-zinc-500 mt-1">
                  Allaqachon to‘langan: {money(editingDebt.paidAmount)} so‘m. Summa bundan kam
                  bo‘la olmaydi.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qaytarish muddati (ixtiyoriy)
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 bg-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qarz tavsifi yoki sababi (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2.5 rounded-2xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submittingEdit ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>O‘zgarishlarni saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

