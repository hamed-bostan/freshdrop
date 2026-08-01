import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { CustomerSegmentAttention } from "./CustomerSegmentAttention";
import { CustomerSegmentDistribution } from "./CustomerSegmentDistribution";
import { CustomerSegmentInsight } from "./CustomerSegmentInsight";
import { CustomerSegmentMetricGrid } from "./CustomerSegmentMetricGrid";
import { CustomerSegmentPerformanceTable } from "./CustomerSegmentPerformanceTable";
import { CustomerSegmentTrends } from "./CustomerSegmentTrends";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

type Props = { report: CustomerSegmentsWire; from: string; to: string; isCustomRange: boolean };
export async function CustomerSegmentsScreen({ report, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashCustomerSegments"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4"><nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground"><Link href="/dashboard/reports" className="hover:text-foreground">{t("reports")}</Link><ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden /><span className="font-medium text-foreground">{t("heading")}</span></nav><header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-heading-h2">{t("heading")}</h1><p className="mt-1 text-body-b10 text-muted-foreground">{t("subtitle")}</p></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><AnalyticsRangePicker presetLabel={ta("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]} fromLabel={ta("rangeFrom")} toLabel={ta("rangeTo")} from={from} to={to} isCustom={isCustomRange} /><div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8">{ta("comparisonPeriod", { from: formatMediumDate(report.previousRange.from, locale), to: formatMediumDate(report.previousRange.to, locale) })}</div><AnalyticsExportMenu label={ta("exportHeading")} reports={[{ resource: "customers", label: ta("exportCustomersReport") }]} /></div></header><CustomerSegmentMetricGrid report={report} locale={locale} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]"><CustomerSegmentPerformanceTable segments={report.segments} /><CustomerSegmentDistribution segments={report.segments} total={report.segmentedCustomers} locale={locale} /></div><CustomerSegmentInsight report={report} locale={locale} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,1fr)]"><CustomerSegmentTrends segments={report.segments} locale={locale} /><CustomerSegmentAttention segments={report.segments} locale={locale} /></div></div>;
}
