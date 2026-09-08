import { Plus, Upload } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  ADMIN_STOCK_FILTERS,
  ADMIN_VISIBILITY_FILTERS,
  type AdminProductFilters,
} from "@/src/domain/entities/AdminProductFilters";
import type { Category } from "@/src/domain/entities/Category";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Product } from "@/src/domain/entities/Product";
import { Link } from "@/src/i18n/navigation";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
import { ListFilterSelect, ListPager, ListSearchInput } from "@/src/presentation/dashboard/list";
import { Button, Icon } from "@/src/presentation/design-system";

import { ProductBulkActions } from "./ProductBulkActions";
import { ProductsTable } from "./ProductsTable";

type ProductsScreenProps = {
  /** One page of products plus the total behind it — the count in the header is that total, not the rows on screen. */
  products: Page<Product>;
  categories: Category[];
  /** The filters this page was fetched with, to distinguish "no products" from "no matches". */
  filters: AdminProductFilters;
  /**
   * Whether the viewer may change the catalog. Decides which controls are drawn —
   * the list itself is readable by anyone with dashboard access. Presentation only:
   * the endpoints behind every control check for themselves.
   */
  canWrite: boolean;
};

/**
 * Admin products list. Presentational: the dashboard page fetches one page over
 * the REST API (BFF) during server render and passes it in. Search, filters,
 * sorting and paging all live in the URL, so changing any of them re-runs this
 * server render — and mutations still call `router.refresh()` (see
 * DeleteProductButton). Either way the server stays the single source of truth;
 * there's no client-side copy of the list.
 */
export async function ProductsScreen({ products, categories, filters, canWrite }: ProductsScreenProps) {
  const t = await getTranslations("dashProducts");
  const tList = await getTranslations("dashList");
  const tAnalytics = await getTranslations("dashAnalytics");
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  // An empty page means two different things, and they need different copy: a
  // catalog with nothing in it wants "create your first product", while a search
  // that matched nothing wants a way back to the full list.
  const isFiltered =
    filters.query != null ||
    filters.categoryId != null ||
    filters.stock != null ||
    filters.visibility != null;

  const stockLabels: Record<(typeof ADMIN_STOCK_FILTERS)[number], string> = {
    needsRestock: t("filterStockNeedsRestock"),
    in: t("filterStockIn"),
    low: t("filterStockLow"),
    out: t("filterStockOut"),
  };

  const visibilityLabels: Record<(typeof ADMIN_VISIBILITY_FILTERS)[number], string> = {
    published: t("filterVisibilityPublished"),
    unpublished: t("filterVisibilityUnpublished"),
  };

  return (
    <div className="@container/products flex min-w-0 flex-col gap-5">
      <div className="flex flex-col gap-4 @xl/products:flex-row @xl/products:items-center @xl/products:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("count", { count: products.total })}</p>
        </div>
        {canWrite ? (
          <div className="grid grid-cols-2 gap-2 @xl/products:flex @xl/products:items-center">
            <Button variant="outline" className="min-h-11 px-3" asChild>
              <Link href="/dashboard/products/import">
                <Icon icon={Upload} size="sm" className="me-1.5" />
                {t("importCsv")}
              </Link>
            </Button>
            <Button className="min-h-11 px-3" asChild>
              <Link href="/dashboard/products/create">
                <Icon icon={Plus} size="sm" className="me-1.5" />
                {t("newProduct")}
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {/* All controls that modify or export this dataset are attached to its
          table. Import and creation remain page-level catalog actions. */}
      <BulkSelectionProvider ids={products.items.map((product) => product.id)}>
        {products.items.length > 0 && canWrite ? (
            <BulkActionBar>
              <ProductBulkActions categories={categories} />
            </BulkActionBar>
        ) : null}
        <ProductsTable
          products={products.items}
          categoryNames={categoryNames}
          canWrite={canWrite}
          toolbar={(
            <section aria-label={t("searchLabel")} className="min-w-0 space-y-3">
              <ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} className="sm:max-w-none" />
              <div className="grid min-w-0 grid-cols-1 gap-2 border-t border-border pt-3 @sm/products:grid-cols-2 @3xl/products:grid-cols-4 [&>a]:min-h-11 [&>a]:justify-center">
                <ListFilterSelect
                  className="h-11 w-full min-w-0 truncate"
                  paramName="categoryId"
                  label={t("filterCategoryLabel")}
                  options={[
                    { value: "", label: t("filterCategoryOption", { category: t("filterCategoryAll") }) },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: t("filterCategoryOption", { category: category.name }),
                    })),
                  ]}
                />
                <ListFilterSelect
                  className="h-11 w-full min-w-0 truncate"
                  paramName="stock"
                  label={t("filterStockLabel")}
                  options={[
                    { value: "", label: t("filterStockOption", { stock: t("filterStockAll") }) },
                    ...ADMIN_STOCK_FILTERS.map((level) => ({
                      value: level,
                      label: t("filterStockOption", { stock: stockLabels[level] }),
                    })),
                  ]}
                />
                <ListFilterSelect
                  className="h-11 w-full min-w-0 truncate"
                  paramName="visibility"
                  label={t("filterVisibilityLabel")}
                  options={[
                    // "All" is the default and shows withdrawn products alongside
                    // live ones — the dashboard is where you go to find them again.
                    { value: "", label: t("filterVisibilityOption", { visibility: t("filterVisibilityAll") }) },
                    ...ADMIN_VISIBILITY_FILTERS.map((value) => ({
                      value,
                      label: t("filterVisibilityOption", { visibility: visibilityLabels[value] }),
                    })),
                  ]}
                />
                {/* Carries the current query string, so `?stock=needsRestock`
                    exports the restocking round rather than the whole catalog. */}
                <ExportCsvLink resource="products" label={tAnalytics("exportCsv")} />
              </div>
            </section>
          )}
          emptyState={(
            <div className="px-6 py-16 text-center">
              <p className="text-body-b4 text-foreground">
                {isFiltered ? tList("noResultsTitle") : t("emptyTitle")}
              </p>
              <p className="mt-1 text-body-b6 text-muted-foreground">
                {isFiltered ? tList("noResultsBody") : t("emptyBody")}
              </p>
            </div>
          )}
          footer={<ListPager page={products} />}
        />
      </BulkSelectionProvider>
    </div>
  );
}
