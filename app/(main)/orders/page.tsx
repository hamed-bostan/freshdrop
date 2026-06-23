import { requireAuth } from "@/src/lib/require-auth";
import { GetOrders } from "@/src/domain/use-cases/orders/GetOrders";
import { orderRepository } from "@/src/infrastructure/container";
import OrdersScreen from "@/src/presentation/orders/OrdersScreen";

export default async function OrdersPage() {
  await requireAuth();

  const orders = await new GetOrders(orderRepository).execute();

  return <OrdersScreen orders={orders} />;
}
