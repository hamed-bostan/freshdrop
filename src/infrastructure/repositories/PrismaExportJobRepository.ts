import type { Prisma } from "@prisma/client";
import {
  EXPORT_JOB_EXPIRY_DAYS,
  toExportFormat,
  toExportJobReportId,
  toExportJobSource,
  toExportJobStatus,
  type ExportJob,
  type ExportJobFilters,
  type ExportJobParams,
  type ExportJobSort,
  type NewExportJob,
} from "@/src/domain/entities/ExportJob";
import type { Page, PageRequest } from "@/src/domain/entities/Pagination";
import { createPage, toSkipTake } from "@/src/domain/entities/Pagination";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import { prisma } from "@/src/infrastructure/prisma/client";

/**
 * Export job persistence backed by PostgreSQL via Prisma. Server-side only,
 * bound through the container — never imported by client code.
 */
export class PrismaExportJobRepository implements IExportJobRepository {
  async create(job: NewExportJob): Promise<ExportJob> {
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + EXPORT_JOB_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const row = await prisma.exportJob.create({
      data: {
        reportId: job.reportId,
        format: job.format,
        status: "processing",
        source: job.source,
        requestedById: job.requestedById,
        requestedByName: job.requestedByName,
        deliverTo: job.deliverTo,
        params: job.params as Prisma.InputJsonValue,
        periodFrom: job.periodFrom,
        periodTo: job.periodTo,
        createdAt,
        expiresAt,
      },
    });
    return toExportJob(row);
  }

  async getById(id: string): Promise<ExportJob | null> {
    const row = await prisma.exportJob.findUnique({ where: { id } });
    return row ? toExportJob(row) : null;
  }

  async listPage(filters: ExportJobFilters, page: PageRequest<ExportJobSort>): Promise<Page<ExportJob>> {
    const where = toWhere(filters);
    const orderBy: Prisma.ExportJobOrderByWithRelationInput = { createdAt: page.direction ?? "desc" };
    const { skip, take } = toSkipTake(page);

    // One transaction so the rows and the total describe the same snapshot,
    // matching `PrismaActivityLog.list`.
    const [rows, total] = await prisma.$transaction([
      prisma.exportJob.findMany({ where, orderBy, skip, take }),
      prisma.exportJob.count({ where }),
    ]);

    return createPage(rows.map(toExportJob), total, page);
  }

  async markReady(id: string, result: { rowCount: number; byteSize: number; storagePath: string }): Promise<void> {
    await prisma.exportJob.update({
      where: { id },
      data: {
        status: "ready",
        rowCount: result.rowCount,
        byteSize: result.byteSize,
        storagePath: result.storagePath,
        completedAt: new Date(),
      },
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await prisma.exportJob.update({
      where: { id },
      data: { status: "failed", error, completedAt: new Date() },
    });
  }

  async markExpired(ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    await prisma.exportJob.updateMany({
      where: { id: { in: [...ids] } },
      data: { status: "expired" },
    });
  }

  async listExpiring(before: Date): Promise<ExportJob[]> {
    const rows = await prisma.exportJob.findMany({
      where: { status: "ready", expiresAt: { lte: before } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toExportJob);
  }

  async listStranded(before: Date): Promise<ExportJob[]> {
    const rows = await prisma.exportJob.findMany({
      where: { status: "processing", createdAt: { lte: before } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toExportJob);
  }

  async remove(id: string): Promise<void> {
    await prisma.exportJob.delete({ where: { id } });
  }
}

function toWhere(filters: ExportJobFilters): Prisma.ExportJobWhereInput {
  const and: Prisma.ExportJobWhereInput[] = [];
  if (filters.reportId) and.push({ reportId: filters.reportId });
  if (filters.status) and.push({ status: filters.status });
  if (filters.requestedById) and.push({ requestedById: filters.requestedById });
  if (filters.source) and.push({ source: filters.source });
  // The reference's search box: matches the report id, which is what the
  // translated report name is derived from — there's no free-text column to
  // search, and the report id vocabulary is small and stable.
  if (filters.query) and.push({ reportId: { contains: filters.query, mode: "insensitive" } });
  // Permission scoping, anded alongside the chosen filters rather than
  // replacing them — same rule `PrismaActivityLog`'s `visibleEntityTypes` follows.
  if (filters.visibleReportIds) and.push({ reportId: { in: [...filters.visibleReportIds] } });
  return and.length ? { AND: and } : {};
}

/** Read the stored params back into `ExportJobParams`, dropping anything malformed. */
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

/** Map a Prisma row to the domain entity, narrowing the stored union strings. */
function toExportJob(row: {
  id: string;
  reportId: string;
  format: string;
  status: string;
  source: string;
  requestedById: string;
  requestedByName: string;
  deliverTo: string | null;
  params: Prisma.JsonValue;
  periodFrom: string | null;
  periodTo: string | null;
  rowCount: number | null;
  byteSize: number | null;
  storagePath: string | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
}): ExportJob {
  return {
    id: row.id,
    // The report id is validated at creation time (`CreateExportJob`), so a
    // row this build doesn't recognise means an older/newer deployment wrote
    // it — fall back to "orders" rather than throwing on read.
    reportId: toExportJobReportId(row.reportId) ?? "orders",
    format: toExportFormat(row.format),
    status: toExportJobStatus(row.status),
    source: toExportJobSource(row.source),
    requestedById: row.requestedById,
    requestedByName: row.requestedByName,
    deliverTo: row.deliverTo,
    params: toParams(row.params),
    periodFrom: row.periodFrom,
    periodTo: row.periodTo,
    rowCount: row.rowCount,
    byteSize: row.byteSize,
    storagePath: row.storagePath,
    error: row.error,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    expiresAt: row.expiresAt,
  };
}
