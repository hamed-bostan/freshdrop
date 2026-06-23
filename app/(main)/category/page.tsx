import { GetCategories } from "@/src/domain/use-cases/categories/GetCategories";
import { categoryRepository } from "@/src/infrastructure/container";
import CategoryScreen from "@/src/presentation/category/CategoryScreen";

export default async function CategoryPage() {
  const categories = await new GetCategories(categoryRepository).execute();

  return <CategoryScreen categories={categories} />;
}
