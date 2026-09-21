/**
 * Mijoz buyurtmalari: yaratish (savatdan), dorixona bo'yicha ro'yxat,
 * holatni o'zgartirish va buyurtma reytingi (dorixona reytingiga qo'shiladi).
 */

import { db } from "@/db";
import {
  orderItems,
  orders,
  specialistMedicines,
  specialistRatings,
  specialists,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export type OrderStatus = "yangi" | "tasdiqlandi" | "yetkazildi" | "bekor";

export const ORDER_STATUSES: OrderStatus[] = ["yangi", "tasdiqlandi", "yetkazildi", "bekor"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}

export type OrderInputItem = { medicineId: number; qty: number };

export type CreateOrderInput = {
  userId: number | null;
  pharmacySpecialistId: number;
  customerName: string;
  customerPhone: string;
  note?: string | null;
  deliveryType: "pickup" | "delivery";
  customerAddress?: string | null;
  items: OrderInputItem[];
};

export type OrderWithItems = {
  id: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  note: string | null;
  deliveryType: string;
  customerAddress: string | null;
  totalSum: number | null;
  ratingStars: number | null;
  ratingNote: string | null;
  createdAt: Date;
  items: { id: number; name: string; price: number | null; qty: number }[];
};

/**
 * Buyurtma yaratadi. Narxlar **server tomonda** dorixonaning joriy narxlaridan
 * olinadi (client yuborgan narx ishonchsiz). Dori shu dorixonaga tegishli va
 * mavjud (bor) bo'lishi shart. Umumiy summa ham shu yerda hisoblanadi.
 */
export async function createOrder(input: CreateOrderInput) {
  // Dorixona faol bo'lishi shart.
  const pharmacy = await db
    .select()
    .from(specialists)
    .where(
      and(
        eq(specialists.id, input.pharmacySpecialistId),
        eq(specialists.role, "pharmacy"),
        eq(specialists.isActive, true),
      ),
    )
    .limit(1);
  const pharmacyRow = pharmacy[0];
  if (!pharmacyRow) return { ok: false as const, error: "Dorixona topilmadi" };

  // Savatdagi dorilarni server tomonda tekshirish va narxlash.
  const wanted = input.items
    .filter((i) => Number.isSafeInteger(i.medicineId) && i.medicineId > 0)
    .slice(0, 30);
  if (wanted.length === 0) return { ok: false as const, error: "Savat bo'sh" };

  const ids = [...new Set(wanted.map((i) => i.medicineId))];
  const medRows = await db
    .select({
      id: specialistMedicines.id,
      name: specialistMedicines.name,
      price: specialistMedicines.price,
      status: specialistMedicines.status,
    })
    .from(specialistMedicines)
    .where(
      and(
        eq(specialistMedicines.specialistId, input.pharmacySpecialistId),
        inArray(specialistMedicines.id, ids),
      ),
    );
  const medMap = new Map<number, { name: string; price: number | null; status: string }>();
  for (const row of medRows) {
    medMap.set(row.id, { name: row.name, price: row.price, status: row.status });
  }

  const prepared: { medicineId: number; name: string; price: number | null; qty: number }[] = [];
  for (const item of wanted) {
    const med = medMap.get(item.medicineId);
    if (!med) return { ok: false as const, error: "Dorilardan biri bu dorixonada yo'q" };
    if (med.status !== "bor") return { ok: false as const, error: `"${med.name}" hozircha yo'q` };
    const qty = Math.max(1, Math.min(99, Math.round(item.qty) || 1));
    prepared.push({ medicineId: item.medicineId, name: med.name, price: med.price, qty });
  }

  const total = prepared.reduce((acc, p) => acc + (p.price ?? 0) * p.qty, 0);

  const inserted = await db
    .insert(orders)
    .values({
      userId: input.userId,
      pharmacySpecialistId: input.pharmacySpecialistId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      note: input.note ?? null,
      deliveryType: input.deliveryType === "delivery" ? "delivery" : "pickup",
      customerAddress: input.deliveryType === "delivery" ? input.customerAddress ?? null : null,
      totalSum: total,
      status: "yangi",
    })
    .returning({ id: orders.id });
  const orderId = inserted[0].id;

  await db.insert(orderItems).values(
    prepared.map((p) => ({
      orderId,
      medicineId: p.medicineId,
      name: p.name,
      price: p.price,
      qty: p.qty,
    })),
  );

  return {
    ok: true as const,
    orderId,
    pharmacy: {
      id: pharmacyRow.id,
      name: pharmacyRow.organization ?? pharmacyRow.name,
      telegramId: pharmacyRow.telegramId,
      phone: pharmacyRow.phone,
      address: pharmacyRow.address,
    },
    items: prepared,
  };
}

/** Dorixona (yoki id) bo'yicha buyurtmalar ro'yxati — item'lari bilan. */
export async function listOrders(opts: {
  pharmacySpecialistId?: number;
  orderId?: number;
  limit?: number;
}): Promise<OrderWithItems[]> {
  const limit = Math.max(1, Math.min(100, opts.limit ?? 30));
  const where = opts.orderId
    ? eq(orders.id, opts.orderId)
    : opts.pharmacySpecialistId
      ? eq(orders.pharmacySpecialistId, opts.pharmacySpecialistId)
      : undefined;
  if (!where) return [];

  const rows = await db.select().from(orders).where(where).orderBy(desc(orders.id)).limit(limit);
  if (rows.length === 0) return [];

  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));

  const byOrder = new Map<number, OrderWithItems["items"]>();
  for (const it of items) {
    const list = byOrder.get(it.orderId) ?? [];
    list.push({ id: it.id, name: it.name, price: it.price, qty: it.qty });
    byOrder.set(it.orderId, list);
  }

  return rows.map((o) => ({
    id: o.id,
    status: (isOrderStatus(o.status) ? o.status : "yangi") as OrderStatus,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    note: o.note,
    deliveryType: o.deliveryType,
    customerAddress: o.customerAddress,
    totalSum: o.totalSum,
    ratingStars: o.ratingStars,
    ratingNote: o.ratingNote,
    createdAt: o.createdAt,
    items: byOrder.get(o.id) ?? [],
  }));
}

