"use client";

import { BarChart3, ClipboardList, LayoutDashboard, MoreHorizontal, Package } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";
import { focusRing, Icon } from "@/src/presentation/design-system";

import { isSectionActive } from "./sections";

import type { LucideIcon } from "lucide-react";

type BottomNavItem = {
  href: string;
  labelKey: "dashboard" | "orders" | "products" | "analytics";
  icon: LucideIcon;
};

/**
 * The four sections a mobile viewer reaches for most, fixed rather than driven
 * by `sections.ts`: the rail's full, permission-filtered list belongs in the
 * drawer (the `More` tab opens it), not spread across five cramped icons. Every
 * viewer who can open the dashboard holds `dashboard.view`, which is all these
 * four need, so there is no permission check to thread through here.
 */
const ITEMS: readonly BottomNavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", labelKey: "orders", icon: ClipboardList },
  { href: "/dashboard/products", labelKey: "products", icon: Package },
  { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
];

type BottomNavProps = {
  /** Opens the same nav drawer the top bar's hamburger does — the `More` tab's whole list. */
  onOpenMore: () => void;
};

/**
 * Thumb-reach tab bar for phone-width viewports, standard in mobile
 * commerce/admin apps (Shopify, Etsy Seller) for the same reason a hamburger
 * drawer alone isn't: the sections used every day sit one tap away instead of
 * two (open drawer, then pick). It supplements the drawer rather than
 * replacing it — `More` opens the exact same `NavDrawer` the top bar's
 * hamburger does, so the full, permission-filtered section list still lives
 * in one place.
 *
 * Hidden at `lg` and up, the same breakpoint the persistent rail takes over
 * at, so exactly one of the two navigations is ever on screen.
 */
export function BottomNav({ onOpenMore }: BottomNavProps) {
  const t = useTranslations("dashboard.bottomNav");
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {ITEMS.map((item) => {
        const active = isSectionActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              focusRing,
              "flex flex-1 flex-col items-center gap-1 py-2 text-body-b11 transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon icon={item.icon} size="sm" />
            {t(item.labelKey)}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onOpenMore}
        aria-label={t("moreAria")}
        className={cn(
          focusRing,
          "flex flex-1 flex-col items-center gap-1 py-2 text-body-b11 text-muted-foreground transition-colors hover:text-foreground",
        )}
      >
        <Icon icon={MoreHorizontal} size="sm" />
        {t("more")}
      </button>
    </nav>
  );
}
