import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import { formatMoney } from '../lib/utils';
import { Scale, ShoppingCart } from 'lucide-react';
import type { Product } from '../types';

interface FeedCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  product?: Product | null;
  onApply?: (qtyInBags: number) => void;
}

export const FeedCalculatorModal: React.FC<FeedCalculatorModalProps> = ({
  isOpen,
  onClose,
  products = [],
  product: singleProduct,
  onApply
}) => {
  const { addToCart, showToast } = useStore();

  const allProducts = singleProduct ? [singleProduct] : products;
  const feedProducts = allProducts.filter(
    (p) => p.unit === 'qop' || p.bag_weight_kg || p.category?.toLowerCase().includes('yem')
  );
  const initialProduct = singleProduct || feedProducts[0] || allProducts[0];

  const [selectedId, setSelectedId] = useState<number>(initialProduct?.id || 0);
  const [bagWeight, setBagWeight] = useState<number>(initialProduct?.bag_weight_kg || 50);
  const [bagPrice, setBagPrice] = useState<number>(initialProduct?.price || 0);
  const [targetKg, setTargetKg] = useState<string>('');

  useEffect(() => {
    if (initialProduct) {
      setSelectedId(initialProduct.id);
      setBagWeight(initialProduct.bag_weight_kg || 50);
      setBagPrice(initialProduct.price);
    }
  }, [singleProduct, products]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = Number(e.target.value);
    setSelectedId(pId);
    const p = allProducts.find((x) => x.id === pId);
    if (p) {
      setBagWeight(p.bag_weight_kg || 50);
      setBagPrice(p.price);
    }
  };

  const currentKg = Number(targetKg) || 0;
  const perKg = bagWeight > 0 ? Math.round(bagPrice / bagWeight) : 0;
  const totalAmount = Math.round(perKg * currentKg);
  const bagShare = bagWeight > 0 ? +(currentKg / bagWeight).toFixed(3) : 0;

  const handleAddToCart = () => {
    const product = allProducts.find((p) => p.id === selectedId) || initialProduct;
    if (!product || bagShare <= 0) return;

    if (onApply) {
      onApply(bagShare);
    } else {
      addToCart(product, bagShare);
      showToast(`${currentKg} kg (${bagShare} qop) savatga qo'shildi!`, 'success');
    }
    onClose();
    setTargetKg('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" />
          <span>Yem Kalkulyatori (Kg lab sotish)</span>
        </div>
      }
      size="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleAddToCart}
            disabled={currentKg <= 0 || totalAmount <= 0}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Savatga qo'shish ({formatMoney(totalAmount)})</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Qopdagi yemni xaridor talabiga ko'ra kilogramm (kg) lab tortib sotish va narxni avtomatik hisoblash
        </p>

        {allProducts.length > 1 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Yem mahsulotini tanlang <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedId}
              onChange={handleProductChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              {(feedProducts.length > 0 ? feedProducts : allProducts).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatMoney(p.price)} / {p.unit} {p.bag_weight_kg ? `(${p.bag_weight_kg} kg)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1 qopning vazni (kg)
            </label>
            <input
              type="number"
              step="any"
              min="1"
              value={bagWeight}
              onChange={(e) => setBagWeight(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1 qop narxi (so'm)
            </label>
            <input
              type="number"
              min="0"
              value={bagPrice}
              onChange={(e) => setBagPrice(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-emerald-700 mb-1.5">
            Xaridor so'ragan miqdor (kg da) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            placeholder="Masalan: 10"
            value={targetKg}
            onChange={(e) => setTargetKg(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-500 text-base font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        {/* Natija kartochkasi */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>1 kg narxi:</span>
            <strong className="text-slate-800">{formatMoney(perKg)}</strong>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Qop ulushi (ombor qoldig'i):</span>
            <strong className="text-slate-800">{bagShare} qop ({currentKg} kg)</strong>
          </div>
          <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-dashed border-slate-200">
            <span>Jami to'lov:</span>
            <span className="text-emerald-700 text-lg">{formatMoney(totalAmount)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
