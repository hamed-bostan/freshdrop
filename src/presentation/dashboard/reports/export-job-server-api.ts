import type { ExportJob } from "@/src/domain/entities/ExportJob";
import type { Page } from "@/src/domain/entities/Pagination";
import { pageResponseSchema } from "@/src/lib/api/page-response-schema";
import { serverApiGet } from "@/src/lib/api/server-client";
import { exportJobResponseSchema } from "./export-job-response-schema";

const exportJobPageResponseSchema = pageResponseSchema(exportJobResponseSchema);

/**
 * Server-side reads for the Export center's job pipeline (BFF) — the Recent
 * exports widget and its "View all" page. Mutations (create, regenerate,
 * delete) go through the browser `exportJobsApi`, which then `router.refresh()`s
 * to re-run this read, same split as `categoriesServerApi`/`categoriesApi`.
 */
export const exportJobsServerApi = {
  /** `params` is forwarded verbatim — the caller hands over the query string it was rendered with. */
  list(params: URLSearchParams): Promise<Page<ExportJob>> {
    return serverApiGet("/admin/exports/jobs", exportJobPageResponseSchema, {
      params: Object.fromEntries(params),
    });
  },
};
