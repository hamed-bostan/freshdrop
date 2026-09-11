import type { ExportFormat, ExportJobParams, ExportJobReportId } from "@/src/domain/entities/ExportJob";
import { computeNextRunAt, type ScheduleCadence, type ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import { NotFoundError } from "@/src/domain/errors/NotFoundError";
import { ValidationError } from "@/src/domain/errors/ValidationError";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";

export type SaveScheduledExportRequest = {
  reportId: ExportJobReportId;
  format: ExportFormat;
  /** Whether the report accepts a period at all — the route reads this off the catalog, same as `CreateExportJob`. */
  periodCapable: boolean;
  params: ExportJobParams;
  cadence: ScheduleCadence;
  /** Required when `cadence` is `"weekly"`. */
  dayOfWeek?: number;
  /** Required when `cadence` is `"monthly"`. */
  dayOfMonth?: number;
  hour: number;
  timezone: string;
  deliverTo: string | null;
};

/**
 * Create or update a schedule — `existingId` picks which. Both paths
 * recompute `nextRunAt` from scratch, so an edited timing (a moved hour, a
 * changed weekday) retimes the next run immediately rather than waiting for
 * the old time to pass unfired.
 */
export class SaveScheduledExport {
  constructor(private readonly schedules: IScheduledExportRepository) {}

  async execute(
    request: SaveScheduledExportRequest,
    actor: { id: string; name: string },
    existingId?: string,
  ): Promise<ScheduledExport> {
    if (!request.periodCapable && (request.params.from || request.params.to)) {
      throw new ValidationError("params", "This report has no date range to filter by.");
    }
    if (request.cadence === "weekly" && request.dayOfWeek == null) {
      throw new ValidationError("dayOfWeek", "Choose a day of the week.");
    }
    if (request.cadence === "monthly" && request.dayOfMonth == null) {
      throw new ValidationError("dayOfMonth", "Choose a day of the month.");
    }

    const timing = {
      cadence: request.cadence,
      dayOfWeek: request.cadence === "weekly" ? (request.dayOfWeek ?? null) : null,
      dayOfMonth: request.cadence === "monthly" ? (request.dayOfMonth ?? null) : null,
      hour: request.hour,
      timezone: request.timezone,
    };
    const nextRunAt = computeNextRunAt(timing, new Date());

    if (existingId) {
      const existing = await this.schedules.getById(existingId);
      if (!existing) throw new NotFoundError("scheduled export", existingId);
      return this.schedules.update(existingId, {
        reportId: request.reportId,
        format: request.format,
        params: request.params,
        deliverTo: request.deliverTo,
        ...timing,
        nextRunAt,
      });
    }

    return this.schedules.create({
      reportId: request.reportId,
      format: request.format,
      params: request.params,
      deliverTo: request.deliverTo,
      active: true,
      createdById: actor.id,
      createdByName: actor.name,
      ...timing,
      nextRunAt,
    });
  }
}
