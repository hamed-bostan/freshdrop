import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle, ClipboardList, Clock, DollarSign, Receipt, Star, Truck, Users } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS, percentChange } from "@/src/domain/entities/Analytics";
import type { Order } from "@/src/domain/entities/Order";
import { orderNetPaid } from "@/src/domain/entities/Order";
import { PENDING_ORDER_SLA_HOURS, UNFULFILLED_ORDER_SLA_HOURS } from "@/src/domain/entities/OrderSla";
import { LOW_STOCK_THRESHOLD } from "@/src/domain/entities/stock";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { OrderStatusBadge } from "@/src/presentation/orders/components/OrderStatusBadge";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import type { AttentionItem } from "./attention/AttentionItem";
import { NeedsAttentionPanel } from "./attention/NeedsAttentionPanel";
import { StatCard } from "./StatCard";
import { TopCustomersPanel } from "./orders/TopCustomersPanel";
import type { AnalyticsOverviewWire } from "./analytics/analytics-response-schema";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./analytics/AnalyticsRangePicker";
import { ExportCsvLink } from "./analytics/ExportCsvLink";
import { OrderStatusBreakdown } from "./analytics/OrderStatusBreakdown";
import { RevenueChart } from "./analytics/RevenueChart";
import { RevenueRankPanel, type RevenueRankRow } from "./analytics/RevenueRankPanel";

const DAY_MS = 24 * 60 * 60 * 1000;

type DashboardOverviewScreenProps = {
  /** Every period-scoped figure on the screen, from one aggregate endpoint. */
  analytics: AnalyticsOverviewWire;
  /** The period's bounds as `YYYY-MM-DD` for the picker's date inputs (`to` inclusive). */
  from: string;
  to: string;
  /** Whether the URL names an explicit period rather than a preset. */
  isCustomRange: boolean;
  /** The latest few orders — a page, not the history. */
  recentOrders: Order[];
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
  /** Top spenders — an all-time ranking, not a period-scoped one (see below). */
  customers: CustomerOrderSummary[];
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
 * Two things on this page are deliberately *not* period-scoped, and are labelled so:
 *
 *  - **Top customers** — standing is a lifetime fact. Re-ranking it to the last 30
 *    days would answer "who bought recently" under a heading that says otherwise.
 *  - **Pending reviews / needs restocking** — these count a *current* state, not
 *    something that happened during a period, so they carry no comparison. A "vs
 *    previous 30 days" on a queue length would be a trend line through a snapshot.
 */
export async function DashboardOverviewScreen({
  analytics,
  from,
  to,
  isCustomRange,
  recentOrders,
  pendingReviews,
  lowStockCount,
  staleOrdersCount,
  staleOrdersCutoff,
  overdueOrdersCount,
  overdueOrdersCutoff,
  customers,
}: DashboardOverviewScreenProps) {
  const t = await getTranslations("dashHome");
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

  const customersById = new Map(customers.map((customer) => [customer.userId, customer]));

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
      href: "/dashboard/products?stock=needsRestock",
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

      <RevenueChart points={analytics.revenueSeries} granularity={analytics.granularity} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OrderStatusBreakdown breakdown={analytics.statusBreakdown} />
        <RevenueRankPanel
          heading={tAnalytics("topProducts")}
          rows={topProducts}
          emptyLabel={tAnalytics("noSales")}
          unitsLabel={(units) => tAnalytics("unitsSold", { units })}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueRankPanel
          heading={tAnalytics("topCategories")}
          rows={topCategories}
          emptyLabel={tAnalytics("noSales")}
          unitsLabel={(units) => tAnalytics("unitsSold", { units })}
        />
        {customers.length > 0 ? (
          <TopCustomersPanel customers={customers} compact viewAllHref="/dashboard/customers" />
        ) : null}
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

        {/* The exports sit here because this is where someone lands when the
            dashboard *can't* answer their question — which is exactly when they
            want the rows in a spreadsheet. Each link carries the current query
            string, so they honour their own lists' filters when reached from those
            pages; from here they export everything. */}
        <section className="flex flex-col justify-between gap-4 rounded-card-lg border border-border p-4">
          <div>
            <h2 className="text-body-b5 text-foreground">{tAnalytics("exportHeading")}</h2>
            <p className="mt-1 text-body-b8 text-muted-foreground">{tAnalytics("exportBody")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportCsvLink resource="orders" label={tAnalytics("exportOrders")} />
            <ExportCsvLink resource="products" label={tAnalytics("exportProducts")} />
            <ExportCsvLink resource="customers" label={tAnalytics("exportCustomers")} />
          </div>
        </section>
      </div>
    </div>
  );
}
