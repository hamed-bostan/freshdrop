import { getLocale, getTranslations } from "next-intl/server";
import { ANALYTICS_RANGE_PRESETS, type RevenueRankSort } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";
import { AnalyticsExportMenu } from "./AnalyticsExportMenu";
import { AnalyticsMetricGrid } from "./AnalyticsMetricGrid";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./AnalyticsRangePicker";
import { RevenueChart } from "./RevenueChart";
import type { RevenueRankRow } from "./RevenueRankPanel";
import { TopPerformancePanel } from "./TopPerformancePanel";
import {
  AnalyticsInsights,
  BusinessHealthCard,
  CustomerMixCard,
  QuickAccessCard,
} from "./AnalyticsOverviewPanels";

export const ANALYTICS_RANK_LIMIT = 60;

type AnalyticsScreenProps = {
  analytics: AnalyticsOverviewWire;
  from: string;
  to: string;
  isCustomRange: boolean;
  productSort: RevenueRankSort;
  categorySort: RevenueRankSort;
  productsPage: number;
  categoriesPage: number;
};

export async function AnalyticsScreen({ analytics, from, to, isCustomRange }: AnalyticsScreenProps) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
  const productRows: RevenueRankRow[] = analytics.topProducts.map((product) => ({
    id: product.productId,
    label: product.name,
    imageUrl: product.imageUrl,
    units: product.units,
    revenue: product.revenue,
    href: `/dashboard/products/${product.productId}/edit`,
  }));
  const categoryRows: RevenueRankRow[] = analytics.topCategories.map((category) => ({
    id: category.categoryId,
    label: category.name,
    units: category.units,
    revenue: category.revenue,
    href: `/dashboard/products?categoryId=${category.categoryId}`,
  }));

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{t("overviewHeading")}</h1>
          <p className="mt-1 text-body-b10 text-muted-foreground">{t("metricsOverviewSubtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AnalyticsRangePicker
            presetLabel={t("rangeLabel")}
            presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: t(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: t("presetCustom") }]}
            fromLabel={t("rangeFrom")}
            toLabel={t("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">
            {t("comparisonPeriod", { from: formatMediumDate(analytics.previousRange.from, locale), to: formatMediumDate(analytics.previousRange.to, locale) })}
          </div>
          <AnalyticsExportMenu
            label={t("exportHeading")}
            reports={[
              { resource: "orders", label: t("exportOrdersReport") },
              { resource: "products", label: t("exportProductsReport") },
              { resource: "customers", label: t("exportCustomersReport") },
              { resource: "inventory-movements", label: t("exportInventoryReport") },
            ]}
          />
        </div>
      </header>

      <AnalyticsMetricGrid analytics={analytics} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(18rem,0.9fr)]">
        <RevenueChart
          points={analytics.revenueSeries}
          previousPoints={analytics.previousSeries}
          previousYearPoints={analytics.previousYearSeries}
          granularity={analytics.granularity}
          range={analytics.range}
          previousRange={analytics.previousRange}
          previousYearRange={analytics.previousYearRange}
        />
        <AnalyticsInsights analytics={analytics} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,.9fr)]">
        <TopPerformancePanel products={productRows} categories={categoryRows} />
        <CustomerMixCard analytics={analytics} />
        <BusinessHealthCard analytics={analytics} />
        <QuickAccessCard />
      </div>
    </div>
  );
}
