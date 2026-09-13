/**
 * Local ishlab chiqish uchun botlarni long-polling rejimida ishga tushiradi.
 *
 * Telegram webhook faqat public HTTPS manzilga ishlaydi, shuning uchun localhost'da
 * webhook o'rnatib bo'lmaydi. Bu skript `getUpdates` orqali update'larni oladi va
 * ularni **aynan shu** Next.js webhook route'lariga yuboradi — ya'ni bot mantig'i
 * production bilan bir xil qoladi (kod ikki marta yozilmaydi).
 *
 * Ishlatish:
 *   1-terminal:  npm run dev
 *   2-terminal:  npm run telegram:poll
 *
 * To'xtatish: Ctrl+C (webhook holati o'zgartirilmaydi).
 */
import "dotenv/config";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "") || "http://localhost:3000";

const sharedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

const bots = [
  {
    name: "Asosiy bot (OTP)",
    token: process.env.TELEGRAM_BOT_TOKEN?.trim(),
    path: "/api/telegram/webhook",
    secret: sharedSecret,
    updates: ["message"],
  },
  {
    name: "Auth bot (ro'yxatdan o'tish)",
    token: process.env.TELEGRAM_AUTH_BOT_TOKEN?.trim(),
    path: "/api/telegram/auth-webhook",
    secret: process.env.TELEGRAM_AUTH_WEBHOOK_SECRET?.trim() || sharedSecret,
    updates: ["message", "callback_query"],
  },
].filter((b) => b.token);

if (bots.length === 0) {
  console.error(
    "✗ Hech qanday bot tokeni topilmadi. .env ga TELEGRAM_AUTH_BOT_TOKEN (va kerak bo'lsa TELEGRAM_BOT_TOKEN) qo'ying.",
  );
  process.exit(1);
}

const apiBase = (token, method) => `https://api.telegram.org/bot${token}/${method}`;

async function call(token, method, payload, timeoutMs = 40_000) {
  const res = await fetch(apiBase(token, method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(`${method}: ${json.description ?? res.status}`);
  return json.result;
}

let stopping = false;
process.on("SIGINT", () => {
  if (!stopping) {
    stopping = true;
    console.log("\n⏹  To'xtatilmoqda...");
  }
});

async function runBot(bot) {
  const me = await call(bot.token, "getMe");
  console.log(`✓ ${bot.name}: @${me.username}`);

  // getUpdates webhook o'rnatilgan bo'lsa 409 Conflict beradi — shuning uchun o'chiramiz.
  await call(bot.token, "deleteWebhook", { drop_pending_updates: false });
  console.log(`  ↳ webhook o'chirildi, polling boshlandi → ${appUrl}${bot.path}`);

  let offset = 0;
  while (!stopping) {
    let updates;
    try {
      updates = await call(bot.token, "getUpdates", {
        offset,
        timeout: 25,
        allowed_updates: bot.updates,
      });
    } catch (err) {
      if (stopping) break;
      console.error(`  ⚠️  getUpdates xatosi (${bot.name}):`, err.message);
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }

    for (const update of updates) {
      offset = update.update_id + 1;
      try {
        const res = await fetch(`${appUrl}${bot.path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(bot.secret ? { "x-telegram-bot-api-secret-token": bot.secret } : {}),
          },
          body: JSON.stringify(update),
          signal: AbortSignal.timeout(20_000),
        });
        const kind =
          update.callback_query ? "callback_query"
          : update.message?.text ? `message "${update.message.text.slice(0, 24)}"`
          : update.message?.contact ? "message contact"
          : update.message?.location ? "message location"
          : "message";
        console.log(`  → ${kind}  [HTTP ${res.status}]`);
      } catch (err) {
        console.error(`  ⚠️  ${bot.name} update'ini yuborib bo'lmadi:`, err.message);
        console.error("     Next.js ishlayaptimi? `npm run dev` ni tekshiring.");
      }
    }
  }
}

console.log(`🤖 Polling rejimi. Ilova manzili: ${appUrl}\n`);
try {
  await Promise.all(bots.map((bot) => runBot(bot)));
} catch (err) {
  console.error("✗ Polling to'xtadi:", err.message);
  process.exit(1);
}
console.log("✓ Polling to'xtatildi.");
