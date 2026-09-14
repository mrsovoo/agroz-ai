/**
 * Admin panel (`/admin/panel`) autentifikatsiyasi.
 *
 * Login/parol env orqali sozlanadi:
 *   ADMIN_USERNAME (standart: `admin`)
 *   ADMIN_PASSWORD — majburiy! Bo'sh bo'lsa admin panel o'chirilgan bo'ladi.
 *
 * Parol hech qachon bazada saqlanmaydi; sessiyalar `admin_sessions` jadvalida
 * turadi (random token, httpOnly cookie).
 */

import { cookies } from "next/headers";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { adminSessions } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";
import { adminPasswordSetting, adminUsernameSetting } from "@/lib/settings";

export const ADMIN_COOKIE = "agroai_admin";
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000; // 12 soat

/**
 * Login/parol ustuvorligi: DB (admin panel "Admin hisobi" bo'limida yozilgan) > env.
 * Parol hech qachon clientga chiqmaydi. Bazada faqat SHA-256 hash saqlanadi
 * (`setAdminPassword` bilan yoziladi); env'dagi parol esa ochiq matn bo'lishi mumkin.
 */
async function credentials(): Promise<{ username: string; password: string | null }> {
  const [dbUser, dbPass] = await Promise.all([adminUsernameSetting(), adminPasswordSetting()]);
  const username = dbUser || process.env.ADMIN_USERNAME?.trim() || "admin";
  const password = dbPass || process.env.ADMIN_PASSWORD?.trim() || null;
  return { username, password };
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Admin parolini bazaga SHA-256 hash ko'rinishida yozadi. */
export async function setAdminPassword(password: string): Promise<void> {
  const { setSetting, SETTING_KEYS } = await import("@/lib/settings");
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
  | { ok: true }
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

  const store = await cookies();
  store.set(ADMIN_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(ADMIN_TTL_MS / 1000),
  });
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  const store = await cookies();
  const sid = store.get(ADMIN_COOKIE)?.value;
  if (sid) {
    await db.delete(adminSessions).where(eq(adminSessions.id, sid));
    store.delete(ADMIN_COOKIE);
  }
}

/** Admin so'rovni tekshiradi — sessiya cookie'si yaroqli bo'lsa `true`. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const sid = store.get(ADMIN_COOKIE)?.value;
  if (!sid) return false;

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
}

/** Admin API route'lar uchun guard: auth bo'lmasa 401 qaytaradi. */
export async function requireAdmin(): Promise<Response | null> {
  if (!(await isAdminAuthenticated())) {
    return Response.json({ error: "Ruxsat yo'q. Admin sifatida kiring." }, { status: 401 });
  }
  return null;
}
