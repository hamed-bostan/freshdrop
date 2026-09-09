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
import { getLocale, getTranslations } from "next-intl/server";

import {
  ANALYTICS_RANGE_PRESETS,
  percentChange,
} from "@/src/domain/entities/Analytics";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Order } from "@/src/domain/entities/Order";
import { PENDING_ORDER_SLA_HOURS, UNFULFILLED_ORDER_SLA_HOURS } from "@/src/domain/entities/OrderSla";
import type { Product } from "@/src/domain/entities/Product";
import { LOW_STOCK_THRESHOLD } from "@/src/domain/entities/stock";
import { Link } from "@/src/i18n/navigation";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import { formatNumber } from "@/src/lib/formatNumber";
import { cn } from "@/src/lib/utils";
import { Icon, focusRing } from "@/src/presentation/design-system";

import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./analytics/AnalyticsRangePicker";
import { OrderStatusBreakdown } from "./analytics/OrderStatusBreakdown";
import { RevenueChart } from "./analytics/RevenueChart";
import { NeedsAttentionPanel } from "./attention/NeedsAttentionPanel";
import { buildDashboardOverviewViewModel } from "./dashboard-overview-view-model";
import { DashboardSplitGrid } from "./DashboardSplitGrid";
import { LowStockPanel } from "./LowStockPanel";
import { RecentOrdersPanel } from "./RecentOrdersPanel";
import { StatCard } from "./StatCard";
import { StatCardCarousel } from "./StatCardCarousel";

