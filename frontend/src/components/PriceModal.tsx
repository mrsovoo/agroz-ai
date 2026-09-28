"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, CheckCircle2, X } from "lucide-react";

interface PriceModalProps {
  medicineId: number;
  medicineName: string;
  currentPrice: number | null;
  onClose: () => void;
  onSave: (price: number) => Promise<void>;
}

export default function PriceModal({ 
  medicineId, 
  medicineName, 
  currentPrice, 
  onClose, 
  onSave 
}: PriceModalProps) {
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentPrice && currentPrice > 0) {
      setPrice(String(currentPrice));
    }
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [currentPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceValue = Number(price.trim());
    if (!priceValue || priceValue < 1000) {
      setError("Narx kamida 1000 so'm bo'lishi kerak");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(priceValue);
      onClose();
    } catch (err: any) {
      setError(err.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-modal-title"
    >
      <div 
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="price-modal-title" className="text-lg font-bold text-zinc-900">Narx kiritish</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
            aria-label="Yopish"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-zinc-600 mb-4">
          <span className="font-medium">{medicineName}</span> dori uchun narxni kiriting.
          Bu narx mijozlarga ko'rinadi.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <label htmlFor="price-input" className="block text-xs font-medium text-zinc-700 mb-1">
              Narx (so'm)
            </label>
            <div className="relative">
              <input
                id="price-input"
                type="number"
                min="1000"
                step="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Masalan: 25000"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-300 bg-white text-lg font-semibold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">
                so'm
              </span>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={saving || !price.trim()}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saqlash
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}