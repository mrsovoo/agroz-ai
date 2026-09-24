import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const JWT_ALGO = "sha256";
const ACCESS_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

function getJwtSecret(): Buffer {
  const hexKey = process.env.JWT_SECRET;
  if (!hexKey) {
    throw new Error("JWT_SECRET environment variable is required (64 hex characters)");
  }
  if (hexKey.length !== 64) {
    throw new Error("JWT_SECRET must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(hexKey, "hex");
}

function base64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded + "===".slice((padded.length + 3) % 4), "base64");
}

export interface JwtPayload {
  sub: number; // userId
  type: "access" | "refresh";
  iat: number;
  exp: number;
  jti: string; // unique token ID for revocation
  sessionId?: string;
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp" | "jti">, ttlMs: number): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payloadWithClaims: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + Math.floor(ttlMs / 1000),
    jti: randomBytes(16).toString("hex"),
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payloadWithClaims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const secret = getJwtSecret();
  const signature = createHmac(JWT_ALGO, secret).update(signingInput).digest();
  const encodedSignature = base64url(signature);

  return `${signingInput}.${encodedSignature}`;
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const secret = getJwtSecret();
    const expectedSignature = createHmac(JWT_ALGO, secret).update(signingInput).digest();

    if (!timingSafeEqual(base64urlDecode(encodedSignature), expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(encodedPayload).toString()) as JwtPayload;

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createTokenPair(userId: number, sessionId?: string): { accessToken: string; refreshToken: string } {
  const accessToken = signJwt({ sub: userId, type: "access", sessionId }, ACCESS_TOKEN_TTL);
  const refreshToken = signJwt({ sub: userId, type: "refresh", sessionId }, REFRESH_TOKEN_TTL);
  return { accessToken, refreshToken };
}