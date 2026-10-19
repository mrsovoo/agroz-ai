import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import type { SupportConversation, SupportChatMessage } from '../types';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Bot, 
  Globe, 
  Search, 
  RefreshCw, 
  Store,
  Clock,
  Sparkles,
  ArrowUpRight,
  Mail
} from 'lucide-react';

const BIZ_MAP: Record<string, { label: string; color: string }> = {
  agro_vet: { label: '🌿 Agro-Vet', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  feed: { label: '🌾 Yem-Ozuqa', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  warehouse: { label: '🏢 Ulgurji Ombor', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  seeds: { label: '🌱 Urug‘chilik', color: 'bg-lime-50 text-lime-700 border-lime-200' },
  machinery: { label: '🔧 Jihoz & Texnika', color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function SupportView() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<'all' | 'web' | 'telegram_bot'>('all');
  const [filterBiz, setFilterBiz] = useState<string>('all');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async (silent = false) => {
    if (!silent) setIsLoadingList(true);
    try {
      const res = await api.getSupportConversations();
      setConversations(res.conversations || []);
      setUnreadTotal(res.unread_total || 0);

      if (selectedThread) {
        const found = res.conversations.find((c) => c.thread_id === selectedThread.thread_id);
        if (found) {
          setSelectedThread(found);
        }
      }
    } catch (err: any) {
      console.warn('Error fetching support conversations:', err);
    } finally {
      if (!silent) setIsLoadingList(false);
    }
  };

  const fetchThreadMessages = async (thread: SupportConversation, silent = false) => {
    if (!silent) setIsLoadingThread(true);
    try {
      const res = await api.getSupportThread({
        merchant_id: thread.merchant_id,
        telegram_id: thread.telegram_id,
      });
      setMessages(res.messages || []);
      setConversations((prev) =>
        prev.map((c) => (c.thread_id === thread.thread_id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err: any) {
      console.warn('Error fetching thread messages:', err);
    } finally {
      if (!silent) setIsLoadingThread(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedThread) return;
    fetchThreadMessages(selectedThread);
    const interval = setInterval(() => {
      fetchThreadMessages(selectedThread, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedThread?.thread_id]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSelectThread = (c: SupportConversation) => {
    setSelectedThread(c);
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedThread || !replyText.trim() || isSending) return;

    const text = replyText.trim();
    setIsSending(true);

    try {
      const res = await api.sendSupportReply({
        merchant_id: selectedThread.merchant_id,
        telegram_id: selectedThread.telegram_id,
        message: text,
        admin_name: 'Super Admin',
      });

      if (res && res.message) {
        setMessages((prev) => [...prev, res.message]);
      }
      setReplyText('');
      fetchConversations(true);
    } catch (err: any) {
      alert('Javob yuborishda xatolik: ' + (err.message || 'Server xatosi'));
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterSource !== 'all' && c.source !== filterSource) return false;
    if (filterBiz !== 'all') {
      const b = c.resolved_business_type || c.business_type;
      if (b !== filterBiz) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.sender_name || '').toLowerCase().includes(q);
      const matchStore = (c.store_name || '').toLowerCase().includes(q);
      const matchPhone = (c.current_phone || c.sender_phone || '').toLowerCase().includes(q);
      const matchMsg = (c.last_message || '').toLowerCase().includes(q);
      if (!matchName && !matchStore && !matchPhone && !matchMsg) return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Qo‘llab-quvvatlash va Murojaatlar
            </h1>
            {unreadTotal > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold animate-pulse">
                {unreadTotal} yangi xabar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Web ilova va @biznesgo_bot orqali do‘kon egalaridan kelgan xabarlarga real vaqtda 2-tomonlama javob berish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF7EE] border border-emerald-200/80 text-xs text-emerald-900 font-medium">
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            <a href="mailto:info@biznesgo.uz" className="font-mono font-semibold hover:underline">info@biznesgo.uz</a>
            <span className="text-emerald-300">•</span>
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <a href="tel:+998908383772" className="hover:underline">+998 90 838 37 72</a>
          </div>
          <button
            type="button"
            onClick={() => fetchConversations()}
            className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Main split content: List and Chat Thread */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Pane: Conversations List */}
        <div className="w-full lg:w-96 flex flex-col bg-white rounded-[32px] border border-slate-200/60 shadow-xs overflow-hidden shrink-0">
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Do‘kon, ism yoki telefon..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[#F6F6F3] border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-300 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5">
              <button
                type="button"
                onClick={() => setFilterSource('all')}
                className={`px-3 py-1.5 rounded-full font-semibold transition cursor-pointer shrink-0 ${
                  filterSource === 'all'
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#F6F6F3] text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Hammasi
              </button>
              <button
                type="button"
                onClick={() => setFilterSource('web')}
                className={`px-3 py-1.5 rounded-full font-semibold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  filterSource === 'web'
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#F6F6F3] text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Web</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterSource('telegram_bot')}
                className={`px-3 py-1.5 rounded-full font-semibold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  filterSource === 'telegram_bot'
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-[#F6F6F3] text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                <Bot className="w-3 h-3" />
                <span>Telegram Bot</span>
              </button>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Murojaatlar topilmadi
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedThread?.thread_id === c.thread_id;
                const bizKey = c.resolved_business_type || c.business_type || 'agro_vet';
                const bizMeta = BIZ_MAP[bizKey] || { label: bizKey, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                const hasUnread = c.unread_count > 0;

                return (
                  <button
                    key={c.thread_id}
                    type="button"
                    onClick={() => handleSelectThread(c)}
                    className={`w-full text-left p-4 transition flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100/90 border-l-4 border-l-black'
                        : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {c.store_name || c.sender_name || 'Mijoz'}
                        </span>
                        {c.source === 'telegram_bot' ? (
                          <span className="shrink-0 p-1 rounded-full bg-sky-50 text-sky-600 border border-sky-100" title="Telegram Bot">
                            <Bot className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="shrink-0 p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100" title="Web Ilova">
                            <Globe className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {hasUnread && (
                          <span className="w-5 h-5 rounded-full bg-[#22C55E] text-slate-950 text-[10px] font-black flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${bizMeta.color} truncate font-medium`}>
                        {bizMeta.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        {c.current_phone || c.sender_phone || ''}
                      </span>
                    </div>

                    <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                      {c.last_message}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread Chat */}
        <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-200/60 shadow-xs overflow-hidden min-h-0">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F6F6F3] border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-sm">
                    {selectedThread.store_name ? selectedThread.store_name[0].toUpperCase() : 'M'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {selectedThread.store_name || selectedThread.sender_name}
                      </h3>
                      {selectedThread.source === 'telegram_bot' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold">
                          <Bot className="w-3 h-3" />
                          <span>Telegram Bot</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                          <Globe className="w-3 h-3" />
                          <span>Web Ilova</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>{selectedThread.sender_name}</span>
                      {(selectedThread.current_phone || selectedThread.sender_phone) && (
                        <a
                          href={`tel:${(selectedThread.current_phone || selectedThread.sender_phone || '').replace(/\s+/g, '')}`}
                          className="text-slate-700 hover:text-black font-medium flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {selectedThread.current_phone || selectedThread.sender_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    BIZ_MAP[selectedThread.resolved_business_type || selectedThread.business_type || 'agro_vet']?.color || 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {BIZ_MAP[selectedThread.resolved_business_type || selectedThread.business_type || 'agro_vet']?.label || selectedThread.business_type}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F8F6]">
                {isLoadingThread && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                    <span>Xabarlar yuklanmoqda...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
                    <span>Ushbu suhbatda hali xabarlar yo‘q</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdmin = m.sender_type === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {isAdmin ? 'Super Admin (Siz)' : m.sender_name || 'Mijoz'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                            isAdmin
                              ? 'bg-black text-white rounded-tr-xs'
                              : 'bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs'
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

              {/* Quick Template Chips */}
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 text-[11px]">
                <span className="text-slate-400 text-[10px] font-bold uppercase shrink-0">Shablonlar:</span>
                <button
                  type="button"
                  onClick={() => setReplyText('Assalomu alaykum! Murojaatingiz qabul qilindi, mutaxassisimiz o‘rganib chiqmoqda.')}
                  className="px-3 py-1 rounded-full bg-[#F6F6F3] text-slate-700 hover:bg-slate-200/70 transition shrink-0 cursor-pointer text-xs"
                >
                  Qabul qilindi
                </button>
                <button
                  type="button"
                  onClick={() => setReplyText('Kredit limiti sozlamalari yangilandi. Ilovani qayta yuklab tekshirib ko‘rishingiz mumkin.')}
                  className="px-3 py-1 rounded-full bg-[#F6F6F3] text-slate-700 hover:bg-slate-200/70 transition shrink-0 cursor-pointer text-xs"
                >
                  Kredit limiti
                </button>
                <button
                  type="button"
                  onClick={() => setReplyText('Iltimos, do‘kon manzili va GPS lokatsiyasini brauzerda tasdiqlab yuboring.')}
                  className="px-3 py-1 rounded-full bg-[#F6F6F3] text-slate-700 hover:bg-slate-200/70 transition shrink-0 cursor-pointer text-xs"
                >
                  Manzil so‘rash
                </button>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedThread.source === 'telegram_bot'
                      ? "Javob yozing (Telegram bot orqali avtomatik jo'natiladi)..."
                      : "Javob yozing (Web ilovada ko'rinadi)..."
                  }
                  disabled={isSending}
                  className="flex-1 px-4 py-2.5 rounded-full bg-[#F6F6F3] border-none text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-300 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs shrink-0"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Javob qaytarish</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-[#F6F6F3] border border-slate-200 flex items-center justify-center mb-3 text-slate-700">
                <MessageSquare className="w-7 h-7 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Murojaatni tanlang</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Chap tarafdagi ro‘yxatdan do‘kon yoki Telegram bot orqali yozilgan xabarlarni tanlang va to‘g‘ridan-to‘g‘ri javob bering.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
