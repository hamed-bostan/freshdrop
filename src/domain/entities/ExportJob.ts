/**
 * A generated export file: the persisted record behind the Export center's
 * "Recent exports" table and the async status a custom export goes through
 * on its way from "processing" to a downloadable file.
 *
 * Distinct from the direct `/api/admin/exports/<resource>` routes, which
 * still stream a CSV straight to the browser with no row at all — those
 * exist for the quick-export cards, where "processing" would be dishonest
 * (the file is done before the response even starts). A job exists when the
 * request went through the custom builder or a schedule: multi-format,
 * multi-section, and genuinely asynchronous, so it needs somewhere to park
 * its state between "requested" and "ready".
 *
 * Framework-free, so it's importable from anywhere in the app.
 */

import type { Permission } from "./Permission";

/** The report catalog a job can be generated from — see `export-report-catalog.ts`. */
export const EXPORT_JOB_REPORT_IDS = ["orders", "inventory", "customers", "products"] as const;
export type ExportJobReportId = (typeof EXPORT_JOB_REPORT_IDS)[number];

export function toExportJobReportId(value: string): ExportJobReportId | null {
  return (EXPORT_JOB_REPORT_IDS as readonly string[]).includes(value) ? (value as ExportJobReportId) : null;
}

/**
 * The permission each report requires — must match the `getSessionWith`
 * check in the matching `app/api/admin/exports/*` route.
 *
 * Lives here, not in `export-report-catalog.ts` (which also carries the icon
 * and endpoint), because that module sits under `src/presentation/` and
 * `app/api/**` must never import from there (the BFF's two halves stay
 * independently deployable — see `CLAUDE.md`). This is the one source of
 * truth both sides read: the presentation catalog re-exports it for the UI,
 * and `POST /api/admin/exports/jobs` reads it directly to pick which
 * permission a job's `reportId` requires.
 */
export const EXPORT_REPORT_PERMISSION: Record<ExportJobReportId, Permission> = {
  orders: "dashboard.view",
  inventory: "catalog.write",
  customers: "dashboard.view",
  products: "catalog.write",
};

/**
 * Whether a report is scoped to a period at all — `false` for customers
 * (ranked by all-time spend, see `ExportCustomers`) and products (a snapshot
 * of the current catalog). Same reasoning as `EXPORT_REPORT_PERMISSION` for
 * why this lives here rather than in the presentation catalog.
 */
export const EXPORT_REPORT_PERIOD_CAPABLE: Record<ExportJobReportId, boolean> = {
  orders: true,
  inventory: true,
  customers: false,
  products: false,
};

/**
 * `processing` → `ready` is the happy path; `processing` → `failed` when
 * generation throws. `ready` → `expired` once `expiresAt` passes — a
 * scheduled sweep, not a live check, so a row's status is always what a
 * background pass last observed rather than computed on every read.
 */
export const EXPORT_JOB_STATUSES = ["processing", "ready", "failed", "expired"] as const;
export type ExportJobStatus = (typeof EXPORT_JOB_STATUSES)[number];

export function toExportJobStatus(value: string): ExportJobStatus {
  return (EXPORT_JOB_STATUSES as readonly string[]).includes(value) ? (value as ExportJobStatus) : "failed";
}

export const EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export function toExportFormat(value: string): ExportFormat {
  return (EXPORT_FORMATS as readonly string[]).includes(value) ? (value as ExportFormat) : "csv";
}

/** Who asked for it: an admin from the builder, or a due schedule. */
export const EXPORT_JOB_SOURCES = ["manual", "schedule"] as const;
export type ExportJobSource = (typeof EXPORT_JOB_SOURCES)[number];

export function toExportJobSource(value: string): ExportJobSource {
  return (EXPORT_JOB_SOURCES as readonly string[]).includes(value) ? (value as ExportJobSource) : "manual";
}

/**
 * The builder's selection, captured verbatim so a failed or expired job can
 * be regenerated with the same inputs — "Regenerate" in the reference table
 * replays this, not a fresh form. Kept as one flexible bag (rather than a
 * typed column per option) because it is never queried, only replayed and
 * displayed; see `ActivityEntry.changes` for the same reasoning applied to a
 * diff instead of a request.
 */
export type ExportJobParams = {
  from?: string;
  to?: string;
  compareWithPrevious?: boolean;
  sections?: string[];
};

export type ExportJob = {
  id: string;
  reportId: ExportJobReportId;
  format: ExportFormat;
  status: ExportJobStatus;
  source: ExportJobSource;
  requestedById: string;
  /** The requester's name at the time — snapshotted, like `ActivityEntry.actorName`. */
  requestedByName: string;
  params: ExportJobParams;
  /** Null for snapshot-style reports (inventory, products) that have no period. */
  periodFrom: string | null;
  periodTo: string | null;
  rowCount: number | null;
  byteSize: number | null;
  /** The object's path in the `exports` bucket once generation succeeds. */
  storagePath: string | null;
  /** The failure message, set only when `status === "failed"`. */
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
  /** `createdAt + 7 days`, set at creation regardless of when generation finishes. */
  expiresAt: Date;
};

/** A job about to be created. The store assigns `id`, `createdAt` and `expiresAt`. */
export type NewExportJob = Omit<
  ExportJob,
  "id" | "status" | "rowCount" | "byteSize" | "storagePath" | "error" | "createdAt" | "completedAt" | "expiresAt"
>;

/** How long a ready job's download link stays valid — the reference's "expires after 7 days". */
export const EXPORT_JOB_EXPIRY_DAYS = 7;

/**
 * How long a job may sit `processing` before the sweep gives up on it and marks
 * it `failed`. Generation is in-process and fire-and-forget (see `RunExportJob`),
 * so a container restart mid-run otherwise strands the row forever.
 */
export const EXPORT_JOB_STRANDED_MINUTES = 30;

export type ExportJobFilters = {
  reportId?: ExportJobReportId;
  status?: ExportJobStatus;
  requestedById?: string;
  source?: ExportJobSource;
  /** Substring match on the report's translated name — the reference's search box. */
  query?: string;
  /**
   * Which reports the *viewer* may see, as opposed to which one they filtered
   * to. Mirrors `ActivityFilters.visibleEntityTypes`: a viewer's permission
   * and a reader's choice compose, and collapsing them into `reportId` would
   * let a query param widen what someone may read.
   */
  visibleReportIds?: readonly ExportJobReportId[];
};

export const EXPORT_JOB_SORTS = ["createdAt"] as const;
export type ExportJobSort = (typeof EXPORT_JOB_SORTS)[number];
export const DEFAULT_EXPORT_JOB_SORT: ExportJobSort = "createdAt";
