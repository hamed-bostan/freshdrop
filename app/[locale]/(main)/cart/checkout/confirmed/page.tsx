import { requireAuth } from "@/src/lib/require-auth";
import { ordersServerApi } from "@/src/presentation/orders/order-server-api";
import OrderConfirmedScreen from "@/src/presentation/checkout/OrderConfirmedScreen";

// The just-placed order is read from the REST API at request time (BFF) so the
// receipt can itemize any out-of-stock refunds — render dynamically.
export const dynamic = "force-dynamic";

export default async function OrderConfirmedPage() {
  await requireAuth();

  // Orders come back newest-first, so the head is the order just placed.
  const [latestOrder] = await ordersServerApi.list();

  return <OrderConfirmedScreen order={latestOrder} />;
}
