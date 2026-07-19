-- Make the activity log's diff queryable by field.
--
-- An entry stays one row per operation — a product save that moved the price, the
-- name and the stock is one `product.updated`, not three events. That's the shape
-- an audit trail should have (it records what someone *did*), but it left "show me
-- every price change" as a question the log couldn't answer without reading every
-- row's JSON and filtering in the application.
--
-- `changed_fields` is the field names lifted out of `changes`, with a GIN index so
-- that question is an index scan. It's denormalized, and deliberately: the store
-- derives it on write from the same array it serializes into `changes`, so there
-- is no path that sets one without the other.

-- AlterTable
ALTER TABLE "activity_log" ADD COLUMN "changed_fields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill from the diffs already stored, so existing entries (including the role
-- changes carried over from `role_changes`) are filterable too. Without this the
-- field filter would quietly behave as though history began at this migration.
UPDATE "activity_log"
SET "changed_fields" = COALESCE(
    (
        SELECT array_agg(DISTINCT change->>'field')
        FROM jsonb_array_elements("changes") AS change
        WHERE change->>'field' IS NOT NULL
    ),
    ARRAY[]::TEXT[]
);

-- CreateIndex
-- GIN, not B-tree: the query is array containment ("does this row's list of
-- changed fields include `price`"), which is what GIN indexes and B-tree can't.
CREATE INDEX "activity_log_changed_fields_idx" ON "activity_log" USING GIN ("changed_fields");
