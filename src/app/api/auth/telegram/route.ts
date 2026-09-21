import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyInitData } from "@/lib/tg-auth";
import { createSession } from "@/lib/session";
import { cleanText } from "@/lib/validate";
import { withApiErrors } from "@/lib/api";
import { telegramBotToken } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const POST = withApiErrors(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as {
    initData?: string;
    telegramId?: number | string;
    username?: string;
    name?: string;
    region?: string;
    district?: string;
  };

  const initData = body.initData ?? "";

  let telegramId: number | null = null;
  let detectedName: string | null = null;

  if (initData) {
    const token = await telegramBotToken();
    if (!token) {
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_UNVERIFIED_TELEGRAM !== "true") {
        return NextResponse.json(
          { error: "Telegram orqali kirish sozlanmagan (TELEGRAM_BOT_TOKEN yo'q)" },
          { status: 503 },
        );
      }
    } else if (!verifyInitData(initData, token)) {
      return NextResponse.json({ error: "Imzo tekshiruvi muvaffaqiyatsiz" }, { status: 401 });
    }

    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 400 });
    }

    try {
      const tgUser = JSON.parse(userRaw) as {
        id?: number;
        first_name?: string;
        last_name?: string;
        username?: string;
      };
      telegramId = Number(tgUser.id);
      detectedName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || (tgUser.username ? `@${tgUser.username}` : null);
    } catch {
      return NextResponse.json({ error: "Foydalanuvchi ma'lumoti xato" }, { status: 400 });
    }
  } else if (body.telegramId || body.username) {
    // Veb-brauzerdan Telegram orqali to'g'ridan-to'g'ri kirish
    if (body.telegramId && Number.isSafeInteger(Number(body.telegramId))) {
      telegramId = Number(body.telegramId);
    } else if (body.username) {
      const cleanUname = body.username.replace(/^@/, "").trim();
      if (!cleanUname) {
        return NextResponse.json({ error: "Telegram username kiritilmadi" }, { status: 400 });
      }
      // Barqaror musbat sonli ID hosil qilish (username asosida)
      let hash = 0;
      for (let i = 0; i < cleanUname.length; i++) {
        hash = (hash * 31 + cleanUname.charCodeAt(i)) & 0x7fffffff;
      }
      telegramId = 800_000_000 + (hash % 100_000_000);
      detectedName = `@${cleanUname}`;
    }
  } else {
    return NextResponse.json(
      { error: "Telegram ma'lumoti topilmadi. Telegram username yoki ilovadan kiring." },
      { status: 400 },
    );
  }

  if (!telegramId || !Number.isSafeInteger(telegramId) || telegramId <= 0) {
    return NextResponse.json({ error: "Telegram ID xato" }, { status: 400 });
  }

  const name = cleanText(body.name, 120) ?? cleanText(detectedName, 120);
  const region = cleanText(body.region, 120);
  const district = cleanText(body.district, 120);

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  let user = existing[0];

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        telegramId,
        name: name || `Telegram_${telegramId}`,
        region: region || "Toshkent",
        district: district || null,
      })
      .returning();
    user = inserted[0];
  } else if (name || region || district) {
    const updated = await db
      .update(users)
      .set({
        name: user.name ?? name,
        region: user.region ?? region,
        district: user.district ?? district,
      })
      .where(eq(users.id, user.id))
      .returning();
    user = updated[0];
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, userId: user.id });
});
