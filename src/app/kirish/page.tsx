"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Phone, KeyRound, UserRound, MapPin, ChevronRight, Loader2, Send } from "lucide-react";
import { getTelegram, onTelegramReady, type TelegramUser } from "@/lib/telegram";
import { OTP_LENGTH, OTP_TTL_MINUTES } from "@/lib/constants";

/** Kodni qanday yetkazish rejimi. */
type DeliveryMode = "telegram" | "bot" | "sms" | "dev";

const REGIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Jizzax",
  "Navoiy",
  "Sirdaryo",
  "Qoraqalpog'iston",
];

function normalize(v: string) {
  return v.replace(/\D/g, "").replace(/^998/, "");
}

export default function LoginPage() {
  const router = useRouter();
  // Telegram obyekti faqat brauzerda mavjud — shuning uchun mount'dan keyin o'qiymiz
  // (aks holda SSR va client HTML'i mos kelmay, hydration xatosi chiqadi).
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [mode, setMode] = useState<DeliveryMode>("dev");
  const [token, setToken] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(OTP_TTL_MINUTES);
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Telegram SDK kech yuklanishi mumkin — tayyor bo'lganda userni olamiz.
  useEffect(() => onTelegramReady((tg) => setTgUser(tg.initDataUnsafe?.user ?? null)), []);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Mini App ichida bo'lsak initData yuboramiz — kod to'g'ridan-to'g'ri chatga ketadi.
        body: JSON.stringify({ phone: phoneInput, initData: getTelegram()?.initData }),
      });
      const data = (await res.json()) as {
        phone?: string;
        mode?: DeliveryMode;
        token?: string;
        deepLink?: string;
        chatLink?: string;
        devCode?: string;
        expiresInMinutes?: number;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      setPhone(data.phone ?? "");
      setMode(data.mode ?? "dev");
      setToken(data.token ?? "");
      setDeepLink(data.deepLink ?? "");
      setChatLink(data.chatLink ?? "");
      setDevCode(data.devCode ?? "");
      setTtlMinutes(data.expiresInMinutes ?? OTP_TTL_MINUTES);
      setCode("");
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function telegramLogin() {
    const tg = getTelegram();
    if (!tg?.initData) {
      setError("Bu funksiya faqat Telegram ilovasi ichida ishlaydi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: tg.initData, name, region }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      // Telegram rejimida kod token bo'yicha, aks holda raqam bo'yicha tekshiriladi.
      const payload =
        mode === "telegram" ? { token, code, name, region } : { phone, code, name, region };
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kod noto'g'ri");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[90dvh] flex-col px-5 pt-6">
      <div className="flex flex-col items-center py-6">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[22px] text-[var(--brand-ink)]"
          style={{ background: "var(--brand-yellow)" }}
        >
          <Sprout size={34} />
        </div>
        <h1 className="ios-title mt-3 text-center">AgroVet AI</h1>
        <p className="ios-sub mt-1 text-center">Dehqon va chorvador yordamchisi</p>
      </div>

      <div className="ios-card p-5">
        {tgUser && (
          <div className="mb-4">
            <button
              onClick={telegramLogin}
              disabled={busy}
              className="ios-btn"
              style={{ background: "#2AABEE" }}
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {tgUser.first_name || "Telegram"} orqali kirish
            </button>
            <p className="mt-2 text-center text-[11px] text-[var(--brand-muted)]">
              Bir bosishda, SMS kodsiz kirish
            </p>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[var(--brand-sep)]" />
              <span className="text-[11px] font-bold uppercase text-[var(--brand-muted)]">
                yoki SMS orqali
              </span>
              <span className="h-px flex-1 bg-[var(--brand-sep)]" />
            </div>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                <Phone size={12} /> Telefon raqam
              </label>
              <div className="flex items-center rounded-2xl bg-[var(--brand-bg)] pl-4">
                <span className="pr-2 text-[17px] font-bold text-[var(--brand-muted)]">+998</span>
                <input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(normalize(e.target.value))}
                  inputMode="tel"
                  placeholder="90 123 45 67"
                  maxLength={9}
                  className="ios-input !bg-transparent !p-4 !pl-0"
                />
              </div>
            </div>
            <button onClick={sendCode} disabled={busy || phoneInput.length < 9} className="ios-btn">
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {busy ? "Yuborilmoqda..." : "Tasdiqlash kodini olish"}
            </button>
            <p className="text-center text-[11px] leading-relaxed text-[var(--brand-muted)]">
              Kod Telegram bot orqali yuboriladi (bepul) yoki SMS orqali.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mode === "bot" ? (
              <>
                <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium leading-relaxed text-[var(--brand-ink)]">
                  ✅ Kod <b>Telegram botimizga</b> yuborildi. Chatni ochib kodni nusxalab,
                  pastdagi maydonga yozing.
                </p>
                {chatLink && (
                  <a
                    href={chatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ios-btn"
                    style={{ background: "#2AABEE" }}
                  >
                    <Send size={18} /> Telegram chatni ochish
                  </a>
                )}
                <p className="text-center text-[12px] font-medium text-[var(--brand-muted)]">
                  Kod {ttlMinutes} daqiqa amal qiladi.
                </p>
              </>
            ) : mode === "telegram" ? (
              <>
                <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium leading-relaxed text-[var(--brand-ink)]">
                  <b>{phone}</b> raqamini tasdiqlash uchun Telegram botga o&apos;ting. Botda{" "}
                  <b>«Start»</b> tugmasini bosing — kod shu chatda chiqadi.
                </p>
                {deepLink && (
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ios-btn"
                    style={{ background: "#2AABEE" }}
                  >
                    <Send size={18} /> Telegram&apos;ni ochib, kodni olish
                  </a>
                )}
                <p className="text-center text-[12px] font-medium text-[var(--brand-muted)]">
                  Kod {ttlMinutes} daqiqa amal qiladi. Kodni nusxalab pastga yozing.
                </p>
              </>
            ) : mode === "sms" ? (
              <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium text-[var(--brand-ink)]">
                <b>{phone}</b> raqamiga SMS yuborildi. Kod {ttlMinutes} daqiqa amal qiladi.
              </p>
            ) : (
              <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium text-[var(--brand-ink)]">
                Demo rejim: <b>{phone}</b> raqami uchun tasdiqlash kodi{" "}
                <b className="tracking-[0.3em]">{devCode}</b>
              </p>
            )}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                <KeyRound size={12} /> {OTP_LENGTH} xonali kod
              </label>
              <input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                }
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                placeholder={"•".repeat(OTP_LENGTH)}
                className="ios-input text-center text-[28px] font-black tracking-[0.5em]"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                <UserRound size={12} /> Ismingiz (ixtiyoriy)
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ismingiz"
                className="ios-input"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                <MapPin size={12} /> Hudud
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="ios-input appearance-none"
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <button
              onClick={verify}
              disabled={busy || code.length !== OTP_LENGTH}
              className="ios-btn"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {busy ? "Tasdiqlanmoqda..." : "Kirish"}
              {!busy && <ChevronRight size={18} />}
            </button>
            {mode === "telegram" && deepLink && (
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1 text-center text-[13px] font-bold"
                style={{ color: "#2AABEE" }}
              >
                Kod chiqmadi? Botni qayta ochish
              </a>
            )}
            {mode === "bot" && chatLink && (
              <a
                href={chatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1 text-center text-[13px] font-bold"
                style={{ color: "#2AABEE" }}
              >
                Kod kelmadimi? Botga qayta o&apos;tish
              </a>
            )}
            <button onClick={() => setStep(1)} className="ios-btn secondary">
              Raqamni o&apos;zgartirish
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-2xl bg-[var(--brand-red-soft)] p-3 text-[13px] font-semibold text-[#d7263d]">
            {error}
          </p>
        )}
      </div>

      <p className="mt-auto pt-6 text-center text-[11px] text-[var(--brand-muted)]">
        SMS orqali kirishda maxfiylik siyosatiga rozilik bildirasiz.
      </p>
    </main>
  );
}
