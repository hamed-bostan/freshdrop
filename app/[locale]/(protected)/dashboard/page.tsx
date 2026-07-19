import { ordersServerApi } from "@/src/presentation/dashboard/orders/order-server-api";
import { customersServerApi } from "@/src/presentation/dashboard/customers/customer-server-api";
import { reviewsServerApi } from "@/src/presentation/dashboard/reviews/review-server-api";
import { productsServerApi } from "@/src/presentation/dashboard/products/product-server-api";
import { DashboardOverviewScreen } from "@/src/presentation/dashboard/DashboardOverviewScreen";

// The overview KPIs are read from the REST API (BFF) per request — never cached.
export const dynamic = "force-dynamic";

/**
 * A page request that asks for a count and nothing else: page 1 at the smallest
 * size, so the response carries the `total` the tile needs without shipping rows
 * the overview will throw away.
 */
const COUNT_ONLY = "page=1&pageSize=1";

/** How many top spenders the overview's panel shows (it slices to the same number). */
const TOP_CUSTOMERS_COUNT = 5;

export default async function DashboardPage() {
  // The dashboard layout already gates this tree to admins; the BFF reads forward
  // the admin's session cookie so the admin endpoints authorize the calls. Every
  // metric the overview derives is fetched together in parallel.
  //
  // Only the orders read is a whole-table one, and only because its KPIs are
  // aggregates over the full history (see `GET /api/admin/orders/all`). Pending
  // reviews and low stock arrive as counts from the filtered endpoints instead of
  // being derived from every row.
  const [orders, reviews, needsRestock, customers] = await Promise.all([
    ordersServerApi.listAll(),
    reviewsServerApi.listPage(new URLSearchParams(COUNT_ONLY)),
    // One read, not two: `needsRestock` is the list's own name for "low or out",
    // and it's the filter the tile links into — so the count and the destination
    // are answered by the same query and can't disagree.
    productsServerApi.listPage(new URLSearchParams(`${COUNT_ONLY}&stock=needsRestock`)),
    // The panel spotlights the top few spenders, which is the customers list's
    // default ordering — so this is its first page, not the whole ranking.
    customersServerApi.listTop(TOP_CUSTOMERS_COUNT),
  ]);

  return (
    <DashboardOverviewScreen
      orders={orders}
      pendingReviews={reviews.counts.pending}
      // "Needs restocking" is everything not comfortably in stock; out-of-stock is
      // the more urgent case, not one to leave out of the tile.
      lowStockCount={needsRestock.total}
      customers={customers.items}
    />
  );
}
