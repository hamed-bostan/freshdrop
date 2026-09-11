-- Return/RMA model (phase 3). Additive. `RequestOrderReturn`/`ResolveOrderReturn`
-- start writing/reading it immediately (no separate wiring-up migration, unlike
-- the refund ledger) — a return request opened before this ships simply predates
-- the model, which `ResolveOrderReturn.approve`'s fallback branch still handles.

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "rma_number" SERIAL NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMP(3),
    "inspected_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "actor_id" TEXT,
    "actor_name" TEXT,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "return_request_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" TEXT,
    "recovery_decision" TEXT,
    "refund_amount" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "return_requests_rma_number_key" ON "return_requests"("rma_number");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_status_requested_at_idx" ON "return_requests"("status", "requested_at");

-- CreateIndex
CREATE INDEX "return_requests_requested_at_idx" ON "return_requests"("requested_at");

-- CreateIndex
CREATE INDEX "return_items_return_request_id_idx" ON "return_items"("return_request_id");

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one `ReturnRequest` per existing `refunds` row of kind = 'return',
-- already resolved and carrying no items — the old flow refunded `order.total`
-- with `lines: []`, so there is no per-item breakdown to reconstruct here.
-- Condition/recovery decision stay NULL throughout (never recorded), which
-- reporting (phase 4) renders as "not recorded" rather than inventing a value.
-- Idempotent via the `NOT EXISTS` guard, same convention as the refund-ledger
-- and order-status-event backfills.
INSERT INTO "return_requests" ("id", "order_id", "user_id", "status", "reason", "requested_at", "resolved_at", "actor_id", "actor_name")
SELECT
  gen_random_uuid(),
  r."order_id",
  r."user_id",
  'resolved',
  r."reason",
  r."created_at",
  r."created_at",
  r."actor_id",
  r."actor_name"
FROM "refunds" r
WHERE r."kind" = 'return'
  AND NOT EXISTS (SELECT 1 FROM "return_requests" rr WHERE rr."order_id" = r."order_id");
