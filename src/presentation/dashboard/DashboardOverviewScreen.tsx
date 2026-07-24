import { getLocale, getTranslations } from "next-intl/server";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Receipt,
  Star,
  Truck,
  Users,
} from "lucide-react";
import {
  ANALYTICS_RANGE_PRESETS,
  percentChange,
  repeatPurchaseRate,
  type RevenueRankSort,
} from "@/src/domain/entities/Analytics";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { PENDING_ORDER_SLA_HOURS, UNFULFILLED_ORDER_SLA_HOURS } from "@/src/domain/entities/OrderSla";
import { LOW_STOCK_THRESHOLD } from "@/src/domain/entities/stock";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { DataGridBody, DataGridHeader, DataTable, Icon, focusRing } from "@/src/presentation/design-system";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { formatOrderDateShort, formatOrderTime } from "@/src/lib/formatOrderDate";
import { cn } from "@/src/lib/utils";
import type { AttentionItem } from "./attention/AttentionItem";
import { NeedsAttentionPanel } from "./attention/NeedsAttentionPanel";
import { StatCard } from "./StatCard";
import type { AnalyticsOverviewWire } from "./analytics/analytics-response-schema";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./analytics/AnalyticsRangePicker";
import { CustomerInsightsPanel, type CustomerInsightMetric } from "./analytics/CustomerInsightsPanel";
import { RevenueChart } from "./analytics/RevenueChart";
import { RevenueRankPanel, type RevenueRankRow } from "./analytics/RevenueRankPanel";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Grid template shared by the recent-orders header and rows. Columns: order id,
 * customer, status, placed, amount, and the trailing chevron affordance — same
 * "row is a link" shape as `CustomerOrdersPanel`, which is why this is a grid
 * rather than the orders list's `<table>` (a `<tr>` can't be one link).
 */
const RECENT_ORDERS_ROW_GRID =
  "grid grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_auto_minmax(0,0.9fr)_auto_auto] items-center gap-4";

type DashboardOverviewScreenProps = {
  /** Every period-scoped figure on the screen, from one aggregate endpoint. */
  analytics: AnalyticsOverviewWire;
  /** The period's bounds as `YYYY-MM-DD` for the picker's date inputs (`to` inclusive). */
  from: string;
  to: string;
  /** Whether the URL names an explicit period rather than a preset. */
  isCustomRange: boolean;
  /** The ranking each panel's rows already arrived in — see `RevenueRankPanel`. */
  productSort: RevenueRankSort;
  categorySort: RevenueRankSort;
  /** The latest few orders — a page, not the history. */
  recentOrders: Order[];
  /** Summaries for exactly `recentOrders`' customers, to label each row with who placed it. */
  recentOrderCustomers: CustomerOrderSummary[];
  /**
   * How many reviews await moderation. A count, not the reviews themselves: the
   * moderation endpoint reports it directly.
   */
  pendingReviews: number;
  /**
   * How many products aren't comfortably in stock (low *or* out), counted by the
   * products endpoint's own stock filter — so this can't diverge from what the
   * storefront calls "low".
   */
  lowStockCount: number;
  /**
   * Orders still unconfirmed after {@link PENDING_ORDER_SLA_HOURS}, and the exact
   * cutoff instant that count was drawn against — reused for the tile's `href` so
   * the link can never disagree with the number above it.
   */
  staleOrdersCount: number;
  staleOrdersCutoff: string;
  /** Orders undelivered after {@link UNFULFILLED_ORDER_SLA_HOURS}, and its cutoff (see above). */
  overdueOrdersCount: number;
  overdueOrdersCutoff: string;
};

/**
 * Admin dashboard overview: how the store did over a chosen period, and how that
 * compares to the period before it.
 *
 * Presentational, and a server component. The period lives in the URL, so changing
 * it is a navigation that re-runs this render with new numbers — no client data
 * state, no fetch waterfall, and no way for one panel to show a different period
 * from the one beside it.
 *
 * Nothing here computes a metric. Every period figure arrives from
 * `GET /api/admin/analytics`, which derives them with aggregate SQL over an indexed
 * date range. That is the change this screen exists to make: it used to receive
 * *every order in the store's history*, with its items, and reduce four numbers out
 * of them in JS — correct on a demo dataset, and quietly worse with every sale. The
 * only arithmetic left below turns two periods into a percentage.
 *
 * One thing on this page is deliberately *not* period-scoped, and is labelled so:
 *
 *  - **Pending reviews / needs restocking** — these count a *current* state, not
 *    something that happened during a period, so they carry no comparison. A "vs
 *    previous 30 days" on a queue length would be a trend line through a snapshot.
 *
 * Lifetime rankings (top spenders) live on the Customers page, not here — this
 * screen only answers "how did the chosen period go."
 */
