import type { ExportJob, ExportJobFilters, ExportJobSort, NewExportJob } from "../entities/ExportJob";
import type { Page, PageRequest } from "../entities/Pagination";

/**
 * Persistence for export jobs — the async pipeline behind the custom export
 * builder and scheduled reports (as opposed to the four quick-export routes,
 * which stream a CSV directly and never create a row here).
 *
 * `markReady`/`markFailed`/`markExpired` are the only ways a job's terminal
 * state changes, each called from exactly one place: `RunExportJob` on
 * completion, and `SweepExportJobs` for both stranded-processing recovery and
 * time-based expiry. There is no generic `update` — a job's lifecycle is
 * `processing → (ready | failed)`, then `ready → expired`, and a repository
 * method per transition is what keeps a caller from writing a status the
 * lifecycle doesn't allow.
 */
export type IExportJobRepository = {
  /** Create a `processing` row. `expiresAt` is computed here from `EXPORT_JOB_EXPIRY_DAYS`. */
  create(job: NewExportJob): Promise<ExportJob>;

  getById(id: string): Promise<ExportJob | null>;

  /** One page, newest first, narrowed by `filters` — the Recent exports table. */
  listPage(filters: ExportJobFilters, page: PageRequest<ExportJobSort>): Promise<Page<ExportJob>>;

  /** `processing` → `ready`, with the generation result. */
  markReady(id: string, result: { rowCount: number; byteSize: number; storagePath: string }): Promise<void>;

  /** `processing` → `failed`, with the error message shown on the row. */
  markFailed(id: string, error: string): Promise<void>;

  /** `ready` → `expired` for every id, in one call — `SweepExportJobs`'s time-based pass. */
  markExpired(ids: readonly string[]): Promise<void>;

  /** `ready` jobs past `expiresAt` — what the sweep expires and deletes from storage. */
  listExpiring(before: Date): Promise<ExportJob[]>;

  /**
   * `processing` jobs created before `before` — jobs a container restart
   * stranded mid-generation. The sweep marks these `failed` directly (there is
   * no result to report), so `markFailed` covers this path too.
   */
  listStranded(before: Date): Promise<ExportJob[]>;

  /**
   * Delete a job row outright — the Recent exports table's overflow-menu
   * "Delete", as opposed to `markExpired`'s time-based transition. The caller
   * (`DeleteExportJob`) is responsible for removing the storage object first;
   * this only ever removes the row.
   */
  remove(id: string): Promise<void>;
};
