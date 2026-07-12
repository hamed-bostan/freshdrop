import { getTranslations } from "next-intl/server";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { ProductForm } from "./ProductForm";

/**
 * Edit screen. Presentational: the page fetches the product (and the category
 * list for the picker) over the REST API (BFF) during server render and passes
 * them in, then hands them to the shared `ProductForm`. A missing product is
 * handled upstream via `notFound()`.
 */
export async function EditProductScreen({ product, categories }: { product: Product; categories: Category[] }) {
  const t = await getTranslations("dashProducts");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("editHeading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("editSubtitle", { name: product.name })}</p>
      </div>
      <ProductForm mode="edit" product={product} categories={categories} />
    </div>
  );
}
