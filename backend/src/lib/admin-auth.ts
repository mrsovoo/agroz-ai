/**
 * Admin panel (`/admin/panel`) autentifikatsiyasi.
 *
 * Login/parol env orqali sozlanadi:
 *   ADMIN_USERNAME (standart: `admin`)
 *   ADMIN_PASSWORD (yoki ADMIN_PASSWOR)
 *
 * Parol hech qachon bazada ochiq saqlanmaydi; sessiyalar `admin_sessions` jadvalida
 * turadi (random 48 belgili token, cookie va x-admin-session header).
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { db } from "../db/index.js";
import { adminSessions } from "../db/schema.js";
import { and, eq, lt } from "drizzle-orm";
import { adminPasswordSetting, adminUsernameSetting } from "./settings.js";

export const ADMIN_COOKIE = "agroai_admin";
const ADMIN_TTL_MS = 24 * 60 * 60 * 1000; // 24 soat

export function getEnvAdminUsername(): string {
  const custom =
    process.env.ADMIN_USER ||
    process.env.admin_user ||
    process.env.ADMIN_LOGIN ||
    process.env.admin_login ||
    process.env["admin username"];
  if (custom && custom.trim()) return custom.trim();

  const standard =
    process.env.ADMIN_USERNAME ||
    process.env.admin_username;
  if (standard && standard.trim()) return standard.trim();

  return "admin";
}

export function getEnvAdminPassword(): string {
  const custom =
    process.env.ADMIN_PASSWOR ||
    process.env.admin_passwor ||
    process.env["admin passwor"] ||
    process.env.ADMIN_PASS ||
    process.env.admin_pass;
  if (custom && custom.trim()) return custom.trim();

  const standard =
    process.env.ADMIN_PASSWORD ||
    process.env.admin_password ||
    process.env["admin password"];
  if (standard && standard.trim()) return standard.trim();

  return "admin123";
}

/**
 * Login/parol ustuvorligi: DB (admin panel sozlamalarida kiritilgan) > Railway / .env.
 */
export async function credentials(): Promise<{ username: string; password: string | null }> {
  const [dbUser, dbPass] = await Promise.all([adminUsernameSetting(), adminPasswordSetting()]);
  const username = dbUser || getEnvAdminUsername();
  const password = dbPass || getEnvAdminPassword();
  return { username, password };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Admin parolini bazaga SHA-256 hash ko'rinishida yozadi. */
export async function setAdminPassword(password: string): Promise<void> {
  const { setSetting, SETTING_KEYS } = await import("./settings.js");
  await setSetting(SETTING_KEYS.adminPassword, sha256(password.trim()));
}

/** Admin panel yoqilganmi — parol belgilangan bo'lsa. */
export async function adminEnabled(): Promise<boolean> {
  return (await credentials()).password !== null;
}

/** Constant-time satr taqqoslash (timing attack oldini olish). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Parolni saqlangan qiymat bilan tekshiradi (hash yoki ochiq matn). */
function passwordMatches(input: string, stored: string): boolean {
  const isHash = /^[0-9a-f]{64}$/i.test(stored);
  return isHash ? safeEqual(sha256(input), stored) : safeEqual(input, stored);
}

export type LoginResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: "disabled" | "invalid" };

export async function adminLogin(
  username: string,
  password: string,
): Promise<LoginResult> {
  const creds = await credentials();
  if (!creds.password) return { ok: false, error: "disabled" };

  const userOk = safeEqual(username.trim().toLowerCase(), creds.username.toLowerCase());
  const passOk = passwordMatches(password, creds.password);
  if (!userOk || !passOk) return { ok: false, error: "invalid" };

  const id = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + ADMIN_TTL_MS);
  await db.insert(adminSessions).values({ id, expiresAt });

  // Eskirgan sessiyalarni tozalaymiz.
  await db
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, new Date()))
    .catch(() => undefined);

  return { ok: true, sessionId: id };
}

export async function adminLogout(sid?: string): Promise<void> {
  if (sid) {
    await db.delete(adminSessions).where(eq(adminSessions.id, sid)).catch(() => undefined);
  }
}

/** Admin so'rovni tekshiradi — sessiya tokeni bazada mavjud va yaroqli bo'lsa `true`. */
export async function isAdminAuthenticated(sid?: string): Promise<boolean> {
  if (!sid) return false;

  try {
    const rows = await db
      .select()
      .from(adminSessions)
      .where(and(eq(adminSessions.id, sid)))
      .limit(1);
    const session = rows[0];
    if (!session) return false;
    if (session.expiresAt.getTime() < Date.now()) {
      await db.delete(adminSessions).where(eq(adminSessions.id, sid)).catch(() => undefined);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[admin-auth] sessiya tekshirishda xato:", err);
    return false;
  }
}