/**
 * Mijoz o'z buyurtmalarini telefon raqami bo'yicha kuzatadi (status + reyting).
 * Faqat ixcham maydonlar qaytariladi — dorixona uchun maxfiy ma'lumot chiqmaydi.
 */
export async function listOrdersByPhone(phone: string, limit = 20) {
  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalSum: orders.totalSum,
      deliveryType: orders.deliveryType,
      ratingStars: orders.ratingStars,
      createdAt: orders.createdAt,
      pharmacyName: specialists.organization,
      pharmacyContact: specialists.name,
    })
    .from(orders)
    .innerJoin(specialists, eq(specialists.id, orders.pharmacySpecialistId))
    .where(eq(orders.customerPhone, phone))
    .orderBy(desc(orders.id))
    .limit(Math.max(1, Math.min(50, limit)));

  if (rows.length === 0) return [];
  const items = await db
    .select({
      orderId: orderItems.orderId,
      name: orderItems.name,
      price: orderItems.price,
      qty: orderItems.qty,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, rows.map((r) => r.id)));

  return rows.map((o) => ({
    ...o,
    status: (isOrderStatus(o.status) ? o.status : "yangi") as OrderStatus,
    items: items.filter((i) => i.orderId === o.id),
  }));
}

/** Buyurtma holatini o'zgartiradi (faqat shu dorixona egasi uchun). */
export async function setOrderStatus(
  telegramId: number,
  orderId: number,
  status: OrderStatus,
): Promise<boolean> {
  const profile = await db
    .select({ id: specialists.id })
    .from(specialists)
    .where(eq(specialists.telegramId, telegramId))
    .limit(1);
  const profileRow = profile[0];
  if (!profileRow) return false;

  const rows = await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.pharmacySpecialistId, profileRow.id)))
    .returning({ id: orders.id });
  return rows.length > 0;
}

/**
 * Mijoz buyurtmani baholaydi: yulduz + izoh. Yulduzlar **dorixona reytingiga
 * qo'shiladi** (bir buyurtma = bitta ovoz) va buyurtma `ratingStars` bilan
 * belgilanadi. Reyting qancha yaxshi bo'lsa — reyting shuncha oshadi.
 */
export async function rateOrder(
  orderId: number,
  customerPhone: string,
  stars: number,
  note: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const clamped = Math.max(1, Math.min(5, Math.round(stars)));
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerPhone, customerPhone)))
    .limit(1);
  const order = rows[0];
  if (!order) return { ok: false, error: "Buyurtma topilmadi" };
  if (order.status !== "yetkazildi") return { ok: false, error: "Buyurtma hali yetkazilmagan" };
  if (order.ratingStars !== null) return { ok: false, error: "Bu buyurtma allaqachon baholangan" };

  await db
    .update(orders)
    .set({ ratingStars: clamped, ratingNote: note?.slice(0, 300) ?? null, ratedAt: new Date() })
    .where(eq(orders.id, orderId));

  // Dorixona reytingiga qo'shamiz — raterKey buyurtma asosida (bir buyurtma = bitta ovoz).
  await db
    .insert(specialistRatings)
    .values({
      specialistId: order.pharmacySpecialistId,
      raterKey: `order:${orderId}`,
      stars: clamped,
    })
    .onConflictDoUpdate({
      target: [specialistRatings.specialistId, specialistRatings.raterKey],
      set: { stars: clamped },
    });

  return { ok: true };
}
