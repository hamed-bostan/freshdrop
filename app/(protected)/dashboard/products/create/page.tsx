import { ProductForm } from "@/src/presentation/dashboard/products/ProductForm";
import { categoriesServerApi } from "@/src/presentation/dashboard/categories/category-server-api";

// The category list for the picker is fetched over the REST API (BFF) during
// server render. A failed fetch surfaces via the dashboard error boundary.
export const dynamic = "force-dynamic";

export default async function CreateProductPage() {
  const categories = await categoriesServerApi.list();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">New product</h1>
        <p className="text-body-b6 text-muted-foreground">Add a product to the store.</p>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
