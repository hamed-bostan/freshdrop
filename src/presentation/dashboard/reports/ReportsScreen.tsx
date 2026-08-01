import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { formatMoney } from "@/src/lib/formatMoney";
import type { AnalyticsOverviewWire } from "../analytics/analytics-response-schema";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { SalesCategoryPanel } from "./SalesCategoryPanel";
import { SalesChannelPanel } from "./SalesChannelPanel";
import { SalesInsightBanner } from "./SalesInsightBanner";
import { SalesMetricGrid } from "./SalesMetricGrid";
import { SalesTrendChart } from "./SalesTrendChart";
import { TopSellingProductsTable } from "./TopSellingProductsTable";

type ReportsScreenProps = {
  analytics: AnalyticsOverviewWire;
  from: string;
  to: string;
  isCustomRange: boolean;
  comparisonRange: { from: string; to: string };
};

/** The sales report: one coherent, server-fetched snapshot of the selected period. */
export async function ReportsScreen({ analytics, from, to, isCustomRange, comparisonRange }: ReportsScreenProps) {
  const t = await getTranslations("dashReports");
  const tAnalytics = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;

  return (
    <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
      <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports" className="hover:text-foreground">{t("heading")}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
        <span className="font-medium text-foreground">{t("salesReport")}</span>
      </nav>

      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("salesReport")}</h1>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("salesReportSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AnalyticsRangePicker
            presetLabel={tAnalytics("rangeLabel")}
            presetOptions={[
              ...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: tAnalytics(`preset.${preset}`) })),
              { value: CUSTOM_RANGE_VALUE, label: tAnalytics("presetCustom") },
            ]}
            fromLabel={tAnalytics("rangeFrom")}
            toLabel={tAnalytics("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">
            {tAnalytics("comparisonPeriod", {
              from: formatMediumDate(comparisonRange.from, locale),
              to: formatMediumDate(comparisonRange.to, locale),
            })}
          </div>
          <AnalyticsExportMenu
            label={tAnalytics("exportHeading")}
            reports={[
              { resource: "orders", label: tAnalytics("exportOrdersReport") },
              { resource: "products", label: tAnalytics("exportProductsReport") },
            ]}
          />
        </div>
      </header>

      <SalesMetricGrid analytics={analytics} locale={locale} labels={{
        revenue: tAnalytics("kpiNetRevenue"), orders: tAnalytics("kpiOrders"),
        averageOrder: tAnalytics("kpiAverageOrder"), units: tAnalytics("kpiUnitsSold"),
        comparison: tAnalytics("vsPreviousPeriod"), current: tAnalytics("currentPeriod"),
      }} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]">
        <SalesTrendChart analytics={analytics} locale={locale} labels={{
          heading: t("salesOverTime"), netSales: tAnalytics("kpiNetRevenue"), orders: tAnalytics("kpiOrders"),
          daily: t("daily"), weekly: t("weekly"), monthly: t("monthly"), empty: tAnalytics("chartEmpty"),
        }} />
        <SalesChannelPanel revenue={analytics.totals.revenue} locale={locale} />
      </div>

      <SalesInsightBanner
        currentRevenue={analytics.totals.revenue}
        previousRevenue={analytics.previousTotals.revenue}
        topCategory={analytics.topCategories[0]?.name}
        locale={locale}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(19rem,1fr)_minmax(0,2fr)]">
        <SalesCategoryPanel categories={analytics.topCategories} totalRevenue={analytics.totals.revenue} locale={locale} />
        <TopSellingProductsTable products={analytics.topProducts} totalRevenue={analytics.totals.revenue} locale={locale} />
      </div>

      <p className="sr-only">{t("netSalesDefinition", { amount: formatMoney(analytics.totals.revenue, locale) })}</p>
    </div>
  );
}
