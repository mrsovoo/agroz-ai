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
  ArrowUpRight
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
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Telegram Push Xabarnoma
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Platformadagi barcha sotuvchi va foydalanuvchilarga @biznesgo_bot va @agroz_auth_bot orqali xabar yuborish
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form onSubmit={handleSend} className="lg:col-span-2 space-y-5 bg-white border border-slate-200/60 rounded-[32px] p-4 sm:p-6 shadow-xs">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Bot Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Yuboruvchi Botlar (Dual-Bot)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                  targetBiznesgo
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-[#F6F6F3] border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetBiznesgo}
                  onChange={(e) => setTargetBiznesgo(e.target.checked)}
                  className="rounded text-black focus:ring-black accent-black"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Bot className={`w-3.5 h-3.5 ${targetBiznesgo ? 'text-emerald-400' : 'text-slate-600'}`} /> @biznesgo_bot
                  </div>
                  <div className={`text-[10px] ${targetBiznesgo ? 'text-slate-300' : 'text-slate-500'}`}>Asosiy B2B sotuvchilar boti</div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                  targetAgrozAuth
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-[#F6F6F3] border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetAgrozAuth}
                  onChange={(e) => setTargetAgrozAuth(e.target.checked)}
                  className="rounded text-black focus:ring-black accent-black"
                />
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Bot className={`w-3.5 h-3.5 ${targetAgrozAuth ? 'text-sky-400' : 'text-slate-600'}`} /> @agroz_auth_bot
                  </div>
                  <div className={`text-[10px] ${targetAgrozAuth ? 'text-slate-300' : 'text-slate-500'}`}>Eski bazadagi dorixonalar</div>
                </div>
              </label>
            </div>
          </div>

          {/* Message Text */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Xabar Matni (HTML qo'llab-quvvatlanadi)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                &lt;b&gt;qalin&lt;/b&gt;, &lt;i&gt;kursiv&lt;/i&gt;, &lt;a href="..."&gt;havola&lt;/a&gt;
              </span>
            </div>
            <textarea
              rows={5}
              placeholder="E'lon: BiznesGO platformasiga yangi qulayliklar qo'shildi! Do'koningizni boshqarish uchun..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 bg-[#F6F6F3] border-none rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-300 font-sans"
            />
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" /> Rasm Havolasi (Photo URL — ixtiyoriy)
            </label>
            <input
              type="url"
              placeholder="https://example.com/rasm.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F6F6F3] border-none rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-300"
            />
          </div>

          {/* Target Telegram IDs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" /> Maxsus Telegram ID-lar (ixtiyoriy)
            </label>
            <input
              type="text"
              placeholder="Bo'sh qoldirilsa barcha foydalanuvchilarga yuboriladi (masalan: 12345678, 87654321)"
              value={customIds}
              onChange={(e) => setCustomIds(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F6F6F3] border-none rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-300"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-black hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-full text-xs transition shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Yuborilmoqda...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Push Xabarni Yuborish
              </>
            )}
          </button>
        </form>

        {/* Live Preview & Delivery Results */}
        <div className="space-y-4">
          {/* Telegram Message Preview Card */}
          <div className="bg-white border border-slate-200/60 rounded-[32px] p-5 shadow-xs">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Telegram Ko'rinishi (Preview)
            </h3>
            <div className="bg-[#182533] rounded-2xl p-3.5 text-slate-100 text-xs border border-slate-800 space-y-2">
              {photoUrl ? (
                <div className="rounded-xl overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center">
                  <img src={photoUrl} alt="Preview" className="w-full h-auto object-cover" onError={(e) => ((e.target as any).style.display = 'none')} />
                </div>
              ) : null}
              <div className="whitespace-pre-wrap break-words leading-relaxed text-slate-100">
                {text ? (
                  <span dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />
                ) : (
                  <span className="text-slate-500 italic">Xabar matni kiritilganda bu yerda ko'rinadi...</span>
                )}
              </div>
              <div className="text-[10px] text-right text-slate-400">12:00 ✓✓</div>
            </div>
          </div>

          {/* Delivery Results */}
          {result && (
            <div className="bg-white border border-slate-200/60 rounded-[32px] p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Yuborish Natijalari
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#F6F6F3] p-3 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">Jami qabul qiluvchi:</span>
                  <span className="text-base font-bold text-slate-900">{result.total} ta</span>
                </div>
                <div className="bg-[#F6F6F3] p-3 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">Yetkazildi:</span>
                  <span className="text-base font-bold text-emerald-600">
                    {result.sent_via_biznesgo + result.sent_via_agroz_auth} ta
                  </span>
                </div>
                <div className="bg-[#F6F6F3] p-2.5 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">@biznesgo_bot:</span>
                  <span className="text-xs font-bold text-slate-900">{result.sent_via_biznesgo}</span>
                </div>
                <div className="bg-[#F6F6F3] p-2.5 rounded-2xl">
                  <span className="text-slate-400 block text-[10px]">@agroz_auth_bot:</span>
                  <span className="text-xs font-bold text-slate-900">{result.sent_via_agroz_auth}</span>
                </div>
              </div>
              {result.failed > 0 && (
                <div className="text-xs text-rose-600 flex items-center gap-1 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
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
