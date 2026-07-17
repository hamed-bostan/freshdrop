import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/orders/customer-server-api";
import { reviewsServerApi } from "@/src/presentation/dashboard/reviews/review-server-api";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { DashboardOverviewScreen } from "@/src/presentation/dashboard/DashboardOverviewScreen";

// The overview KPIs are read from the REST API (BFF) per request — never cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // The dashboard layout already gates this tree to admins; the BFF reads forward
  // the admin's session cookie so the admin endpoints authorize the calls. Every
  // metric the overview derives is fetched together in parallel.
  const [orders, reviews, products, customers] = await Promise.all([
    ordersServerApi.listAll(),
    reviewsServerApi.listAll(),
    productsServerApi.list(),
    customersServerApi.listSummaries(),
  ]);

  return (
    <DashboardOverviewScreen
      orders={orders}
      reviews={reviews}
      products={products}
      customers={customers}
    />
  );
}
