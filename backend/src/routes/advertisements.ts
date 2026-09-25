import { Router } from "express";
import { db } from "../db/index.js";
import { advertisements, adminSessions } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function requireAdmin(req: any, res: any, next: any) {
  const sid = req.cookies?.["agroai_admin"] || req.cookies?.["agroz_admin_sid"] || req.headers["x-admin-session"] || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!sid) return res.status(401).json({ error: "Admin ruxsati talab qilinadi" });
  
  const rows = await db.select().from(adminSessions).where(eq(adminSessions.id, sid as string));
  if (rows.length === 0) return res.status(401).json({ error: "Admin sessiyasi topilmadi" });
  next();
}

// 1. GET / — Public: list active advertisements
router.get("/", async (req, res) => {
  try {
    const data = await db.select()
      .from(advertisements)
      .where(eq(advertisements.isActive, true))
      .orderBy(desc(advertisements.priority), desc(advertisements.createdAt));
      
    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Xatolik yuz berdi" });
  }
});

// 2. GET /all — Admin: list ALL advertisements
router.get("/all", requireAdmin, async (req, res) => {
  try {
    const data = await db.select()
      .from(advertisements)
      .orderBy(desc(advertisements.id));
      
    res.json({ ok: true, data });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Xatolik yuz berdi" });
  }
});

// 3. POST / — Admin: create new advertisement
router.post("/", requireAdmin, async (req, res) => {
  try {
    const { title, description, imageUrl, linkUrl, priority, isActive, startDate, endDate } = req.body;
    const [newAd] = await db.insert(advertisements).values({
      title,
      description,
      imageUrl,
      linkUrl,
      priority: priority ?? 0,
      isActive: isActive ?? true,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    }).returning();
    
    res.json({ ok: true, data: newAd });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Xatolik yuz berdi" });
  }
});

// 4. PUT /:id — Admin: update advertisement
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Yaroqsiz ID" });
    
    const { title, description, imageUrl, linkUrl, priority, isActive, startDate, endDate } = req.body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    updateData.updatedAt = new Date();

    const [updatedAd] = await db.update(advertisements)
      .set(updateData)
      .where(eq(advertisements.id, id))
      .returning();
      
    if (!updatedAd) return res.status(404).json({ error: "Topilmadi" });
    
    res.json({ ok: true, data: updatedAd });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Xatolik yuz berdi" });
  }
});

// 5. DELETE /:id — Admin: delete advertisement
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Yaroqsiz ID" });
    
    const [deletedAd] = await db.delete(advertisements)
      .where(eq(advertisements.id, id))
      .returning();
      
    if (!deletedAd) return res.status(404).json({ error: "Topilmadi" });
    
    res.json({ ok: true, data: deletedAd });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Xatolik yuz berdi" });
  }
});

export default router;
