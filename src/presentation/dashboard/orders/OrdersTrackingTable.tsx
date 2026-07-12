import { getTranslations } from "next-intl/server";
import type { Order } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { OrderRow } from "./OrderRow";

type OrdersTrackingTableProps = {
  orders: Order[];
  /** Customer summaries keyed by user id, for labelling each row with who placed it. */
  customersById: Map<string, CustomerOrderSummary>;
};

/** Column count including the leading disclosure column — the detail row spans all of them. */
const COLUMN_COUNT = 7;

/**
 * Admin list of orders. Each row expands to reveal the order's line items and
 * total (see OrderRow) and carries a per-row delivery-stage control for trackable
 * ones.
 */
export async function OrdersTrackingTable({ orders, customersById }: OrdersTrackingTableProps) {
  const t = await getTranslations("dashOrders");

  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <table className="w-full text-start">
        <thead className="bg-surface-sunken text-body-b8 text-muted-foreground">
          <tr>
            <th scope="col" className="w-10 px-4 py-3">
              <span className="sr-only">{t("colDetails")}</span>
            </th>
            <th scope="col" className="px-4 py-3">{t("colCustomer")}</th>
            <th scope="col" className="px-4 py-3">{t("colOrder")}</th>
            <th scope="col" className="px-4 py-3">{t("colStatus")}</th>
            <th scope="col" className="px-4 py-3">{t("colPlaced")}</th>
            <th scope="col" className="px-4 py-3">{t("colAddress")}</th>
            <th scope="col" className="px-4 py-3 text-end">{t("colStage")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order) => (
            // Every order's userId is present in the summaries (they're derived
            // from the same order history); OrderRow falls back to the raw id.
            <OrderRow
              key={order.id}
              order={order}
              customer={customersById.get(order.userId)}
              columnCount={COLUMN_COUNT}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
