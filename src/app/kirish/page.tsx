"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Phone, KeyRound, UserRound, MapPin, ChevronRight, Loader2, Send } from "lucide-react";
import { getTelegram, getTelegramUser } from "@/lib/telegram";

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
  const tgUser = getTelegramUser();
  const [step, setStep] = useState<1 | 2>(1);
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = (await res.json()) as { phone?: string; devCode?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      setPhone(data.phone!);
      setDevCode(data.devCode ?? "");
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
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, name, region }),
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
              {busy ? "Yuborilmoqda..." : "SMS kod olish"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="rounded-2xl bg-[var(--brand-yellow-soft)] p-3 text-[13px] font-medium text-[var(--brand-ink)]">
              {phone} raqamiga SMS yuborildi.
              <br />
              <b>Demo kod:</b> {devCode}
            </p>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
                <KeyRound size={12} /> 4 xonali kod
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                className="ios-input text-center text-[28px] font-black tracking-[0.8em]"
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
            <button onClick={verify} disabled={busy || code.length !== 4} className="ios-btn">
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {busy ? "Tasdiqlanmoqda..." : "Kirish"}
              {!busy && <ChevronRight size={18} />}
            </button>
            <button onClick={() => setStep(1)} className="ios-btn secondary">
              Raqamni o'zgartirish
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
