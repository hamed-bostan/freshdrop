import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import {
  ADMIN_STOCK_FILTERS,
  ADMIN_VISIBILITY_FILTERS,
  type AdminProductFilters,
} from "@/src/domain/entities/AdminProductFilters";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { Button, Icon } from "@/src/presentation/design-system";
import { ListFilterSelect, ListPager, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";
import { ExportCsvLink } from "@/src/presentation/dashboard/analytics/ExportCsvLink";
import { Link } from "@/src/i18n/navigation";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("count", { count: products.total })}</p>
        </div>
        {canWrite ? (
          <Button asChild>
            <Link href="/dashboard/products/create">
              <Icon icon={Plus} size="sm" className="me-1.5" />
              {t("newProduct")}
            </Link>
          </Button>
        ) : null}
      </div>

      <ListToolbar
        search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />}
        filters={
          <>
            <ListFilterSelect
              paramName="categoryId"
              label={t("filterCategoryLabel")}
              options={[
                { value: "", label: t("filterCategoryAll") },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
            <ListFilterSelect
              paramName="stock"
              label={t("filterStockLabel")}
              options={[
                { value: "", label: t("filterStockAll") },
                ...ADMIN_STOCK_FILTERS.map((level) => ({ value: level, label: stockLabels[level] })),
              ]}
            />
            <ListFilterSelect
              paramName="visibility"
              label={t("filterVisibilityLabel")}
              options={[
                // "All" is the default and shows withdrawn products alongside live
                // ones — the dashboard is where you go to find them again.
                { value: "", label: t("filterVisibilityAll") },
                ...ADMIN_VISIBILITY_FILTERS.map((value) => ({ value, label: visibilityLabels[value] })),
              ]}
            />
            {/* Carries the current query string, so `?stock=needsRestock` exports
                the restocking round rather than the whole catalog. */}
            <ExportCsvLink resource="products" label={tAnalytics("exportCsv")} />
          </>
        }
      />

      {products.items.length > 0 ? (
        // The provider wraps both the bar and the table so a row's checkbox and the
        // actions above it share one selection. The rows stay server-rendered
        // inside it — only the checkboxes and the bar are client islands.
        <BulkSelectionProvider ids={products.items.map((product) => product.id)}>
          {canWrite ? (
            <BulkActionBar>
              {({ selected, onDone }) => (
                <ProductBulkActions selected={selected} onDone={onDone} categories={categories} />
              )}
            </BulkActionBar>
          ) : null}
          <ProductsTable products={products.items} categoryNames={categoryNames} canWrite={canWrite} />
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
    </div>
  );
}
