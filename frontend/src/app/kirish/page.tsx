"use client";

import { useEffect, useState, useRef } from "react";
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
  ShieldCheck,
  Zap,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { getTelegram, onTelegramReady, type TelegramUser } from "@/lib/telegram";
import { OTP_LENGTH, OTP_TTL_MINUTES } from "@/lib/constants";

type DeliveryMode = "telegram" | "bot" | "sms" | "dev";

const REGIONS = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Samarqand",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Buxoro",
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
  const [authMethod, setAuthMethod] = useState<"telegram" | "quick" | "phone">("telegram");
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null);

  // Telegram bot orqali 1 bosishda kirish state'lari
  const [waitingBot, setWaitingBot] = useState(false);
  const [botStartUrl, setBotStartUrl] = useState("");
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tezkor kirish state'lari (Ism + Hudud)
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);

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

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Polling tozalash
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Telegram WebApp yuklanganligini aniqlash va avtomatik login taklif qilish
  useEffect(() => {
    onTelegramReady((tg) => {
      const user = tg.initDataUnsafe?.user ?? null;
      if (user) {
        setTgUser(user);
        setAuthMethod("telegram");
        if (user.first_name) {
          setName(`${user.first_name} ${user.last_name || ""}`.trim());
        }
      }
    });
  }, []);

  // Mini App ichida avtomatik yoki 1 bosishda kirish
  async function telegramMiniAppLogin() {
    setBusy(true);
    setError(null);
    try {
      const tg = getTelegram();
      if (!tg?.initData) {
        throw new Error("Telegram ma'lumotlari topilmadi");
      }

      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: tg.initData,
          name,
          region,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; sessionId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kirishda xatolik yuz berdi");

      if (data.sessionId) {
        document.cookie = `agroai_session=${data.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }

      router.push("/profil");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  // Brauzerda: Telegram bot ochish va avtomatik kutish (polling)
  async function startTelegramOneClickLogin() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/start-telegram-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Telegram login havolasi yaratilmadi");
      }

      const { token: loginToken, startLink: botUrl } = data;
      setBotStartUrl(botUrl);
      setWaitingBot(true);

      // Bot linkini yangi oynada ochamiz
      window.open(botUrl, "_blank");

      // Polling boshlaymiz: foydalanuvchi botda /start bosishini tekshiramiz
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/auth/poll-telegram-login?token=${encodeURIComponent(loginToken)}`);
          const pollData = await pollRes.json();
          if (pollData.ok && pollData.authenticated && pollData.sessionId) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            document.cookie = `agroai_session=${pollData.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
            router.push("/profil");
            router.refresh();
          }
        } catch {
          // Tarmoq xatosi bo'lsa polling davom etadi
        }
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  // Tezkor kirish (Ism + Hudud)
  async function handleQuickLogin() {
    if (!name.trim() || name.trim().length < 2) {
      setError("Iltimos, ismingizni kiriting");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/quick-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          region,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Kirishda xatolik yuz berdi");
      }

      if (data.sessionId) {
        document.cookie = `agroai_session=${data.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }

      router.push("/profil");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }

  // Telefon orqali kirish
  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput, initData: getTelegram()?.initData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      setPhone(`+998${normalize(phoneInput)}`);
      setMode(data.method ?? "dev");
      setToken("");
      setDeepLink(data.startLink ?? "");
      setChatLink(data.chatLink ?? "");
      setDevCode(data.devCode ?? "");
      setTtlMinutes(OTP_TTL_MINUTES);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Kod noto'g'ri");

      if (data.sessionId) {
        document.cookie = `agroai_session=${data.sessionId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      }

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
          <h1 className="ios-title mt-3 text-center web:mt-5 web:text-left web:text-[46px]">
            Agroz AI Profil
          </h1>
          <p className="ios-sub mt-2 text-center web:max-w-[420px] web:text-left web:text-[15.5px] leading-relaxed">
            Dehqon va chorvadorlar uchun yagona yordamchi. Hech qanday murakkab parolsiz,
            Telegram orqali 1 bosishda kiring.
          </p>

          <div className="mt-6 hidden flex-col gap-3.5 web:flex">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={19} className="text-emerald-600" />
              <span>Username yoki telefon kiritish shart emas</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800">
              <Zap size={19} className="text-emerald-600" />
              <span>Botda «Start» bosilishi bilan avtomatik tasdiqlanadi</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800">
              <CheckCircle2 size={19} className="text-emerald-600" />
              <span>Savat va ekin tashxislari profilingizda saqlanadi</span>
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
                setWaitingBot(false);
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
                setAuthMethod("quick");
                setError(null);
                setWaitingBot(false);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                authMethod === "quick"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserRound size={15} />
              <span>Ism bilan</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod("phone");
                setError(null);
                setWaitingBot(false);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition ${
                authMethod === "phone"
                  ? "bg-white text-neutral-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Phone size={15} />
              <span>Telefon</span>
            </button>
          </div>

          {/* 1. TELEGRAM ORQALI 1 BOSISHDA KIRISH */}
          {authMethod === "telegram" && (
            <div className="space-y-4">
              {tgUser ? (
                /* Telegram MiniApp ichida to'g'ridan-to'g'ri */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-sky-50 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-lg font-black text-white shadow-xs">
                      {(tgUser.first_name || "T").slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        {tgUser.first_name} {tgUser.last_name ?? ""}
                      </p>
                      <p className="text-xs text-sky-600 font-medium">Telegram Mini App foydalanuvchisi</p>
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
                    onClick={telegramMiniAppLogin}
                    disabled={busy}
                    className="ios-btn"
                    style={{ background: "#2AABEE" }}
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    <span>{tgUser.first_name || "Telegram"} hisobi bilan kirish</span>
                  </button>
                </div>
              ) : waitingBot ? (
                /* Botda Start bosilishini kutish ekrani */
                <div className="space-y-4 text-center py-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 animate-pulse">
                    <Loader2 size={32} className="animate-spin" />
                  </div>

                  <div>
                    <h3 className="text-[17px] font-black text-neutral-900">
                      Telegram bot ochildi
                    </h3>
                    <p className="mt-1 text-[13px] text-neutral-600 leading-relaxed max-w-xs mx-auto">
                      Botda <b>«Start»</b> tugmasini bosing. Profilingiz shu yerda <b>avtomatik tasdiqlanadi</b>.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {botStartUrl && (
                      <a
                        href={botStartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3 text-[14px] font-bold text-white shadow-sm hover:bg-sky-600 active:scale-95 transition"
                      >
                        <ExternalLink size={16} />
                        <span>Botga qayta o&apos;tish</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setWaitingBot(false);
                        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
                      }}
                      className="w-full text-[12.5px] font-semibold text-neutral-500 hover:text-neutral-800 py-1"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              ) : (
                /* Brauzerda bir bosishda Telegram login */
                <div className="space-y-4">
                  <div className="rounded-2xl bg-sky-50 p-4 border border-sky-100">
                    <div className="flex items-center gap-2 text-sky-800 font-bold text-[14px]">
                      <Zap size={16} className="text-sky-500" />
                      <span>Parol yoki usernamesiz tezkor kirish</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-sky-900/80">
                      Quyidagi tugmani bosing — botimiz ochiladi va <b>«Start»</b> bosishingiz bilan
                      profilingiz saytda avtomatik ochiladi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startTelegramOneClickLogin}
                    disabled={busy}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-extrabold text-white shadow-md hover:brightness-105 active:scale-[0.98] transition"
                    style={{ background: "#2AABEE" }}
                  >
                    {busy ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    <span>Telegram orqali 1 bosishda kirish</span>
                  </button>

                  <p className="text-center text-[11.5px] text-neutral-500 font-medium">
                    Hech qanday telefon yoki username qidirish talab qilinmaydi.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. TEZKOR KIRISH (ISM BILAN) */}
          {authMethod === "quick" && (
            <div className="space-y-3.5">
              <p className="rounded-xl bg-emerald-50 p-3 text-[12.5px] leading-relaxed text-emerald-900 font-medium border border-emerald-100">
                🌱 Ismingiz va hududingizni kiriting. Kod kutmasdan darhol profilingiz ochiladi.
              </p>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                  <UserRound size={12} /> Ismingiz
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Dilshod Ergashev"
                  className="ios-input !p-3.5"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                  <MapPin size={12} /> Hududingiz
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="ios-input appearance-none !p-3.5"
                >
                  {REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={busy || !name.trim()}
                className="ios-btn"
                style={{ background: "var(--brand-green)" }}
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : <UserRound size={18} />}
                <span>Profilni ochish</span>
              </button>
            </div>
          )}

          {/* 3. TELEFON RAQAM ORQALI */}
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
                </div>
              ) : (
                <div className="space-y-3">
                  {mode === "bot" ? (
                    <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium leading-relaxed text-[var(--brand-ink)]">
                      ✅ Kod Telegram botimizga yuborildi.
                    </p>
                  ) : mode === "telegram" ? (
                    <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium leading-relaxed text-[var(--brand-ink)]">
                      <b>{phone}</b> raqamini tasdiqlash uchun Telegram botga o&apos;ting.
                    </p>
                  ) : (
                    <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium text-[var(--brand-ink)]">
                      Demo rejim: kod: <b className="tracking-[0.3em] text-emerald-700">{devCode}</b>
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

                  <button
                    type="button"
                    onClick={verify}
                    disabled={busy || code.length !== OTP_LENGTH}
                    className="ios-btn"
                  >
                    {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                    {busy ? "Tasdiqlanmoqda..." : "Kirish"}
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
