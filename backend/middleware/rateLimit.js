/**
 * Oddiy in-memory rate limiter (bitta instansiya uchun yetarli).
 * Ko'p instansiyali deploy'da Redis asosidagi limiterga almashtiring.
 */
function rateLimit({ windowMs = 60_000, max = 60, keyPrefix = 'rl' } = {}) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, rec] of hits) if (rec.reset <= now) hits.delete(k);
  }, windowMs);
  timer.unref();

  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    let rec = hits.get(key);
    if (!rec || rec.reset <= now) {
      rec = { count: 0, reset: now + windowMs };
      hits.set(key, rec);
    }
    rec.count += 1;
    if (rec.count > max) {
      res.set('Retry-After', String(Math.ceil((rec.reset - now) / 1000)));
      return res.status(429).json({ error: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.", code: 'RATE_LIMITED' });
    }
    next();
  };
}

module.exports = { rateLimit };

