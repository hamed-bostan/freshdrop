import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/src/i18n/routing";
import { CustomerGrowthChart } from "./CustomerGrowthChart";
import { CustomerInsightBanner } from "./CustomerInsightBanner";
import type { CustomerInsightsWire } from "./customer-insights-response-schema";
import { CustomerMetricGrid } from "./CustomerMetricGrid";
import { CustomerMixPanel } from "./CustomerMixPanel";
import { PurchaseFrequencyPanel } from "./PurchaseFrequencyPanel";
import { ReportHeader } from "./ReportHeader";
import { RetentionCohortTable } from "./RetentionCohortTable";

type Props = { report: CustomerInsightsWire; from: string; to: string; isCustomRange: boolean };

export async function CustomerInsightsScreen({ report, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashCustomerInsights");
  const ta = await getTranslations("dashAnalytics");
  const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("subtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} exportReports={[{ resource: "customers", label: ta("exportCustomersReport") }]} />
    <CustomerMetricGrid report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]"><CustomerGrowthChart report={report} /><CustomerMixPanel segments={report.segments} locale={locale} /></div>
    <CustomerInsightBanner report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(24rem,1fr)]"><RetentionCohortTable cohorts={report.cohorts} locale={locale} /><PurchaseFrequencyPanel frequency={report.frequency} locale={locale} /></div>
  </div>;
}
