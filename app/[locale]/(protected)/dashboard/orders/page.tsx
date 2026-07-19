import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { OrdersScreen } from "@/src/presentation/dashboard/orders/OrdersScreen";
import { parseAdminOrderFilters } from "@/src/lib/api/admin-order-params";
import { toSearchParams } from "@/src/lib/api/searchParams";

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
  const orders = await ordersServerApi.listPage(params);

  // Customer labels are fetched for this page's orders only — a page of 20 orders
  // needs at most 20 customers, not every customer who has ever ordered.
  const customers = await customersServerApi.listByIds([
    ...new Set(orders.items.map((order) => order.userId)),
  ]);

  return (
    <OrdersScreen orders={orders} customers={customers.items} filters={parseAdminOrderFilters(params)} />
  );
}
