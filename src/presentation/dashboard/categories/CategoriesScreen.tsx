import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { ADMIN_CATEGORY_STATUSES, type AdminCategoryFilters } from "@/src/domain/entities/AdminCategoryFilters";
import type { Category } from "@/src/domain/entities/Category";
import type { Page } from "@/src/domain/entities/Pagination";
import { Button, Icon } from "@/src/presentation/design-system";
import { ListFilterSelect, ListSearchInput, ListToolbar } from "@/src/presentation/dashboard/list";
import { BulkActionBar, BulkSelectionProvider } from "@/src/presentation/dashboard/bulk";
import { Link } from "@/src/i18n/navigation";
import { CategoriesTable } from "./CategoriesTable";
import { CategoryBulkActions } from "./CategoryBulkActions";

type CategoriesScreenProps = {
  /** One page of categories — no pager: the list is fetched whole per filter. */
  categories: Page<Category>;
  /** The filters this page was fetched with, to distinguish "no categories" from "no matches". */
  filters: AdminCategoryFilters;
};

/**
 * Admin categories list. Presentational: the dashboard page fetches over the REST
 * API (BFF) during server render and passes the page in. Search and status filters
 * live in the URL, so changing either re-runs this server render — and mutations
 * still call `router.refresh()` (see DeleteCategoryButton). Either way the server
 * stays the single source of truth — no client-side data cache to keep in sync.
 */
export async function CategoriesScreen({ categories, filters }: CategoriesScreenProps) {
  const t = await getTranslations("dashCategories");
  const tList = await getTranslations("dashList");
  const isFiltered = filters.query != null || filters.status != null;
  // The list has no pager — one request is expected to return everything
  // matching the filter — so if the server had to cap the page at MAX_PAGE_SIZE
  // rows, say so instead of silently showing a partial list as if it were whole.
  const isTruncated = categories.items.length < categories.total;

  const statusLabels: Record<(typeof ADMIN_CATEGORY_STATUSES)[number], string> = {
    active: t("filterStatusActive"),
    inactive: t("filterStatusInactive"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          <p className="text-body-b6 text-muted-foreground">{t("count", { count: categories.total })}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/categories/create">
            <Icon icon={Plus} size="sm" className="me-1.5" />
            {t("newCategory")}
          </Link>
        </Button>
      </div>

      <ListToolbar
        search={<ListSearchInput label={t("searchLabel")} placeholder={t("searchPlaceholder")} />}
        filters={
          <ListFilterSelect
            paramName="status"
            label={t("filterStatusLabel")}
            options={[
              { value: "", label: t("filterStatusAll") },
              ...ADMIN_CATEGORY_STATUSES.map((status) => ({ value: status, label: statusLabels[status] })),
            ]}
          />
        }
      />

      {isTruncated && (
        <p className="text-body-b6 text-muted-foreground">
          {t("truncated", { shown: categories.items.length, total: categories.total })}
        </p>
      )}

      {categories.items.length > 0 ? (
        // The provider wraps both the bar and the table so a row's checkbox and
        // the actions above it share one selection. The rows stay server-
        // rendered inside it — only the checkboxes and the bar are client islands.
        <BulkSelectionProvider ids={categories.items.map((category) => category.id)}>
          <BulkActionBar>
            <CategoryBulkActions />
          </BulkActionBar>
          <CategoriesTable categories={categories.items} />
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
