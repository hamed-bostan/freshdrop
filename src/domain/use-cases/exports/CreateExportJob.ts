import type { ExportFormat, ExportJob, ExportJobParams, ExportJobReportId, ExportJobSource } from "@/src/domain/entities/ExportJob";
import type { IExportJobRepository } from "@/src/domain/repositories/IExportJobRepository";
import { ValidationError } from "@/src/domain/errors/ValidationError";

export type CreateExportJobRequest = {
  reportId: ExportJobReportId;
  format: ExportFormat;
  requestedById: string;
  requestedByName: string;
  source: ExportJobSource;
  /** Whether the report accepts a period at all — the route reads this off the catalog. */
  periodCapable: boolean;
  params: ExportJobParams;
};

/**
 * Create a `processing` export job row. Validation only — generation is a
 * separate step (`RunExportJob`), fired by the caller without being awaited,
 * so this use-case returns as soon as the row exists and the builder can show
 * "processing" immediately.
 */
export class CreateExportJob {
  constructor(private readonly jobs: IExportJobRepository) {}

  async execute(request: CreateExportJobRequest): Promise<ExportJob> {
    if (!request.periodCapable && (request.params.from || request.params.to)) {
      throw new ValidationError("from", "This report has no date range to filter by.");
    }

    return this.jobs.create({
      reportId: request.reportId,
      format: request.format,
      source: request.source,
      requestedById: request.requestedById,
      requestedByName: request.requestedByName,
      params: request.params,
      periodFrom: request.periodCapable ? (request.params.from ?? null) : null,
      periodTo: request.periodCapable ? (request.params.to ?? null) : null,
    });
  }
}
