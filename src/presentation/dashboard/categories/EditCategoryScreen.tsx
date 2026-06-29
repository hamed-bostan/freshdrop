import type { Category } from "@/src/domain/entities/Category";
import { CategoryForm } from "./CategoryForm";

/**
 * Edit screen. Presentational: the page fetches the category over the REST API
 * (BFF) during server render and passes it in, then hands it to the shared
 * `CategoryForm`. A missing category is handled upstream via `notFound()`.
 */
export function EditCategoryScreen({ category }: { category: Category }) {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">Edit category</h1>
        <p className="text-body-b6 text-muted-foreground">Update “{category.name}”.</p>
      </div>
      <CategoryForm mode="edit" category={category} />
    </div>
  );
}
