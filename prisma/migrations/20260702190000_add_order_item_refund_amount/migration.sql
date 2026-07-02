-- Records the exact amount credited to the customer's wallet when a picker resolves
-- an out-of-stock line: the line refund when refunded, or the price saving on a
-- cheaper swap when substituted (may be 0). Null until the line is resolved, mirroring
-- the other `substitution_*` columns. The order `total` stays the original charge —
-- this column makes each wallet credit visible as an itemized receipt adjustment.

-- AlterTable
ALTER TABLE "order_items"
    ADD COLUMN     "substitution_refund_amount" DOUBLE PRECISION;
