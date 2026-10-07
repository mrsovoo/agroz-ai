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
  secondPhone: varchar("second_phone", { length: 32 }),
  telegramId: bigint("telegram_id", { mode: "number" }).unique(),
  name: varchar("name", { length: 120 }),
  region: varchar("region", { length: 120 }),
  district: varchar("district", { length: 120 }),
  weatherSentDate: varchar("weather_sent_date", { length: 16 }),
  isWeatherPushEnabled: boolean("is_weather_push_enabled").default(true).notNull(),
  botStartedAt: timestamp("bot_started_at"),
  botBlocked: boolean("bot_blocked").default(false).notNull(),

  /** Shaxsiy ma'lumotlarni saqlash va qayta ishlashga rozilik (O'RQ-547). */
  consentedAt: timestamp("consented_at"),
  consentVersion: varchar("consent_version", { length: 32 }).default("v1.0"),
  consentChannel: varchar("consent_channel", { length: 64 }).default("telegram_farmer_bot"),
  consentText: text("consent_text"),

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
  /** Mutaxassis ayni paytda chaqiruv ustida ishlayotgani (bandligi). */
  isBusy: boolean("is_busy").default(false).notNull(),
  /** Ayni paytda bajarayotgan chaqiruvi ID si. */
  currentCallId: integer("current_call_id"),
  botStartedAt: timestamp("bot_started_at"),
  botBlocked: boolean("bot_blocked").default(false).notNull(),

  /** Shaxsiy ma'lumotlarni saqlash va qayta ishlashga rozilik (O'RQ-547). */
  consentedAt: timestamp("consented_at"),
  consentVersion: varchar("consent_version", { length: 32 }).default("v1.0"),
  consentChannel: varchar("consent_channel", { length: 64 }).default("telegram_auth_bot"),
  consentText: text("consent_text"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Shaxsiy ma'lumotlarni saqlash va qayta ishlashga berilgan roziliklar jurnali (Audit log).
 * O'zbekiston Respublikasining "Shaxsiy ma'lumotlar to'g'risida"gi O'RQ-547-son Qonuniga muvofiq,
 * ushbu yozuvlar hatto admin tomonidan ham o'zgartirilishi mumkin emas (immutable).
 */
export const dataConsents = pgTable("data_consents", {
  id: serial("id").primaryKey(),
  subjectType: varchar("subject_type", { length: 32 }).notNull(), // specialist | pharmacy | user
  subjectId: integer("subject_id").notNull(),
  telegramId: bigint("telegram_id", { mode: "number" }),
  phone: varchar("phone", { length: 32 }).notNull(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  policyVersion: varchar("policy_version", { length: 32 }).default("v1.0").notNull(),
  consentChannel: varchar("consent_channel", { length: 64 }).notNull(),
  consentStatement: text("consent_statement").notNull(),
  legalBasis: text("legal_basis")
    .default("O'zbekiston Respublikasi O'RQ-547-sonli 'Shaxsiy ma'lumotlar to'g'risida'gi Qonuni")
    .notNull(),
  consentedAt: timestamp("consented_at").defaultNow().notNull(),
  immutableHash: varchar("immutable_hash", { length: 64 }).notNull(),
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
  status: varchar("status", { length: 20 }).notNull().default("bor"), // bor | yoq | qoralama
  /** Narx so'mda (majburiy) — dorixona egasi yozadi, mijozga ko'rinadi. */
  price: integer("price"),
  /** Dori qoldiq miqdori (dona, kg, litr). */
  stock: integer("stock").default(10).notNull(),
  /** O'lchov birligi (dona | kg | litr). */
  stockUnit: varchar("stock_unit", { length: 20 }).default("dona").notNull(),
  /** Rasm kengligi (px). */
  imageWidth: integer("image_width"),
  /** Rasm balandligi (px). */
  imageHeight: integer("image_height"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Dori tugaganda mijozlar "Kelganda xabar berish" ni bosgan kutish ro'yxati.
 * Dori zaxirasi to'ldirilganda yoki status "bor" qilinganda avtomatik Telegram xabar yuboriladi.
 */
export const medicineWaitlist = pgTable("medicine_waitlist", {
  id: serial("id").primaryKey(),
  medicineId: integer("medicine_id").notNull(),
  telegramId: bigint("telegram_id", { mode: "number" }),
  phone: varchar("phone", { length: 32 }),
  userId: integer("user_id"),
  isNotified: boolean("is_notified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notifiedAt: timestamp("notified_at"),
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
  /** 30 daqiqa davomida "yangi" holatda javobsiz qolgan buyurtma uchun dorixonaga yuborilgan yagona eslatma vaqti. */
  reminderSentAt: timestamp("reminder_sent_at"),
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

/**
 * Fermerlar va mijozlar tomonidan mutaxassislarga yuborilgan chaqiruvlar
 * yoki dorixona buyurtmasi uchun biriktirilgan mutaxassislar.
 */
export const specialistCalls = pgTable("specialist_calls", {
  id: serial("id").primaryKey(),
  specialistId: integer("specialist_id").notNull(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 32 }).notNull(),
  problem: text("problem").notNull(),
  address: text("address"),
  /** yangi | qabul_qilindi | bajarildi | bekor */
  status: varchar("status", { length: 20 }).notNull().default("yangi"),
  /** Agar dorixona buyurtmasi uchun biriktirilgan bo'lsa */
  assignedOrderId: integer("assigned_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Foydalanuvchilar tomonidan o'qilgan bildirishnomalar holati (Telegram va brauzerda bir xil bo'lishi uchun bazada saqlanadi).
 */
export const notificationReads = pgTable("notification_reads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  notificationKey: varchar("notification_key", { length: 160 }).notNull(),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

/**
 * Support / Murojaatlar tizimi — foydalanuvchi va mutaxassis murojaatlari (tickets).
 * user_type: 'user' | 'specialist'
 * category: 'texnik' | 'umumiy'
 * status: 'yangi' | 'javob_berildi' | 'yopiq'
 */
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userType: varchar("user_type", { length: 20 }).notNull().default("user"),
  userId: integer("user_id"),
  specialistId: integer("specialist_id"),
  telegramId: bigint("telegram_id", { mode: "number" }),
  category: varchar("category", { length: 40 }).notNull().default("umumiy"),
  status: varchar("status", { length: 30 }).notNull().default("yangi"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Murojaat ichidagi xabarlar (chat ko'rinishida).
 * sender: 'user' | 'admin'
 */
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  sender: varchar("sender", { length: 20 }).notNull().default("user"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Ommaviy xabarlar (fon jarayoni sifatida yuboriladigan broadcastlar).
 * status: 'jarayonda' | 'tugadi' | 'toxtadi'
 */
export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  buttonText: varchar("button_text", { length: 100 }),
  buttonUrl: text("button_url"),
  target: varchar("target", { length: 40 }).notNull().default("all"),
  total: integer("total").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("jarayonda"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const broadcastDeliveries = pgTable("broadcast_deliveries", {
  id: serial("id").primaryKey(),
  broadcastId: integer("broadcast_id").notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // user | specialist
  recipientId: integer("recipient_id").notNull(),
  telegramId: bigint("telegram_id", { mode: "number" }),
  status: varchar("status", { length: 20 }).notNull().default("sent"), // sent | failed | blocked
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Push bildirishnomalar tokenlari (Android FCM va iOS APNs/FCM).
 */
export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  platform: varchar("platform", { length: 20 }).notNull().default("unknown"), // android | ios | web
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

import { advertisements } from "./advertisements.js";
export { advertisements };

