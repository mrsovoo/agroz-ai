import { OTP_TTL_MINUTES } from "@/lib/constants";
import { getSetting, SETTING_KEYS } from "@/lib/settings";

/**
 * Real SMS yuborish. Hozir Eskiz.uz qo'llab-quvvatlanadi (O'zbekistonda eng ko'p
 * ishlatiladigan provayder). Email/parol admin panel orqali ham sozlanadi
 * (DB'dagi qiymat env'dan ustun turadi), aks holda OTP oqimi "dev rejim"ga tushadi.
 *
 * Diqqat: Eskiz'da yuboriladigan matn moderatsiyadan o'tgan shablon bilan mos
 * bo'lishi kerak. `ESKIZ_FROM` standart qiymati — test uchun `4546`.
 */

type CachedToken = { token: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

export async function smsConfigured(): Promise<boolean> {
  const [email, password] = await Promise.all([
    getSetting(SETTING_KEYS.eskizEmail),
    getSetting(SETTING_KEYS.eskizPassword),
  ]);
  return Boolean(email && password);
}

async function getEskizToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const [email, password] = await Promise.all([
    getSetting(SETTING_KEYS.eskizEmail),
    getSetting(SETTING_KEYS.eskizPassword),
  ]);
  if (!email || !password) return null;

  const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.error("[sms] Eskiz auth xatosi:", res.status);
    return null;
  }
  const json = (await res.json()) as { data?: { token?: string } };
  const token = json.data?.token;
  if (!token) return null;
  // Eskiz tokeni ~24 soat amal qiladi, xavfsiz tomondan 20 soat saqlaymiz.
  cachedToken = { token, expiresAt: Date.now() + 20 * 60 * 60 * 1000 };
  return token;
}

export async function sendOtpSms(phone: string, code: string): Promise<boolean> {
  if (!(await smsConfigured())) return false;
  try {
    const token = await getEskizToken();
    if (!token) return false;
    const form = new FormData();
    form.append("mobile_phone", phone.replace(/\D/g, ""));
    form.append(
      "message",
      `Agroz AI tasdiqlash kodi: ${code}. Kod ${OTP_TTL_MINUTES} daqiqa amal qiladi.`,
    );
    form.append("from", (await getSetting(SETTING_KEYS.eskizFrom)) ?? "4546");
    const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      console.error("[sms] Eskiz yuborish xatosi:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms] SMS yuborilmadi:", err);
    return false;
  }
}
