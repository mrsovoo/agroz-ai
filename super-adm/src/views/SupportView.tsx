import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import type { SupportConversation, SupportChatMessage, BusinessType } from '../types';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Bot, 
  Globe, 
  Search, 
  RefreshCw, 
  CheckCheck, 
  ShieldAlert, 
  Store,
  Clock,
  Sparkles,
  ExternalLink,
  Tag
} from 'lucide-react';

const BIZ_MAP: Record<string, { label: string; color: string }> = {
  agro_vet: { label: '🌿 Agro-Vet', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  feed: { label: '🌾 Yem-Ozuqa', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  warehouse: { label: '🏢 Ulgurji Ombor', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  seeds: { label: '🌱 Urug‘chilik', color: 'bg-lime-500/10 text-lime-400 border-lime-500/30' },
  machinery: { label: '🔧 Jihoz & Texnika', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
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

      // Agar oldin tanlangan suhbat bo'lsa, uni yangilaymiz
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
      // Agar o'qilmagan bo'lsa, suhbat ro'yxatida unread_count ni 0 ga tushirish
      setConversations((prev) =>
        prev.map((c) => (c.thread_id === thread.thread_id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err: any) {
      console.warn('Error fetching thread messages:', err);
    } finally {
      if (!silent) setIsLoadingThread(false);
    }
  };

  // Har 5 soniyada suhbatlar va ochiq chatni yangilash
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
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/40">
            <MessageSquare className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Qo‘llab-quvvatlash va Murojaatlar</h1>
              {unreadTotal > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold animate-pulse">
                  {unreadTotal} yangi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Web ilova va @biznesgo_bot orqali do‘kon egalaridan kelgan xabarlar (2-tomonlama javob berish)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchConversations()}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Main split content: List and Chat Thread */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Pane: Conversations List */}
        <div className="w-full lg:w-96 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shrink-0">
          {/* Search & Filters */}
          <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Do‘kon, ism yoki telefon..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
              <button
                type="button"
                onClick={() => setFilterSource('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  filterSource === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Hammasi
              </button>
              <button
                type="button"
                onClick={() => setFilterSource('web')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  filterSource === 'web'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Web</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterSource('telegram_bot')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  filterSource === 'telegram_bot'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bot className="w-3 h-3" />
                <span>Telegram Bot</span>
              </button>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Murojaatlar topilmadi
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isSelected = selectedThread?.thread_id === c.thread_id;
                const bizKey = c.resolved_business_type || c.business_type || 'agro_vet';
                const bizMeta = BIZ_MAP[bizKey] || { label: bizKey, color: 'bg-slate-800 text-slate-300 border-slate-700' };
                const hasUnread = c.unread_count > 0;

                return (
                  <button
                    key={c.thread_id}
                    type="button"
                    onClick={() => handleSelectThread(c)}
                    className={`w-full text-left p-3.5 transition flex flex-col gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-l-4 border-l-emerald-500'
                        : 'hover:bg-slate-900/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-white truncate">
                          {c.store_name || c.sender_name || 'Mijoz'}
                        </span>
                        {c.source === 'telegram_bot' ? (
                          <span className="shrink-0 p-0.5 rounded bg-sky-500/10 text-sky-400" title="Telegram Bot">
                            <Bot className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="shrink-0 p-0.5 rounded bg-emerald-500/10 text-emerald-400" title="Web Ilova">
                            <Globe className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {hasUnread && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${bizMeta.color} truncate font-semibold`}>
                        {bizMeta.label}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {c.current_phone || c.sender_phone || ''}
                      </span>
                    </div>

                    <p className={`text-xs truncate ${hasUnread ? 'text-white font-semibold' : 'text-slate-400'}`}>
                      {c.last_message}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread Chat */}
        <div className="flex-1 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden min-h-0">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
                    {selectedThread.store_name ? selectedThread.store_name[0].toUpperCase() : 'M'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {selectedThread.store_name || selectedThread.sender_name}
                      </h3>
                      {selectedThread.source === 'telegram_bot' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-medium">
                          <Bot className="w-3 h-3" />
                          <span>Telegram Bot</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                          <Globe className="w-3 h-3" />
                          <span>Web Ilova</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span>{selectedThread.sender_name}</span>
                      {(selectedThread.current_phone || selectedThread.sender_phone) && (
                        <a
                          href={`tel:${(selectedThread.current_phone || selectedThread.sender_phone || '').replace(/\s+/g, '')}`}
                          className="text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {selectedThread.current_phone || selectedThread.sender_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-lg border ${
                    BIZ_MAP[selectedThread.resolved_business_type || selectedThread.business_type || 'agro_vet']?.color || 'bg-slate-800 text-slate-300'
                  }`}>
                    {BIZ_MAP[selectedThread.resolved_business_type || selectedThread.business_type || 'agro_vet']?.label || selectedThread.business_type}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/20">
                {isLoadingThread && messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Xabarlar yuklanmoqda...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
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
                          <span className="text-[10px] font-bold text-slate-400">
                            {isAdmin ? 'Super Admin (Siz)' : m.sender_name || 'Mijoz'}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-xs'
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
              <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 text-[11px]">
                <span className="text-slate-500 text-[10px] font-bold uppercase shrink-0">Shablonlar:</span>
                <button
                  type="button"
                  onClick={() => setReplyText('Assalomu alaykum! Murojaatingiz qabul qilindi, mutaxassisimiz o‘rganib chiqmoqda.')}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
                >
                  Qabul qilindi
                </button>
                <button
                  type="button"
                  onClick={() => setReplyText('Kredit limiti sozlamalari yangilandi. Ilovani qayta yuklab tekshirib ko‘rishingiz mumkin.')}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
                >
                  Kredit limiti
                </button>
                <button
                  type="button"
                  onClick={() => setReplyText('Iltimos, do‘kon manzili va GPS lokatsiyasini brauzerda tasdiqlab yuboring.')}
                  className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0"
                >
                  Manzil so‘rash
                </button>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
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
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || isSending}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40 shrink-0"
                >
                  {isSending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Javob qaytarish</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-emerald-400">
                <MessageSquare className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Murojaatni tanlang</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Chap tarafdagi ro‘yxatdan do‘kon yoki Telegram bot orqali yozilgan xabarlarni tanlang va to‘g‘ridan-to‘g‘ri javob bering.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

