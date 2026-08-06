import type { CreateExportJobInput } from "@/src/contracts/export-job-schema";
import type { ExportJob, ExportFormat, ExportJobReportId } from "@/src/domain/entities/ExportJob";
import { apiGet, apiPost } from "@/src/lib/api/client";
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

  /** The Export summary sidebar's live row-count / size guess as the builder's selection changes. */
  estimate(query: EstimateExportQuery): Promise<ExportEstimateResponse> {
    const params = new URLSearchParams({ reportId: query.reportId, format: query.format });
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    return apiGet(`/admin/exports/estimate?${params.toString()}`, exportEstimateResponseSchema);
  },
};
