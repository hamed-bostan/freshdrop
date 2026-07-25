-- Give categories a visibility state, mirroring products' `is_published`.
--
-- Until now every category was, by definition, live: the only way to take one
-- down was to delete it. `is_active` separates "temporarily hidden" from
-- "deleted" — the admin list will filter and bulk-toggle on this column.
--
-- DEFAULT true, and the backfill that follows from it: every existing category
-- stays exactly as visible as it was, and a category created without an
-- opinion is active.

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- The admin list will filter by this column.
-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");
