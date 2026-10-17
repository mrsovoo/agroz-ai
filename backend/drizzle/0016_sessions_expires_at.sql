-- 1. Add expires_at column as nullable first to identify legacy endless sessions
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "expires_at" timestamp;

-- 2. Revoke all legacy tokens without expiration and any hardcoded demo tokens
DELETE FROM "sessions"
WHERE "expires_at" IS NULL
   OR "id" IN ('biz_demo_pharmacy', 'biz_demo_specialist');

-- 3. Enforce 30-day default and NOT NULL constraint on sessions.expires_at
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET DEFAULT (now() + interval '30 days');
ALTER TABLE "sessions" ALTER COLUMN "expires_at" SET NOT NULL;

-- 4. Index for fast expiration lookup and cleanup
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" ("expires_at");

