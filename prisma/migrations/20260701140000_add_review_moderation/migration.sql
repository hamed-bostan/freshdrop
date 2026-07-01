-- Moderation status for reviews. New reviews default to 'pending' and stay hidden
-- from the storefront until an admin approves them from the dashboard.
ALTER TABLE "reviews" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';

-- Existing reviews (the seeded demo set) were already live, so approve them in bulk
-- so they keep showing — only reviews submitted after this migration are moderated.
UPDATE "reviews" SET "status" = 'approved';

-- The admin moderation queue filters by status.
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
