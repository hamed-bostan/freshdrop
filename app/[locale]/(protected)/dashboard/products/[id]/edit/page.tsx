import { notFound } from "next/navigation";
import { EditProductScreen } from "@/src/presentation/dashboard/products/EditProductScreen";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

// The product (and the category list for the picker) is fetched over the REST API
// (BFF) during server render; a missing product renders the not-found boundary.
// The screen is presentational from there.
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, translations] = await Promise.all([
    productsServerApi.getById(id),
    categoriesServerApi.list(),
    productsServerApi.getTranslations(id),
  ]);
  if (!product) notFound();

  return <EditProductScreen product={product} categories={categories} translations={translations} />;
}
