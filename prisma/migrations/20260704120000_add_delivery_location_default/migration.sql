-- The address a user has selected for checkout. At most one per user may be the
-- default; the app maintains that invariant, and the partial unique index below
-- guarantees it at the database level (a plain unique index can't express "unique
-- among the rows where is_default", so it's raw SQL rather than a Prisma @@unique).

-- AlterTable
ALTER TABLE "delivery_locations" ADD COLUMN "is_default" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: at most one default address per user.
CREATE UNIQUE INDEX "delivery_locations_user_id_default_key"
  ON "delivery_locations" ("user_id")
  WHERE "is_default";

-- Backfill: give every existing user a selected address (their oldest) so checkout
-- has a default the moment this ships, matching the "first address becomes default"
-- rule new users get.
UPDATE "delivery_locations" AS d
SET "is_default" = true
FROM (
  SELECT DISTINCT ON ("user_id") "id"
  FROM "delivery_locations"
  ORDER BY "user_id", "created_at" ASC, "id" ASC
) AS oldest
WHERE d."id" = oldest."id";
