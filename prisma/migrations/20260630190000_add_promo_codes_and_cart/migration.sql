-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discount_percent" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_product_id_key" ON "cart_items"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "cart_items_user_id_idx" ON "cart_items"("user_id");

-- Seed the promo codes the storefront offers, carrying over the ids the in-memory
-- mock used so any links/references stay valid as the feature moves to PostgreSQL.
INSERT INTO "promo_codes" ("id", "code", "title", "description", "discount_percent", "updated_at") VALUES
  ('1', 'SNAPP15', 'Promo Snapp',    '15% discount on first order',   15, CURRENT_TIMESTAMP),
  ('2', 'FRESH10', 'Fresh Welcome',  '10% off your first groceries',  10, CURRENT_TIMESTAMP),
  ('3', 'GREENS20', 'Green Weekend', '20% off fresh fruit & veg',     20, CURRENT_TIMESTAMP),
  ('4', 'SAVE5',   'Saver Deal',     '5% off any order, anytime',      5, CURRENT_TIMESTAMP);

-- Seed the demo cart the in-memory mock shipped, owned by the sentinel `demo` user
-- (the same sentinel the order seed uses) so it stays invisible to real users —
-- they start with an empty cart and fill it via "Add to Cart". The JOIN drops any
-- line whose product no longer exists, exactly how the mock filtered missing rows.
INSERT INTO "cart_items" ("id", "user_id", "product_id", "quantity", "updated_at")
SELECT 'demo-' || c.product_id, 'demo', c.product_id, c.quantity, CURRENT_TIMESTAMP
FROM (
  VALUES
    ('6-2', 1), ('3-1', 1), ('3-3', 1), ('10-1', 1), ('2-1', 2), ('5-1', 3)
) AS c(product_id, quantity)
JOIN "products" p ON p.id = c.product_id;
