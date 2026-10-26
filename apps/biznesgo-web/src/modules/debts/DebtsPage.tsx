import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Send,
  BookOpenCheck,
  CreditCard,
  X,
  Check,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { ItemIcon } from '../../shared/components/ItemIcon';
import { telegramHaptic } from '../../core/platform/telegram';

interface CustomerDebt {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  limit: number;
  dueDate: string;
  overdueDays: number;
  lastPaymentDate: string;
  iconType: string;
}

interface SearchProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  iconType: string;
  sku: string;
}

const AVAILABLE_PRODUCTS: SearchProduct[] = [
  // 1. Vet & Agro Dorixona
  { id: 'p1', name: 'Enrofloksatsin 10% (100ml flakon)', category: 'Vet Dorixona', price: 45000, unit: 'flakon', stock: 42, iconType: 'pill', sku: 'VET-001' },
  { id: 'p2', name: 'Oksitetratsiklin 20% L.A. (100ml)', category: 'Vet Dorixona', price: 62000, unit: 'flakon', stock: 18, iconType: 'pill', sku: 'VET-002' },
  { id: 'p3', name: 'Vitamin B-Kompleks (100ml flakon)', category: 'Vet Dorixona', price: 38000, unit: 'flakon', stock: 65, iconType: 'pill', sku: 'VET-003' },
  { id: 'p4', name: 'Ivermektin 1% (50ml inyeksiya)', category: 'Vet Dorixona', price: 55000, unit: 'flakon', stock: 24, iconType: 'pill', sku: 'VET-004' },
  { id: 'p5', name: 'Amoksisillin 15% Suspenziya (100ml)', category: 'Vet Dorixona', price: 75000, unit: 'flakon', stock: 15, iconType: 'pill', sku: 'VET-005' },
  { id: 'p6', name: 'Biostimulyator Gumat Kaliy (1 litr)', category: 'Agroximiya', price: 65000, unit: 'litr', stock: 50, iconType: 'sprout', sku: 'AGR-006' },
  { id: 'p7', name: 'Tilmikozin 25% (240ml eritma)', category: 'Vet Dorixona', price: 120000, unit: 'flakon', stock: 12, iconType: 'pill', sku: 'VET-007' },
  { id: 'p8', name: 'Levamizol 10% (100ml)', category: 'Vet Dorixona', price: 32000, unit: 'flakon', stock: 30, iconType: 'pill', sku: 'VET-008' },
  { id: 'p9', name: 'Kalsiy Boroglyukonat 20% (200ml)', category: 'Vet Dorixona', price: 28000, unit: 'flakon', stock: 40, iconType: 'pill', sku: 'VET-009' },
  { id: 'p10', name: 'Nitoks Forte (100ml)', category: 'Vet Dorixona', price: 58000, unit: 'flakon', stock: 22, iconType: 'pill', sku: 'VET-010' },

  // 2. Yem-xashak
  { id: 'p11', name: 'Kombikorm Broyler Start (50 kg qop)', category: 'Yem-xashak', price: 290000, unit: 'qop', stock: 28, iconType: 'wheat', sku: 'FEED-101' },
  { id: 'p12', name: 'Premiks Parranda 1% (25 kg qop)', category: 'Yem-xashak', price: 420000, unit: 'qop', stock: 12, iconType: 'wheat', sku: 'FEED-102' },
  { id: 'p13', name: 'Baliq uni (Protein 65%, 40 kg)', category: 'Yem-xashak', price: 580000, unit: 'qop', stock: 8, iconType: 'wheat', sku: 'FEED-103' },
  { id: 'p14', name: 'Makka yormasi (50 kg qop)', category: 'Yem-xashak', price: 195000, unit: 'qop', stock: 45, iconType: 'wheat', sku: 'FEED-104' },
  { id: 'p15', name: 'Kombikorm Qoramol Sut (50 kg qop)', category: 'Yem-xashak', price: 240000, unit: 'qop', stock: 20, iconType: 'wheat', sku: 'FEED-105' },

  // 3. Urug'lar
  { id: 'p16', name: 'Pomidor "Bella" F1 urug‘i (1000 dona)', category: 'Urug‘lar', price: 90000, unit: 'pachka', stock: 95, iconType: 'sprout', sku: 'SEED-201' },
  { id: 'p17', name: 'Bodring "Orzu" F1 urug‘i (500 dona)', category: 'Urug‘lar', price: 65000, unit: 'pachka', stock: 110, iconType: 'sprout', sku: 'SEED-202' },
  { id: 'p18', name: 'Baqlajon "Almaz" urug‘i (100 gr)', category: 'Urug‘lar', price: 48000, unit: 'pachka', stock: 40, iconType: 'sprout', sku: 'SEED-203' },
  { id: 'p19', name: 'Qalampir "Achchiq qizil" urug‘i (100 gr)', category: 'Urug‘lar', price: 52000, unit: 'pachka', stock: 35, iconType: 'sprout', sku: 'SEED-204' },

  // 4. Issiqxona
  { id: 'p20', name: 'Tomchilatib sug‘orish lentasi 16mm (1000m)', category: 'Issiqxona', price: 480000, unit: 'o‘ram', stock: 14, iconType: 'leaf', sku: 'GH-301' },
  { id: 'p21', name: 'Issiqxona plyonkasi (120 mkr uch qatlam)', category: 'Issiqxona', price: 10000, unit: 'metr', stock: 850, iconType: 'leaf', sku: 'GH-302' },
  { id: 'p22', name: 'Plyonka qisqichlari (Klipslar, 100 dona)', category: 'Issiqxona', price: 75000, unit: 'paket', stock: 60, iconType: 'leaf', sku: 'GH-303' },

  // 5. Texnika & Moy
  { id: 'p23', name: 'Motoblok moyi 10W-40 (4 litr)', category: 'Texnika moylari', price: 180000, unit: 'kanistr', stock: 22, iconType: 'tractor', sku: 'MCH-401' },
  { id: 'p24', name: 'Dizel motoblok TTZ-700 (12 ot kuchi)', category: 'Texnika', price: 8500000, unit: 'dona', stock: 2, iconType: 'tractor', sku: 'MCH-402' },
];

