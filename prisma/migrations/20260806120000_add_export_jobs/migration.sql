-- A generated export file and the async job that produced it — the Export
-- center's "Recent exports" history, and the state a custom export moves
-- through on its way from "processing" to a downloadable file.
--
-- The four quick-export routes (`/api/admin/exports/<resource>`) stream
-- straight to the browser and never write here; this table backs the custom
-- builder and scheduled reports, where generation is genuinely asynchronous.
--
-- `requested_by_id`/`requested_by_name` are a plain reference + snapshot, not
-- a foreign key — the same loose coupling `activity_log` uses, for the same
-- reason: a job outlives the admin who requested it.

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "source" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "requested_by_name" TEXT NOT NULL,
    -- The builder's selection (date range, compare-with, sections), captured
    -- verbatim so a failed or expired job can be regenerated unchanged.
    "params" JSONB NOT NULL,
    "period_from" TEXT,
    "period_to" TEXT,
    "row_count" INTEGER,
    "byte_size" INTEGER,
    "storage_path" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- The builder's selection is a single object (`{ from, to, ... }`), not a list —
-- checked here for the same reason `activity_log.changes` is checked against
-- being an array: Prisma's `Json` type accepts any JSON value and the readers
-- assume this shape.
ALTER TABLE "export_jobs"
    ADD CONSTRAINT "export_jobs_params_is_object" CHECK (jsonb_typeof("params") = 'object');

-- CreateIndex
-- The Recent exports table, newest first.
CREATE INDEX "export_jobs_created_at_idx" ON "export_jobs"("created_at");
-- The sweep's two passes: ready jobs past their expiry, and processing jobs
-- stranded by a restart.
CREATE INDEX "export_jobs_status_created_at_idx" ON "export_jobs"("status", "created_at");
-- "My exports" / who has been generating what.
CREATE INDEX "export_jobs_requested_by_id_created_at_idx" ON "export_jobs"("requested_by_id", "created_at");
