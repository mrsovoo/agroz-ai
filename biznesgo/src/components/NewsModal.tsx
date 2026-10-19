import React from 'react';
import { Modal } from './Modal';
import { PLATFORM_NEWS, NewsItem } from '../lib/supportAndTariff';
import { Bell, Sparkles, Calendar, ChevronRight } from 'lucide-react';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Yangiliklar & E'lonlar</div>
            <div className="text-[11px] font-normal text-slate-500">BiznesGO tizimi yangilanishlari va tavsiyalar</div>
          </div>
        </div>
      }
      size="md"
    >
      <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
        {PLATFORM_NEWS.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50/60 transition-all bg-white"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {item.badge}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{item.date}</span>
              </div>
            </div>

            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {item.title}
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              {item.summary}
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
