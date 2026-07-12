import { CategoriesScreen } from "@/src/presentation/dashboard/categories/CategoriesScreen";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";

// Categories are fetched during server render over the REST API (BFF) and passed to
// the presentational screen. Mutations call router.refresh() to re-run this fetch,
// so the server stays the single source of truth. A failed fetch surfaces via the
// dashboard error boundary (error.tsx). The admin gate lives in the layout.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const categories = await categoriesServerApi.list();
  return <CategoriesScreen categories={categories} />;
}
