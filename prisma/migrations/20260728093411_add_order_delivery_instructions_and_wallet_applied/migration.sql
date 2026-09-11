-- Checkout redesign phase 1: a free-text courier note per order, and how much
-- of the total was paid from the customer's wallet balance. Both nullable/
-- defaulted so every existing order row stays valid.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "delivery_instructions" TEXT;
ALTER TABLE "orders" ADD COLUMN "wallet_applied" DOUBLE PRECISION NOT NULL DEFAULT 0;
