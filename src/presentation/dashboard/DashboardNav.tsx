"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";

/**
 * Top-level dashboard sections. Each lives under its own segment
 * (`/dashboard/categories`, `/dashboard/products`); the dashboard root just
 * redirects to Categories.
 */
const SECTIONS = [
  { href: "/dashboard/categories", labelKey: "navCategories" },
  { href: "/dashboard/products", labelKey: "navProducts" },
  { href: "/dashboard/orders", labelKey: "navOrders" },
  { href: "/dashboard/reviews", labelKey: "navReviews" },
] as const;

export function DashboardNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {SECTIONS.map((section) => {
        const active = pathname.startsWith(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-card-md px-3 py-1.5 text-body-b7 transition-colors",
              active
                ? "bg-surface-sunken text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(section.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
