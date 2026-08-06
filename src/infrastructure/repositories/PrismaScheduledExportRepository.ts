import type { Prisma } from "@prisma/client";
import {
  toExportFormat,
  toExportJobReportId,
  type ExportJobParams,
} from "@/src/domain/entities/ExportJob";
import {
  toScheduleCadence,
  type NewScheduledExport,
  type ScheduledExport,
  type ScheduledExportEdits,
  type ScheduledExportFilters,
} from "@/src/domain/entities/ScheduledExport";
import type { IScheduledExportRepository } from "@/src/domain/repositories/IScheduledExportRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Scheduled-export persistence backed by PostgreSQL via Prisma. Server-side
 * only, bound through the container — never imported by client code.
 */
export class PrismaScheduledExportRepository implements IScheduledExportRepository {
  async create(schedule: NewScheduledExport): Promise<ScheduledExport> {
    const row = await prisma.scheduledExport.create({ data: toRowData(schedule) });
    return toScheduledExport(row);
  }

  async update(id: string, edits: ScheduledExportEdits & { nextRunAt: Date }): Promise<ScheduledExport> {
    const row = await prisma.scheduledExport.update({
      where: { id },
      data: {
        reportId: edits.reportId,
        format: edits.format,
        params: edits.params as Prisma.InputJsonValue,
        cadence: edits.cadence,
        dayOfWeek: edits.dayOfWeek,
        dayOfMonth: edits.dayOfMonth,
        hour: edits.hour,
        timezone: edits.timezone,
        deliverTo: edits.deliverTo,
        nextRunAt: edits.nextRunAt,
      },
    });
    return toScheduledExport(row);
  }

  async setActive(id: string, active: boolean): Promise<ScheduledExport> {
    const row = await prisma.scheduledExport.update({ where: { id }, data: { active } });
    return toScheduledExport(row);
  }

  async getById(id: string): Promise<ScheduledExport | null> {
    const row = await prisma.scheduledExport.findUnique({ where: { id } });
    return row ? toScheduledExport(row) : null;
  }

  async list(filters: ScheduledExportFilters): Promise<ScheduledExport[]> {
    const where: Prisma.ScheduledExportWhereInput = {};
    if (filters.visibleReportIds) where.reportId = { in: [...filters.visibleReportIds] };

    const rows = await prisma.scheduledExport.findMany({ where, orderBy: { createdAt: "desc" } });
    return rows.map(toScheduledExport);
  }

  async listDue(now: Date): Promise<ScheduledExport[]> {
    const rows = await prisma.scheduledExport.findMany({
      where: { active: true, nextRunAt: { lte: now } },
      orderBy: { nextRunAt: "asc" },
    });
    return rows.map(toScheduledExport);
  }

  async markRun(id: string, ranAt: Date, nextRunAt: Date): Promise<void> {
    await prisma.scheduledExport.update({ where: { id }, data: { lastRunAt: ranAt, nextRunAt } });
  }

  async remove(id: string): Promise<void> {
    await prisma.scheduledExport.delete({ where: { id } });
  }
}

/** Read the stored params back into `ExportJobParams`, dropping anything malformed — mirrors `PrismaExportJobRepository`. */
function toParams(value: Prisma.JsonValue): ExportJobParams {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const params: ExportJobParams = {};
  if (typeof record.from === "string") params.from = record.from;
  if (typeof record.to === "string") params.to = record.to;
  if (typeof record.compareWithPrevious === "boolean") params.compareWithPrevious = record.compareWithPrevious;
  if (Array.isArray(record.sections)) params.sections = record.sections.filter((s): s is string => typeof s === "string");
  return params;
}

function toRowData(schedule: NewScheduledExport) {
  return {
    reportId: schedule.reportId,
    format: schedule.format,
    params: schedule.params as Prisma.InputJsonValue,
    cadence: schedule.cadence,
    dayOfWeek: schedule.dayOfWeek,
    dayOfMonth: schedule.dayOfMonth,
    hour: schedule.hour,
    timezone: schedule.timezone,
    deliverTo: schedule.deliverTo,
    active: schedule.active,
    createdById: schedule.createdById,
    createdByName: schedule.createdByName,
    nextRunAt: schedule.nextRunAt,
  };
}

type ScheduledExportRow = {
  id: string;
  reportId: string;
  format: string;
  params: Prisma.JsonValue;
  cadence: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  hour: number;
  timezone: string;
  deliverTo: string | null;
  active: boolean;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  nextRunAt: Date;
};

function toScheduledExport(row: ScheduledExportRow): ScheduledExport {
  return {
    id: row.id,
    // Validated at creation time; an unrecognised value means a newer/older
    // deployment wrote it — fall back rather than throwing on read, same as
    // `PrismaExportJobRepository.toExportJob`.
    reportId: toExportJobReportId(row.reportId) ?? "orders",
    format: toExportFormat(row.format),
    params: toParams(row.params),
    cadence: toScheduleCadence(row.cadence),
    dayOfWeek: row.dayOfWeek,
    dayOfMonth: row.dayOfMonth,
    hour: row.hour,
    timezone: row.timezone,
    deliverTo: row.deliverTo,
    active: row.active,
    createdById: row.createdById,
    createdByName: row.createdByName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastRunAt: row.lastRunAt,
    nextRunAt: row.nextRunAt,
  };
}
