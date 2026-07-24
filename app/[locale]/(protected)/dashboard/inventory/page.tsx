import type { Product } from "@/src/domain/entities/Product";
import { InventoryScreen } from "@/src/presentation/dashboard/inventory/InventoryScreen";
import { inventoryServerApi } from "@/src/presentation/dashboard/inventory/inventory-server-api";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import type { StockMovementEntry } from "@/src/presentation/dashboard/products/stock-movement-response-schema";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";
import { toSearchParams } from "@/src/lib/api/searchParams";
import { auth } from "@/auth";
import { sessionHas } from "@/src/lib/require-permission";

// One page of the needs-restock list is fetched over the REST API (BFF) per
// request — never cached. The admin gate lives in the layout.
export const dynamic = "force-dynamic";

/** How many ledger entries the activity panel reads. */
const RECENT_MOVEMENTS_COUNT = 20;

type DashboardInventoryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The recent movements and the products they name, or two empty lists for a
 * viewer without `catalog.write` — the ledger read 401s for them, so this skips
 * the request rather than letting the screen fail to fetch it.
 */
async function readMovements(canWrite: boolean): Promise<[StockMovementEntry[], Product[]]> {
  if (!canWrite) return [[], []];

  const entries = await inventoryServerApi.listRecentMovements(RECENT_MOVEMENTS_COUNT);
  const products = await productsServerApi.listByIds([...new Set(entries.map((entry) => entry.productId))]);
  return [entries, products];
}

export default async function DashboardInventoryPage({ searchParams }: DashboardInventoryPageProps) {
  const params = toSearchParams(await searchParams);

  // `stock=needsRestock` is this page's whole reason to exist, not a filter a
  // query string may override — the same forced narrowing the low-stock
  // attention tile's link relies on. The page's own resting order is most
  // urgent first, unlike the catalog list's "newest first" — only applied when
  // the URL doesn't already name a sort (a reader who clicked "Name" keeps it).
  params.set("stock", "needsRestock");
  if (!params.has("sort")) params.set("sort", "stock");
  if (!params.has("dir")) params.set("dir", "asc");

  const canWrite = await auth().then((session) => sessionHas(session, "catalog.write"));

  // Reading the ledger needs `catalog.write` (see `inventory-server-api`), the
  // same permission the row-level adjust action needs — a viewer without it
  // gets the restock queue (a plain products read) but not the operator-only
  // activity trail.
  const [products, categories, [movements, movementProducts]] = await Promise.all([
    productsServerApi.listPage(params),
    categoriesServerApi.list(),
    readMovements(canWrite),
  ]);

  return (
    <InventoryScreen
      products={products}
      categories={categories}
      query={params.get("q") ?? undefined}
      canWrite={canWrite}
      movements={movements}
      movementProducts={movementProducts}
    />
  );
}
