import { requireAdmin } from "@/lib/admin-auth";
import {
  telegramAuthBotToken,
  telegramAuthWebhookSecret,
  telegramBotToken,
  telegramWebhookSecret,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

const API = "https://api.telegram.org";

type TgResult = {
  ok?: boolean;
  result?: unknown;
  description?: string;
};

async function call(token: string, method: string, payload?: Record<string, unknown>) {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  return (await res.json().catch(() => ({}))) as TgResult;
}

/** Ilova bazasi URL — Vercel'da VERCEL_PROJECT_PRODUCTION_URL yoki NEXT_PUBLIC_APP_URL. */
function appUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  if (!raw) return "";
  return raw.replace(/\/+$/, "").startsWith("http")
    ? raw.replace(/\/+$/, "")
    : `https://${raw.replace(/\/+$/, "")}`;
}

/**
 * Botlar holati: getMe + getWebhookInfo har bir sozlangan bot uchun.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = appUrl();
  const [mainToken, authToken] = await Promise.all([telegramBotToken(), telegramAuthBotToken()]);

  async function botInfo(token: string | null) {
    if (!token) return { configured: false as const };
    const me = await call(token, "getMe");
    if (!me.ok) {
      return { configured: true as const, valid: false as const, error: me.description ?? "xato" };
    }
    const info = (await call(token, "getWebhookInfo")) as {
      result?: { url?: string; pending_update_count?: number; last_error_message?: string };
    };
    return {
      configured: true as const,
      valid: true as const,
      username: (me.result as { username?: string })?.username ?? null,
      name: (me.result as { first_name?: string })?.first_name ?? null,
      webhookUrl: info.result?.url ?? null,
      pending: info.result?.pending_update_count ?? 0,
      lastError: info.result?.last_error_message ?? null,
    };
  }

  const [main, auth] = await Promise.all([botInfo(mainToken), botInfo(authToken)]);

  return Response.json({
    ok: true,
    appUrl: url || null,
    main,
    auth,
    secrets: {
      main: Boolean(await telegramWebhookSecret()),
      auth: Boolean(await telegramAuthWebhookSecret()),
    },
  });
}

/**
 * Webhook'ni ulash/uzish yoki test xabar yuborish.
 * Body: {action: "connect"|"disconnect"|"test", bot: "main"|"auth"}
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    bot?: string;
  };
  const action = body.action ?? "";
  const which = body.bot === "auth" ? "auth" : "main";

  const token = which === "auth" ? await telegramAuthBotToken() : await telegramBotToken();
  if (!token) {
    return Response.json({ error: "Bot tokeni sozlanmagan" }, { status: 400 });
  }

  const baseUrl = appUrl();
  if ((action === "connect" || action === "test") && !baseUrl) {
    return Response.json(
      { error: "Sayt manzili topilmadi — NEXT_PUBLIC_APP_URL sozlang" },
      { status: 400 },
    );
  }

  try {
    if (action === "connect") {
      const isAuth = which === "auth";
      const secret =
        (isAuth ? await telegramAuthWebhookSecret() : null) ?? (await telegramWebhookSecret());
      const webhookPath = isAuth ? "/api/telegram/auth-webhook" : "/api/telegram/webhook";
      const result = await call(token, "setWebhook", {
        url: `${baseUrl}${webhookPath}`,
        allowed_updates: isAuth ? ["message", "callback_query"] : ["message"],
        ...(secret ? { secret_token: secret } : {}),
      });
      if (!result.ok) {
        return Response.json(
          { error: `setWebhook: ${result.description ?? "xato"}` },
          { status: 502 },
        );
      }
      await call(token, "setMyCommands", {
        commands: isAuth
          ? [
              { command: "start", description: "Boshlash" },
              { command: "royxatdan_otish", description: "Ro'yxatdan o'tish / yangilash" },
              { command: "dori_qoshish", description: "Dori qo'shish (rasm + nom)" },
              { command: "malumotlarim", description: "Profilimni ko'rish" },
              { command: "bekor", description: "Jarayonni to'xtatish" },
              { command: "yordam", description: "Yordam" },
            ]
          : [
              { command: "start", description: "Boshlash / kod olish" },
              { command: "yangiliklar", description: "Agro va chorvachilik yangiliklari" },
            ],
      });
      return Response.json({ ok: true, message: `Webhook ulandi: ${baseUrl}${webhookPath}` });
    }

    if (action === "disconnect") {
      const result = await call(token, "deleteWebhook", { drop_pending_updates: false });
      if (!result.ok) {
        return Response.json(
          { error: `deleteWebhook: ${result.description ?? "xato"}` },
          { status: 502 },
        );
      }
      return Response.json({ ok: true, message: "Webhook uzildi" });
    }

    if (action === "test") {
      const me = await call(token, "getMe");
      if (!me.ok) {
        return Response.json({ error: me.description ?? "xato" }, { status: 502 });
      }
      return Response.json({
        ok: true,
        message: `Bot javob berdi: @${(me.result as { username?: string })?.username}`,
      });
    }

    return Response.json({ error: "Noma'lum amal" }, { status: 400 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Tarmoq xatosi" },
      { status: 502 },
    );
  }
}
