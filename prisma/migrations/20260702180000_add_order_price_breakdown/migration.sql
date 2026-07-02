-- Records the order's price breakdown (subtotal, delivery fee, discount) alongside
-- the total that was already stored. This is the faithful record of what was charged
-- and the basis for pro-rating a partial (out-of-stock) refund: an out-of-stock line
-- is refunded net of its share of the discount, and the delivery fee is never refunded.
-- All default to 0 so orders placed before the breakdown was recorded stay valid;
-- `total = subtotal + shipping - discount`.

-- AlterTable
ALTER TABLE "orders"
    ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN     "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
