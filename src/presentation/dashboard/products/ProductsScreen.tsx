import Link from "next/link";
import { Plus } from "lucide-react";
import type { Category } from "@/src/domain/entities/Category";
import type { Product } from "@/src/domain/entities/Product";
import { Button, Icon } from "@/src/presentation/design-system";
import { ProductsTable } from "./ProductsTable";

type ProductsScreenProps = {
  products: Product[];
  categories: Category[];
};

/**
 * Admin products list. Presentational: the dashboard page fetches over the REST
 * API (BFF) during server render and passes the data in. Mutations re-run this
 * server render via `router.refresh()` (see DeleteProductButton), so the server
 * stays the single source of truth — no client-side data cache to keep in sync.
 */
export function ProductsScreen({ products, categories }: ProductsScreenProps) {
  const count = products.length;
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-h2 text-foreground">Products</h1>
          <p className="text-body-b6 text-muted-foreground">
            {count} {count === 1 ? "product" : "products"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/create">
            <Icon icon={Plus} size="sm" className="mr-1.5" />
            New product
          </Link>
        </Button>
      </div>

      {count > 0 ? (
        <ProductsTable products={products} categoryNames={categoryNames} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">No products yet</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            Create your first product to get started.
          </p>
        </div>
      )}
    </div>
  );
}
