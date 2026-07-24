import { getTranslations } from "next-intl/server";
import type { Category } from "@/src/domain/entities/Category";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Product } from "@/src/domain/entities/Product";
import { ListPager, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
import type { StockMovementEntry } from "@/src/presentation/dashboard/products/stock-movement-response-schema";
import { InventoryBulkRestock } from "./InventoryBulkRestock";
import { NeedsRestockTable } from "./NeedsRestockTable";
import { RecentMovementsPanel } from "./RecentMovementsPanel";

type InventoryScreenProps = {
  /** Products currently matching `stock=needsRestock`, ordered lowest-stock first by default. */
  products: Page<Product>;
  categories: Category[];
  /** The `q` the list was fetched with, if any — distinguishes "nothing needs restocking" from "no matches" below. */
  query?: string;
  /**
   * Whether the viewer may write to the catalog. Gates the checkboxes, the bulk
   * restock bar and the per-row adjust action — the same split `ProductsScreen`
   * makes. It also decides whether the movements panel was even fetched: reading
   * the ledger requires `catalog.write` (see `inventory-server-api`), so
   * `movements`/`movementProducts` are only ever non-empty when this is `true`.
   */
  canWrite: boolean;
  movements: StockMovementEntry[];
  /** The products `movements` names, for the panel's thumbnails and links. */
  movementProducts: Product[];
};

/**
 * The restocking operator's home: the queue that needs attention, the tool to
 * clear it a row (or a selection) at a time, and the ledger proving what already
 * happened — consolidated from where each used to live (a products-list filter,
 * a modal on that list, and a per-product panel nobody browsing stock levels
 * would think to open).
 *
 * Presentational and a server component, same discipline as `ProductsScreen`:
 * the needs-restock list is fetched over the BFF during render and paged/sorted
 * through the URL; a mutation still calls `router.refresh()` rather than
 * patching a local copy.
 */
export async function InventoryScreen({
  products,
  categories,
  query,
  canWrite,
  movements,
  movementProducts,
}: InventoryScreenProps) {
  const t = await getTranslations("dashInventory");
  const tList = await getTranslations("dashList");
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const isFiltered = Boolean(query);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("count", { count: products.total })}</p>
      </div>

      <ListToolbar search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />} />

      {products.items.length > 0 ? (
        <BulkSelectionProvider ids={products.items.map((product) => product.id)}>
          {canWrite ? (
            <BulkActionBar>
              <InventoryBulkRestock />
            </BulkActionBar>
          ) : null}
          <NeedsRestockTable products={products.items} categoryNames={categoryNames} canWrite={canWrite} />
          <ListPager page={products} />
        </BulkSelectionProvider>
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isFiltered ? tList("noResultsTitle") : t("emptyTitle")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isFiltered ? tList("noResultsBody") : t("emptyBody")}
          </p>
        </div>
      )}

      {canWrite ? <RecentMovementsPanel movements={movements} products={movementProducts} /> : null}
    </div>
  );
}
