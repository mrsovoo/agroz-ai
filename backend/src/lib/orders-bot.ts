/**
 * Buyurtmalar bilan bog'liq bot xabarlari (`@agroz_auth_bot` orqali):
 * - yangi buyurtma xabari dorixona egasiga
 * - /buyurtmalar ro'yxati va holat o'zgartirish klaviaturalari
 */

import { escapeHtml } from "@/lib/tg-escape";
import { isAuthBotConfigured, sendAuthMessage, type InlineKeyboard } from "@/lib/auth-bot";
import {
  isBotConfigured as isMainBotConfigured,
  sendMessage as sendMainBotMessage,
} from "@/lib/telegram-bot";
import type { OrderStatus, OrderWithItems } from "@/lib/orders";

/** Buyurtma holati uchun emoji va yorliq. */
export function orderStatusLabel(status: OrderStatus, deliveryType?: string): { emoji: string; label: string } {
  switch (status) {
    case "yangi":
      return { emoji: "🆕", label: "Yangi" };
    case "tasdiqlandi":
      return { emoji: "✅", label: "Tasdiqlandi" };
    case "yetkazildi":
      return deliveryType === "pickup"
        ? { emoji: "🏪", label: "Olib ketildi" }
        : { emoji: "📦", label: "Yetkazildi" };
    case "bekor":
      return { emoji: "❌", label: "Bekor qilindi" };
  }
}

/** Summani qisqa ko'rinishda: 45000 → "45 000". */
export function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

/**
 * Buyurtma raqamini #000000 formatida ko'rsatadi.
 * Agar 999 999 dan oshsa, #000000-1, #000000-2 shaklida davom etadi.
 */
export function formatOrderNumber(orderId: number | string): string {
  const num = typeof orderId === "string" ? parseInt(orderId, 10) : orderId;
  if (!Number.isFinite(num) || num <= 0) return "#000001";
  if (num <= 999999) {
    return `#${String(num).padStart(6, "0")}`;
  }
  const overflow = num - 999999;
  return `#000000-${overflow}`;
}

