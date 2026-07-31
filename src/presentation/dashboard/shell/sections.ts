import {
  BarChart3,
  CalendarClock,
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  PieChart,
  PercentCircle,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/src/domain/entities/Permission";

/**
 * The dashboard's navigation, as data.
 *
 * Both renderings of the nav — the desktop rail and the mobile drawer — read this
 * one table, so a section can't appear in one and be missing from the other.
 *
 * Sections are grouped by *what the reader is doing*, not by which table they hit:
 * the catalog group is "what we sell", sales is "what happened today", and the
 * last group is the store's own record of itself. The grouping is presentational
 * (a divider and a label); ordering within a group is the ordering that shipped.
 */

/** A navigation group's stable id, which is also its label key under `dashboard`. */
export type DashboardSectionGroup = "groupOverview" | "groupCatalog" | "groupSales" | "groupAnalytics" | "groupMarketing" | "groupStore";

/** A section's label key under the `dashboard` namespace — spelled out so `t()` can check it. */
export type DashboardSectionLabelKey =
  | "navDashboard"
  | "navCategories"
  | "navProducts"
  | "navInventory"
  | "navOrders"
  | "navReviews"
  | "navCustomers"
  | "navAnalytics"
  | "navReports"
  | "navPromoCodes"
  | "navDeliverySlots"
  | "navActivity"
  | "navTeam"
  | "navSettings";

export type DashboardSection = {
  href: string;
  labelKey: DashboardSectionLabelKey;
  icon: LucideIcon;
  /** The permission that makes the section worth offering. */
  needs: Permission;
  group: DashboardSectionGroup;
};

const SECTIONS = [
  { href: "/dashboard", labelKey: "navDashboard", icon: LayoutDashboard, needs: "dashboard.view", group: "groupOverview" },

  { href: "/dashboard/categories", labelKey: "navCategories", icon: Tag, needs: "catalog.write", group: "groupCatalog" },
  // Products, orders, reviews and customers are reads for everyone with the
  // dashboard — the catalog list is how support answers "do we still sell this?".
  // The write controls *inside* those pages are what the finer permissions gate.
  { href: "/dashboard/products", labelKey: "navProducts", icon: Package, needs: "dashboard.view", group: "groupCatalog" },
  // Same rule as Products: the needs-restock list is a read anyone with the
  // dashboard can use, and it's the same `stock=needsRestock` read Products
  // already exposes. Only the inline adjust, the ledger panel and bulk restock
  // — all `catalog.write` — are what the page adds on top.
  { href: "/dashboard/inventory", labelKey: "navInventory", icon: Warehouse, needs: "dashboard.view", group: "groupCatalog" },

  { href: "/dashboard/orders", labelKey: "navOrders", icon: ClipboardList, needs: "dashboard.view", group: "groupSales" },
  { href: "/dashboard/reviews", labelKey: "navReviews", icon: Star, needs: "dashboard.view", group: "groupSales" },
  { href: "/dashboard/customers", labelKey: "navCustomers", icon: Users, needs: "dashboard.view", group: "groupSales" },
  { href: "/dashboard/analytics", labelKey: "navAnalytics", icon: BarChart3, needs: "dashboard.view", group: "groupAnalytics" },
  { href: "/dashboard/reports", labelKey: "navReports", icon: PieChart, needs: "dashboard.view", group: "groupAnalytics" },

  { href: "/dashboard/promo-codes", labelKey: "navPromoCodes", icon: PercentCircle, needs: "promotions.write", group: "groupMarketing" },
  { href: "/dashboard/delivery-slots", labelKey: "navDeliverySlots", icon: CalendarClock, needs: "promotions.write", group: "groupMarketing" },

  // Last, and after the things it records: it's a place you go to answer a
  // question about the other sections, not somewhere work starts.
  { href: "/dashboard/activity", labelKey: "navActivity", icon: History, needs: "activity.view", group: "groupStore" },
  // Owner only. Activity deliberately is not — the trail is visible to everyone
  // holding `activity.view`, with only its team-access entries reserved to the
  // owner (see `activity-visibility`), so a plain admin gets a real page rather
  // than a redirect.
  { href: "/dashboard/team", labelKey: "navTeam", icon: ShieldCheck, needs: "team.manage", group: "groupStore" },
  // Admin and owner — configuration, not access control, so it doesn't share
  // Team's owner-only gate.
  { href: "/dashboard/settings", labelKey: "navSettings", icon: Settings, needs: "settings.write", group: "groupStore" },
] as const satisfies readonly DashboardSection[];

/** The groups in sidebar order. */
const GROUP_ORDER: readonly DashboardSectionGroup[] = [
  "groupOverview",
  "groupCatalog",
  "groupSales",
  "groupAnalytics",
  "groupMarketing",
  "groupStore",
];

export type DashboardNavGroup = {
  id: DashboardSectionGroup;
  sections: readonly DashboardSection[];
};

/**
 * The groups a viewer may actually use, with empty ones dropped so no divider is
 * drawn around nothing.
 *
 * Navigation only — every page and endpoint re-checks independently. Hiding a link
 * keeps someone from walking into a redirect; it isn't what stops them.
 */
export function navGroupsFor(permissions: readonly Permission[]): DashboardNavGroup[] {
  return GROUP_ORDER.map((id) => ({
    id,
    sections: SECTIONS.filter((section) => section.group === id && permissions.includes(section.needs)),
  })).filter((group) => group.sections.length > 0);
}

/**
 * Whether a section owns the current path. The overview root matches only its
 * exact path; every other section owns its subtree (e.g.
 * `/dashboard/products/123/edit`).
 */
export function isSectionActive(href: string, pathname: string): boolean {
  return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
}
