import Link from "next/link";
import { Plus } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import { Button, Icon } from "@/src/presentation/design-system";
import { CategoriesTable } from "./CategoriesTable";

type CategoriesScreenProps = {
  categories: Category[];
};

/**
 * Admin categories list. Presentational: the dashboard page fetches over the REST
 * API (BFF) during server render and passes the list in. Mutations re-run this
 * server render via `router.refresh()` (see DeleteCategoryButton), so the server
 * stays the single source of truth — no client-side data cache to keep in sync.
 */
export function CategoriesScreen({ categories }: CategoriesScreenProps) {
  const count = categories.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">Categories</h1>
          <p className="text-body-b6 text-muted-foreground">
            {count} {count === 1 ? "category" : "categories"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/categories/create">
            <Icon icon={Plus} size="sm" className="mr-1.5" />
            New category
          </Link>
        </Button>
      </div>

      {count > 0 ? (
        <CategoriesTable categories={categories} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">No categories yet</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            Create your first category to get started.
          </p>
        </div>
      )}
    </div>
  );
}
