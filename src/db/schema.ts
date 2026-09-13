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
  source: varchar("source", { length: 20 }).default("ai"),
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
  /** Mutaxassislik (agronom, veterinar...) yoki dorixona turi (agro, vet). */
  specialty: varchar("specialty", { length: 160 }),
  /** Dorixona nomi — faqat role=pharmacy uchun. */
  organization: varchar("organization", { length: 200 }),
  address: text("address").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  workHours: varchar("work_hours", { length: 60 }).default("09:00 - 18:00"),
  /** Admin bloklagan profillar qidiruvda chiqmaydi. */
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
