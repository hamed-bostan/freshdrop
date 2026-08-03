-- Delivery-zone reporting: snapshot the settlement (city/town) the delivery
-- address sits in at checkout, alongside the existing location/locationLabel
-- snapshot. Nullable — every existing order row predates it and stays valid.

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "city" TEXT;
