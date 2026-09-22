/**
 * Buyurtmalar bilan bog'liq bot xabarlari (`@agroz_auth_bot` orqali):
 * - yangi buyurtma xabari dorixona egasiga
 * - /buyurtmalar ro'yxati va holat o'zgartirish klaviaturalari
 */

import { escapeHtml } from "@/lib/tg-escape";
import { isAuthBotConfigured, sendAuthMessage, type InlineKeyboard } from "@/lib/auth-bot";
import type { OrderStatus, OrderWithItems } from "@/lib/orders";

/** Buyurtma holati uchun emoji va yorliq. */
export function orderStatusLabel(status: OrderStatus): { emoji: string; label: string } {
  switch (status) {
    case "yangi":
      return { emoji: "🆕", label: "Yangi" };
    case "tasdiqlandi":
      return { emoji: "✅", label: "Tasdiqlandi" };
    case "yetkazildi":
      return { emoji: "📦", label: "Yetkazildi" };
    case "bekor":
      return { emoji: "❌", label: "Bekor qilindi" };
  }
}

/** Summani qisqa ko'rinishda: 45000 → "45 000". */
export function shortSum(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value).replace(/\u00a0/g, " ");
}

/** Bitta buyurtma matni (dorixona egasi ko'radi). */
export function orderMessage(order: OrderWithItems): string {
  const st = orderStatusLabel(order.status);
  const delivery =
    order.deliveryType === "delivery"
      ? [
          "🛵 <b>Qabul qilish:</b> Yetkazib berish (kuryer orqali)",
          `📍 <b>Yetkazish manzili:</b> <code>${escapeHtml(order.customerAddress ?? "Ko'rsatilmadi")}</code>`,
          order.customerAddress
            ? `🗺 <a href="https://maps.google.com/?q=${encodeURIComponent(order.customerAddress)}">Xaritada manzilni ochish</a>`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "🏪 <b>Qabul qilish:</b> Mijoz dorixonaga borib O'ZI OLIB KETADI (bepul)";
  const items = order.items
    .map(
      (i) =>
        `• ${escapeHtml(i.name)} × ${i.qty}${i.price ? ` — ${shortSum(i.price * i.qty)} so'm` : ""}`,
    )
    .join("\n");
  // Mijoz bahosi: yulduzcha + izoh (yetkazilgan buyurtma baholangan bo'lsa).
  const rating = order.ratingStars
    ? [
        "",
        `⭐️ Mijoz bahosi: ${"★".repeat(order.ratingStars)}${"☆".repeat(5 - order.ratingStars)} (${order.ratingStars}/5)`,
        ...(order.ratingNote ? [`💬 "${escapeHtml(order.ratingNote)}"`] : []),
      ]
    : [];
  return [
    `${st.emoji} <b>Buyurtma #${order.id}</b> — ${st.label}`,
    "",
    `👤 <b>Mijoz:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Telefon:</b> <code>${escapeHtml(order.customerPhone)}</code>`,
    delivery,
    "",
    "<b>Buyurtma qilingan dorilar:</b>",
    items,
    "",
    `💰 Jami summa: <b>${order.totalSum !== null ? `${shortSum(order.totalSum)} so'm` : "narx yo'q"}</b>`,
    order.note ? `📝 <b>Mijoz izohi:</b> <i>${escapeHtml(order.note)}</i>` : "",
    ...rating,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Holat o'zgartirish klaviaturasi (faqat yangi/tasdiqlandi uchun). */
export function orderActionsKeyboard(order: OrderWithItems): InlineKeyboard {
  const rows: InlineKeyboard["inline_keyboard"] = [];
  if (order.status === "yangi") {
    rows.push([
      { text: "✅ Qabul qilish", callback_data: `o:confirm:${order.id}` },
      { text: "❌ Bekor qilish", callback_data: `o:cancel:${order.id}` },
    ]);
  }
  if (order.status === "tasdiqlandi") {
    rows.push([
      {
        text: order.deliveryType === "delivery" ? "🛵 Yetkazildi" : "✅ Mijoz olib ketdi",
        callback_data: `o:done:${order.id}`,
      },
    ]);
  }
  return { inline_keyboard: rows };
}

/** /buyurtmalar ro'yxati klaviaturasi — har bir buyurtma alohida tugma (bahosi bilan). */
export function ordersListKeyboard(orders: OrderWithItems[]): InlineKeyboard {
  const rows = orders.slice(0, 20).map((o) => {
    const st = orderStatusLabel(o.status);
    // Baholangan buyurtmada yulduzcha ko'rinadi — qancha yaxshi bo'lsa shuncha ★.
    const stars = o.ratingStars ? ` · ${"★".repeat(o.ratingStars)}` : "";
    return [
      {
        text: `${st.emoji} #${o.id} · ${o.customerName} · ${o.totalSum !== null ? shortSum(o.totalSum) + " so'm" : "narxsiz"}${stars}`,
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

/** /buyurtmalar ro'yxati sarlavhasi. */
export function ordersHintMessage(count: number): string {
  return [
    `📋 <b>Buyurtmalar</b> (${count} ta)`,
    "",
    "Batafsil ko'rish va holatini o'zgartirish uchun buyurtmani bosing:",
  ].join("\n");
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
  if (!(await isAuthBotConfigured())) return;
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
    items: order.items.map((i) => ({ id: i.medicineId, name: i.name, price: i.price, qty: i.qty })),
  };
  await sendAuthMessage(telegramId, orderMessage(asOrder), {
    inline: orderActionsKeyboard(asOrder),
  });
}
