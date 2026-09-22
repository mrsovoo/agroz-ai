type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

/**
 * Oddiy in-memory sliding window rate limiter.
 *
 * Eslatma: serverless muhitda har bir instance o'z xotirasiga ega, shuning uchun bu
 * qatlam "yumshoq" himoya — OpenAI krediti va OTP spamining oldini oladi. Ko'p
 * instance'li qat'iy limit kerak bo'lsa Upstash Redis (@upstash/ratelimit) ulang.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) sweep(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_KEYS) buckets.clear();
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { error: `Juda ko'p urinish. ${retryAfterSeconds} soniyadan keyin qayta urinib ko'ring.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
