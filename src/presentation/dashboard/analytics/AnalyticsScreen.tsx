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
    <div className="flex min-w-0 flex-col gap-4 pb-2 sm:gap-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[clamp(1.75rem,4vw,2rem)] font-bold leading-[1.2] text-foreground">{t("overviewHeading")}</h1>
          <p className="mt-1 text-body-b6 leading-relaxed text-muted-foreground">{t("metricsOverviewSubtitle")}</p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:grid md:w-full md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch lg:flex lg:flex-row lg:flex-nowrap lg:items-center lg:justify-end">
          <AnalyticsRangePicker
            className="md:col-start-1 md:row-start-1 md:w-full lg:w-auto"
            triggerClassName="md:w-full lg:w-auto"
            presetLabel={t("rangeLabel")}
            presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: t(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: t("presetCustom") }]}
            fromLabel={t("rangeFrom")}
            toLabel={t("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <AnalyticsComparePicker
            className="h-11 w-full justify-between sm:h-10 sm:w-auto md:col-span-2 md:col-start-1 md:row-start-2 md:w-full md:justify-center lg:col-auto lg:row-auto lg:w-auto lg:justify-between"
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
            className="w-full sm:w-auto md:col-start-2 md:row-start-1 lg:col-auto lg:row-auto"
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
