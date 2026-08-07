import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import type { Product } from "@/src/domain/entities/Product";
import type { StockMovementReason } from "@/src/domain/entities/StockMovement";
import { Link } from "@/src/i18n/navigation";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatCompactDateTime } from "@/src/lib/formatOrderDate";
import { ListSortHeader } from "@/src/presentation/dashboard/list";
import type { StockMovementEntry } from "@/src/presentation/dashboard/products/stock-movement-response-schema";
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

import type { ReactNode } from "react";

type InventoryMovementsTableProps = {
  movements: StockMovementEntry[];
  products: Product[];
  toolbar?: ReactNode;
  footer?: ReactNode;
};

const REASON_VARIANT: Record<StockMovementReason, "success" | "warning" | "info" | "neutral"> = {
  restock: "success",
  shrinkage: "warning",
  correction: "neutral",
  sale: "info",
};

/** Compact visual reference; the full immutable id remains in the link and tooltip. */
function shortOrderReference(id: string): string {
  return id.split("-")[0]?.toUpperCase() ?? id;
}

/** Immutable movement ledger with running-balance arithmetic visible on every row. */
export async function InventoryMovementsTable({
  movements,
  products,
  toolbar,
  footer,
}: InventoryMovementsTableProps) {
  const t = await getTranslations("dashInventory");
  const tProducts = await getTranslations("dashProducts");
  const locale = (await getLocale());
  const productsById = new Map(products.map((product) => [product.id, product]));

  return (
    <DataTable toolbar={toolbar} footer={footer} minWidthClassName="min-w-[72rem]">
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("colProduct")}</TableHead>
            <TableHead className="text-end">{t("colChange")}</TableHead>
            <TableHead>{t("colStock")}</TableHead>
            <TableHead>{t("colReason")}</TableHead>
            <TableHead>{t("colSource")}</TableHead>
            <TableHead>{t("colActor")}</TableHead>
            <ListSortHeader sortKey="at" defaultSort="at" defaultDirection="desc" initialDirection="desc">
              {t("colDateTime")}
            </ListSortHeader>
          </tr>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const product = productsById.get(movement.productId);
            const added = movement.delta > 0;
            const quantityBefore = movement.quantityAfter - movement.delta;
            const timestamp = formatCompactDateTime(movement.at, locale);
            return (
              <TableRow key={movement.id}>
                <TableCell>
                  {product ? (
                    <Link href={`/dashboard/products/${product.id}/edit`} className="group flex items-center gap-3">
                      <Thumbnail as="span" className="size-10 shrink-0">
                        <Image src={product.imageUrl} alt="" width={40} height={40} className="size-full object-cover" />
                      </Thumbnail>
                      <span className="min-w-0">
                        <span className="block truncate text-body-b7 text-foreground underline-offset-2 group-hover:underline">
                          {product.name}
                        </span>
                        {product.unit ? <span className="block text-body-b10 text-muted-foreground">{product.unit}</span> : null}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-body-b8 text-muted-foreground">{t("movementsUnknownProduct")}</span>
                  )}
                </TableCell>
                <TableCell className="text-end">
                  <span dir="ltr" className={added ? "text-body-b7 text-success-foreground" : "text-body-b7 text-destructive"}>
                    {added ? "+" : "−"}{formatNumber(Math.abs(movement.delta), locale)}
                  </span>
                </TableCell>
                <TableCell dir="ltr" className="text-body-b7 text-foreground">
                  {formatNumber(quantityBefore, locale)} → {formatNumber(movement.quantityAfter, locale)}
                </TableCell>
                <TableCell>
                  <Badge variant={REASON_VARIANT[movement.reason]}>{tProducts(`adjustReason.${movement.reason}`)}</Badge>
                </TableCell>
                <TableCell className="text-body-b8">
                  {movement.orderId ? (
                    <Link href={`/dashboard/orders/${movement.orderId}`} className="text-primary underline-offset-4 hover:underline">
                      <span title={movement.orderId}>{t("orderReference", { id: shortOrderReference(movement.orderId) })}</span>
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">{t("manualAdjustment")}</span>
                  )}
                  {movement.note ? <span className="block max-w-48 truncate text-body-b10 text-muted-foreground">{movement.note}</span> : null}
                </TableCell>
                <TableCell className="text-body-b8 text-muted-foreground">
                  {movement.actorName ?? t("systemActor")}
                </TableCell>
                <TableCell>
                  <time dateTime={movement.at} className="text-body-b8 text-muted-foreground">
                    <span className="block">{timestamp.date}</span>
                    <span className="block text-body-b10">{timestamp.time}</span>
                  </time>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
