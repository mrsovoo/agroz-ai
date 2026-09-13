/**
 * Telegram botlarni ilovaga ulaydi:
 *
 *  1) Asosiy bot (`TELEGRAM_BOT_TOKEN`)
 *     - webhook: /api/telegram/webhook
 *     - /start buyrug'i (OTP kodni bot orqali yuborish)
 *     - Mini App menyu tugmasi
 *
 *  2) Auth bot (`TELEGRAM_AUTH_BOT_TOKEN`, `@agroz_auth_bot`)
 *     - webhook: /api/telegram/auth-webhook
 *     - /royxatdan_otish, /malumotlarim, /yordam buyruqlari
 *     - mutaxassis va dorixona egalarini ro'yxatdan o'tkazadi
 *
 * Ishlatish:  npm run telegram:setup
 * Kerak: TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_APP_URL (https)
 * Ixtiyoriy: TELEGRAM_AUTH_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_AUTH_WEBHOOK_SECRET
 */
import "dotenv/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
const mainToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const authToken = process.env.TELEGRAM_AUTH_BOT_TOKEN?.trim();
const mainSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const authSecret = process.env.TELEGRAM_AUTH_WEBHOOK_SECRET?.trim() || mainSecret;

if (!appUrl) {
  console.error("✗ NEXT_PUBLIC_APP_URL topilmadi, masalan: https://agroz-ai.vercel.app");
  process.exit(1);
}
if (!appUrl.startsWith("https://")) {
  console.error("✗ Telegram webhook faqat HTTPS manzil bilan ishlaydi. Vercel domenini kiriting.");
  process.exit(1);
}
if (!mainToken && !authToken) {
  console.error("✗ Hech bo'lmaganda TELEGRAM_BOT_TOKEN yoki TELEGRAM_AUTH_BOT_TOKEN kerak.");
  process.exit(1);
}

function makeCall(token) {
  const api = (method) => `https://api.telegram.org/bot${token}/${method}`;
  return async function call(method, payload) {
    const res = await fetch(api(method), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload ?? {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!json.ok) throw new Error(`${method}: ${json.description ?? res.status}`);
    return json.result;
  };
}

async function setupMainBot() {
  if (!mainToken) {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN yo'q — asosiy bot sozlanmadi.");
    return;
  }
  const call = makeCall(mainToken);

  const me = await call("getMe");
  console.log(`✓ Asosiy bot: @${me.username} — ${me.first_name}`);

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  await call("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"],
    ...(mainSecret ? { secret_token: mainSecret } : {}),
  });
  console.log(`✓ Asosiy webhook: ${webhookUrl}`);
  if (!mainSecret) {
    console.warn("⚠️  TELEGRAM_WEBHOOK_SECRET yo'q — webhook himoyasiz, qo'shish tavsiya etiladi.");
  }

  await call("setMyCommands", {
    commands: [{ command: "start", description: "Boshlash / tasdiqlash kodini olish" }],
  });
  console.log("✓ Buyruq o'rnatildi: /start");

  try {
    await call("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Agroz AI", web_app: { url: appUrl } },
    });
    console.log("✓ Menyu tugmasi Mini Appga ulandi");
  } catch (err) {
    console.warn("⚠️  Menyu tugmasini o'rnatib bo'lmadi:", err.message);
  }

  const info = await call("getWebhookInfo");
  console.log("ℹ️  Asosiy bot holati:", {
    url: info.url,
    pending: info.pending_update_count,
    lastError: info.last_error_message ?? null,
  });
}

async function setupAuthBot() {
  if (!authToken) {
    console.warn("⚠️  TELEGRAM_AUTH_BOT_TOKEN yo'q — auth bot sozlanmadi.");
    return;
  }
  const call = makeCall(authToken);

  const me = await call("getMe");
  console.log(`✓ Auth bot: @${me.username} — ${me.first_name}`);

  const webhookUrl = `${appUrl}/api/telegram/auth-webhook`;
  await call("setWebhook", {
    url: webhookUrl,
    // Ro'yxatdan o'tishda matn, kontakt, lokatsiya va inline tugmalar keladi.
    allowed_updates: ["message", "callback_query"],
    ...(authSecret ? { secret_token: authSecret } : {}),
  });
  console.log(`✓ Auth webhook: ${webhookUrl}`);
  if (!authSecret) {
    console.warn("⚠️  Auth bot webhook'i himoyasiz — TELEGRAM_AUTH_WEBHOOK_SECRET qo'shing.");
  }

  await call("setMyCommands", {
    commands: [
      { command: "start", description: "Boshlash" },
      { command: "royxatdan_otish", description: "Ro'yxatdan o'tish / ma'lumotlarni yangilash" },
      { command: "dori_qoshish", description: "Dorixonaga dori qo'shish (rasm + nom)" },
      { command: "malumotlarim", description: "Profilimni ko'rish" },
      { command: "bekor", description: "Jarayonni to'xtatish" },
      { command: "yordam", description: "Yordam" },
    ],
  });
  console.log("✓ Auth bot buyruqlari o'rnatildi");

  try {
    await call("setChatMenuButton", {
      menu_button: { type: "web_app", text: "Mutaxassislar", web_app: { url: `${appUrl}/mutaxassislar` } },
    });
    console.log("✓ Auth bot menyu tugmasi /mutaxassislar sahifasiga ulandi");
  } catch (err) {
    console.warn("⚠️  Auth bot menyu tugmasini o'rnatib bo'lmadi:", err.message);
  }

  const info = await call("getWebhookInfo");
  console.log("ℹ️  Auth bot holati:", {
    url: info.url,
    pending: info.pending_update_count,
    lastError: info.last_error_message ?? null,
  });
}

await setupMainBot();
await setupAuthBot();
