/**
 * Telegram botni ilovaga ulaydi:
 *   - webhook (/api/telegram/webhook)
 *   - /start buyrug'i
 *   - Mini App menyu tugmasi
 *
 * Ishlatish:  npm run telegram:setup
 * Kerak: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_APP_URL (https), TELEGRAM_WEBHOOK_SECRET (tavsiya)
 */
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

if (!token) {
  console.error("✗ TELEGRAM_BOT_TOKEN topilmadi (.env yoki Vercel env).");
  process.exit(1);
}
if (!appUrl) {
  console.error("✗ NEXT_PUBLIC_APP_URL topilmadi, masalan: https://agroz-ai.vercel.app");
  process.exit(1);
}
if (!appUrl.startsWith("https://")) {
  console.error("✗ Telegram webhook faqat HTTPS manzil bilan ishlaydi. Vercel domenini kiriting.");
  process.exit(1);
}

const api = (method) => `https://api.telegram.org/bot${token}/${method}`;

async function call(method, payload) {
  const res = await fetch(api(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`${method}: ${json.description ?? res.status}`);
  return json.result;
}

const me = await call("getMe");
console.log(`✓ Bot: @${me.username} — ${me.first_name}`);

const webhookUrl = `${appUrl}/api/telegram/webhook`;
await call("setWebhook", {
  url: webhookUrl,
  allowed_updates: ["message"],
  ...(secret ? { secret_token: secret } : {}),
});
console.log(`✓ Webhook: ${webhookUrl}`);
if (!secret) {
  console.warn("⚠️  TELEGRAM_WEBHOOK_SECRET yo'q — webhook himoyasiz, qo'shish tavsiya etiladi.");
}

await call("setMyCommands", {
  commands: [{ command: "start", description: "Boshlash / tasdiqlash kodini olish" }],
});
console.log("✓ Buyruq o'rnatildi: /start");

try {
  await call("setChatMenuButton", {
    menu_button: { type: "web_app", text: "AgroVet AI", web_app: { url: appUrl } },
  });
  console.log("✓ Menyu tugmasi Mini Appga ulandi");
} catch (err) {
  console.warn("⚠️  Menyu tugmasini o'rnatib bo'lmadi:", err.message);
}

const info = await call("getWebhookInfo");
console.log("ℹ️  Webhook holati:", {
  url: info.url,
  pending: info.pending_update_count,
  lastError: info.last_error_message ?? null,
});
