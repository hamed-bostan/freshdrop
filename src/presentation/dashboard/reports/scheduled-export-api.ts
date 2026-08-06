import type { ScheduledExportFormInput } from "@/src/contracts/scheduled-export-schema";
import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import { apiDelete, apiPatch, apiPost, apiPut } from "@/src/lib/api/client";
import { scheduledExportResponseSchema } from "./scheduled-export-response-schema";

/**
 * Typed client for the Scheduled reports panel and its `/schedules`
 * management route. UI components call these instead of touching Axios
 * directly — see `exportJobsApi` for the pattern.
 */
export const scheduledExportsApi = {
  create(input: ScheduledExportFormInput): Promise<ScheduledExport> {
    return apiPost("/admin/exports/schedules", input, scheduledExportResponseSchema);
  },

  update(id: string, input: ScheduledExportFormInput): Promise<ScheduledExport> {
    return apiPut(`/admin/exports/schedules/${id}`, input, scheduledExportResponseSchema);
  },

  /** The panel's Active toggle — pause or resume without opening the full form. */
  setActive(id: string, active: boolean): Promise<ScheduledExport> {
    return apiPatch(`/admin/exports/schedules/${id}`, { active }, scheduledExportResponseSchema);
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/admin/exports/schedules/${id}`);
  },
};
