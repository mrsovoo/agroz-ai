"use client";

import { useState } from "react";
import {
  HandCoins,
  Plus,
  Users,
  Truck,
  Search,
  Phone,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { fmt, money } from "@/lib/format";

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
};

const INITIAL_DEBTS: PartnerDebt[] = [
  {
    id: 1,
    name: "Rustam aka Fermer",
    phone: "+998 90 987 65 43",
    address: "Quva tumani, Dehqonobod MFY",
    kind: "mijoz",
    balance: 1450000,
    creditLimit: 5000000,
    lastDate: "2026-10-10",
    note: "BENTO MAX va Bi-58 olib ketgan, 20-oktabrgacha to'laydi",
  },
  {
    id: 2,
    name: "Akmaljon Chorvador",
    phone: "+998 93 456 12 34",
    address: "Oltiariq tumani, Yangiobod",
    kind: "mijoz",
    balance: 850000,
    creditLimit: 3000000,
    lastDate: "2026-10-12",
    note: "Mineral premiks va ozuqa qo'shimchasi",
  },
  {
    id: 3,
    name: "Dilshodbek Bog'bon",
    phone: "+998 91 111 22 33",
    address: "Quvasoy sh., Bog'bon ko'chasi",
    kind: "mijoz",
    balance: 320000,
    creditLimit: 2000000,
    lastDate: "2026-10-08",
  },
  {
    id: 4,
    name: "\"Agro Kimyo Ta'minot\" MCHJ",
    phone: "+998 71 200 40 50",
    address: "Toshkent sh., Chilonzor 24",
    kind: "taminotchi",
    balance: 4200000,
    creditLimit: 15000000,
    lastDate: "2026-10-05",
    note: "Partiya №402 o'g'it va stimulyatorlar keltirilgan",
  },
  {
    id: 5,
    name: "\"Bentonit Mineral Sanoat\"",
    phone: "+998 79 222 11 00",
    address: "Navoiy vil., Karmana",
    kind: "taminotchi",
    balance: 1800000,
    creditLimit: 10000000,
    lastDate: "2026-10-09",
    note: "BENTO MAX 2 tonna yetkazib berildi",
  },
];

export default function QarzDaftariSection() {
  const [debts, setDebts] = useState<PartnerDebt[]>(INITIAL_DEBTS);
  const [kind, setKind] = useState<"mijoz" | "taminotchi">("mijoz");
  const [search, setSearch] = useState("");
  const [repayModal, setRepayModal] = useState<PartnerDebt | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"naqd" | "karta" | "otkazma">("naqd");
  const [newModal, setNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [newNote, setNewNote] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = debts.filter(
    (d) =>
      d.kind === kind &&
      (d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.phone.includes(search) ||
        d.address.toLowerCase().includes(search.toLowerCase()))
  );

  const totalDebt = filtered.reduce((acc, d) => acc + d.balance, 0);
  const activeCount = filtered.filter((d) => d.balance > 0).length;

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModal) return;
    const amount = Number(repayAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) return;

    setDebts((prev) =>
      prev.map((d) => (d.id === repayModal.id ? { ...d, balance: Math.max(0, d.balance - amount) } : d))
    );
    showToast(`To'lov qabul qilindi: ${fmt(amount)} so'm (${repayModal.name})`);
    setRepayModal(null);
    setRepayAmount("");
  };

  const handleNewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newRecord: PartnerDebt = {
      id: Date.now(),
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      kind,
      balance: Number(newBalance.replace(/\D/g, "")) || 0,
      creditLimit: Number(newLimit.replace(/\D/g, "")) || 5000000,
      lastDate: new Date().toISOString().slice(0, 10),
      note: newNote.trim(),
    };

    setDebts((prev) => [newRecord, ...prev]);
    showToast(`${kind === "mijoz" ? "Mijoz" : "Ta'minotchi"} muvaffaqiyatli qo'shildi`);
    setNewModal(false);
    setNewName("");
    setNewPhone("");
    setNewAddress("");
    setNewBalance("");
    setNewLimit("");
    setNewNote("");
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
            Mijozlar nasiyasi va ta&apos;minotchilar hisob-kitobi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1D1D1F] hover:bg-black text-white px-4 py-2 text-xs font-medium active:scale-95 transition"
        >
          <Plus size={15} />
          <span>{kind === "mijoz" ? "Mijoz qo'shish" : "Ta'minotchi qo'shish"}</span>
        </button>
      </div>

      {/* KPI Kartochkalari (Apple-style minimal oq kartalar) */}
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
            <span>Qarzdorlar soni</span>
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
          <p className="mt-2 text-2xl font-semibold font-mono text-[#1D1D1F]">Normada</p>
          <p className="mt-1 text-[11px] text-[#86868B]">Limitdan oshmagan</p>
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
            placeholder="Qidirish (ism, telefon)..."
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
          <p className="text-xs font-medium text-[#1D1D1F]">Yozuvlar topilmadi</p>
          <p className="text-[11px] text-[#86868B] mt-0.5">Yangi mijoz yoki ta&apos;minotchi qo&apos;shishingiz mumkin</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFBFD] border-b border-[#E5E5EA] text-[#86868B] font-medium text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">F.I.SH / Tashkilot</th>
                  <th className="px-4 py-3">Telefon & Manzil</th>
                  <th className="px-4 py-3">Qarz</th>
                  <th className="px-4 py-3">Limit</th>
                  <th className="px-4 py-3">Sana</th>
                  <th className="px-5 py-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F7] font-normal">
                {filtered.map((d) => {
                  const limitPct = d.creditLimit > 0 ? Math.min(100, (d.balance / d.creditLimit) * 100) : 0;
                  return (
                    <tr key={d.id} className="hover:bg-[#F5F5F7]/50 transition">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#1D1D1F] text-xs">{d.name}</div>
                        {d.note && <div className="text-[10px] text-[#86868B] mt-0.5 max-w-xs truncate">{d.note}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[#1D1D1F] text-[11px]">{d.phone || "—"}</div>
                        <div className="text-[10px] text-[#86868B] truncate max-w-[180px]">{d.address || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono font-medium text-xs text-[#1D1D1F]">
                          {money(d.balance)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#1D1D1F]"
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
                        <button
                          type="button"
                          onClick={() => {
                            setRepayModal(d);
                            setRepayAmount(d.balance ? String(d.balance) : "");
                          }}
                          className="rounded-full border border-[#E5E5EA] hover:border-[#1D1D1F] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] px-3 py-1 font-medium text-xs transition"
                        >
                          To&apos;lov
                        </button>
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
                <span className="text-[#86868B]">Qarz balansi:</span>
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
                  placeholder="Eslatma..."
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

