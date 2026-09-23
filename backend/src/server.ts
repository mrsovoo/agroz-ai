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

import { ensureSeed } from "./lib/seed.js";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS sozlamalari
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".agroz.uz") ||
        origin === "https://agroz.uz"
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
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
  console.log(`\n🚀 Agroz AI Backend server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📡 CORS ruxsat berilgan manbalar: ${allowedOrigins.join(", ")}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health\n`);

  // Demo ma'lumotlar faqat SEED_DEMO_DATA === "true" bo'lganda kiritiladi
  if (process.env.SEED_DEMO_DATA === "true") {
    try {
      await ensureSeed();
    } catch (seedErr) {
      console.warn("[seed warning]:", seedErr);
    }
  }
});

