import { getLocale, getTranslations } from "next-intl/server";
import type { DeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import type { Locale } from "@/src/i18n/routing";
import type { ComparisonMode } from "@/src/lib/api/analytics-params";
import { DeliveryDemandByWindow } from "./DeliveryDemandByWindow";
import { DeliveryIssuesPanel } from "./DeliveryIssuesPanel";
import { DeliveryMetricGrid } from "./DeliveryMetricGrid";
import { DeliveryOperationsPanels } from "./DeliveryOperationsPanels";
import { DeliveryTrendChart } from "./DeliveryTrendChart";
import { DeliveryWindowPerformance } from "./DeliveryWindowPerformance";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";
import { ReportHeader } from "./ReportHeader";

type Props = { report: DeliveryPerformanceWire; zoneReport: DeliveryZonesWire; issues: DeliveryIssue[]; canWriteIssues: boolean; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode };

export async function DeliveryPerformanceScreen({ report, zoneReport, issues, canWriteIssues, from, to, isCustomRange, compareMode }: Props) {
  const t = await getTranslations("dashDeliveryReport"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("referenceSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} compareMode={compareMode} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }]} />
    <DeliveryMetricGrid report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(32rem,1fr)]"><DeliveryTrendChart report={report} title={t("onTimeTrend")} /><DeliveryOperationsPanels report={report} zoneReport={zoneReport} locale={locale} panel="zones" /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><DeliveryOperationsPanels report={report} locale={locale} panel="drivers" /><DeliveryIssuesPanel issues={issues} locale={locale} canWrite={canWriteIssues} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><DeliveryWindowPerformance windows={report.windows} locale={locale} /><DeliveryDemandByWindow windows={report.windows} locale={locale} /></div>
  </div>;
}
