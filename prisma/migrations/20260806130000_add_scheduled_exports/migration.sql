-- A standing "generate this export automatically" rule — the Export
-- center's Scheduled reports panel. `RunDueSchedules` turns a due row into
-- an `export_jobs` row with source 'schedule'; this table only holds the
-- recurring configuration, never a generated file.

-- CreateTable
CREATE TABLE "scheduled_exports" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    -- The builder's selection this schedule replays on every run.
    "params" JSONB NOT NULL,
    "cadence" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "day_of_month" INTEGER,
    "hour" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL,
    "deliver_to" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_exports_pkey" PRIMARY KEY ("id")
);

-- Same shape guard as `export_jobs.params`.
ALTER TABLE "scheduled_exports"
    ADD CONSTRAINT "scheduled_exports_params_is_object" CHECK (jsonb_typeof("params") = 'object');

-- A weekly schedule has a weekday and no day-of-month; a monthly one is the
-- opposite. Catches a row that isn't clearly one or the other at the database
-- boundary, not just in application code.
ALTER TABLE "scheduled_exports"
    ADD CONSTRAINT "scheduled_exports_cadence_fields_match" CHECK (
        (cadence = 'weekly' AND day_of_week IS NOT NULL AND day_of_month IS NULL)
        OR (cadence = 'monthly' AND day_of_month IS NOT NULL AND day_of_week IS NULL)
    );

ALTER TABLE "scheduled_exports"
    ADD CONSTRAINT "scheduled_exports_hour_range" CHECK (hour >= 0 AND hour <= 23);
ALTER TABLE "scheduled_exports"
    ADD CONSTRAINT "scheduled_exports_day_of_week_range" CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6));
ALTER TABLE "scheduled_exports"
    ADD CONSTRAINT "scheduled_exports_day_of_month_range" CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 28));

-- CreateIndex
-- The management list, newest first.
CREATE INDEX "scheduled_exports_created_at_idx" ON "scheduled_exports"("created_at");
-- `RunDueSchedules`'s query: active schedules whose time has come.
CREATE INDEX "scheduled_exports_active_next_run_at_idx" ON "scheduled_exports"("active", "next_run_at");
