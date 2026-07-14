-- The delivery coordinate snapshotted from the selected address at checkout, so
-- order tracking can map an order to where it is actually going (the tracker
-- previously drew every order at one hardcoded point).
--
-- Nullable and backfill-free: orders placed before this column existed keep NULL,
-- as do orders for addresses saved without a picked coordinate. Tracking falls
-- back to a default destination for those.
ALTER TABLE "orders" ADD COLUMN "destination_lat" DOUBLE PRECISION;
ALTER TABLE "orders" ADD COLUMN "destination_lng" DOUBLE PRECISION;
