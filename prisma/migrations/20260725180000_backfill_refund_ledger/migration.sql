-- Backfill Refund + RefundLine rows for money that moved before phase 5's dual
-- write existed. Without this, flipping the analytics/domain readers onto the
-- ledger (phase 6) would make every historically cancelled/refunded order read
-- as still-recognized revenue — the ledger would have no row saying it came back.
--
-- Idempotent by construction (`NOT EXISTS` guards), so it's safe to run more than
-- once, and it does nothing to any order phase 5 already covers: those already
-- carry a Refund row from the moment they were cancelled/returned/resolved.

-- 1. Whole-order credits: every `cancelled`/`refunded` order with no refund row
--    yet gets one for its full `total` (matches the `addFunds` amount `CancelOrder`
--    / `ResolveOrderReturn` credited). Zero tax split — pre-tax orders (`tax_amount`
--    IS NULL) have none to report, and the ones placed after tax existed didn't
--    have a ledger row to snapshot a split into at the time, so 0 rather than a
--    reconstructed figure.
INSERT INTO "refunds" ("id", "order_id", "user_id", "kind", "amount", "tax_amount", "created_at")
SELECT
  gen_random_uuid(),
  o."id",
  o."user_id",
  CASE WHEN o."status" = 'cancelled' THEN 'cancellation' ELSE 'return' END,
  o."total",
  0,
  o."placed_at"
FROM "orders" o
WHERE o."status" IN ('cancelled', 'refunded')
  AND NOT EXISTS (SELECT 1 FROM "refunds" r WHERE r."order_id" = o."id");

-- 2. Per-line substitution credits (picker out-of-stock refunds, and cheaper-swap
--    savings) not already covered by a Refund row — one Refund + one RefundLine
--    per order item, mirroring `ResolveItemSubstitution`'s dual write.
--
--    Staged through a temp table (dropped at the end of this migration's
--    transaction anyway) rather than a chained writable CTE: a refund and its
--    line need the *same* generated id pair, and materializing the join once is
--    the simplest way to guarantee that correlation without a real foreign key
--    to join back on.
CREATE TEMP TABLE "_refund_backfill_lines" AS
SELECT
  gen_random_uuid() AS refund_id,
  oi."id"           AS order_item_id,
  oi."order_id"     AS order_id,
  oi."product_id"   AS product_id,
  oi."quantity"     AS quantity,
  oi."substitution_refund_amount" AS amount,
  o."user_id"       AS user_id,
  o."placed_at"     AS placed_at
FROM "order_items" oi
JOIN "orders" o ON o."id" = oi."order_id"
WHERE oi."substitution_refund_amount" IS NOT NULL
  AND oi."substitution_refund_amount" > 0
  AND NOT EXISTS (SELECT 1 FROM "refund_lines" rl WHERE rl."order_item_id" = oi."id");

INSERT INTO "refunds" ("id", "order_id", "user_id", "kind", "amount", "tax_amount", "created_at")
SELECT refund_id, order_id, user_id, 'substitution', amount, 0, placed_at
FROM "_refund_backfill_lines";

INSERT INTO "refund_lines" ("id", "refund_id", "order_item_id", "product_id", "quantity", "amount", "tax_amount")
SELECT gen_random_uuid(), refund_id, order_item_id, product_id, quantity, amount, 0
FROM "_refund_backfill_lines";

DROP TABLE "_refund_backfill_lines";
