import { Router, Request, Response } from "express";
import { asc, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { specialists, supportMessages, supportTickets } from "../db/schema.js";
import { getUserFromReq } from "../lib/user-auth.js";

const router = Router();

/**
 * Foydalanuvchiga bog'liq specialist yozuvini (agar bor bo'lsa) topish.
 */
async function findLinkedSpecialist(user: { id: number; phone?: string | null; telegramId?: number | null }) {
  try {
    if (user.telegramId) {
      const [byTg] = await db
        .select()
        .from(specialists)
        .where(eq(specialists.telegramId, user.telegramId))
        .limit(1);
      if (byTg) return byTg;
    }
    if (user.phone) {
      const [byPhone] = await db
        .select()
        .from(specialists)
        .where(eq(specialists.phone, user.phone))
        .limit(1);
      if (byPhone) return byPhone;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Bot (@agroz_bot yoki @agroz_auth_bot) orqali yuborilgan murojaatni
 * bazaga yozish yordamchisi.
 */
export async function createBotSupportTicket(params: {
  userType: "user" | "specialist";
  userId?: number | null;
  specialistId?: number | null;
  telegramId: number;
  category?: "texnik" | "umumiy";
  text: string;
}): Promise<{ ticketId: number }> {
  const cleanCategory = params.category === "texnik" ? "texnik" : "umumiy";
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userType: params.userType,
      userId: params.userId ?? null,
      specialistId: params.specialistId ?? null,
      telegramId: params.telegramId,
      category: cleanCategory,
      status: "yangi",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    sender: "user",
    text: params.text.trim(),
    createdAt: new Date(),
  });

  return { ticketId: ticket.id };
}

/**
 * GET /api/support/tickets
 * Joriy sessiyadagi foydalanuvchining (yoki mutaxassisning) barcha murojaatlarini
 * va ularning ichidagi xabarlarni qaytaradi.
 */
router.get("/tickets", async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Murojaatlarni ko'rish uchun tizimga kiring." });
    }

    const linkedSpec = await findLinkedSpecialist(user);
    const conditions = [eq(supportTickets.userId, user.id)];
    if (user.telegramId) {
      conditions.push(eq(supportTickets.telegramId, user.telegramId));
    }
    if (linkedSpec) {
      conditions.push(eq(supportTickets.specialistId, linkedSpec.id));
    }

    const tickets = await db
      .select()
      .from(supportTickets)
      .where(or(...conditions))
      .orderBy(desc(supportTickets.updatedAt));

    if (tickets.length === 0) {
      return res.json({ ok: true, items: [] });
    }

    const ticketIds = tickets.map((t) => t.id);
    const allMessages = await db
      .select()
      .from(supportMessages)
      .where(inArray(supportMessages.ticketId, ticketIds))
      .orderBy(asc(supportMessages.createdAt));

    const msgMap = new Map<number, typeof allMessages>();
    for (const m of allMessages) {
      const arr = msgMap.get(m.ticketId) ?? [];
      arr.push(m);
      msgMap.set(m.ticketId, arr);
    }

    const items = tickets.map((t) => ({
      ...t,
      messages: msgMap.get(t.id) ?? [],
    }));

    return res.json({ ok: true, items });
  } catch (err: any) {
    console.error("[GET /api/support/tickets error]:", err);
    return res.status(500).json({ ok: false, error: "Murojaatlarni yuklashda xatolik" });
  }
});

/**
 * POST /api/support/tickets
 * Yangi murojaat (ticket) yaratish va birinchi xabarni yozish.
 */
router.post("/tickets", async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Murojaat yuborish uchun tizimga kiring." });
    }

    const rawCategory = String(req.body?.category || "umumiy").trim().toLowerCase();
    const category = rawCategory === "texnik" ? "texnik" : "umumiy";
    const text = String(req.body?.text || "").trim();

    if (text.length < 3) {
      return res.status(400).json({ ok: false, error: "Murojaat matni kamida 3 ta belgidan iborat bo'lishi kerak." });
    }
    if (text.length > 2000) {
      return res.status(400).json({ ok: false, error: "Murojaat matni juda uzun (maksimum 2000 ta belgi)." });
    }

    const linkedSpec = await findLinkedSpecialist(user);
    const requestedType = req.body?.userType === "specialist" && linkedSpec ? "specialist" : "user";

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        userType: requestedType,
        userId: user.id,
        specialistId: linkedSpec?.id ?? null,
        telegramId: user.telegramId ?? linkedSpec?.telegramId ?? null,
        category,
        status: "yangi",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const [firstMessage] = await db
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        sender: "user",
        text,
        createdAt: new Date(),
      })
      .returning();

    return res.status(201).json({
      ok: true,
      ticket: {
        ...ticket,
        messages: [firstMessage],
      },
    });
  } catch (err: any) {
    console.error("[POST /api/support/tickets error]:", err);
    return res.status(500).json({ ok: false, error: "Murojaat yuborishda xatolik" });
  }
});

/**
 * POST /api/support/tickets/:id/messages
 * Mavjud murojaatga foydalanuvchi tomonidan qo'shimcha xabar yozish.
 */
router.post("/tickets/:id/messages", async (req: Request, res: Response) => {
  try {
    const user = await getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Xabar yuborish uchun tizimga kiring." });
    }

    const ticketId = Number(req.params.id);
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ ok: false, error: "Noto'g'ri murojaat ID." });
    }

    const text = String(req.body?.text || "").trim();
    if (text.length < 1) {
      return res.status(400).json({ ok: false, error: "Xabar matni bo'sh bo'lishi mumkin emas." });
    }
    if (text.length > 2000) {
      return res.status(400).json({ ok: false, error: "Xabar matni juda uzun." });
    }

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return res.status(404).json({ ok: false, error: "Murojaat topilmadi." });
    }

    const linkedSpec = await findLinkedSpecialist(user);
    const isOwner =
      ticket.userId === user.id ||
      (user.telegramId != null && ticket.telegramId === user.telegramId) ||
      (linkedSpec != null && ticket.specialistId === linkedSpec.id);

    if (!isOwner) {
      return res.status(403).json({ ok: false, error: "Bu murojaat sizga tegishli emas." });
    }

    const [createdMsg] = await db
      .insert(supportMessages)
      .values({
        ticketId: ticket.id,
        sender: "user",
        text,
        createdAt: new Date(),
      })
      .returning();

    await db
      .update(supportTickets)
      .set({
        status: "yangi",
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticket.id));

    return res.status(201).json({
      ok: true,
      message: createdMsg,
    });
  } catch (err: any) {
    console.error("[POST /api/support/tickets/:id/messages error]:", err);
    return res.status(500).json({ ok: false, error: "Xabar yuborishda xatolik" });
  }
});

export default router;
