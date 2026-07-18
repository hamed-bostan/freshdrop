import { getTranslations } from "next-intl/server";
import type { Order } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { DataGridBody, DataGridHeader, DataTable } from "@/src/presentation/design-system";
import { OrderRow, ORDERS_ROW_GRID } from "./OrderRow";

type OrdersTableProps = {
  orders: Order[];
  /** Customer summaries keyed by user id, for labelling each row with who placed it. */
  customersById: Map<string, CustomerOrderSummary>;
};

/**
 * The admin orders list — a flat table of linkable rows (see OrderRow). Built on a
 * shared CSS grid rather than a `<table>` so each whole row can be a single link to
 * its detail route; the header and rows share {@link ORDERS_ROW_GRID} to align. Scrolls
 * horizontally on narrow viewports rather than crushing the columns.
 */
export async function OrdersTable({ orders, customersById }: OrdersTableProps) {
  const t = await getTranslations("dashOrders");

  return (
    <DataTable minWidthClassName="min-w-[60rem]">
      <DataGridHeader template={ORDERS_ROW_GRID}>
        <span>{t("colCustomer")}</span>
        <span>{t("colOrder")}</span>
        <span>{t("colStatus")}</span>
        <span>{t("colPlaced")}</span>
        <span>{t("colAddress")}</span>
        <span className="text-end">{t("colTotal")}</span>
        <span aria-hidden className="w-4" />
      </DataGridHeader>
      <DataGridBody>
        {orders.map((order) => (
          // Every order's userId is present in the summaries (they're derived
          // from the same order history); OrderRow falls back to the raw id.
          <OrderRow key={order.id} order={order} customer={customersById.get(order.userId)} />
        ))}
      </DataGridBody>
    </DataTable>
  );
}
