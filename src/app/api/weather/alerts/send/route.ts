import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import {
  formatAlertTelegramMessage,
  formatAlertSms,
  getSampleAgroAlerts,
  type WeatherAlert,
} from "@/lib/weather-alerts";
import { sendMessage, isBotConfigured, getBotUsername } from "@/lib/telegram-bot";
import { sendOtpSms, smsConfigured } from "@/lib/sms";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = withApiErrors(async (req: Request) => {
  const body = (await req.json()) as {
    alert?: WeatherAlert;
    channel?: "telegram" | "sms";
    customRegion?: string;
    chatId?: number;
    phone?: string;
  };

  const user = await getCurrentUser();
  const region = body.customRegion || user?.region || "Toshkent";

  // Agar alert kelmagan bo'lsa, namunaviy sovuq urishi xavfini olamiz
  const alert: WeatherAlert =
    body.alert || getSampleAgroAlerts(region)[0];

  const channel = body.channel || "telegram";
  const botConfigured = await isBotConfigured();
  const botUser = await getBotUsername();

  if (channel === "telegram") {
    const telegramMessage = formatAlertTelegramMessage(alert);
    const targetChatId =
      body.chatId ?? (user?.telegramId ? Number(user.telegramId) : null);

    let sent = false;
    let note = "";

    if (targetChatId && botConfigured) {
      try {
        sent = await sendMessage(targetChatId, telegramMessage);
        if (sent) {
          note = `Ogohlantirish Telegram hisobingizga (ID: ${targetChatId}) muvaffaqiyatli yuborildi!`;
        } else {
          note = "Telegram botga xabar yuborishda xatolik yuz berdi.";
        }
      } catch (e) {
        console.error("[weather-alerts] Telegram yuborishda xato:", e);
      }
    }

    if (!sent) {
      // Agar bot ulanmagan yoki foydalanuvchi Telegram ID'ga ega bo'lmasa
      note = targetChatId
        ? `Xabar tayyorlandi. Bot faol bo'lgach ${targetChatId} raqamiga yuboriladi.`
        : `Xabarnoma matni tayyor. @${botUser ?? "agroz_bot"} orqali ro'yxatdan o'tsangiz to'g'ridan-to'g'ri yetkaziladi.`;
    }

    return NextResponse.json({
      ok: true,
      channel: "telegram",
      sent,
      deliveredTo: targetChatId ? `TG:${targetChatId}` : "Tayyorlandi",
      note,
      previewText: telegramMessage,
      botUsername: botUser,
    });
  }

  if (channel === "sms") {
    const targetPhone = body.phone || user?.phone;
    const smsText = formatAlertSms(alert);
    let sent = false;

    if (targetPhone && (await smsConfigured())) {
      try {
        sent = await sendOtpSms(targetPhone, smsText);
      } catch (e) {
        console.error("[weather-alerts] SMS yuborishda xato:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      channel: "sms",
      sent,
      deliveredTo: targetPhone || "Raqam ko'rsatilmagan",
      note: sent
        ? `${targetPhone} raqamiga SMS ogohlantirish yuborildi!`
        : `SMS matni tayyorlandi: "${smsText}"`,
      previewText: smsText,
    });
  }

  return NextResponse.json({ ok: false, error: "Noma'lum kanal" }, { status: 400 });
});
