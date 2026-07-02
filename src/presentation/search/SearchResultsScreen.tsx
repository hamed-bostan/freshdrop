import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import type { ProductFilters } from "@/src/domain/entities/ProductFilters";
import { hasProductSearchCriteria } from "@/src/domain/entities/ProductFilters";
import { PageHeader } from "@/src/presentation/components/PageHeader";
import { ProductGrid } from "@/src/presentation/product/components";
import { SearchExperience } from "./components/SearchExperience";

interface SearchResultsScreenProps {
  /** The active, trimmed search term (empty when browsing by filters alone). */
  query: string;
  /** The committed filters parsed from the URL — drives the toolbar's state. */
  filters: ProductFilters;
  products: Product[];
  /** Category options for the filter sheet. */
  categories: Category[];
}

/**
 * Presentational search-results screen. The server resolves `products` for the
 * query + filters and passes them in; this screen holds no data state. The
 * `SearchToolbar` (client) turns filter changes into `/search` navigations.
 */
export default function SearchResultsScreen({
  query,
  filters,
  products,
  categories,
}: SearchResultsScreenProps) {
  const hasCriteria = hasProductSearchCriteria(filters);
  const hasResults = products.length > 0;

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-6 pb-24">
      <PageHeader />

      <SearchExperience query={query} filters={filters} categories={categories}>
        {hasResults ? (
          <div className="flex flex-col gap-4">
            <p className="text-body-b6 text-muted-foreground">
              {products.length} {products.length === 1 ? "result" : "results"}
              {query ? ` for “${query}”` : ""}
            </p>
            <ProductGrid products={products} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 pt-16 text-center">
            <h2 className="text-heading-h4 text-foreground">
              {hasCriteria ? "No results found" : "Search the store"}
            </h2>
            <p className="text-body-b4 text-muted-foreground">
              {hasCriteria
                ? query
                  ? `We couldn't find anything for “${query}”. Try a different word or adjust your filters.`
                  : "Nothing matches those filters. Try loosening them."
                : "Type a product name to get started."}
            </p>
          </div>
        )}
      </SearchExperience>
    </div>
  );
}
