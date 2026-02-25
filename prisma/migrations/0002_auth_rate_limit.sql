-- Auth rate-limit table for /api/auth login hardening
CREATE TABLE IF NOT EXISTS "AuthRateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "failCount" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" INTEGER NOT NULL,
  "blockedUntil" INTEGER,
  "updatedAt" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "AuthRateLimit_updatedAt_idx" ON "AuthRateLimit"("updatedAt");
