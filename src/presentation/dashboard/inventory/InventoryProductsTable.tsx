import Image from "next/image";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import type { AdminProductSort } from "@/src/domain/entities/AdminProductFilters";
import type { Product } from "@/src/domain/entities/Product";
import { getStockStatus } from "@/src/domain/entities/stock";
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
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import { BulkRowCheckbox, BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { AdjustStockButton } from "@/src/presentation/dashboard/products/AdjustStockButton";
import type { InventoryView } from "./InventoryTabs";
import { InventoryRowActions } from "./InventoryRowActions";

type InventoryProductsTableProps = {
  products: Product[];
  categoryNames: Map<string, string>;
  view: Extract<InventoryView, "restock" | "all">;
  canWrite: boolean;
  canSelect?: boolean;
  toolbar?: ReactNode;
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
  footer,
}: InventoryProductsTableProps) {
  const t = await getTranslations("dashInventory");
  const tProducts = await getTranslations("dashProducts");
  const locale = await getLocale();

  return (
    <DataTable toolbar={toolbar} footer={footer} minWidthClassName="min-w-[52rem]">
      <Table>
        <TableHeader>
          <tr>
            {canSelect ? (
              <TableHead className="w-10">
                <BulkSelectAllCheckbox label={tProducts("selectAllAria")} />
              </TableHead>
            ) : null}
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {t("colProduct")}
            </ListSortHeader>
            <TableHead>{tProducts("colCategory")}</TableHead>
            <ListSortHeader sortKey="stock" initialDirection="asc" {...SORT_DEFAULTS}>
              {t("colInventory")}
            </ListSortHeader>
            {canWrite ? <TableHead className="text-end">{tProducts("colActions")}</TableHead> : null}
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
                  <TableCell>
                    <BulkRowCheckbox id={product.id} label={tProducts("selectRowAria", { name: product.name })} />
                  </TableCell>
                ) : null}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Thumbnail className="size-10 shrink-0">
                      <Image src={product.imageUrl} alt="" width={40} height={40} className="size-full object-cover" />
                    </Thumbnail>
                    <div className="min-w-0">
                      <span className="block truncate text-body-b7 text-foreground">{product.name}</span>
                      {product.unit ? (
                        <span className="block truncate text-body-b10 text-muted-foreground">{product.unit}</span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-body-b6">
                  {categoryName ? (
                    <Link href={categoryHref} className="text-primary underline-offset-4 hover:underline">
                      {categoryName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
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
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
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
    </DataTable>
  );
}
