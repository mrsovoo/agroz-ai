import React, { useState } from 'react';
import { ShieldAlert, Eye, X, Loader2 } from 'lucide-react';
import { adminApi } from '../lib/api';

interface SensitiveDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: string;
  resourceId: string;
  fieldName: string;
  onRevealed: (value: string) => void;
}

export const SensitiveDataModal: React.FC<SensitiveDataModalProps> = ({
  isOpen,
  onClose,
  resource,
  resourceId,
  fieldName,
  onRevealed
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Sabab kamida 5 ta belgidan iborat bo\'lishi shart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await adminApi.revealSensitive(resource, resourceId, fieldName, reason.trim());
      onRevealed(res.revealed_value);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ma\'lumotni ochishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-semibold text-white">Sezgir Ma'lumotni Ochish</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 border border-slate-700">
            <p className="font-medium text-amber-300 mb-1">Xavfsizlik Ogohlantirishi:</p>
            Ushbu amal audit jurnaliga (<code className="text-emerald-400">audit_logs</code>) to'liq qayd etiladi. Sezgir ma'lumotni ochish uchun rasmiy ish sababini ko'rsatishingiz shart.
          </div>

          <div className="text-xs text-slate-400">
            <span>Maydon: </span>
            <span className="font-mono text-slate-200 bg-slate-800 px-2 py-0.5 rounded">{resource} &gt; {fieldName}</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Ochish Sababi (kamida 5 belgi) <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Mijoz murojaatini tekshirish uchun telefon raqami tasdiqlanmoqda..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg p-2.5">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-black font-semibold bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Jurnalga yozilmoqda...</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tasdiqlash &amp; Ochish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

