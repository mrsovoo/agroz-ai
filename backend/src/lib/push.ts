import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getMessaging, type MulticastMessage, type SendResponse } from "firebase-admin/messaging";
import { db } from "../db/index.js";
import { pushTokens, users } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";

let firebaseInitialized = false;

function getFirebaseAdmin(): App | null {
  const apps = getApps();
  if (firebaseInitialized && apps.length > 0) {
    return apps[0]!;
  }

  const rawConfig = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawConfig) {
    return null;
  }

  try {
    let serviceAccount: any;
    if (rawConfig.trim().startsWith("{")) {
      serviceAccount = JSON.parse(rawConfig);
    } else {
      const decoded = Buffer.from(rawConfig, "base64").toString("utf-8");
      serviceAccount = JSON.parse(decoded);
    }

    if (!apps.length) {
      initializeApp({
        credential: cert(serviceAccount),
      });
    }

    firebaseInitialized = true;
    console.log("[push] Firebase Admin muvaffaqiyatli ishga tushirildi");
    return getApps()[0]!;
  } catch (err: any) {
    console.warn("[push] FIREBASE_SERVICE_ACCOUNT yuklanmadi, push xizmati o'chiq:", err.message);
    return null;
  }
}

/**
 * Foydalanuvchiga push-bildirishnoma jo'natish
 */
export async function sendPushToUser(
  userId: number,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<boolean> {
  const fb = getFirebaseAdmin();
  if (!fb) {
    console.debug(`[push:skipped] Firebase sozlanmagan. Foydalanuvchi #${userId} ga xabar: "${payload.title}"`);
    return false;
  }

  try {
    const tokens = await db
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));

    if (!tokens.length) {
      return false;
    }

    const tokenList = tokens.map((t) => t.token);

    const message: MulticastMessage = {
      tokens: tokenList,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const messaging = getMessaging(fb);
    const response = await messaging.sendEachForMulticast(message);

    // O'chirilgan yoki yaroqsiz bo'lgan tokenlarni bazadan tozalash
    const badTokens: string[] = [];
    response.responses.forEach((res: SendResponse, idx: number) => {
      if (!res.success && res.error) {
        const code = res.error.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          badTokens.push(tokenList[idx]);
        }
      }
    });

    if (badTokens.length > 0) {
      console.log(`[push] Yaroqsiz ${badTokens.length} ta token tozalanmoqda`);
      await db.delete(pushTokens).where(inArray(pushTokens.token, badTokens)).catch(() => {});
    }

    return response.successCount > 0;
  } catch (err: any) {
    console.error(`[push:error] Foydalanuvchi #${userId} ga push yuborishda xatolik:`, err.message);
    return false;
  }
}

/**
 * Buyurtma holati o'zgarganda push jo'natish
 */
export async function sendOrderStatusPush(
  userId: number | null | undefined,
  orderId: number,
  status: string
): Promise<void> {
  if (!userId) return;

  const statusMap: Record<string, { title: string; body: string }> = {
    tasdiqlandi: {
      title: `Buyurtma #${orderId} tasdiqlandi`,
      body: "Dorixona buyurtmangizni tayyorlamoqda.",
    },
    yolda: {
      title: `Buyurtma #${orderId} yo'lda`,
      body: "Kuryer buyurtmangizni yetkazish uchun yo'lga chiqdi.",
    },
    yetkazildi: {
      title: `Buyurtma #${orderId} yetkazildi`,
      body: "Buyurtmangiz muvaffaqiyatli topshirildi. Xaridingiz uchun rahmat!",
    },
    bekor: {
      title: `Buyurtma #${orderId} bekor qilindi`,
      body: "Afsuski, buyurtmangiz bekor qilindi.",
    },
  };

  const notification = statusMap[status];
  if (notification) {
    await sendPushToUser(userId, {
      title: notification.title,
      body: notification.body,
      data: {
        type: "order_status",
        orderId: String(orderId),
        status,
      },
    });
  }
}

/**
 * Mutaxassis chaqiruvi holati o'zgarganda push jo'natish
 */
export async function sendSpecialistCallPush(
  customerPhone: string,
  callId: number,
  status: string
): Promise<void> {
  try {
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-9);
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.phone, cleanPhone))
      .limit(1);

    if (!user) return;

    const statusMap: Record<string, { title: string; body: string }> = {
      qabul_qilindi: {
        title: "Chaqiruv qabul qilindi",
        body: "Mutaxassis chaqiruvingizni qabul qildi va tez orada bog'lanadi.",
      },
      bajarildi: {
        title: "Chaqiruv yakunlandi",
        body: "Agro-mutaxassis xizmati yakunlandi.",
      },
      bekor: {
        title: "Chaqiruv rad etildi",
        body: "Afsuski, mutaxassis chaqiruvni qabul qila olmadi.",
      },
    };

    const notification = statusMap[status];
    if (notification) {
      await sendPushToUser(user.id, {
        title: notification.title,
        body: notification.body,
        data: {
          type: "specialist_call",
          callId: String(callId),
          status,
        },
      });
    }
  } catch (err: any) {
    console.error("[push:specialistCall] Xatolik:", err.message);
  }
}
