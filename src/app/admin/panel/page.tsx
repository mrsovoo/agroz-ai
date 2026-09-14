"use client";

import { useCallback, useEffect, useState } from "react";

type Me = { enabled: boolean; authenticated: boolean; username: string | null };

type SettingsStatus = {
  key: string;
  label: string;
  secret: boolean;
  source: "db" | "env" | "none";
  preview: string | null;
  updatedAt: string | null;
};

type Stats = {
  users: number;
  specialists: number;
  pharmacies: number;
  medicines: number;
  diagnoses: number;
  aiDiagnoses: number;
  offlineDiagnoses: number;
  activeBotSessions: number;
  otpSent24h: number;
  otpVerified24h: number;
};

type RecentDiagnosis = {
  id: number;
  diseaseName: string;
  category: string;
  source: string;
  confidence: number | null;
  createdAt: string;
};

type BotInfo =
  | { configured: false }
  | {
      configured: true;
      valid: boolean;
      error?: string;
      username?: string | null;
      name?: string | null;
      webhookUrl?: string | null;
      pending?: number;
      lastError?: string | null;
    };

type TelegramStatus = {
  appUrl: string | null;
  main: BotInfo;
  auth: BotInfo;
  secrets: { main: boolean; auth: boolean };
};

/** Open-source / bepul AI provayder presetlari. */
const AI_PRESETS: { label: string; baseUrl: string; model: string; hint: string }[] = [
  {
    label: "Google AI Studio (Gemini, bepul)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-3.8-flash",
    hint: "Kalit: aistudio.google.com/apikey — ~15 so'rov/daq, kuniga 100–1000",
  },
  {
    label: "Groq (Llama 4 Scout, bepul)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    hint: "Kalit: console.groq.com — 30 so'rov/daq, kuniga 1000",
  },
  {
    label: "OpenRouter (:free modellar)",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "qwen/qwen2.5-vl-72b-instruct:free",
    hint: "Kalit: openrouter.ai — kuniga 50, soatiga 20 so'rov",
  },
  {
    label: "OpenAI (to'lovli)",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
    hint: "Kalit: platform.openai.com/api-keys",
  },
  {
    label: "O'z serverim (vLLM / Ollama)",
    baseUrl: "",
    model: "Qwen/Qwen2.5-VL-7B-Instruct",
    hint: "OpenAI-mos endpoint, masalan https://ai.example.com/v1",
  },
];

const SETTING_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "🤖 Telegram botlar",
    keys: ["telegram_bot_token", "telegram_auth_bot_token", "telegram_webhook_secret", "telegram_auth_webhook_secret"],
  },
  {
    title: "🧠 AI (open-source modellar)",
    keys: ["openai_api_key", "openai_base_url", "ai_model", "asr_model"],
  },
  {
    title: "📱 SMS (Eskiz.uz)",
    keys: ["eskiz_email", "eskiz_password", "eskiz_from"],
  },
  {
    title: "👤 Admin hisobi (login/parolni shu yerda o'zgartirasiz)",
    keys: ["admin_username", "admin_password"],
  },
];

