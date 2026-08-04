-- CreateTable
CREATE TABLE "order_status_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "from_stage" TEXT,
    "to_stage" TEXT,
    "actor_id" TEXT,
    "actor_name" TEXT,
    "reason" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_status_events_order_id_occurred_at_idx" ON "order_status_events"("order_id", "occurred_at");

-- CreateIndex
CREATE INDEX "order_status_events_to_status_occurred_at_idx" ON "order_status_events"("to_status", "occurred_at");

-- Backfill: one event per existing order, synthesized from its current status
-- and the timestamp closest to when it likely reached it — `updated_at` for an
-- order that has moved past `processing`, `placed_at` for one that hasn't.
-- `from_status` is left NULL (no real prior state is known) and `reason` is the
-- `'backfill'` sentinel, so this row is distinguishable from one a real
-- transition recorded from this point on. Idempotent via the `NOT EXISTS`
-- guard, same convention as the refund-ledger backfill.
INSERT INTO "order_status_events" ("id", "order_id", "from_status", "to_status", "from_stage", "to_stage", "reason", "occurred_at")
SELECT
  gen_random_uuid(),
  o."id",
  NULL,
  o."status",
  NULL,
  o."stage",
  'backfill',
  CASE WHEN o."status" = 'processing' THEN o."placed_at" ELSE o."updated_at" END
FROM "orders" o
WHERE NOT EXISTS (SELECT 1 FROM "order_status_events" e WHERE e."order_id" = o."id");
