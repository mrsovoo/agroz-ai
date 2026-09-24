import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export function getRedisClient() {
  if (!redisClient) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    redisClient = createClient({ url });
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
    // Fail-open: if Redis unavailable, allow request but log warning
    console.warn("[RateLimit] Redis unavailable, allowing request (fail-open)");
    return { allowed: true, remaining: limit, resetMs: Date.now() + windowMs };
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
    console.error("[RateLimit] Redis error:", err);
    // Fail-open
    return { allowed: true, remaining: limit, resetMs: now + windowMs };
  }
}

export const RATE_LIMITS = {
  authRequestCode: { limit: 3, windowMs: 60_000 }, // 3 per minute per phone
  authVerifyCode: { limit: 5, windowMs: 60_000 }, // 5 per minute per phone
  authTelegram: { limit: 10, windowMs: 60_000 }, // 10 per minute per IP
  ordersCreate: { limit: 10, windowMs: 60_000 }, // 10 per minute per user
  adminLogin: { limit: 5, windowMs: 300_000 }, // 5 per 5 min per IP
} as const;