-- CreateIndex
-- Report queries (refundTotals, refundSeries, refundReasons) range-scan
-- refunds.created_at with no order_id predicate, so the existing
-- (order_id, created_at) composite index is unusable for them.
CREATE INDEX "refunds_created_at_idx" ON "refunds"("created_at");
