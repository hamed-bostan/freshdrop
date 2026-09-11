-- Append-only ledger of every change to a product's on-hand quantity: how many
-- units moved, what it left behind, why, and who to attribute it to. Never
-- updated or deleted.
--
-- Rows are written in the same transaction as the `products.stock_quantity`
-- change they explain, so the ledger and the level it describes cannot drift.
-- `quantity_after` is stored rather than derived so the history reads without
-- replaying every entry from the beginning.
--
-- Attribution is exactly one of `actor_id` (an operator's adjustment, with the
-- name snapshotted the way `role_changes` and order lines snapshot theirs) or
-- `order_id` (a sale, cancellation, return or substitution). Both are plain
-- references, not foreign keys — the same loose coupling used throughout the
-- schema, so removing an account or an order never takes its history with it.
--
-- There is no backfill: stock that moved before this table existed has no
-- recorded reason, and inventing entries for it would put guesses into a ledger
-- whose whole value is that its entries are true. Histories start here.

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    -- Signed: positive went onto the shelf, negative came off.
    "delta" INTEGER NOT NULL,
    "quantity_after" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "order_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- A zero-unit movement is not a movement; it would pad the history with entries
-- that explain nothing. Enforced here because the Prisma schema DSL can't say it.
ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_delta_non_zero" CHECK ("delta" <> 0);

-- The level a movement left behind can never be negative, mirroring the
-- products_stock_quantity_non_negative constraint on the column it tracks.
ALTER TABLE "stock_movements"
    ADD CONSTRAINT "stock_movements_quantity_after_non_negative" CHECK ("quantity_after" >= 0);

-- CreateIndex
-- The history panel reads one product's entries newest-first.
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements"("product_id", "created_at");
