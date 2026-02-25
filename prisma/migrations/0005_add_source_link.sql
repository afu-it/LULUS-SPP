-- 0005: Add sourceLink to Post, Tip, Soalan
ALTER TABLE "Post" ADD COLUMN "sourceLink" TEXT;
ALTER TABLE "Tip" ADD COLUMN "sourceLink" TEXT;
ALTER TABLE "Soalan" ADD COLUMN "sourceLink" TEXT;
