-- Internal notes on an order.
--
-- The thing an order has always been missing: somewhere for the people working it
-- to write down what happened that the status field can't say. "Customer called,
-- leave it with the neighbour." "Second attempt failed, nobody in." Until now that
-- context lived in whoever happened to take the call.
--
-- Staff-facing only — nothing here is ever shown to the customer, which is exactly
-- what separates a note from the messages `NotifyOrderCustomer` sends. It's also
-- the one thing the new `support` role can write.
--
-- Append-only, like `activity_log` and `stock_movements`: these get read by someone
-- reconstructing events after the fact, and a note that can be quietly edited
-- afterwards is no use for that. No UPDATE and no DELETE path exists in the
-- repository either.

-- CreateTable
CREATE TABLE "order_notes" (
    "id" TEXT NOT NULL,
    -- Plain references, not foreign keys — the same loose coupling as the rest of
    -- the schema, so a removed account never takes an order's history with it.
    "order_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    -- Snapshotted beside the id so the note still reads correctly once the author
    -- is renamed or gone, exactly as `activity_log.actor_name` does.
    "author_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_notes_pkey" PRIMARY KEY ("id")
);

-- The only query this table serves: one order's notes, newest first. Composite so
-- the ordering comes out of the index rather than a sort.
-- CreateIndex
CREATE INDEX "order_notes_order_id_created_at_idx" ON "order_notes"("order_id", "created_at");
