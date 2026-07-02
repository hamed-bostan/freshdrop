-- Back-in-stock alerts: one subscription per (user, product). A shopper waiting on
-- an out-of-stock product subscribes; when an admin restocks it (stock 0 → >0) the
-- waiters are notified and their rows cleared. `user_id`/`product_id` are plain
-- references (not foreign keys) — the same loose coupling the rest of the schema uses.

-- CreateTable
CREATE TABLE "stock_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_alerts_user_id_product_id_key" ON "stock_alerts"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "stock_alerts_product_id_idx" ON "stock_alerts"("product_id");
