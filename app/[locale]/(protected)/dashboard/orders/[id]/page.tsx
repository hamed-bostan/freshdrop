import { notFound } from "next/navigation";
import { DEFAULT_ACTIVITY_LIMIT } from "@/src/domain/entities/ActivityEntry";
import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { activityServerApi } from "@/src/presentation/dashboard/activity/activity-server-api";
import { OrderDetailScreen } from "@/src/presentation/dashboard/orders/OrderDetailScreen";

// The order is read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardOrderPageProps = { params: Promise<{ id: string }> };

export default async function DashboardOrderPage({ params }: DashboardOrderPageProps) {
  const { id } = await params;

  // The dashboard layout already gates this tree to admins; the BFF forwards the
  // admin's session cookie so the admin endpoints authorize the calls.
  const order = await ordersServerApi.getById(id);
  if (!order) notFound();

  // Only this order's customer, to label the order with who placed it. Sequential
  // rather than parallel because the id to look up comes from the order — the
  // previous parallel fetch could only manage that by reading *every* customer
  // and finding one in the result.
  // The customer and the order's activity are both keyed off the order, so they
  // run together once it's in hand.
  const [customers, activity] = await Promise.all([
    customersServerApi.listByIds([order.userId]),
    activityServerApi.listForEntity("order", order.id, DEFAULT_ACTIVITY_LIMIT),
  ]);
  const customer = customers.items[0];

  return <OrderDetailScreen order={order} customer={customer} activity={activity} />;
}
