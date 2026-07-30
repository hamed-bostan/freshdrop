import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  DEFAULT_STOCK_MOVEMENT_DIRECTION,
  DEFAULT_STOCK_MOVEMENT_SORT,
} from "@/src/domain/entities/StockMovement";
import { toSearchParams } from "@/src/lib/api/searchParams";
import { parseAdminProductFilters } from "@/src/lib/api/admin-product-params";
import { parseAdminStockMovementFilters } from "@/src/lib/api/admin-stock-movement-params";
import { sessionHas } from "@/src/lib/require-permission";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";
import { InventoryScreen } from "@/src/presentation/dashboard/inventory/InventoryScreen";
import { inventoryServerApi } from "@/src/presentation/dashboard/inventory/inventory-server-api";
import type { InventoryView } from "@/src/presentation/dashboard/inventory/InventoryTabs";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";

export const dynamic = "force-dynamic";

type DashboardInventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function inventoryView(value: string | null): InventoryView {
  return value === "all" || value === "movements" ? value : "restock";
}

export default async function DashboardInventoryPage({ searchParams }: DashboardInventoryPageProps) {
  const params = toSearchParams(await searchParams);
  const view = inventoryView(params.get("view"));
  const canWrite = await auth().then((session) => sessionHas(session, "catalog.write"));

  // The ledger names operators and is protected by `catalog.write`. A pasted URL
  // never leaks it to a read-only viewer; it returns them to the visible queue.
  if (view === "movements" && !canWrite) redirect("/dashboard/inventory");

  if (view === "movements") {
    if (!params.has("sort")) params.set("sort", DEFAULT_STOCK_MOVEMENT_SORT);
    if (!params.has("dir")) params.set("dir", DEFAULT_STOCK_MOVEMENT_DIRECTION);
    const movements = await inventoryServerApi.listMovementsPage(params);
    const movementProducts = await productsServerApi.listByIds([
      ...new Set(movements.items.map((entry) => entry.productId)),
    ]);

    return (
      <InventoryScreen
        canWrite={canWrite}
        data={{
          view,
          movements,
          movementProducts,
          movementFilters: parseAdminStockMovementFilters(params),
        }}
      />
    );
  }

  // Both product projections use inventory-first ordering. The restocking queue
  // owns its stock predicate, so a query string cannot accidentally widen it.
  if (view === "restock") params.set("stock", "needsRestock");
  if (!params.has("sort")) params.set("sort", "stock");
  if (!params.has("dir")) params.set("dir", "asc");

  const [products, categories] = await Promise.all([
    productsServerApi.listPage(params),
    categoriesServerApi.list(),
  ]);

  return (
    <InventoryScreen
      canWrite={canWrite}
      data={{
        view,
        products,
        categories,
        filters: parseAdminProductFilters(params),
      }}
    />
  );
}