export async function DashboardOverviewScreen({
  analytics,
  from,
  to,
  isCustomRange,
  productSort,
  categorySort,
  recentOrders,
  recentOrderCustomers,
  pendingReviews,
  lowStockCount,
  staleOrdersCount,
  staleOrdersCutoff,
  overdueOrdersCount,
  overdueOrdersCutoff,
}: DashboardOverviewScreenProps) {
  const t = await getTranslations("dashHome");
  const tOrders = await getTranslations("dashOrders");
  const tAnalytics = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;

  const { totals, previousTotals } = analytics;

  /**
   * One KPI's movement against the baseline, spread onto `StatCard`.
   *
   * `undefined` when there is no baseline to divide by: a period following one that
   * earned nothing is not "+100%", and a tile that claims a number there is worse
   * than one that stays quiet (see `percentChange`).
   */
  function delta(
    current: number,
    previous: number,
  ): { delta: string; deltaTone: "up" | "down" | "flat" } | undefined {
    const change = percentChange(current, previous);
    if (change === null) return undefined;

    const percent = Math.round(change * 100);
    return {
      delta: tAnalytics("deltaPercent", { percent }),
      deltaTone: percent > 0 ? "up" : percent < 0 ? "down" : "flat",
    };
  }

  const periodDays = Math.round(
    (new Date(analytics.range.to).getTime() - new Date(analytics.range.from).getTime()) / DAY_MS,
  );
  const comparisonLabel = tAnalytics("vsPrevious", { days: periodDays });

  const topProducts: RevenueRankRow[] = analytics.topProducts.map((product) => ({
    id: product.productId,
    label: product.name,
    imageUrl: product.imageUrl,
    units: product.units,
    revenue: product.revenue,
    href: `/dashboard/products/${product.productId}/edit`,
  }));

  const topCategories: RevenueRankRow[] = analytics.topCategories.map((category) => ({
    id: category.categoryId,
    label: category.name,
    units: category.units,
    revenue: category.revenue,
    href: `/dashboard/products?categoryId=${category.categoryId}`,
  }));

  const revenueRankSortOptions: { value: RevenueRankSort; label: string }[] = [
    { value: "revenue", label: tAnalytics("sortByRevenue") },
    { value: "units", label: tAnalytics("sortByUnits") },
  ];

  // Repeat rate is a share, not a count, so it gets its own null-aware formatting
  // and delta rather than reusing `delta()` directly on the raw numbers — a
  // period with no customers has no rate to report at all (see
  // `repeatPurchaseRate`).
  const repeatRate = repeatPurchaseRate(analytics.customerSegments);
  const previousRepeatRate = repeatPurchaseRate(analytics.previousCustomerSegments);
  const repeatRateValue =
    repeatRate !== null ? tAnalytics("repeatRatePercent", { percent: Math.round(repeatRate * 100) }) : "—";
  const repeatRateDelta =
    repeatRate !== null && previousRepeatRate !== null ? delta(repeatRate, previousRepeatRate) : undefined;

  const customerMetrics: CustomerInsightMetric[] = [
    {
      key: "new",
      label: tAnalytics("newCustomers"),
      value: formatNumber(analytics.customerSegments.newCustomers, locale),
      ...delta(analytics.customerSegments.newCustomers, analytics.previousCustomerSegments.newCustomers),
    },
    {
      key: "returning",
      label: tAnalytics("returningCustomers"),
      value: formatNumber(analytics.customerSegments.returningCustomers, locale),
      ...delta(
        analytics.customerSegments.returningCustomers,
        analytics.previousCustomerSegments.returningCustomers,
      ),
    },
    {
      key: "repeatRate",
      label: tAnalytics("repeatPurchaseRate"),
      value: repeatRateValue,
      ...repeatRateDelta,
    },
  ];

  const recentOrderCustomersById = new Map(
    recentOrderCustomers.map((customer) => [customer.userId, customer]),
  );

  // The panel's whole vocabulary: a count, what it means, and where the rows
  // behind it live. Each `href` carries the exact filter its count was drawn
  // from (see the props above and `page.tsx`), so a tile can never send
  // someone to a list that disagrees with the number they clicked.
  const attentionItems: AttentionItem[] = [
    {
      key: "pendingReviews",
      icon: Star,
      tone: "warning",
      count: pendingReviews,
      title: t("attentionPendingReviews"),
      detail: t("attentionPendingReviewsDetail"),
      ctaLabel: t("attentionPendingReviewsCta"),
      href: "/dashboard/reviews",
    },
    {
      key: "lowStock",
      icon: AlertTriangle,
      tone: "danger",
      count: lowStockCount,
      title: t("attentionLowStock"),
      detail: t("attentionLowStockDetail", { threshold: LOW_STOCK_THRESHOLD }),
      ctaLabel: t("attentionLowStockCta"),
      // The consolidated restocking workflow, not the raw filtered catalog list —
      // same underlying read (`stock=needsRestock`), but with inline adjust and
      // bulk restock right there instead of one row action at a time.
      href: "/dashboard/inventory",
    },
    {
      key: "staleOrders",
      icon: Clock,
      tone: "danger",
      count: staleOrdersCount,
      title: t("attentionStaleOrders"),
      detail: t("attentionStaleOrdersDetail", { hours: PENDING_ORDER_SLA_HOURS }),
      ctaLabel: t("attentionStaleOrdersCta"),
      href: `/dashboard/orders?pipeline=pending&to=${encodeURIComponent(staleOrdersCutoff)}`,
    },
    {
      key: "overdueOrders",
      icon: Truck,
      tone: "warning",
      count: overdueOrdersCount,
      title: t("attentionOverdueOrders"),
      detail: t("attentionOverdueOrdersDetail", { hours: UNFULFILLED_ORDER_SLA_HOURS }),
      ctaLabel: t("attentionOverdueOrdersCta"),
      href: `/dashboard/orders?pipeline=in_progress&to=${encodeURIComponent(overdueOrdersCutoff)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("heading")}</h1>
          {/* The days actually covered, spelled out. A dashboard headed only "Last
              30 days" makes every number on it unverifiable; this is the line that
              lets someone reconcile a tile against the orders list. */}
          <p className="text-body-b6 text-muted-foreground">
            {tAnalytics("rangeCaption", {
              from: formatMediumDate(analytics.range.from, locale),
              to: formatMediumDate(analytics.range.to, locale),
            })}
          </p>
          {/* Every KPI tile below states its move as "vs previous N days" without
              saying which days those were — this line names the baseline period
              those percentages are actually computed against. */}
          <p className="text-body-b8 text-muted-foreground">
            {tAnalytics("comparedToRange", {
              from: formatMediumDate(analytics.previousRange.from, locale),
              to: formatMediumDate(analytics.previousRange.to, locale),
            })}
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          {/* The overview keeps the KPIs and the period chart; everything else
              analytics can show (the full status breakdown, exports, and the
              rankings past the top five) moved to its own page — this is the
              way there. */}
          <Link href="/dashboard/analytics" className="text-body-b8 text-primary hover:underline">
            {t("viewFullAnalytics")}
          </Link>
          <AnalyticsRangePicker
            presetLabel={tAnalytics("rangeLabel")}
            presetOptions={[
              ...ANALYTICS_RANGE_PRESETS.map((preset) => ({
                value: preset,
                label: tAnalytics(`preset.${preset}`),
              })),
              { value: CUSTOM_RANGE_VALUE, label: tAnalytics("presetCustom") },
            ]}
            fromLabel={tAnalytics("rangeFrom")}
            toLabel={tAnalytics("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          tone="brand"
          value={formatMoney(totals.revenue, locale)}
          label={tAnalytics("kpiRevenue")}
          deltaLabel={comparisonLabel}
          {...delta(totals.revenue, previousTotals.revenue)}
        />
        <StatCard
          icon={ClipboardList}
          tone="info"
          value={formatNumber(totals.orders, locale)}
          label={tAnalytics("kpiOrders")}
          deltaLabel={comparisonLabel}
          {...delta(totals.orders, previousTotals.orders)}
        />
        <StatCard
          icon={Receipt}
          tone="warning"
          value={formatMoney(totals.averageOrderValue, locale)}
          label={tAnalytics("kpiAverageOrder")}
          deltaLabel={comparisonLabel}
          {...delta(totals.averageOrderValue, previousTotals.averageOrderValue)}
        />
        <StatCard
          icon={Users}
          tone="danger"
          value={formatNumber(totals.customers, locale)}
          label={tAnalytics("kpiCustomers")}
          deltaLabel={comparisonLabel}
          {...delta(totals.customers, previousTotals.customers)}
        />
      </div>

      {/* One consolidated strip for everything that names something to *do*, kept
          apart from the period KPIs above because it measures the queue as it
          stands right now — a moderation backlog and a stale order don't have a
          "vs previous 30 days" reading, and inventing one would read as a trend
          through a snapshot. */}
      <NeedsAttentionPanel items={attentionItems} />

      <RevenueChart
        points={analytics.revenueSeries}
        previousPoints={analytics.previousSeries}
        previousYearPoints={analytics.previousYearSeries}
        granularity={analytics.granularity}
        range={analytics.range}
        previousRange={analytics.previousRange}
        previousYearRange={analytics.previousYearRange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RevenueRankPanel
          heading={tAnalytics("topProducts")}
          rows={topProducts}
          emptyLabel={tAnalytics("noSales")}
          unitsLabel={(units) => tAnalytics("unitsSold", { units })}
          sort={productSort}
          sortParamName="productSort"
          sortLabel={tAnalytics("sortLabel")}
          sortOptions={revenueRankSortOptions}
          viewAllHref="/dashboard/products"
          viewAllLabel={tAnalytics("viewAll")}
        />
        <RevenueRankPanel
          heading={tAnalytics("topCategories")}
          rows={topCategories}
          emptyLabel={tAnalytics("noSales")}
          unitsLabel={(units) => tAnalytics("unitsSold", { units })}
          sort={categorySort}
          sortParamName="categorySort"
          sortLabel={tAnalytics("sortLabel")}
          sortOptions={revenueRankSortOptions}
          viewAllHref="/dashboard/categories"
          viewAllLabel={tAnalytics("viewAll")}
        />
        <CustomerInsightsPanel
          heading={tAnalytics("customerInsights")}
          metrics={customerMetrics}
          comparisonLabel={comparisonLabel}
          viewAllHref="/dashboard/customers"
          viewAllLabel={tAnalytics("viewAll")}
        />
      </div>

      <section className="rounded-card-lg border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-body-b5 text-foreground">{t("recentOrders")}</h2>
          <Link href="/dashboard/orders" className="text-body-b8 text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <DataTable className="mt-4" minWidthClassName="min-w-[40rem]">
            <DataGridHeader template={RECENT_ORDERS_ROW_GRID}>
              <span>{tOrders("colOrder")}</span>
              <span>{tOrders("colCustomer")}</span>
              <span>{tOrders("colStatus")}</span>
              <span>{tOrders("colPlaced")}</span>
              <span className="text-end">{tOrders("colTotal")}</span>
              <span aria-hidden className="w-4" />
            </DataGridHeader>
            <DataGridBody>
              {recentOrders.map((order) => {
                const customer = recentOrderCustomersById.get(order.userId);
                return (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    aria-label={tOrders("viewOrderAria", { id: order.orderNumber })}
                    className={cn(
                      RECENT_ORDERS_ROW_GRID,
                      focusRing,
                      "bg-background px-4 py-3 transition-colors hover:bg-surface-sunken/50",
                    )}
                  >
                    <span className="truncate font-mono text-body-b6 text-foreground">
                      #{order.orderNumber}
                    </span>
                    <span className="truncate text-body-b7 text-foreground">
                      {customer?.name ?? order.userId}
                    </span>
                    <OrderStatusBadge status={order.status} stage={order.stage} />
                    <span className="flex flex-col whitespace-nowrap text-body-b8 text-muted-foreground">
                      <span className="text-foreground">{formatOrderDateShort(order.placedAt, locale)}</span>
                      {formatOrderTime(order.placedAt, locale)}
                    </span>
                    <span className="whitespace-nowrap text-end text-body-b7 text-foreground">
                      {formatMoney(orderNetPaid(order), locale)}
                    </span>
                    <Icon icon={ChevronRight} size="xs" className="text-muted-foreground rtl:-scale-x-100" />
                  </Link>
                );
              })}
            </DataGridBody>
          </DataTable>
        ) : (
          <p className="mt-4 text-body-b7 text-muted-foreground">{t("noRecentOrders")}</p>
        )}
      </section>
    </div>
  );
}
