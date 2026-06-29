import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import type { Product } from "@/src/domain/entities/Product";
import { Badge, Button, Icon } from "@/src/presentation/design-system";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductsTableProps = {
  products: Product[];
  /** Category id → display name, for the Category column. */
  categoryNames: Map<string, string>;
};

/** Admin list of products with per-row edit + delete actions. */
export function ProductsTable({ products, categoryNames }: ProductsTableProps) {
  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <table className="w-full text-left">
        <thead className="bg-surface-sunken text-body-b8 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Image</th>
            <th scope="col" className="px-4 py-3">Name</th>
            <th scope="col" className="px-4 py-3">Category</th>
            <th scope="col" className="px-4 py-3 text-right">Price</th>
            <th scope="col" className="px-4 py-3">Featured</th>
            <th scope="col" className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => (
            <tr key={product.id} className="bg-background">
              <td className="px-4 py-3">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-card-md bg-surface-sunken">
                  <Image src={product.imageUrl} alt="" width={40} height={40} className="size-full object-cover" />
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-body-b7 text-foreground">{product.name}</span>
                {product.unit && <span className="block text-body-b10 text-muted-foreground">{product.unit}</span>}
              </td>
              <td className="px-4 py-3 text-body-b6 text-muted-foreground">
                {categoryNames.get(product.categoryId) ?? "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="text-body-b7 text-foreground">${product.price.toFixed(2)}</span>
                {product.originalPrice != null && (
                  <span className="block text-body-b10 text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {product.isFeatured && <Badge variant="success">Featured</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="mr-1.5" />
                      Edit
                    </Link>
                  </Button>
                  <DeleteProductButton id={product.id} name={product.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
