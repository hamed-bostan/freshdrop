-- Orders become user-owned: the storefront reads back only the caller's orders,
-- while the admin dashboard reads all of them. The seeded demo orders predate any
-- real account, so they're backfilled to a sentinel "demo" owner (a temporary
-- default applied to existing rows, then dropped so every new order must name its
-- owner — checkout always supplies the real user id).
ALTER TABLE "orders" ADD COLUMN "user_id" TEXT NOT NULL DEFAULT 'demo';
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
