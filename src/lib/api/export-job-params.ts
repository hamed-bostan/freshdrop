import { EXPORT_JOB_STATUSES, type ExportJobStatus } from "@/src/domain/entities/ExportJob";

/**
 * The Recent exports table's own filters — search and status. Shared by the
 * client (which serialises them into a URL) and `GET /api/admin/exports/jobs`
 * (which parses them back), same pairing as `product-search-params.ts`.
 *
 * Deliberately narrower than `ExportJobFilters`: `visibleReportIds` is derived
 * from the caller's permissions, never from the query string, and `reportId`
 * (the quick-export cards never need it) stays parsed inline in the route.
 */
export type ExportJobQueryFilters = {
  query?: string;
  status?: ExportJobStatus;
};

const STATUS_SET = new Set<string>(EXPORT_JOB_STATUSES);

/** Parse `q`/`status` from a `URLSearchParams`, dropping anything blank or unrecognised. */
export function parseExportJobQueryFilters(params: URLSearchParams): ExportJobQueryFilters {
  const filters: ExportJobQueryFilters = {};

  const query = params.get("q")?.trim();
  if (query) filters.query = query;

  const status = params.get("status");
  if (status && STATUS_SET.has(status)) filters.status = status as ExportJobStatus;

  return filters;
}

/** Serialise `q`/`status` into a `URLSearchParams` — for the "View all" link and Regenerate. */
export function buildExportJobQueryParams(filters: ExportJobQueryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  return params;
}
