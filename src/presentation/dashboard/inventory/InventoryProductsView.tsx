import { getTranslations } from "next-intl/server";
import {
  ADMIN_STOCK_FILTERS,
  type AdminProductFilters,
} from "@/src/domain/entities/AdminProductFilters";
import type { Category } from "@/src/domain/entities/Category";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Product } from "@/src/domain/entities/Product";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
import {
  ListFilterSelect,
  ListPager,
  ListSearchInput,
  ListToolbar,
} from "@/src/presentation/dashboard/list";
import { InventoryBulkRestock } from "./InventoryBulkRestock";
import { InventoryProductsTable } from "./InventoryProductsTable";
import type { InventoryView } from "./InventoryTabs";

type InventoryProductsViewProps = {
  view: Extract<InventoryView, "restock" | "all">;
  products: Page<Product>;
  categories: Category[];
  filters: AdminProductFilters;
  canWrite: boolean;
};

/** Needs-restocking and all-inventory projections over the same product source. */
export async function InventoryProductsView({
  view,
  products,
  categories,
  filters,
  canWrite,
}: InventoryProductsViewProps) {
  const t = await getTranslations("dashInventory");
  const tProducts = await getTranslations("dashProducts");
  const tList = await getTranslations("dashList");
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const canSelect = canWrite && view === "restock";
  const isFiltered = Boolean(filters.query || filters.categoryId || (view === "all" && filters.stock));

  const stockLabels: Record<(typeof ADMIN_STOCK_FILTERS)[number], string> = {
    needsRestock: tProducts("filterStockNeedsRestock"),
    in: tProducts("filterStockIn"),
    low: tProducts("filterStockLow"),
    out: tProducts("filterStockOut"),
  };

  const toolbar = (
    <ListToolbar
      search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />}
      filters={
        <>
          <ListFilterSelect
            paramName="categoryId"
            label={tProducts("filterCategoryLabel")}
            options={[
              { value: "", label: tProducts("filterCategoryOption", { category: tProducts("filterCategoryAll") }) },
              ...categories.map((category) => ({
                value: category.id,
                label: tProducts("filterCategoryOption", { category: category.name }),
              })),
            ]}
          />
          {view === "all" ? (
            <ListFilterSelect
              paramName="stock"
              label={tProducts("filterStockLabel")}
              options={[
                { value: "", label: tProducts("filterStockOption", { stock: tProducts("filterStockAll") }) },
                ...ADMIN_STOCK_FILTERS.filter((level) => level !== "needsRestock").map((level) => ({
                  value: level,
                  label: tProducts("filterStockOption", { stock: stockLabels[level] }),
                })),
              ]}
            />
          ) : null}
        </>
      }
    />
  );

  if (products.items.length === 0) {
    return (
      <>
        {toolbar}
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">
            {isFiltered ? tList("noResultsTitle") : view === "restock" ? t("emptyTitle") : t("allEmptyTitle")}
          </p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            {isFiltered ? tList("noResultsBody") : view === "restock" ? t("emptyBody") : t("allEmptyBody")}
          </p>
        </div>
      </>
    );
  }

  const table = (
    <InventoryProductsTable
      products={products.items}
      categoryNames={categoryNames}
      view={view}
      canWrite={canWrite}
      canSelect={canSelect}
      toolbar={toolbar}
      footer={<ListPager page={products} />}
    />
  );

  if (!canSelect) return table;

  return (
    <BulkSelectionProvider ids={products.items.map((product) => product.id)}>
      <BulkActionBar>
        <InventoryBulkRestock />
      </BulkActionBar>
      {table}
    </BulkSelectionProvider>
  );
}
