import type { CreateExportJobInput } from "@/src/contracts/export-job-schema";
import type { ExportJob, ExportFormat, ExportJobReportId } from "@/src/domain/entities/ExportJob";
import { apiDelete, apiGet, apiPost } from "@/src/lib/api/client";
import { exportEstimateResponseSchema, exportJobResponseSchema, type ExportEstimateResponse } from "./export-job-response-schema";

export type EstimateExportQuery = {
  reportId: ExportJobReportId;
  format: ExportFormat;
  from?: string;
  to?: string;
};

/**
 * Typed client for the Export center's job pipeline. UI components (the
 * custom builder, and later the Recent exports table) call these instead of
 * touching Axios directly — see `categoriesApi` for the pattern.
 */
export const exportJobsApi = {
  create(input: CreateExportJobInput): Promise<ExportJob> {
    return apiPost("/admin/exports/jobs", input, exportJobResponseSchema);
  },

  /** Regenerate replays a stored job's `params` as a brand-new `create` call — same request shape, fresh job. */
  regenerate(job: Pick<ExportJob, "reportId" | "format" | "params">): Promise<ExportJob> {
    return apiPost(
      "/admin/exports/jobs",
      { reportId: job.reportId, format: job.format, ...job.params },
      exportJobResponseSchema,
    );
  },

  /** The Recent exports table's overflow "Delete" — removes the row and its storage object. */
  remove(id: string): Promise<void> {
    return apiDelete(`/admin/exports/jobs/${id}`);
  },

  /** The Export summary sidebar's live row-count / size guess as the builder's selection changes. */
  estimate(query: EstimateExportQuery): Promise<ExportEstimateResponse> {
    const params = new URLSearchParams({ reportId: query.reportId, format: query.format });
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    return apiGet(`/admin/exports/estimate?${params.toString()}`, exportEstimateResponseSchema);
  },
};
