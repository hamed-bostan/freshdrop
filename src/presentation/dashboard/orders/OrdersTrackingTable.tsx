import type { Order } from "@/src/domain/entities/Order";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatOrderDate } from "@/src/lib/formatOrderDate";
import { OrderStageSelect } from "./OrderStageSelect";

type OrdersTrackingTableProps = {
  orders: Order[];
};

/** An order is trackable while it's live and not cancelled — mirrors the tracking repo's rule. */
function isTrackable(order: Order): boolean {
  return order.phase === "current" && order.status !== "cancelled";
}

/** Admin list of orders with a per-row delivery-stage control for trackable ones. */
export function OrdersTrackingTable({ orders }: OrdersTrackingTableProps) {
  return (
    <div className="overflow-hidden rounded-card-lg border border-border">
      <table className="w-full text-left">
        <thead className="bg-surface-sunken text-body-b8 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3">Order</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Placed</th>
            <th scope="col" className="px-4 py-3">Address</th>
            <th scope="col" className="px-4 py-3 text-right">Delivery stage</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((order) => (
            <tr key={order.id} className="bg-background">
              <td className="px-4 py-3 text-body-b7 text-foreground">{order.id}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-body-b6 text-muted-foreground">
                {formatOrderDate(order.placedAt)}
              </td>
              <td className="px-4 py-3 text-body-b6 text-muted-foreground">{order.location}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end">
                  {isTrackable(order) && order.stage ? (
                    <OrderStageSelect orderId={order.id} stage={order.stage} />
                  ) : (
                    <span className="text-body-b8 text-muted-foreground">Not trackable</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
