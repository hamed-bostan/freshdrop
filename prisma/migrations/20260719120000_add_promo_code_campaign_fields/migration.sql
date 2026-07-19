-- Campaign controls for promo codes, so an operator can run a discount campaign
-- from the dashboard instead of editing rows by hand.
--
-- `active` is the on/off switch: codes are deactivated rather than deleted, so a
-- code a past order was placed with never disappears out from under it. It
-- defaults to true, which is what every existing row already behaved as.
--
-- `starts_at` / `ends_at` bound the campaign; NULL on either side means
-- open-ended in that direction, which is how the existing rows backfill — they
-- were always-on and stay always-on.
--
-- `usage_count` is a redemption counter, incremented when an order is placed with
-- the code. It starts at 0 for existing rows and cannot be backfilled: orders
-- placed before this migration never recorded which promo they used.

-- AlterTable
ALTER TABLE "promo_codes"
    ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "starts_at" TIMESTAMP(3),
    ADD COLUMN "ends_at" TIMESTAMP(3),
    ADD COLUMN "usage_count" INTEGER NOT NULL DEFAULT 0;
