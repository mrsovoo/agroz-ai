import test from 'node:test';
import assert from 'node:assert';
import {
  isSeedDemoDataAllowed,
  isAllowUnverifiedTelegramAllowed,
  isPartnerDemoAllowed,
  createSessionExpiryDate,
  SESSION_TTL_DAYS,
} from '../dist/lib/security-flags.js';

test('SEED_DEMO_DATA is strictly forced to false when NODE_ENV=production', () => {
  // Test with explicit env object
  assert.strictEqual(
    isSeedDemoDataAllowed({ NODE_ENV: 'production', SEED_DEMO_DATA: 'true' }),
    false,
    'SEED_DEMO_DATA must be false in production even if set to "true"'
  );

  assert.strictEqual(
    isSeedDemoDataAllowed({ NODE_ENV: 'production', SEED_DEMO_DATA: 'false' }),
    false
  );

  assert.strictEqual(
    isSeedDemoDataAllowed({ NODE_ENV: 'production' }),
    false
  );

  // Test allowed in development only when explicitly true
  assert.strictEqual(
    isSeedDemoDataAllowed({ NODE_ENV: 'development', SEED_DEMO_DATA: 'true' }),
    true
  );

  assert.strictEqual(
    isSeedDemoDataAllowed({ NODE_ENV: 'development', SEED_DEMO_DATA: 'false' }),
    false
  );

  assert.strictEqual(
    isSeedDemoDataAllowed({ NODE_ENV: 'development' }),
    false
  );
});

test('ALLOW_UNVERIFIED_TELEGRAM is strictly forced to false when NODE_ENV=production', () => {
  // Test with explicit env object
  assert.strictEqual(
    isAllowUnverifiedTelegramAllowed({ NODE_ENV: 'production', ALLOW_UNVERIFIED_TELEGRAM: 'true' }),
    false,
    'ALLOW_UNVERIFIED_TELEGRAM must be false in production even if set to "true"'
  );

  assert.strictEqual(
    isAllowUnverifiedTelegramAllowed({ NODE_ENV: 'production', ALLOW_UNVERIFIED_TELEGRAM: 'false' }),
    false
  );

  assert.strictEqual(
    isAllowUnverifiedTelegramAllowed({ NODE_ENV: 'production' }),
    false
  );

  // Test allowed in development only when explicitly true
  assert.strictEqual(
    isAllowUnverifiedTelegramAllowed({ NODE_ENV: 'development', ALLOW_UNVERIFIED_TELEGRAM: 'true' }),
    true
  );

  assert.strictEqual(
    isAllowUnverifiedTelegramAllowed({ NODE_ENV: 'development', ALLOW_UNVERIFIED_TELEGRAM: 'false' }),
    false
  );

  assert.strictEqual(
    isAllowUnverifiedTelegramAllowed({ NODE_ENV: 'development' }),
    false
  );
});

test('ALLOW_PARTNER_DEMO is strictly forced to false outside development with explicit flag', () => {
  assert.strictEqual(
    isPartnerDemoAllowed({ NODE_ENV: 'production', ALLOW_PARTNER_DEMO: 'true' }),
    false,
    'ALLOW_PARTNER_DEMO must be false in production'
  );
  assert.strictEqual(
    isPartnerDemoAllowed({ NODE_ENV: 'development', ALLOW_PARTNER_DEMO: 'false' }),
    false
  );
  assert.strictEqual(
    isPartnerDemoAllowed({ NODE_ENV: 'development' }),
    false
  );
  assert.strictEqual(
    isPartnerDemoAllowed({ NODE_ENV: 'development', ALLOW_PARTNER_DEMO: 'true' }),
    true
  );
  assert.strictEqual(
    isPartnerDemoAllowed({ ALLOW_PARTNER_DEMO: 'true' }),
    true,
    'Allows demo in default dev mode when flag is true'
  );
});

test('createSessionExpiryDate sets 30-day session expiration', () => {
  assert.strictEqual(SESSION_TTL_DAYS, 30);
  const now = new Date('2026-01-01T00:00:00.000Z');
  const expiry = createSessionExpiryDate(now);
  assert.strictEqual(expiry.toISOString(), '2026-01-31T00:00:00.000Z');
});

test('security flags evaluate process.env safely and reject unverified bypass in production', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSeed = process.env.SEED_DEMO_DATA;
  const originalAllow = process.env.ALLOW_UNVERIFIED_TELEGRAM;
  const originalDemo = process.env.ALLOW_PARTNER_DEMO;

  try {
    process.env.NODE_ENV = 'production';
    process.env.SEED_DEMO_DATA = 'true';
    process.env.ALLOW_UNVERIFIED_TELEGRAM = 'true';
    process.env.ALLOW_PARTNER_DEMO = 'true';

    assert.strictEqual(isSeedDemoDataAllowed(), false);
    assert.strictEqual(isAllowUnverifiedTelegramAllowed(), false);
    assert.strictEqual(isPartnerDemoAllowed(), false);

    process.env.NODE_ENV = 'development';
    assert.strictEqual(isSeedDemoDataAllowed(), true);
    assert.strictEqual(isAllowUnverifiedTelegramAllowed(), true);
    assert.strictEqual(isPartnerDemoAllowed(), true);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.SEED_DEMO_DATA = originalSeed;
    process.env.ALLOW_UNVERIFIED_TELEGRAM = originalAllow;
    process.env.ALLOW_PARTNER_DEMO = originalDemo;
  }
});


