-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "placed_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "stage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the existing mock orders so the live app keeps its order history when the
-- feature moves from the in-memory mock to PostgreSQL. Ids match the mock ("FD-…").
-- `stage` is the starting delivery milestone for trackable (current, non-cancelled)
-- orders; archived/cancelled orders leave it NULL. Orders placed via checkout later
-- will insert their own rows.
INSERT INTO "orders" ("id", "status", "phase", "placed_at", "location", "total", "stage", "updated_at") VALUES
  ('FD-10231', 'completed',  'current',  '2023-10-09T15:22:00Z', 'Toronto, 23rd Street, No. 5', 129.9, 'arrived', CURRENT_TIMESTAMP),
  ('FD-10219', 'processing', 'current',  '2023-10-08T11:05:00Z', 'Toronto, 23rd Street, No. 5', 86.4,  'shipped', CURRENT_TIMESTAMP),
  ('FD-09984', 'completed',  'previous', '2023-09-21T18:40:00Z', 'Toronto, 23rd Street, No. 5', 54.25, NULL,      CURRENT_TIMESTAMP),
  ('FD-09870', 'cancelled',  'previous', '2023-09-03T09:15:00Z', 'Toronto, 23rd Street, No. 5', 41.8,  NULL,      CURRENT_TIMESTAMP);

-- Seed the order lines, snapshotting each product's current name + image from the
-- catalog (seeded in an earlier migration). The JOIN drops any line whose product
-- no longer exists — exactly how the mock filtered missing products. `position`
-- preserves the authored order of the lines; the synthetic id keeps each line
-- unique per (order, product).
INSERT INTO "order_items" ("id", "order_id", "product_id", "name", "image_url", "quantity", "position")
SELECT o.order_id || '-' || p.id, o.order_id, p.id, p.name, p.image_url, o.quantity, o.position
FROM (
  VALUES
    ('FD-10231', '10-1', 1, 1), ('FD-10231', '2-1', 2, 2), ('FD-10231', '3-1', 1, 3), ('FD-10231', '6-1', 3, 4), ('FD-10231', '11-1', 1, 5),
    ('FD-10219', '1-1', 2, 1), ('FD-10219', '5-1', 4, 2), ('FD-10219', '2-3', 1, 3), ('FD-10219', '6-2', 1, 4), ('FD-10219', '9-1', 2, 5),
    ('FD-09984', '3-2', 1, 1), ('FD-09984', '8-1', 2, 2), ('FD-09984', '9-2', 1, 3), ('FD-09984', '14-1', 1, 4), ('FD-09984', '12-1', 2, 5),
    ('FD-09870', '13-1', 1, 1), ('FD-09870', '16-1', 3, 2), ('FD-09870', '11-3', 1, 3), ('FD-09870', '5-2', 2, 4), ('FD-09870', '10-3', 1, 5)
) AS o(order_id, product_id, quantity, position)
JOIN "products" p ON p.id = o.product_id;
