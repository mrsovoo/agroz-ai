import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Xavfsiz scrypt hashing orqali parolni shifrlash (salt + hash)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Saqlangan hash bilan parolni solishtirish (timing-attack xavfsiz)
 */
export function verifyPassword(password: string, combined: string): boolean {
  try {
    const parts = combined.split(":");
    if (parts.length !== 2) return false;
    const [salt, storedHash] = parts;
    if (!salt || !storedHash) return false;
    const hash = scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

