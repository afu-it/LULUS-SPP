-- 0006: Add Banner table for sticky dismissible notifications
CREATE TABLE IF NOT EXISTS "Banner" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "isActive" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);
