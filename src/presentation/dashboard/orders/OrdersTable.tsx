import { getTranslations } from "next-intl/server";
import type { Order } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import {
  DataTable,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/design-system";
import { BulkSelectAllCheckbox } from "@/src/presentation/dashboard/bulk";
import { OrderRow } from "./OrderRow";

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
};

/**
 * The admin orders list.
 *
 * Real `<table>` markup, where this used to be a CSS grid. The grid existed for
 * one reason — a whole row could be a single link — and the row stopped being one
 * when it grew a View button and an actions menu (see `OrderRow`). With that gone,
 * the semantic table is simply better: header cells are associated with their
 * columns for a screen reader, and the alignment the grid template was
 * hand-maintaining comes free.
 *
 * Scrolls horizontally rather than crushing seven columns on a narrow viewport.
 */
export async function OrdersTable({ orders, customersById, canFulfill }: OrdersTableProps) {
  const t = await getTranslations("dashOrders");

  return (
    <DataTable minWidthClassName="min-w-[64rem]">
      <Table>
        <TableHeader>
          {/* The header is not a hoverable row; the shared `TableRow` hover would
              otherwise make it look like something to click. */}
          <TableRow className="hover:bg-surface-sunken">
            {canFulfill ? (
              <TableHead className="w-10">
                <BulkSelectAllCheckbox label={t("selectAllAria")} />
              </TableHead>
            ) : null}
            <TableHead>{t("colOrder")}</TableHead>
            <TableHead>{t("colCustomer")}</TableHead>
            <TableHead>{t("colStatus")}</TableHead>
            <TableHead>{t("colDelivery")}</TableHead>
            <TableHead>{t("colPlaced")}</TableHead>
            <TableHead className="text-end">{t("colTotal")}</TableHead>
            <TableHead className="text-end">{t("colActions")}</TableHead>
          </TableRow>
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
    </DataTable>
  );
}
