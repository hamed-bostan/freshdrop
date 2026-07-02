-- Delivery time-slot booking. Replaces the flat delivery-speed catalog
-- (delivery_options) with schedulable, capacity-bounded time windows.

-- Record the booked slot on each order. Nullable so orders placed before this
-- feature existed (the seeded demo history) stay valid; new orders always set them.
ALTER TABLE "orders"
  ADD COLUMN "delivery_date" TEXT,
  ADD COLUMN "delivery_window_id" TEXT,
  ADD COLUMN "delivery_window" TEXT;

-- The recurring window catalog (reference data, like payment methods). Times are
-- minutes-from-midnight; `position` fixes the checkout order; `capacity` caps
-- bookings per date.
CREATE TABLE "delivery_windows" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "start_minutes" INTEGER NOT NULL,
    "end_minutes" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_windows_pkey" PRIMARY KEY ("id")
);

-- The per-(date, window) booking ledger — the atomic capacity guard. One row per
-- slot, created lazily on first booking; `booked` is incremented only while
-- `booked < capacity`, so a slot can't be oversold under concurrent checkouts.
CREATE TABLE "delivery_slot_bookings" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "window_id" TEXT NOT NULL,
    "booked" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_slot_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_slot_bookings_date_window_id_key" ON "delivery_slot_bookings"("date", "window_id");

-- Seed the delivery-window catalog the storefront offers.
INSERT INTO "delivery_windows" ("id", "label", "start_minutes", "end_minutes", "capacity", "position", "updated_at") VALUES
  ('morning',   'Morning',   480,  600,  15, 1, CURRENT_TIMESTAMP),
  ('midday',    'Midday',    720,  840,  20, 2, CURRENT_TIMESTAMP),
  ('afternoon', 'Afternoon', 960,  1080, 20, 3, CURRENT_TIMESTAMP),
  ('evening',   'Evening',   1080, 1200, 12, 4, CURRENT_TIMESTAMP);

-- Retire the old delivery-speed catalog — superseded by scheduled windows.
DROP TABLE "delivery_options";
