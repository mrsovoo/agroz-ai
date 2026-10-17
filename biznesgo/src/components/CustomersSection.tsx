"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Archive,
  Loader2,
  X,
  Save,
  ChevronRight,
  HandCoins,
  History,
  Clock,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api-config";
import { money } from "@/lib/format";

export interface BiznesGoCustomer {
  id: number;
  merchantId: number;
  name: string;
  phone: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
  note: string | null;
  notes: string | null;
  isArchived: boolean;
  debtBalance: number;
  activeDebtsCount: number;
  totalDebtsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetailDebt {
  id: number;
  totalAmount: number;
  paidAmount: number;
  status: "open" | "partial" | "paid" | "cancelled";
  dueDate: string | null;
  description: string | null;
  createdAt: string;
}

export interface CustomerDetailPayment {
  id: number;
  debtId: number;
  amount: number;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
}

export interface CustomerDetailSale {
  id: number;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: "cash" | "card" | "credit";
  status: "completed" | "cancelled";
  createdAt: string;
}

export interface CustomerDetailResponse extends BiznesGoCustomer {
  debts: CustomerDetailDebt[];
  payments: CustomerDetailPayment[];
  sales?: CustomerDetailSale[];
  posSales?: CustomerDetailSale[];
}

interface CustomersSectionProps {
  initDataString?: string;
  onModalStateChange?: (isOpen: boolean, closeFn: () => void) => void;
  onNavigateToDebts?: (customerId?: number) => void;
}

export default function CustomersSection({
  initDataString,
  onModalStateChange,
  onNavigateToDebts,
}: CustomersSectionProps) {
  const [customers, setCustomers] = useState<BiznesGoCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Mijoz qo'shish / tahrirlash modali
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<BiznesGoCustomer | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+998 ");
  const [formAddress, setFormAddress] = useState("");
  const [formNote, setFormNote] = useState("");
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState<string | null>(null);

  // Mijoz tafsilotlari va qarzlar tarixi modali
  const [viewingCustomer, setViewingCustomer] = useState<CustomerDetailResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Mijozga to'g'ridan-to'g'ri yangi qarz yozish modali
  const [addingDebtCustomer, setAddingDebtCustomer] = useState<BiznesGoCustomer | null>(null);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtInitialPayment, setDebtInitialPayment] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtDescription, setDebtDescription] = useState("");
  const [submittingDebt, setSubmittingDebt] = useState(false);
  const [debtFormError, setDebtFormError] = useState<string | null>(null);

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

  // Mijozlarni yuklash
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "50");
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await apiFetch(`/api/biznesgo/customers?${params.toString()}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErrorMsg(data?.error || "Mijozlar ro'yxatini yuklashda xatolik yuz berdi");
        setLoading(false);
        return;
      }

      setCustomers(data.customers || []);
    } catch {
      setErrorMsg("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, buildAuthHeaders]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Modal yopish funksiyasi
  const closeAllModals = useCallback(() => {
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
    setViewingCustomer(null);
    setAddingDebtCustomer(null);
    setCustomerFormError(null);
    setDebtFormError(null);
  }, []);

  // BackButton holatini yangilash
  const anyModalOpen =
    isCustomerModalOpen || Boolean(viewingCustomer) || Boolean(addingDebtCustomer);

  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(anyModalOpen, closeAllModals);
    }
  }, [anyModalOpen, onModalStateChange, closeAllModals]);

  // Mijoz qo'shish modalini ochish
  const openCreateCustomerModal = () => {
    setEditingCustomer(null);
    setFormName("");
    setFormPhone("+998 ");
    setFormAddress("");
    setFormNote("");
    setCustomerFormError(null);
    setIsCustomerModalOpen(true);
  };

  // Mijoz tahrirlash modalini ochish
  const openEditCustomerModal = (c: BiznesGoCustomer) => {
    setEditingCustomer(c);
    setFormName(c.name);
    setFormPhone(c.phone || "+998 ");
    setFormAddress(c.address || "");
    setFormNote(c.note || c.notes || "");
    setCustomerFormError(null);
    setIsCustomerModalOpen(true);
  };

  // Mijozni saqlash (yaratish yoki tahrirlash)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerFormError(null);

    const cleanName = formName.trim();
    if (!cleanName) {
      setCustomerFormError("Iltimos, mijoz ismini kiriting");
      return;
    }

    const cleanPhone = formPhone.replace(/\D/g, "").length >= 9 ? formPhone.trim() : null;

    setSubmittingCustomer(true);
    try {
      const url = editingCustomer
        ? `/api/biznesgo/customers/${editingCustomer.id}`
        : "/api/biznesgo/customers";
      const method = editingCustomer ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          address: formAddress.trim() || null,
          note: formNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setCustomerFormError(data?.error || "Mijozni saqlashda xatolik yuz berdi");
        setSubmittingCustomer(false);
        return;
      }

      setSuccessMsg(
        editingCustomer
          ? "Mijoz ma'lumotlari yangilandi"
          : "Yangi mijoz muvaffaqiyatli qo'shildi",
      );
      setTimeout(() => setSuccessMsg(null), 3500);

      closeAllModals();
      fetchCustomers();
    } catch {
      setCustomerFormError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmittingCustomer(false);
    }
  };

  // Mijoz tafsilotlarini ochish
  const openCustomerDetails = async (customer: BiznesGoCustomer) => {
    setLoadingDetails(true);
    try {
      const res = await apiFetch(`/api/biznesgo/customers/${customer.id}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.customer) {
        setViewingCustomer(data.customer);
      } else {
        alert(data?.error || "Mijoz tafsilotlarini yuklashda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan aloqa uzildi");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Mijozga qarz yozish modalini ochish
  const openAddDebtModal = (customer: BiznesGoCustomer) => {
    setAddingDebtCustomer(customer);
    setDebtAmount("");
    setDebtInitialPayment("");
    setDebtDueDate("");
    setDebtDescription("");
    setDebtFormError(null);
  };

  // Mijozga yangi qarz yozishni saqlash
  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingDebtCustomer) return;
    setDebtFormError(null);

    const parsedTotal = parseInt(debtAmount.replace(/\D/g, ""), 10);
    if (!parsedTotal || parsedTotal <= 0) {
      setDebtFormError("Qarz summasi 0 dan katta bo'lishi shart");
      return;
    }

    const parsedInitial = debtInitialPayment ? parseInt(debtInitialPayment.replace(/\D/g, ""), 10) : 0;
    if (parsedInitial > parsedTotal) {
      setDebtFormError("Boshlang'ich to'lov qarz summasidan ko'p bo'lishi mumkin emas");
      return;
    }

    setSubmittingDebt(true);
    try {
      const res = await apiFetch("/api/biznesgo/debts", {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          customerId: addingDebtCustomer.id,
          totalAmount: parsedTotal,
          paidAmount: parsedInitial,
          dueDate: debtDueDate || null,
          description: debtDescription.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setDebtFormError(data?.error || "Qarz yozuvini saqlashda xatolik yuz berdi");
        setSubmittingDebt(false);
        return;
      }

      setSuccessMsg(`${addingDebtCustomer.name} ga qarz yozuvi muvaffaqiyatli kiritildi`);
      setTimeout(() => setSuccessMsg(null), 3500);

      closeAllModals();
      fetchCustomers();
    } catch {
      setDebtFormError("Server bilan bog'lanishda xatolik yuz berdi");
    } finally {
      setSubmittingDebt(false);
    }
  };

  // Mijozni arxivlash
  const handleArchiveCustomer = async (customer: BiznesGoCustomer) => {
    if (customer.debtBalance > 0) {
      alert(
        `Ushbu mijozda ${money(customer.debtBalance)} so'm to'lanmagan ochiq qarz mavjud. Avval qarzni yoping yoki bekor qiling!`,
      );
      return;
    }

    if (!window.confirm(`${customer.name} ni arxivga ko'chirmoqchimisiz?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/biznesgo/customers/${customer.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setSuccessMsg("Mijoz arxivga ko'chirildi");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchCustomers();
      } else {
        alert(data?.error || "Arxivlashda xatolik yuz berdi");
      }
    } catch {
      alert("Server bilan aloqa uzildi");
    }
  };

  return (
    <div className="space-y-4">
      {/* Sarlavha va Yangi mijoz tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200 rounded-3xl p-5 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Users size={20} className="text-emerald-600" />
            <span>Mijozlar bazasi</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Doimiy xaridorlar ro‘yxati, telefon raqamlari va ularning qarz hisobi
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateCustomerModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
        >
          <Plus size={16} />
          <span>Yangi mijoz qo‘shish</span>
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

      {/* Qidiruv */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Mijoz ismi, telefon raqami yoki manzili bo‘yicha qidiruv..."
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
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

      {/* Mijozlar Ro'yxati */}
      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center shadow-2xs">
          <Loader2 size={24} className="animate-spin text-emerald-600 mx-auto mb-2" />
          <div className="text-xs font-bold text-zinc-600">Mijozlar yuklanmoqda...</div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-12 text-center shadow-2xs space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-zinc-800">
              {debouncedSearch ? "Qidiruv bo‘yicha mijoz topilmadi" : "Hozircha mijozlar mavjud emas"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {debouncedSearch
                ? "Boshqa so‘z yoki telefon raqami orqali qidirib ko‘ring."
                : "Doimiy xaridorlaringizni qo‘shing va ularga nasiya yozishni boshlang."}
            </p>
          </div>
          {!debouncedSearch && (
            <button
              type="button"
              onClick={openCreateCustomerModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
            >
              <Plus size={16} />
              <span>Birinchi mijozni qo‘shish</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customers.map((c) => {
            const hasDebt = c.debtBalance > 0;
            return (
              <div
                key={c.id}
                className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-zinc-900 leading-tight">
                          {c.name}
                        </h4>
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-emerald-600 mt-0.5"
                          >
                            <Phone size={11} />
                            <span>{c.phone}</span>
                          </a>
                        ) : (
                          <div className="text-[10px] text-zinc-400 mt-0.5">Telefon ko‘rsatilmagan</div>
                        )}
                      </div>
                    </div>

                    {/* Qarz holati badge */}
                    {hasDebt ? (
                      <div className="text-right shrink-0">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200/60 text-xs font-black">
                          <HandCoins size={12} />
                          <span>{money(c.debtBalance)} so‘m</span>
                        </div>
                        <div className="text-[10px] text-red-600 font-semibold mt-0.5">
                          {c.activeDebtsCount} ta ochiq qarz
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0">
                        <CheckCircle2 size={12} />
                        <span>Qarzi yo‘q</span>
                      </div>
                    )}
                  </div>

                  {c.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <MapPin size={12} className="shrink-0 text-zinc-400" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}

                  {c.note && (
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 italic bg-zinc-50 px-2 py-1 rounded-lg">
                      <FileText size={11} className="shrink-0 text-zinc-400" />
                      <span className="truncate">{c.note}</span>
                    </div>
                  )}
                </div>

                {/* Harakatlar paneli */}
                <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openAddDebtModal(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition"
                      title="Nasiya / qarz yozish"
                    >
                      <Plus size={12} />
                      <span>Qarz yozish</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openCustomerDetails(c)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition"
                      title="Qarzlar va to'lovlar tarixi"
                    >
                      <History size={12} />
                      <span>Tarix</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditCustomerModal(c)}
                      className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition"
                      title="Tahrirlash"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchiveCustomer(c)}
                      className="p-1.5 rounded-xl hover:bg-red-50 text-zinc-400 hover:text-red-600 transition"
                      title="Arxivlash"
                    >
                      <Archive size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Mijoz yaratish / tahrirlash */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm sm:text-base font-black text-zinc-900">
                {editingCustomer ? "Mijoz ma'lumotlarini tahrirlash" : "Yangi mijoz qo‘shish"}
              </h3>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {customerFormError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{customerFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Mijoz ismi (Ism-sharifi) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Dilshod Rahimov"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Telefon raqami (ixtiyoriy)
                </label>
                <input
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Manzili (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Yangiyo'l tumani, Guliston MFY"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Eslatma yoki izoh (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mijoz haqida qo'shimcha ma'lumot..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
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
                  disabled={submittingCustomer}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submittingCustomer ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  <span>{editingCustomer ? "O‘zgarishlarni saqlash" : "Mijozni saqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Mijoz tafsilotlari va barcha qarzlar tarixi */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                  {viewingCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-zinc-900">
                    {viewingCustomer.name}
                  </h3>
                  <div className="text-xs text-zinc-500">{viewingCustomer.phone || "Telefon kiritilmagan"}</div>
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

            {/* Qarz balansi kartochkasi */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Umumiy nasiya qoldig‘i
                </div>
                <div
                  className={`text-lg sm:text-xl font-black mt-0.5 ${
                    viewingCustomer.debtBalance > 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {money(viewingCustomer.debtBalance)} so‘m
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cust = viewingCustomer;
                  setViewingCustomer(null);
                  openAddDebtModal(cust);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Plus size={14} />
                <span>Qarz yozish</span>
              </button>
            </div>

            {/* Qarzlar ro'yxati */}
            <div className="space-y-3">
              <div className="text-xs font-black text-zinc-900">
                Qarzlar tarixi ({viewingCustomer.debts?.length || 0})
              </div>

              {!viewingCustomer.debts || viewingCustomer.debts.length === 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-50 text-center text-xs text-zinc-500">
                  Ushbu mijozda hali qarz yozuvlari yo‘q
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingCustomer.debts.map((d) => {
                    const balance = Math.max(0, d.totalAmount - d.paidAmount);
                    return (
                      <div
                        key={d.id}
                        className="p-3 rounded-2xl border border-zinc-200 bg-white space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-zinc-900">
                            {d.description || "Nasiya savdosi"}
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              d.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : d.status === "cancelled"
                                ? "bg-zinc-100 text-zinc-600"
                                : d.status === "partial"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {d.status === "paid"
                              ? "To'liq to'langan"
                              : d.status === "cancelled"
                              ? "Bekor qilingan"
                              : d.status === "partial"
                              ? "Qisman to'langan"
                              : "To'lanmagan"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-zinc-600">
                          <div>
                            <span>Jami: </span>
                            <span className="font-bold">{money(d.totalAmount)} so‘m</span>
                          </div>
                          <div>
                            <span>Qoldiq: </span>
                            <span className="font-bold text-red-600">{money(balance)} so‘m</span>
                          </div>
                        </div>

                        {d.dueDate && (
                          <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                            <Clock size={11} />
                            <span>Muddati: {new Date(d.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* To'lovlar tarixi */}
            <div className="space-y-3 pt-2 border-t border-zinc-100">
              <div className="text-xs font-black text-zinc-900">
                To‘lovlar tarixi ({viewingCustomer.payments?.length || 0})
              </div>

              {!viewingCustomer.payments || viewingCustomer.payments.length === 0 ? (
                <div className="p-4 rounded-2xl bg-zinc-50 text-center text-xs text-zinc-500">
                  Hali hech qanday to‘lov amalga oshirilmagan
                </div>
              ) : (
                <div className="space-y-2">
                  {viewingCustomer.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-emerald-700">+{money(p.amount)} so‘m</div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(p.createdAt).toLocaleString()} • {p.paymentMethod}
                        </div>
                      </div>
                      {p.note && <div className="text-[11px] text-zinc-500 italic">{p.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* POS Savdo tarixi */}
              <div className="space-y-3 pt-2 border-t border-zinc-100">
                <div className="text-xs font-black text-zinc-900">
                  Kassa sotuvlari tarixi ({viewingCustomer.posSales?.length || viewingCustomer.sales?.length || 0})
                </div>

                {(!viewingCustomer.posSales || viewingCustomer.posSales.length === 0) &&
                (!viewingCustomer.sales || viewingCustomer.sales.length === 0) ? (
                  <div className="p-4 rounded-2xl bg-zinc-50 text-center text-xs text-zinc-500">
                    Ushbu mijozga kassa orqali sotuv amalga oshirilmagan
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(viewingCustomer.posSales || viewingCustomer.sales || []).map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-zinc-900">
                            Sotuv #{s.id} — {money(s.finalAmount)} so‘m
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            {new Date(s.createdAt).toLocaleString()} • To‘lov:{" "}
                            {s.paymentMethod === "cash"
                              ? "Naqd pul"
                              : s.paymentMethod === "card"
                              ? "Karta"
                              : "Nasiya"}
                          </div>
                        </div>

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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* MODAL 3: Mijozga tezkor yangi qarz yozish */}
      {addingDebtCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900">Yangi qarz yozish</h3>
                <div className="text-xs text-zinc-500 mt-0.5">Mijoz: {addingDebtCustomer.name}</div>
              </div>
              <button
                type="button"
                onClick={closeAllModals}
                className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {debtFormError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-bold text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span>{debtFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDebt} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qarz summasi (so‘m) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 500 000"
                  value={debtAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setDebtAmount(raw ? Number(raw).toLocaleString() : "");
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
                  placeholder="Masalan: 100 000"
                  value={debtInitialPayment}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setDebtInitialPayment(raw ? Number(raw).toLocaleString() : "");
                  }}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Qaytarish muddati (ixtiyoriy)
                </label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2.5 text-xs text-zinc-900 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Tavsif yoki sabab (ixtiyoriy)
                </label>
                <textarea
                  rows={2}
                  placeholder="Masalan: 2 qop yem va dorilar..."
                  value={debtDescription}
                  onChange={(e) => setDebtDescription(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-200 px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-emerald-500"
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
                  disabled={submittingDebt}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submittingDebt ? (
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
    </div>
  );
}

