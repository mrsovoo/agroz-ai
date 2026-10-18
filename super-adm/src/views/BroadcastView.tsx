import React, { useState } from 'react';
import { api } from '../lib/api';
import type { BroadcastResult } from '../types';
import {
  Send,
  Image as ImageIcon,
  Bot,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const BroadcastView: React.FC = () => {
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [targetBiznesgo, setTargetBiznesgo] = useState(true);
  const [targetAgrozAuth, setTargetAgrozAuth] = useState(true);
  const [customIds, setCustomIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Xabar matnini kiritish shart!');
      return;
    }

    const bots = [];
    if (targetBiznesgo) bots.push('biznesgo_bot');
    if (targetAgrozAuth) bots.push('agroz_auth_bot');

    if (bots.length === 0) {
      setError("Kamida bitta botni tanlashingiz kerak!");
      return;
    }

    const targetIds = customIds.trim()
      ? customIds
          .split(/[\s,]+/)
          .map((id) => Number(id))
          .filter((id) => !isNaN(id) && id > 0)
      : undefined;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.sendBroadcast({
        text: text.trim(),
        photo_url: photoUrl.trim() || undefined,
        target_bots: bots,
        target_ids: targetIds,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Push-xabarnoma yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Telegram Push Xabarnoma</h1>
        <p className="text-slate-400 text-sm">
          Platformadagi barcha sotuvchi va foydalanuvchilarga @biznesgo_bot va @agroz_auth_bot orqali xabar yuborish
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSend} className="lg:col-span-2 space-y-5 bg-slate-800/80 border border-slate-700/60 rounded-xl p-6 shadow-lg">
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Bot Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Yuboruvchi Botlar (Dual-Bot)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  targetBiznesgo
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetBiznesgo}
                  onChange={(e) => setTargetBiznesgo(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-emerald-400" /> @biznesgo_bot
                  </div>
                  <div className="text-xs text-slate-400">Asosiy B2B sotuvchilar boti</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                  targetAgrozAuth
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetAgrozAuth}
                  onChange={(e) => setTargetAgrozAuth(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-blue-400" /> @agroz_auth_bot
                  </div>
                  <div className="text-xs text-slate-400">Eski bazadagi dorixonalar</div>
                </div>
              </label>
            </div>
          </div>

          {/* Message Text */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Xabar Matni (HTML qo'llab-quvvatlanadi)
              </label>
              <span className="text-xs text-slate-500">
                &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;, &lt;a href="..."&gt;havola&lt;/a&gt;
              </span>
            </div>
            <textarea
              rows={5}
              placeholder="E'lon: BiznesGO platformasiga yangi qulayliklar qo'shildi! Do'koningizni boshqarish uchun..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-slate-400" /> Rasm Havolasi (Photo URL — ixtiyoriy)
            </label>
            <input
              type="url"
              placeholder="https://example.com/rasm.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Target Telegram IDs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" /> Maxsus Telegram ID-lar (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Bo'sh qoldirilsa barcha foydalanuvchilarga yuboriladi (masalan: 12345678, 87654321)"
              value={customIds}
              onChange={(e) => setCustomIds(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition shadow-lg shadow-emerald-900/30"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Push Xabarni Yuborish
              </>
            )}
          </button>
        </form>

        {/* Live Preview & Delivery Results */}
        <div className="space-y-4">
          {/* Telegram Message Preview Card */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Telegram Ko'rinishi (Preview)
            </h3>
            <div className="bg-[#182533] rounded-xl p-3 text-slate-100 text-sm border border-slate-700 space-y-2">
              {photoUrl ? (
                <div className="rounded-lg overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center">
                  <img src={photoUrl} alt="Preview" className="w-full h-auto object-cover" onError={(e) => ((e.target as any).style.display = 'none')} />
                </div>
              ) : null}
              <div className="whitespace-pre-wrap break-words leading-relaxed">
                {text ? (
                  <span dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />
                ) : (
                  <span className="text-slate-500 italic">Xabar matni kiritilganda bu yerda ko'rinadi...</span>
                )}
              </div>
              <div className="text-[10px] text-right text-slate-500">12:00 ✓✓</div>
            </div>
          </div>

          {/* Delivery Results */}
          {result && (
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-xl p-4 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Yuborish Natijalari
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg">
                  <span className="text-slate-400 block">Jami qabul qiluvchi:</span>
                  <span className="text-base font-bold text-white">{result.total} ta</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg">
                  <span className="text-slate-400 block">Yetkazildi:</span>
                  <span className="text-base font-bold text-emerald-400">
                    {result.sent_via_biznesgo + result.sent_via_agroz_auth} ta
                  </span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg">
                  <span className="text-slate-400 block">@biznesgo_bot:</span>
                  <span className="text-sm font-semibold text-slate-200">{result.sent_via_biznesgo}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg">
                  <span className="text-slate-400 block">@agroz_auth_bot:</span>
                  <span className="text-sm font-semibold text-slate-200">{result.sent_via_agroz_auth}</span>
                </div>
              </div>
              {result.failed > 0 && (
                <div className="text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> {result.failed} ta foydalanuvchiga yetkazilmadi (bot bloklangan bo'lishi mumkin)
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

