import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { CustomerSegmentAttention } from "./CustomerSegmentAttention";
import { CustomerSegmentDistribution } from "./CustomerSegmentDistribution";
import { CustomerSegmentInsight } from "./CustomerSegmentInsight";
import { CustomerSegmentMetricGrid } from "./CustomerSegmentMetricGrid";
import { CustomerSegmentPerformanceTable } from "./CustomerSegmentPerformanceTable";
import { CustomerSegmentTrends } from "./CustomerSegmentTrends";
import type { CustomerSegmentsWire } from "./customer-segments-response-schema";
import { ReportHeader } from "./ReportHeader";

type Props = { report: CustomerSegmentsWire; from: string; to: string; isCustomRange: boolean };
export async function CustomerSegmentsScreen({ report, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashCustomerSegments"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4"><ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("subtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} exportReports={[{ resource: "customers", label: ta("exportCustomersReport") }]} /><CustomerSegmentMetricGrid report={report} locale={locale} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]"><CustomerSegmentPerformanceTable segments={report.segments} /><CustomerSegmentDistribution segments={report.segments} total={report.segmentedCustomers} locale={locale} /></div><CustomerSegmentInsight report={report} locale={locale} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,1fr)]"><CustomerSegmentTrends segments={report.segments} locale={locale} /><CustomerSegmentAttention segments={report.segments} locale={locale} /></div></div>;
}
