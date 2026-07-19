"use client";

import { useTranslations } from "next-intl";
import {
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  Package,
  PercentCircle,
  ShieldCheck,
  Star,
  Tag,
  Users,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/src/i18n/navigation";
import { Icon } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";

/**
 * Top-level dashboard sections, in sidebar order. Each lives under its own
 * segment; the dashboard root (`/dashboard`) is the overview page. Icons are
 * lucide marks rendered through the design-system `Icon`.
 */
const SECTIONS = [
  { href: "/dashboard", labelKey: "navDashboard", icon: LayoutDashboard },
  { href: "/dashboard/categories", labelKey: "navCategories", icon: Tag },
  { href: "/dashboard/products", labelKey: "navProducts", icon: Package },
  { href: "/dashboard/orders", labelKey: "navOrders", icon: ClipboardList },
  { href: "/dashboard/reviews", labelKey: "navReviews", icon: Star },
  { href: "/dashboard/customers", labelKey: "navCustomers", icon: Users },
  { href: "/dashboard/promo-codes", labelKey: "navPromoCodes", icon: PercentCircle },
  { href: "/dashboard/delivery-slots", labelKey: "navDeliverySlots", icon: CalendarClock },
] as const satisfies readonly { href: string; labelKey: string; icon: LucideIcon }[];

/** Sections only the owner can reach — appended when the viewer is one. */
const OWNER_SECTIONS = [
  { href: "/dashboard/team", labelKey: "navTeam", icon: ShieldCheck },
] as const satisfies readonly { href: string; labelKey: string; icon: LucideIcon }[];

type DashboardSidebarProps = {
  /** Whether the viewer owns the store, deciding if the Team section is offered. */
  isOwner: boolean;
};

/**
 * Fixed left navigation rail for the admin dashboard: brand at the top, the
 * section links in the middle (active section highlighted), and a "View store"
 * escape hatch pinned to the bottom. Client component — the active state is
 * derived from the current path.
 */
export function DashboardSidebar({ isOwner }: DashboardSidebarProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  // Navigation only — the page and its endpoints re-check independently. Hiding
  // the link keeps an admin from walking into a redirect, it doesn't secure it.
  const sections = isOwner ? [...SECTIONS, ...OWNER_SECTIONS] : SECTIONS;

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-e border-border bg-background">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-5 py-5 text-heading-h3 text-foreground"
      >
        <Icon icon={Leaf} size="md" className="text-primary" />
        <span>
          FreshDrop <span className="text-primary">{t("admin")}</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {sections.map((section) => {
          // The overview root matches only its exact path; every other section
          // owns its subtree (e.g. `/dashboard/products/123/edit`).
          const active =
            section.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-card-md px-3 py-2 text-body-b7 transition-colors",
                active
                  ? "bg-surface-sunken text-foreground"
                  : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
              )}
            >
              <Icon icon={section.icon} size="sm" />
              {t(section.labelKey)}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="flex items-center gap-2 border-t border-border px-5 py-4 text-body-b7 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon icon={ExternalLink} size="sm" />
        {t("viewStore")}
      </Link>
    </aside>
  );
}
