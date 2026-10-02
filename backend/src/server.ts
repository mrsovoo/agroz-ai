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
import pushRouter from "./routes/push.js";

import { ensureSeed } from "./lib/seed.js";
import { ensureSchema } from "./db/migrate.js";

// Production xavfsizlik tekshiruvi (kuchsiz admin parol bilan ishga tushishni taqiqlash)
if (process.env.NODE_ENV === "production") {
  const adminPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWOR || "";
  if (!adminPass || adminPass.trim() === "admin123" || adminPass.trim().length < 8) {
    console.error("\n❌ [XAVFSIZLIK XATOSI]: Production rejimida ADMIN_PASSWORD 'admin123' yoki 8 belgidan kam bo'lishi mumkin emas!");
    console.error("Iltimos, server muhitida kuchli ADMIN_PASSWORD o'rnating.\n");
    process.exit(1);
  }
}

import { startCronJobs } from "./cron.js";

const app = express();
startCronJobs();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 4000;

// CORS sozlamalari — ALLOWED_ORIGINS, CORS_ORIGIN, APP_URL hamda loyiha domenlariga ruxsat beriladi
const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "https://agroz.uz",
  "https://www.agroz.uz",
  "https://admin.agroz.uz",
];

const envOrigins = [
  process.env.ALLOWED_ORIGINS,
  process.env.CORS_ORIGIN,
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.NEXT_PUBLIC_APP_URL,
]
  .filter(Boolean)
  .flatMap((raw) => String(raw).split(","))
  .map((s) => s.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

function isAllowedOrigin(origin: string): boolean {
  const normalized = origin.trim().replace(/\/+$/, "");
  if (allowedOrigins.includes(normalized)) return true;

  try {
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "agroz.uz" ||
      host.endsWith(".agroz.uz") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".up.railway.app") ||
      host.endsWith(".railway.app") ||
      host.endsWith(".onrender.com") ||
      host.endsWith(".telegram.org")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Server-to-server, Next.js rewrite proxy yoki bir xil origin so'rovlari (!origin)
      if (!origin || isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      // Xato otmasdan (500 bermasdan) faqat CORS headerini qo'ymaslik:
      return callback(null, false);
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
app.use("/api/push", pushRouter);

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

  // Har kuni ertalab (07:00 da) ro'yxatdan o'tgan fermerlarga hududiy ob-havo xabarnomasini avtomatik yuborish
  setInterval(() => {
    try {
      const nowStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tashkent",
        hour: "numeric",
        hour12: false,
      }).format(new Date());
      const hour = parseInt(nowStr, 10);
      if (hour === 7) {
        import("./lib/weather-alerts.js")
          .then(({ sendDailyMorningAgroWeatherBroadcast }) => sendDailyMorningAgroWeatherBroadcast())
          .catch((err) => console.warn("[daily-weather interval error]:", err));
      }
    } catch (err) {
      console.warn("[daily-weather check error]:", err);
    }
  }, 10 * 60 * 1000);

  // Demo ma'lumotlar faqat SEED_DEMO_DATA === "true" bo'lganda kiritiladi
  if (process.env.SEED_DEMO_DATA === "true") {
    try {
      await ensureSeed();
    } catch (seedErr) {
      console.warn("[seed warning]:", seedErr);
    }
  }
});

