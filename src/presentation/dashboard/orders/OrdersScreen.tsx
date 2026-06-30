import type { Order } from "@/src/domain/entities/Order";
import { OrdersTrackingTable } from "./OrdersTrackingTable";

type OrdersScreenProps = {
  orders: Order[];
};

/**
 * Admin orders list. Presentational: the dashboard page fetches over the REST API
 * (BFF) during server render and passes the data in. Stage changes re-run this
 * server render via `router.refresh()` (see OrderStageSelect), so the server stays
 * the single source of truth — no client-side data cache to keep in sync.
 */
export function OrdersScreen({ orders }: OrdersScreenProps) {
  const count = orders.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">Orders</h1>
        <p className="text-body-b6 text-muted-foreground">
          {count} {count === 1 ? "order" : "orders"} · advance the delivery stage to update tracking
        </p>
      </div>

      {count > 0 ? (
        <OrdersTrackingTable orders={orders} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">No orders yet</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">
            Orders will appear here once customers start checking out.
          </p>
        </div>
      )}
    </div>
  );
}
