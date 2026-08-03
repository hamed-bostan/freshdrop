import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import type { Locale } from "@/src/i18n/routing";
import { Link } from "@/src/i18n/navigation";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";

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
  exportReports: { resource: string; label: string }[];
};

export async function ReportHeader({ ariaLabel, parentLabel, currentLabel, title, subtitle, from, to, isCustomRange, comparisonRange, exportReports }: ReportHeaderProps) {
  const ta = await getTranslations("dashAnalytics");
  const locale = (await getLocale()) as Locale;
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
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
          <AnalyticsRangePicker
            presetLabel={ta("rangeLabel")}
            presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]}
            fromLabel={ta("rangeFrom")}
            toLabel={ta("rangeTo")}
            from={from}
            to={to}
            isCustom={isCustomRange}
          />
          <div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">
            {ta("comparisonPeriod", { from: formatMediumDate(comparisonRange.from, locale), to: formatMediumDate(comparisonRange.to, locale) })}
          </div>
          <AnalyticsExportMenu label={ta("exportHeading")} reports={exportReports} />
        </div>
      </header>
    </>
  );
}
