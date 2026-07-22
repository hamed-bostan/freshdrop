-- Index orders by when they were placed.
--
-- Every analytics aggregate — the KPI totals, the revenue series, the status
-- breakdown, the product and category rankings, and each of their previous-period
-- baselines — is `WHERE placed_at >= $1 AND placed_at < $2` over a period an admin
-- chose (see `PrismaAnalyticsRepository`). Without this index each of those is a
-- sequential scan of the whole order history, so a dashboard asking about last week
-- gets steadily slower as history it isn't looking at accumulates.
--
-- B-tree, and on `placed_at` alone: the predicate is a plain range on one column,
-- which is exactly what B-tree serves, and the queries aggregate over the whole
-- matched set rather than reading a few rows of it — so there is nothing useful to
-- add as a second column or as an INCLUDE.
--
-- The per-user read (`orders_user_id_idx`) is untouched and stays the right index
-- for "this customer's orders"; this one answers "orders in this period", which no
-- existing index could.

-- CreateIndex
CREATE INDEX "orders_placed_at_idx" ON "orders"("placed_at");
