import { ProductsScreen } from "@/src/presentation/dashboard/products/ProductsScreen";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";
import { parseAdminProductFilters } from "@/src/lib/api/admin-product-params";
import { toSearchParams } from "@/src/lib/api/searchParams";

// One page of products is fetched during server render over the REST API (BFF)
// and passed to the presentational screen. Search, filters, sorting and paging
// live in the query string, so changing any of them re-runs this render; so does
// a mutation's router.refresh(). The server stays the single source of truth. A
// failed fetch surfaces via the dashboard error boundary (error.tsx). The admin
// gate lives in the layout.
export const dynamic = "force-dynamic";

type DashboardProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardProductsPage({ searchParams }: DashboardProductsPageProps) {
  const params = toSearchParams(await searchParams);

  // The query string is forwarded to the API as-is; the screen gets the parsed
  // filters back only to tell "no products yet" from "nothing matched".
  const [products, categories] = await Promise.all([
    productsServerApi.listPage(params),
    categoriesServerApi.list(),
  ]);

  return (
    <ProductsScreen products={products} categories={categories} filters={parseAdminProductFilters(params)} />
  );
}
