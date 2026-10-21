const crypto = require('crypto');
const config = require('../config');

// ---------------------------------------------------------------------------
// Parollar — scrypt (Node built-in), format: scrypt$N$r$p$saltB64$hashB64
// ---------------------------------------------------------------------------
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const [algo, N, r, p, saltB64, hashB64] = stored.split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// ---------------------------------------------------------------------------
// Access token — stateless, HMAC-SHA256 imzolangan: base64url(payload).base64url(sig)
// payload: { uid, mid?, via, iat, exp }
// ---------------------------------------------------------------------------
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(data) {
  return crypto.createHmac('sha256', config.authSecret).update(data).digest('base64url');
}

function issueToken({ userId, merchantId = null, via }) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { uid: userId, mid: merchantId, via, iat: now, exp: now + config.tokenTtlSeconds };
  const body = b64url(JSON.stringify(payload));
  return { token: `${body}.${sign(body)}`, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

function issueAdminToken({ userId = 0, username = 'admin', role = 'super_admin' } = {}) {
  const now = Math.floor(Date.now() / 1000);
  const ttl = config.tokenTtlSeconds || 60 * 60 * 24 * 7;
  const payload = { uid: userId, username, role, via: 'super_adm_auth', iat: now, exp: now + ttl };
  const body = b64url(JSON.stringify(payload));
  return {
    token: `${body}.${sign(body)}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    user: {
      id: userId,
      username,
      role
    }
  };
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = sign(body);
  const a = Buffer.from(sig || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Telegram Mini App initData tekshiruvi
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//   secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
//   hash       = hex(HMAC_SHA256(key=secret_key, msg=data_check_string))
// ---------------------------------------------------------------------------
function verifyTelegramInitData(
  initData,
  candidateTokens = null,
  maxAgeSeconds = config.initDataMaxAgeSeconds || 86400
) {
  const tokens = Array.isArray(candidateTokens)
    ? candidateTokens.filter(Boolean)
    : (candidateTokens ? [candidateTokens] : config.botTokens);

  if (!tokens.length) return { ok: false, reason: 'BOT_TOKEN_NOT_CONFIGURED' };
  if (!initData || typeof initData !== 'string') return { ok: false, reason: 'EMPTY' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return { ok: false, reason: 'NO_HASH' };
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const b = Buffer.from(hash.toLowerCase(), 'hex');
  let matchedBot = null;

  for (const token of tokens) {
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    const a = Buffer.from(computed, 'hex');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      matchedBot = token === config.biznesgoBotToken ? 'biznesgo_bot' : (token === config.agrozAuthBotToken ? 'agroz_auth_bot' : 'telegram_bot');
      break;
    }
  }

  if (!matchedBot) return { ok: false, reason: 'BAD_HASH' };

  const authDate = Number(params.get('auth_date'));
  if (!authDate) return { ok: false, reason: 'NO_AUTH_DATE' };
  if (maxAgeSeconds > 0 && Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) {
    return { ok: false, reason: 'EXPIRED' };
  }

  let user = null;
  try {
    user = params.get('user') ? JSON.parse(params.get('user')) : null;
  } catch {
    return { ok: false, reason: 'BAD_USER_JSON' };
  }
  if (!user || !user.id) return { ok: false, reason: 'NO_USER' };

  return { ok: true, user, authDate, bot: matchedBot };
}

module.exports = { hashPassword, verifyPassword, issueToken, issueAdminToken, verifyToken, verifyTelegramInitData };

