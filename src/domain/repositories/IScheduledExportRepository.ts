import type { NewScheduledExport, ScheduledExport, ScheduledExportEdits, ScheduledExportFilters } from "../entities/ScheduledExport";

/**
 * Persistence for scheduled exports — the Export center's Scheduled reports
 * panel and its `/schedules` management route. Small, unpaged list by
 * design: an admin authors a handful of standing schedules, not hundreds, so
 * `list` returns everything the caller may see rather than a `Page<T>`.
 */
export type IScheduledExportRepository = {
  create(schedule: NewScheduledExport): Promise<ScheduledExport>;

  /** Full edit of everything but `active` (that's `setActive`) — recomputes `nextRunAt` when the caller passes it. */
  update(id: string, edits: ScheduledExportEdits & { nextRunAt: Date }): Promise<ScheduledExport>;

  setActive(id: string, active: boolean): Promise<ScheduledExport>;

  getById(id: string): Promise<ScheduledExport | null>;

  /** Every schedule the caller may see, newest first. */
  list(filters: ScheduledExportFilters): Promise<ScheduledExport[]>;

  /** `active` schedules whose `nextRunAt` has passed — what `RunDueSchedules` fires. */
  listDue(now: Date): Promise<ScheduledExport[]>;

  /** Record a run and advance the schedule past it — the one write `RunDueSchedules` makes per due schedule. */
  markRun(id: string, ranAt: Date, nextRunAt: Date): Promise<void>;

  remove(id: string): Promise<void>;
};
