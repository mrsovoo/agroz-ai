import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  FlaskConical,
  X,
  RefreshCw,
  Pill,
  Layers,
  ShieldAlert,
  AlertOctagon,
  Clock,
  Trash2,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Product } from '../types';
import { api, formatUZS } from '../lib/api';

// 1-Sektor: Agro-Vet Dorixona maxsus standart kategoriyalari va o'lchov birliklari
const AGRO_VET_CATEGORIES = [
  'Antibiotiklar (Vet)',
  'Antiparasitik preparatlar',
  'Premikslar va vitaminlar',
  'Dezinfeksiya vositalari',
  'Insektitsid & Gerbitsid',
  'Mineral o\'g\'itlar',
  'Vaktsinalar & Biopreparatlar',
  'Sarflov & Tibbiy materiallar'
];

const AGRO_VET_UNITS = [
  'dona',
  'flakon',
  'ampula',
  'qadoq',
  'litr',
  'kg',
  'shprits-dozator'
];

interface ProductsViewProps {
  isAddModalOpenInitially?: boolean;
  onCloseAddModal?: () => void;
  externalSearch?: string;
  onExternalSearchChange?: (val: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  isAddModalOpenInitially = false,
  onCloseAddModal,
  externalSearch = '',
  onExternalSearchChange
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>(externalSearch);
  const [filter, setFilter] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // Yangi dori vositasi formasi (1-Sektor Agro-Vet)
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [category, setCategory] = useState<string>(AGRO_VET_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>('flakon');
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('10');
  const [minStock, setMinStock] = useState<string>('5');
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400');

  // Agro-Vet Dori xavfsizligi va partiya maydonlari
  const [activeIngredient, setActiveIngredient] = useState<string>('');
  const [dosageForm, setDosageForm] = useState<string>('Ineksiya eritmasi');
  const [storageCondition, setStorageCondition] = useState<string>('+15..+25°C (Xona haroratida)');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [productionDate, setProductionDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  // Partiyalar & Karantin (Recall / Utilizatsiya) modal holati
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState<boolean>(false);
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [batchActionMsg, setBatchActionMsg] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(search, filter, 'agro_vet');
      setProducts(data.products || []);
    } catch (err) {
      console.error('Products load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, filter]);

  useEffect(() => {
    if (isAddModalOpenInitially) {
      setIsAddModalOpen(true);
    }
  }, [isAddModalOpenInitially]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onExternalSearchChange) onExternalSearchChange(val);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Dori nomi kiritilishi shart');
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError('Sotish narxi to\'g\'ri kiritilishi shart');
      return;
    }
    if (!activeIngredient.trim()) {
      setFormError('Agro-Vet: Faol moddasi va dozasi (active_ingredient) kiritilishi majburiy!');
      return;
    }
    if (!dosageForm.trim()) {
      setFormError('Agro-Vet: Doza shakli (dosage_form) tanlanishi majburiy!');
      return;
    }
    if (!storageCondition.trim()) {
      setFormError('Agro-Vet: Saqlash sharti (storage_condition) tanlanishi majburiy!');
      return;
    }
    if (!batchNumber.trim()) {
      setFormError('Agro-Vet: Partiya yoki seriya raqami kiritilishi majburiy!');
      return;
    }
    if (!expiryDate) {
      setFormError('Agro-Vet: Yaroqlilik muddati kiritilishi majburiy!');
      return;
    }

    setFormLoading(true);
    try {
      await api.createProduct({
        name: name.trim(),
        sku: sku || undefined,
        barcode: barcode || undefined,
        category,
        unit,
        sector_type: 'agro_vet',
        active_ingredient: activeIngredient.trim(),
        dosage_form: dosageForm.trim(),
        storage_condition: storageCondition.trim(),
        batch_number: batchNumber.trim(),
        production_date: productionDate || undefined,
        expiry_date: expiryDate,
        image_url: imageUrl,
        price: Number(price),
        cost_price: Number(costPrice) || 0,
        stock: Number(stock) || 0,
        min_stock: Number(minStock) || 5
      });

      setIsAddModalOpen(false);
      if (onCloseAddModal) onCloseAddModal();
      setName('');
      setActiveIngredient('');
      setBatchNumber('');
      setProductionDate('');
      setExpiryDate('');
      setPrice('');
      setCostPrice('');
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi');
    } finally {
      setFormLoading(false);
    }
  };

  const loadBatches = async (f?: string) => {
    setBatchesLoading(true);
    try {
      const data = await api.getBatches(f !== undefined ? f : batchFilter);
      setBatches(data.batches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBatchesLoading(false);
    }
  };

  const handleOpenBatchModal = () => {
    setIsBatchModalOpen(true);
    setBatchActionMsg(null);
    loadBatches();
  };

  const handleRecallBatch = async (batchId: string, batchNum: string) => {
    const reason = window.prompt(`[${batchNum}] partiyani karantinga (recall) olish sababini kiriting (masalan: ishlab chiqaruvchi talabi / nuqson):`);
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.recallBatch({ batch_id: batchId, recall_reason: reason.trim() });
      setBatchActionMsg(`✅ ${res.message} Sotilgan cheklar: ${res.affected_sales_count} ta.`);
      loadBatches();
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Recall xatosi');
    }
  };

  const handleDisposeBatch = async (batchId: string, batchNum: string, currentQty: number) => {
    const qtyStr = window.prompt(`[${batchNum}] partiyadan qancha miqdor utilizatsiya qilinadi? (Mavjud: ${currentQty}):`, String(currentQty));
    if (!qtyStr) return;
    const qty = Number(qtyStr);
    if (!qty || qty <= 0 || qty > currentQty) {
      alert('Yaroqsiz miqdor kiritildi');
      return;
    }
    const reason = window.prompt('Utilizatsiya sababi (muddati o\'tgan, shikastlangan, sifati buzilgan):', 'Yaroqlilik muddati o\'tgan');
    if (!reason) return;
    const protocol = window.prompt('Rasmiy dalolatnoma (akt) raqami:', `AKT-${Date.now().toString().slice(-4)}`);

    try {
      const res = await api.disposeStock({
        batch_id: batchId,
        quantity: qty,
        reason: reason.trim(),
        protocol_number: protocol || undefined
      });
      setBatchActionMsg(`✅ ${res.message}. Zarar miqdori: ${formatUZS(res.loss_amount)}`);
      loadBatches();
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Utilizatsiya xatosi');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Yuqori Panel: Sarlavha va Yangi Qo'shish Tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Ombor & Dori Vositalari</h2>
          <p className="text-xs text-slate-400 mt-0.5">Agro-Vet dorixona dori vositalari, preparatlar va qoldiqlar nazorati</p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleOpenBatchModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-full font-bold text-xs shadow-2xs transition cursor-pointer active:scale-95"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Partiyalar & Karantin</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-black hover:bg-slate-800 text-white rounded-full font-bold text-xs shadow-md transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Dori Qo'shish</span>
          </button>
        </div>
      </div>

      {/* Qidiruv va Filterlar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Dori nomi, faol modda, partiya yoki shtrix-kod..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-white pl-10 pr-9 py-2.5 rounded-full border border-slate-200/80 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-black shadow-2xs font-medium"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
              filter === ''
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setFilter('expired_or_critical')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
              filter === 'expired_or_critical'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Muddati yaqin (≤30 kun)</span>
          </button>
          <button
            onClick={() => setFilter('low_stock')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap cursor-pointer ${
              filter === 'low_stock'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Kam qolganlar
          </button>
        </div>
      </div>

      {/* Mahsulotlar Jadvali */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Rasm & Dori Nomi</th>
                <th className="py-3.5 px-4">Faol Modda & Shakli</th>
                <th className="py-3.5 px-4">Birlik</th>
                <th className="py-3.5 px-4">Partiya / Seriya</th>
                <th className="py-3.5 px-4">Narxi</th>
                <th className="py-3.5 px-4">Qoldiq</th>
                <th className="py-3.5 px-4">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    {loading ? 'Yuklanmoqda...' : 'Dorilar katalogida hozircha ma\'lumot mavjud emas'}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isCritical = p.expiry_status === 'critical' || p.expiry_status === 'expired';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200/60 shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{p.name}</div>
                            <span className="text-[10px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          {p.active_ingredient || '—'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {[p.dosage_form, p.storage_condition].filter(Boolean).join(' • ') || 'Veterinariya preparati'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{p.unit || 'flakon'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {p.batch_number || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">{formatUZS(p.price)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.stock} {p.unit || 'flakon'}</td>
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Tugagan
                          </span>
                        ) : isCritical ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Xavf (≤30 kun)
                          </span>
                        ) : p.stock <= p.min_stock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Kam qolgan
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Yetarli
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* YANGI DORI QO'SHISH MODALI (Agro-Vet Dorixona) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Yangi Dori Vositasi Qo'shish</h3>
                <p className="text-[11px] text-slate-500">Agro-Vet dorixona preparatlari va partiyalar kartochkasi</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  if (onCloseAddModal) onCloseAddModal();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              {/* Mahsulot Nomi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dori Nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Oksitetratsiklin 20% L.A., Ivermektin 1%, Amoksitsillin..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Kategoriya va O'lchov Birligi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategoriya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {AGRO_VET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">O'lchov Birligi</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {AGRO_VET_UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agro-Vet Xavfsizlik Maydonlari */}
              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="text-[11px] font-bold text-emerald-950 flex items-center space-x-1.5 border-b border-emerald-100 pb-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  <span>Dori Xavfsizligi va Saqlash Talablari (Majburiy):</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Faol Moddasi & Dozasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Oksitetratsiklin 200 mg/ml, Ivermektin 10 mg/ml"
                    value={activeIngredient}
                    onChange={(e) => setActiveIngredient(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                {/* Doza shakli va Saqlash sharti */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Doza Shakli *</label>
                    <select
                      value={dosageForm}
                      onChange={(e) => setDosageForm(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="Ineksiya eritmasi">Ineksiya eritmasi (Flakon)</option>
                      <option value="Kukun (Oral)">Kukun (Oral qo'llash)</option>
                      <option value="Tabletka / Bolus">Tabletka / Bolus</option>
                      <option value="Suspenziya">Suspenziya</option>
                      <option value="Emulsiya / Tomchi">Emulsiya / Tomchi</option>
                      <option value="Vaktsina (Biopreparat)">Vaktsina (Biopreparat)</option>
                      <option value="Dezinfektant / Spirtli">Dezinfektant</option>
                      <option value="Boshqa shakl">Boshqa shakl</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Saqlash Sharti *</label>
                    <select
                      value={storageCondition}
                      onChange={(e) => setStorageCondition(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                    >
                      <option value="+2..+8°C (Sovutgichda)">+2..+8°C (Sovutgichda)</option>
                      <option value="+15..+25°C (Xona haroratida)">+15..+25°C (Xona haroratida)</option>
                      <option value="+2..+25°C (Quruq va qorong'i)">+2..+25°C (Quruq va qorong'i)</option>
                      <option value="-18°C (Muzlatgichda)">-18°C (Muzlatgichda)</option>
                    </select>
                  </div>
                </div>

                {/* Partiya, Ishlab chiqarilgan va Yaroqlilik */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Partiya № *</label>
                    <input
                      type="text"
                      required
                      placeholder="OKS-2401"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Ishlab chiqarilgan</label>
                    <input
                      type="date"
                      value={productionDate}
                      onChange={(e) => setProductionDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Yaroqlilik muddati *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Narx va Qoldiqlar */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sotish narxi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="45000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tannarxi</label>
                  <input
                    type="number"
                    placeholder="32000"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dastlabki Qoldiq</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Shtrix kod va Rasm */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shtrix-kod</label>
                  <input
                    type="text"
                    placeholder="478000..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rasm URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white font-bold cursor-pointer transition shadow-md active:scale-95 disabled:opacity-50"
                >
                  {formLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PARTIYALAR, KARANTIN (RECALL) VA UTILIZATSIYA MODALI */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    Partiyalar, Karantin (Recall) & Utilizatsiya
                  </h3>
                  <p className="text-xs text-slate-500">
                    Agro-Vet dorixona partiyalari monitoringi, FEFO nazorati va rasmiy dalolatnoma
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filtrlar va Yangilash */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
              <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                {[
                  { id: '', label: 'Barcha partiyalar' },
                  { id: 'expired', label: '🔴 Muddati o\'tganlar' },
                  { id: 'critical_7', label: '⚡ ≤7 kun qolgan' },
                  { id: 'critical_30', label: '🟡 ≤30 kun qolgan' },
                  { id: 'recalled', label: '⛔ Karantin' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setBatchFilter(f.id);
                      loadBatches(f.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      batchFilter === f.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => loadBatches()}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                title="Yangilash"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Xabar bildirishnomasi */}
            {batchActionMsg && (
              <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center justify-between animate-in fade-in">
                <span>{batchActionMsg}</span>
                <button
                  onClick={() => setBatchActionMsg(null)}
                  className="text-emerald-700 hover:text-emerald-950 font-extrabold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Partiyalar Jadvali */}
            <div className="flex-1 overflow-y-auto p-4">
              {batchesLoading ? (
                <div className="text-center py-16 text-xs text-slate-400">Partiyalar yuklanmoqda...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-16 text-xs text-slate-400">
                  Ushbu filtr bo'yicha partiyalar mavjud emas.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Dori Nomi & Faol Modda</th>
                        <th className="py-3 px-3">Partiya №</th>
                        <th className="py-3 px-3">Yaroqlilik (FEFO)</th>
                        <th className="py-3 px-3">Qoldiq</th>
                        <th className="py-3 px-3">Holati</th>
                        <th className="py-3 px-4 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batches.map((b) => {
                        const isExpired = b.expiry_stage === 'expired';
                        const isCritical7 = b.expiry_stage === 'critical_7';
                        const isCritical30 = b.expiry_stage === 'critical_30';
                        const isRecalled = b.is_recalled;

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{b.product_name}</div>
                              <div className="text-[11px] text-slate-500">{b.active_ingredient || b.dosage_form || '—'}</div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">
                              {b.batch_number}
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <div className="font-semibold text-slate-800">{b.expiry_date}</div>
                              <div className={`text-[10px] font-bold ${
                                isExpired ? 'text-red-600' : isCritical7 ? 'text-amber-600' : 'text-slate-500'
                              }`}>
                                {isExpired ? 'Muddati o\'tgan!' : `${b.days_to_expiry} kun qoldi`}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              {b.quantity} dona
                            </td>
                            <td className="py-3 px-3">
                              {isRecalled ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                                  Karantin
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                                  Bloklangan (Muddati o'tgan)
                                </span>
                              ) : isCritical7 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  ≤7 kun (Shoshilinch)
                                </span>
                              ) : isCritical30 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  ≤30 kun (FEFO)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Yaroqli
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {!isRecalled && (
                                <button
                                  onClick={() => handleRecallBatch(b.id, b.batch_number)}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-purple-300 text-purple-800 hover:bg-purple-50 transition cursor-pointer"
                                  title="Partiyani karantinga olish va sotilgan cheklarni chiqarish"
                                >
                                  Karantin
                                </button>
                              )}
                              <button
                                onClick={() => handleDisposeBatch(b.id, b.batch_number, b.quantity)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-red-300 text-red-800 hover:bg-red-50 transition cursor-pointer"
                                title="Yaroqsiz dorini akt bilan utilizatsiya qilish"
                              >
                                Utilizatsiya
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition cursor-pointer"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
