-- Which of the bell's stored-notification categories this admin also wants
-- emailed — opt-in, empty by default (in-app only). Where the inbound bell
-- and the outbound email sender meet (Track B3).

-- AlterTable
ALTER TABLE "users" ADD COLUMN "notified_categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
