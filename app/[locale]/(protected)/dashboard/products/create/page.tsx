import { getTranslations } from "next-intl/server";
import { ProductForm } from "@/src/presentation/dashboard/products/ProductForm";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";

// The category list for the picker is fetched over the REST API (BFF) during
// server render. A failed fetch surfaces via the dashboard error boundary.
export const dynamic = "force-dynamic";

export default async function CreateProductPage() {
  const [categories, t] = await Promise.all([
    categoriesServerApi.list(),
    getTranslations("dashProducts"),
  ]);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("newProduct")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("createSubtitle")}</p>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
