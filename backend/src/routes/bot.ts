import { Router } from "express";
import { db } from "../db/index.js";
import { users, specialists, orders, orderItems, specialistCalls, otpCodes, sessions } from "../db/schema.js";
import { eq, and, desc, isNotNull, or } from "drizzle-orm";
import {
  farmerBotToken,
  farmerBotUsername,
  farmerWebhookSecret,
  partnerBotToken,
  partnerBotUsername,
  partnerWebhookSecret,
  webAppUrl,
  partnerMiniappUrl,
  appStoreUrl,
  googlePlayUrl,
} from "../lib/settings.js";
import { sendToSpecialist, sendToUser } from "../lib/bot-sender.js";
import { verifyInitData } from "../lib/tg-auth.js";
import { cleanText, normalizePhone } from "../lib/validate.js";
import { escapeHtml } from "../lib/tg-escape.js";
import { randomBytes } from "node:crypto";

const router = Router();
const API_BASE = "https://api.telegram.org";

async function callTelegram(token: string, method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json().catch(() => ({ ok: false }));
  } catch (err: any) {
    return { ok: false, description: err?.message };
  }
}

// ---------------------------------------------------------------------------
// 1. FERMERLAR BOTI (@agrozai_bot)
// ---------------------------------------------------------------------------

export async function handleFarmerUpdate(update: any) {
  const token = await farmerBotToken();
  if (!token) return;

  const message = update?.message;
  const callbackQuery = update?.callback_query;

  // Callback query handling
  if (callbackQuery) {
    const fromId = callbackQuery.from?.id;
    const data = callbackQuery.data;
    const cqId = callbackQuery.id;

    if (cqId) {
      await callTelegram(token, "answerCallbackQuery", { callback_query_id: cqId });
    }

    if (data === "support:open") {
      const partnerUser = await partnerBotUsername();
      await callTelegram(token, "sendMessage", {
        chat_id: fromId,
        text: `💬 <b>Qo'llab-quvvatlash xizmati</b>\n\nSavol yoki takliflaringiz bo'lsa, administrator bilan bog'laning:\n👉 @agroz_support\n\nAgro-do'kon va mutaxassislar uchun botimiz: @${partnerUser}`,
        parse_mode: "HTML",
      });
      return;
    }

    if (data === "farmer:orders") {
      await sendFarmerOrders(token, fromId, fromId);
      return;
    }
    return;
  }

  if (!message || !message.chat) return;
  const chatId = message.chat.id;
  const fromId = message.from?.id ?? chatId;
  const firstName = message.from?.first_name || "Foydalanuvchi";

  // Faqat shaxsiy (private) chatlar
  if (message.chat.type !== "private") return;

  // Kontakt kelganda
  if (message.contact) {
    const contact = message.contact;
    if (contact.user_id && contact.user_id !== fromId) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Iltimos, faqat o'zingizning telefon raqamingizni pastdagi tugma orqali yuboring.",
      });
      return;
    }

    const rawPhone = contact.phone_number || "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Telefon raqam formati noto'g'ri. Iltimos, qayta urinib ko'ring.",
      });
      return;
    }

    // users jadvalidan qidiramiz
    let user = (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
    if (user) {
      await db.update(users).set({
        telegramId: fromId,
        botStartedAt: new Date(),
        botBlocked: false,
      }).where(eq(users.id, user.id));

      await sendFarmerGreeting(token, chatId, fromId, user.name || firstName);
      return;
    }

    // Yangi foydalanuvchi bo'lsa — darhol ro'yxatdan o'tkazib ulaymiz
    const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || firstName || "Foydalanuvchi";
    const [created] = await db.insert(users).values({
      phone,
      name: fullName,
      telegramId: fromId,
      botStartedAt: new Date(),
      botBlocked: false,
    }).returning();

    await sendFarmerGreeting(token, chatId, fromId, created.name || firstName);
    return;
  }

  const text = (message.text || "").trim();
  const [command, ...rest] = text.split(/\s+/);
  const payload = rest.join(" ").trim();

  // /start buyrug'i
  if (command === "/start" || command.startsWith("/start@")) {
    // 1) Saytdan avtorizatsiya orqali kelgan bo'lsa (start auth_<token>)
    if (payload && payload.startsWith("auth_")) {
      const row = (await db.select().from(otpCodes).where(eq(otpCodes.token, payload)).limit(1))[0];
      if (row && !row.used && row.expiresAt.getTime() > Date.now()) {
        const cleanPhone = row.phone && row.phone !== "tg_auth" ? row.phone : null;
        let user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];

        if (!user && cleanPhone) {
          user = (await db.select().from(users).where(eq(users.phone, cleanPhone)).limit(1))[0];
        }

        if (!user && cleanPhone) {
          // Saytdan kiritilgan ism bo'lsa o'qiymiz
          let prefillName: string | null = null;
          try {
            if (row.code && row.code.startsWith("{")) {
              prefillName = JSON.parse(row.code).name || null;
            }
          } catch {}
          const [created] = await db.insert(users).values({
            phone: cleanPhone,
            name: prefillName || firstName || "Foydalanuvchi",
            telegramId: fromId,
            botStartedAt: new Date(),
            botBlocked: false,
          }).returning();
          user = created;
        } else if (user) {
          await db.update(users).set({
            telegramId: fromId,
            botStartedAt: new Date(),
            botBlocked: false,
          }).where(eq(users.id, user.id));
        }

        const sessionId = randomBytes(32).toString("hex");
        if (user) {
          await db.insert(sessions).values({ id: sessionId, userId: user.id });
        }
        await db.update(otpCodes).set({
          used: true,
          code: sessionId,
          telegramId: fromId,
          deliveredAt: new Date(),
        }).where(eq(otpCodes.id, row.id));

        await sendFarmerGreeting(token, chatId, fromId, user?.name || firstName);
        return;
      }
    }

    // 2) from.id bo'yicha users.telegram_id qidiramiz
    const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
    if (user) {
      await db.update(users).set({ botStartedAt: new Date(), botBlocked: false }).where(eq(users.id, user.id));
      await sendFarmerGreeting(token, chatId, fromId, user.name || firstName);
      return;
    }

    // 3) Foydalanuvchi topilmadi -> Chat menu tugmasini sozlaymiz va raqam so'raymiz
    const url = webAppUrl();
    await callTelegram(token, "setChatMenuButton", {
      chat_id: chatId,
      menu_button: {
        type: "web_app",
        text: "AgrozGO",
        web_app: { url },
      },
    }).catch(() => {});

    const askContactText = `Assalomu alaykum, <b>${escapeHtml(firstName)}</b>! AgrozGO ga xush kelibsiz 🌱\n\nIlovadan to'liq foydalanish va buyurtmalaringizni boshqarish uchun pastdagi <b>«📞 Raqamni yuborish»</b> tugmasini bosing:`;
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: askContactText,
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });

    // Qo'shimcha ravishda to'g'ridan-to'g'ri ochish tugmasini ham yuboramiz
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Yoki AgrozGO ilovasini to'g'ridan-to'g'ri oching 👇",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 AgrozGO ilovasini ochish", web_app: { url } }],
        ],
      },
    });
    return;
  }

  // /buyurtmalar buyrug'i
  if (command === "/buyurtmalar" || text === "📦 Mening buyurtmalarim" || text === "📦 Buyurtmalarim") {
    await sendFarmerOrders(token, chatId, fromId);
    return;
  }

  // /yordam buyrug'i
  if (command === "/yordam" || text === "💬 Qo'llab-quvvatlash" || text === "💬 Yordam" || text === "/help") {
    const url = webAppUrl();
    const partnerUser = await partnerBotUsername();
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: `🌱 <b>AgrozGO — Fermer va dehqonlar uchun qulay raqamli platforma.</b>\n\n• Ilovani ochish uchun quyidagi tugmani yoki pastki chap burchakdagi <b>«AgrozGO»</b> menyu tugmasini bosing.\n• Mahsulotlarni buyurtma qilish va mutaxassis ko'rigiga yozilish uchun ilovadan foydalaning.\n• Savollaringiz bo'lsa, @agroz_support ga yozing.\n• Agro-do'kon va mutaxassislar boti: @${partnerUser}`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 AgrozGO ilovasini ochish", web_app: { url } }],
          [{ text: "💬 Qo'llab-quvvatlash", callback_data: "support:open" }],
        ],
      },
    });
    return;
  }
}

