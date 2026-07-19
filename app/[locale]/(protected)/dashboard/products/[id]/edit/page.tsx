import { notFound } from "next/navigation";
import { DEFAULT_ACTIVITY_LIMIT } from "@/src/domain/entities/ActivityEntry";
import { EditProductScreen } from "@/src/presentation/dashboard/products/EditProductScreen";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";
import { activityServerApi } from "@/src/presentation/dashboard/activity/activity-server-api";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

// The product (and the category list for the picker) is fetched over the REST API
// (BFF) during server render; a missing product renders the not-found boundary.
// The screen is presentational from there.
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, translations, stockMovements, activity] = await Promise.all([
    productsServerApi.getById(id),
    categoriesServerApi.list(),
    productsServerApi.getTranslations(id),
    productsServerApi.listStockMovements(id),
    activityServerApi.listForEntity("product", id, DEFAULT_ACTIVITY_LIMIT),
  ]);
  if (!product) notFound();

  return (
    <EditProductScreen
      product={product}
      categories={categories}
      translations={translations}
      stockMovements={stockMovements}
      activity={activity}
    />
  );
}
