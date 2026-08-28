import { getLocale, getTranslations } from "next-intl/server";

import type { ComparisonMode } from "@/src/lib/api/analytics-params";

import { CustomerSegmentAttention } from "./CustomerSegmentAttention";
import { CustomerSegmentDistribution } from "./CustomerSegmentDistribution";
import { CustomerSegmentInsight } from "./CustomerSegmentInsight";
import { CustomerSegmentMetricGrid } from "./CustomerSegmentMetricGrid";
import { CustomerSegmentPerformanceTable } from "./CustomerSegmentPerformanceTable";
import { CustomerSegmentTrends } from "./CustomerSegmentTrends";
import { ReportHeader } from "./ReportHeader";

import type { CustomerSegmentsWire } from "./customer-segments-response-schema";

type Props = { report: CustomerSegmentsWire; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode };
export async function CustomerSegmentsScreen({ report, from, to, isCustomRange, compareMode }: Props) {
  const t = await getTranslations("dashCustomerSegments"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale();
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-5 md:gap-6 xl:gap-4"><ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("subtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} compareMode={compareMode} exportReports={[{ resource: "customers", label: ta("exportCustomersReport") }]} responsiveActions /><CustomerSegmentMetricGrid report={report} locale={locale} /><CustomerSegmentPerformanceTable segments={report.segments} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(22rem,1fr)]"><CustomerSegmentDistribution segments={report.segments} total={report.segmentedCustomers} locale={locale} /><CustomerSegmentTrends transitions={report.transitions} locale={locale} /></div><CustomerSegmentInsight report={report} locale={locale} /><div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(22rem,1fr)]"><CustomerSegmentAttention segments={report.segments} locale={locale} /><div aria-hidden /></div></div>;
}
