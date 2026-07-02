-- Add on-hand stock to products, then backfill the seeded catalog with a
-- deterministic mix so every read-side state is represented (out of stock,
-- "only N left", and healthy stock).

-- AlterTable. Default 0 = out of stock, so any row without an explicit value is
-- safe (can never oversell). Dashboard-created products (UUID ids) keep this
-- default until an admin sets a value.
ALTER TABLE "products" ADD COLUMN "stock_quantity" INTEGER NOT NULL DEFAULT 0;

-- Backfill seeded rows only (ids shaped "<categoryId>-<n>"). `serial` is the same
-- global 0-based ordinal the mock catalog assigns (category asc, then per-category
-- index asc), so mock and Postgres produce identical seed stock. The formula
-- mirrors MockProductRepository.stockFor:
--   serial % 10 == 0 -> 0  (out of stock)
--   serial % 10 == 1 -> 2  ("only 2 left")
--   serial % 10 == 2 -> 4  (low stock)
--   otherwise        -> 25 + (serial % 40)  (healthy)
WITH seeded AS (
  SELECT
    "id",
    (row_number() OVER (
      ORDER BY split_part("id", '-', 1)::int, split_part("id", '-', 2)::int
    ) - 1) AS serial
  FROM "products"
  WHERE "id" ~ '^[0-9]+-[0-9]+$'
)
UPDATE "products" AS p SET "stock_quantity" = CASE (s.serial % 10)
  WHEN 0 THEN 0
  WHEN 1 THEN 2
  WHEN 2 THEN 4
  ELSE 25 + (s.serial % 40)
END
FROM seeded s
WHERE p."id" = s."id";

-- Last line of defence. The app claims stock transactionally (a guarded
-- `UPDATE … WHERE stock_quantity >= n`), but a DB CHECK makes negative stock
-- unrepresentable regardless of what writes the row — a bad migration, a manual
-- SQL fix, a future code path. Prisma's schema DSL can't express a CHECK, so it
-- lives here; Prisma leaves constraints it doesn't model untouched.
ALTER TABLE "products"
  ADD CONSTRAINT "products_stock_quantity_non_negative" CHECK ("stock_quantity" >= 0);
