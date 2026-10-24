import React, { useState, useEffect } from 'react';
import { api, formatUZS } from '../lib/api';
import { Product } from '../types';
import {
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  Layers,
  Image as ImageIcon,
  CheckCircle,
  Filter,
  RefreshCw,
  X,
  FlaskConical
} from 'lucide-react';

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
  const [search, setSearch] = useState<string>(externalSearch);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(isAddModalOpenInitially);

  // Tashqi qidiruv bilan sinxronlash
  useEffect(() => {
    setSearch(externalSearch);
  }, [externalSearch]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (onExternalSearchChange) {
      onExternalSearchChange(val);
    }
  };

  // Yangi mahsulot formasi maydonlari
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('Agro-Vet Dori');
  const [activeIngredient, setActiveIngredient] = useState<string>(''); // Majburiy: Faol modda
  const [batchNumber, setBatchNumber] = useState<string>('');           // Majburiy: Partiya seriyasi
  const [expiryDate, setExpiryDate] = useState<string>('');             // Majburiy: Yaroqlilik muddati
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'); // Majburiy: Rasm
  const [barcode, setBarcode] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('10');
  const [minStock, setMinStock] = useState<string>('5');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts(search, filter);
      setProducts(data.products);
    } catch (err) {
      console.error(err);
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Qat'iy maydonlar tekshiruvi (Agro-Vet 1-Sektor)
    if (!name.trim()) {
      setFormError('Mahsulot nomi kiritilishi shart');
      return;
    }
    if (!activeIngredient.trim()) {
      setFormError('Agro-Vet: Faol moddasi va dozasi (active_ingredient) kiritilishi majburiy!');
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
    if (!imageUrl.trim()) {
      setFormError('Agro-Vet: Mahsulot rasmi yuklanishi qat\'iy majburiy (Required)!');
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError('Sotish narxi to\'g\'ri kiritilishi shart');
      return;
    }

    setFormLoading(true);
    try {
      await api.createProduct({
        name: name.trim(),
        category,
        active_ingredient: activeIngredient.trim(),
        batch_number: batchNumber.trim(),
        expiry_date: expiryDate,
        image_url: imageUrl.trim(),
        barcode: barcode.trim() || undefined,
        price: Number(price),
        cost_price: Number(costPrice) || 0,
        stock: Number(stock) || 0,
        min_stock: Number(minStock) || 5
      });

      setName('');
      setActiveIngredient('');
      setBatchNumber('');
      setExpiryDate('');
      setPrice('');
      setCostPrice('');
      setIsAddModalOpen(false);
      if (onCloseAddModal) onCloseAddModal();
      loadProducts();
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Yuqori Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Agro-Vet Ombori & Dorilar</h2>
          <p className="text-xs text-slate-500 font-medium">Faol modda, seriyalar, partiyalar va muddat nazorati</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-black hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Preparat Qo'shish</span>
        </button>
      </div>

      {/* Qidiruv va Filtr Paneli (Tezkor kassa kabi moslashgan) */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Qidiruv Paneli */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ombordan dori nomi, faol moddasi yoki partiyasi orqali qidirish... (masalan: iver)"
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200/90 rounded-full text-xs focus:ring-2 focus:ring-black shadow-2xs font-medium placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full"
              title="Tozalash"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtr Tugmalari */}
        <div className="flex items-center space-x-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap ${
              filter === ''
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setFilter('expired_or_critical')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap flex items-center space-x-1.5 ${
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
            className={`px-3.5 py-2 text-xs font-semibold rounded-full border transition whitespace-nowrap ${
              filter === 'low_stock'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            Kam qolganlar
          </button>
        </div>
      </div>

      {search && (
        <div className="text-[11px] font-semibold text-slate-500 px-1 flex items-center justify-between">
          <span>
            "{search}" bo'yicha: <strong className="text-slate-900">{products.length} ta</strong> dori topildi
          </span>
        </div>
      )}

      {/* Mahsulotlar Jadvali */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Rasm & Nomi</th>
                <th className="py-3.5 px-4">Faol Moddasi / Dozasi</th>
                <th className="py-3.5 px-4">Partiya</th>
                <th className="py-3.5 px-4">Muddati</th>
                <th className="py-3.5 px-4">Narxi</th>
                <th className="py-3.5 px-4">Qoldiq</th>
                <th className="py-3.5 px-4">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Qidiruv bo'yicha mahsulotlar topilmadi
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
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {p.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                          <FlaskConical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{p.active_ingredient || 'Belgilanmagan'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.batch_number}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-full ${
                            isCritical ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.expiry_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">{formatUZS(p.price)}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{p.stock} dona</td>
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Tugagan
                          </span>
                        ) : isCritical ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
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

      {/* YANGI AGRO-VET MAHSULOT QO'SHISH MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200/90 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Yangi Agro-Vet Preparati</h3>
                <p className="text-[11px] text-slate-500">Rasm, faol modda, partiya va muddat majburiy</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  if (onCloseAddModal) onCloseAddModal();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Preparat / O'g'it Nomi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Oksitetratsiklin 20% LA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Faol moddasi va dozasi (Active Ingredient) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Oxytetracycline dihydrate 200 mg/ml"
                  value={activeIngredient}
                  onChange={(e) => setActiveIngredient(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategoriya</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Agro-Vet Dori">Agro-Vet Dori</option>
                    <option value="Antibiotik (Vet)">Antibiotik (Veterinariya)</option>
                    <option value="Antiparasitik">Antiparasitik</option>
                    <option value="Vitamin & Premiks">Vitamin & Premiks</option>
                    <option value="Mineral O'g'itlar">Mineral O'g'itlar</option>
                    <option value="Dezinfeksiya">Dezinfeksiya vositasi</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Partiya / Seriya raqami <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-2026-08"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Yaroqlilik muddati <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shtrix-kod (ixtiyoriy)</label>
                  <input
                    type="text"
                    placeholder="478000..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mahsulot rasmi URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

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
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kirim narxi</label>
                  <input
                    type="number"
                    placeholder="32000"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Boshlang'ich qoldiq</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    if (onCloseAddModal) onCloseAddModal();
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xs transition disabled:opacity-50"
                >
                  {formLoading ? 'Saqlanmoqda...' : 'Omborga Kiritish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