export default function AdminPanelPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentDiagnosis[]>([]);
  const [topDiseases, setTopDiseases] = useState<{ disease: string; n: number }[]>([]);
  const [settings, setSettings] = useState<SettingsStatus[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [tg, setTg] = useState<TelegramStatus | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    const [statsRes, settingsRes, tgRes] = await Promise.all([
      fetch("/api/admin/stats").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/admin/settings").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("/api/admin/telegram").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if (statsRes) {
      setStats(statsRes.stats);
      setRecent(statsRes.recentDiagnoses ?? []);
      setTopDiseases(statsRes.topDiseases ?? []);
    }
    if (settingsRes) {
      setSettings(settingsRes.settings);
      setValues((v) => {
        const next = { ...v };
        for (const s of settingsRes.settings as SettingsStatus[]) if (!(s.key in next)) next[s.key] = "";
        return next;
      });
    }
    if (tgRes) setTg(tgRes);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ enabled: false, authenticated: false, username: null }));
  }, []);

  useEffect(() => {
    if (me?.authenticated) void loadAll();
  }, [me?.authenticated, loadAll]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLoginError(null);
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setLoginError(json.error ?? "Kirish muvaffaqiyatsiz");
      return;
    }
    setMe({ enabled: true, authenticated: true, username });
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setMe({ enabled: true, authenticated: false, username: null });
  }

  async function saveSettings(keys: string[]) {
    setBusy(true);
    setNotice(null);
    const payload: Record<string, string> = {};
    for (const k of keys) payload[k] = values[k] ?? "";
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: payload }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setNotice({ kind: "err", text: json.error ?? "Saqlashda xato" });
      return;
    }
    setSettings(json.settings);
    setValues((v) => {
      const next = { ...v };
      for (const k of keys) next[k] = "";
      return next;
    });
    setNotice({ kind: "ok", text: "✅ Saqlandi — endi shu qiymatlar ishlatiladi" });
    void loadAll();
  }

  async function tgAction(bot: "main" | "auth", action: "connect" | "disconnect" | "test") {
    setBusy(true);
    setNotice(null);
    const res = await fetch("/api/admin/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot, action }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    setNotice(
      res.ok
        ? { kind: "ok", text: json.message ?? "✅ Bajarildi" }
        : { kind: "err", text: json.error ?? "Xato" },
    );
    void loadAll();
  }

  function applyPreset(preset: (typeof AI_PRESETS)[number]) {
    setValues((v) => ({
      ...v,
      openai_base_url: preset.baseUrl,
      ai_model: preset.model,
    }));
    setNotice({ kind: "ok", text: `Preset tanlandi: ${preset.label}. Kalitni kiriting va saqlang.` });
  }

  if (!me) {
    return <main className="min-h-screen grid place-items-center bg-slate-950 text-slate-300">Yuklanmoqda...</main>;
  }

  // ------------------------------------------------------------------ login
  if (!me.authenticated) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-950 px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-slate-900 p-8 ring-1 ring-slate-800">
          <h1 className="text-xl font-bold text-white">🔐 Admin panel</h1>
          <p className="mt-1 text-sm text-slate-400">Agroz AI boshqaruv paneli</p>
          <label className="mt-6 block text-sm text-slate-300">
            Login
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-white outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block text-sm text-slate-300">
            Parol
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-white outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
              autoComplete="current-password"
            />
          </label>
          {loginError && <p className="mt-3 text-sm text-red-400">{loginError}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Kirilmoqda..." : "Kirish"}
          </button>
        </form>
      </main>
    );
  }

  // ----------------------------------------------------------------- panel
  const settingOf = (key: string) => settings.find((s) => s.key === key);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-200">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🛠 Agroz AI — Admin panel</h1>
            <p className="text-sm text-slate-400">
              {tg?.appUrl ? (
                <>
                  Sayt: <span className="text-emerald-400">{tg.appUrl}</span>
                </>
              ) : (
                "Sayt manzili NEXT_PUBLIC_APP_URL orqali sozlanadi"
              )}
            </p>
          </div>
          <button onClick={logout} className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
            Chiqish
          </button>
        </header>

        {notice && (
          <p
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              notice.kind === "ok" ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"
            }`}
          >
            {notice.text}
          </p>
        )}

        {/* Statistika */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Foydalanuvchilar", value: stats?.users },
            { label: "Mutaxassislar", value: stats?.specialists },
            { label: "Dorixonalar", value: stats?.pharmacies },
            { label: "Dorilar", value: stats?.medicines },
            { label: "Tashxislar", value: stats?.diagnoses },
            { label: "AI tashxis", value: stats?.aiDiagnoses },
            { label: "Offlayn tashxis", value: stats?.offlineDiagnoses },
            { label: "Aktiv bot sessiyalari", value: stats?.activeBotSessions },
            { label: "OTP (24s)", value: stats?.otpSent24h },
            { label: "Tasdiqlangan (24s)", value: stats?.otpVerified24h },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
              <p className="text-2xl font-bold text-white">{c.value ?? "—"}</p>
              <p className="mt-1 text-xs text-slate-400">{c.label}</p>
            </div>
          ))}
        </section>

        {/* Botlar holati */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {(["main", "auth"] as const).map((bot) => {
            const info = bot === "main" ? tg?.main : tg?.auth;
            const title = bot === "main" ? "Asosiy bot (OTP / Mini App)" : "Auth bot (@agroz_auth_bot)";
            return (
              <div key={bot} className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
                <h2 className="font-semibold text-white">{title}</h2>
                {!info?.configured ? (
                  <p className="mt-2 text-sm text-amber-400">Token kiritilmagan</p>
                ) : !info.valid ? (
                  <p className="mt-2 text-sm text-red-400">Token yaroqsiz: {info.error}</p>
                ) : (
                  <div className="mt-2 space-y-1 text-sm text-slate-300">
                    <p>
                      Bot: <span className="text-emerald-400">@{info.username}</span>
                    </p>
                    <p>
                      Webhook:{" "}
                      {info.webhookUrl ? (
                        <span className="text-emerald-400">ulangan</span>
                      ) : (
                        <span className="text-amber-400">uzilgan</span>
                      )}
                    </p>
                    {info.webhookUrl && <p className="break-all text-xs text-slate-500">{info.webhookUrl}</p>}
                    {(info.pending ?? 0) > 0 && (
                      <p className="text-amber-400">Kutayotgan update: {info.pending}</p>
                    )}
                    {info.lastError && <p className="text-red-400">Oxirgi xato: {info.lastError}</p>}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => tgAction(bot, "connect")}
                    disabled={busy}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Webhook ulash
                  </button>
                  <button
                    onClick={() => tgAction(bot, "test")}
                    disabled={busy || !info?.configured}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700 disabled:opacity-50"
                  >
                    Tekshirish
                  </button>
                  <button
                    onClick={() => tgAction(bot, "disconnect")}
                    disabled={busy || !info?.configured}
                    className="rounded-lg bg-red-900/60 px-3 py-1.5 text-sm hover:bg-red-900 disabled:opacity-50"
                  >
                    Uzish
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Sozlashlar */}
        {SETTING_GROUPS.map((group) => (
          <section key={group.title} className="mt-8 rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <h2 className="font-semibold text-white">{group.title}</h2>
            <div className="mt-4 space-y-4">
              {group.keys.map((key) => {
                const s = settingOf(key);
                if (!s) return null;
                const placeholder =
                  s.source === "db"
                    ? `saqlangan: ${s.preview}`
                    : s.source === "env"
                      ? `env: ${s.preview}`
                      : "kiritilmagan";
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-slate-300">{s.label}</label>
                      <span
                        className={`text-xs ${
                          s.source === "db" ? "text-emerald-400" : s.source === "env" ? "text-amber-400" : "text-slate-500"
                        }`}
                      >
                        {s.source === "db" ? "bazada" : s.source === "env" ? "env'dan" : "bo'sh"}
                      </span>
                    </div>
                    <input
                      type={s.secret ? "password" : "text"}
                      value={values[key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="mt-1 w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-slate-700 focus:ring-emerald-500"
                    />
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Faqat to&apos;ldirilgan maydonlar saqlanadi — bo&apos;sh qoldirsangiz eski qiymat o&apos;zgarmaydi.
            </p>
            <button
              onClick={() => saveSettings(group.keys)}
              disabled={busy}
              className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Saqlash
            </button>
          </section>
        ))}

        {/* AI presetlar */}
        <section className="mt-8 rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <h2 className="font-semibold text-white">⚡ Bepul AI provayderlar (bir bosishda sozlash)</h2>
          <p className="mt-1 text-sm text-slate-400">
            Presetni bosing — endpoint va model to'ldiriladi. Kalitni o'zingiz kiritasiz.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {AI_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="rounded-lg bg-slate-800 p-3 text-left text-sm hover:bg-slate-700"
              >
                <p className="font-medium text-white">{p.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{p.hint}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Oxirgi tashxislar */}
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <h2 className="font-semibold text-white">🩺 Oxirgi tashxislar</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {recent.length === 0 && <li className="text-slate-500">Hali tashxis yo'q</li>}
              {recent.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="truncate">
                    {d.category === "crop" ? "🌿" : "🐄"} {d.diseaseName}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {d.source === "ai" ? "AI" : "offlayn"} · {d.confidence ?? "—"}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <h2 className="font-semibold text-white">📊 Eng ko'p tashxis qilingan kasalliklar</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {topDiseases.length === 0 && <li className="text-slate-500">Ma'lumot yo'q</li>}
              {topDiseases.map((d) => (
                <li key={d.disease} className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="truncate">{d.disease}</span>
                  <span className="shrink-0 text-xs text-emerald-400">{d.n} ta</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-10 pb-6 text-center text-xs text-slate-600">
          Agroz AI admin panel · barcha tokenlar bazada shifrlangan holda emas, lekin clientga hech qachon uzatilmaydi
        </footer>
      </div>
    </main>
  );
}
