import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  doublePrecision,
  integer,
  boolean,
  bigint,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).unique(),
  telegramId: bigint("telegram_id", { mode: "number" }).unique(),
  name: varchar("name", { length: 120 }),
  region: varchar("region", { length: 120 }),
  district: varchar("district", { length: 120 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull(),
  code: varchar("code", { length: 8 }).notNull(),
  used: boolean("used").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  /** Telegram bot orqali tasdiqlash uchun bir martalik havola tokeni. */
  token: varchar("token", { length: 64 }).unique(),
  /** Kod bot orqali yuborilgan Telegram foydalanuvchisi. */
  telegramId: bigint("telegram_id", { mode: "number" }),
  /** Kod botga yuborilgan vaqt (bir marta yuborilganini bilish uchun). */
  deliveredAt: timestamp("delivered_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  kind: varchar("kind", { length: 20 }).notNull().default("agro"), // agro | vet
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: text("address").notNull(),
  specialist: varchar("specialist", { length: 120 }),
  workHours: varchar("work_hours", { length: 60 }).default("09:00 - 18:00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  type: varchar("type", { length: 20 }).notNull().default("agro"), // agro | vet
  usage: text("usage"),
});

export const pharmacyStocks = pgTable("pharmacy_stocks", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull(),
  medicineId: integer("medicine_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("bor"), // bor | yoq
  price: integer("price"),
});

export const diagnoses = pgTable("diagnoses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  category: varchar("category", { length: 20 }).notNull(), // crop | animal
  inputText: text("input_text"),
  hasImage: boolean("has_image").default(false).notNull(),
  diseaseName: text("disease_name").notNull(),
  solution: text("solution").notNull(),
  medicines: text("medicines").notNull(), // JSON array of names
  severity: varchar("severity", { length: 20 }).default("orta"),
  /** AI ishonch darajasi (0-100). 80 dan past bo'lsa mutaxassis tavsiya etiladi. */
  confidence: integer("confidence"),
  source: varchar("source", { length: 20 }).default("ai"),
  /**
   * Anonim tashxisni ko'rish tokeni hash'i (SHA-256). Token API javobida
   * bir marta qaytariladi va faqat shu hash bilan moslashganda sahifa ochiladi —
   * ID'ni bilgan istalgan odam boshqaning tashxisini ko'ra olmaydi.
   */
  viewHash: varchar("view_hash", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  tag: varchar("tag", { length: 40 }).default("Umumiy"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * `@agroz_auth_bot` orqali ro'yxatdan o'tgan mutaxassislar va dorixona egalari.
 * Har bir Telegram hisobi uchun bitta profil — qayta yuborilsa yangilanadi.
 */
export const specialists = pgTable("specialists", {
  id: serial("id").primaryKey(),
  telegramId: bigint("telegram_id", { mode: "number" }).unique().notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  /** specialist — alohida mutaxassis, pharmacy — dorixona egasi. */
  role: varchar("role", { length: 20 }).notNull().default("specialist"),
  /** Mutaxassislik (agronom, veterinar...) yoki dorixona turi (agro, vet, umumiy). */
  specialty: varchar("specialty", { length: 160 }),
  /** Qayerda o'qigan/tamomlagan (OTM, kollej, kurslar). */
  education: varchar("education", { length: 300 }),
  /** Qisqa bio: nimalarni biladi, qanday yordam beradi. */
  bio: varchar("bio", { length: 500 }),
  /** Kimga yordam beradi: crop — ekin, animal — chorva, both — ikkalasi. */
  helpsWith: varchar("helps_with", { length: 20 }).default("both"),
  /** Tajriba yillari — tavsiya algoritmi tajribaga qarab radius kengaytiradi. */
  experienceYears: integer("experience_years"),
  /** Dorixona nomi — faqat role=pharmacy uchun. */
  organization: varchar("organization", { length: 200 }),
  address: text("address").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  workHours: varchar("work_hours", { length: 60 }).default("09:00 - 18:00"),
  /** Admin bloklagan yoki o'zining o'chirgan profillar qidiruvda chiqmaydi. */
  isActive: boolean("is_active").default(true).notNull(),
  /** Admin arizani tasdiqlaganmi. Yangi ro'yxatdan o'tganlar kutilmoqda (false) bo'ladi. */
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Dorixona egalari bot orqali qo'shgan dorilar (rasm + nom).
 * Platformada **faqat tashxis qo'yilgandan keyin** tavsiya sifatida ko'rinadi.
 */
export const specialistMedicines = pgTable("specialist_medicines", {
  id: serial("id").primaryKey(),
  /** `specialists.id` — dorixona egasi (role=pharmacy). */
  specialistId: integer("specialist_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  /** Telegram `file_id` — eski rasmlar uchun (proxy orqali uzatiladi). */
  photoFileId: varchar("photo_file_id", { length: 300 }),
  /**
   * Normallashtirilgan rasm (1080×1450 JPEG) — base64.
   * Dori qo'shishda bot rasmini yuklab, shu o'lchamga keltirib bazaga yozadi;
   * sahifalarda shundan o'qiladi (Telegram'ga qayta murojaat shart emas).
   */
  photoData: text("photo_data"),
  /** Kim uchun: crop — ekin/o'simlik, animal — hayvon, general — umumiy. */
  type: varchar("type", { length: 20 }).notNull().default("general"),
  /** Nima uchun ishlatiladi (qisqa tavsif, mijozga ko'rinadi). */
  usage: varchar("usage", { length: 300 }),
  status: varchar("status", { length: 20 }).notNull().default("bor"), // bor | yoq
  /** Narx so'mda (ixtiyoriy) — dorixona egasi yozadi, mijozga ko'rinadi. */
  price: integer("price"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Mutaxassis/dorixona reytingi (1–5 yulduz).
 * Bir mijoz (IP asosida anonim kalit) bir mutaxassisdga faqat bitta ovoz beradi —
 * qayta bossa ovozi yangilanadi.
 */
export const specialistRatings = pgTable(
  "specialist_ratings",
  {
    id: serial("id").primaryKey(),
    /** `specialists.id`. */
    specialistId: integer("specialist_id").notNull(),
    /** Anonim mijoz kaliti (IP hash) — takroriy ovozlarning oldini oladi. */
    raterKey: varchar("rater_key", { length: 64 }).notNull(),
    /** 1–5 yulduz. */
    stars: integer("stars").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("specialist_ratings_uniq").on(table.specialistId, table.raterKey)],
);

/**
 * Mijoz buyurtmasi — savat **bitta dorixonadan** dorilar bilan yaratiladi
 * (har bir dorixona uchun alohida buyurtma).
 */
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  /** Sayt foydalanuvchisi (kirmagan bo'lsa null — anonim buyurtma). */
  userId: integer("user_id"),
  /** `specialists.id` — buyurtma qilingan dorixona. */
  pharmacySpecialistId: integer("pharmacy_specialist_id").notNull(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  /** Mijoz izohi (masalan: "ertalab kerak bo'ladi"). */
  note: text("note"),
  /** pickup — dorixonadan olib ketish, delivery — yetkazib berish. */
  deliveryType: varchar("delivery_type", { length: 20 }).notNull().default("pickup"),
  /** Yetkazib berish manzili (faqat delivery uchun). */
  customerAddress: text("customer_address"),
  /** Server tomonda hisoblangan umumiy summa (so'm). */
  totalSum: integer("total_sum"),
  /** yangi | tasdiqlandi | yetkazildi | bekor. */
  status: varchar("status", { length: 20 }).notNull().default("yangi"),
  /** Mijoz buyurtmani baholashi: 1–5 yulduz + izoh (dorixona reytingiga qo'shiladi). */
  ratingStars: integer("rating_stars"),
  ratingNote: varchar("rating_note", { length: 300 }),
  ratedAt: timestamp("rated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Buyurtmadagi har bir dori (nom/narx buyurtma paytidagi ko'rinishida saqlanadi). */
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  medicineId: integer("medicine_id").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  price: integer("price"),
  qty: integer("qty").notNull().default(1),
});

/**
 * Bot suhbatining holati (multi-step ro'yxatdan o'tish).
 * Serverless muhitda xotira saqlanmaydi — shuning uchun holat bazada saqlanadi.
 */
export const botStates = pgTable("bot_states", {
  telegramId: bigint("telegram_id", { mode: "number" }).primaryKey(),
  /** Qaysi bot oqimi: auth — ro'yxatdan o'tish. */
  flow: varchar("flow", { length: 20 }).notNull().default("auth"),
  step: varchar("step", { length: 40 }).notNull(),
  /** Yig'ilgan javoblar (JSON). */
  data: text("data"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Admin panel orqali boshqariladigan dinamik sozlashlar (bot tokenlari, AI kalitlari,
 * SMS ma'lumotlari va h.k.). Bu yerda yozilgan qiymat `.env` dagi qiymatdan ustun turadi.
 * Tokenlar hech qachon clientga chiqmaydi — admin panelida faqat oxirgi 4 belgi ko'rsatiladi.
 */
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Admin panel sessiyalari (`/admin/panel` uchun login/parol bilan kiriladi). */
export const adminSessions = pgTable("admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
