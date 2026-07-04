-- The settlement (city / town) an address sits in, resolved by reverse-geocoding the
-- picked coordinate. Nullable: the geocoder can't always determine it, and existing
-- rows have no value — they read as NULL and the app falls back to the address label.

-- AlterTable
ALTER TABLE "delivery_locations" ADD COLUMN "city" TEXT;
