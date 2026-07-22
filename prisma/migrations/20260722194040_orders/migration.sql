-- DropIndex
DROP INDEX "activity_log_changed_fields_idx";

-- AlterTable
ALTER TABLE "activity_log" ALTER COLUMN "changed_fields" DROP DEFAULT;
