import { getTranslations } from "next-intl/server";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import type { ProductTranslationInput } from "@/src/domain/repositories/IProductRepository";
import { ProductForm } from "./ProductForm";
import { StockMovementHistory } from "./StockMovementHistory";
import type { StockMovementEntry } from "./stock-movement-response-schema";
import { ActivityPanel } from "@/src/presentation/dashboard/activity/ActivityPanel";
import type { ActivityEntryWire } from "@/src/presentation/dashboard/activity/activity-response-schema";

/**
 * Edit screen. Presentational: the page fetches the product (and the category
 * list for the picker) over the REST API (BFF) during server render and passes
 * them in, then hands them to the shared `ProductForm`. A missing product is
 * handled upstream via `notFound()`.
 */
export async function EditProductScreen({
  product,
  categories,
  translations,
  stockMovements,
  activity,
}: {
  product: Product;
  categories: Category[];
  translations: ProductTranslationInput[];
  /** The product's recent stock movements, for the history panel under the form. */
  stockMovements: StockMovementEntry[];
  /** The product's recent admin activity, for the panel beneath the ledger. */
  activity: ActivityEntryWire[];
}) {
  const t = await getTranslations("dashProducts");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("editHeading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("editSubtitle", { name: product.name })}</p>
      </div>
      <ProductForm mode="edit" product={product} categories={categories} translations={translations} />
      {/* The ledger sits under the form, not inside it: the form is what this
          product *will* be, the history is what its stock has already done. */}
      <StockMovementHistory movements={stockMovements} />
      {/* And below that, everything *else* done to this product — renames, price
          moves, the edits the stock ledger has no column for. The two are separate
          panels rather than one merged feed because they answer different
          questions: the ledger reconciles a quantity, this attributes a change. */}
      <ActivityPanel entries={activity} />
    </div>
  );
}
