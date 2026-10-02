import { db } from "./db/index.js";
import { orders, users } from "./db/schema.js";
import { lt, and, eq, or } from "drizzle-orm";
import { sendPushToUser } from "./lib/push.js";

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
}
