import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Pencil } from "lucide-react";
import type { AdminProductSort } from "@/src/domain/entities/AdminProductFilters";
import type { Product } from "@/src/domain/entities/Product";
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
import { BulkRowCheckbox, BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { AdjustStockButton } from "@/src/presentation/dashboard/products/AdjustStockButton";

type NeedsRestockTableProps = {
  /** The current page of the products list, already filtered to `stock=needsRestock`. */
  products: Product[];
  categoryNames: Map<string, string>;
  /** Drops the checkboxes, the adjust action and the edit link — the same read/write split `ProductsTable` makes. */
  canWrite: boolean;
};

/** This table's own resting order: most urgent (lowest stock) first, unlike the catalog list's "newest first". */
const SORT_DEFAULTS: { defaultSort: AdminProductSort; defaultDirection: "asc" | "desc" } = {
  defaultSort: "stock",
  defaultDirection: "asc",
};

/**
 * The restocking round's own table: every product `stock=needsRestock` matches
 * (low or out), ordered by how urgently it needs attention. Deliberately not
 * `ProductsTable` reused wholesale — price and the featured/visibility badges are
 * noise here, and stock is the one thing this screen is about, so it gets a
 * numeric column of its own instead of hiding inside a status badge.
 */
export async function NeedsRestockTable({ products, categoryNames, canWrite }: NeedsRestockTableProps) {
  const t = await getTranslations("dashInventory");
  const tProducts = await getTranslations("dashProducts");
  const locale = await getLocale();

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <tr>
            {canWrite ? (
              <TableHead className="w-10">
                <BulkSelectAllCheckbox label={tProducts("selectAllAria")} />
              </TableHead>
            ) : null}
            <TableHead>{tProducts("colImage")}</TableHead>
            <ListSortHeader sortKey="name" {...SORT_DEFAULTS}>
              {tProducts("colName")}
            </ListSortHeader>
            <TableHead>{tProducts("colCategory")}</TableHead>
            <ListSortHeader sortKey="stock" align="end" {...SORT_DEFAULTS}>
              {t("colStock")}
            </ListSortHeader>
            {canWrite ? <TableHead className="text-end">{tProducts("colActions")}</TableHead> : null}
          </tr>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const stock = getStockStatus(product.stockQuantity);
            return (
              <TableRow key={product.id}>
                {canWrite ? (
                  <TableCell>
                    <BulkRowCheckbox id={product.id} label={tProducts("selectRowAria", { name: product.name })} />
                  </TableCell>
                ) : null}
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
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-body-b7 text-foreground">{formatNumber(product.stockQuantity, locale)}</span>
                    {stock.level === "out" ? (
                      <Badge variant="destructive">{tProducts("outOfStock")}</Badge>
                    ) : stock.level === "low" ? (
                      <Badge variant="warning">{t("lowBadge")}</Badge>
                    ) : null}
                  </div>
                </TableCell>
                {canWrite ? (
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <AdjustStockButton id={product.id} name={product.name} stockQuantity={product.stockQuantity} />
                      <Button asChild variant="outline" size="sm" iconOnly aria-label={tProducts("edit")}>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Icon icon={Pencil} size="sm" />
                        </Link>
                      </Button>
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
