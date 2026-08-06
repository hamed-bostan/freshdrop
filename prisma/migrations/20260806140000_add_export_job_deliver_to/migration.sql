-- Phase 7 of the Export center plan: emailed delivery for a generated export.
-- Mirrors `scheduled_exports.deliver_to` — null means download-only, an
-- address means `RunExportJob` mails a signed link once the job is ready.

-- AlterTable
ALTER TABLE "export_jobs" ADD COLUMN "deliver_to" TEXT;
