import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnectAttempted = false;

// Redis ulanmaganda ishlatiladigan xotira-ichi (in-memory) cheklov xaritasi
const memoryStore = new Map<string, { count: number; resetMs: number }>();

function cleanupMemoryStore(now: number) {
  if (memoryStore.size < 500) return;
  for (const [k, v] of memoryStore.entries()) {
    if (v.resetMs <= now) {
      memoryStore.delete(k);
    }
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  cleanupMemoryStore(now);

  const existing = memoryStore.get(key);
  if (!existing || existing.resetMs <= now) {
    const resetMs = now + windowMs;
    memoryStore.set(key, { count: 1, resetMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetMs };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetMs: existing.resetMs };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetMs: existing.resetMs,
  };
}

export function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!redisClient && !redisConnectAttempted) {
    redisConnectAttempted = true;
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => console.error("[Redis] Client error:", err));
    redisClient.connect().catch((err) => console.error("[Redis] Connect failed:", err));
  }
  return redisClient;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const client = getRedisClient();
  if (!client?.isOpen) {
    return memoryRateLimit(key, limit, windowMs);
  }

  const now = Date.now();
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  const luaScript = `
    local current = redis.call('GET', KEYS[1])
    if current == false then
      redis.call('SET', KEYS[1], 1, 'EX', ARGV[1])
      return {1, tonumber(ARGV[2]) - 1, tonumber(ARGV[3])}
    end
    if tonumber(current) >= tonumber(ARGV[2]) then
      local ttl = redis.call('TTL', KEYS[1])
      return {0, 0, ttl * 1000}
    end
    local incr = redis.call('INCR', KEYS[1])
    local ttl = redis.call('TTL', KEYS[1])
    return {1, tonumber(ARGV[2]) - incr, ttl * 1000}
  `;

  try {
    const result = await client.eval(luaScript, {
      keys: [redisKey],
      arguments: [windowSec.toString(), limit.toString(), now.toString()],
    }) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: Math.max(0, result[1]),
      resetMs: now + result[2],
    };
  } catch (err) {
    console.error("[RateLimit] Redis error, falling back to in-memory:", err);
    return memoryRateLimit(key, limit, windowMs);
  }
}

export const RATE_LIMITS = {
  authRequestCode: { limit: 3, windowMs: 60_000 }, // 3 per minute per phone
  authVerifyCode: { limit: 5, windowMs: 60_000 }, // 5 per minute per phone
  authTelegram: { limit: 10, windowMs: 60_000 }, // 10 per minute per IP
  ordersCreate: { limit: 10, windowMs: 60_000 }, // 10 per minute per user
  adminLogin: { limit: 5, windowMs: 15 * 60_000 }, // 5 attempts -> 15 min block
} as const;