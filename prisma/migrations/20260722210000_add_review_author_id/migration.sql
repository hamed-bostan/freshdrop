-- Link each review to the user who wrote it.
--
-- Reviews have only ever carried a snapshot of the author (`author_name`,
-- `author_avatar_url`), which is the right thing to *display* — it keeps a review
-- reading correctly after the profile behind it changes. But it is the wrong thing
-- to *query*: the customer detail page has to ask "what has this customer
-- reviewed?", and a display name is neither unique nor stable. So the identity
-- moves onto its own column and the snapshot stays exactly as it was.
--
-- Nullable, and no foreign key — the same loose coupling `product_id` uses.

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN "author_id" TEXT;

-- Backfill the reviews that predate the column, but only where the answer is
-- unambiguous: a name shared by two accounts (or matching none) is left NULL
-- rather than guessed at. Attributing a stranger's review to a customer on their
-- own detail page is a worse outcome than showing fewer reviews.
UPDATE "reviews" AS r
SET "author_id" = u."id"
FROM "users" AS u
WHERE u."name" = r."author_name"
  AND (SELECT COUNT(*) FROM "users" AS peer WHERE peer."name" = r."author_name") = 1;

-- The one query this column exists for: a single customer's reviews, newest first.
-- CreateIndex
CREATE INDEX "reviews_author_id_idx" ON "reviews"("author_id");