async function sendFarmerOrders(token: string, chatId: number, fromId: number) {
  const url = webAppUrl();
  const user = (await db.select().from(users).where(eq(users.telegramId, fromId)).limit(1))[0];
  if (!user) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Buyurtmalaringizni ko'rish uchun avval hisobingizni ulang yoki telefon raqamingizni yuboring:",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.id))
    .limit(5);

  if (userOrders.length === 0) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "📭 <b>Sizda hozircha faol buyurtmalar mavjud emas.</b>\n\nAgrozGO ilovasi orqali yaqin agro-do'konlardan dori va vositalarni buyurtma qilishingiz mumkin 👇",
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 AgrozGO ilovasiga o'tish", web_app: { url } }],
        ],
      },
    });
    return;
  }

  const items = await db.select().from(orderItems);
  const itemsMap = new Map<number, any[]>();
  for (const it of items) {
    const arr = itemsMap.get(it.orderId) || [];
    arr.push(it);
    itemsMap.set(it.orderId, arr);
  }

  for (const ord of userOrders) {
    const ordItems = itemsMap.get(ord.id) || [];
    const itemsText = ordItems.map((it) => `• <b>${escapeHtml(it.name)}</b> × ${it.qty} ta`).join("\n") || "Mahsulot ko'rsatilmagan";

    const statusLabel =
      ord.status === "yangi"
        ? "🟡 Yangi (ko'rib chiqilmoqda)"
        : ord.status === "tasdiqlandi"
        ? "🔵 Do'kon tomonidan tasdiqlandi"
        : ord.status === "tayyor"
        ? "📦 Do'konda tayyor, olib ketishingiz mumkin"
        : ord.status === "yetkazildi"
        ? "✅ Qabul qilindi"
        : "❌ Bekor qilingan";

    const text = [
      `📦 <b>Buyurtma #${ord.id}</b>`,
      `Holati: <b>${statusLabel}</b>`,
      `Summa: <b>${ord.totalSum ? ord.totalSum.toLocaleString("uz-UZ") + " so'm" : "kelishiladi"}</b>`,
      "",
      "<b>Mahsulotlar:</b>",
      itemsText,
    ].join("\n");

    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📱 Ilovada ko'rish", web_app: { url } }],
        ],
      },
    });
  }
}

