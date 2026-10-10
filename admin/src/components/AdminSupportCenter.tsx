"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Send, RefreshCw, CheckCircle2, Clock, Lock } from "lucide-react";

type SupportMessage = {
  id: number;
  ticketId: number;
  sender: "user" | "admin" | string;
  text: string;
  createdAt: string;
};

type SupportTicket = {
  id: number;
  userType: "user" | "specialist" | string;
  userId?: number | null;
  specialistId?: number | null;
  telegramId?: number | null;
  chatId?: number | null;
  senderName: string;
  senderPhone?: string | null;
  category: "texnik" | "umumiy" | string;
  status: "yangi" | "javob_berildi" | "yopiq" | string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
};

async function adminFetch(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  const token =
    typeof window !== "undefined" ? localStorage.getItem("agroz_admin_session") : null;
  if (token) {
    headers.set("x-admin-session", token);
  }
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });
}

export default function AdminSupportCenter() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState({ total: 0, yangi: 0, javob_berildi: 0, yopiq: 0 });
  const [statusFilter, setStatusFilter] = useState<"all" | "yangi" | "javob_berildi" | "yopiq">("all");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/support/tickets?status=${statusFilter}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok) {
        const items: SupportTicket[] = Array.isArray(data.items) ? data.items : [];
        setTickets(items);
        if (data.counts) setCounts(data.counts);
        if (items.length > 0 && selectedTicketId === null) {
          setSelectedTicketId(items[0].id);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedTicketId]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  async function handleReply(e: React.FormEvent, closeTicket = false) {
    e.preventDefault();
    if (!activeTicket) return;
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setSending(true);
    setNotice(null);
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${activeTicket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ text: trimmed, closeTicket }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setNotice({ kind: "err", text: data?.error || "Javob yuborishda xatolik" });
        return;
      }

      setReplyText("");
      setNotice({
        kind: "ok",
        text: data.telegramDelivered
          ? `✅ Javob saqlandi va Telegram (chat_id: ${activeTicket.chatId}) orqali yuborildi!`
          : "✅ Javob bazaga saqlandi (foydalanuvchi profilida ko'rinadi).",
      });
      await loadTickets();
    } catch (error: any) {
      setNotice({ kind: "err", text: error.message || "Tarmoq xatoligi" });
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(ticketId: number, status: "yangi" | "javob_berildi" | "yopiq") {
    try {
      const res = await adminFetch(`/api/admin/support/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadTickets();
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {/* Header va Filtrlar */}
      <div className="rounded-2xl bg-white p-5 border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <MessageSquare size={18} /> Murojaatlar va Qo&apos;llab-quvvatlash (Support)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Fermer, dorixona va mutaxassislarning murojaatlari. Javob yozganingizda xabar foydalanuvchining Telegram chat_id siga avtomatik boradi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200/80 text-xs font-semibold">
            {(
              [
                { id: "all", label: `Barchasi (${counts.total})` },
                { id: "yangi", label: `Yangi (${counts.yangi})` },
                { id: "javob_berildi", label: `Javob berilgan (${counts.javob_berildi})` },
                { id: "yopiq", label: `Yopiq (${counts.yopiq})` },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === st.id
                    ? "bg-white text-zinc-900 font-bold shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadTickets}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`rounded-xl p-3 text-xs font-semibold border ${
            notice.kind === "ok"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 2 ustunli panel: Chapda ro'yxat, O'ngda suhbat (chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chap ustun: Murojaatlar ro'yxati */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold text-zinc-700">
            Murojaatlar ro&apos;yxati ({tickets.length})
          </div>

          {tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              Hozircha murojaatlar yo&apos;q.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
              {tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const lastMsg =
                  t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1] : null;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTicketId(t.id);
                      setNotice(null);
                    }}
                    className={`w-full text-left p-4 transition ${
                      isSelected ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold">
                        #{t.id} · {t.senderName}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                          t.status === "yangi"
                            ? "bg-amber-100 text-amber-900"
                            : t.status === "javob_berildi"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div
                      className={`mt-1 flex items-center gap-2 text-[11px] ${
                        isSelected ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    >
                      <span>{t.userType === "specialist" ? "🏪 Mutaxassis/Dorixona" : "👨‍🌾 Fermer"}</span>
                      <span>·</span>
                      <span>{t.category === "texnik" ? "🛠 Texnik" : "💬 Umumiy"}</span>
                      {t.senderPhone && (
                        <>
                          <span>·</span>
                          <span className="font-mono">{t.senderPhone}</span>
                        </>
                      )}
                    </div>

                    {lastMsg && (
                      <p
                        className={`mt-2 truncate text-xs ${
                          isSelected ? "text-zinc-200" : "text-zinc-600"
                        }`}
                      >
                        {lastMsg.sender === "admin" ? "Admin: " : ""}
                        {lastMsg.text}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* O'ng ustun: Tanlangan ticket va javob yozish */}
        <div className="lg:col-span-7 rounded-2xl bg-white border border-zinc-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col">
          {!activeTicket ? (
            <div className="flex flex-1 items-center justify-center p-12 text-xs text-zinc-400">
              Chap ro&apos;yxatdan murojaatni tanlang
            </div>
          ) : (
            <>
              {/* Ticket sarlavhasi */}
              <div className="border-b border-zinc-200 bg-zinc-50 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    Murojaat #{activeTicket.id} — {activeTicket.senderName}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {activeTicket.senderPhone ? `📞 ${activeTicket.senderPhone} · ` : ""}
                    {activeTicket.chatId
                      ? `Telegram chat_id: ${activeTicket.chatId}`
                      : "Telegram ulanmagan (faqat veb profil)"}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeTicket.status !== "yopiq" ? (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(activeTicket.id, "yopiq")}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      <Lock size={12} />
                      <span>Yopish</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(activeTicket.id, "yangi")}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      <Clock size={12} />
                      <span>Qayta ochish</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Xabarlar tarixi */}
              <div className="flex-1 p-4 space-y-3 max-h-[420px] overflow-y-auto bg-zinc-50/40">
                {(activeTicket.messages || []).map((m) => {
                  const isAdmin = m.sender === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-zinc-900 text-white"
                            : "bg-white border border-zinc-200 text-zinc-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1 opacity-70 text-[10px] font-mono">
                          <span>{isAdmin ? "AgrozGO Admin" : activeTicket.senderName}</span>
                          <span>
                            {new Date(m.createdAt).toLocaleString("uz-UZ", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Javob yozish */}
              <form onSubmit={(e) => handleReply(e, false)} className="border-t border-zinc-200 p-4 bg-white space-y-3">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Foydalanuvchiga javob yozing (Telegram chat_id ga boradi)..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-900 focus:border-zinc-400 focus:bg-white focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-500">
                    {activeTicket.chatId
                      ? `✅ Javob Telegram orqali yuboriladi (ID: ${activeTicket.chatId})`
                      : "ℹ️ Javob faqat veb-profilda ko'rinadi"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={sending || !replyText.trim()}
                      onClick={(e) => handleReply(e, true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-100 px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} />
                      <span>Javob berish va yopish</span>
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      <Send size={14} />
                      <span>{sending ? "Yuborilmoqda..." : "Javob yuborish"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
