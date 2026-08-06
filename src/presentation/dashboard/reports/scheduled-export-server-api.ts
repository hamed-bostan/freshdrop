import type { ScheduledExport } from "@/src/domain/entities/ScheduledExport";
import { ApiError } from "@/src/lib/api/ApiError";
import { serverApiGet } from "@/src/lib/api/server-client";
import { scheduledExportListResponseSchema, scheduledExportResponseSchema } from "./scheduled-export-response-schema";

/**
 * Server-side reads for scheduled exports (BFF) — the Scheduled reports panel,
 * the `/schedules` management list, and the edit form's prefill. Mutations go
 * through the browser `scheduledExportsApi`, which then `router.refresh()`s to
 * re-run these, same split as `exportJobsServerApi`/`exportJobsApi`.
 */
export const scheduledExportsServerApi = {
  list(): Promise<ScheduledExport[]> {
    return serverApiGet("/admin/exports/schedules", scheduledExportListResponseSchema);
  },

  /** Resolve a schedule by id; `null` on 404 so callers can `notFound()`. */
  async getById(id: string): Promise<ScheduledExport | null> {
    try {
      return await serverApiGet(`/admin/exports/schedules/${id}`, scheduledExportResponseSchema);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
};
