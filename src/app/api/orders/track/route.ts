import { NextResponse } from "next/server";
import { listOrdersByPhone } from "@/lib/orders";
import { normalizePhone, clientIp } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Mijoz o'z buyurtmalarini telefon raqami bo'yicha kuzatadi:
 * GET /api/orders/track?phone=+998XXXXXXXXX
 *
 * Rate-limit: soatiga 30 so'rov (raqam sanab bo'lishining oldini olish uchun).
 */
export const GET = withApiErrors(async (req: Request) => {
  const limit = rateLimit(`track:ip:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const url = new URL(req.url);
  const raw = url.searchParams.get("phone") ?? "";
  const phone = normalizePhone(raw);
  if (!phone) {
    return NextResponse.json({ error: "Telefon raqamini to'g'ri kiriting" }, { status: 400 });
  }

  const orders = await listOrdersByPhone(phone);
  return NextResponse.json({ orders });
});
