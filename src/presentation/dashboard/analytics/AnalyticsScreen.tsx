import { getLocale, getTranslations } from "next-intl/server";
import { ANALYTICS_RANGE_PRESETS, type RevenueRankSort } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import type { AnalyticsOverviewWire } from "./analytics-response-schema";
import { AnalyticsExportMenu } from "./AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./AnalyticsRangePicker";
import { RevenueChart } from "./RevenueChart";
import { TopPerformancePanel } from "./TopPerformancePanel";
import {
  AnalyticsInsights,
  AnalyticsKpiStrip,
  PriorityActionsCard,
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
  return (
    <div className="flex flex-col gap-4 pb-2">
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
            from={from}
            to={to}
          />
        </div>
      </header>

      <AnalyticsKpiStrip analytics={analytics} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.05fr)_minmax(20rem,0.95fr)]">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TopPerformancePanel products={analytics.topProducts} />
        <PriorityActionsCard analytics={analytics} />
      </div>
    </div>
  );
}
