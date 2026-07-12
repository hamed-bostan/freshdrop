import { categoriesServerApi } from "@/src/presentation/category/category-server-api";
import CategoryScreen from "@/src/presentation/category/CategoryScreen";

// Categories are fetched from the REST API at request time — render dynamically.
export const dynamic = "force-dynamic";

export default async function CategoryPage() {
  const categories = await categoriesServerApi.list();

  return <CategoryScreen categories={categories} />;
}
