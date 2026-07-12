import { hasProductSearchCriteria } from "@/src/domain/entities/ProductFilters";
import { parseProductFilters } from "@/src/lib/api/product-search-params";
import { categoriesServerApi } from "@/src/presentation/category/category-server-api";
import { productsServerApi } from "@/src/presentation/product/product-server-api";
import SearchResultsScreen from "@/src/presentation/search/SearchResultsScreen";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Results depend on the `?q=`/filter params, fetched from the REST API at request time.
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters = parseProductFilters(toSearchParams(await searchParams));
  const query = filters.query ?? "";

  const [products, categories] = await Promise.all([
    // Skip the round trip when there's nothing to search — an empty (or sort-only)
    // filter has no results, and a param-less request would list the whole catalog.
    hasProductSearchCriteria(filters) ? productsServerApi.search(filters) : Promise.resolve([]),
    categoriesServerApi.list(),
  ]);

  return (
    <SearchResultsScreen query={query} filters={filters} products={products} categories={categories} />
  );
}

/** Rebuild a `URLSearchParams` from Next's decoded searchParams, keeping repeated keys. */
function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value != null) params.set(key, value);
  }
  return params;
}
