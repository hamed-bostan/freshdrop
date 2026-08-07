import { getTranslations } from "next-intl/server";

import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/utils";

export const INVENTORY_VIEWS = ["restock", "all", "movements"] as const;
export type InventoryView = (typeof INVENTORY_VIEWS)[number];

type InventoryTabsProps = {
  view: InventoryView;
  canViewMovements: boolean;
};

/** URL-backed inventory sections: each tab is a real, shareable server-rendered list. */
export async function InventoryTabs({ view, canViewMovements }: InventoryTabsProps) {
  const t = await getTranslations("dashInventory");
  const tabs: Array<{ value: InventoryView; href: string; label: string }> = [
    { value: "restock", href: "/dashboard/inventory", label: t("tabRestock") },
    { value: "all", href: "/dashboard/inventory?view=all", label: t("tabAll") },
    ...(canViewMovements
      ? [{ value: "movements" as const, href: "/dashboard/inventory?view=movements", label: t("tabMovements") }]
      : []),
  ];

  return (
    <nav aria-label={t("tabsAria")} className="flex gap-8 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.value === view;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-1 pb-3 text-body-b6 transition-colors hover:text-foreground",
              active
                ? "text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary"
                : "text-muted-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
