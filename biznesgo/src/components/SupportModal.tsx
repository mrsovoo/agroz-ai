import React from 'react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import { tg } from '../lib/telegram';
import { SECTOR_SUPPORT_CONTACTS } from '../lib/supportAndTariff';
import { 
  Phone, 
  Send, 
  Clock, 
  UserCheck, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { merchant } = useStore();
  const bizType = merchant?.business_type || 'agro_vet';
  const sectorContact = SECTOR_SUPPORT_CONTACTS[bizType] || SECTOR_SUPPORT_CONTACTS.agro_vet;

  const handleOpenTelegram = (username: string) => {
    tg.hapticImpact('light');
    const url = `https://t.me/${username}`;
    window.open(url, '_blank');
  };

  const handleCall = (phoneNumber: string) => {
    tg.hapticImpact('light');
    window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Qo‘llab-quvvatlash xizmati</div>
            <div className="text-[11px] font-normal text-slate-500">Sektor mutaxassisi va 24/7 yordam</div>
          </div>
        </div>
      }
      size="md"
    >
      <div className="p-5 space-y-4">
        {/* Shaxsiy sektor mutaxassisi kartasi */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-950 text-white rounded-2xl p-5 shadow-sm border border-emerald-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-emerald-400" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2.5">
              <UserCheck className="w-3 h-3" />
              Sizning sektor kuratoringiz
            </div>

            <h4 className="text-base font-bold text-white">
              {sectorContact.specialist_name}
            </h4>
            <p className="text-xs text-emerald-300 font-medium mt-0.5">
              {sectorContact.specialist_role}
            </p>

            <div className="mt-3.5 pt-3.5 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{sectorContact.working_hours}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={() => handleCall(sectorContact.phone)}
                className="py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Qo‘ng‘iroq qilish</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenTelegram(sectorContact.telegram_username)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Telegram orqali</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mutaxassis maslahat beradigan yo'nalishlar */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Mutaxassis qanday masalalarda yordam beradi:
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-600">
            {sectorContact.topics.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 24/7 Markaziy qo'llab-quvvatlash */}
        <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Markaziy 24/7 Call-markaz</div>
              <div className="text-[11px] text-slate-500">+998 71 200 45 67 (Har kuni 24 soat)</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCall('+998712004567')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Bog‘lanish
          </button>
        </div>
      </div>
    </Modal>
  );
};
