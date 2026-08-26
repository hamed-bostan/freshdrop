import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import { wireRangeToParams, type ComparisonMode } from "@/src/lib/api/analytics-params";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";

import { AnalyticsComparePicker } from "../analytics/AnalyticsComparePicker";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { resolveComparePreviews } from "../analytics/compare-preview";

type ReportHeaderProps = {
  ariaLabel: string;
  parentLabel: string;
  currentLabel: string;
  title: string;
  subtitle: string;
  from: string;
  to: string;
  isCustomRange: boolean;
  comparisonRange: { from: string; to: string };
  compareMode: ComparisonMode;
  exportReports: { resource: string; label: string }[];
  responsiveActions?: boolean;
};

export async function ReportHeader({ ariaLabel, parentLabel, currentLabel, title, subtitle, from, to, isCustomRange, comparisonRange, compareMode, exportReports, responsiveActions = false }: ReportHeaderProps) {
  const ta = await getTranslations("dashAnalytics");
  const locale = (await getLocale());
  const { from: activeFrom, to: activeTo } = wireRangeToParams(comparisonRange);
  const previews = resolveComparePreviews(from, to, locale);
  const compareOptions = [
    { value: "none" as const, label: ta("compareNone"), subtitle: ta("compareNoneBody") },
    { value: "previous" as const, label: ta("comparePrevious"), subtitle: ta("rangeCaption", { from: previews.previous.formattedFrom, to: previews.previous.formattedTo }) },
    { value: "previousYear" as const, label: ta("comparePreviousYear"), subtitle: ta("rangeCaption", { from: previews.previousYear.formattedFrom, to: previews.previousYear.formattedTo }) },
    { value: "custom" as const, label: ta("compareCustom"), subtitle: ta("compareCustomBody") },
  ];
  const compareTriggerLabel = compareMode === "none" ? ta("compareNone") : ta("comparisonPeriod", { from: formatMediumDate(activeFrom, locale), to: formatMediumDate(activeTo, locale) });
  return (
    <>
      <nav aria-label={ariaLabel} className="flex items-center gap-2 text-body-b10 text-muted-foreground">
        <Link href="/dashboard/reports" className="hover:text-foreground">{parentLabel}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </nav>
      <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-heading-h2 text-foreground">{title}</h1>
          <p className="mt-1 text-body-b10 text-muted-foreground">{subtitle}</p>
        </div>
        <div className={responsiveActions ? "flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:grid md:w-full md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch xl:flex xl:flex-row xl:flex-nowrap xl:items-center xl:justify-end" : "flex flex-wrap items-center gap-2 xl:justify-end"}>
          <AnalyticsRangePicker
            className={responsiveActions ? "md:col-start-1 md:row-start-1 md:w-full xl:w-auto" : undefined}
            triggerClassName={responsiveActions ? "md:w-full xl:w-auto" : undefined}
            presetLabel={ta("rangeLabel")}
            presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]}
            fromLabel={ta("rangeFrom")}
            toLabel={ta("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <AnalyticsComparePicker
            className={responsiveActions ? "h-11 w-full justify-between sm:h-10 sm:w-auto md:col-span-2 md:col-start-1 md:row-start-2 md:w-full md:justify-center xl:col-auto xl:row-auto xl:w-auto xl:justify-between" : undefined}
            mode={compareMode}
            triggerLabel={compareTriggerLabel}
            heading={ta("compareLabel")}
            options={compareOptions}
            fromLabel={ta("rangeFrom")}
            toLabel={ta("rangeTo")}
            applyLabel={ta("compareApply")}
            cancelLabel={ta("compareCancel")}
            activeFrom={activeFrom}
            activeTo={activeTo}
            previousPeriodFrom={previews.previous.from}
            previousPeriodTo={previews.previous.to}
          />
          <AnalyticsExportMenu className={responsiveActions ? "w-full sm:w-auto md:col-start-2 md:row-start-1 xl:col-auto xl:row-auto" : undefined} label={ta("exportHeading")} reports={exportReports} from={from} to={to} />
        </div>
      </header>
    </>
  );
}
