import { getTranslations } from "next-intl/server";
import type { Order } from "@/src/domain/entities/Order";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { OrdersTable } from "./OrdersTable";
import { TopCustomersPanel } from "./TopCustomersPanel";

type OrdersScreenProps = {
  orders: Order[];
  /** Per-customer order summaries, ranked by total spend (highest first). */
  customers: CustomerOrderSummary[];
};

/**
 * Admin orders list. Presentational: the dashboard page fetches over the REST API
 * (BFF) during server render and passes the data in. Each row links to the order's
 * detail route, where the stage/return/pick actions live; those writes re-run the
 * server render via `router.refresh()`, so the server stays the single source of
 * truth — no client-side data cache to keep in sync.
 *
 * Alongside the table it shows a "top customers" panel (who buys the most) and
 * labels each order row with the customer who placed it — both derived from the
 * same `customers` summaries.
 */
export async function OrdersScreen({ orders, customers }: OrdersScreenProps) {
  const t = await getTranslations("dashOrders");
  const count = orders.length;
  // Look up each order's customer by the user who placed it, so the table can
  // label rows by name instead of a raw id.
  const customersById = new Map(customers.map((customer) => [customer.userId, customer]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("summary", { count })}</p>
      </div>

      {customers.length > 0 ? <TopCustomersPanel customers={customers} /> : null}

      {count > 0 ? (
        <OrdersTable orders={orders} customersById={customersById} />
      ) : (
        <div className="rounded-card-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="text-body-b4 text-foreground">{t("emptyTitle")}</p>
          <p className="mt-1 text-body-b6 text-muted-foreground">{t("emptyBody")}</p>
        </div>
      )}
    </div>
  );
}
