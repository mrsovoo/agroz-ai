import "dotenv/config";
import express from "express";
import cors from "cors";

// Routers
import healthRouter from "./routes/health.js";
import specialistsRouter from "./routes/specialists.js";
import ordersRouter from "./routes/orders.js";
import medicinesRouter from "./routes/medicines.js";
import diagnoseRouter from "./routes/diagnose.js";
import newsRouter from "./routes/news.js";
import weatherRouter from "./routes/weather.js";
import locationRouter from "./routes/location.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import telegramRouter from "./routes/telegram.js";
import adminRouter from "./routes/admin.js";
import advertisementsRouter from "./routes/advertisements.js";
import pharmaciesRouter from "./routes/pharmacies.js";
import geoRouter from "./routes/geo.js";
import notificationsRouter from "./routes/notifications.js";
import supportRouter from "./routes/support.js";

import { ensureSeed } from "./lib/seed.js";
import { ensureSchema } from "./db/migrate.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS sozlamalari — faqat ALLOWED_ORIGINS (yoki CORS_ORIGIN) ro'yxatidagi manbalarga ruxsat beriladi
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN;
const allowedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(",").map((s) => s.trim()).filter(Boolean)
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://agroz.uz",
      "https://www.agroz.uz",
      "https://admin.agroz.uz",
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Server-to-server yoki bir xil origin so'rovlari (!origin)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);

// Body parsers (katta hajmdagi base64 rasmlar uchun limit 20mb)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Oddiy so'rov loglash
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// API Marshrutlari
app.use("/api/health", healthRouter);
app.use("/api/specialists", specialistsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/medicines", medicinesRouter);
app.use("/api/diagnose", diagnoseRouter);
app.use("/api/news", newsRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/location", locationRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/telegram", telegramRouter);
app.use("/api/admin", adminRouter);
app.use("/api/advertisements", advertisementsRouter);
app.use("/api/pharmacies", pharmaciesRouter);
app.use("/api/geo", geoRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/support", supportRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint topilmadi" });
});

// Xatoliklar boshqaruvi
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Unhandled Server Error]:", err);
  res.status(500).json({ error: err.message || "Ichki server xatoligi yuz berdi" });
});

// Serverni ishga tushirish
app.listen(PORT, async () => {
  console.log(`\n🚀 AgrozGO Backend server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📡 CORS ruxsat berilgan manbalar: ${allowedOrigins.join(", ")}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health\n`);

  // Bazadagi yetishmayotgan ustun va jadvallarni avtomatik yaratish/sinxronlash
  await ensureSchema();

  // Telegram Mini App launch nomini va menyu tugmasini AgrozGO deb sinxronlash
  import("./lib/telegram-bot.js")
    .then(({ setAgrozGoMenuButton }) => setAgrozGoMenuButton())
    .catch(() => {});

  // 30 daqiqadan ortiq "yangi" holatda qolgan buyurtmalar uchun yagona eslatma tekshiruvi (har 2 daqiqada)
  setInterval(() => {
    import("./lib/orders-bot.js")
      .then(({ checkUnansweredOrderReminders }) => checkUnansweredOrderReminders())
      .catch((err) => console.warn("[orders-reminder interval]:", err));
  }, 2 * 60 * 1000);

  // Demo ma'lumotlar faqat SEED_DEMO_DATA === "true" bo'lganda kiritiladi
  if (process.env.SEED_DEMO_DATA === "true") {
    try {
      await ensureSeed();
    } catch (seedErr) {
      console.warn("[seed warning]:", seedErr);
    }
  }
});

