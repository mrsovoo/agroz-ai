"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Send, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "@/lib/api-config";
import { haptic } from "@/lib/telegram";

export type SupportMessageItem = {
  id: number;
  ticketId: number;
  sender: "user" | "admin" | string;
  text: string;
  createdAt: string;
};

export type SupportTicketItem = {
  id: number;
  userType: "user" | "specialist" | string;
  userId?: number | null;
  specialistId?: number | null;
  category: "texnik" | "umumiy" | string;
  status: "yangi" | "javob_berildi" | "yopiq" | string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessageItem[];
};

export default function SupportTicketsPanel() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [category, setCategory] = useState<"umumiy" | "texnik">("umumiy");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<number, string>>({});
  const [sendingReplyId, setSendingReplyId] = useState<number | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/support/tickets");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.ok && Array.isArray(data.items)) {
        setTickets(data.items);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setError("Iltimos, murojaat matnini kamida 3 ta belgi bilan yozing.");
      return;
    }

    setSubmitting(true);
    haptic("medium");
    try {
      const res = await apiFetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, text: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Murojaat yuborishda xatolik yuz berdi.");
        return;
      }
      setText("");
      setFormOpen(false);
      if (data.ticket) {
        setTickets((prev) => [data.ticket, ...prev]);
        setActiveTicketId(data.ticket.id);
      } else {
        await loadTickets();
      }
    } catch {
      setError("Tarmoq xatoligi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReply(ticketId: number) {
    const msgText = (replyTextMap[ticketId] || "").trim();
    if (!msgText) return;

    setSendingReplyId(ticketId);
    haptic("light");
    try {
      const res = await apiFetch(`/api/support/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msgText }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok && data.message) {
        setReplyTextMap((prev) => ({ ...prev, [ticketId]: "" }));
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: "yangi",
                  updatedAt: new Date().toISOString(),
                  messages: [...(t.messages || []), data.message],
                }
              : t,
          ),
        );
      }
    } catch {
      /* ignore */
    } finally {
      setSendingReplyId(null);
    }
  }

  function statusBadge(status: string) {
    if (status === "javob_berildi") {
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-[#039e1e]">
          Javob berildi
        </span>
      );
    }
    if (status === "yopiq") {
      return (
        <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
          Yopiq
        </span>
      );
    }
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
        Kutilmoqda
      </span>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-[18px] font-bold text-neutral-900">
          Yordam / Bog&apos;lanish
        </h2>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            setFormOpen((v) => !v);
            setError(null);
          }}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#039e1e] px-3.5 py-2 text-[13px] font-bold text-white shadow-2xs transition active:scale-95 hover:bg-[#028518]"
        >
          <Plus size={16} />
          <span>Yangi murojaat</span>
        </button>
      </div>

      {/* Yangi murojaat yuborish shakli */}
      {formOpen && (
        <form
          onSubmit={handleCreateTicket}
          className="mb-3.5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xs space-y-3"
        >
          <div>
            <label className="block text-[12.5px] font-bold text-neutral-700 mb-1.5">
              Murojaat turi (kategoriya)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("umumiy")}
                className={`min-h-[42px] rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                  category === "umumiy"
                    ? "border-[#039e1e] bg-emerald-50 text-[#039e1e]"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600"
                }`}
              >
                💬 Umumiy savol
              </button>
              <button
                type="button"
                onClick={() => setCategory("texnik")}
                className={`min-h-[42px] rounded-xl border px-3 py-2 text-[13px] font-bold transition ${
                  category === "texnik"
                    ? "border-[#039e1e] bg-emerald-50 text-[#039e1e]"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600"
                }`}
              >
                🛠 Texnik muammo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-bold text-neutral-700 mb-1.5">
              Xabar matni
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Savolingiz yoki muammoni batafsil yozing..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-[14px] text-neutral-900 outline-none focus:border-[#039e1e] focus:bg-white"
            />
          </div>

          {error && (
            <p className="text-[12.5px] font-semibold text-red-600">{error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-[42px] rounded-xl border border-neutral-200 px-4 py-2 text-[13px] font-bold text-neutral-600 hover:bg-neutral-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#039e1e] px-4 py-2 text-[13px] font-bold text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
            >
              <Send size={15} />
              <span>{submitting ? "Yuborilmoqda..." : "Yuborish"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Murojaatlar ro'yxati va chat ko'rinishi */}
      {loading && tickets.length === 0 ? (
        <div className="rounded-2xl bg-white border border-neutral-200/90 p-5 text-center text-neutral-400 text-[14px]">
          Yuklanmoqda...
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl bg-white border border-neutral-200/90 p-5 text-center text-neutral-500 shadow-2xs">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-[#039e1e]">
            <MessageSquare size={20} />
          </div>
          <p className="text-[14.5px] font-medium">
            Savol yoki muammo bo&apos;lsa, «Yangi murojaat» tugmasi orqali yozing
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket) => {
            const isOpen = activeTicketId === ticket.id;
            const lastMsg =
              ticket.messages && ticket.messages.length > 0
                ? ticket.messages[ticket.messages.length - 1]
                : null;
            const catLabel = ticket.category === "texnik" ? "🛠 Texnik" : "💬 Umumiy";

            return (
              <div
                key={ticket.id}
                className="overflow-hidden rounded-2xl bg-white border border-neutral-200/90 shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveTicketId(isOpen ? null : ticket.id)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-neutral-50 transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-neutral-900">
                        Murojaat #{ticket.id}
                      </span>
                      <span className="text-[12px] font-medium text-neutral-500">
                        · {catLabel}
                      </span>
                      {statusBadge(ticket.status)}
                    </div>
                    {lastMsg && (
                      <p className="mt-1 truncate text-[13px] text-neutral-500">
                        {lastMsg.sender === "admin" ? "Admin: " : "Siz: "}
                        {lastMsg.text}
                      </p>
                    )}
                  </div>
                  {isOpen ? (
                    <ChevronUp size={18} className="shrink-0 text-[#039e1e]" />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 text-neutral-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50/70 p-3.5 space-y-3">
                    {/* Chat xabarlari */}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {(ticket.messages || []).map((msg) => {
                        const isAdmin = msg.sender === "admin";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isAdmin ? "items-start" : "items-end"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug ${
                                isAdmin
                                  ? "bg-white border border-neutral-200 text-neutral-900"
                                  : "bg-[#039e1e] text-white"
                              }`}
                            >
                              <p className="text-[10.5px] font-bold opacity-75 mb-0.5">
                                {isAdmin ? "AgrozGO Admin" : "Siz"}
                              </p>
                              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Javob yozish maydoni */}
                    {ticket.status !== "yopiq" && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={replyTextMap[ticket.id] || ""}
                          onChange={(e) =>
                            setReplyTextMap((prev) => ({
                              ...prev,
                              [ticket.id]: e.target.value,
                            }))
                          }
                          placeholder="Qo'shimcha xabar yozish..."
                          className="flex-1 min-h-[42px] rounded-xl border border-neutral-200 bg-white px-3 text-[13.5px] text-neutral-900 outline-none focus:border-[#039e1e]"
                        />
                        <button
                          type="button"
                          disabled={sendingReplyId === ticket.id}
                          onClick={() => handleSendReply(ticket.id)}
                          className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#039e1e] text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
