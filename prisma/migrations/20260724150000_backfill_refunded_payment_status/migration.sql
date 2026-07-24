-- Backfill the invariant the cancel/return use-cases now maintain going forward:
-- an order whose lifecycle ended in a wallet refund has its payment recorded as
-- refunded too, rather than the `paid` every row was given when the column was
-- added.
--
-- `cancelled` and `refunded` are exactly the two terminal states that credit the
-- customer's wallet (a pre-dispatch cancel, and an approved return). Every other
-- status leaves payment as it was. Without this, the "Payment: Refunded" filter
-- would match only orders created after the fix and silently miss all history.
UPDATE "orders"
SET "payment_status" = 'refunded'
WHERE "status" IN ('cancelled', 'refunded')
  AND "payment_status" = 'paid';
