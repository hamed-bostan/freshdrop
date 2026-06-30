import { requireAuth } from "@/src/lib/require-auth";
import { ordersServerApi } from "@/src/presentation/orders/order-server-api";
import OrdersScreen from "@/src/presentation/orders/OrdersScreen";

// Per-user data fetched from the REST API at request time (BFF) — render dynamically.
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  await requireAuth();

  const orders = await ordersServerApi.list();

  return <OrdersScreen orders={orders} />;
}
