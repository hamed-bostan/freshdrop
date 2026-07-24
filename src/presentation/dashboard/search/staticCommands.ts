import type { Permission } from "@/src/domain/entities/Permission";

/** A command the palette can run directly, alongside search hits. */
export type StaticCommand = {
  id: string;
  /** Key under `dashboard.search.commandLabels`. */
  labelKey: "createProduct" | "viewLowStock" | "goToOrders";
  href: string;
  needs: Permission;
};

/**
 * Fixed shortcuts shown in the palette regardless of what's typed — the reason
 * people keep reaching for ⌘K instead of the rail once they've found it.
 */
const STATIC_COMMANDS: readonly StaticCommand[] = [
  { id: "create-product", labelKey: "createProduct", href: "/dashboard/products/create", needs: "catalog.write" },
  { id: "view-low-stock", labelKey: "viewLowStock", href: "/dashboard/products?stock=low", needs: "dashboard.view" },
  { id: "go-to-orders", labelKey: "goToOrders", href: "/dashboard/orders", needs: "dashboard.view" },
];

/** Commands the caller's permissions allow — mirrors the nav's own gating (see `sections.ts`). */
export function staticCommandsFor(permissions: readonly Permission[]): StaticCommand[] {
  return STATIC_COMMANDS.filter((command) => permissions.includes(command.needs));
}
