import { handleAuthBotUpdate, type AuthBotUpdate } from "@/lib/auth-bot-flow";
import { isAuthBotConfigured } from "@/lib/auth-bot";

export const dynamic = "force-dynamic";

/**
 * `@agroz_auth_bot` webhook'i.
 *
 * Asosiy botdan (`/api/telegram/webhook`) ajratilgan: bu bot OTP kod yubormaydi,
 * faqat mutaxassis va dorixona egalarini ro'yxatdan o'tkazadi.
 * `npm run telegram:setup` ikkala webhookni ham ulaydi.
 */
export async function POST(req: Request) {
  if (!isAuthBotConfigured()) {
    return Response.json({ ok: false, error: "auth bot sozlanmagan" }, { status: 503 });
  }

  // Bo'sh qiymat ham qabul qilinadi — shunda umumiy kalitga qaytamiz.
  const secret =
    process.env.TELEGRAM_AUTH_WEBHOOK_SECRET?.trim() ||
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }

  // Bot hech qachon Telegram'ga xato qaytarmasligi kerak — aks holda u update'ni
  // qayta yuborib, foydalanuvchi bir xil xabarni bir necha marta oladi.
  try {
    const update = (await req.json().catch(() => null)) as AuthBotUpdate | null;
    if (update) await handleAuthBotUpdate(update);
  } catch (err) {
    console.error("[auth-bot] webhook xatosi:", err);
  }
  return Response.json({ ok: true });
}
