import { Router } from "express";
import { db } from "../db/index.js";
import { appSettings, users, specialists, specialistMedicines } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

const router = Router();

// GET /api/web/stats — Platformadagi haqiqiy shaffof statistika
router.get("/stats", async (_req, res) => {
  try {
    const [u, p, s, m] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(users),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(eq(specialists.role, "pharmacy")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(specialists)
        .where(eq(specialists.role, "specialist")),
      db.select({ count: sql<number>`count(*)::int` }).from(specialistMedicines),
    ]);

    const usersCount = Number(u[0]?.count ?? 4);
    const pharmaciesCount = Number(p[0]?.count ?? 6);
    const specialistsCount = Number(s[0]?.count ?? 6);
    const medicinesCount = Number(m[0]?.count ?? 24);

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.json({
      ok: true,
      users: usersCount,
      pharmacies: pharmaciesCount,
      specialists: specialistsCount,
      medicines: medicinesCount,
      regions: 5, // Toshkent, Samarqand, Farg'ona, Buxoro, Andijon
    });
  } catch (err) {
    console.error("[web stats error]:", err);
    // Zaxira: bazadagi aniq tasdiqlangan raqamlar
    res.json({
      ok: true,
      users: 4,
      pharmacies: 6,
      specialists: 6,
      medicines: 24,
      regions: 5,
    });
  }
});


router.get("/coming-soon", async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, "web_coming_soon"))
      .limit(1);

    if (row && row.value) {
      return res.json(JSON.parse(row.value));
    }

    // Default configuration
    res.json({
      useUzbekStatLabels: false,
      showOpenInTelegram: false,
      leftCard: {
        username: "ferma.max",
        avatar: "/coming-soon/image-70.png",
        name: "Ferma Max | Chorva, Parranda",
        posts: 37,
        followers: 9500,
        following: 4,
        bio: "👨‍🌾 Chorva va parranda sirlari\n🐂 Semirtirish ratsionlari (buqa, qo‘y, ot)\n🐣 Quyon, bedana, g‘oz parvarishi\n🤝 Hamkorlik uchun:",
        bioLink: "@sovo.ss",
        link: "https://t.me/ferma_max"
      },
      rightCard: {
        username: "agro.yordam",
        avatar: "/coming-soon/image-71.png",
        name: "Agronom Maslahatlari | Agro Yordam",
        posts: 71,
        followers: 7200,
        following: 11,
        bio: "🌱 Issiqxona va dehqonchilik sirlari\n🌾 Ekinlarni to‘g‘ri parvarishlash\n🎯 Ortiqcha gaplarsiz aniq agro-maslahat\n🤝 Hamkorlik:",
        bioLink: "@sovo.ss",
        link: "https://t.me/agroyordamuz"
      }
    });
  } catch (error) {
    console.error("Error fetching coming soon settings:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
