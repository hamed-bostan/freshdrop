import { notFound } from "next/navigation";
import { GetCategoryById } from "@/src/domain/use-cases/categories/GetCategoryById";
import { categoryRepository } from "@/src/infrastructure/container";
import { CategoryForm } from "@/src/presentation/dashboard/categories/CategoryForm";

interface EditCategoryPageProps {
  params: Promise<{ id: string }>;
}

// Category looked up in Postgres at request time — render dynamically (no DB at build).
export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = await params;

  const category = await new GetCategoryById(categoryRepository).execute(id);
  if (!category) notFound();

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
