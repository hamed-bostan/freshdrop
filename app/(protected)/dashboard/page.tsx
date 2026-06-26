import Link from "next/link";
import { Plus } from "lucide-react";
import { GetCategories } from "@/src/domain/use-cases/categories/GetCategories";
import { categoryRepository } from "@/src/infrastructure/container";
import { Button, Icon } from "@/src/presentation/design-system";
import { CategoriesTable } from "@/src/presentation/dashboard/categories/CategoriesTable";

// Categories are read from Postgres at request time — render dynamically.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const categories = await new GetCategories(categoryRepository).execute();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">Categories</h1>
          <p className="text-body-b6 text-muted-foreground">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/create">
            <Icon icon={Plus} size="sm" className="mr-1.5" />
            New category
          </Link>
        </Button>
      </div>

      {categories.length > 0 ? (
        <CategoriesTable categories={categories} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">No categories yet</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">Create your first category to get started.</p>
        </div>
      )}
    </div>
  );
}