async function sendFarmerGreeting(token: string, chatId: number, fromId: number, name: string) {
  const url = webAppUrl();
  const partnerUser = await partnerBotUsername();

  // Telegram Menu tugmasini "AgrozGO" deb sozlaymiz (foydalanuvchi so'raganidek bitta toza launch menu)
  await callTelegram(token, "setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "AgrozGO",
      web_app: { url },
    },
  }).catch(() => {});

  const inlineRows: any[] = [
    [{ text: "🚀 AgrozGO ilovasini ochish", web_app: { url } }],
    [
      { text: "📦 Buyurtmalarim", callback_data: "farmer:orders" },
      { text: "💬 Qo'llab-quvvatlash", callback_data: "support:open" },
    ],
  ];

  const appStore = appStoreUrl();
  const googlePlay = googlePlayUrl();
  const storeBtns: any[] = [];
  if (appStore) storeBtns.push({ text: "🍏 App Store", url: appStore });
  if (googlePlay) storeBtns.push({ text: "🤖 Google Play", url: googlePlay });
  if (storeBtns.length > 0) {
    inlineRows.push(storeBtns);
  }

  // Hamkor sifatida ham bormi tekshiramiz
  const spec = (await db.select().from(specialists).where(and(or(eq(specialists.telegramId, fromId)), eq(specialists.isActive, true), eq(specialists.isApproved, true))).limit(1))[0];
  let extraText = "";
  if (spec) {
    extraText = `\n\n💼 <i>Siz hamkor (${escapeHtml(spec.organization || spec.name)}) sifatida ham ro'yxatdan o'tgansiz. Hamkorlar boti: @${partnerUser}</i>`;
    inlineRows.push([{ text: `🤝 Hamkorlar boti (@${partnerUser})`, url: `https://t.me/${partnerUser}` }]);
  }

  const text = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! AgrozGO ga xush kelibsiz 🌱\n\nIlovani ochish uchun pastdagi tugmani bosing:${extraText}`;

  // Reply keyboard: Doimiy qulay pastki menyu
  const replyKeyboard = {
    keyboard: [
      [{ text: "🚀 AgrozGO", web_app: { url } }],
      [{ text: "📦 Mening buyurtmalarim" }, { text: "💬 Qo'llab-quvvatlash" }],
    ],
    resize_keyboard: true,
  };

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: inlineRows,
    },
  });

  // Reply menyuni ham faollashtirib qo'yamiz
  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: "Quyidagi tugmalar orqali xizmatlardan foydalanishingiz mumkin 👇",
    reply_markup: replyKeyboard,
  });
}

// ---------------------------------------------------------------------------
// 2. HAMKORLAR BOTI (@agroz_auth_bot)
// ---------------------------------------------------------------------------

export async function handlePartnerUpdate(update: any) {
  const token = await partnerBotToken();
  if (!token) return;

  const message = update?.message;
  const callbackQuery = update?.callback_query;

  // Callback query handling (Bronlar va Chaqiruvlar harakatlari)
  if (callbackQuery) {
    const cqId = callbackQuery.id;
    const fromId = callbackQuery.from?.id;
    const data = String(callbackQuery.data || "");
    const msg = callbackQuery.message;

    if (cqId) {
      await callTelegram(token, "answerCallbackQuery", { callback_query_id: cqId });
    }

    // 0) Tezkor ko'rish callbacklari
    if (data === "o:view:recent") {
      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (spec && spec.role === "pharmacy") {
        const recentOrders = await db.select().from(orders).where(eq(orders.pharmacySpecialistId, spec.id)).orderBy(desc(orders.id)).limit(5);
        if (recentOrders.length === 0) {
          await callTelegram(token, "sendMessage", { chat_id: fromId, text: "📭 Hozircha do'koningizga yangi bronlar tushmagan." });
        } else {
          for (const ord of recentOrders) {
            await sendPartnerOrderCard(token, fromId, ord);
          }
        }
      }
      return;
    }

    if (data === "c:view:recent") {
      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (spec) {
        const recentCalls = await db.select().from(specialistCalls).where(eq(specialistCalls.specialistId, spec.id)).orderBy(desc(specialistCalls.id)).limit(5);
        if (recentCalls.length === 0) {
          await callTelegram(token, "sendMessage", { chat_id: fromId, text: "📭 Hozircha chaqiruvlar mavjud emas." });
        } else {
          for (const c of recentCalls) {
            await sendPartnerCallCard(token, fromId, c);
          }
        }
      }
      return;
    }

    // 1) Buyurtma / Bron amallari (o:confirm, o:cancel, o:ready, o:done)
    if (data.startsWith("o:")) {
      const parts = data.split(":");
      const action = parts[1]; // confirm | cancel | ready | done | view
      const orderId = Number(parts[2]);

      if (!orderId) return;

      const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
      if (!order) return;

      // XAVFSIZLIK: bosgan odam shu dorixona/buyurtma egasimi?
      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (!spec || spec.id !== order.pharmacySpecialistId) {
        if (cqId) {
          await callTelegram(token, "answerCallbackQuery", {
            callback_query_id: cqId,
            text: "⛔️ Siz faqat o'zingizning agro-do'koningiz bronlarini boshqara olasiz!",
            show_alert: true,
          });
        }
        return;
      }

      let newStatus: string | null = null;
      if (action === "confirm") {
        if (order.status === "yangi") newStatus = "tasdiqlandi";
      } else if (action === "cancel") {
        if (order.status === "yangi" || order.status === "tasdiqlandi") newStatus = "bekor";
      } else if (action === "ready") {
        if (order.status === "tasdiqlandi") newStatus = "tayyor";
      } else if (action === "done") {
        if (order.status === "tayyor" || order.status === "tasdiqlandi") newStatus = "yetkazildi"; // yoki olib ketildi
      }

      if (newStatus && newStatus !== order.status) {
        await db.update(orders).set({ status: newStatus }).where(eq(orders.id, orderId));

        // Mijozga xabar yuborish
        if (order.userId) {
          let notifyText = "";
          if (newStatus === "tasdiqlandi") {
            notifyText = `✅ Sizning #${order.id} raqamli broningiz agro-do'kon tomonidan tasdiqlandi!`;
          } else if (newStatus === "tayyor") {
            notifyText = `📦 Sizning #${order.id} raqamli buyurtmangiz do'konda tayyorlandi, olib ketishingiz mumkin!`;
          } else if (newStatus === "yetkazildi") {
            notifyText = `🏪 #${order.id} raqamli buyurtma muvaffaqiyatli topshirildi / olib ketildi!`;
          } else if (newStatus === "bekor") {
            notifyText = `❌ Kechirasiz, #${order.id} raqamli buyurtma agro-do'konda mahsulot yo'qligi sababli bekor qilindi.`;
          }
          if (notifyText) {
            await sendToUser(order.userId, notifyText);
          }
        }

        // Xabarni yangilab qo'yamiz
        if (msg && msg.message_id && msg.chat) {
          const updatedOrder = { ...order, status: newStatus };
          await sendPartnerOrderCard(token, msg.chat.id, updatedOrder, msg.message_id);
        }
      }
      return;
    }

    // 2) Chaqiruv amallari (c:accept, c:reject, c:done)
    if (data.startsWith("c:")) {
      const parts = data.split(":");
      const action = parts[1];
      const callId = Number(parts[2]);
      if (!callId) return;

      const call = (await db.select().from(specialistCalls).where(eq(specialistCalls.id, callId)).limit(1))[0];
      if (!call) return;

      const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
      if (!spec || spec.id !== call.specialistId) {
        if (cqId) {
          await callTelegram(token, "answerCallbackQuery", {
            callback_query_id: cqId,
            text: "⛔️ Siz faqat o'z chaqiruvlaringizni boshqara olasiz!",
            show_alert: true,
          });
        }
        return;
      }

      let newStatus: string | null = null;
      if (action === "accept" && call.status === "yangi") newStatus = "qabul_qilindi";
      if (action === "reject" && call.status === "yangi") newStatus = "bekor";
      if (action === "done" && call.status === "qabul_qilindi") newStatus = "bajarildi";

      if (newStatus && newStatus !== call.status) {
        await db.update(specialistCalls).set({ status: newStatus, updatedAt: new Date() }).where(eq(specialistCalls.id, callId));

        if (msg && msg.message_id && msg.chat) {
          const updatedCall = { ...call, status: newStatus };
          await sendPartnerCallCard(token, msg.chat.id, updatedCall, msg.message_id);
        }
      }
      return;
    }

    return;
  }

  if (!message || !message.chat) return;
  const chatId = message.chat.id;
  const fromId = message.from?.id ?? chatId;
  const firstName = message.from?.first_name || "Hamkor";

  if (message.chat.type !== "private") return;

  // Kontakt kelganda
  if (message.contact) {
    const contact = message.contact;
    if (contact.user_id && contact.user_id !== fromId) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Iltimos, faqat o'zingizning telefon raqamingizni pastdagi tugma orqali yuboring.",
      });
      return;
    }

    const rawPhone = contact.phone_number || "";
    const phone = normalizePhone(rawPhone);
    if (!phone) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "⚠️ Telefon raqam formati noto'g'ri.",
      });
      return;
    }

    // specialists jadvalidan qidiramiz
    const spec = (await db.select().from(specialists).where(eq(specialists.phone, phone)).limit(1))[0];
    if (spec) {
      if (!spec.isActive || !spec.isApproved) {
        await callTelegram(token, "sendMessage", {
          chat_id: chatId,
          text: "⏳ Sizning arizangiz ko'rib chiqilmoqda. Admin tasdiqlagach, botdan to'liq foydalanishingiz mumkin.",
        });
        return;
      }

      await db.update(specialists).set({
        telegramId: fromId,
        botStartedAt: new Date(),
        botBlocked: false,
      }).where(eq(specialists.id, spec.id));

      await sendPartnerGreeting(token, chatId, spec);
      return;
    }

    // Agar specialists'da yo'q, lekin users'da bo'lsa:
    const user = (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
    const farmerUser = await farmerBotUsername();

    if (user) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: `Bu bot agro-do'konlar va mutaxassislar uchun. Fermer sifatida @${farmerUser} dan foydalaning.`,
        reply_markup: {
          inline_keyboard: [
            [{ text: `🌱 Fermerlar boti (@${farmerUser})`, url: `https://t.me/${farmerUser}` }],
          ],
        },
      });
      return;
    }

    // Hech qaysi jadvalda yo'q bo'lsa: hech narsa yaratilmaydi!
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "Siz hali ro'yxatdan o'tmagansiz, qo'llab-quvvatlashga murojaat qiling.",
      reply_markup: {
        inline_keyboard: [
          [{ text: "💬 Qo'llab-quvvatlash", url: "https://t.me/agroz_support" }],
        ],
      },
    });
    return;
  }

  const text = (message.text || "").trim();
  const [command] = text.split(/\s+/);

  // /start buyrug'i
  if (command === "/start" || command.startsWith("/start@")) {
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
    if (spec) {
      if (!spec.isActive || !spec.isApproved) {
        await callTelegram(token, "sendMessage", {
          chat_id: chatId,
          text: "⏳ Sizning arizangiz ko'rib chiqilmoqda. Admin tasdiqlagach, botdan to'liq foydalanishingiz mumkin.",
        });
        return;
      }

      await db.update(specialists).set({ botStartedAt: new Date(), botBlocked: false }).where(eq(specialists.id, spec.id));
      await sendPartnerGreeting(token, chatId, spec);
      return;
    }

    // Topilmasa: Raqam so'raymiz
    const askContactText = `Assalomu alaykum, <b>${escapeHtml(firstName)}</b>!\n\nUshbu bot agro-do'konlar va mutaxassislar (agronom, veterinar) uchun mo'ljallangan.\n\nProfilingizni aniqlash uchun telefon raqamingizni yuboring:`;
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: askContactText,
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [[{ text: "📞 Raqamni yuborish", request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return;
  }

  // Hamkor komandalari (faqat ro'yxatdan o'tganlar uchun)
  const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, fromId)).limit(1))[0];
  if (!spec || !spec.isActive || !spec.isApproved) {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "⚠️ Ushbu buyruqlardan foydalanish uchun avval telefon raqamingiz orqali tizimga ulaning.",
    });
    return;
  }

  // /bronlar (faqat agro-do'konlar uchun)
  if (command === "/bronlar" || text === "📦 Bronlar" || text === "/orders") {
    if (spec.role !== "pharmacy") {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "ℹ️ Bronlar boshqaruvi faqat agro-do'kon egalari uchun mo'ljallangan.",
      });
      return;
    }

    const recentOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.pharmacySpecialistId, spec.id))
      .orderBy(desc(orders.id))
      .limit(5);

    if (recentOrders.length === 0) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "📭 Hozircha do'koningizga yangi bronlar tushmagan.",
      });
      return;
    }

    for (const ord of recentOrders) {
      await sendPartnerOrderCard(token, chatId, ord);
    }
    return;
  }

  // /chaqiruvlar (mutaxassislar uchun)
  if (command === "/chaqiruvlar" || text === "👨‍⚕️ Chaqiruvlar" || text === "/calls") {
    const recentCalls = await db
      .select()
      .from(specialistCalls)
      .where(eq(specialistCalls.specialistId, spec.id))
      .orderBy(desc(specialistCalls.id))
      .limit(5);

    if (recentCalls.length === 0) {
      await callTelegram(token, "sendMessage", {
        chat_id: chatId,
        text: "📭 Hozircha chaqiruvlar mavjud emas.",
      });
      return;
    }

    for (const c of recentCalls) {
      await sendPartnerCallCard(token, chatId, c);
    }
    return;
  }

  // /band va /bosh
  if (command === "/band" || text === "🔴 Bandman") {
    await db.update(specialists).set({ isBusy: true }).where(eq(specialists.id, spec.id));
    const kabinetUrl = partnerMiniappUrl();
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "🔴 <b>Holatingiz: Band</b> deb belgilandi. Yangi chaqiruvlar qabul qilinmaydi.",
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          [{ text: "📋 Mutaxassis kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "👨‍⚕️ Chaqiruvlar" }, { text: "🟢 Bo'shman" }],
          [{ text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      },
    });
    return;
  }

  if (command === "/bosh" || text === "🟢 Bo'shman") {
    await db.update(specialists).set({ isBusy: false }).where(eq(specialists.id, spec.id));
    const kabinetUrl = partnerMiniappUrl();
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: "🟢 <b>Holatingiz: Bo'sh</b> deb belgilandi. Yangi chaqiruvlarni qabul qilishingiz mumkin.",
      parse_mode: "HTML",
      reply_markup: {
        keyboard: [
          [{ text: "📋 Mutaxassis kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "👨‍⚕️ Chaqiruvlar" }, { text: "🔴 Bandman" }],
          [{ text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      },
    });
    return;
  }

  // /yordam
  if (command === "/yordam" || text === "💬 Yordam") {
    await callTelegram(token, "sendMessage", {
      chat_id: chatId,
      text: `🤝 <b>AgrozGO Hamkorlar xizmati</b>\n\nSavollaringiz bo'lsa, administrator bilan bog'laning: @agroz_support\n\nBuyruqlar:\n/bronlar — bron qilingan mahsulotlar\n/chaqiruvlar — chaqiruvlar ro'yxati\n/band yoki /bosh — ish holatini o'zgartirish`,
      parse_mode: "HTML",
    });
    return;
  }
}

async function sendPartnerGreeting(token: string, chatId: number, spec: typeof specialists.$inferSelect) {
  let greeting = "";
  const name = spec.name;
  const org = spec.organization || "Agro-do'kon";
  const kabinetUrl = partnerMiniappUrl();

  const isPharmacy = spec.role === "pharmacy";

  if (isPharmacy) {
    greeting = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! Siz <b>${escapeHtml(org)}</b> agro-do'koni egasi sifatida ulandingiz ✅ Bronlarni shu yerda va kabinetda boshqarasiz.`;
  } else if (spec.specialty?.toLowerCase().includes("veterinar") || spec.role === "veterinarian") {
    greeting = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! Siz veterinar sifatida ulandingiz ✅ Chaqiruvlarni shu yerda va kabinetda qabul qilasiz.`;
  } else {
    greeting = `Assalomu alaykum, <b>${escapeHtml(name)}</b>! Siz agronom sifatida ulandingiz ✅ Chaqiruvlarni shu yerda va kabinetda qabul qilasiz.`;
  }

  const inlineRows = [
    [{ text: isPharmacy ? "📋 Do'kon kabinetini ochish" : "📋 Mutaxassis kabinetini ochish", web_app: { url: kabinetUrl } }],
    [{ text: isPharmacy ? "📦 Yangi bronlar" : "👨‍⚕️ Chaqiruvlar", callback_data: isPharmacy ? "o:view:recent" : "c:view:recent" }],
  ];

  const replyMenu = isPharmacy
    ? {
        keyboard: [
          [{ text: "📋 Do'kon kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "📦 Bronlar" }, { text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      }
    : {
        keyboard: [
          [{ text: "📋 Mutaxassis kabineti", web_app: { url: kabinetUrl } }],
          [{ text: "👨‍⚕️ Chaqiruvlar" }, { text: spec.isBusy ? "🟢 Bo'shman" : "🔴 Bandman" }],
          [{ text: "💬 Yordam" }],
        ],
        resize_keyboard: true,
      };

  await callTelegram(token, "setChatMenuButton", {
    chat_id: chatId,
    menu_button: {
      type: "web_app",
      text: "Kabinet",
      web_app: { url: kabinetUrl },
    },
  }).catch(() => {});

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: greeting,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: inlineRows,
    },
  });

  // Reply menyuni o'rnatamiz
  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: "Menyudan kerakli bo'limni tanlang 👇",
    reply_markup: replyMenu,
  });
}

async function sendPartnerOrderCard(token: string, chatId: number, order: typeof orders.$inferSelect, editMessageId?: number) {
  const isConfirmed = order.status !== "yangi";
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const itemsList = items.map((it) => `• <b>${escapeHtml(it.name)}</b> × ${it.qty} ta`).join("\n") || "Mahsulot ko'rsatilmagan";

  const phoneText = isConfirmed
    ? `<code>${escapeHtml(order.customerPhone)}</code>`
    : `<i>(Tasdiqlangandan so'ng ko'rinadi)</i>`;

  const statusLabel =
    order.status === "yangi"
      ? "🆕 Yangi bron"
      : order.status === "tasdiqlandi"
      ? "🔵 Tasdiqlangan"
      : order.status === "tayyor"
      ? "📦 Olib ketishga tayyor"
      : order.status === "yetkazildi"
      ? "✅ Olib ketildi"
      : "❌ Bekor qilingan";

  const text = [
    `🔔 <b>Bron #${order.id}</b> [${statusLabel}]`,
    `👤 <b>Mijoz:</b> ${escapeHtml(order.customerName)}`,
    `📞 <b>Telefon:</b> ${phoneText}`,
    `💰 <b>Summa:</b> ${order.totalSum ? order.totalSum.toLocaleString("uz-UZ") + " so'm" : "kelishiladi"}`,
    "",
    "📦 <b>Mahsulotlar:</b>",
    itemsList,
  ].join("\n");

  const rows: any[] = [];
  if (order.status === "yangi") {
    rows.push([
      { text: "✅ Tasdiqlash", callback_data: `o:confirm:${order.id}` },
      { text: "❌ Mahsulot yo'q", callback_data: `o:cancel:${order.id}` },
    ]);
  } else if (order.status === "tasdiqlandi") {
    rows.push([
      { text: "📦 Tayyor", callback_data: `o:ready:${order.id}` },
      { text: "❌ Bekor qilish", callback_data: `o:cancel:${order.id}` },
    ]);
  } else if (order.status === "tayyor") {
    rows.push([
      { text: "🏪 Olib ketildi", callback_data: `o:done:${order.id}` },
    ]);
  }

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length > 0 ? { inline_keyboard: rows } : undefined,
  };

  if (editMessageId) {
    payload.message_id = editMessageId;
    await callTelegram(token, "editMessageText", payload);
  } else {
    await callTelegram(token, "sendMessage", payload);
  }
}

async function sendPartnerCallCard(token: string, chatId: number, call: typeof specialistCalls.$inferSelect, editMessageId?: number) {
  const isAccepted = call.status !== "yangi";
  const phoneText = isAccepted
    ? `<code>${escapeHtml(call.customerPhone)}</code>`
    : `<i>(Qabul qilingandan so'ng ko'rinadi)</i>`;

  const statusLabel =
    call.status === "yangi"
      ? "🆕 Yangi chaqiruv"
      : call.status === "qabul_qilindi"
      ? "🔵 Qabul qilingan"
      : call.status === "bajarildi"
      ? "✅ Yakunlangan"
      : "❌ Rad etilgan";

  const text = [
    `👨‍⚕️ <b>Chaqiruv #${call.id}</b> [${statusLabel}]`,
    `👤 <b>Mijoz:</b> ${escapeHtml(call.customerName)}`,
    `📞 <b>Telefon:</b> ${phoneText}`,
    call.address ? `📍 <b>Manzil:</b> ${escapeHtml(call.address)}` : "",
    `📝 <b>Muammo:</b> ${escapeHtml(call.problem)}`,
  ].filter(Boolean).join("\n");

  const rows: any[] = [];
  if (call.status === "yangi") {
    rows.push([
      { text: "✅ Qabul qilish", callback_data: `c:accept:${call.id}` },
      { text: "❌ Rad etish", callback_data: `c:reject:${call.id}` },
    ]);
  } else if (call.status === "qabul_qilindi") {
    rows.push([
      { text: "✅ Yakunlandi", callback_data: `c:done:${call.id}` },
    ]);
  }

  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: rows.length > 0 ? { inline_keyboard: rows } : undefined,
  };

  if (editMessageId) {
    payload.message_id = editMessageId;
    await callTelegram(token, "editMessageText", payload);
  } else {
    await callTelegram(token, "sendMessage", payload);
  }
}

// ---------------------------------------------------------------------------
// 3. WEBHOOK ROUTELARI
// ---------------------------------------------------------------------------

// POST /api/bot/farmer (Fermerlar boti webhooki)
router.post("/farmer", async (req, res) => {
  const secret = await farmerWebhookSecret();
  if (secret) {
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const update = req.body;
  if (update) {
    await handleFarmerUpdate(update).catch((err) => console.error("[bot:farmer error]:", err));
  }
  res.json({ ok: true });
});

// POST /api/bot/partner (Hamkorlar boti webhooki)
router.post("/partner", async (req, res) => {
  const secret = await partnerWebhookSecret();
  if (secret) {
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const update = req.body;
  if (update) {
    await handlePartnerUpdate(update).catch((err) => console.error("[bot:partner error]:", err));
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// 4. MINI APP (HAMKOR KABINETI) BACKEND API
// ---------------------------------------------------------------------------

// POST /api/bot/partner/init
router.post("/partner/init", async (req, res) => {
  try {
    const { initData } = req.body || {};
    const token = await partnerBotToken();
    if (!token || !initData) {
      return res.status(401).json({ ok: false, error: "Token yoki initData mavjud emas" });
    }

    // HMAC verification (24 soatlik limit bilan)
    const valid = verifyInitData(initData, token, 24 * 60 * 60);
    if (!valid) {
      return res.status(401).json({ ok: false, error: "Telegram ma'lumotlari haqiqiy emas yoki muddati o'tgan" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const telegramId = Number(tgUser.id);
    if (!telegramId) {
      return res.status(401).json({ ok: false, error: "Telegram foydalanuvchi aniqlanmadi" });
    }

    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, telegramId)).limit(1))[0];
    if (!spec || !spec.isActive || !spec.isApproved) {
      return res.status(403).json({ ok: false, error: "Hamkor profili topilmadi yoki faol emas" });
    }

    return res.json({
      ok: true,
      partner: {
        id: spec.id,
        name: spec.name,
        role: spec.role,
        organization: spec.organization,
        specialty: spec.specialty,
        phone: spec.phone,
        isBusy: spec.isBusy,
      },
    });
  } catch (err: any) {
    console.error("[partner:init error]:", err);
    res.status(500).json({ ok: false, error: "Server xatosi" });
  }
});

// GET /api/bot/partner/orders
router.get("/partner/orders", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.query.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec || spec.role !== "pharmacy") {
      return res.status(403).json({ ok: false, error: "Faqat agro-do'kon egalari uchun" });
    }

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.pharmacySpecialistId, spec.id))
      .orderBy(desc(orders.id))
      .limit(30);

    const items = await db.select().from(orderItems);
    const itemsMap = new Map<number, any[]>();
    for (const it of items) {
      const arr = itemsMap.get(it.orderId) || [];
      arr.push(it);
      itemsMap.set(it.orderId, arr);
    }

    const enriched = rows.map((r) => ({
      ...r,
      items: itemsMap.get(r.id) || [],
      // mijoz telefoni faqat tasdiqlangan/tayyor/yetkazilgan holatda to'liq chiqadi
      customerPhone: r.status === "yangi" ? null : r.customerPhone,
    }));

    res.json({ ok: true, orders: enriched });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/orders/:id/action
router.post("/partner/orders/:id/action", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const orderId = Number(req.params.id);
    const { action } = req.body || {}; // confirm | cancel | ready | done

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Hamkor topilmadi" });

    const order = (await db.select().from(orders).where(eq(orders.id, orderId)).limit(1))[0];
    if (!order || order.pharmacySpecialistId !== spec.id) {
      return res.status(403).json({ ok: false, error: "Ushbu bron sizning do'koningizga tegishli emas" });
    }

    let nextStatus: string | null = null;
    if (action === "confirm" && order.status === "yangi") nextStatus = "tasdiqlandi";
    if (action === "cancel" && (order.status === "yangi" || order.status === "tasdiqlandi")) nextStatus = "bekor";
    if (action === "ready" && order.status === "tasdiqlandi") nextStatus = "tayyor";
    if (action === "done" && (order.status === "tayyor" || order.status === "tasdiqlandi")) nextStatus = "yetkazildi";

    if (nextStatus) {
      await db.update(orders).set({ status: nextStatus }).where(eq(orders.id, orderId));

      if (order.userId) {
        let msg = "";
        if (nextStatus === "tasdiqlandi") msg = `✅ Sizning #${order.id} raqamli broningiz agro-do'kon tomonidan tasdiqlandi!`;
        if (nextStatus === "tayyor") msg = `📦 Sizning #${order.id} raqamli buyurtmangiz do'konda tayyorlandi, olib ketishingiz mumkin!`;
        if (nextStatus === "yetkazildi") msg = `🏪 #${order.id} raqamli buyurtma topshirildi!`;
        if (nextStatus === "bekor") msg = `❌ Kechirasiz, #${order.id} raqamli buyurtma agro-do'konda mahsulot yo'qligi sababli bekor qilindi.`;
        if (msg) await sendToUser(order.userId, msg);
      }
    }

    res.json({ ok: true, status: nextStatus || order.status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/bot/partner/calls
router.get("/partner/calls", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.query.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });

    const rows = await db
      .select()
      .from(specialistCalls)
      .where(eq(specialistCalls.specialistId, spec.id))
      .orderBy(desc(specialistCalls.id))
      .limit(30);

    const enriched = rows.map((c) => ({
      ...c,
      customerPhone: c.status === "yangi" ? null : c.customerPhone,
    }));

    res.json({ ok: true, calls: enriched });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/calls/:id/action
router.post("/partner/calls/:id/action", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const callId = Number(req.params.id);
    const { action } = req.body || {}; // accept | reject | done

    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });

    const call = (await db.select().from(specialistCalls).where(eq(specialistCalls.id, callId)).limit(1))[0];
    if (!call || call.specialistId !== spec.id) {
      return res.status(403).json({ ok: false, error: "Chaqiruv sizga tegishli emas" });
    }

    let nextStatus: string | null = null;
    if (action === "accept" && call.status === "yangi") nextStatus = "qabul_qilindi";
    if (action === "reject" && call.status === "yangi") nextStatus = "bekor";
    if (action === "done" && call.status === "qabul_qilindi") nextStatus = "bajarildi";

    if (nextStatus) {
      await db.update(specialistCalls).set({ status: nextStatus, updatedAt: new Date() }).where(eq(specialistCalls.id, callId));
    }

    res.json({ ok: true, status: nextStatus || call.status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/bot/partner/busy
router.post("/partner/busy", async (req, res) => {
  try {
    const initData = String(req.headers["x-telegram-init-data"] || req.body?.initData || "");
    const token = await partnerBotToken();
    if (!token || !initData || !verifyInitData(initData, token, 24 * 60 * 60)) {
      return res.status(401).json({ ok: false, error: "Avtorizatsiya talab etiladi" });
    }

    const { isBusy } = req.body || {};
    const params = new URLSearchParams(initData);
    const tgUser = JSON.parse(params.get("user") || "{}");
    const spec = (await db.select().from(specialists).where(eq(specialists.telegramId, Number(tgUser.id))).limit(1))[0];
    if (!spec) return res.status(403).json({ ok: false, error: "Mutaxassis topilmadi" });

    await db.update(specialists).set({ isBusy: Boolean(isBusy) }).where(eq(specialists.id, spec.id));
    res.json({ ok: true, isBusy: Boolean(isBusy) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
