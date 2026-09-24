import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const HASH_ALGO = "sha256";
const HASH_SALT_LENGTH = 16;

function getMasterKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    throw new Error("ENCRYPTION_KEY environment variable is required (64 hex characters)");
  }
  if (hexKey.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(hexKey, "hex");
}

function getHashKey(): Buffer {
  const hexKey = process.env.HASH_KEY;
  if (!hexKey) {
    throw new Error("HASH_KEY environment variable is required (64 hex characters)");
  }
  if (hexKey.length !== 64) {
    throw new Error("HASH_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(hexKey, "hex");
}

function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return scryptSync(masterKey, salt, KEY_LENGTH);
}

export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const masterKey = getMasterKey();
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(masterKey, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([salt, iv, authTag, ciphertext]);
  return result.toString("base64");
}

export function decrypt(ciphertextB64: string): string {
  if (!ciphertextB64) return ciphertextB64;

  try {
    const masterKey = getMasterKey();
    const data = Buffer.from(ciphertextB64, "base64");

    if (data.length < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
      return ciphertextB64;
    }

    const salt = data.subarray(0, SALT_LENGTH);
    const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = deriveKey(masterKey, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString("utf8");
  } catch {
    return ciphertextB64;
  }
}

export function hashPhone(phone: string): string {
  if (!phone) return "";
  const hashKey = getHashKey();
  const salt = randomBytes(HASH_SALT_LENGTH);
  const hmac = createHmac(HASH_ALGO, hashKey);
  hmac.update(salt);
  hmac.update(phone);
  const hash = hmac.digest();
  return Buffer.concat([salt, hash]).toString("base64");
}

export function verifyPhoneHash(phone: string, storedHashB64: string): boolean {
  if (!phone || !storedHashB64) return false;
  try {
    const data = Buffer.from(storedHashB64, "base64");
    if (data.length !== HASH_SALT_LENGTH + 32) return false;
    const salt = data.subarray(0, HASH_SALT_LENGTH);
    const storedHash = data.subarray(HASH_SALT_LENGTH);
    const hashKey = getHashKey();
    const hmac = createHmac(HASH_ALGO, hashKey);
    hmac.update(salt);
    hmac.update(phone);
    const computedHash = hmac.digest();
    return timingSafeEqual(storedHash, computedHash);
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return createHmac("sha256", getHashKey()).update(token).digest("hex");
}

export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  const result: Record<string, any> = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = encrypt(result[field]);
    }
  }
  return result as T;
}

export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  const result: Record<string, any> = { ...obj };
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = decrypt(result[field]);
    }
  }
  return result as T;
}

export const SENSITIVE_FIELDS = {
  users: ["phone", "secondPhone", "name"],
  specialists: ["phone", "name"],
  orders: ["customerName", "customerPhone", "customerAddress"],
  specialistCalls: ["customerName", "customerPhone", "address"],
  otpCodes: ["phone"],
  pharmacies: ["phone"],
};