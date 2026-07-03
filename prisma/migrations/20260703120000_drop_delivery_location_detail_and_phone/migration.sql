-- The add-address flow no longer collects a detail line or a contact phone, and no
-- screen reads them. Drop the now-unused columns; any values in existing rows are
-- discarded (the app already stopped reading/writing them).

-- AlterTable
ALTER TABLE "delivery_locations" DROP COLUMN "detail_address",
DROP COLUMN "phone";
