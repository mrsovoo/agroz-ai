import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { useStore } from '../store/useStore';
import { tg } from '../lib/telegram';
import { api } from '../lib/api';
import { SECTOR_SUPPORT_CONTACTS } from '../lib/supportAndTariff';
import { 
  Phone, 
  Send, 
  Clock, 
  UserCheck, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles,
  MessageSquare,
  Bot,
  User,
  CheckCheck,
  RefreshCw,
  Mail
} from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SupportMessage {
  id: number;
  merchant_id: number | null;
  telegram_id: string | null;
  sender_type: 'merchant' | 'admin' | 'bot_user';
  sender_name: string;
  sender_phone?: string;
  message: string;
  source: 'web' | 'telegram_bot';
  is_read: boolean;
  created_at: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { merchant } = useStore();
  const bizType = merchant?.business_type || 'agro_vet';
  const sectorContact = SECTOR_SUPPORT_CONTACTS[bizType] || SECTOR_SUPPORT_CONTACTS.agro_vet;

  const [activeTab, setActiveTab] = useState<'chat' | 'contact'>('chat');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.support.list();
      if (res && res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('Failed to load support messages:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchMessages();

    // Auto poll every 4 seconds when modal is open
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    tg.hapticImpact('light');

    // Optimistic message
    const tempId = Date.now();
    const optimisticMsg: SupportMessage = {
      id: tempId,
      merchant_id: merchant?.id || null,
      telegram_id: null,
      sender_type: 'merchant',
      sender_name: merchant?.store_name || 'Siz',
      message: text,
      source: 'web',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    try {
      const res = await api.support.send(text);
      if (res && res.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.message : m)));
      }
      tg.hapticNotification('success');
    } catch (err: any) {
      tg.hapticNotification('error');
      alert(err.message || 'Xabar yuborishda xatolik yuz berdi');
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenTelegram = (username: string) => {
    tg.hapticImpact('light');
    const url = `https://t.me/${username}`;
    window.open(url, '_blank');
  };

  const handleCall = (phoneNumber: string) => {
    tg.hapticImpact('light');
    window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
  };

  const handleEmail = (emailAddr: string) => {
    tg.hapticImpact('light');
    window.location.href = `mailto:${emailAddr}`;
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
            <div className="text-[11px] font-normal text-slate-500">Super Admin chati va 24/7 yordam</div>
          </div>
        </div>
      }
      size="md"
    >
      <div className="p-4 sm:p-5 flex flex-col h-[520px]">
        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Admin Chati</span>
            {messages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Aloqa & Mutaxassis</span>
          </button>
        </div>

        {/* Tab 1: Live Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Quick Contact Banner */}
            <div className="px-3 py-2 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-between text-xs mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-900">Admin onlayn • Javob berish: 5-15 daqiqa</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCall('+998908383772')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" />
                  +998 90 838 37 72
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => handleEmail('info@biznesgo.uz')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-mono"
                >
                  <Mail className="w-3 h-3" />
                  info@biznesgo.uz
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              {isLoading && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Xabarlar yuklanmoqda...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/60 text-emerald-600 flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Super Admin bilan jonli muloqot</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Savolingiz, taklifingiz yoki tizim bo‘yicha murojaatingizni pastdagi maydonga yozing. Administrator xabaringizga zudlik bilan javob qaytaradi.
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    <button
                      type="button"
                      onClick={() => setInputText("Assalomu alaykum, kredit limitini qanday sozlayman?")}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Kredit limiti sozlamasi
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText("Tarif to‘lovini amalga oshirish bo‘yicha rekvizitlar kerak.")}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Tarif to‘lovi
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender_type === 'admin';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5 px-1">
                        <span className="text-[10px] font-bold text-slate-500">
                          {isAdmin ? 'Super Admin' : 'Siz'}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                          isAdmin
                            ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                            : 'bg-emerald-600 text-white rounded-tr-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSendMessage} className="mt-2.5 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Xabaringizni yozing..."
                disabled={isSending}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
                title="Yuborish"
              >
                {isSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Specialist & Direct Contacts */}
        {activeTab === 'contact' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
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
                    onClick={() => handleCall('+998908383772')}
                    className="py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Qo‘ng‘iroq</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenTelegram('bydsgn')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>@bydsgn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEmail(sectorContact.email || 'info@biznesgo.uz')}
                    className="col-span-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-white/10"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="font-mono">{sectorContact.email || 'info@biznesgo.uz'}</span>
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
                  <div className="text-[11px] text-slate-500">+998 90 838 37 72 (Har kuni 24 soat)</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCall('+998908383772')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Bog‘lanish
              </button>
            </div>

            {/* Rasmiy Elektron Pochta (Email) */}
            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Rasmiy Elektron Pochta</div>
                  <div className="text-[11px] text-slate-500 font-mono">info@biznesgo.uz</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleEmail('info@biznesgo.uz')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email yozish</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
