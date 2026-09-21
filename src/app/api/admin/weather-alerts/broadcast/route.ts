import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import {
  formatAlertTelegramMessage,
  getSampleAgroAlerts,
  type WeatherAlert,
} from "@/lib/weather-alerts";
import { sendMessage, isBotConfigured } from "@/lib/telegram-bot";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = withApiErrors(async (req: Request) => {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ ok: false, error: "Ruxsat etilmagan" }, { status: 401 });
  }

  const body = (await req.json()) as {
    region?: string; // "Barcha viloyatlar" yoki aniq bitta viloyat
    alertType?: "frost" | "heavy_rain";
    customTitle?: string;
    customMessage?: string;
  };

  const region = body.region || "Barcha viloyatlar";
  const alertType = body.alertType || "frost";

  // Namunaviy yoki mos xavfni olamiz
  const sampleList = getSampleAgroAlerts(region === "Barcha viloyatlar" ? "O'zbekiston" : region);
  const baseAlert = sampleList.find((a) => a.type === alertType) || sampleList[0];

  const alert: WeatherAlert = {
    ...baseAlert,
    title: body.customTitle || baseAlert.title,
    description: body.customMessage || baseAlert.description,
    region: region,
  };

  const messageText = formatAlertTelegramMessage(alert);
  const botReady = await isBotConfigured();

  // Foydalanuvchilarni qidiramiz
  let userList: Array<{
    id: number;
    telegramId: number | null;
    phone: string | null;
    region: string | null;
  }> = [];
  try {
    if (region === "Barcha viloyatlar") {
      userList = await db
        .select({ id: users.id, telegramId: users.telegramId, phone: users.phone, region: users.region })
        .from(users)
        .where(isNotNull(users.telegramId));
    } else {
      userList = await db
        .select({ id: users.id, telegramId: users.telegramId, phone: users.phone, region: users.region })
        .from(users)
        .where(eq(users.region, region));
    }
  } catch (err) {
    console.warn("[broadcast] DB qidiruvida ogohlantirish:", err);
  }

  let sentCount = 0;
  let failCount = 0;

  if (botReady && userList.length > 0) {
    for (const u of userList) {
      if (u.telegramId) {
        try {
          const ok = await sendMessage(Number(u.telegramId), messageText);
          if (ok) sentCount++;
          else failCount++;
        } catch {
          failCount++;
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    totalTargetUsers: userList.length,
    sentCount,
    failCount,
    botReady,
    region,
    previewMessage: messageText,
    note: botReady
      ? `${sentCount} ta foydalanuvchiga Telegram orqali ogohlantirish yuborildi.`
      : "Telegram bot konfiguratsiya qilinmagan, xabarnoma simulyatsiya rejimida sinovdan o'tkazildi.",
  });
});
