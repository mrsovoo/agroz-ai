import { cookies } from "next/headers";
import { SESSION_TTL_DAYS } from "@/lib/constants";
import { apiUrl } from "@/lib/api-config";

export const SESSION_COOKIE = "agroai_session";
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export async function getCurrentUser(): Promise<{
  id: number;
  phone: string | null;
  name: string | null;
  telegramId?: number | null;
  region: string | null;
  district: string | null;
} | null> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  try {
    const res = await fetch(apiUrl("/api/profile"), {
      headers: { Authorization: `Bearer ${sid}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; user?: any };
    return json.user ?? null;
  } catch {
    return null;
  }
}

export async function getUserRecentDiagnoses(): Promise<any[]> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return [];

  try {
    const res = await fetch(apiUrl("/api/profile"), {
      headers: { Authorization: `Bearer ${sid}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { ok?: boolean; diagnoses?: any[] };
    return Array.isArray(json.diagnoses) ? json.diagnoses : [];
  } catch {
    return [];
  }
}
