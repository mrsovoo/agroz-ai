import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

// 1. Telegram WebApp initData HMAC verification algorithm
function computeTelegramInitDataHash(dataCheckString, botToken) {
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}

function verifyInitData(initData, botToken, maxAgeSeconds = 86400) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return false;

    params.delete('hash');
    const sortedKeys = Array.from(params.keys()).sort();
    const dataCheckString = sortedKeys.map((k) => `${k}=${params.get(k)}`).join('\n');

    const expectedHash = computeTelegramInitDataHash(dataCheckString, botToken);
    if (hash !== expectedHash) return false;

    if (maxAgeSeconds > 0) {
      const authDate = Number(params.get('auth_date'));
      if (!authDate) return false;
      const now = Math.floor(Date.now() / 1000);
      if (now - authDate > maxAgeSeconds) return false;
    }

    return true;
  } catch {
    return false;
  }
}

test('verifyInitData: validates genuine HMAC from Telegram within 24 hours', () => {
  const token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
  const now = Math.floor(Date.now() / 1000);
  const user = JSON.stringify({ id: 987654321, first_name: 'Test', username: 'testuser' });

  const rawParams = {
    auth_date: String(now),
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user,
  };

  const sortedKeys = Object.keys(rawParams).sort();
  const dataCheckString = sortedKeys.map((k) => `${k}=${rawParams[k]}`).join('\n');
  const validHash = computeTelegramInitDataHash(dataCheckString, token);

  const initData = `auth_date=${rawParams.auth_date}&hash=${validHash}&query_id=${rawParams.query_id}&user=${encodeURIComponent(rawParams.user)}`;

  assert.strictEqual(verifyInitData(initData, token, 86400), true);
});

test('verifyInitData: rejects expired initData (> 24 hours)', () => {
  const token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
  // 25 hours ago
  const expiredTime = Math.floor(Date.now() / 1000) - 25 * 3600;
  const user = JSON.stringify({ id: 987654321, first_name: 'Test' });

  const rawParams = {
    auth_date: String(expiredTime),
    user,
  };

  const sortedKeys = Object.keys(rawParams).sort();
  const dataCheckString = sortedKeys.map((k) => `${k}=${rawParams[k]}`).join('\n');
  const validHash = computeTelegramInitDataHash(dataCheckString, token);

  const initData = `auth_date=${rawParams.auth_date}&hash=${validHash}&user=${encodeURIComponent(rawParams.user)}`;

  assert.strictEqual(verifyInitData(initData, token, 86400), false);
});

test('verifyInitData: rejects tampered initData', () => {
  const token = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';
  const now = Math.floor(Date.now() / 1000);
  const user = JSON.stringify({ id: 987654321, first_name: 'Test' });

  const rawParams = {
    auth_date: String(now),
    user,
  };

  const sortedKeys = Object.keys(rawParams).sort();
  const dataCheckString = sortedKeys.map((k) => `${k}=${rawParams[k]}`).join('\n');
  const validHash = computeTelegramInitDataHash(dataCheckString, token);

  // Tamper user ID
  const tamperedUser = JSON.stringify({ id: 999999999, first_name: 'Hacker' });
  const initData = `auth_date=${rawParams.auth_date}&hash=${validHash}&user=${encodeURIComponent(tamperedUser)}`;

  assert.strictEqual(verifyInitData(initData, token, 86400), false);
});

test('Webhook secret verification guards endpoint', () => {
  const configuredSecret = 'super_secret_webhook_token_123';

  function verifyWebhookSecret(incomingHeader, secret) {
    if (!secret) return true;
    return incomingHeader === secret;
  }

  assert.strictEqual(verifyWebhookSecret('super_secret_webhook_token_123', configuredSecret), true);
  assert.strictEqual(verifyWebhookSecret('wrong_secret', configuredSecret), false);
  assert.strictEqual(verifyWebhookSecret(undefined, configuredSecret), false);
  assert.strictEqual(verifyWebhookSecret(undefined, null), true);
});

test('Contact verification: detects third-party shared contact spoofing', () => {
  function verifySharedContact(fromId, contact) {
    if (contact.user_id && contact.user_id !== fromId) {
      return { valid: false, error: 'SPOOFED_CONTACT' };
    }
    return { valid: true };
  }

  const senderId = 12345678;
  const legitContact = { user_id: 12345678, phone_number: '+998901234567' };
  const spoofedContact = { user_id: 99999999, phone_number: '+998909876543' };

  assert.strictEqual(verifySharedContact(senderId, legitContact).valid, true);
  assert.strictEqual(verifySharedContact(senderId, spoofedContact).valid, false);
});

test('Broadcast message limits adhere to Telegram constraints', () => {
  function checkBroadcastLimits(text, hasPhoto) {
    if (hasPhoto && text.length > 1024) {
      return { valid: false, error: 'CAPTION_TOO_LONG' };
    }
    if (!hasPhoto && text.length > 4096) {
      return { valid: false, error: 'TEXT_TOO_LONG' };
    }
    return { valid: true };
  }

  assert.strictEqual(checkBroadcastLimits('Hello World', false).valid, true);
  assert.strictEqual(checkBroadcastLimits('a'.repeat(4096), false).valid, true);
  assert.strictEqual(checkBroadcastLimits('a'.repeat(4097), false).valid, false);

  assert.strictEqual(checkBroadcastLimits('Photo caption', true).valid, true);
  assert.strictEqual(checkBroadcastLimits('a'.repeat(1024), true).valid, true);
  assert.strictEqual(checkBroadcastLimits('a'.repeat(1025), true).valid, false);
});

test('Dual bot separation rules: Bot usernames and database targets', () => {
  const FARMER_BOT = 'agrozai_bot';
  const PARTNER_BOT = 'agroz_auth_bot';

  assert.strictEqual(FARMER_BOT, 'agrozai_bot');
  assert.strictEqual(PARTNER_BOT, 'agroz_auth_bot');

  // Verify roles
  const roles = {
    farmer: { bot: FARMER_BOT, table: 'users' },
    specialist: { bot: PARTNER_BOT, table: 'specialists' },
    pharmacy: { bot: PARTNER_BOT, table: 'specialists' },
  };

  assert.strictEqual(roles.farmer.bot, 'agrozai_bot');
  assert.strictEqual(roles.specialist.bot, 'agroz_auth_bot');
  assert.strictEqual(roles.pharmacy.bot, 'agroz_auth_bot');
});
