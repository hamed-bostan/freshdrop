import { getTranslations } from "next-intl/server";
import type { Order } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { cn } from "@/src/lib/utils";
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
    <div className="overflow-hidden rounded-card-lg border border-border">
      <div className="overflow-x-auto">
        <div className="min-w-[60rem]">
          <div
            className={cn(
              ORDERS_ROW_GRID,
              "bg-surface-sunken px-4 py-3 text-body-b8 text-muted-foreground",
            )}
          >
            <span>{t("colCustomer")}</span>
            <span>{t("colOrder")}</span>
            <span>{t("colStatus")}</span>
            <span>{t("colPlaced")}</span>
            <span>{t("colAddress")}</span>
            <span className="text-end">{t("colTotal")}</span>
            <span aria-hidden className="w-4" />
          </div>
          <div className="divide-y divide-border">
            {orders.map((order) => (
              // Every order's userId is present in the summaries (they're derived
              // from the same order history); OrderRow falls back to the raw id.
              <OrderRow key={order.id} order={order} customer={customersById.get(order.userId)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
