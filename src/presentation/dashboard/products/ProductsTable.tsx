import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import {
  DEFAULT_ADMIN_PRODUCT_DIRECTION,
  DEFAULT_ADMIN_PRODUCT_SORT,
} from "@/src/domain/entities/AdminProductFilters";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import { Link } from "@/src/i18n/navigation";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { BulkRowCheckbox, BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import {
  Badge,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Thumbnail,
} from "@/src/presentation/design-system";

import { ProductRowActions } from "./ProductRowActions";

import type { ReactNode } from "react";

type ProductsTableProps = {
  products: Product[];
  /** Category id to localized display name. */
  categoryNames: Map<string, string>;
  canWrite: boolean;
  footer?: ReactNode;
};

const SORT_DEFAULTS = {
  defaultSort: DEFAULT_ADMIN_PRODUCT_SORT,
  defaultDirection: DEFAULT_ADMIN_PRODUCT_DIRECTION,
} as const;

/** Product management list with explicit inventory and publication state. */
export async function ProductsTable({ products, categoryNames, canWrite, footer }: ProductsTableProps) {
  const t = await getTranslations("dashProducts");
  const locale = await getLocale();

  return (
    <DataTable footer={footer}>
      <Table>
        <TableHeader>
          <tr>
            {canWrite ? (
              <TableHead className="w-10">
                <BulkSelectAllCheckbox label={t("selectAllAria")} />
              </TableHead>
            ) : null}
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {t("colProduct")}
            </ListSortHeader>
            <TableHead>{t("colCategory")}</TableHead>
            <ListSortHeader sortKey="price" align="end" initialDirection="desc" {...SORT_DEFAULTS}>
              {t("colPrice")}
            </ListSortHeader>
            <ListSortHeader sortKey="stock" initialDirection="asc" {...SORT_DEFAULTS}>
              {t("colInventory")}
            </ListSortHeader>
            <TableHead>{t("colVisibility")}</TableHead>
            {canWrite ? <TableHead className="text-end">{t("colActions")}</TableHead> : null}
          </tr>
        </TableHeader>

        <TableBody>
          {products.map((product) => {
            const stock = getStockStatus(product.stockQuantity);
            const categoryName = categoryNames.get(product.categoryId);

            return (
              <TableRow key={product.id}>
                {canWrite ? (
                  <TableCell>
                    <BulkRowCheckbox id={product.id} label={t("selectRowAria", { name: product.name })} />
                  </TableCell>
                ) : null}

                <TableCell>
                  <div className="flex items-center gap-3">
                    <Thumbnail className="size-10">
                      <Image src={product.imageUrl} alt="" width={40} height={40} className="size-full object-cover" />
                    </Thumbnail>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-body-b7 text-foreground">{product.name}</span>
                        {product.isFeatured ? <Badge variant="success">{t("featuredBadge")}</Badge> : null}
                      </div>
                      {product.unit ? (
                        <span className="block truncate text-body-b10 text-muted-foreground">{product.unit}</span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-body-b6">
                  {categoryName ? (
                    <Link
                      href={`/dashboard/products?categoryId=${encodeURIComponent(product.categoryId)}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {categoryName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell className="text-end">
                  <span className="text-body-b7 text-foreground">{formatMoney(product.price, locale)}</span>
                  {product.originalPrice != null ? (
                    <span className="block text-body-b10 text-muted-foreground line-through">
                      {formatMoney(product.originalPrice, locale)}
                    </span>
                  ) : null}
                </TableCell>

                <TableCell>
                  {stock.level === "out" ? (
                    <Badge variant="destructive">{t("outOfStockCount", { count: formatNumber(0, locale) })}</Badge>
                  ) : stock.level === "low" ? (
                    <Badge variant="warning">{t("lowStock", { count: formatNumber(stock.quantity, locale) })}</Badge>
                  ) : (
                    <Badge variant="success">{t("inStock", { count: formatNumber(stock.quantity, locale) })}</Badge>
                  )}
                </TableCell>

                <TableCell>
                  <Badge variant={product.isPublished ? "success" : "neutral"}>
                    {product.isPublished ? t("publishedBadge") : t("unpublishedBadge")}
                  </Badge>
                </TableCell>

                {canWrite ? (
                  <TableCell>
                    <div className="flex justify-end">
                      <ProductRowActions
                        id={product.id}
                        name={product.name}
                        stockQuantity={product.stockQuantity}
                        isPublished={product.isPublished}
                      />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
