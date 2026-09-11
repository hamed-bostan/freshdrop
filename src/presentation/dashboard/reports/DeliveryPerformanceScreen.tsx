import { getLocale, getTranslations } from "next-intl/server";

import type { DeliveryIssue } from "@/src/domain/entities/DeliveryIssue";
import type { ComparisonMode } from "@/src/lib/api/analytics-params";

import { DeliveryIssuesPanel } from "./DeliveryIssuesPanel";
import { DeliveryMetricGrid } from "./DeliveryMetricGrid";
import { DeliveryOperationsPanels } from "./DeliveryOperationsPanels";
import { DeliveryTrendChart } from "./DeliveryTrendChart";
import { ReportHeader } from "./ReportHeader";

import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Props = { report: DeliveryPerformanceWire; zoneReport: DeliveryZonesWire; issues: DeliveryIssue[]; canWriteIssues: boolean; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode };

const OPERATIONS_GRID_CLASS = "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(32rem,1fr)]";

export async function DeliveryPerformanceScreen({ report, zoneReport, issues, canWriteIssues, from, to, isCustomRange, compareMode }: Props) {
  const t = await getTranslations("dashDeliveryReport"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale();
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-5 md:gap-6">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("referenceSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} compareMode={compareMode} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }]} responsiveActions />
    <DeliveryMetricGrid report={report} locale={locale} />
    <div className={OPERATIONS_GRID_CLASS}><DeliveryTrendChart report={report} title={t("onTimeTrend")} /><DeliveryOperationsPanels report={report} zoneReport={zoneReport} locale={locale} panel="zones" /></div>
    <div className={OPERATIONS_GRID_CLASS}><DeliveryOperationsPanels report={report} locale={locale} panel="drivers" /><DeliveryIssuesPanel issues={issues} locale={locale} canWrite={canWriteIssues} /></div>
  </div>;
}
