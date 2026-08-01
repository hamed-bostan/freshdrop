import { Boxes, ClipboardList, PackageSearch, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ExportReportId = "orders" | "products" | "inventory" | "customers";

export type ExportReportDefinition = {
  id: ExportReportId;
  endpoint: string;
  icon: LucideIcon;
  permission: "dashboard.view" | "catalog.write";
};

export const EXPORT_REPORTS: readonly ExportReportDefinition[] = [
  { id: "orders", endpoint: "/api/admin/exports/orders", icon: ClipboardList, permission: "dashboard.view" },
  { id: "products", endpoint: "/api/admin/exports/products", icon: PackageSearch, permission: "dashboard.view" },
  { id: "inventory", endpoint: "/api/admin/exports/inventory-movements", icon: Boxes, permission: "catalog.write" },
  { id: "customers", endpoint: "/api/admin/exports/customers", icon: Users, permission: "dashboard.view" },
] as const;

export function getExportReport(id: ExportReportId): ExportReportDefinition {
  return EXPORT_REPORTS.find((report) => report.id === id) ?? EXPORT_REPORTS[0];
}
