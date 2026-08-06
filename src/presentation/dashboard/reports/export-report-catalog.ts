import { Boxes, ClipboardList, Package, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  EXPORT_JOB_REPORT_IDS,
  EXPORT_REPORT_PERIOD_CAPABLE,
  EXPORT_REPORT_PERMISSION,
  type ExportJobReportId,
} from "@/src/domain/entities/ExportJob";
import type { Permission } from "@/src/domain/entities/Permission";
import { nextCalendarDay } from "@/src/lib/api/analytics-params";

/** Re-exported under the name this module has always used it by. */
export type ExportReportId = ExportJobReportId;

export type ExportReportDefinition = {
  id: ExportReportId;
  endpoint: string;
  icon: LucideIcon;
  /** From `EXPORT_REPORT_PERMISSION` — must match the `getSessionWith` check in the matching `app/api/admin/exports/*` route. */
  permission: Permission;
  /**
   * From `EXPORT_REPORT_PERIOD_CAPABLE`. `false` for customers (ranked by
   * all-time spend — see `ExportCustomers`) and products (a snapshot of the
   * current catalog). The date picker and `buildExportHref` both key off
   * this rather than every report silently accepting or ignoring a
   * `from`/`to` it may or may not use.
   */
  periodCapable: boolean;
};

const ENDPOINT: Record<ExportReportId, string> = {
  orders: "/api/admin/exports/orders",
  inventory: "/api/admin/exports/inventory-movements",
  customers: "/api/admin/exports/customers",
  products: "/api/admin/exports/products",
};

const ICON: Record<ExportReportId, LucideIcon> = {
  orders: ClipboardList,
  inventory: Boxes,
  customers: Users,
  products: Package,
};

export const EXPORT_REPORTS: readonly ExportReportDefinition[] = EXPORT_JOB_REPORT_IDS.map((id) => ({
  id,
  endpoint: ENDPOINT[id],
  icon: ICON[id],
  permission: EXPORT_REPORT_PERMISSION[id],
  periodCapable: EXPORT_REPORT_PERIOD_CAPABLE[id],
}));

export function getExportReport(id: ExportReportId): ExportReportDefinition {
  return EXPORT_REPORTS.find((report) => report.id === id) ?? EXPORT_REPORTS[0];
}

/**
 * Whether the report has a real "previous period" comparison the custom
 * builder can offer — currently only orders. `RunExportJob` builds that
 * section from the same revenue/order/customer aggregates the analytics
 * overview's own "compare with previous period" reads; inventory movements
 * and the customer/product snapshots have no equivalent revenue-shaped
 * comparison, so the control stays hidden for them rather than accepting a
 * selection that would silently produce nothing.
 */
export function supportsComparison(id: ExportReportId): boolean {
  return id === "orders";
}

/**
 * The subset of a report definition that's safe to hand to a Client Component.
 * `icon` is a Lucide component (a function) — React Server Components can't
 * serialize functions across the server/client boundary, so any prop crossing
 * into `"use client"` territory (see `CustomExportBuilder`) must be narrowed to
 * this shape rather than passed the full `ExportReportDefinition`.
 */
export type ExportReportSummary = Pick<ExportReportDefinition, "id" | "endpoint" | "periodCapable">;

/**
 * The report's endpoint, scoped to a period only when the report is
 * `periodCapable` — matching the `lte` semantics the export routes' `to`
 * filter uses, see `nextCalendarDay`. Reports without a period (customers,
 * products) get a bare endpoint rather than a `from`/`to` the route has
 * nothing to do with; see `periodCapable`'s doc for why those two don't take
 * one at all. Takes just the fields it needs so callers on either side of the
 * server/client boundary (the full definition, or the serializable
 * `ExportReportSummary`) both work.
 */
export function buildExportHref(report: Pick<ExportReportDefinition, "endpoint" | "periodCapable">, from: string, to: string): string {
  if (!report.periodCapable) return report.endpoint;
  const params = new URLSearchParams({ from, to: nextCalendarDay(to) });
  return `${report.endpoint}?${params.toString()}`;
}
