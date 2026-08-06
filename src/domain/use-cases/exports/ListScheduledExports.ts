import type { ScheduledExport, ScheduledExportFilters } from "@/src/domain/entities/ScheduledExport";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";

/** The Scheduled reports panel's read — every schedule the viewer may see. */
export class ListScheduledExports {
  constructor(private readonly schedules: IScheduledExportRepository) {}

  execute(filters: ScheduledExportFilters): Promise<ScheduledExport[]> {
    return this.schedules.list(filters);
  }
}
