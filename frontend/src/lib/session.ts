import { cookies } from "next/headers";
import { apiUrl } from "@/lib/api-config";

export const SESSION_COOKIE = "agroai_session";
/** Bitta so'rovda user + diagnoses qaytaradi */
async function getProfileData(): Promise<{ user: any; diagnoses: any[] } | null> {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;

  try {
    const res = await fetch(apiUrl("/api/profile"), {
      headers: { Authorization: `Bearer ${sid}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok?: boolean; user?: any; diagnoses?: any[] };
    if (!json.user) return null;
    return { user: json.user, diagnoses: Array.isArray(json.diagnoses) ? json.diagnoses : [] };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{
  id: number;
  phone: string | null;
  name: string | null;
  telegramId?: number | null;
  region: string | null;
  district: string | null;
} | null> {
  const data = await getProfileData();
  return data?.user ?? null;
}

export async function getUserRecentDiagnoses(): Promise<any[]> {
  const data = await getProfileData();
  return data?.diagnoses ?? [];
}