/** Bitta buyurtma matni (dorixona egasi ko'radi). */
export function orderMessage(order: OrderWithItems): string {
  const st = orderStatusLabel(order.status, order.deliveryType);
  const isDelivery = order.deliveryType === "delivery";
  const delivery = isDelivery
    ? [
        "🚚 <b>Qabul qilish usuli:</b> <b>Yetkazib berish (Kuryer orqali)</b>",
        `📍 <b>Yetkazish manzili:</b> <code>${escapeHtml(order.customerAddress ?? "Ko'rsatilmadi")}</code>`,
        order.customerAddress
          ? `🗺 <a href="https://maps.google.com/?q=${encodeURIComponent(order.customerAddress)}">Xaritada manzilni ochish</a>`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "🏪 <b>Qabul qilish usuli:</b> <b>Dorixonadan olib ketish (Mijoz o'zi borib oladi)</b>";

  const items = order.items
    .map(
      (i, idx) =>
        `${idx + 1}. 💊 <b>${escapeHtml(i.name)}</b> × ${i.qty} ta${i.price ? ` — <b>${shortSum(i.price * i.qty)} so'm</b>` : ""}`,
    )
    .join("\n");

  const rating = order.ratingStars
    ? [
        "",
        `⭐️ Mijoz bahosi: ${"★".repeat(order.ratingStars)}${"☆".repeat(5 - order.ratingStars)} (${order.ratingStars}/5)`,
        ...(order.ratingNote ? [`💬 "${escapeHtml(order.ratingNote)}"`] : []),
      ]
    : [];

  return [
    `🔔 <b>YANGI BUYURTMA KELIB TUSHDI! (${formatOrderNumber(order.id)})</b>`,
    "",
    `Holati: ${st.emoji} <b>${st.label}</b>`,
    `👤 <b>Mijoz:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Telefon:</b> <code>${escapeHtml(order.customerPhone)}</code>`,
    "",
    delivery,
    "",
    "📦 <b>Buyurtma qilingan dori vositalari:</b>",
    items,
    "",
    `💰 <b>Jami to'lov: ${order.totalSum !== null ? `${shortSum(order.totalSum)} so'm` : "kelishiladi"}</b>`,
    order.note ? `\n📝 <b>Mijoz izohi:</b> <i>${escapeHtml(order.note)}</i>` : "",
    ...rating,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Holat o'zgartirish klaviaturasi (qo'ng'iroq, holat va mutaxassis biriktirish). */
export function orderActionsKeyboard(order: OrderWithItems): InlineKeyboard {
  const rows: InlineKeyboard["inline_keyboard"] = [];
  const cleanPhone = (order.customerPhone || "").replace(/[^\d+]/g, "");



  // 2. Buyurtma holati tugmalari
  if (order.status === "yangi") {
    rows.push([
      { text: "✅ Qabul qilish", callback_data: `o:confirm:${order.id}` },
      { text: "❌ Bekor qilish", callback_data: `o:cancel:${order.id}` },
    ]);
  } else if (order.status === "tasdiqlandi") {
    rows.push([
      {
        text: order.deliveryType === "delivery" ? "🛵 Yetkazildi" : "✅ Mijoz olib ketdi",
        callback_data: `o:done:${order.id}`,
      },
    ]);
  }

  // 3. Mutaxassis (agronom/veterinar) chiqarish yoki biriktirish tugmasi
  rows.push([
    { text: "👨‍🌾 Mutaxassis biriktirish", callback_data: `o:spec:${order.id}` },
  ]);

  return { inline_keyboard: rows };
}

/** /buyurtmalar ro'yxati klaviaturasi — har bir buyurtma alohida tugma (bahosi bilan). */
export function ordersListKeyboard(orders: OrderWithItems[]): InlineKeyboard {
  const rows = orders.slice(0, 20).map((o) => {
    const st = orderStatusLabel(o.status, o.deliveryType);
    const stars = o.ratingStars ? ` · ${"★".repeat(o.ratingStars)}` : "";
    const itemsCount = o.items ? o.items.reduce((s, it) => s + it.qty, 0) : 0;
    const itemsLabel = itemsCount > 0 ? ` · (${itemsCount} ta)` : "";
    const deliveryIcon = o.deliveryType === "delivery" ? "🚚" : "🏪";
    return [
      {
        text: `${st.emoji} ${formatOrderNumber(o.id)} · ${o.customerName} ${deliveryIcon}${itemsLabel} · ${o.totalSum !== null ? shortSum(o.totalSum) + " so'm" : "narxsiz"}${stars}`,
        callback_data: `o:view:${o.id}`,
      },
    ];
  });
  return { inline_keyboard: rows };
}

/** /buyurtmalar — buyurtmalar yo'q paytidagi xabar. */
export function ordersEmptyMessage(): string {
  return [
    "📭 Hozircha buyurtmalar yo'q.",
    "",
    "Mijozlar sayt yoki Mini Appdagi <b>Dorilar</b> bo'limidan buyurtma beradi —",
    "yangi buyurtma shu chatga darhol tushadi.",
  ].join("\n");
}

/** /buyurtmalar ro'yxati sarlavhasi va batafsil xulosasi. */
export function ordersHintMessage(ordersOrCount: OrderWithItems[] | number): string {
  if (typeof ordersOrCount === "number") {
    return [
      `📋 <b>Buyurtmalar</b> (${ordersOrCount} ta)`,
      "",
      "Batafsil ko'rish va holatini o'zgartirish uchun buyurtmani bosing:",
    ].join("\n");
  }

  const orders = ordersOrCount;
  const count = orders.length;

  const orderCards = orders.slice(0, 8).map((o, idx) => {
    const st = orderStatusLabel(o.status, o.deliveryType);
    const itemsText =
      o.items && o.items.length > 0
        ? o.items
            .map(
              (it) =>
                `   • <b>${escapeHtml(it.name)}</b> × ${it.qty} ta${it.price ? ` (${shortSum(it.price * it.qty)} so'm)` : ""}`,
            )
            .join("\n")
        : "   • Dori ko'rsatilmagan";

    const addressText =
      o.deliveryType === "delivery"
        ? `📍 <b>Yetkazish manzili:</b> <code>${escapeHtml(o.customerAddress || "Manzil kiritilmagan")}</code>`
        : `🏪 <b>Qabul qilish:</b> Mijoz dorixonadan o'zi olib ketadi`;

    return [
      `<b>${idx + 1}. Buyurtma ${formatOrderNumber(o.id)}</b> [${st.emoji} ${st.label}]`,
      `👤 <b>Mijoz:</b> ${escapeHtml(o.customerName)} (<code>${escapeHtml(o.customerPhone)}</code>)`,
      addressText,
      `📦 <b>Buyurtma qilingan mahsulotlar:</b>\n${itemsText}`,
      `💰 <b>Jami summa:</b> <b>${o.totalSum ? shortSum(o.totalSum) + " so'm" : "kelishiladi"}</b>`,
    ].join("\n");
  });

  return [
    `📋 <b>BUYURTMALAR RO'YXATI (${count} ta)</b>`,
    "",
    orderCards.join("\n\n───────────────────\n\n"),
    count > 8 ? `\n<i>...va yana ${count - 8} ta buyurtma mavjud.</i>` : "",
    "",
    "👇 <b>Batafsil boshqarish va mijozga qo'ng'iroq qilish uchun buyurtmani tanlang:</b>",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Yangi buyurtma haqida dorixona egasiga Telegram xabar yuboradi.
 * Bot sozlanmagan bo'lsa jim o'tadi (buyurtma baribir bazada saqlanadi).
 */
export async function notifyPharmacyNewOrder(
  telegramId: number,
  order: {
    id: number;
    customerName: string;
    customerPhone: string;
    note: string | null;
    deliveryType: string;
    customerAddress: string | null;
    total: number;
    items: { medicineId: number; name: string; price: number | null; qty: number }[];
  },
): Promise<void> {
  const asOrder: OrderWithItems = {
    id: order.id,
    status: "yangi",
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    note: order.note,
    deliveryType: order.deliveryType,
    customerAddress: order.customerAddress,
    totalSum: order.total,
    ratingStars: null,
    ratingNote: null,
    createdAt: new Date(),
    items: order.items.map((i) => ({
      id: i.medicineId,
      medicineId: i.medicineId,
      name: i.name,
      price: i.price,
      qty: i.qty,
    })),
  };

  const text = orderMessage(asOrder);
  const kb = orderActionsKeyboard(asOrder);

  let sent = false;
  if (await isAuthBotConfigured()) {
    try {
      sent = await sendAuthMessage(telegramId, text, { inline: kb });
      if (sent) {
        console.log(`[orders] Buyurtma #${order.id} dorixona egasiga (@agroz_auth_bot, TG: ${telegramId}) yuborildi`);
      }
    } catch (e) {
      console.error("[orders] Auth bot orqali xabar yuborishda xato:", e);
    }
  }

  // Fallback: Agar auth bot orqali bormasa, asosiy bot orqali faqat xabar beramiz.
  // Auth bot buyurtma boshqaruv callbacklarini qayta ishlaydi; asosiy botga shu
  // tugmalarni yuborish ishlamaydigan inline tugmalar paydo qiladi.
  if (!sent) {
    try {
      if (await isMainBotConfigured()) {
        sent = await sendMainBotMessage(
          telegramId,
          `${text}\n\n⚠️ Buyurtmani boshqarish tugmalari faqat @agroz_auth_bot orqali ishlaydi. Iltimos, auth bot webhook/token sozlamalarini tekshiring.`,
        );
        if (sent) {
          console.log(`[orders] Buyurtma #${order.id} dorixona egasiga asosiy bot orqali tugmasiz yuborildi (TG: ${telegramId})`);
        }
      }
    } catch (e) {
      console.error("[orders] Asosiy bot orqali xabar yuborishda xato:", e);
    }
  }
}

/**
 * Buyurtma yetkazilganda mijozga Telegram bot orqali xabar yuboradi:
 * - Yetkazilgan buyurtma va dorilar ro'yxati
 * - Xizmat va dorilarni baholash (1-5 yulduzli inline keyboard)
 * - Dori sahifasida fikr bildirish uchun havola
 */
export async function notifyCustomerOrderDelivered(orderId: number): Promise<void> {
  if (!(await isMainBotConfigured())) return;

  const { db } = await import("@/db");
  const { orders, orderItems, specialists, users } = await import("@/db/schema");
  const { eq, sql } = await import("drizzle-orm");

  const orderRows = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      deliveryType: orders.deliveryType,
      pharmacyName: specialists.organization,
      pharmacyContact: specialists.name,
      ratingStars: orders.ratingStars,
    })
    .from(orders)
    .leftJoin(specialists, eq(specialists.id, orders.pharmacySpecialistId))
    .where(eq(orders.id, orderId))
    .limit(1);

  const order = orderRows[0];
  if (!order) return;

  // Mijozning Telegram akkauntini users jadvalidan telefon raqami orqali topamiz
  const clean = order.customerPhone.replace(/\D/g, "");
  const suffix = clean.slice(-9);

  const userRows = await db
    .select({ telegramId: users.telegramId })
    .from(users)
    .where(sql`replace(replace(${users.phone}, '+', ''), ' ', '') like ${'%' + suffix}`)
    .limit(1);

  const customerTelegramId = userRows[0]?.telegramId;
  if (!customerTelegramId) {
    return; // Mijoz bot orqali ro'yxatdan o'tmagan yoki telegramId mavjud emas
  }

  const items = await db
    .select({
      id: orderItems.id,
      medicineId: orderItems.medicineId,
      name: orderItems.name,
      qty: orderItems.qty,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/+$/, "");
  const pharmacyName = order.pharmacyName || order.pharmacyContact || "Dorixona";

  const isPickup = order.deliveryType === "pickup";
  const msg = [
    isPickup ? "🏪 <b>Buyurtmangiz qabul qilindi / olib ketildi!</b>" : "📦 <b>Buyurtmangiz yetkazildi!</b>",
    "",
    isPickup
      ? `Hurmatli <b>${escapeHtml(order.customerName)}</b>, siz <b>${escapeHtml(pharmacyName)}</b> dan buyurtma qilgan dori vositalaringizni muvaffaqiyatli qabul qilib oldingiz!`
      : `Hurmatli <b>${escapeHtml(order.customerName)}</b>, siz <b>${escapeHtml(pharmacyName)}</b> dan buyurtma qilgan dori vositalaringiz muvaffaqiyatli yetkazildi!`,
    "",
    isPickup ? "<b>Qabul qilingan dorilar:</b>" : "<b>Yetkazilgan dorilar:</b>",
    items.map((i) => `• ${escapeHtml(i.name)} × ${i.qty}`).join("\n"),
    "",
    "⭐️ <b>Dorilar va xizmat sifatini baholang:</b>",
    isPickup
      ? "Dorixona xizmati va dorilar sifatiga qanday baho berasiz? O'z bahoyingizni belgilang va fikringizni qoldiring:"
      : "Yetkazib berish xizmati va dorilar sifatiga qanday baho berasiz? O'z bahoyingizni belgilang va fikringizni qoldiring:",
  ].join("\n");

  const firstItem = items[0];
  const medReviewUrl =
    firstItem && rawAppUrl
      ? `${rawAppUrl}/dori/${firstItem.medicineId}`
      : rawAppUrl
        ? `${rawAppUrl}/dorilar`
        : "";

  const keyboardRows: InlineKeyboard["inline_keyboard"] = [
    [
      { text: "⭐️ 5 - A'lo", callback_data: `cr:rate:${order.id}:5` },
      { text: "⭐️ 4", callback_data: `cr:rate:${order.id}:4` },
      { text: "⭐️ 3", callback_data: `cr:rate:${order.id}:3` },
    ],
    [
      { text: "⭐️ 2", callback_data: `cr:rate:${order.id}:2` },
      { text: "⭐️ 1", callback_data: `cr:rate:${order.id}:1` },
    ],
  ];

  if (medReviewUrl) {
    keyboardRows.push([
      {
        text: "💬 Fermerlar fikrlariga o'tish / Fikr qoldirish",
        url: medReviewUrl,
      },
    ]);
  }

  await sendMainBotMessage(customerTelegramId, msg, {
    keyboard: { inline_keyboard: keyboardRows },
  });
}

/**
 * Dorixona egasiga dori qoldig'i kam qolgani (<= 3) yoki tugagani (0) haqida
 * Telegram (@agroz_auth_bot) orqali darhol ogohlantirish yuboradi.
 */
export async function notifyPharmacyStockAlert(
  telegramId: number,
  medName: string,
  stock: number,
  unit?: string | null,
): Promise<void> {
  if (!(await isAuthBotConfigured())) return;

  const unitStr = unit?.trim() || "dona";
  let text = "";
  if (stock <= 0) {
    text = [
      "❌ <b>DIQQAT: DORI VOSITASI TUGADI!</b>",
      "",
      `💊 <b>${escapeHtml(medName)}</b> dori vositasi dorixonangizda butunlay tugadi!`,
      `Holat: <b>Mavjud emas (yo'q)</b> ga o'zgartirildi.`,
      "",
      "Mijozlarga sayt va ilovada <i>\"Kelganda xabar berish\"</i> tugmasi ko'rinadi.",
      "Dorixonangizga yangi partiya kelganda, botdagi <b>Dorilar</b> bo'limi orqali qoldiqni yangilang.",
    ].join("\n");
  } else {
    text = [
      "⚠️ <b>DIQQAT: DORI QOLDIG'I OZ QOLDI!</b>",
      "",
      `💊 <b>${escapeHtml(medName)}</b> dori vositasidan dorixonangizda atigi <b>${stock} ${escapeHtml(unitStr)}</b> qoldi!`,
      "",
      "Iltimos, zaxirangizni tekshirib, botdagi <b>Dorilar</b> menyusi orqali qoldiqni to'ldirib qo'yishingiz so'raladi.",
    ].join("\n");
  }

  try {
    await sendAuthMessage(telegramId, text);
    console.log(`[orders-bot] Dorixona (#${telegramId}) uchun qoldiq ogohlantirishi (${medName}: ${stock}) yuborildi`);
  } catch (err) {
    console.error("[orders-bot] Stock alert yuborishda xato:", err);
  }
}
