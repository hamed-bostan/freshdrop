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
  const tabs: Array<{ value: InventoryView; href: string; label: string; mobileLabel: string }> = [
    { value: "restock", href: "/dashboard/inventory", label: t("tabRestock"), mobileLabel: t("tabRestockShort") },
    { value: "all", href: "/dashboard/inventory?view=all", label: t("tabAll"), mobileLabel: t("tabAllShort") },
    ...(canViewMovements
      ? [{ value: "movements" as const, href: "/dashboard/inventory?view=movements", label: t("tabMovements"), mobileLabel: t("tabMovementsShort") }]
      : []),
  ];

  return (
    <nav aria-label={t("tabsAria")} className="flex min-w-0 border-b border-border">
      {tabs.map((tab) => {
        const active = tab.value === view;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex min-h-11 min-w-0 flex-1 items-center justify-center border-b-2 px-2 py-2 text-center text-body-b8 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary sm:flex-none sm:px-5",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="whitespace-nowrap sm:hidden">{tab.mobileLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
