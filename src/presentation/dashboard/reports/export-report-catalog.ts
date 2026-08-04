import { Boxes, ClipboardList, Package, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/src/domain/entities/Permission";
import { nextCalendarDay } from "@/src/lib/api/analytics-params";

export type ExportReportId = "orders" | "inventory" | "customers" | "products";

export type ExportReportDefinition = {
  id: ExportReportId;
  endpoint: string;
  icon: LucideIcon;
  /** Must match the `getSessionWith` check in the matching `app/api/admin/exports/*` route. */
  permission: Permission;
};

export const EXPORT_REPORTS: readonly ExportReportDefinition[] = [
  { id: "orders", endpoint: "/api/admin/exports/orders", icon: ClipboardList, permission: "dashboard.view" },
  { id: "inventory", endpoint: "/api/admin/exports/inventory-movements", icon: Boxes, permission: "catalog.write" },
  { id: "customers", endpoint: "/api/admin/exports/customers", icon: Users, permission: "dashboard.view" },
  { id: "products", endpoint: "/api/admin/exports/products", icon: Package, permission: "catalog.write" },
] as const;

export function getExportReport(id: ExportReportId): ExportReportDefinition {
  return EXPORT_REPORTS.find((report) => report.id === id) ?? EXPORT_REPORTS[0];
}

/**
 * The subset of a report definition that's safe to hand to a Client Component.
 * `icon` is a Lucide component (a function) — React Server Components can't
 * serialize functions across the server/client boundary, so any prop crossing
 * into `"use client"` territory (see `CustomExportBuilder`) must be narrowed to
 * this shape rather than passed the full `ExportReportDefinition`.
 */
export type ExportReportSummary = Pick<ExportReportDefinition, "id" | "endpoint">;

/**
 * The report's endpoint scoped to a period, matching the `lte` semantics the
 * export routes' `to` filter uses — see `nextCalendarDay`. Reports with no date
 * filter (customers, products) simply ignore the params. Takes just the
 * `endpoint` field so callers on either side of the server/client boundary
 * (the full definition, or the serializable `ExportReportSummary`) both work.
 */
export function buildExportHref(report: Pick<ExportReportDefinition, "endpoint">, from: string, to: string): string {
  const params = new URLSearchParams({ from, to: nextCalendarDay(to) });
  return `${report.endpoint}?${params.toString()}`;
}
