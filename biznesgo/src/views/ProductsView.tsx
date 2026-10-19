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
  Edit3, 
  Trash2, 
  Calendar, 
  Hash, 
  AlertTriangle,
  Scale,
  Wheat,
  Wrench,
  Building2,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
  Layers,
  Sprout,
  Camera,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';
import { SECTOR_CATEGORIES } from '../constants/categories';
import { compressImage } from '../lib/imageCompressor';

export const ProductsView: React.FC = () => {
  const { merchant, addToast } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states - General
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [unit, setUnit] = useState('dona');
  const [stockQuantity, setStockQuantity] = useState<number | ''>('');
  const [minStockAlert, setMinStockAlert] = useState<number | ''>(5);
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  // Sector Specific Fields
  // 1. Agro-Vet
  const [expiryDate, setExpiryDate] = useState('');

  // 2. Feed
  const [bagWeightKg, setBagWeightKg] = useState<number | ''>('');

  // 3. Warehouse
  const [wholesalePrice, setWholesalePrice] = useState<number | ''>('');
  const [minWholesaleQuantity, setMinWholesaleQuantity] = useState<number | ''>('');
  const [packagingType, setPackagingType] = useState('');

  // 4. Seeds
  const [variety, setVariety] = useState('');
  const [germinationRate, setGerminationRate] = useState<number | ''>('');
  const [harvestYear, setHarvestYear] = useState<number | ''>('');
  const [ripeningPeriod, setRipeningPeriod] = useState('');

  // 5. Machinery
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState<number | ''>('');
  const [partNumber, setPartNumber] = useState('');

  const businessType = merchant?.business_type || 'agro_vet';

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
    setUnit(businessType === 'feed' ? 'qop' : 'dona');
    setStockQuantity('');
    setMinStockAlert(5);
    setSku('');
    setImageUrl('');

    setExpiryDate('');

    setBagWeightKg(businessType === 'feed' ? 50 : '');

    setWholesalePrice('');
    setMinWholesaleQuantity('');
    setPackagingType('');

    setVariety('');
    setGerminationRate('');
    setHarvestYear(new Date().getFullYear());
    setRipeningPeriod('');

    setSerialNumber('');
    setModel('');
    setWarrantyMonths(businessType === 'machinery' ? 12 : '');
    setPartNumber('');

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
    setSku(p.sku || '');
    setImageUrl(p.image_url || '');

    setExpiryDate(p.expiry_date ? p.expiry_date.split('T')[0] : '');

    setBagWeightKg(p.bag_weight_kg || '');

    setWholesalePrice(p.wholesale_price || '');
    setMinWholesaleQuantity(p.min_wholesale_quantity || p.wholesale_min_qty || '');
    setPackagingType(p.packaging_type || '');

    setVariety(p.variety || '');
    setGerminationRate(p.germination_rate_percent || p.germination_rate || '');
    setHarvestYear(p.harvest_year || '');
    setRipeningPeriod(p.ripening_period || '');

    setSerialNumber(p.serial_number || '');
    setModel(p.model || '');
    setWarrantyMonths(p.warranty_months || '');
    setPartNumber(p.part_number || '');

    setIsAddModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Faqat rasm fayli (JPEG, PNG, WebP) tanlang', 'error');
      return;
    }

    try {
      setIsCompressingImage(true);
      // Yuqori sifatli kamera yoki galereya rasmlarini brauzerda avtomatik optimallashtirish (2MB cheklovsiz)
      const compressed = await compressImage(file, 1200, 1200, 0.82);
      setImageUrl(compressed);
      addToast('Rasm muvaffaqiyatli yuklandi', 'success');
      tg.hapticImpact('light');
    } catch (err: any) {
      console.error('Rasm yuklashda xatolik:', err);
      addToast('Rasmni yuklashda xatolik yuz berdi', 'error');
    } finally {
      setIsCompressingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || stockQuantity === '') {
      addToast('Nom, narx va qoldiqni kiritish shart', 'error');
      return;
    }

    // Sektor talabiga ko'ra rasm tekshiruvi:
    // agro_vet (O'ta yuqori/majburiy), seeds (Muhim), machinery (Muhim)
    const isImageRequired = businessType === 'agro_vet' || businessType === 'seeds' || businessType === 'machinery';
    if (isImageRequired && !imageUrl.trim() && !editingProduct?.image_url) {
      addToast(`${businessType === 'agro_vet' ? 'Agro-Vet dorixonada' : 'Ushbu yo‘nalishda'} mahsulot rasmi majburiy!`, 'error');
      return;
    }

    // Sektor talabiga ko'ra partiya/muddat tekshiruvi
    if (businessType === 'agro_vet' && !expiryDate) {
      addToast('Agro-Vet mahsulotlarida yaroqlilik muddati (expiry_date) kiritilishi shart', 'error');
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
        barcode: editingProduct?.barcode || undefined,
        sku: sku.trim() || undefined,
        image_url: imageUrl.trim() || undefined,

        // agro_vet (saqlash muddati qoldirildi, partiya va yo'riqnoma keyingi versiyalarda)
        batch_number: editingProduct?.batch_number || undefined,
        expiry_date: expiryDate || undefined,
        active_ingredient: editingProduct?.active_ingredient || undefined,

        // feed
        bag_weight_kg: bagWeightKg !== '' ? Number(bagWeightKg) : undefined,

        // warehouse
        wholesale_price: wholesalePrice !== '' ? Number(wholesalePrice) : undefined,
        wholesale_min_qty: minWholesaleQuantity !== '' ? Number(minWholesaleQuantity) : undefined,
        min_wholesale_quantity: minWholesaleQuantity !== '' ? Number(minWholesaleQuantity) : undefined,
        packaging_type: packagingType.trim() || undefined,

        // seeds
        variety: variety.trim() || undefined,
        germination_rate_percent: germinationRate !== '' ? Number(germinationRate) : undefined,
        harvest_year: harvestYear !== '' ? Number(harvestYear) : undefined,
        ripening_period: ripeningPeriod.trim() || undefined,

        // machinery
        serial_number: serialNumber.trim() || undefined,
        model: model.trim() || undefined,
        warranty_months: warrantyMonths !== '' ? Number(warrantyMonths) : undefined,
        part_number: partNumber.trim() || undefined,
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

  const filtered = products.filter((p) => {
    if (categoryFilter && p.category !== categoryFilter) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.batch_number && p.batch_number.toLowerCase().includes(q)) ||
      (p.active_ingredient && p.active_ingredient.toLowerCase().includes(q)) ||
      (p.variety && p.variety.toLowerCase().includes(q)) ||
      (p.model && p.model.toLowerCase().includes(q)) ||
      (p.serial_number && p.serial_number.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ombor va Mahsulotlar
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {businessType === 'agro_vet' && '🌿 Agro-Vet'}
              {businessType === 'feed' && '🌾 Yem-Ozuqa'}
              {businessType === 'warehouse' && '🏢 Ulgurji Ombor'}
              {businessType === 'seeds' && '🌱 Urug‘ & Ko‘chat'}
              {businessType === 'machinery' && '🔧 Jihoz & Texnika'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            5 ta B2B sektorga moslashtirilgan tovar kartochkalari, narxlar va qoldiqlar
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

      {/* Search & Category Filter bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nomi, faol modda, nav yoki model bo‘yicha izlash..."
              className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:w-64">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
            >
              <option value="">Barcha kategoriyalar</option>
              {SECTOR_CATEGORIES[businessType]?.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-600 flex items-center justify-between sm:justify-end gap-2">
          <span>Jami tovarlar:</span>
          <span className="text-emerald-700 font-extrabold px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
            {filtered.length} ta
          </span>
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
                  <th className="py-3.5 px-4">Tovar</th>
                  <th className="py-3.5 px-4">Kategoriya</th>
                  <th className="py-3.5 px-4">Chakana narx</th>
                  <th className="py-3.5 px-4">Qoldiq</th>

                  {/* Sektorga mos ustunlar */}
                  {businessType === 'agro_vet' && (
                    <th className="py-3.5 px-4">Saqlash muddati</th>
                  )}
                  {businessType === 'feed' && (
                    <>
                      <th className="py-3.5 px-4">1 Qop vazni</th>
                      <th className="py-3.5 px-4">Birlik</th>
                    </>
                  )}
                  {businessType === 'warehouse' && (
                    <>
                      <th className="py-3.5 px-4">Ulgurji narx</th>
                      <th className="py-3.5 px-4">Min. partiya & Qadoq</th>
                    </>
                  )}
                  {businessType === 'seeds' && (
                    <>
                      <th className="py-3.5 px-4">Nav & Unuvchanlik</th>
                      <th className="py-3.5 px-4">Hosil yili & Mavsum</th>
                    </>
                  )}
                  {businessType === 'machinery' && (
                    <>
                      <th className="py-3.5 px-4">Model & Seriya №</th>
                      <th className="py-3.5 px-4">Kafolat & Katalog kodi</th>
                    </>
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
                      {/* Tovar nomi va Rasmi */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm">
                              {product.name}
                            </div>
                          </div>
                        </div>
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

                      {/* Sektor 1: Agro-Vet */}
                      {businessType === 'agro_vet' && (
                        <td className="py-3.5 px-4 text-slate-600">
                          {product.expiry_date ? (
                            <span className="text-amber-800 font-bold text-[11px] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                              {formatDate(product.expiry_date)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {/* Sektor 2: Feed */}
                      {businessType === 'feed' && (
                        <>
                          <td className="py-3.5 px-4 font-bold text-amber-900">
                            {product.bag_weight_kg ? `${product.bag_weight_kg} kg / qop` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {product.unit}
                          </td>
                        </>
                      )}

                      {/* Sektor 3: Warehouse */}
                      {businessType === 'warehouse' && (
                        <>
                          <td className="py-3.5 px-4">
                            {product.wholesale_price ? (
                              <span className="font-bold text-blue-700 text-sm">
                                {formatCurrency(product.wholesale_price)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>Min: {product.min_wholesale_quantity || product.wholesale_min_qty || '1'} {product.unit}</div>
                            {product.packaging_type && (
                              <div className="text-[10px] text-slate-400">{product.packaging_type}</div>
                            )}
                          </td>
                        </>
                      )}

                      {/* Sektor 4: Seeds */}
                      {businessType === 'seeds' && (
                        <>
                          <td className="py-3.5 px-4 text-slate-600">
                            {product.variety && <div className="font-bold text-slate-800">{product.variety}</div>}
                            {product.germination_rate_percent && (
                              <div className="text-emerald-700 font-semibold text-[11px]">
                                Unuvchanlik: {product.germination_rate_percent}%
                              </div>
                            )}
                            {!product.variety && !product.germination_rate_percent && '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {product.harvest_year ? `${product.harvest_year}-yil` : '—'}
                            {product.ripening_period && (
                              <div className="text-[10px] text-slate-400">{product.ripening_period}</div>
                            )}
                          </td>
                        </>
                      )}

                      {/* Sektor 5: Machinery */}
                      {businessType === 'machinery' && (
                        <>
                          <td className="py-3.5 px-4 text-slate-600">
                            {product.model && <div className="font-bold text-slate-900">{product.model}</div>}
                            {product.serial_number && (
                              <div className="font-mono text-[11px] text-slate-500">SN: {product.serial_number}</div>
                            )}
                            {!product.model && !product.serial_number && '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {product.warranty_months && (
                              <div className="font-semibold text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>{product.warranty_months} oy</span>
                              </div>
                            )}
                            {product.part_number && (
                              <div className="font-mono text-[10px] text-slate-400">Kod: {product.part_number}</div>
                            )}
                          </td>
                        </>
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
          
          {/* Sektor belgisi va Rasm maydoni */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>
                  Mahsulot rasmi {businessType === 'agro_vet' || businessType === 'seeds' || businessType === 'machinery' ? '*' : '(Ixtiyoriy)'}
                </span>
              </label>
              {(businessType === 'agro_vet' || businessType === 'seeds' || businessType === 'machinery') && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Tavsiya / Majburiy
                </span>
              )}
            </div>

            {imageUrl ? (
              <div className="flex items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Rasm yuklandi va optimallashtirildi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kassa va cheklarda aniq va tiniq ko‘rinadi.
                  </p>
                  <div className="flex items-center gap-2 mt-2.5">
                    <label className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Boshqa rasm tanlash</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isCompressingImage}
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-3 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>O‘chirish</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 rounded-2xl cursor-pointer transition group shadow-2xs">
                  {isCompressingImage ? (
                    <div className="flex items-center gap-3 py-2 text-emerald-700 w-full justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      <div>
                        <div className="text-xs font-bold">Rasm optimallashtirilmoqda...</div>
                        <div className="text-[11px] text-slate-500">Iltimos kuting</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3.5 text-center sm:text-left">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">
                            Kamera yoki galereyadan rasm tanlash
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Istalgan sifatdagi rasmni yuklang (avtomatik sifatli siqiladi, 2MB cheklov yo‘q)
                          </div>
                        </div>
                      </div>
                      <span className="px-4 py-2 bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0">
                        Rasm yuklash
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isCompressingImage}
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Asosiy ma'lumotlar */}
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
                placeholder="Masalan: Bi-58 insektitsid 1L yoki Omuxta yem 50kg"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Kategoriya *
              </label>
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
              >
                <option value="">— Kategoriyani tanlang —</option>
                {SECTOR_CATEGORIES[businessType]?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {category && !SECTOR_CATEGORIES[businessType]?.includes(category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Sektor yo‘nalishi bo‘yicha faqat tanlab qo‘yiladi
              </p>
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
                {businessType === 'feed' ? (
                  <>
                    <option value="qop">Qop</option>
                    <option value="kg">Kg</option>
                    <option value="tonna">Tonna</option>
                  </>
                ) : (
                  <>
                    <option value="dona">dona</option>
                    <option value="kg">kg</option>
                    <option value="litr">litr</option>
                    <option value="qop">qop</option>
                    <option value="tonna">tonna</option>
                    <option value="pachka">pachka</option>
                    <option value="metr">metr</option>
                    <option value="gram">gram</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chakana sotish narxi (so‘m) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50 000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
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

          {/* Sektorga Xos Maxsus Maydonlar */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sohaviy parametrlar ({businessType})</span>
            </h4>

            {/* 1. AGRO-VET: Saqlash muddati (Partiya va Yo'riqnoma keyingi versiyalarda) */}
            {businessType === 'agro_vet' && (
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Saqlash muddati (Yaroqlilik muddati) *</span>
                  <span className="text-[10px] text-emerald-800 font-normal">Avtomatik nazorat</span>
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-semibold"
                />
                <p className="text-[11px] text-emerald-800/80 mt-1.5">
                  Muddati o‘tgan yoki yaqinlashgan tovarlar haqida kassa va omborda ogohlantirish beriladi.
                </p>
              </div>
            )}

            {/* 2. FEED: 1 qop vazni (kg), O'lchov birliklari */}
            {businessType === 'feed' && (
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    1 Qopning sof vazni (kg da) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.1"
                      value={bagWeightKg}
                      onChange={(e) => setBagWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Masalan: 50"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">KG / QOP</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1">
                    ⚖️ Kassada qopni bo‘lib (masalan 5 kg yoki 12.5 kg) sotganda narx avtomatik proporsional hisoblanadi.
                  </p>
                </div>
              </div>
            )}

            {/* 3. WAREHOUSE: Ulgurji narx, Minimal partiya, Qadoq */}
            {businessType === 'warehouse' && (
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ulgurji (Optom) narx (so‘m)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Masalan: 45 000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Minimal ulgurji partiya miqdori
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minWholesaleQuantity}
                      onChange={(e) => setMinWholesaleQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Masalan: 10 dona / qop"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Blok / Korobka qadoqlash ko‘rsatkichi
                  </label>
                  <input
                    type="text"
                    value={packagingType}
                    onChange={(e) => setPackagingType(e.target.value)}
                    placeholder="Masalan: 1 korobka = 24 dona yoki 1 poddon = 40 qop"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* 4. SEEDS: Navi, Unuvchanlik %, Hosil yili, Pishish davri */}
            {businessType === 'seeds' && (
              <div className="bg-lime-50/60 p-4 rounded-xl border border-lime-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Urug‘ navi (Variety / Сорт) *
                    </label>
                    <input
                      type="text"
                      required
                      value={variety}
                      onChange={(e) => setVariety(e.target.value)}
                      placeholder="Masalan: Super F1 Gollandiya"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Unuvchanlik foizi (%) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      value={germinationRate}
                      onChange={(e) => setGerminationRate(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Masalan: 98%"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hosil yili
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      value={harvestYear}
                      onChange={(e) => setHarvestYear(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="2024"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Pishish davri / Mavsumiylik
                    </label>
                    <input
                      type="text"
                      value={ripeningPeriod}
                      onChange={(e) => setRipeningPeriod(e.target.value)}
                      placeholder="Masalan: Ertapishar (60-65 kun), Bahoriy ekish"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. MACHINERY: Zavod seriya №, Modeli, Kafolat, Katalog kodi */}
            {businessType === 'machinery' && (
              <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-300 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Modeli *
                    </label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Masalan: Maral-125 Motoblok"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Zavod seriya raqami (Serial №)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="SN-89421-TX"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Kafolat muddati (oyda) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="12"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Ehtiyot qismlar katalog kodi
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
              </div>
            )}

          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
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