import type { AnalyticsOverviewWire } from "./analytics/analytics-response-schema";
import type { AttentionItem } from "./attention/AttentionItem";
import type { StatCardProps } from "./StatCard";

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
  lowStockProducts: Product[];
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
  recentOrders,
  recentOrderCustomers,
  pendingReviews,
  lowStockCount,
  lowStockProducts,
  staleOrdersCount,
  staleOrdersCutoff,
  overdueOrdersCount,
  overdueOrdersCutoff,
}: DashboardOverviewScreenProps) {
  const t = await getTranslations("dashHome");
  const tAnalytics = await getTranslations("dashAnalytics");
  const locale = (await getLocale());

  const { totals, previousTotals } = analytics;
  const viewModel = buildDashboardOverviewViewModel(analytics);

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

  const comparisonLabel = tAnalytics("vsPrevious", { days: viewModel.comparisonDays });

  // Built once and fed to both layouts below — the grid (`sm:` and up) and the
  // swipeable carousel (mobile only) render the exact same four tiles, so a
  // number can never read differently depending on viewport width.
  const statCards: StatCardProps[] = [
    {
      icon: DollarSign,
      tone: "brand",
      value: formatMoney(totals.revenue, locale),
      label: tAnalytics("kpiRevenue"),
      deltaLabel: comparisonLabel,
      ...delta(totals.revenue, previousTotals.revenue),
      trendValues: viewModel.revenue.trendValues,
    },
    {
      icon: ClipboardList,
      tone: "info",
      value: formatNumber(totals.orders, locale),
      label: tAnalytics("kpiOrders"),
      deltaLabel: comparisonLabel,
      ...delta(totals.orders, previousTotals.orders),
      trendValues: viewModel.orders.trendValues,
    },
    {
      icon: Receipt,
      tone: "warning",
      value: formatMoney(totals.averageOrderValue, locale),
      label: tAnalytics("kpiAverageOrderValue"),
      deltaLabel: comparisonLabel,
      neutralTrend: true,
      ...delta(totals.averageOrderValue, previousTotals.averageOrderValue),
      trendValues: viewModel.averageOrder.trendValues,
    },
    {
      icon: Users,
      tone: "danger",
      value: formatNumber(analytics.customerSegments.newCustomers, locale),
      label: tAnalytics("newCustomers"),
      deltaLabel: comparisonLabel,
      ...delta(analytics.customerSegments.newCustomers, analytics.previousCustomerSegments.newCustomers),
      trendValues: viewModel.newCustomers.trendValues,
    },
  ];

  // Repeat rate is a share, not a count, so it gets its own null-aware formatting
  // and delta rather than reusing `delta()` directly on the raw numbers — a
  // period with no customers has no rate to report at all (see
  // `repeatPurchaseRate`).
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
      title: t("attentionPendingReviews", { count: formatNumber(pendingReviews, locale) }),
      detail: t("attentionPendingReviewsDetail"),
      ctaLabel: t("attentionPendingReviewsCta"),
      href: "/dashboard/reviews",
    },
    {
      key: "lowStock",
      icon: AlertTriangle,
      tone: "danger",
      count: lowStockCount,
      title: t("attentionLowStock", { count: formatNumber(lowStockCount, locale) }),
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
      title: t("attentionStaleOrders", { count: formatNumber(staleOrdersCount, locale) }),
      detail: t("attentionStaleOrdersDetail", { hours: PENDING_ORDER_SLA_HOURS }),
      ctaLabel: t("attentionStaleOrdersCta"),
      href: `/dashboard/orders?pipeline=pending&to=${encodeURIComponent(staleOrdersCutoff)}`,
    },
    {
      key: "overdueOrders",
      icon: Truck,
      tone: "warning",
      count: overdueOrdersCount,
      title: t("attentionOverdueOrders", { count: formatNumber(overdueOrdersCount, locale) }),
      detail: t("attentionOverdueOrdersDetail", { hours: UNFULFILLED_ORDER_SLA_HOURS }),
      ctaLabel: t("attentionOverdueOrdersCta"),
      href: `/dashboard/orders?pipeline=in_progress&to=${encodeURIComponent(overdueOrdersCutoff)}`,
    },
  ];

  return (
    <div className="@container flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 md:mb-1 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <h1 className="dashboard-page-title">{t("heading")}</h1>
          <p className="whitespace-nowrap text-body-b6 text-muted-foreground sm:whitespace-normal">{t("subtitle")}</p>
          {/* The days actually covered, spelled out. A dashboard headed only "Last
              30 days" makes every number on it unverifiable; this is the line that
              lets someone reconcile a tile against the orders list. */}
          <p className="mt-1 hidden text-body-b10 text-muted-foreground sm:inline">
            {tAnalytics("rangeCaption", {
              from: formatMediumDate(analytics.range.from, locale),
              to: formatMediumDate(analytics.range.to, locale),
            })}
          </p>
          {/* Every KPI tile below states its move as "vs previous N days" without
              saying which days those were — this line names the baseline period
              those percentages are actually computed against. */}
          <p className="ms-1 hidden text-body-b10 text-muted-foreground before:me-1 before:content-['·'] sm:inline">
            {t("comparedToPreviousPeriod")}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:shrink-0 md:flex-col md:items-end md:justify-end md:gap-4 xl:flex-row xl:items-center xl:gap-2">
          {/* The overview keeps the KPIs and the period chart; everything else
              analytics can show (the full status breakdown, exports, and the
              rankings past the top five) moved to its own page — this is the
              way there. */}
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
          <Link
            href="/dashboard/analytics"
            className={cn(
              focusRing,
              "hidden h-10 items-center rounded-input px-2 text-body-b8 text-primary transition-colors hover:bg-muted sm:inline-flex",
            )}
          >
            {t("viewFullAnalytics")}
            <Icon icon={ChevronRight} size="xs" className="ms-1.5 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>

      {/* Below `sm`: one tile per swipe with dot pagination — four full-width
          stacked cards would push everything else below the fold before the
          page says anything actionable. `sm` and up: the plain grid. */}
      <div className="sm:hidden">
        <StatCardCarousel slideLabels={statCards.map((card) => card.label)}>
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </StatCardCarousel>
      </div>
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* One consolidated strip for everything that names something to *do*, kept
          apart from the period KPIs above because it measures the queue as it
          stands right now — a moderation backlog and a stale order don't have a
          "vs previous 30 days" reading, and inventing one would read as a trend
          through a snapshot. */}
      <NeedsAttentionPanel items={attentionItems} />

      <DashboardSplitGrid
        primary={<RevenueChart
          compact
          points={analytics.revenueSeries}
          previousPoints={analytics.previousSeries}
          previousYearPoints={analytics.previousYearSeries}
          granularity={analytics.granularity}
          range={analytics.range}
          previousRange={analytics.previousRange}
          previousYearRange={analytics.previousYearRange}
        />}
        secondary={<OrderStatusBreakdown compact breakdown={analytics.statusBreakdown} />}
      />

      <DashboardSplitGrid
        primary={<RecentOrdersPanel orders={recentOrders} customersById={recentOrderCustomersById} />}
        secondary={<LowStockPanel products={lowStockProducts} />}
      />
    </div>
  );
}
