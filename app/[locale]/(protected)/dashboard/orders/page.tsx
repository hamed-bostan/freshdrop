import { auth } from "@/auth";
import { parseAdminOrderFilters } from "@/src/lib/api/admin-order-params";
import { toSearchParams } from "@/src/lib/api/searchParams";
import { sessionHas } from "@/src/lib/require-permission";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { OrdersScreen } from "@/src/presentation/dashboard/orders/OrdersScreen";

// Orders are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardOrdersPage({ searchParams }: DashboardOrdersPageProps) {
  const params = toSearchParams(await searchParams);

  // The dashboard layout already gates this tree to admins; the BFF reads forward
  // the admin's session cookie so the admin endpoints authorize the calls. One
  // page of orders (the tracking table) and the per-customer summaries (each
  // row's customer label) are fetched together. The query string is forwarded to
  // the API as-is; the parsed filters only tell the screen whether an empty page
  // means "no orders" or "nothing matched".
  // The page of rows, the queue counts behind the summary cards, and whether this
  // admin may act on any of it — none depends on the others, so they go together.
  //
  // The list is a read anyone in the dashboard needs (support answers "where is my
  // order?" from it); whether the *selection* and its actions are drawn is the
  // fulfilment permission.
  const [orders, counts, canFulfill] = await Promise.all([
    ordersServerApi.listPage(params),
    ordersServerApi.counts(),
    auth().then((session) => sessionHas(session, "orders.fulfill")),
  ]);

  // Customer labels are fetched for this page's orders only — a page of 20 orders
  // needs at most 20 customers, not every customer who has ever ordered.
  const customers = await customersServerApi.listByIds([
    ...new Set(orders.items.map((order) => order.userId)),
  ]);

  return (
    <OrdersScreen
      orders={orders}
      customers={customers.items}
      filters={parseAdminOrderFilters(params)}
      canFulfill={canFulfill}
      counts={counts}
    />
  );
}
