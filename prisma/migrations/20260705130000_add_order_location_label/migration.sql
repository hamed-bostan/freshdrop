-- The short saved-address label ("Home", "Gym") the order was delivered to, captured
-- at checkout from the selected delivery location. Nullable: orders placed before it
-- read as NULL — the order card falls back to the address's leading segment (city).

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "location_label" TEXT;

-- Backfill the seeded demo history with a saved-address label and the matching real
-- address, mirroring the demo delivery locations (Home / Office / Gym) so the order
-- card collapses each to its label and expands to the coherent full address. New
-- orders placed via checkout carry their own label from the selected location.
UPDATE "orders" SET "location_label" = 'Home',   "location" = '123 Maple Street, Toronto, ON M5H 2N2'   WHERE "id" IN ('FD-10231', 'FD-10219');
UPDATE "orders" SET "location_label" = 'Office', "location" = '78 King St, Toronto, ON, Canada'         WHERE "id" = 'FD-09984';
UPDATE "orders" SET "location_label" = 'Gym',    "location" = 'FitZone Gym, 250 Front St W, Toronto, ON' WHERE "id" = 'FD-09870';
