import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";

/** The Scheduled reports panel's Active toggle — pause or resume a schedule without deleting it. */
export class SetScheduleActive {
  constructor(private readonly schedules: IScheduledExportRepository) {}

  async execute(id: string, active: boolean): Promise<ScheduledExport> {
    const existing = await this.schedules.getById(id);
    if (!existing) throw new NotFoundError("scheduled export", id);
    return this.schedules.setActive(id, active);
  }
}
