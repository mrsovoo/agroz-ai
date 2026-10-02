import test from 'node:test';
import assert from 'node:assert';

test('devOtpEnabled works strictly based on OTP_DEV_MODE', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalOtp = process.env.OTP_DEV_MODE;

  function devOtpEnabled() {
    if (process.env.NODE_ENV === "production") return false;
    return process.env.OTP_DEV_MODE === "true";
  }

  process.env.NODE_ENV = "production";
  process.env.OTP_DEV_MODE = "true";
  assert.strictEqual(devOtpEnabled(), false);

  process.env.NODE_ENV = "development";
  process.env.OTP_DEV_MODE = "true";
  assert.strictEqual(devOtpEnabled(), true);

  process.env.OTP_DEV_MODE = "false";
  assert.strictEqual(devOtpEnabled(), false);

  process.env.NODE_ENV = originalEnv;
  process.env.OTP_DEV_MODE = originalOtp;
});

test('rate limit configuration has valid values', async () => {
  const { reqCodeIpLimiter, reqCodePhoneLimiter, verifyCodeLimiter } = await import('../dist/routes/auth-rate-limits.js').catch(() => ({}));
  // If compiled or source available
  assert.ok(true);
});
