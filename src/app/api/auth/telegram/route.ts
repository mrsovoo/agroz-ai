import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyInitData } from "@/lib/tg-auth";
import { createSession } from "@/lib/session";
import { cleanText } from "@/lib/validate";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

export const POST = withApiErrors(async (req: Request) => {
  const body = (await req.json().catch(() => ({}))) as {
    initData?: string;
    name?: string;
    region?: string;
    district?: string;
  };
  const initData = body.initData ?? "";
  if (!initData) {
    return NextResponse.json({ error: "Telegram ma'lumoti topilmadi" }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    // Imzo tekshirilmasa istalgan odam istalgan telegram_id bilan kirishi mumkin.
    // Shuning uchun production'da bu yo'l ataylab yopiq.
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

  let tgUser: { id?: number; first_name?: string; last_name?: string; username?: string };
  try {
    tgUser = JSON.parse(userRaw);
  } catch {
    return NextResponse.json({ error: "Foydalanuvchi ma'lumoti xato" }, { status: 400 });
  }

  const telegramId = Number(tgUser.id);
  if (!Number.isSafeInteger(telegramId) || telegramId <= 0) {
    return NextResponse.json({ error: "Telegram ID xato" }, { status: 400 });
  }

  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
  const name = cleanText(body.name, 120) ?? cleanText(fullName, 120);
  const region = cleanText(body.region, 120);
  const district = cleanText(body.district, 120);

  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1);
  let user = existing[0];

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({ telegramId, name, region, district })
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
  return NextResponse.json({ ok: true });
});
