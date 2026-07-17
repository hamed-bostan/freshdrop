import { getLocale, getTranslations } from "next-intl/server";
import { DollarSign, ClipboardList, Star, AlertTriangle } from "lucide-react";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import type { Review } from "@/src/domain/entities/Review";
import type { Product } from "@/src/domain/entities/Product";
import { LOW_STOCK_THRESHOLD, getStockStatus } from "@/src/domain/entities/stock";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { StatCard } from "./StatCard";
import { TopCustomersPanel } from "./orders/TopCustomersPanel";

type DashboardOverviewScreenProps = {
  orders: Order[];
  reviews: Review[];
  products: Product[];
  /** Per-customer order summaries, ranked by total spend (highest first). */
  customers: CustomerOrderSummary[];
};

/** How many days back the revenue KPI sums over. */
const REVENUE_WINDOW_DAYS = 30;
/** How many of the latest orders the recent-orders mini-list shows. */
const RECENT_ORDERS_COUNT = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Orders placed within the trailing {@link REVENUE_WINDOW_DAYS}. Pure — `now` is
 * injected (defaulting to the current time) so the impure clock read stays out of
 * the component render, mirroring the domain's `isReturnable(order, now)`. The
 * revenue KPI derives both its total and its order-count hint from this window.
 */
function ordersInWindow(orders: Order[], now: number = Date.now()): Order[] {
  const since = now - REVENUE_WINDOW_DAYS * DAY_MS;
  return orders.filter((order) => new Date(order.placedAt).getTime() >= since);
}

/**
 * Admin dashboard overview. Presentational: the dashboard root page fetches orders,
 * reviews, products, and customer summaries over the REST API (BFF) during server
 * render and passes them in. The KPIs and lists are derived here — no client data
 * state, so the server stays the single source of truth.
 */
export async function DashboardOverviewScreen({
  orders,
  reviews,
  products,
  customers,
}: DashboardOverviewScreenProps) {
  const t = await getTranslations("dashHome");
  const locale = await getLocale();

  const windowOrders = ordersInWindow(orders);
  const revenue30d = windowOrders.reduce((sum, order) => sum + orderNetPaid(order), 0);

  const inProgress = orders.filter((order) => order.status === "processing").length;
  const pendingReviews = reviews.filter((review) => review.status === "pending").length;
  // "Needs restocking" — anything not comfortably in stock. Classified through the
  // domain's `getStockStatus` (the single source of truth for stock states) rather
  // than re-deriving the threshold here, so it never diverges from the storefront.
  // Out-of-stock counts too: it's the more urgent case, not one to hide from the tile.
  const lowStock = products.filter((product) => getStockStatus(product.stockQuantity).level !== "in").length;

  // Latest orders first — the source order isn't guaranteed sorted, so sort by when
  // each was placed and take the leading few.
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, RECENT_ORDERS_COUNT);
  const customersById = new Map(customers.map((customer) => [customer.userId, customer]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
        <p className="text-body-b6 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          tone="brand"
          value={formatMoney(revenue30d, locale)}
          label={t("kpiRevenue", { days: REVENUE_WINDOW_DAYS })}
          hint={t("kpiRevenueHint", { count: windowOrders.length })}
        />
        <StatCard
          icon={ClipboardList}
          tone="info"
          value={formatNumber(inProgress, locale)}
          label={t("kpiInProgress")}
          hint={t("kpiInProgressHint")}
        />
        <StatCard
          icon={Star}
          tone="warning"
          value={formatNumber(pendingReviews, locale)}
          label={t("kpiPendingReviews")}
          hint={t("kpiPendingReviewsHint")}
        />
        <StatCard
          icon={AlertTriangle}
          tone="danger"
          value={formatNumber(lowStock, locale)}
          label={t("kpiLowStock")}
          hint={t("kpiLowStockHint", { threshold: LOW_STOCK_THRESHOLD })}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-card-lg border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-body-b5 text-foreground">{t("recentOrders")}</h2>
            <Link href="/dashboard/orders" className="text-body-b8 text-primary hover:underline">
              {t("viewAll")}
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <ol className="mt-4 flex flex-col gap-2">
              {recentOrders.map((order) => {
                const customer = customersById.get(order.userId);
                return (
                  <li key={order.id} className="flex items-center gap-3">
                    <p className="min-w-0 flex-1 truncate text-body-b7 text-foreground">
                      {customer?.name ?? order.userId}
                    </p>
                    <OrderStatusBadge status={order.status} stage={order.stage} />
                    <p className="w-24 text-end text-body-b7 text-foreground">
                      {formatMoney(orderNetPaid(order), locale)}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 text-body-b7 text-muted-foreground">{t("noRecentOrders")}</p>
          )}
        </section>

        {customers.length > 0 ? (
          <TopCustomersPanel customers={customers} compact viewAllHref="/dashboard/customers" />
        ) : null}
      </div>
    </div>
  );
}
