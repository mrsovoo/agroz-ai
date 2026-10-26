import React, { useState } from 'react';
import {
  Search,
  Plus,
  PackageCheck,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Wrench,
  Sparkles,
  FileText,
  Boxes,
  Truck,
  ArrowUpRight,
  Check,
  X,
  Filter,
} from 'lucide-react';
import { useApp } from '../../app/providers/AppContext';
import { ItemIcon } from '../../shared/components/ItemIcon';
import { telegramHaptic } from '../../core/platform/telegram';

interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  cost: number;
  iconType: string;
  sectorBadge: string;
  batch?: string;
  expiry?: string;
  openedKg?: number;
  germination?: string;
  rollMeters?: number;
  serial?: string;
  warrantyMonths?: number;
}

export const InventoryPage: React.FC = () => {
  const { currentSector } = useApp();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'receive'>('products');
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  // Yangi tovar qo'shish modal holati
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('dorixona');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('dona');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCost, setNewProdCost] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdMinStock, setNewProdMinStock] = useState('10');
  const [newProdExpiry, setNewProdExpiry] = useState('');
  const [addProductSuccess, setAddProductSuccess] = useState(false);

  // Tovarlar katalogi (Dinamik holat)
  const [products, setProducts] = useState<InventoryProduct[]>([
    {
      id: '1',
      name: 'Oksitetratsiklin 20% L.A. (100ml)',
      sku: 'VET-001',
      stock: 18,
      minStock: 10,
      unit: 'flakon',
      price: 62000,
      cost: 45000,
      batch: 'B-2024-91',
      expiry: '2027-08',
      iconType: 'pill',
      sectorBadge: 'FEFO Nazorati',
    },
    {
      id: '2',
      name: 'Enrofloksatsin 10% (100ml)',
      sku: 'VET-002',
      stock: 42,
      minStock: 15,
      unit: 'flakon',
      price: 45000,
      cost: 32000,
      batch: 'E-2024-12',
      expiry: '2027-12',
      iconType: 'pill',
      sectorBadge: 'FEFO Nazorati',
    },
    {
      id: '3',
      name: 'Kombikorm Broyler Start (50kg)',
      sku: 'FEED-102',
      stock: 3,
      minStock: 15,
      unit: 'qop',
      price: 290000,
      cost: 250000,
      openedKg: 14,
      iconType: 'wheat',
      sectorBadge: 'Ochilgan: 14 kg',
    },
    {
      id: '4',
      name: 'Pomidor F1 "Bella" urug‘i',
      sku: 'SEED-401',
      stock: 95,
      minStock: 20,
      unit: 'pachka',
      price: 90000,
      cost: 65000,
      germination: '98%',
      iconType: 'sprout',
      sectorBadge: 'Unuvchanlik: 98%',
    },
    {
      id: '5',
      name: 'Issiqxona plyonkasi (120 mkr uch qatlam)',
      sku: 'GH-881',
      stock: 850,
      minStock: 200,
      unit: 'metr',
      price: 10000,
      cost: 7500,
      rollMeters: 500,
      iconType: 'leaf',
      sectorBadge: 'Rulon: 500 metr',
    },
    {
      id: '6',
      name: 'Motoblok TTZ-700 (Dizel 12 ot kuchi)',
      sku: 'MCH-009',
      stock: 2,
      minStock: 1,
      unit: 'dona',
      price: 8500000,
      cost: 7200000,
      serial: 'VIN-994821',
      warrantyMonths: 12,
      iconType: 'tractor',
      sectorBadge: 'VIN Seriya: #994821',
    },
  ]);

  // 3-bosqichli tovar kirimi (yuk taqqoslash: Biz so'ragan vs Invoys vs Amalda kelgan)
  const [reconcileList, setReconcileList] = useState([
    { id: 'r1', name: 'Kombikorm Broyler Start (50kg)', unit: 'qop', ordered: 50, invoiced: 50, received: 50, status: 'match' },
    { id: 'r2', name: 'Oksitetratsiklin 20% L.A. (100ml)', unit: 'flakon', ordered: 30, invoiced: 30, received: 28, status: 'shortage' },
    { id: 'r3', name: 'Tomchilatib sug‘orish lentasi 16mm', unit: 'metr', ordered: 2000, invoiced: 2500, received: 2500, status: 'surplus' },
  ]);

  const updateReceived = (id: string, val: number) => {
    setReconcileList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const rec = Math.max(0, val);
          const status = rec === item.invoiced ? 'match' : rec < item.invoiced ? 'shortage' : 'surplus';
          return { ...item, received: rec, status };
        }
        return item;
      })
    );
  };

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice.trim()) return;

    let iconType = 'package';
    let sectorBadge = 'Standart Tovar';
    if (newProdCategory === 'dorixona') {
      iconType = 'pill';
      sectorBadge = 'FEFO Nazorati';
    } else if (newProdCategory === 'yem') {
      iconType = 'wheat';
      sectorBadge = 'Yem zaxirasi';
    } else if (newProdCategory === 'urug') {
      iconType = 'sprout';
      sectorBadge = 'Unuvchanlik 98%';
    } else if (newProdCategory === 'issiqxona') {
      iconType = 'leaf';
      sectorBadge = 'Issiqxona jihozi';
    } else if (newProdCategory === 'texnika') {
      iconType = 'tractor';
      sectorBadge = 'Kafolatli uskuna';
    }

    const generatedSku = newProdSku.trim() || `AGR-${Math.floor(100000 + Math.random() * 900000)}`;

    const newProduct = {
      id: `prod-${Date.now()}`,
      name: newProdName.trim(),
      sku: generatedSku,
      stock: parseInt(newProdStock.replace(/\D/g, ''), 10) || 0,
      minStock: parseInt(newProdMinStock.replace(/\D/g, ''), 10) || 5,
      unit: newProdUnit,
      price: parseInt(newProdPrice.replace(/\D/g, ''), 10) || 0,
      cost: parseInt(newProdCost.replace(/\D/g, ''), 10) || 0,
      batch: 'B-2026-01',
      expiry: newProdExpiry.trim() || undefined,
      iconType,
      sectorBadge,
    };

    telegramHaptic.success();
    setProducts((prev) => [newProduct, ...prev]);
    setAddProductSuccess(true);
    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice('');
    setNewProdCost('');
    setNewProdStock('');
    setNewProdExpiry('');
    setTimeout(() => {
      setAddProductSuccess(false);
      setAddProductModalOpen(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Sarlavha & Boshqaruv tugmalari */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111215] tracking-tight">
            Mahsulotlar & Ombor Boshqaruvi
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Qoldiqlar hisobi, yaroqlilik muddatlari va 3 bosqichli yuk taqqoslash
          </p>
        </div>

        {/* Tab almashtirish (Barcha tovarlar / 3-bosqichli qabul) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-white p-1 shadow-2xs border-0 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#111215] text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Barcha Tovarlar ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'receive'
                  ? 'bg-[#111215] text-white shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              <Truck className="h-3.5 w-3.5 text-[#35ca56]" />
              <span>3-Bosqichli Qabul</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 ta Ombor Ko'rsatkich Kartalari */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1-Karta (Qora): Jami Ombor Qiymati */}
        <div className="bg-[#111215] text-white rounded-[32px] p-7 flex flex-col justify-between min-h-[175px] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Jami Ombor Qiymati</span>
            <div className="w-8 h-8 rounded-full bg-white text-[#111215] flex items-center justify-center font-bold">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">148.5 mln so‘m</h2>
            <p className="text-[11px] text-slate-400 mt-1">1 248 ta tovar zaxirasi</p>
          </div>
        </div>

        {/* 2-Karta (Kulrang): Kam Qolgan Tovarlar */}
        <div className="bg-[#efefec] text-slate-900 rounded-[32px] p-7 flex flex-col justify-between min-h-[175px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Kam Qolgan Tovarlar</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-rose-600">7 ta tovar</h2>
            <p className="text-[11px] text-slate-500 mt-1">Minimal limitdan kam qoldi (Buyurtma kerak)</p>
          </div>
        </div>

        {/* 3-Karta (Kulrang): Bugungi Kirimlar */}
        <div className="bg-[#efefec] text-slate-900 rounded-[32px] p-7 flex flex-col justify-between min-h-[175px] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Bugungi Yuk Kirimlari</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#111215]">3 ta partiya</h2>
            <p className="text-[11px] text-slate-500 mt-1">Barchasi to‘liq omborga qabul qilingan</p>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* ASOSIY JADVAL BLOKI (TAB BO'YICHA)                        */}
      {/* ======================================================== */}
      {activeTab === 'products' ? (
        <div className="bg-[#efefec] rounded-[32px] p-6 sm:p-7 shadow-2xs space-y-5">
          
          {/* Qidiruv va qo'shish */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Mahsulot nomi yoki artikul (SKU) bo‘yicha qidirish..."
                className="w-full bg-white border border-slate-200/80 rounded-full py-2.5 pl-11 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#35ca56] transition-all"
              />
            </div>

            <button
              onClick={() => setAddProductModalOpen(true)}
              className="bg-[#111215] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Yangi Tovar Qo‘shish</span>
            </button>
          </div>

          {/* Tovarlar Jadvali */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-neutral-400 font-bold uppercase text-[11px] tracking-wider border-b border-neutral-300/40">
                <tr>
                  <th className="py-3 px-3 text-left">Mahsulot Nomi</th>
                  <th className="py-3 px-3 text-center">Artikul (SKU)</th>
                  <th className="py-3 px-3 text-center">Sektor Xususiyati</th>
                  <th className="py-3 px-3 text-center">Ombor Qoldig‘i</th>
                  <th className="py-3 px-3 text-right">Sotuv Narxi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300/30">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-200/40 transition-colors">
                    
                    {/* Mahsulot nomi va ikonkasi */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <ItemIcon type={p.iconType} variant="contained" className="h-4 w-4" />
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-[#111215] leading-tight">{p.name}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{p.expiry ? `Yaroqlilik: ${p.expiry}` : 'Doimiy tovar'}</p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-xs text-neutral-600">
                      {p.sku}
                    </td>

                    {/* Sektorga xos nishon */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white text-[#111215] shadow-2xs border-0">
                        {p.sectorBadge}
                      </span>
                    </td>

                    {/* Qoldiq */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          p.stock <= p.minStock
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </td>

                    {/* Narxi */}
                    <td className="py-3.5 px-3 text-right font-black text-xs sm:text-sm text-[#111215] whitespace-nowrap">
                      {p.price.toLocaleString()} so‘m
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      ) : (
        /* 3-BOSQICHLI YUK TAQQOSLASH (RECONCILIATION) */
        <div className="bg-[#efefec] rounded-[32px] p-6 sm:p-7 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-300/40">
            <div>
              <h3 className="text-base font-extrabold text-[#111215]">
                3-Bosqichli Tovar Kirimi & Yuk Taqqoslash
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                (1) Buyurtma qilingan vs (2) Hamkor hisob-fakturasi (Invoys) vs (3) Omborda amalda sanalgan yuk
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-full">
              Invoys: #INV-2026-9821
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-300/50">
                <tr>
                  <th className="py-3 px-3 text-left">Mahsulot Nomi</th>
                  <th className="py-3 px-3 text-center">1. Buyurtma Qilingan</th>
                  <th className="py-3 px-3 text-center">2. Invoysda Yozilgan</th>
                  <th className="py-3 px-3 text-center">3. Amalda Qabul (Sanalgan)</th>
                  <th className="py-3 px-3 text-right">Taqqos Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/40">
                {reconcileList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-200/40 transition-colors">
                    <td className="py-3.5 px-3 font-extrabold text-sm text-[#111215]">
                      {r.name}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                      {r.ordered} {r.unit}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {r.invoiced} {r.unit}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="number"
                        value={r.received}
                        onChange={(e) => updateReceived(r.id, parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-white border border-slate-300 rounded-xl px-2 py-1 text-center font-black text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#35ca56]"
                      />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {r.status === 'match' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="h-3 w-3" /> Mos keldi (To‘liq)
                        </span>
                      )}
                      {r.status === 'shortage' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          <AlertTriangle className="h-3 w-3" /> {r.invoiced - r.received} ta kam kelgan!
                        </span>
                      )}
                      {r.status === 'surplus' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                          +{r.received - r.ordered} ta ortiqcha
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-slate-300/40 flex justify-end">
            <button
              onClick={() => alert("Yuk muvaffaqiyatli qabul qilindi va qoldiqlar yangilandi!")}
              className="bg-[#111215] hover:bg-black text-white text-xs font-bold px-6 py-3 rounded-2xl flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4 text-[#35ca56]" />
              <span>Qabulni yakunlash va Qoldiqlarga kiritish</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* YANGI TOVAR QO'SHISH MODAL OYNASI (TO'LIQ YO'RIQNOMA BILAN)*/}
      {/* ======================================================== */}
      {addProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] p-6 sm:p-7 max-w-xl w-full shadow-2xl border-0 space-y-5 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Sarlavhasi */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-black text-[#111215]">Yangi Tovar / Dori Kiritish</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Ombor hisobiga yangi mahsulot partiyasini qo‘shish</p>
              </div>
              <button
                onClick={() => setAddProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Qisqa qo'llanma va yo'riqnoma bloki */}
            <div className="bg-[#f7f7f5] p-3.5 rounded-2xl text-xs space-y-1">
              <p className="font-extrabold text-[#111215] flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Qanday to‘g‘ri tovar kiritiladi?</span>
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Tovar nomini to‘liq yozing, toifasini tanlang, sotish va tan narxini belgilang. Qoldiq miqdori avtomatik tarzda kassa (POS) terminali va moliyaviy hisobotlarga qo‘shiladi.
              </p>
            </div>

            {addProductSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 text-[#35ca56]" />
                <span>Mahsulot muvaffaqiyatli omborga qo‘shildi!</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              
              {/* 1. Tovar Nomi */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  1. Tovar / Dori Nomi <span className="text-rose-500">*</span>
                </label>
                <p className="text-[10px] text-neutral-400 mb-1.5">Qadoqdagi to‘liq nom va dozasini yozing</p>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Masalan: Enrofloksatsin 10% (100ml flakon)"
                  className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                />
              </div>

              {/* 2. Sektor / Kategoriya va Artikul (SKU) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    2. Tovar Toifasi / Sohasi <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Qaysi bo‘limga tegishli</p>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-[#f7f7f5] rounded-2xl px-3.5 py-3 font-bold text-xs text-[#111215] border-0 focus:outline-none focus:ring-2 focus:ring-[#111215]/20 cursor-pointer"
                  >
                    <option value="dorixona">Agro & Vet Dorixona</option>
                    <option value="yem">Yem-xashak Ombori</option>
                    <option value="urug">Urug‘ & Ko‘chat</option>
                    <option value="issiqxona">Issiqxona Jihozlari</option>
                    <option value="texnika">Qishloq Xo‘jalik Texnikasi</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-neutral-700">
                      3. Shtrix-kod / Artikul (SKU)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewProdSku(`47800${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Avto-kod
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Skanerlash yoki qidirish kodi</p>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Masalan: 478001209"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-mono font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>
              </div>

              {/* 3. Narxlar (Sotish va Tan narxi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    4. Sotish Narxi (so‘m) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Xaridorga sotiladigan narx</p>
                  <input
                    type="number"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="Masalan: 45 000"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-black text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    5. Tan Narxi (Kirim, so‘m)
                  </label>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Sof foydani hisoblash uchun</p>
                  <input
                    type="number"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    placeholder="Masalan: 32 000"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>
              </div>

              {/* 4. O'lchov birligi, Ombor zaxirasi va Minimal limit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    6. O‘lchov birligi
                  </label>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Sotish birligi</p>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full bg-[#f7f7f5] rounded-2xl px-3 py-3 font-bold text-xs text-[#111215] border-0 focus:outline-none focus:ring-2 focus:ring-[#111215]/20 cursor-pointer"
                  >
                    <option value="dona">dona</option>
                    <option value="flakon">flakon</option>
                    <option value="qop">qop</option>
                    <option value="kg">kg</option>
                    <option value="metr">metr</option>
                    <option value="pachka">pachka</option>
                    <option value="litr">litr</option>
                    <option value="o‘ram">o‘ram</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    7. Dastlabki Miqdor <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Omborda bor soni</p>
                  <input
                    type="number"
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder="40"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    8. Minimal Limit
                  </label>
                  <p className="text-[10px] text-neutral-400 mb-1.5">Ogohlantirish chegarasi</p>
                  <input
                    type="number"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(e.target.value)}
                    placeholder="10"
                    className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0"
                  />
                </div>
              </div>

              {/* 5. Yaroqlilik muddati (FEFO) */}
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  9. Yaroqlilik Muddati (FEFO Nazorati)
                </label>
                <p className="text-[10px] text-neutral-400 mb-1.5">Veterinariya dorilari va urug‘lar uchun amal qilish muddati</p>
                <input
                  type="text"
                  value={newProdExpiry}
                  onChange={(e) => setNewProdExpiry(e.target.value)}
                  placeholder="Masalan: 2027-12 (Yil-Oy)"
                  className="w-full bg-[#f7f7f5] rounded-2xl px-4 py-3 font-bold text-xs text-[#111215] focus:outline-none focus:ring-2 focus:ring-[#111215]/20 border-0 font-mono"
                />
              </div>

              {/* Qo'shish tugmasi */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#111215] hover:bg-black text-white font-extrabold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-transform active:scale-95"
                >
                  <Check className="h-4 w-4 text-[#35ca56]" />
                  <span>Tovarni omborga qabul qilish</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};