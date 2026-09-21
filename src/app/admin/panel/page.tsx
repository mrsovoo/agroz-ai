"use client";

import { useCallback, useEffect, useState } from "react";
import AdminWeatherAlertsBroadcast from "@/components/AdminWeatherAlertsBroadcast";
import {
  Users,
  MapPin,
  Send,
  Phone,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
} from "lucide-react";

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
  telegramUsers?: number;
  phoneUsers?: number;
};

type RecentDiagnosis = {
  id: number;
  diseaseName: string;
  category: string;
  source: string;
  confidence: number | null;
  createdAt: string;
};

type UserByRegion = {
  region: string;
  n: number;
};

type RecentUser = {
  id: number;
  name: string | null;
  phone: string | null;
  telegramId: number | null;
  region: string | null;
  district: string | null;
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

/** AI provayder presetlari: Gemini asosiy o'rinda */
const AI_PRESETS: { label: string; baseUrl: string; model: string; hint: string }[] = [
  {
    label: "Google AI Studio (Gemini 3.8 Flash — Asosiy tavsiya)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-3.8-flash",
    hint: "Kalit: aistudio.google.com/apikey — bepul, o'zbek tilini mukammal tushunadi",
  },
  {
    label: "Google Gemini (gemini-2.5-flash)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-2.5-flash",
    hint: "Tezkor, barqaror va bepul Gemini modeli",
  },
  {
    label: "Gemini Transcribe (Ovozli xabarlar uchun)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    model: "gemini-3.5-transcribe",
    hint: "O'zbek tilidagi nutqni aniq matnga aylantiradi",
  },
  {
    label: "Groq (Llama 4 Scout)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    hint: "Kalit: console.groq.com",
  },
];

const SETTING_GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "🤖 Telegram botlar",
    keys: ["telegram_bot_token", "telegram_auth_bot_token", "telegram_webhook_secret", "telegram_auth_webhook_secret"],
  },
  {
    title: "🧠 Gemini AI sozlamalari (Tashxis va Ovoz tahlili)",
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
  const [usersByRegion, setUsersByRegion] = useState<UserByRegion[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
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
      setUsersByRegion(statsRes.usersByRegion ?? []);
      setRecentUsers(statsRes.recentUsers ?? []);
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
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login yoki parol noto'g'ri");
      setMe({ enabled: true, authenticated: true, username });
      await loadAll();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Xatolik");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setMe({ enabled: true, authenticated: false, username: null });
  }

  async function saveSettings(keysToSave: string[]) {
    setBusy(true);
    setNotice(null);
    try {
      const payload: Record<string, string> = {};
      for (const k of keysToSave) {
        if (values[k] !== undefined && values[k].trim() !== "") {
          payload[k] = values[k];
        }
      }
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Saqlanmadi");
      setNotice({ kind: "ok", text: "Sozlashlar muvaffaqiyatli saqlandi!" });
      await loadAll();
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  async function tgAction(bot: "main" | "auth", action: "connect" | "disconnect" | "test") {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Amal bajarilmadi");
      setNotice({ kind: "ok", text: data.message ?? "Bajarildi" });
      await loadAll();
    } catch (err) {
      setNotice({ kind: "err", text: err instanceof Error ? err.message : "Xatolik" });
    } finally {
      setBusy(false);
    }
  }

  function applyPreset(p: (typeof AI_PRESETS)[number]) {
    setValues((v) => ({
      ...v,
      openai_base_url: p.baseUrl,
      ai_model: p.model,
    }));
    setNotice({
      kind: "ok",
      text: `«${p.label}» preset tanlandi. Gemini API kalitini kiritib «Saqlash» tugmasini bosing.`,
    });
  }

  // ----------------------------------------------------------------- login
  if (!me?.authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <form onSubmit={login} className="w-full max-w-sm rounded-2xl bg-slate-900 p-6 shadow-xl ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={24} />
            <h1 className="text-xl font-bold text-white">Agroz AI — Admin</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">Tizim boshqaruv paneliga kirish</p>
          <label className="mt-5 block text-sm text-slate-300">
            Login
            <input
              type="text"
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
  const totalUsers = stats?.users || 1;
  const maxRegionCount = Math.max(...usersByRegion.map((r) => r.n), 1);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-200">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={24} />
              <h1 className="text-2xl font-black text-white">Agroz AI — Admin Panel</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {tg?.appUrl ? (
                <>
                  Sayt domeni: <span className="font-semibold text-emerald-400">{tg.appUrl}</span>
                </>
              ) : (
                "Sayt manzili NEXT_PUBLIC_APP_URL orqali sozlanadi"
              )}
            </p>
          </div>
          <button onClick={logout} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700">
            Chiqish
          </button>
        </header>

        {notice && (
          <p
            className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
              notice.kind === "ok" ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"
            }`}
          >
            {notice.text}
          </p>
        )}

        {/* Asosiy metrikalar */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Jami Foydalanuvchilar", value: stats?.users, icon: Users, color: "text-emerald-400" },
            { label: "Telegram orqali", value: stats?.telegramUsers ?? 0, icon: Send, color: "text-sky-400" },
            { label: "Telefon orqali", value: stats?.phoneUsers ?? 0, icon: Phone, color: "text-amber-400" },
            { label: "AI Tashxislar", value: stats?.aiDiagnoses, icon: Sparkles, color: "text-purple-400" },
            { label: "Jami Tashxislar", value: stats?.diagnoses, icon: Activity, color: "text-emerald-400" },
            { label: "Mutaxassislar", value: stats?.specialists, icon: Users, color: "text-slate-300" },
            { label: "Dorixonalar", value: stats?.pharmacies, icon: MapPin, color: "text-slate-300" },
            { label: "Dorilar soni", value: stats?.medicines, icon: Layers, color: "text-slate-300" },
            { label: "Bot sessiyalari", value: stats?.activeBotSessions, icon: Bot, color: "text-slate-300" },
            { label: "Tasdiqlangan OTP (24s)", value: stats?.otpVerified24h, icon: CheckCircle2, color: "text-emerald-400" },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-slate-900 p-4 ring-1 ring-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-black text-white">{c.value ?? "0"}</p>
                <c.icon size={18} className={c.color} />
              </div>
              <p className="mt-1 text-xs text-slate-400">{c.label}</p>
            </div>
          ))}
        </section>

        {/* HUDUDLAR BO'YICHA VA KIMLAR RO'YXATDAN O'TGANLIGI TAHLILI (FOYDALANUVCHI SO'ROVI) */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          {/* Qayerdan ko'proq ro'yxatdan o'tyapti */}
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-400" size={18} />
                <h2 className="font-bold text-white">Hududlar tahlili</h2>
              </div>
              <span className="text-xs text-slate-400">Qayerdan ko'p ro'yxatdan o'tgan</span>
            </div>

            <div className="mt-4 space-y-3">
              {usersByRegion.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">Hozircha foydalanuvchilar mavjud emas</p>
              ) : (
                usersByRegion.map((r) => {
                  const percent = Math.round((r.n / totalUsers) * 100);
                  const barWidth = Math.round((r.n / maxRegionCount) * 100);
                  return (
                    <div key={r.region} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate text-slate-200">{r.region}</span>
                        <span className="text-emerald-400">
                          {r.n} ta <span className="text-slate-500">({percent}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Kimlar ro'yxatdan o'tyapti (Oxirgi foydalanuvchilar) */}
          <div className="rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="text-sky-400" size={18} />
                <h2 className="font-bold text-white">Oxirgi ro'yxatdan o'tganlar</h2>
              </div>
              <span className="text-xs text-slate-400">So'nggi 15 nafar</span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2">F.I.SH / Ism</th>
                    <th className="py-2">Aloqa</th>
                    <th className="py-2">Hudud</th>
                    <th className="py-2 text-right">Vaqti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Hozircha ro'yxatdan o'tgan foydalanuvchilar yo'q
                      </td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-semibold text-white">
                          {u.name || `Foydalanuvchi #${u.id}`}
                        </td>
                        <td className="py-2.5">
                          {u.phone ? (
                            <span className="flex items-center gap-1 text-slate-200">
                              <Phone size={11} className="text-amber-400" /> {u.phone}
                            </span>
                          ) : u.telegramId ? (
                            <span className="flex items-center gap-1 text-sky-400">
                              <Send size={11} /> TG: {u.telegramId}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-slate-300">
                          {u.region ? (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} className="text-emerald-400" />
                              {u.region}
                              {u.district ? `, ${u.district}` : ""}
                            </span>
                          ) : (
                            <span className="text-slate-500">Ko'rsatilmagan</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("uz-UZ", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

        {/* SHOSHILINCH OB-HAVO OGOHLANTIRISHLARI (SOVUQ URISHI / KUCHLI YOMG'IR) */}
        <AdminWeatherAlertsBroadcast />

        {/* AI PRESETLAR */}
        <section className="mt-8 rounded-xl bg-slate-900 p-5 ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={20} />
            <h2 className="font-bold text-white">⚡ Google Gemini AI (Tavsiya etilgan sozlash)</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Agroz AI rasmiy tarzda Google AI Studio (Gemini SDK) bilan integratsiya qilingan. Bepul API kalitini oling va quyidagi tugmani bosib bir zumda sozlang:
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {AI_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="rounded-lg bg-slate-800 p-3 text-left text-sm transition hover:bg-slate-700 hover:ring-1 hover:ring-emerald-500/50"
              >
                <p className="font-semibold text-white">{p.label}</p>
                <p className="mt-0.5 text-xs text-slate-400">{p.hint}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Sozlashlar guruhi */}
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

        {/* Oxirgi tashxislar va kasalliklar */}
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
                    {d.source === "ai" ? "Gemini AI" : "offlayn"} · {d.confidence ?? "—"}%
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
          Agroz AI Admin Panel · Gemini AI & Telegram integratsiyasi faol
        </footer>
      </div>
    </main>
  );
}
