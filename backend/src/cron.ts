import { db } from "./db/index.js";
import { orders, users, specialists } from "./db/schema.js";
import { lt, and, eq, or, isNull, gt } from "drizzle-orm";
import { sendPushToUser } from "./lib/push.js";
import { partnerBotToken, partnerMiniappUrl } from "./lib/settings.js";
import { escapeHtml } from "./lib/tg-escape.js";

export function startCronJobs() {
  // Buyurtmalarni tekshirish (har soatda)
  setInterval(async () => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredOrders = await db.select()
        .from(orders)
        .where(
          and(
            or(eq(orders.status, "yangi"), eq(orders.status, "tasdiqlandi")),
            lt(orders.createdAt, yesterday)
          )
        );

      for (const ord of expiredOrders) {
        await db.update(orders).set({ status: "bekor" }).where(eq(orders.id, ord.id));
        if (ord.userId) {
          await sendPushToUser(ord.userId, {
            title: "Buyurtma bekor qilindi",
            body: "Sizning buyurtmangiz 24 soat ichida olib ketilmagani uchun avtomatik bekor qilindi.",
          });
        }
      }
    } catch (err) {
      console.error("[Cron] Order expiration error:", err);
    }
  }, 60 * 60 * 1000);

  // 07:00 ob-havo xabarnomasi (kunlik, har soatda tekshiradi, 07:xx da yuboradi)
  setInterval(async () => {
    const now = new Date();
    // Toshkent vaqti bilan 7:00 gacha (UTC+5)
    // local 7 = UTC 2
    if (now.getUTCHours() === 2) {
      try {
        const subscribedUsers = await db.select().from(users).where(eq(users.isWeatherPushEnabled, true));
        for (const u of subscribedUsers) {
          await sendPushToUser(u.id, {
            title: "Bugungi ob-havo",
            body: "AgrozGO ilovasida bugungi ob-havo va ekinlar holati bilan tanishing.",
          });
        }
      } catch (err) {
        console.error("[Cron] Weather push error:", err);
      }
    }
  }, 60 * 60 * 1000);

  // Hamkorlarning 1 oylik sinov muddati tugashiga 5 kun qolganda Telegram ogohlantirishini yuborish (har 2 soatda tekshiradi)
  setInterval(async () => {
    try {
      const pToken = await partnerBotToken();
      if (!pToken) return;

      const now = new Date();
      const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

      // Bepul sinovda bo'lgan, telegramId ulangan va trial_warning_sent_at bo'sh bo'lgan hamkorlar
      const partners = await db
        .select()
        .from(specialists)
        .where(
          and(
            eq(specialists.isActive, true),
            gt(specialists.telegramId, 0),
            or(eq(specialists.subscriptionStatus, "trial"), isNull(specialists.subscriptionStatus)),
            isNull(specialists.trialWarningSentAt)
          )
        );

      for (const p of partners) {
        const trialEnd = p.trialEndsAt ? new Date(p.trialEndsAt) : new Date(p.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        const msLeft = trialEnd.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

        if (daysLeft <= 5 && daysLeft > 0 && p.telegramId) {
          const warningText =
            `⚠️ <b>MUHIM OGOHLANTIRISH: Bepul sinov muddati tugashiga ${daysLeft} kun qoldi!</b>\n\n` +
            `Hurmatli <b>${escapeHtml(p.name)}</b> («${escapeHtml(p.organization || p.specialty || "Do'koningiz")}»),\n` +
            `Sizning Agroz Business ERP tizimidagi 1 oylik bepul sinov davringiz <b>${trialEnd.toLocaleDateString("uz-UZ")}</b> kuni yakunlanadi.\n\n` +
            `📌 <b>Shartnomaga muvofiq:</b>\n` +
            `1 oylik sinov tugagach, xizmat pullik obunaga (149 000 so'm/oy) o'tadi. To'lov amalga oshirilmasa, kabinet va ma'lumotlar bazasi vaqtincha yopilishi mumkin.\n\n` +
            `Barcha tovarlar va hisob-kitoblar uzluksiz ishlashi uchun obunani oldindan uzaytiring:`;

          try {
            await fetch(`https://api.telegram.org/bot${pToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: p.telegramId,
                text: warningText,
                parse_mode: "HTML",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "💳 Obunani faollashtirish (Tariflar)",
                        web_app: { url: partnerMiniappUrl() },
                      },
                    ],
                  ],
                },
              }),
            });

            await db
              .update(specialists)
              .set({ trialWarningSentAt: new Date() })
              .where(eq(specialists.id, p.id));
          } catch (sendErr) {
            console.error(`[Cron:TrialWarning] Error sending to specialist #${p.id}:`, sendErr);
          }
        }
      }
    } catch (cronErr) {
      console.error("[Cron:TrialWarning error]:", cronErr);
    }
  }, 2 * 60 * 60 * 1000);
}
