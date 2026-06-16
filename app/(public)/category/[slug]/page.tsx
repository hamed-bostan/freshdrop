import { notFound } from "next/navigation";
import { GetCategoryBySlug } from "@/src/domain/use-cases/categories/GetCategoryBySlug";
import { GetProductsByCategory } from "@/src/domain/use-cases/products/GetProductsByCategory";
import { categoryRepository, productRepository } from "@/src/infrastructure/container";
import CategoryDetailScreen from "@/src/presentation/category/CategoryDetailScreen";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = await params;

  const category = await new GetCategoryBySlug(categoryRepository).execute(slug);
  if (!category) notFound();

  const products = await new GetProductsByCategory(productRepository).execute(category.id);

  return <CategoryDetailScreen category={category} products={products} />;
}
