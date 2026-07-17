import { notFound } from "next/navigation";
import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/orders/customer-server-api";
import { OrderDetailScreen } from "@/src/presentation/dashboard/orders/OrderDetailScreen";

// The order is read from the REST API (BFF) per request — never statically cached.
export const dynamic = "force-dynamic";

type DashboardOrderPageProps = { params: Promise<{ id: string }> };

export default async function DashboardOrderPage({ params }: DashboardOrderPageProps) {
  const { id } = await params;

  // The dashboard layout already gates this tree to admins; the BFF forwards the
  // admin's session cookie so the admin endpoints authorize the calls. The order and
  // the customer summaries (to label the order with who placed it) are fetched together.
  const [order, customers] = await Promise.all([
    ordersServerApi.getById(id),
    customersServerApi.listSummaries(),
  ]);

  if (!order) notFound();

  const customer = customers.find((entry) => entry.userId === order.userId);

  return <OrderDetailScreen order={order} customer={customer} />;
}
