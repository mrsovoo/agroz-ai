import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../lib/api';
import { tg } from '../lib/telegram';
import { formatCurrency, formatDate } from '../lib/utils';
import { Product } from '../types';
import { Modal } from '../components/Modal';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar, 
  Hash, 
  Tag, 
  AlertTriangle,
  Scale,
  Wheat,
  Wrench,
  Building2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const { merchant, addToast } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [unit, setUnit] = useState('dona');
  const [stockQuantity, setStockQuantity] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');

  // Business specific fields
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bagWeightKg, setBagWeightKg] = useState<number | ''>('');
  const [variety, setVariety] = useState('');
  const [germinationRate, setGerminationRate] = useState<number | ''>('');
  const [harvestYear, setHarvestYear] = useState<number | ''>('');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>('');
  const [partNumber, setPartNumber] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [minWholesaleQuantity, setMinWholesaleQuantity] = useState<number | ''>('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list();
      setProducts(data);
    } catch (err: any) {
      addToast(err.message || 'Mahsulotlar yuklanmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('');
    setPrice('');
    setCostPrice('');
    setUnit(merchant?.business_type === 'feed' ? 'qop' : 'dona');
    setStockQuantity('');
    setMinStockAlert(5);
    setBarcode('');
    setSku('');
    setBatchNumber('');
    setExpiryDate('');
    setBagWeightKg('');
    setVariety('');
    setGerminationRate('');
    setHarvestYear('');
    setWarrantyMonths('');
    setPartNumber('');
    setWholesalePrice('');
    setMinWholesaleQuantity('');
    setEditingProduct(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category || '');
    setPrice(p.price);
    setCostPrice(p.cost_price || '');
    setUnit(p.unit);
    setStockQuantity(p.stock_quantity);
    setMinStockAlert(p.min_stock_alert || 5);
    setBarcode(p.barcode || '');
    setSku(p.sku || '');
    setBatchNumber(p.batch_number || '');
    setExpiryDate(p.expiry_date ? p.expiry_date.split('T')[0] : '');
    setBagWeightKg(p.bag_weight_kg || '');
    setVariety(p.variety || '');
    setGerminationRate(p.germination_rate_percent || '');
    setHarvestYear(p.harvest_year || '');
    setWarrantyMonths(p.warranty_months || '');
    setPartNumber(p.part_number || '');
    setWholesalePrice(p.wholesale_price || '');
    setMinWholesaleQuantity(p.min_wholesale_quantity || '');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || stockQuantity === '') {
      addToast('Nom, narx va qoldiqni kiritish shart', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name: name.trim(),
        category: category.trim() || undefined,
        price: Number(price),
        cost_price: costPrice !== '' ? Number(costPrice) : undefined,
        unit,
        stock_quantity: Number(stockQuantity),
        min_stock_alert: minStockAlert !== '' ? Number(minStockAlert) : 5,
        barcode: barcode.trim() || undefined,
        sku: sku.trim() || undefined,
        batch_number: batchNumber.trim() || undefined,
        expiry_date: expiryDate || undefined,
        bag_weight_kg: bagWeightKg !== '' ? Number(bagWeightKg) : undefined,
        variety: variety.trim() || undefined,
        germination_rate_percent: germinationRate !== '' ? Number(germinationRate) : undefined,
        harvest_year: harvestYear !== '' ? Number(harvestYear) : undefined,
        warranty_months: warrantyMonths !== '' ? Number(warrantyMonths) : undefined,
        part_number: partNumber.trim() || undefined,
        wholesale_price: wholesalePrice !== '' ? Number(wholesalePrice) : undefined,
        min_wholesale_quantity: minWholesaleQuantity !== '' ? Number(minWholesaleQuantity) : undefined,
      };

      if (editingProduct) {
        await api.products.update(editingProduct.id, payload);
        addToast('Mahsulot ma’lumotlari yangilandi', 'success');
      } else {
        await api.products.create(payload);
        addToast('Yangi mahsulot omborga qo‘shildi', 'success');
      }

      tg.hapticImpact('medium');
      setIsAddModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      addToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Haqiqatan ham ushbu mahsulotni o‘chirmoqchimisiz?')) return;
    try {
      await api.products.delete(id);
      addToast('Mahsulot o‘chirildi', 'success');
      tg.hapticImpact('light');
      fetchProducts();
    } catch (err: any) {
      addToast(err.message || 'O‘chirishda xatolik', 'error');
    }
  };

  const businessType = merchant?.business_type || 'agro_vet';

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.batch_number && p.batch_number.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ombor va Mahsulotlar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mavjud tovarlar qoldig‘i, yangi kirimlar va narxlarni boshqarish
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi tovar qo‘shish</span>
        </button>
      </div>

      {/* Search & Counter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nomi, partiya, kategoriya yoki kod bo‘yicha izlash..."
            className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-600">
          Jami: <span className="text-emerald-700 font-bold">{filtered.length} ta</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Ombor yuklanmoqda...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Mahsulotlar topilmadi</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Omboringizda hali tovarlar yo‘q yoki qidiruv so‘rovingizga mos kelmadi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Tovar nomi</th>
                  <th className="py-3.5 px-4">Kategoriya</th>
                  <th className="py-3.5 px-4">Sotish narxi</th>
                  <th className="py-3.5 px-4">Qoldiq</th>
                  {businessType === 'agro_vet' && (
                    <th className="py-3.5 px-4">Partiya & Muddat</th>
                  )}
                  {businessType === 'feed' && (
                    <th className="py-3.5 px-4">1 qop vazni</th>
                  )}
                  {businessType === 'seeds' && (
                    <th className="py-3.5 px-4">Nav & Unuvchanlik</th>
                  )}
                  {businessType === 'machinery' && (
                    <th className="py-3.5 px-4">Kafolat & Detal</th>
                  )}
                  {businessType === 'warehouse' && (
                    <th className="py-3.5 px-4">Ulgurji narx</th>
                  )}
                  <th className="py-3.5 px-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((product) => {
                  const isLow = product.stock_quantity <= (product.min_stock_alert || 5);
                  const isOut = product.stock_quantity <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {product.name}
                        </div>
                        {product.barcode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {product.barcode}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {product.category || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(product.price)}
                        </span>
                        {product.cost_price && (
                          <div className="text-[10px] text-slate-400">
                            Tannarx: {formatCurrency(product.cost_price)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-700'
                              : isLow
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Tugagan' : `${product.stock_quantity} ${product.unit}`}
                        </span>
                      </td>

                      {/* Business Specific Columns */}
                      {businessType === 'agro_vet' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {product.batch_number && (
                            <div className="font-mono text-[11px]">
                              P: {product.batch_number}
                            </div>
                          )}
                          {product.expiry_date && (
                            <div className="text-amber-700 font-semibold text-[11px]">
                              {formatDate(product.expiry_date)}
                            </div>
                          )}
                          {!product.batch_number && !product.expiry_date && '—'}
                        </td>
                      )}

                      {businessType === 'feed' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {product.bag_weight_kg ? `${product.bag_weight_kg} kg / qop` : '—'}
                        </td>
                      )}

                      {businessType === 'seeds' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {product.variety && <div>Nav: {product.variety}</div>}
                          {product.germination_rate_percent && (
                            <div className="text-emerald-700 font-semibold">
                              Unuvchanlik: {product.germination_rate_percent}%
                            </div>
                          )}
                          {!product.variety && !product.germination_rate_percent && '—'}
                        </td>
                      )}

                      {businessType === 'machinery' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {product.part_number && <div className="font-mono">Kod: {product.part_number}</div>}
                          {product.warranty_months && (
                            <div>Kafolat: {product.warranty_months} oy</div>
                          )}
                          {!product.part_number && !product.warranty_months && '—'}
                        </td>
                      )}

                      {businessType === 'warehouse' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {product.wholesale_price ? (
                            <div>
                              <span className="font-bold text-blue-700">
                                {formatCurrency(product.wholesale_price)}
                              </span>
                              <div className="text-[10px] text-slate-400">
                                min: {product.min_wholesale_quantity} {product.unit}
                              </div>
                            </div>
                          ) : '—'}
                        </td>
                      )}

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="O‘chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi tovar kiritish'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tovar nomi *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Bi-58 insektitsid 1L"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kategoriya
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Masalan: Insektitsidlar, Yem, Urug‘lar..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                O‘lchov birligi *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="dona">dona</option>
                <option value="kg">kg</option>
                <option value="litr">litr</option>
                <option value="qop">qop</option>
                <option value="tonna">tonna</option>
                <option value="metr">metr</option>
                <option value="to‘plam">to‘plam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Sotish narxi (so‘m) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50 000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tannarx (Kirim narxi)
              </label>
              <input
                type="number"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="40 000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ombordagi qoldiq miqdori *
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="100"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kam qolganlik chegarasi
              </label>
              <input
                type="number"
                min="1"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Business Type Specific Fields Banner */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sohaviy parametrlar ({businessType})</span>
            </h4>

            {/* Agro-Vet: Batch number & Expiry date */}
            {businessType === 'agro_vet' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Partiya raqami (Batch)
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="B-2024-098"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Yaroqlilik muddati (Expiry)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Feed: Bag weight in kg */}
            {businessType === 'feed' && (
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1 qopning vazni (kg hisobida)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={bagWeightKg}
                  onChange={(e) => setBagWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Masalan: 50 (1 qop = 50 kg)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Kassada mijozga qopni ochib, kg-lab tortib sotganda narx avtomatik hisoblanishi uchun kerak.
                </p>
              </div>
            )}

            {/* Seeds: Variety, germination rate, harvest year */}
            {businessType === 'seeds' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-lime-50/50 p-3.5 rounded-xl border border-lime-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Urug‘ navi (Variety)
                  </label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="Masalan: Super F1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Unuvchanlik (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={germinationRate}
                    onChange={(e) => setGerminationRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Masalan: 95"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Hosil yili
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max="2030"
                    value={harvestYear}
                    onChange={(e) => setHarvestYear(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2024"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>
            )}

            {/* Machinery: Part number & Warranty */}
            {businessType === 'machinery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-100/50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kafolat muddati (oy)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="12"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Detal / Katalog kodi
                  </label>
                  <input
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder="OEM-7845-TX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Warehouse: Wholesale price & min quantity */}
            {businessType === 'warehouse' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ulgurji narx (so‘m)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Masalan: 45 000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Min. ulgurji miqdor
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={minWholesaleQuantity}
                    onChange={(e) => setMinWholesaleQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Masalan: 10"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saqlanmoqda...' : editingProduct ? 'Yangilash' : 'Saqlash'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

