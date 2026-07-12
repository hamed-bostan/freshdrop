import { CategoryForm } from "@/src/presentation/dashboard/categories/CategoryForm";

export default function CreateCategoryPage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">New category</h1>
        <p className="text-body-b6 text-muted-foreground">Add a category to the store.</p>
      </div>
      <CategoryForm mode="create" />
    </div>
  );
}
