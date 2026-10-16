import test from 'node:test';
import assert from 'node:assert';
import { isSeedDemoDataAllowed, isAllowUnverifiedTelegramAllowed } from '../dist/lib/security-flags.js';

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

test('security flags evaluate process.env safely and reject unverified bypass in production', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalSeed = process.env.SEED_DEMO_DATA;
  const originalAllow = process.env.ALLOW_UNVERIFIED_TELEGRAM;

  try {
    process.env.NODE_ENV = 'production';
    process.env.SEED_DEMO_DATA = 'true';
    process.env.ALLOW_UNVERIFIED_TELEGRAM = 'true';

    assert.strictEqual(isSeedDemoDataAllowed(), false);
    assert.strictEqual(isAllowUnverifiedTelegramAllowed(), false);

    process.env.NODE_ENV = 'development';
    assert.strictEqual(isSeedDemoDataAllowed(), true);
    assert.strictEqual(isAllowUnverifiedTelegramAllowed(), true);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.SEED_DEMO_DATA = originalSeed;
    process.env.ALLOW_UNVERIFIED_TELEGRAM = originalAllow;
  }
});

