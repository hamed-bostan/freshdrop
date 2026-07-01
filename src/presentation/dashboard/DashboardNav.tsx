"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";

/**
 * Top-level dashboard sections. Each lives under its own segment
 * (`/dashboard/categories`, `/dashboard/products`); the dashboard root just
 * redirects to Categories.
 */
const SECTIONS = [
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/reviews", label: "Reviews" },
] as const;

export function DashboardNav() {
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
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
