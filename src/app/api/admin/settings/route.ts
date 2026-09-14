import { requireAdmin, setAdminPassword } from "@/lib/admin-auth";
import { getSettingsStatus, setSetting, setSettings, SETTING_KEYS, type SettingKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set<string>(Object.values(SETTING_KEYS));

/** Sozlamalar ro'yxati — maxfiy maydonlar maskalangan ko'rinishda. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const settings = await getSettingsStatus();
  return Response.json({ ok: true, settings });
}

/** Sozlamalarni yangilash: {values: {key: value}}. Bo'sh satr — env'ga qaytarish. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    values?: Record<string, string>;
  };
  const values = body.values ?? {};
  const entries: { key: SettingKey; value: string }[] = [];

  for (const [key, value] of Object.entries(values)) {
    if (!ALLOWED_KEYS.has(key)) {
      return Response.json({ error: `Noma'lum kalit: ${key}` }, { status: 400 });
    }
    if (typeof value !== "string") {
      return Response.json({ error: `Noto'g'ri qiymat: ${key}` }, { status: 400 });
    }
    entries.push({ key: key as SettingKey, value });
  }

  // Admin paroli maxsus: bazada faqat SHA-256 hash saqlanadi.
  const passEntry = entries.find((e) => e.key === SETTING_KEYS.adminPassword);
  const rest = entries.filter((e) => e.key !== SETTING_KEYS.adminPassword);
  if (passEntry && passEntry.value.trim()) {
    await setAdminPassword(passEntry.value);
  } else if (passEntry) {
    // Bo'sh qiymat — parolni o'chirish (env'ga qaytish).
    await setSetting(SETTING_KEYS.adminPassword, "");
  }
  await setSettings(rest);
  const settings = await getSettingsStatus();
  return Response.json({ ok: true, settings });
}