export const DebtsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<CustomerDebt | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [smsSent, setSmsSent] = useState<string | null>(null);

  // Yangi qarzdor mijoz qo'shish modal holati
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerProduct, setNewCustomerProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductItem, setSelectedProductItem] = useState<SearchProduct | null>(null);
  const [newCustomerDebt, setNewCustomerDebt] = useState('');
  const [newCustomerLimit, setNewCustomerLimit] = useState('3000000');
  const [newCustomerDueDays, setNewCustomerDueDays] = useState('30');
  const [newCustomerSector, setNewCustomerSector] = useState<'leaf' | 'tractor' | 'wheat' | 'user'>('user');
  const [addSuccessMessage, setAddSuccessMessage] = useState(false);

  // Real-time dori va tovar qidiruvi natijalari
  const liveProductResults = newCustomerProduct.trim()
    ? AVAILABLE_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(newCustomerProduct.toLowerCase()) ||
          p.sku.toLowerCase().includes(newCustomerProduct.toLowerCase()) ||
          p.category.toLowerCase().includes(newCustomerProduct.toLowerCase())
      )
    : [];

  const handleSelectProduct = (item: SearchProduct) => {
    setNewCustomerProduct(item.name);
    setSelectedProductItem(item);
    setShowProductDropdown(false);
    // Agar qarz summasi kiritilmagan bo'lsa, tovar narxini avtomatik to'ldirish
    if (!newCustomerDebt || newCustomerDebt === '0') {
      setNewCustomerDebt(item.price.toString());
    }
    // Sohaga qarab ikonkani moslash
    if (item.category.includes('Dorixona')) {
      setNewCustomerSector('user');
    } else if (item.category.includes('Yem')) {
      setNewCustomerSector('wheat');
    } else if (item.category.includes('Issiqxona') || item.category.includes('Urug')) {
      setNewCustomerSector('leaf');
    } else if (item.category.includes('Texnika')) {
      setNewCustomerSector('tractor');
    }
  };

  const [debts, setDebts] = useState<CustomerDebt[]>([
    {
      id: 'd1',
      name: 'Jamshid aka (Issiqxona)',
      phone: '+998 90 234 56 78',
      totalDebt: 850000,
      limit: 3000000,
      dueDate: '2026-10-22',
      overdueDays: 3,
      lastPaymentDate: '2026-10-05',
      iconType: 'leaf',
    },
    {
      id: 'd2',
      name: 'Rustam Karimov (Fermer)',
      phone: '+998 93 456 78 90',
      totalDebt: 2250000,
      limit: 5000000,
      dueDate: '2026-10-25',
      overdueDays: 0,
      lastPaymentDate: '2026-10-18',
      iconType: 'tractor',
    },
    {
      id: 'd3',
      name: 'Bahrom aka (Qibray Yem)',
      phone: '+998 97 789 01 23',
      totalDebt: 1450000,
      limit: 2000000,
      dueDate: '2026-10-28',
      overdueDays: 0,
      lastPaymentDate: '2026-10-10',
      iconType: 'wheat',
    },
    {
      id: 'd4',
      name: 'Dilshodbek Toshmatov',
      phone: '+998 91 112 33 44',
      totalDebt: 680000,
      limit: 4000000,
      dueDate: '2026-10-30',
      overdueDays: 0,
      lastPaymentDate: '2026-09-28',
      iconType: 'user',
    },
  ]);

  const handlePay = () => {
    if (!selectedDebt || !payAmount) return;
    telegramHaptic.success();
    const amount = parseInt(payAmount, 10);
    setDebts((prev) =>
      prev.map((d) => (d.id === selectedDebt.id ? { ...d, totalDebt: Math.max(0, d.totalDebt - amount) } : d))
    );
    setPayModalOpen(false);
    setPayAmount('');
  };

  const sendSmsReminder = (debt: CustomerDebt) => {
    telegramHaptic.light();
    setSmsSent(debt.id);
    setTimeout(() => setSmsSent(null), 3000);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newCustomerPhone.trim() || !newCustomerDebt.trim()) return;

    telegramHaptic.success();

    const debtAmt = parseInt(newCustomerDebt.replace(/\D/g, ''), 10) || 0;
    const limitAmt = parseInt(newCustomerLimit.replace(/\D/g, ''), 10) || 3000000;
    const days = parseInt(newCustomerDueDays, 10) || 30;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const dueDateStr = targetDate.toISOString().slice(0, 10);

    const displayName = newCustomerProduct.trim()
      ? `${newCustomerName.trim()} (${newCustomerProduct.trim()})`
      : newCustomerName.trim();

    const newEntry: CustomerDebt = {
      id: `d-${Date.now()}`,
      name: displayName,
      phone: newCustomerPhone.startsWith('+998') ? newCustomerPhone : `+998 ${newCustomerPhone}`,
      totalDebt: debtAmt,
      limit: limitAmt,
      dueDate: dueDateStr,
      overdueDays: 0,
      lastPaymentDate: new Date().toISOString().slice(0, 10),
      iconType: newCustomerSector,
    };

    setDebts((prev) => [newEntry, ...prev]);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewCustomerProduct('');
    setSelectedProductItem(null);
    setShowProductDropdown(false);
    setNewCustomerDebt('');
    setAddSuccessMessage(true);
    setTimeout(() => {
      setAddSuccessMessage(false);
      setNewCustomerModalOpen(false);
    }, 1000);
  };

  const filteredDebts = debts.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)
  );

  const totalOutstanding = debts.reduce((s, d) => s + d.totalDebt, 0);
  const totalOverdue = debts.filter((d) => d.overdueDays > 0).reduce((s, d) => s + d.totalDebt, 0);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111215] tracking-tight">
            Qarz Daftari & Nasiyalar Nazorati
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Mijozlar limiti, to‘lov muddatlari va bir zumda to‘lov kiritish
          </p>
        </div>

        <button
          onClick={() => setNewCustomerModalOpen(true)}
          className="bg-[#111215] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Yangi Mijoz Qo‘shish</span>
        </button>
      </div>

      {/* 3 ta Karta (Referens uslubida) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1-Karta (Qora): Jami Nasiya */}
        <div className="bg-[#111215] text-white rounded-[32px] p-7 flex flex-col justify-between min-h-[175px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Jami Nasiya Balansi</span>
            <div className="w-8 h-8 rounded-full bg-white text-[#111215] flex items-center justify-center font-bold">
              <BookOpenCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {totalOutstanding.toLocaleString()} so‘m
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">{debts.length} nafar mijoz hisobida</p>
          </div>
        </div>

        {/* 2-Karta (Kulrang): Kechikkan Qarz */}
        <div className="bg-[#efefec] text-slate-900 rounded-[32px] p-7 flex flex-col justify-between min-h-[175px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Muddati O‘tgan Qarzlar</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-rose-600">
              {totalOverdue.toLocaleString()} so‘m
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">To‘lov muddati buzilgan</p>
          </div>
        </div>

        {/* 3-Karta (Kulrang): O‘rtacha Qarz Limiti */}
        <div className="bg-[#efefec] text-slate-900 rounded-[32px] p-7 flex flex-col justify-between min-h-[175px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Qarz Limiti Nazorati</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Check className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111215]">14.0 mln so‘m</h2>
            <p className="text-[11px] text-slate-500 mt-1">Belgilangan umumiy limit</p>
          </div>
        </div>

      </div>

      {/* Asosiy Qarzdorlar Ro'yxati */}
      <div className="bg-[#efefec] rounded-[32px] p-6 sm:p-7 shadow-2xs space-y-5">
        
        {/* Qidiruv input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki telefon raqami bo‘yicha qidirish..."
              className="w-full bg-white border border-slate-200/80 rounded-full py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56] transition-all"
            />
          </div>

          <div className="text-xs font-bold text-slate-500">
            Topildi: <b className="text-slate-900">{filteredDebts.length} nafar mijoz</b>
          </div>
        </div>

        {/* Jadval */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-neutral-400 font-bold uppercase text-[11px] tracking-wider border-b border-neutral-300/40">
              <tr>
                <th className="py-3 px-3 text-left">Mijoz Ismi & Telefon</th>
                <th className="py-3 px-3 text-center">Belgilangan Limit</th>
                <th className="py-3 px-3 text-center">To‘lov Muddati</th>
                <th className="py-3 px-3 text-right">Qarz Miqdori</th>
                <th className="py-3 px-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-300/30">
              {filteredDebts.map((d) => (
                <tr key={d.id} className="hover:bg-neutral-200/40 transition-colors">
                  
                  {/* Ism va telefon */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <ItemIcon type={d.iconType} variant="contained" className="h-5 w-5" containerClassName="!w-10 !h-10" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-[#111215] leading-tight">{d.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5 font-mono">{d.phone}</p>
                      </div>
                    </div>
                  </td>

                  {/* Limit */}
                  <td className="py-3.5 px-3 text-center font-bold text-xs text-neutral-700">
                    {d.limit.toLocaleString()} so‘m
                  </td>

                  {/* To'lov muddati */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {d.overdueDays > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                        <span>{d.overdueDays} kun kechikkan!</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {d.dueDate}
                      </span>
                    )}
                  </td>

                  {/* Qarz miqdori */}
                  <td className="py-3.5 px-3 text-right font-black text-xs sm:text-sm text-[#111215] whitespace-nowrap">
                    {d.totalDebt.toLocaleString()} so‘m
                  </td>

                  {/* Amallar: To'lov qabul qilish va SMS eslatma */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedDebt(d);
                          setPayAmount(d.totalDebt.toString());
                          setPayModalOpen(true);
                        }}
                        className="bg-[#111215] hover:bg-[#35ca56] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        To‘lov olish
                      </button>

                      <button
                        onClick={() => sendSmsReminder(d)}
                        title="SMS Eslatma yuborish"
                        className="p-1.5 rounded-xl bg-white text-slate-600 hover:text-emerald-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer border-0"
                      >
                        {smsSent === d.id ? (
                          <span className="text-[10px] font-bold text-emerald-600 px-1 inline-flex items-center gap-1">
                            <span>Yuborildi</span>
                            <Check className="h-3 w-3 text-emerald-600" />
                          </span>
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* ======================================================== */}
      {/* TO'LOV QABUL QILISH MODAL OYNASI                          */}
      {/* ======================================================== */}
      {payModalOpen && selectedDebt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-md w-full shadow-2xl border-0 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-[#111215]">Qarz to‘lovini qabul qilish</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#f7f7f5] p-4 rounded-2xl space-y-1">
              <p className="font-extrabold text-sm text-[#111215]">{selectedDebt.name}</p>
              <p className="text-xs text-slate-500 font-mono">{selectedDebt.phone}</p>
              <p className="text-xs text-slate-700 pt-1">
                Jami mavjud qarz: <b className="text-rose-600 font-black">{selectedDebt.totalDebt.toLocaleString()} so‘m</b>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Qabul qilinayotgan summa (so‘m)</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="To‘lov summasini kiriting..."
                className="w-full bg-[#f7f7f5] border border-slate-200 rounded-2xl py-3 px-4 text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56]"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPayAmount(selectedDebt.totalDebt.toString())}
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold text-slate-700"
              >
                Qarzni to‘liq yopish
              </button>
              <button
                onClick={() => setPayAmount((Math.floor(selectedDebt.totalDebt / 2)).toString())}
                className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold text-slate-700"
              >
                50% to‘lov
              </button>
            </div>

            <button
              onClick={handlePay}
              className="w-full bg-[#111215] hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4 text-[#35ca56]" />
              <span>To‘lovni kassaga kiritish</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* YANGI QARZDOR MIJOZ QO'SHISH MODAL OYNASI               */}
      {/* ======================================================== */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-lg w-full shadow-2xl border-0 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-black text-[#111215]">Yangi Qarzdor Mijoz Qo‘shish</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Qarz daftari ro‘yxatiga yangi nasiya kiritish</p>
              </div>
              <button
                onClick={() => setNewCustomerModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-[#35ca56]" />
                <span>Yangi qarzdor muvaffaqiyatli ro‘yxatga qo‘shildi!</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              {/* 1. Ism */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Qarzdor F.I.Sh / Ismi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Masalan: Jamshid aka (Issiqxona)"
                  className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                />
              </div>

              {/* 2. Telefon raqami */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1.5">
                  Telefon raqami <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center gap-1.5 text-xs font-bold text-neutral-700 pointer-events-none font-mono">
                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                    <span>+998</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone.replace(/^\+998\s?/, '')}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="90 123 45 67"
                    className="w-full bg-[#f7f7f5] rounded-2xl py-3 pl-20 pr-4 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0 font-mono"
                  />
                </div>
              </div>

              {/* 3. Olingan dori / tovar nomi (Real-time Live Qidiruv) */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-neutral-700 text-xs">
                    Olingan dori yoki tovar (agar mavjud bo‘lsa)
                  </label>
                  {newCustomerProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustomerProduct('');
                        setSelectedProductItem(null);
                        setShowProductDropdown(false);
                      }}
                      className="text-[11px] font-bold text-neutral-400 hover:text-neutral-700 cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      <X className="h-3 w-3" /> Tozalash
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={newCustomerProduct}
                    onFocus={() => setShowProductDropdown(true)}
                    onChange={(e) => {
                      setNewCustomerProduct(e.target.value);
                      setShowProductDropdown(true);
                      if (selectedProductItem && e.target.value !== selectedProductItem.name) {
                        setSelectedProductItem(null);
                      }
                    }}
                    placeholder="Dori nomini yozishni boshlang (masalan: Enro, Oksi, Vitamin...)"
                    className="w-full bg-[#f7f7f5] rounded-2xl pl-10 pr-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
                    <Search className="h-4 w-4" />
                  </div>
                </div>

                {/* Tanlangan dori ma'lumoti yorlig'i */}
                {selectedProductItem && (
                  <div className="mt-2 bg-emerald-50 text-emerald-900 rounded-xl px-3 py-2 flex items-center justify-between text-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <ItemIcon type={selectedProductItem.iconType} className="h-3 w-3 text-emerald-700" />
                      </div>
                      <div className="truncate">
                        <span className="font-extrabold text-[#111215]">{selectedProductItem.name}</span>
                        <span className="text-[10px] text-emerald-700 ml-1.5 font-bold">
                          · {selectedProductItem.price.toLocaleString()} so‘m / {selectedProductItem.unit}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                      Omborda: {selectedProductItem.stock} {selectedProductItem.unit}
                    </span>
                  </div>
                )}

                {/* Real-time Live Qidiruv Dropdown Natijalari */}
                {showProductDropdown && newCustomerProduct.trim().length > 0 && !selectedProductItem && (
                  <div className="absolute top-[72px] left-0 right-0 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-neutral-100 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between border-b border-neutral-100 mb-1">
                      <span>Real-time qidiruv natijalari</span>
                      <span>{liveProductResults.length} ta dori topildi</span>
                    </div>

                    {liveProductResults.length > 0 ? (
                      <div className="space-y-1">
                        {liveProductResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectProduct(item)}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#f7f7f5] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ItemIcon type={item.iconType} variant="badge" className="h-3.5 w-3.5" />
                              <div className="min-w-0">
                                <p className="text-xs font-black text-[#111215] truncate group-hover:text-[#35ca56] transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-neutral-400 font-semibold truncate">
                                  {item.category} · {item.sku}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-black text-[#111215]">
                                {item.price.toLocaleString()} so‘m
                              </p>
                              <p className="text-[10px] font-bold text-neutral-400">
                                Qoldiq: {item.stock} {item.unit}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center">
                        <p className="text-xs font-bold text-neutral-600">
                          «{newCustomerProduct}» nomli dori katalogda topilmadi
                        </p>
                        <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                          Kiritilgan nom yangi qarzdor hisobida erkin matn sifatida saqlanadi
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Dori bo'lmasa oldingi qarzlari yoki qarz summasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">
                    Qarz summasi (so‘m) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newCustomerDebt}
                    onChange={(e) => setNewCustomerDebt(e.target.value)}
                    placeholder="Masalan: 850 000"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-black text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">
                    Qarz limiti (so‘m)
                  </label>
                  <input
                    type="number"
                    value={newCustomerLimit}
                    onChange={(e) => setNewCustomerLimit(e.target.value)}
                    placeholder="3 000 000"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>
              </div>

              {/* 5. To'lov muddati va Soha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">
                    Qaytarish muddati
                  </label>
                  <select
                    value={newCustomerDueDays}
                    onChange={(e) => setNewCustomerDueDays(e.target.value)}
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] border-0 focus:outline-none focus:ring-2 focus:ring-[#111215]/20 cursor-pointer"
                  >
                    <option value="15">15 kun</option>
                    <option value="30">30 kun (1 oy)</option>
                    <option value="45">45 kun</option>
                    <option value="60">60 kun (2 oy)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1.5">
                    Mijoz faoliyat sohasi
                  </label>
                  <select
                    value={newCustomerSector}
                    onChange={(e) => setNewCustomerSector(e.target.value as any)}
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] border-0 focus:outline-none focus:ring-2 focus:ring-[#111215]/20 cursor-pointer"
                  >
                    <option value="user">Oddiy mijoz / Fermer</option>
                    <option value="leaf">Issiqxona xo‘jaligi</option>
                    <option value="tractor">Qishloq xo‘jalik texnikasi</option>
                    <option value="wheat">Parrandachilik / Yem</option>
                  </select>
                </div>
              </div>

              {/* Saqlash tugmasi */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#111215] hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  <Check className="h-4 w-4 text-[#35ca56]" />
                  <span>Qarzdorni ro‘yxatga kiritish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};