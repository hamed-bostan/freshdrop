import { Boxes, ClipboardList, Package, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ExportReportId = "orders" | "inventory" | "customers" | "products";

export type ExportReportDefinition = {
  id: ExportReportId;
  endpoint: string;
  icon: LucideIcon;
  permissionLabel: "dashboardView" | "catalogWrite";
};

export const EXPORT_REPORTS: readonly ExportReportDefinition[] = [
  { id: "orders", endpoint: "/api/admin/exports/orders", icon: ClipboardList, permissionLabel: "dashboardView" },
  { id: "inventory", endpoint: "/api/admin/exports/inventory-movements", icon: Boxes, permissionLabel: "catalogWrite" },
  { id: "customers", endpoint: "/api/admin/exports/customers", icon: Users, permissionLabel: "dashboardView" },
  { id: "products", endpoint: "/api/admin/exports/products", icon: Package, permissionLabel: "catalogWrite" },
] as const;

export function getExportReport(id: ExportReportId): ExportReportDefinition {
  return EXPORT_REPORTS.find((report) => report.id === id) ?? EXPORT_REPORTS[0];
}
