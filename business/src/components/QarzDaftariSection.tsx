"use client";

import { useState, useEffect, useMemo } from "react";
import {
  HandCoins,
  Plus,
  Users,
  Truck,
  Search,
  Phone,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  ArrowDownRight,
  AlertCircle,
  Download,
  History,
  MessageSquare,
  Send,
  Trash2,
} from "lucide-react";
import { fmt, money } from "@/lib/format";

export type DebtTransaction = {
  id: number;
  date: string;
  type: "debt" | "repay";
  amount: number;
  method?: "naqd" | "karta" | "otkazma";
  note?: string;
};

export type PartnerDebt = {
  id: number;
  name: string;
  phone: string;
  address: string;
  kind: "mijoz" | "taminotchi";
  balance: number; // Musbat bo'lsa qarz
  creditLimit: number;
  lastDate?: string;
  note?: string;
  transactions?: DebtTransaction[];
};

const DEBTS_Updated_EVENT = "agroz_debts_updated";

export function getDebtsStorageKey(partnerId?: number | string | null): string {
  return `agroz_partner_debts_${partnerId || "default"}`;
}

export function loadPartnerDebts(partnerId?: number | string | null): PartnerDebt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getDebtsStorageKey(partnerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePartnerDebts(partnerId: number | string | null | undefined, list: PartnerDebt[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getDebtsStorageKey(partnerId), JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(DEBTS_Updated_EVENT));
  } catch {}
}

/**
 * Tezkor Kassa (POS) orqali nasiyaga sotilganda avtomatik Qarz daftariga yozish
 */
export function recordPosCreditDebt(params: {
  partnerId?: number | string | null;
  customerName: string;
  customerPhone?: string;
  amount: number;
  note: string;
}) {
  const { partnerId, customerName, customerPhone = "", amount, note } = params;
  if (!amount || amount <= 0) return;
  const list = loadPartnerDebts(partnerId);
  const today = new Date().toISOString().slice(0, 10);
  const cleanName = customerName.trim() || "Nasiya xaridor";
  const cleanPhone = customerPhone.trim();

  const existingIdx = list.findIndex(
    (d) =>
      d.kind === "mijoz" &&
      ((cleanPhone && d.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "")) ||
        d.name.toLowerCase() === cleanName.toLowerCase())
  );

  const tx: DebtTransaction = {
    id: Date.now(),
    date: new Date().toISOString(),
    type: "debt",
    amount,
    note,
  };

  if (existingIdx >= 0) {
    const item = list[existingIdx];
    list[existingIdx] = {
      ...item,
      balance: item.balance + amount,
      lastDate: today,
      note: note || item.note,
      transactions: [tx, ...(item.transactions || [])],
    };
  } else {
    list.unshift({
      id: Date.now(),
      name: cleanName,
      phone: cleanPhone,
      address: "",
      kind: "mijoz",
      balance: amount,
      creditLimit: 5000000,
      lastDate: today,
      note,
      transactions: [tx],
    });
  }

  savePartnerDebts(partnerId, list);
}

