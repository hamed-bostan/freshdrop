import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import {
  ADMIN_STOCK_FILTERS,
  type AdminProductFilters,
} from "@/src/domain/entities/AdminProductFilters";
import type { Page } from "@/src/domain/entities/Pagination";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { Button, Icon } from "@/src/presentation/design-system";
import { ListFilterSelect, ListPager, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";
import { Link } from "@/src/i18n/navigation";
import { ProductsTable } from "./ProductsTable";

type ProductsScreenProps = {
  /** One page of products plus the total behind it — the count in the header is that total, not the rows on screen. */
  products: Page<Product>;
  categories: Category[];
  /** The filters this page was fetched with, to distinguish "no products" from "no matches". */
  filters: AdminProductFilters;
};

/**
 * Admin products list. Presentational: the dashboard page fetches one page over
 * the REST API (BFF) during server render and passes it in. Search, filters,
 * sorting and paging all live in the URL, so changing any of them re-runs this
 * server render — and mutations still call `router.refresh()` (see
 * DeleteProductButton). Either way the server stays the single source of truth;
 * there's no client-side copy of the list.
 */
export async function ProductsScreen({ products, categories, filters }: ProductsScreenProps) {
  const t = await getTranslations("dashProducts");
  const tList = await getTranslations("dashList");
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  // An empty page means two different things, and they need different copy: a
  // catalog with nothing in it wants "create your first product", while a search
  // that matched nothing wants a way back to the full list.
  const isFiltered = filters.query != null || filters.categoryId != null || filters.stock != null;

  const stockLabels: Record<(typeof ADMIN_STOCK_FILTERS)[number], string> = {
    needsRestock: t("filterStockNeedsRestock"),
    in: t("filterStockIn"),
    low: t("filterStockLow"),
    out: t("filterStockOut"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("count", { count: products.total })}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/create">
            <Icon icon={Plus} size="sm" className="me-1.5" />
            {t("newProduct")}
          </Link>
        </Button>
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
          </>
        }
      />

      {products.items.length > 0 ? (
        <>
          <ProductsTable products={products.items} categoryNames={categoryNames} />
          <ListPager page={products} />
        </>
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
