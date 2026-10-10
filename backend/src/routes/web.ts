import { Router } from "express";
import { db } from "../db/index.js";
import { appSettings } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

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