export default function QarzDaftariSection({
  partnerId,
  storeName = "Agro-do'kon",
}: {
  partnerId?: number | string | null;
  storeName?: string;
}) {
  const [debts, setDebts] = useState<PartnerDebt[]>([]);
  const [kind, setKind] = useState<"mijoz" | "taminotchi">("mijoz");
  const [search, setSearch] = useState("");
  const [repayModal, setRepayModal] = useState<PartnerDebt | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"naqd" | "karta" | "otkazma">("naqd");
  const [repayNote, setRepayNote] = useState("");

  const [addDebtModal, setAddDebtModal] = useState<PartnerDebt | null>(null);
  const [extraDebtAmount, setExtraDebtAmount] = useState("");
  const [extraDebtNote, setExtraDebtNote] = useState("");

  const [historyModal, setHistoryModal] = useState<PartnerDebt | null>(null);

  const [newModal, setNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newNote, setNewNote] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setDebts(loadPartnerDebts(partnerId));
    const onSync = () => setDebts(loadPartnerDebts(partnerId));
    window.addEventListener(DEBTS_Updated_EVENT, onSync);
    return () => window.removeEventListener(DEBTS_Updated_EVENT, onSync);
  }, [partnerId]);

  const updateAndSave = (updater: (prev: PartnerDebt[]) => PartnerDebt[]) => {
    setDebts((prev) => {
      const next = updater(prev);
      savePartnerDebts(partnerId, next);
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = useMemo(
    () =>
      debts.filter(
        (d) =>
          d.kind === kind &&
          (d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.phone.includes(search) ||
            d.address.toLowerCase().includes(search.toLowerCase()))
      ),
    [debts, kind, search]
  );

  const totalDebt = filtered.reduce((acc, d) => acc + d.balance, 0);
  const activeCount = filtered.filter((d) => d.balance > 0).length;
  const overLimitCount = filtered.filter((d) => d.creditLimit > 0 && d.balance > d.creditLimit).length;

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModal) return;
    const amount = Number(repayAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) return;

    const tx: DebtTransaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: "repay",
      amount,
      method: repayMethod,
      note: repayNote.trim() || "Qarz to'lovi",
    };

    updateAndSave((prev) =>
      prev.map((d) =>
        d.id === repayModal.id
          ? {
              ...d,
              balance: Math.max(0, d.balance - amount),
              lastDate: new Date().toISOString().slice(0, 10),
              transactions: [tx, ...(d.transactions || [])],
            }
          : d
      )
    );
    showToast(`To'lov qabul qilindi: ${fmt(amount)} so'm (${repayModal.name})`);
    setRepayModal(null);
    setRepayAmount("");
    setRepayNote("");
  };

  const handleExtraDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addDebtModal) return;
    const amount = Number(extraDebtAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) return;

    const tx: DebtTransaction = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: "debt",
      amount,
      note: extraDebtNote.trim() || "Qo'shimcha nasiya",
    };

    updateAndSave((prev) =>
      prev.map((d) =>
        d.id === addDebtModal.id
          ? {
              ...d,
              balance: d.balance + amount,
              lastDate: new Date().toISOString().slice(0, 10),
              note: extraDebtNote.trim() || d.note,
              transactions: [tx, ...(d.transactions || [])],
            }
          : d
      )
    );
    showToast(`Nasiya qo'shildi: ${fmt(amount)} so'm (${addDebtModal.name})`);
    setAddDebtModal(null);
    setExtraDebtAmount("");
    setExtraDebtNote("");
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const initialAmount = Number(newBalance.replace(/\D/g, "")) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const initialTx: DebtTransaction[] =
      initialAmount > 0
        ? [
            {
              id: Date.now(),
              date: new Date().toISOString(),
              type: "debt",
              amount: initialAmount,
              note: newNote.trim() || "Boshlang'ich qarz",
            },
          ]
        : [];

    const newRecord: PartnerDebt = {
      id: Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      kind,
      balance: initialAmount,
      creditLimit: Number(newLimit.replace(/\D/g, "")) || 5000000,
      lastDate: today,
      note: newNote.trim(),
      transactions: initialTx,
    };

    updateAndSave((prev) => [newRecord, ...prev]);
    showToast(`${kind === "mijoz" ? "Mijoz" : "Ta'minotchi"} muvaffaqiyatli qo'shildi`);
    setNewModal(false);
    setNewName("");
    setNewPhone("");
    setNewAddress("");
    setNewBalance("");
    setNewLimit("");
    setNewNote("");
  };

  const handleDeleteDebt = (item: PartnerDebt) => {
    if (!confirm(`"${item.name}" yozuvini qarz daftaridan o'chirmoqchimisiz?`)) return;
    updateAndSave((prev) => prev.filter((d) => d.id !== item.id));
    showToast("Yozuv o'chirildi");
  };

  const buildReminderText = (d: PartnerDebt) => {
    return `Assalomu alaykum, ${d.name}! "${storeName}" agro-do'konidan eslatma: Sizning joriy qarzingiz ${fmt(
      d.balance
    )} so'mni tashkil etadi. Iltimos, imkon qadar to'lovni amalga oshiring. Rahmat!`;
  };

  const handleCopyReminder = (d: PartnerDebt) => {
    const text = buildReminderText(d);
    navigator.clipboard?.writeText(text);
    showToast("Eslatma matni nusxalandi!");
  };

  const exportDebtsCsv = () => {
    const rows = [
      ["Turi", "F.I.SH / Tashkilot", "Telefon", "Manzil", "Qarz balansi (so'm)", "Kredit limiti (so'm)", "Oxirgi sana", "Izoh"],
      ...filtered.map((d) => [
        d.kind === "mijoz" ? "Mijoz" : "Ta'minotchi",
        `"${(d.name || "").replace(/"/g, '""')}"`,
        `"${d.phone || ""}"`,
        `"${(d.address || "").replace(/"/g, '""')}"`,
        String(d.balance || 0),
        String(d.creditLimit || 0),
        d.lastDate || "",
        `"${(d.note || "").replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qarz-daftari-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Excel (CSV) fayl yuklab olindi");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sarlavha va Yangi Yozuv tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[#1D1D1F] flex items-center gap-2">
            <HandCoins size={18} className="text-[#1D1D1F]" />
            <span>Qarz daftari</span>
          </h2>
          <p className="text-xs text-[#86868B] mt-0.5">
            Mijozlar nasiyasi, to&apos;lovlar tarixi va ta&apos;minotchilar hisob-kitobi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportDebtsCsv}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E5E5EA] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] px-3.5 py-2 text-xs font-medium active:scale-95 transition"
          >
            <Download size={14} />
            <span>Excel (.csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setNewModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1D1D1F] hover:bg-black text-white px-4 py-2 text-xs font-medium active:scale-95 transition"
          >
            <Plus size={15} />
            <span>{kind === "mijoz" ? "Mijoz qo'shish" : "Ta'minotchi qo'shish"}</span>
          </button>
        </div>
      </div>

      {/* KPI Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
            <span>{kind === "mijoz" ? "Mijozlar qarzi" : "Ta'minotchi qarzi"}</span>
            <span className="p-1.5 rounded-full bg-[#F5F5F7] text-[#1D1D1F]">
              {kind === "mijoz" ? <Users size={14} /> : <Truck size={14} />}
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">{money(totalDebt)}</p>
          <p className="mt-1 text-[11px] text-[#86868B]">
            {kind === "mijoz" ? "Do'konga qaytishi kutilayotgan" : "To'lanishi kutilayotgan"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
            <span>Faol qarzdorlar</span>
            <span className="p-1.5 rounded-full bg-[#F5F5F7] text-[#1D1D1F]">
              <Users size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">{activeCount} ta</p>
          <p className="mt-1 text-[11px] text-[#86868B]">Jami ro&apos;yxatda: {filtered.length} ta</p>
        </div>

        <div className="rounded-2xl border border-[#E5E5EA] bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium text-[#86868B]">
            <span>Limitlar nazorati</span>
            <span className="p-1.5 rounded-full bg-[#F5F5F7] text-[#1D1D1F]">
              <AlertCircle size={14} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">
            {overLimitCount > 0 ? `${overLimitCount} ta oshgan` : "Normada"}
          </p>
          <p className="mt-1 text-[11px] text-[#86868B]">
            {overLimitCount > 0 ? "Kredit limitidan oshganlar bor" : "Barcha mijozlar limit doirasida"}
          </p>
        </div>
      </div>

      {/* Tablar & Qidiruv */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex rounded-xl bg-[#F5F5F7] p-1 text-xs font-medium w-fit border border-[#E5E5EA]">
          <button
            type="button"
            onClick={() => setKind("mijoz")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              kind === "mijoz" ? "bg-white text-[#1D1D1F] shadow-xs font-semibold" : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <Users size={13} />
            <span>Mijozlar</span>
          </button>
          <button
            type="button"
            onClick={() => setKind("taminotchi")}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition ${
              kind === "taminotchi" ? "bg-white text-[#1D1D1F] shadow-xs font-semibold" : "text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <Truck size={13} />
            <span>Ta&apos;minotchilar</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
          <input
            type="text"
            placeholder="Qidirish (ism, telefon, manzil)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E5E5EA] bg-white pl-9 pr-3.5 py-2 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:border-[#1D1D1F]"
          />
        </div>
      </div>

      {/* Qarzdorlar Jadvali */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E5EA] bg-white p-12 text-center text-[#86868B]">
          <HandCoins size={32} className="mx-auto mb-2 opacity-30 text-[#1D1D1F]" />
          <p className="text-xs font-medium text-[#1D1D1F]">Hozircha qarz yozuvlari yo&apos;q</p>
          <p className="text-[11px] text-[#86868B] mt-0.5">
            Yuqoridagi &quot;{kind === "mijoz" ? "Mijoz qo'shish" : "Ta'minotchi qo'shish"}&quot; tugmasi yoki Tezkor Kassa orqali nasiya qo&apos;shishingiz mumkin
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFBFD] border-b border-[#E5E5EA] text-[#86868B] font-medium text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">F.I.SH / Tashkilot</th>
                  <th className="px-4 py-3">Telefon & Eslatma</th>
                  <th className="px-4 py-3">Qarz balansi</th>
                  <th className="px-4 py-3">Limit</th>
                  <th className="px-4 py-3">Oxirgi sana</th>
                  <th className="px-5 py-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7] font-normal">
                {filtered.map((d) => {
                  const limitPct = d.creditLimit > 0 ? Math.min(100, (d.balance / d.creditLimit) * 100) : 0;
                  const cleanPhone = (d.phone || "").replace(/[^\d+]/g, "");
                  const smsHref = cleanPhone
                    ? `sms:${cleanPhone}?body=${encodeURIComponent(buildReminderText(d))}`
                    : undefined;

                  return (
                    <tr key={d.id} className="hover:bg-[#F5F5F7]/50 transition">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-[#1D1D1F] text-xs">{d.name}</div>
                        {d.address && <div className="text-[10px] text-[#86868B] mt-0.5">{d.address}</div>}
                        {d.note && <div className="text-[10px] text-emerald-700 mt-0.5 max-w-xs truncate">{d.note}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[#1D1D1F] text-[11px]">{d.phone || "—"}</div>
                        {d.balance > 0 && (
                          <div className="flex items-center gap-1.5 mt-1">
                            {cleanPhone && (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700"
                                title="Qo'ng'iroq qilish"
                              >
                                <Phone size={10} />
                                <span>Tel</span>
                              </a>
                            )}
                            {smsHref && (
                              <a
                                href={smsHref}
                                className="inline-flex items-center gap-1 rounded-md bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"
                                title="SMS eslatma yuborish"
                              >
                                <MessageSquare size={10} />
                                <span>SMS</span>
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopyReminder(d)}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"
                              title="Telegram uchun eslatma matnini nusxalash"
                            >
                              <Send size={10} />
                              <span>Eslatma</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-xs text-[#1D1D1F]">
                          {money(d.balance)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${limitPct >= 100 ? "bg-red-500" : "bg-[#1D1D1F]"}`}
                              style={{ width: `${limitPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[#86868B]">{Math.round(limitPct)}%</span>
                        </div>
                        <div className="text-[9.5px] text-[#86868B] mt-0.5">Limit: {fmt(d.creditLimit)}</div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#86868B] font-mono">
                        {d.lastDate || "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setRepayModal(d);
                              setRepayAmount(d.balance ? String(d.balance) : "");
                            }}
                            className="rounded-full bg-[#1D1D1F] text-white hover:bg-black px-3 py-1 font-medium text-[11px] transition"
                          >
                            To&apos;lov
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddDebtModal(d);
                              setExtraDebtAmount("");
                              setExtraDebtNote("");
                            }}
                            className="rounded-full border border-[#E5E5EA] hover:border-[#1D1D1F] bg-white text-[#1D1D1F] px-2.5 py-1 font-medium text-[11px] transition"
                            title="Yana qarz yozish"
                          >
                            + Nasiya
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryModal(d)}
                            className="rounded-full p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition"
                            title="To'lovlar va nasiya tarixi"
                          >
                            <History size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDebt(d)}
                            className="rounded-full p-1.5 text-zinc-300 hover:text-red-600 hover:bg-red-50 transition"
                            title="O'chirish"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TO'LOV QABUL QILISH MODALI */}
      {repayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5EA] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">To&apos;lov qabul qilish</h3>
                <p className="text-[11px] text-[#86868B]">{repayModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setRepayModal(null)}
                className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRepaySubmit} className="p-5 space-y-4 text-xs">
              <div className="rounded-xl bg-[#FBFBFD] border border-[#E5E5EA] p-3.5 flex justify-between items-center">
                <span className="text-[#86868B]">Joriy qarz balansi:</span>
                <span className="font-mono font-semibold text-[#1D1D1F] text-sm">{money(repayModal.balance)}</span>
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">To&apos;lov summasi (so&apos;m) *</label>
                <input
                  type="text"
                  required
                  placeholder="500 000"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3.5 py-2.5 text-[#1D1D1F] font-mono font-medium text-sm focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">To&apos;lov usuli</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "naqd", label: "Naqd", icon: Banknote },
                    { id: "karta", label: "Karta", icon: CreditCard },
                    { id: "otkazma", label: "O'tkazma", icon: ArrowDownRight },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRepayMethod(m.id as any)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition ${
                        repayMethod === m.id
                          ? "border-[#1D1D1F] bg-[#1D1D1F] text-white"
                          : "border-[#E5E5EA] hover:border-[#86868B] text-[#515154]"
                      }`}
                    >
                      <m.icon size={13} />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Qisman to'lov..."
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRepayModal(null)}
                  className="flex-1 rounded-full bg-[#F5F5F7] py-2.5 font-medium text-[#1D1D1F] hover:bg-[#E5E5EA] transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-[#1D1D1F] hover:bg-black py-2.5 font-medium text-white transition active:scale-95"
                >
                  Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QO'SHIMCHA NASIYA YOZISH MODALI */}
      {addDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5EA] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Qo&apos;shimcha nasiya yozish</h3>
                <p className="text-[11px] text-[#86868B]">{addDebtModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddDebtModal(null)}
                className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExtraDebtSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">Nasiya summasi (so&apos;m) *</label>
                <input
                  type="text"
                  required
                  placeholder="250 000"
                  value={extraDebtAmount}
                  onChange={(e) => setExtraDebtAmount(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3.5 py-2.5 text-[#1D1D1F] font-mono font-medium text-sm focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>
              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">Olingan mahsulotlar / Izoh</label>
                <input
                  type="text"
                  placeholder="Masalan: 2 qop BENTO MAX"
                  value={extraDebtNote}
                  onChange={(e) => setExtraDebtNote(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAddDebtModal(null)}
                  className="flex-1 rounded-full bg-[#F5F5F7] py-2.5 font-medium text-[#1D1D1F] hover:bg-[#E5E5EA] transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-[#1D1D1F] hover:bg-black py-2.5 font-medium text-white transition active:scale-95"
                >
                  Qo&apos;shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TO'LOVLAR VA QARZ TARIXI MODALI */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5EA] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Amallar tarixi</h3>
                <p className="text-[11px] text-[#86868B]">{historyModal.name} · Balans: {money(historyModal.balance)}</p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModal(null)}
                className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 max-h-80 overflow-y-auto space-y-2.5 text-xs">
              {(!historyModal.transactions || historyModal.transactions.length === 0) ? (
                <p className="text-center text-[#86868B] py-6">Tarix yozuvlari mavjud emas</p>
              ) : (
                historyModal.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-xl border border-[#E5E5EA] p-3 bg-[#FBFBFD]"
                  >
                    <div>
                      <div className="font-semibold text-[#1D1D1F]">
                        {tx.type === "repay" ? "To'lov qabul qilindi" : "Nasiya yozildi"}
                        {tx.method ? ` (${tx.method})` : ""}
                      </div>
                      {tx.note && <div className="text-[11px] text-[#86868B] mt-0.5">{tx.note}</div>}
                      <div className="text-[10px] font-mono text-[#86868B] mt-0.5">
                        {new Date(tx.date).toLocaleString("uz-UZ")}
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs ${
                        tx.type === "repay" ? "text-emerald-600" : "text-amber-700"
                      }`}
                    >
                      {tx.type === "repay" ? "-" : "+"}
                      {money(tx.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* YANGI QARZDOR / TA'MINOTCHI QO'SHISH MODALI */}
      {newModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E5E5EA] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] px-5 py-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                {kind === "mijoz" ? "Yangi mijoz" : "Yangi ta'minotchi"}
              </h3>
              <button
                type="button"
                onClick={() => setNewModal(false)}
                className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleNewSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">F.I.SH yoki tashkilot nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Jamshidbek Fermer"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3.5 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-[#1D1D1F] block mb-1">Telefon</label>
                  <input
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#1D1D1F] block mb-1">Kredit limiti</label>
                  <input
                    type="text"
                    placeholder="5 000 000"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">Boshlang&apos;ich qarz</label>
                <input
                  type="text"
                  placeholder="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F] font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">Manzil</label>
                <input
                  type="text"
                  placeholder="Tuman, qishloq"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] block mb-1">Izoh (ixtiyoriy)</label>
                <textarea
                  rows={2}
                  placeholder="Olingan mahsulotlar yoki to'lov muddati..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full rounded-xl border border-[#E5E5EA] px-3 py-2 text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewModal(false)}
                  className="flex-1 rounded-full bg-[#F5F5F7] py-2.5 font-medium text-[#1D1D1F] hover:bg-[#E5E5EA] transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-[#1D1D1F] hover:bg-black py-2.5 font-medium text-white transition active:scale-95"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
