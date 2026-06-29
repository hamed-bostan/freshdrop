import { notFound } from "next/navigation";
import { categoriesServerApi } from "@/src/presentation/category/category-server-api";
import { productServerApi } from "@/src/presentation/product/product-server-api";
import CategoryDetailScreen from "@/src/presentation/category/CategoryDetailScreen";

interface CategoryDetailPageProps {
  params: Promise<{ slug: string }>;
}

// Category + products are fetched from the REST API at request time — render dynamically.
export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { slug } = await params;

  const category = await categoriesServerApi.getBySlug(slug);
  if (!category) notFound();

  const products = await productServerApi.getByCategory(category.id);

  return <CategoryDetailScreen category={category} products={products} />;
}
