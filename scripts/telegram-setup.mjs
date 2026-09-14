/**
 * Telegram botlarni ilovaga ulaydi:
 *
 *  1) Asosiy bot (`TELEGRAM_BOT_TOKEN` yoki admin panel'da kiritilgan token)
 *     - webhook: /api/telegram/webhook
 *     - /start buyrug'i (OTP kodni bot orqali yuborish)
 *     - Mini App menyu tugmasi
 *
 *  2) Auth bot (`TELEGRAM_AUTH_BOT_TOKEN` yoki admin panel'da kiritilgan token)
 *     - webhook: /api/telegram/auth-webhook
 *     - /royxatdan_otish, /malumotlarim, /yordam buyruqlari
 *
 * Tokenlar ustuvorligi: admin panel (app_settings jadvali) > env.
 * Ishlatish:  npm run telegram:setup
 */
import "dotenv/config";
import pg from "pg";

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
const mainSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const authSecret = process.env.TELEGRAM_AUTH_WEBHOOK_SECRET?.trim() || mainSecret;

/** Admin panel'da saqlangan tokenlarni bazadan o'qiydi (env'dan ustun turadi). */
async function tokensFromDb() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) return {};
  const needsSsl =
    databaseUrl.includes("sslmode=") || databaseUrl.includes(".neon.tech");
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 10_000,
  });
  try {
    await client.connect();
    const res = await client.query("SELECT key, value FROM app_settings");
    const map = {};
    for (const row of res.rows) {
      if (row.value) map[row.key] = row.value;
    }
    return map;
  } catch (err) {
    console.warn("⚠️  Bazadan sozlashlar o'qilmadi:", err.message);
    return {};
  } finally {
    await client.end().catch(() => undefined);
  }
}

const dbSettings = await tokensFromDb();
const setting = (key, envValue) => (dbSettings[key] || envValue || "").trim();

const mainToken = setting("telegram_bot_token", process.env.TELEGRAM_BOT_TOKEN);
const authToken = setting("telegram_auth_bot_token", process.env.TELEGRAM_AUTH_BOT_TOKEN);

if (!appUrl) {
  console.error("✗ NEXT_PUBLIC_APP_URL topilmadi, masalan: https://agroz-ai.vercel.app");
  process.exit(1);
}
if (!appUrl.startsWith("https://")) {
  console.error("✗ Telegram webhook faqat HTTPS manzil bilan ishlaydi. Vercel domenini kiriting.");
  process.exit(1);
}
if (!mainToken && !authToken) {
  console.error(
    "✗ Hech bo'lmaganda bitta bot tokeni kerak (env yoki admin panel orqali kiritilgan).",
  );
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
    console.warn("⚠️  Asosiy bot tokeni yo'q — asosiy bot sozlanmadi.");
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

  await call("setMyCommands", {
    commands: [
      { command: "start", description: "Boshlash / tasdiqlash kodini olish" },
      { command: "yangiliklar", description: "Agro va chorvachilik yangiliklari" },
    ],
  });
  console.log("✓ Buyruqlar o'rnatildi: /start, /yangiliklar");

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
    console.warn("⚠️  Auth bot tokeni yo'q — auth bot sozlanmadi.");
    return;
  }
  const call = makeCall(authToken);

  const me = await call("getMe");
  console.log(`✓ Auth bot: @${me.username} — ${me.first_name}`);

  const webhookUrl = `${appUrl}/api/telegram/auth-webhook`;
  await call("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
    ...(authSecret ? { secret_token: authSecret } : {}),
  });
  console.log(`✓ Auth webhook: ${webhookUrl}`);

  await call("setMyCommands", {
    commands: [
      { command: "start", description: "Boshlash" },
      { command: "royxatdan_otish", description: "Ro'yxatdan o'tish / ma'lumotlarni yangilash" },
      { command: "dori_qoshish", description: "Dorixonaga dori qo'shish (rasm + nom)" },
      { command: "malumotlarim", description: "Profilimni ko'rish" },
      { command: "yangiliklar", description: "Agro va chorvachilik yangiliklari" },
      { command: "bekor", description: "Jarayonni to'xtatish" },
      { command: "yordam", description: "Yordam" },
    ],
  });
  console.log("✓ Auth bot buyruqlari o'rnatildi");

  try {
    await call("setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "Mutaxassislar",
        web_app: { url: `${appUrl}/mutaxassislar` },
      },
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
