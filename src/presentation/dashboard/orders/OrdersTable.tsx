import { getTranslations } from "next-intl/server";

import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Order } from "@/src/domain/entities/Order";
import { BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import {
  DataTable,
  Table,
  TableBody,
  TableHead,
  TableHeader,
} from "@/src/presentation/design-system";

import { OrderMobileCard } from "./OrderMobileCard";
import { OrderRow } from "./OrderRow";

import type { ReactNode } from "react";

type OrdersTableProps = {
  orders: Order[];
  /** Customer summaries keyed by user id, for labelling each row with who placed it. */
  customersById: Map<string, CustomerOrderSummary>;
  /**
   * Whether this admin may act on orders. Drives the selection column: a reader
   * who can't apply a bulk action shouldn't be offered checkboxes that lead to a
   * bar of things they'll be refused.
   */
  canFulfill: boolean;
  /** Search, sorting, and filters attached to the table's upper edge. */
  toolbar?: ReactNode;
  /** Content shown inside the shared frame when the current query has no rows. */
  emptyState?: ReactNode;
  /** Pagination attached to the shared table frame. */
  footer?: ReactNode;
};

/**
 * The admin orders list.
 *
 * Real `<table>` markup, where this used to be a CSS grid. The grid existed for
 * one reason — a whole row could be a single link — and the row stopped being one
 * when it grew selection and an actions menu (see `OrderRow`). With that gone,
 * the semantic table is simply better: header cells are associated with their
 * columns for a screen reader, and the alignment the grid template was
 * hand-maintaining comes free.
 *
 * Switches to cards based on the available content width, including the sidebar.
 */
export async function OrdersTable({ orders, customersById, canFulfill, toolbar, emptyState, footer }: OrdersTableProps) {
  const t = await getTranslations("dashOrders");

  return (
    <DataTable className="min-w-0" toolbar={toolbar} footer={orders.length > 0 ? footer : undefined}>
      {orders.length > 0 ? (
        <>
          <div className="p-3 @min-[64rem]:hidden">
            {canFulfill && (
              <label className="mb-3 flex min-h-11 w-fit items-center gap-3 text-body-b8 font-medium text-muted-foreground">
                <BulkSelectAllCheckbox label={t("selectAllAria")} />
                {t("selectAllAria")}
              </label>
            )}
            <div className="grid min-w-0 grid-cols-1 gap-3 @min-[38rem]:grid-cols-2">
              {orders.map((order) => (
                <OrderMobileCard key={order.id} order={order} customer={customersById.get(order.userId)} canFulfill={canFulfill} />
              ))}
            </div>
          </div>
          <div className="hidden @min-[64rem]:block">
            <Table>
              <TableHeader>
                {/* The header is not a hoverable row; the shared `TableRow` hover would
                    otherwise make it look like something to click. */}
                <tr>
                  {canFulfill ? (
                    <TableHead className="w-10">
                      <label className="flex size-8 cursor-pointer items-center justify-center">
                        <BulkSelectAllCheckbox label={t("selectAllAria")} />
                      </label>
                    </TableHead>
                  ) : null}
                  <TableHead className="text-start">{t("colOrder")}</TableHead>
                  <TableHead className="text-start">{t("colCustomer")}</TableHead>
                  <TableHead className="text-start">{t("colStatus")}</TableHead>
                  <TableHead className="text-start">{t("colDelivery")}</TableHead>
                  <TableHead className="text-start">{t("colPlaced")}</TableHead>
                  <TableHead className="text-end">{t("colTotal")}</TableHead>
                  <TableHead className="text-end">{t("colActions")}</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  // Every order's userId is present in the summaries (they're derived
                  // from the same order history); OrderRow falls back to the raw id.
                  <OrderRow
                    key={order.id}
                    order={order}
                    customer={customersById.get(order.userId)}
                    canFulfill={canFulfill}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        emptyState
      )}
    </DataTable>
  );
}
