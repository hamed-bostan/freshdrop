import { getLocale, getTranslations } from "next-intl/server";

import type { AdminProductSort } from "@/src/domain/entities/AdminProductFilters";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { BulkRowCheckbox, BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import { AdjustStockButton } from "@/src/presentation/dashboard/products/AdjustStockButton";
import { ProductThumbnail } from "@/src/presentation/dashboard/ProductThumbnail";
import {
  Badge,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";

import styles from "./inventory.module.css";
import { InventoryRowActions } from "./InventoryRowActions";

import type { InventoryView } from "./InventoryTabs";
import type { ReactNode } from "react";

type InventoryProductsTableProps = {
  products: Product[];
  categoryNames: Map<string, string>;
  view: Extract<InventoryView, "restock" | "all">;
  canWrite: boolean;
  canSelect?: boolean;
  toolbar?: ReactNode;
  bulkActions?: ReactNode;
  emptyState?: ReactNode;
  footer?: ReactNode;
};

const SORT_DEFAULTS: { defaultSort: AdminProductSort; defaultDirection: "asc" | "desc" } = {
  defaultSort: "stock",
  defaultDirection: "asc",
};

/** Inventory-focused product table: stock operations are primary; catalog operations are secondary. */
export async function InventoryProductsTable({
  products,
  categoryNames,
  view,
  canWrite,
  canSelect = false,
  toolbar,
  bulkActions,
  emptyState,
  footer,
}: InventoryProductsTableProps) {
  const t = await getTranslations("dashInventory");
  const tProducts = await getTranslations("dashProducts");
  const locale = await getLocale();

  return (
    <DataTable toolbar={toolbar} footer={products.length > 0 ? footer : undefined} className={styles.frame}>
      {bulkActions ? (
        <div className="[&:has(>div)]:border-b [&:has(>div)]:border-border [&:has(>div)]:p-4">
          {bulkActions}
        </div>
      ) : null}
      {products.length > 0 ? (
      <Table className={styles.table}>
        <TableHeader>
          <tr>
            {canSelect ? (
              <TableHead className={styles.selectionHeading}>
                <span className={styles.checkboxTarget}>
                  <BulkSelectAllCheckbox label={tProducts("selectAllAria")} />
                </span>
              </TableHead>
            ) : null}
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {t("colProduct")}
            </ListSortHeader>
            <TableHead className={styles.category}>{tProducts("colCategory")}</TableHead>
            <ListSortHeader className={styles.stockHeading} sortKey="stock" initialDirection="asc" {...SORT_DEFAULTS}>
              {t("colInventory")}
            </ListSortHeader>
            {canWrite ? <TableHead className={styles.actionsHeading}>{tProducts("colActions")}</TableHead> : null}
          </tr>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const stock = getStockStatus(product.stockQuantity);
            const categoryName = categoryNames.get(product.categoryId);
            const categoryHref = `/dashboard/inventory${view === "all" ? "?view=all&" : "?"}categoryId=${encodeURIComponent(product.categoryId)}`;
            return (
              <TableRow key={product.id}>
                {canSelect ? (
                  <TableCell className={styles.selection}>
                    <BulkRowCheckbox id={product.id} label={tProducts("selectRowAria", { name: product.name })} />
                  </TableCell>
                ) : null}
                <TableCell className={styles.product}>
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductThumbnail src={product.imageUrl} />
                    <div className="min-w-0">
                      <span className="block truncate text-body-b7 text-foreground">{product.name}</span>
                      {product.unit ? (
                        <span className="block truncate text-body-b10 text-muted-foreground">{product.unit}</span>
                      ) : null}
                      {categoryName ? (
                        <Link href={categoryHref} className={styles.tabletCategory}>{categoryName}</Link>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className={styles.category}>
                  <span className={styles.mobileLabel}>{tProducts("colCategory")}</span>
                  {categoryName ? (
                    <Link href={categoryHref} className="text-primary underline-offset-4 hover:underline">
                      {categoryName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={styles.mobileLabel}>{t("colInventory")}</span>
                  {stock.level === "out" ? (
                    <Badge variant="destructive">
                      {tProducts("outOfStockCount", { count: formatNumber(0, locale) })}
                    </Badge>
                  ) : stock.level === "low" ? (
                    <Badge variant="warning">
                      {tProducts("lowStock", { count: formatNumber(stock.quantity, locale) })}
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      {tProducts("inStock", { count: formatNumber(stock.quantity, locale) })}
                    </Badge>
                  )}
                </TableCell>
                {canWrite ? (
                  <TableCell className={styles.actions}>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <AdjustStockButton
                        id={product.id}
                        name={product.name}
                        stockQuantity={product.stockQuantity}
                        triggerLabel={tProducts("adjustTitle")}
                      />
                      <InventoryRowActions id={product.id} name={product.name} isPublished={product.isPublished} />
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      ) : (
        emptyState
      )}
    </DataTable>
  );
}
