-- Serve the store-wide inventory ledger's default newest-first read. PostgreSQL
-- can scan this btree backward for descending order.
CREATE INDEX "stock_movements_created_at_idx"
    ON "stock_movements"("created_at");

-- Serve reason-filtered ledger reads while preserving chronological order.
CREATE INDEX "stock_movements_reason_created_at_idx"
    ON "stock_movements"("reason", "created_at");
