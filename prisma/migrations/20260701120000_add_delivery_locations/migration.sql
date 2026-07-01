-- CreateTable
CREATE TABLE "delivery_locations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "detail_address" TEXT,
    "phone" TEXT,
    "kind" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_locations_user_id_idx" ON "delivery_locations"("user_id");

-- Seed the demo addresses the in-memory mock shipped, owned by the sentinel `demo`
-- user (the same sentinel the order/cart/wallet seeds use) so they stay invisible
-- to real users — they start with no saved addresses and add them via the
-- "Add New Address" flow. Ids carried over from the mock.
INSERT INTO "delivery_locations" ("id", "user_id", "label", "address", "kind", "updated_at") VALUES
  ('1', 'demo', 'Home',          '123 Maple Street, Toronto, ON M5H 2N2', 'home',   CURRENT_TIMESTAMP),
  ('2', 'demo', 'Office',        '78 King St, Toronto, ON, Canada',       'office', CURRENT_TIMESTAMP),
  ('3', 'demo', 'Gym',           'FitZone Gym, 250 Front St W, Toronto, ON', 'gym',  CURRENT_TIMESTAMP),
  ('4', 'demo', 'Friend''s Home', '72 Queen''s Park Crescent, Toronto, ON', 'other', CURRENT_TIMESTAMP);
