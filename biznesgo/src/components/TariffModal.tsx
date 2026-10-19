import React from 'react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import { tg } from '../lib/telegram';
import { DEFAULT_SUBSCRIPTION_PLAN } from '../lib/supportAndTariff';
import { 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Sparkles, 
  Send,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface TariffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TariffModal: React.FC<TariffModalProps> = ({ isOpen, onClose }) => {
  const { merchant, addToast } = useStore();
  const plan = DEFAULT_SUBSCRIPTION_PLAN;

  const handlePayOrExtend = () => {
    tg.hapticImpact('medium');
    addToast('Tarifni uzaytirish uchun @biznesgo_support ga so‘rov yuborildi', 'success');
    window.open('https://t.me/biznesgo_support', '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Oylik Tarif & Obuna</div>
            <div className="text-[11px] font-normal text-slate-500">Do‘koningiz obuna rejasi va to‘lov muddati</div>
          </div>
        </div>
      }
      size="md"
    >
      <div className="p-5 space-y-4">
        {/* Tarif holati kartasi */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Faol Obuna
            </span>
            <span className="text-xs text-slate-400">
              {plan.period} to‘lov
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <h4 className="text-xl font-black text-white">{plan.plan_name}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {merchant?.store_name || 'Do‘koningiz'} uchun to‘liq B2B paketi
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">
                {plan.price_uzs.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1">so‘m / oy</span>
            </div>
          </div>

          {/* Qolgan kunlar ko'rsatkichi */}
          <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Qolgan muddat: <b>{plan.days_left} kun</b></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Keyingi to‘lov: {plan.expires_at}</span>
            </div>
          </div>
        </div>

        {/* Tarif imkoniyatlari ro'yxati */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Tarif ichiga kiritilgan imkoniyatlar:
          </h5>
          <div className="space-y-2">
            {plan.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Uzaytirish / To'lash tugmasi */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePayOrExtend}
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>Tarifni uzaytirish / To‘lov qilish</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 mt-2">
            Click, Payme, Uzum yoki bank hisob raqami orqali xavfsiz to‘lov
          </p>
        </div>
      </div>
    </Modal>
  );
};

