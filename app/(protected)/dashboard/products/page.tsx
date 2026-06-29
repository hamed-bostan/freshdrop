import { ProductsScreen } from "@/src/presentation/dashboard/products/ProductsScreen";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";

// Products are fetched during server render over the REST API (BFF) and passed to
// the presentational screen. Mutations call router.refresh() to re-run this fetch,
// so the server stays the single source of truth. A failed fetch surfaces via the
// dashboard error boundary (error.tsx). The admin gate lives in the layout.
export const dynamic = "force-dynamic";

export default async function DashboardProductsPage() {
  // Categories ride along for the per-row Category column; fetched in parallel.
  const [products, categories] = await Promise.all([productsServerApi.list(), categoriesServerApi.list()]);
  return <ProductsScreen products={products} categories={categories} />;
}
