import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { withApiErrors } from "@/lib/api";
import { rateSpecialist } from "@/lib/specialists";
import { clientIp, cleanText } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Mutaxassis/dorixonaga reyting berish (1–5 yulduz).
 *
 * Body: { specialistId: number, stars: 1..5 }
 * Bir mijoz (IP hash) bir mutaxassisdga bitta ovoz — qayta bersa yangilanadi.
 */
export const POST = withApiErrors(async (req: Request) => {
  const ip = clientIp(req);
  const limit = rateLimit(`rating:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as {
    specialistId?: number | string;
    stars?: number | string;
  };

  const specialistId = Number(body.specialistId);
  const stars = Number(body.stars);
  if (!Number.isSafeInteger(specialistId) || specialistId <= 0) {
    return NextResponse.json({ error: "Mutaxassis topilmadi" }, { status: 400 });
  }
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Reyting 1 dan 5 gacha bo'lishi kerak" }, { status: 400 });
  }

  // Anonim mijoz kaliti — IP asosida, teskari o'qib bo'lmaydigan hash.
  const raterKey = createHash("sha256")
    .update(`rating:${cleanText(ip, 60) ?? "unknown"}`)
    .digest("hex")
    .slice(0, 40);

  const result = await rateSpecialist(specialistId, raterKey, stars);
  if (!result) {
    return NextResponse.json({ error: "Mutaxassis topilmadi" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    ratingAvg: Math.round(result.avg * 10) / 10,
    ratingCount: result.count,
  });
});
