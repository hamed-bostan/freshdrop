-- CreateTable
CREATE TABLE "delivery_options" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "eta" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_options_pkey" PRIMARY KEY ("id")
);

-- Seed the delivery-time catalog the storefront offers, carrying over the ids the
-- in-memory mock used so any references stay valid as the feature moves to
-- PostgreSQL. `position` fixes the display order shown at checkout.
INSERT INTO "delivery_options" ("id", "label", "eta", "position", "updated_at") VALUES
  ('fast',     'Fast Delivery',     '45 - 60 Min', 1, CURRENT_TIMESTAMP),
  ('standard', 'Standard Delivery', '2 - 3 Hours', 2, CURRENT_TIMESTAMP);
