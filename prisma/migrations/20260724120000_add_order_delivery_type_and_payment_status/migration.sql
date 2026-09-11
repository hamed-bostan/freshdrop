-- Adds the two facts the admin order list has to filter on but the order never
-- recorded: how it is handed over, and where the money stands.
--
-- Both are NOT NULL with a default rather than nullable, because there is a true
-- answer for every existing row instead of an "unknown": orders predating these
-- columns were all couriered, and were placed through a checkout whose only
-- outcome was a settled payment. Backfilling them as anything else would invent
-- history; leaving them nullable would push a meaningless third state into every
-- filter and badge downstream.
ALTER TABLE "orders" ADD COLUMN "delivery_type" TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE "orders" ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'paid';

-- The admin list narrows by status and reads newest-first. Leading with status
-- lets one index serve the seek and the ordering together; the existing
-- placed_at index still covers the unfiltered list and the analytics scans.
CREATE INDEX "orders_status_placed_at_idx" ON "orders"("status", "placed_at");
