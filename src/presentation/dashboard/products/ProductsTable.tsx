import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import type { Product } from "@/src/domain/entities/Product";
import {
  DEFAULT_ADMIN_PRODUCT_DIRECTION,
  DEFAULT_ADMIN_PRODUCT_SORT,
} from "@/src/domain/entities/AdminProductFilters";
import { getStockStatus } from "@/src/domain/entities/stock";
import {
  Badge,
  Button,
  DataTable,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Thumbnail,
} from "@/src/presentation/design-system";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { AdjustStockButton } from "./AdjustStockButton";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductsTableProps = {
  /** The rows of the current page; the screen owns the page/total and the pager. */
  products: Product[];
  /** Category id → display name, for the Category column. */
  categoryNames: Map<string, string>;
};

/**
 * The list's own default ordering, passed to every sortable header so an
 * untouched table leaves `sort`/`dir` out of the URL entirely.
 */
const SORT_DEFAULTS = {
  defaultSort: DEFAULT_ADMIN_PRODUCT_SORT,
  defaultDirection: DEFAULT_ADMIN_PRODUCT_DIRECTION,
} as const;

/** Admin list of products with per-row edit + delete actions. */
export async function ProductsTable({ products, categoryNames }: ProductsTableProps) {
  const t = await getTranslations("dashProducts");
  const locale = await getLocale();

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("colImage")}</TableHead>
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {t("colName")}
            </ListSortHeader>
            {/* Category is a filter, not a sort: ordering by a foreign key would
                group rows under ids nobody recognises. */}
            <TableHead>{t("colCategory")}</TableHead>
            <ListSortHeader sortKey="price" align="end" initialDirection="desc" {...SORT_DEFAULTS}>
              {t("colPrice")}
            </ListSortHeader>
            {/* Status shows featured + stock badges; only stock is orderable, and
                ascending first so a click surfaces what needs restocking. */}
            <ListSortHeader sortKey="stock" initialDirection="asc" {...SORT_DEFAULTS}>
              {t("colStatus")}
            </ListSortHeader>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const stock = getStockStatus(product.stockQuantity);
            return (
            <TableRow key={product.id}>
              <TableCell>
                <Thumbnail className="size-10">
                  <Image src={product.imageUrl} alt="" width={40} height={40} className="size-full object-cover" />
                </Thumbnail>
              </TableCell>
              <TableCell>
                <span className="text-body-b7 text-foreground">{product.name}</span>
                {product.unit && <span className="block text-body-b10 text-muted-foreground">{product.unit}</span>}
              </TableCell>
              <TableCell className="text-body-b6 text-muted-foreground">
                {categoryNames.get(product.categoryId) ?? "—"}
              </TableCell>
              <TableCell className="text-end">
                <span className="text-body-b7 text-foreground">{formatMoney(product.price, locale)}</span>
                {product.originalPrice != null && (
                  <span className="block text-body-b10 text-muted-foreground line-through">
                    {formatMoney(product.originalPrice, locale)}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  {product.isFeatured && <Badge variant="success">{t("featuredBadge")}</Badge>}
                  {stock.level === "out" && <Badge variant="destructive">{t("outOfStock")}</Badge>}
                  {stock.level === "low" && (
                    <Badge variant="warning">{t("lowStock", { count: formatNumber(stock.quantity, locale) })}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-2">
                  {/* Stock adjust sits first among the actions: it's the one an
                      operator reaches for repeatedly (a delivery arrives, a crate
                      is damaged), where editing a product is occasional. */}
                  <AdjustStockButton
                    id={product.id}
                    name={product.name}
                    stockQuantity={product.stockQuantity}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Icon icon={Pencil} size="sm" className="me-1.5" />
                      {t("edit")}
                    </Link>
                  </Button>
                  <DeleteProductButton id={product.id} name={product.name} />
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
