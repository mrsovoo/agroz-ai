import { NextResponse } from "next/server";
import { createOrder, rateOrder } from "@/lib/orders";
import { getCurrentUser } from "@/lib/session";
import { cleanText, clientIp, normalizePhone } from "@/lib/validate";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { withApiErrors } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Mijoz buyurtmasi. Savat **bitta dorixona** dorilari bilan yuboriladi:
 * { pharmacySpecialistId, items: [{medicineId, qty}], customer..., note, deliveryType }
 *
 * Anonim (kirmagan) mijoz ham buyurtma bera oladi — telefon raqami majburiy.
 * Dorixona egasiga Telegram orqali xabar yuboriladi (lib/orders-bot orqali).
 */
export const POST = withApiErrors(async (req: Request) => {
  const user = await getCurrentUser();
  const limiterKey = user ? `orders:user:${user.id}` : `orders:ip:${clientIp(req)}`;
  // Soatiga 10 buyurtma — spam cheklovi.
  const limit = rateLimit(limiterKey, 10, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as {
    pharmacySpecialistId?: number;
    items?: { medicineId?: number; qty?: number }[];
    customerName?: string;
    customerPhone?: string;
    note?: string;
    deliveryType?: string;
    customerAddress?: string;
  };

  const pharmacySpecialistId = Number(body.pharmacySpecialistId);
  if (!Number.isSafeInteger(pharmacySpecialistId) || pharmacySpecialistId <= 0) {
    return NextResponse.json({ error: "Dorixona tanlanmagan" }, { status: 400 });
  }

  const phone = normalizePhone(body.customerPhone);
  if (!phone) {
    return NextResponse.json(
      { error: "Telefon raqamini +998XXXXXXXXX ko'rinishida kiriting" },
      { status: 400 },
    );
  }
  const name = cleanText(body.customerName, 120);
  if (!name) {
    return NextResponse.json({ error: "Ismingizni kiriting" }, { status: 400 });
  }

  const deliveryType = body.deliveryType === "delivery" ? "delivery" : "pickup";
  const customerAddress = cleanText(body.customerAddress, 300);
  if (deliveryType === "delivery" && !customerAddress) {
    return NextResponse.json({ error: "Yetkazib berish manzilini kiriting" }, { status: 400 });
  }

  const items = (Array.isArray(body.items) ? body.items : [])
    .map((i) => ({ medicineId: Number(i?.medicineId), qty: Number(i?.qty ?? 1) }))
    .filter((i) => Number.isSafeInteger(i.medicineId) && i.medicineId > 0);

  const result = await createOrder({
    userId: user?.id ?? null,
    pharmacySpecialistId,
    customerName: name,
    customerPhone: phone,
    note: cleanText(body.note, 300),
    deliveryType,
    customerAddress,
    items,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Dorixona egasiga Telegram orqali buyurtma xabari (xato bo'lsa ham buyurtma saqlanadi).
  const { notifyPharmacyNewOrder } = await import("@/lib/orders-bot");
  await notifyPharmacyNewOrder(result.pharmacy.telegramId, {
    id: result.orderId,
    customerName: result.items.length > 0 ? name : name,
    customerPhone: phone,
    note: cleanText(body.note, 300) ?? null,
    deliveryType,
    customerAddress: deliveryType === "delivery" ? customerAddress ?? null : null,
    total: result.total,
    items: result.items,
  }).catch((err) => console.error("[orders] bot xabari yuborilmadi:", err));

  return NextResponse.json({
    ok: true,
    orderId: result.orderId,
    total: result.total,
  });
});

/**
 * Buyurtmani baholash: { orderId, customerPhone, stars, note? } —
 * yulduzlar dorixona reytingiga qo'shiladi.
 */
export const PUT = withApiErrors(async (req: Request) => {
  const limiterKey = `rate-order:ip:${clientIp(req)}`;
  const limit = rateLimit(limiterKey, 20, 60 * 60 * 1000);
  if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

  const body = (await req.json().catch(() => ({}))) as {
    orderId?: number;
    customerPhone?: string;
    stars?: number;
    note?: string;
  };
  const orderId = Number(body.orderId);
  const phone = normalizePhone(body.customerPhone);
  const stars = Number(body.stars);
  if (!Number.isSafeInteger(orderId) || !phone || !Number.isFinite(stars)) {
    return NextResponse.json({ error: "Ma'lumotlar to'liq emas" }, { status: 400 });
  }

  const result = await rateOrder(orderId, phone, stars, cleanText(body.note, 300));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
});
