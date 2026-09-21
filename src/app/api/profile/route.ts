import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { cleanText } from "@/lib/validate";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

const REGIONS = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Farg'ona",
  "Andijon",
  "Namangan",
  "Qashqadaryo",
  "Surxondaryo",
  "Xorazm",
  "Jizzax",
  "Navoiy",
  "Sirdaryo",
  "Qoraqalpog'iston",
];

/**
 * Tizimga kirgan mijoz profilingizni yangilaydi (ism / hudud / tuman).
 * Body: { name?: string, region?: string, district?: string }
 */
export const POST = withApiErrors(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Avval tizimga kiring" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    region?: string;
    district?: string;
  };

  const name = cleanText(body.name, 120);
  const region = cleanText(body.region, 120);
  const district = cleanText(body.district, 120);

  if (region && region !== "-" && !REGIONS.includes(region)) {
    return NextResponse.json({ error: "Hudud tanlanmagan" }, { status: 400 });
  }

  const values: { name: string | null; region: string | null; district: string | null } = {
    name: name ?? user.name ?? null,
    region: region && region !== "-" ? region : user.region ?? null,
    district: district ?? user.district ?? null,
  };

  const updated = await db.update(users).set(values).where(eq(users.id, user.id)).returning();
  const u = updated[0];
  if (!u) return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    user: { id: u.id, name: u.name, region: u.region, district: u.district },
  });
});
