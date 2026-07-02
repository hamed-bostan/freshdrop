import type { Order } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { OrdersTrackingTable } from "./OrdersTrackingTable";
import { TopCustomersPanel } from "./TopCustomersPanel";

type OrdersScreenProps = {
  orders: Order[];
  /** Per-customer order summaries, ranked by total spend (highest first). */
  customers: CustomerOrderSummary[];
};

/**
 * Admin orders list. Presentational: the dashboard page fetches over the REST API
 * (BFF) during server render and passes the data in. Stage changes re-run this
 * server render via `router.refresh()` (see OrderStageSelect), so the server stays
 * the single source of truth — no client-side data cache to keep in sync.
 *
 * Alongside the table it shows a "top customers" panel (who buys the most) and
 * labels each order row with the customer who placed it — both derived from the
 * same `customers` summaries.
 */
export function OrdersScreen({ orders, customers }: OrdersScreenProps) {
  const count = orders.length;
  // Look up each order's customer by the user who placed it, so the table can
  // label rows by name instead of a raw id.
  const customersById = new Map(customers.map((customer) => [customer.userId, customer]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">Orders</h1>
        <p className="text-body-b6 text-muted-foreground">
          {count} {count === 1 ? "order" : "orders"} · advance the delivery stage to update tracking
        </p>
      </div>

      {customers.length > 0 ? <TopCustomersPanel customers={customers} /> : null}

      {count > 0 ? (
        <OrdersTrackingTable orders={orders} customersById={customersById} />
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
