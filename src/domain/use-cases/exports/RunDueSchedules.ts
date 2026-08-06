import { EXPORT_REPORT_PERIOD_CAPABLE } from "@/src/domain/entities/ExportJob";
import { computeNextRunAt } from "@/src/domain/entities/ScheduledExport";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";
import { RunExportJob, type RunExportJobDeps } from "./RunExportJob";

export type RunDueSchedulesDeps = RunExportJobDeps & {
  schedules: IScheduledExportRepository;
};

export type RunDueSchedulesResult = { run: number };

/**
 * The scheduler's tick: every `active` schedule whose `nextRunAt` has passed
 * becomes one `ExportJob` (`source: "schedule"`), generated the same
 * fire-and-forget way a manual job is (`RunExportJob`), and the schedule is
 * advanced to its next occurrence.
 *
 * Idempotent per due window by construction, not by a lock: `markRun`
 * advances `nextRunAt` *before* generation is kicked off, so a schedule
 * dueness check made a moment later — a concurrent invocation, or a retry —
 * no longer finds it in `listDue`. There is a real gap between reading the
 * due list and advancing each row, but `POST /api/admin/exports/schedules/run`
 * is wired to a single hourly cron entry, not a fan of concurrent callers, so
 * that gap is never actually raced in practice.
 */
export class RunDueSchedules {
  constructor(private readonly deps: RunDueSchedulesDeps) {}

  async execute(now: Date = new Date()): Promise<RunDueSchedulesResult> {
    const due = await this.deps.schedules.listDue(now);

    for (const schedule of due) {
      const periodCapable = EXPORT_REPORT_PERIOD_CAPABLE[schedule.reportId];
      const job = await this.deps.jobs.create({
        reportId: schedule.reportId,
        format: schedule.format,
        source: "schedule",
        requestedById: schedule.createdById,
        requestedByName: schedule.createdByName,
        params: schedule.params,
        periodFrom: periodCapable ? (schedule.params.from ?? null) : null,
        periodTo: periodCapable ? (schedule.params.to ?? null) : null,
      });

      const nextRunAt = computeNextRunAt(schedule, now);
      await this.deps.schedules.markRun(schedule.id, now, nextRunAt);

      void new RunExportJob(this.deps)
        .execute(job.id)
        .catch((error) => console.error(`[SCHEDULED_EXPORT_RUN_UNCAUGHT] ${schedule.id} -> ${job.id}:`, error));
    }

    return { run: due.length };
  }
}
