import { getLocale, getTranslations } from "next-intl/server";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import type { Locale } from "@/src/i18n/routing";
import { DeliveryMetricGrid } from "./DeliveryMetricGrid";
import { DeliveryOperationsPanels } from "./DeliveryOperationsPanels";
import { DeliveryTrendChart } from "./DeliveryTrendChart";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";
import { ReportHeader } from "./ReportHeader";

type Props = { report: DeliveryPerformanceWire; zoneReport: DeliveryZonesWire; customers: CustomerOrderSummary[]; from: string; to: string; isCustomRange: boolean };

export async function DeliveryPerformanceScreen({ report, zoneReport, customers, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashDeliveryReport"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("heading")} title={t("heading")} subtitle={t("referenceSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }]} />
    <DeliveryMetricGrid report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(32rem,1fr)]"><DeliveryTrendChart report={report} title={t("onTimeTrend")} /><DeliveryOperationsPanels report={report} zoneReport={zoneReport} customers={customers} locale={locale} panel="zones" /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><DeliveryOperationsPanels report={report} customers={customers} locale={locale} panel="drivers" /><DeliveryOperationsPanels report={report} customers={customers} locale={locale} panel="issues" /></div>
  </div>;
}
