import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { OrdersScreen } from "@/src/presentation/dashboard/orders/OrdersScreen";

// Orders are read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage() {
  // The dashboard layout already gates this tree to admins; the BFF read forwards
  // the admin's session cookie so the admin orders endpoint authorizes the call.
  const orders = await ordersServerApi.listAll();

  return <OrdersScreen orders={orders} />;
}
