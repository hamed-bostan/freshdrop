-- VAT snapshot on orders and order items (phase 3). Additive only, no backfill:
-- existing rows read NULL for tax_amount/tax_rate, meaning tax wasn't in effect
-- when they were placed — a legacy order is never treated as taxed-at-zero. See
-- TaxSettings (phase 1) and Product.taxExempt (phase 2).

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "tax_amount" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN "tax_rate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN "tax_exempt" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "order_items" ADD COLUMN "tax_amount" DOUBLE PRECISION;
