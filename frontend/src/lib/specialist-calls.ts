/**
 * Mutaxassis chaqiruvlari (Specialist Requests/Calls) ombori.
 * Mijoz mutaxassisni chaqirgach, ish yakunlanganda fikr va reyting beradi.
 */

export type SpecialistCall = {
  id: string;
  specialistId: number;
  specialistName: string;
  customerName: string;
  customerPhone: string;
  problem: string;
  address?: string;
  status: "pending" | "completed" | "cancelled";
  createdAt: number;
  completedAt?: number;
  stars?: number;
  feedback?: string;
};

const STORAGE_KEY = "agroz:specialist-calls:v1";
export const CALLS_EVENT = "agroz:specialist-calls-changed";

export function getSpecialistCalls(): SpecialistCall[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSpecialistCalls(calls: SpecialistCall[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
    window.dispatchEvent(new Event(CALLS_EVENT));
  } catch {}
}

export function getActiveCallForSpecialist(specialistId: number): SpecialistCall | null {
  const calls = getSpecialistCalls();
  return calls.find((c) => c.specialistId === specialistId && c.status === "pending") || null;
}

export function createSpecialistCall(params: {
  specialistId: number;
  specialistName: string;
  customerName: string;
  customerPhone: string;
  problem: string;
  address?: string;
}): SpecialistCall {
  const newCall: SpecialistCall = {
    id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    specialistId: params.specialistId,
    specialistName: params.specialistName,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    problem: params.problem,
    address: params.address,
    status: "pending",
    createdAt: Date.now(),
  };

  const existing = getSpecialistCalls();
  saveSpecialistCalls([newCall, ...existing]);
  return newCall;
}

export async function completeSpecialistCall(
  callId: string,
  stars: number,
  feedback?: string,
): Promise<{ ok: boolean; avg?: number; count?: number }> {
  const calls = getSpecialistCalls();
  const target = calls.find((c) => c.id === callId);
  if (!target) return { ok: false };

  target.status = "completed";
  target.completedAt = Date.now();
  target.stars = stars;
  target.feedback = feedback?.trim() || undefined;

  saveSpecialistCalls(calls);

  // Backendga reytingni yuboramiz
  try {
    const res = await fetch("/api/specialists/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specialistId: target.specialistId,
        stars,
        callId: target.id,
        feedback: target.feedback,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, avg: data.avg, count: data.count };
    }
  } catch {
    // Tarmoq xatosi bo'lsa ham local saqlandi
  }

  return { ok: true };
}

