import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { OrdersScreen } from "@/src/presentation/dashboard/orders/OrdersScreen";

// Orders are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage() {
  // The dashboard layout already gates this tree to admins; the BFF reads forward
  // the admin's session cookie so the admin endpoints authorize the calls. Orders
  // (the tracking table) and the per-customer summaries (the "top customers" panel
  // and each row's customer label) are fetched together.
  const [orders, customers] = await Promise.all([
    ordersServerApi.listAll(),
    customersServerApi.listSummaries(),
  ]);

  return <OrdersScreen orders={orders} customers={customers} />;
}
