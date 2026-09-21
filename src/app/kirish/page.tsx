"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Phone,
  KeyRound,
  UserRound,
  MapPin,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
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
  const [authMethod, setAuthMethod] = useState<"telegram" | "phone">("telegram");
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  // Telefon orqali kirish state'lari
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

  // Telegram orqali kirish state'lari (vebda)
  const [tgUsername, setTgUsername] = useState("");

  // Profil maydonlari
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Telegram WebApp yuklanganligini aniqlash
  useEffect(() => {
    onTelegramReady((tg) => {
      const user = tg.initDataUnsafe?.user ?? null;
      if (user) {
        setTgUser(user);
        setAuthMethod("telegram");
      }
    });
  }, []);

  async function telegramWebLogin() {
    setBusy(true);
    setError(null);
    try {
      const tg = getTelegram();
      const payload: {
        initData?: string;
        username?: string;
        name?: string;
        region?: string;
      } = {
        name,
        region,
      };

      if (tg?.initData) {
        payload.initData = tg.initData;
      } else {
        const u = tgUsername.trim().replace(/^@/, "");
        if (!u) {
          throw new Error("Iltimos, Telegram username yoki nomingizni kiriting");
        }
        payload.username = u;
      }

      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kirishda xatolik yuz berdi");

      router.push("/profil");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const payload =
        mode === "telegram" ? { token, code, name, region } : { phone, code, name, region };
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kod noto'g'ri");
      router.push("/profil");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[90dvh] flex-col px-5 pt-6 web:justify-center">
      <div className="web:mx-auto web:grid web:w-full web:max-w-[1040px] web:grid-cols-[minmax(0,1fr)_460px] web:items-center web:gap-16 web:pb-8">
        {/* Chap qism: Ta'rif */}
        <div className="flex flex-col items-center py-6 web:items-start web:py-0">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[22px] text-[var(--brand-ink)] shadow-md web:h-20 web:w-20 web:rounded-[26px]"
            style={{ background: "var(--brand-yellow)" }}
          >
            <Sprout size={34} />
          </div>
          <h1 className="ios-title mt-3 text-center web:mt-5 web:text-left web:text-[50px]">
            Agroz AI Profil
          </h1>
          <p className="ios-sub mt-2 text-center web:max-w-[400px] web:text-left web:text-[16px] leading-relaxed">
            Dehqon va chorvadorlar uchun sun&apos;iy intellekt yordamchisi. Kasalliklarni bir zumda aniqlang,
            tarixni saqlang va yaqin dorixonalarga murojaat qiling.
          </p>

          <div className="mt-6 hidden flex-col gap-3 web:flex">
            <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-800">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>Tezkor va xavfsiz avtorizatsiya</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm font-medium text-emerald-800">
              <Zap size={18} className="text-emerald-600" />
              <span>Telegram orqali 1 bosishda SMS-kod kutmasdan kirish</span>
            </div>
          </div>
        </div>

        {/* O'ng qism: Kirish kartochkasi */}
        <div className="ios-card p-5 shadow-lg web:p-7">
          {/* Kirish usullari tablari */}
          <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("telegram");
                setError(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                authMethod === "telegram"
                  ? "bg-white text-sky-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Send size={15} />
              <span>Telegram orqali</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setError(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                authMethod === "phone"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Phone size={15} />
              <span>Telefon / SMS</span>
            </button>
          </div>

          {/* TELEGRAM ORQALI KIRISH */}
          {authMethod === "telegram" && (
            <div className="space-y-4">
              {tgUser ? (
                /* Telegram MiniApp ichida to'g'ridan-to'g'ri 1 bosishda */
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-lg font-black text-white">
                      {(tgUser.first_name || "T").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{tgUser.first_name} {tgUser.last_name ?? ""}</p>
                      <p className="text-xs text-slate-500">
                        {tgUser.username ? `@${tgUser.username}` : `ID: ${tgUser.id}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      <MapPin size={12} /> Hududingiz
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
                    type="button"
                    onClick={telegramWebLogin}
                    disabled={busy}
                    className="ios-btn"
                    style={{ background: "#2AABEE" }}
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {tgUser.first_name || "Telegram"} hisobi bilan kirish
                  </button>
                  <p className="text-center text-[11px] text-slate-500">
                    Siz Telegram Mini App ichidasiz. Kod kiritish talab qilinmaydi.
                  </p>
                </div>
              ) : (
                /* Veb-brauzerda Telegram orqali kirish */
                <div className="space-y-3">
                  <p className="rounded-xl bg-sky-50 p-3 text-xs leading-relaxed text-sky-900">
                    ⚡ <b>Telegram orqali tezkor kirish</b>: Telegram username yoki taxallusingizni kiriting va bir zumda profilingizga kiring.
                  </p>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      <Send size={12} className="text-sky-500" /> Telegram username yoki telefon
                    </label>
                    <div className="flex items-center rounded-2xl bg-[var(--brand-bg)] px-3">
                      <span className="font-bold text-sky-500">@</span>
                      <input
                        value={tgUsername}
                        onChange={(e) => setTgUsername(e.target.value)}
                        placeholder="masalan: dehqon_akbar"
                        className="ios-input !bg-transparent !p-3 !pl-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      <UserRound size={12} /> Ismingiz (ixtiyoriy)
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ism va familiyangiz"
                      className="ios-input !p-3"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                      <MapPin size={12} /> Hududingiz
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="ios-input appearance-none !p-3"
                    >
                      {REGIONS.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={telegramWebLogin}
                    disabled={busy || !tgUsername.trim()}
                    className="ios-btn"
                    style={{ background: "#2AABEE" }}
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Telegram orqali tasdiqlash
                  </button>

                  <div className="pt-2 text-center">
                    <a
                      href="https://t.me/agroz_ai_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:underline"
                    >
                      <Sparkles size={13} />
                      @agroz_ai_bot Telegram botimizni ochish
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TELEFON / SMS ORQALI KIRISH */}
          {authMethod === "phone" && (
            <div>
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
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy || phoneInput.length < 9}
                    className="ios-btn"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                    {busy ? "Yuborilmoqda..." : "Tasdiqlash kodini olish"}
                  </button>
                  <p className="text-center text-[11px] leading-relaxed text-[var(--brand-muted)]">
                    Tasdiqlash kodi Telegram bot orqali yoki SMS ko'rinishida yuboriladi.
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
                    </>
                  ) : mode === "telegram" ? (
                    <>
                      <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium leading-relaxed text-[var(--brand-ink)]">
                        <b>{phone}</b> raqamini tasdiqlash uchun Telegram botga o&apos;ting. Botda{" "}
                        <b>«Start»</b> tugmasini bosing — kod chatda ko'rinadi.
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
                    </>
                  ) : mode === "sms" ? (
                    <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium text-[var(--brand-ink)]">
                      <b>{phone}</b> raqamiga SMS yuborildi. Kod {ttlMinutes} daqiqa amal qiladi.
                    </p>
                  ) : (
                    <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium text-[var(--brand-ink)]">
                      Demo rejim: <b>{phone}</b> raqami uchun tasdiqlash kodi:{" "}
                      <b className="tracking-[0.3em] text-emerald-700">{devCode}</b>
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
                    type="button"
                    onClick={verify}
                    disabled={busy || code.length !== OTP_LENGTH}
                    className="ios-btn"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                    {busy ? "Tasdiqlanmoqda..." : "Kirish"}
                    {!busy && <ChevronRight size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="ios-btn secondary"
                  >
                    Raqamni o&apos;zgartirish
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-2xl bg-[var(--brand-red-soft)] p-3 text-[13px] font-semibold text-[#d7263d]">
              {error}
            </p>
          )}
        </div>
      </div>

      <p className="mt-auto pt-6 text-center text-[11px] text-[var(--brand-muted)] web:pt-2">
        Agroz AI · Ma&apos;lumotlar himoyalangan va xavfsiz saqlanadi.
      </p>
    </main>
  );
}
