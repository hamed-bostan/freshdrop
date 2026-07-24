-- A short sequential order number for humans, alongside the existing UUID `id`.
--
-- The dashboard's order-facing screens (overview, list, detail, a customer's order
-- history) previously showed either the full 36-character UUID or a hex fragment
-- sliced off the end of it — neither reads as an order number a person would say
-- out loud or recognize week to week. `order_number` is that number; `id` remains
-- the real key everything else (stock movements, addresses, notes) references.
--
-- Backfilled in placement order (oldest first) rather than by whatever order the
-- rows happen to sit in on disk, so existing orders come out numbered the way an
-- admin would expect if they'd been assigned at checkout all along.

-- AlterTable: add the column nullable first — it can't be NOT NULL until every
-- existing row has been backfilled below.
ALTER TABLE "orders" ADD COLUMN "order_number" INTEGER;

-- Backfill: number every existing order by placement order. `id` is only a
-- tie-breaker for orders sharing the same instant, so the ordering is stable.
WITH numbered AS (
  SELECT "id", row_number() OVER (ORDER BY "placed_at", "id") AS "rn"
  FROM "orders"
)
UPDATE "orders"
SET "order_number" = "numbered"."rn"
FROM "numbered"
WHERE "orders"."id" = "numbered"."id";

-- CreateSequence: owned by the column, so dropping the column later drops the
-- sequence with it. Starts one past the highest backfilled number (0 on an empty
-- table) so the first order placed after this migration continues the sequence
-- rather than colliding with it.
CREATE SEQUENCE "orders_order_number_seq" OWNED BY "orders"."order_number";
SELECT setval('orders_order_number_seq', COALESCE((SELECT MAX("order_number") FROM "orders"), 0) + 1, false);
ALTER TABLE "orders" ALTER COLUMN "order_number" SET DEFAULT nextval('orders_order_number_seq');

-- AlterTable: safe now that every row has one.
ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
