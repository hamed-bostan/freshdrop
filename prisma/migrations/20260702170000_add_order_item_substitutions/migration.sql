-- Grocery substitutions on order lines. `substitution_preference` is the customer's
-- out-of-stock pre-approval captured at checkout ("substitute" | "refund"), defaulting
-- to "substitute" (the grocery norm) so existing rows stay valid. The `substitution_*`
-- columns record a picker's resolution and are null until a line is resolved. `price`
-- snapshots the unit price charged, the basis for a substitution refund. All plain
-- strings/floats matching the domain unions — the schema's enum-free style.

-- AlterTable
ALTER TABLE "order_items"
    ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN     "substitution_preference" TEXT NOT NULL DEFAULT 'substitute',
    ADD COLUMN     "substitution_status" TEXT,
    ADD COLUMN     "replacement_product_id" TEXT,
    ADD COLUMN     "replacement_name" TEXT,
    ADD COLUMN     "replacement_image_url" TEXT;
