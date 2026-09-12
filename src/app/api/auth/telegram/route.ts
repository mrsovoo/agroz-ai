import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyInitData } from "@/lib/tg-auth";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { initData?: string; name?: string; region?: string };
  const initData = body.initData ?? "";
  if (!initData) {
    return NextResponse.json({ error: "Telegram ma'lumoti topilmadi" }, { status: 400 });
  }

  // Agar bot token o'rnatilgan bo'lsa, imzoni tekshiramiz
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    if (!verifyInitData(initData, token)) {
      return NextResponse.json({ error: "Imzo tekshiruvi muvaffaqiyatsiz" }, { status: 401 });
    }
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
  if (!Number.isFinite(telegramId)) {
    return NextResponse.json({ error: "Telegram ID xato" }, { status: 400 });
  }

  const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))
    .limit(1);
  let user = existing[0];

  if (!user) {
    const inserted = await db
      .insert(users)
      .values({
        telegramId,
        name: fullName || body.name || null,
        region: body.region ?? null,
      })
      .returning();
    user = inserted[0];
  } else if ((body.name && !user.name) || (body.region && !user.region)) {
    const updated = await db
      .update(users)
      .set({
        name: user.name ?? body.name ?? null,
        region: user.region ?? body.region ?? null,
      })
      .where(eq(users.id, user.id))
      .returning();
    user = updated[0];
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, user });
}
