import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import type { Product } from "@/src/domain/entities/Product";
import { Badge, Button, Icon } from "@/src/presentation/design-system";
import { Link } from "@/src/i18n/navigation";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductsTableProps = {
  products: Product[];
  /** Category id → display name, for the Category column. */
  categoryNames: Map<string, string>;
};

/** Admin list of products with per-row edit + delete actions. */
export async function ProductsTable({ products, categoryNames }: ProductsTableProps) {
  const t = await getTranslations("dashProducts");

  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <table className="w-full text-left">
        <thead className="bg-surface-sunken text-body-b8 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">{t("colImage")}</th>
            <th scope="col" className="px-4 py-3">{t("colName")}</th>
            <th scope="col" className="px-4 py-3">{t("colCategory")}</th>
            <th scope="col" className="px-4 py-3 text-right">{t("colPrice")}</th>
            <th scope="col" className="px-4 py-3">{t("colFeatured")}</th>
            <th scope="col" className="px-4 py-3 text-right">{t("colActions")}</th>
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
                {product.isFeatured && <Badge variant="success">{t("featuredBadge")}</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="mr-1.5" />
                      {t("edit")}
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
