import { getLocale, getTranslations } from "next-intl/server";

import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import { wireRangeToParams, type ComparisonMode } from "@/src/lib/api/analytics-params";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";

import { AnalyticsComparePicker } from "./AnalyticsComparePicker";
import { AnalyticsExportMenu } from "./AnalyticsExportMenu";
import {
  AnalyticsInsights,
  AnalyticsKpiStrip,
  PriorityActionsCard,
} from "./AnalyticsOverviewPanels";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "./AnalyticsRangePicker";
import { resolveComparePreviews } from "./compare-preview";
import { RevenueChart } from "./RevenueChart";
import { TopPerformancePanel } from "./TopPerformancePanel";

import type { AnalyticsOverviewWire } from "./analytics-response-schema";

type AnalyticsScreenProps = {
  analytics: AnalyticsOverviewWire;
  from: string;
  to: string;
  isCustomRange: boolean;
  compareMode: ComparisonMode;
};

export async function AnalyticsScreen({ analytics, from, to, isCustomRange, compareMode }: AnalyticsScreenProps) {
  const t = await getTranslations("dashAnalytics");
  const locale = (await getLocale());
  const { from: activeFrom, to: activeTo } = wireRangeToParams(analytics.previousRange);
  const previews = resolveComparePreviews(from, to, locale);
  const compareOptions = [
    { value: "none" as const, label: t("compareNone"), subtitle: t("compareNoneBody") },
    { value: "previous" as const, label: t("comparePrevious"), subtitle: t("rangeCaption", { from: previews.previous.formattedFrom, to: previews.previous.formattedTo }) },
    { value: "previousYear" as const, label: t("comparePreviousYear"), subtitle: t("rangeCaption", { from: previews.previousYear.formattedFrom, to: previews.previousYear.formattedTo }) },
    { value: "custom" as const, label: t("compareCustom"), subtitle: t("compareCustomBody") },
  ];
  const compareTriggerLabel = compareMode === "none" ? t("compareNone") : t("comparisonPeriod", { from: formatMediumDate(activeFrom, locale), to: formatMediumDate(activeTo, locale) });
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
          <AnalyticsComparePicker
            mode={compareMode}
            triggerLabel={compareTriggerLabel}
            heading={t("compareLabel")}
            options={compareOptions}
            fromLabel={t("rangeFrom")}
            toLabel={t("rangeTo")}
            applyLabel={t("compareApply")}
            cancelLabel={t("compareCancel")}
            activeFrom={activeFrom}
            activeTo={activeTo}
            previousPeriodFrom={previews.previous.from}
            previousPeriodTo={previews.previous.to}
          />
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
