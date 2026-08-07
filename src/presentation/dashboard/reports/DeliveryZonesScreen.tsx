import { getLocale, getTranslations } from "next-intl/server";

import type { ComparisonMode } from "@/src/lib/api/analytics-params";

import { DeliveryZoneAlerts, DeliveryZoneDemand, DeliveryZoneMap, DeliveryZoneMetrics, DeliveryZonePerformance } from "./DeliveryZoneDashboard";
import { ReportHeader } from "./ReportHeader";

import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Props = { report: DeliveryZonesWire; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode };

export async function DeliveryZonesScreen({ report, from, to, isCustomRange, compareMode }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const ta = await getTranslations("dashAnalytics");
  const locale = await getLocale();
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("zonesHeading")} title={t("zonesHeading")} subtitle={t("zonesSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} compareMode={compareMode} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }]} />
    <DeliveryZoneMetrics report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(30rem,1fr)]"><DeliveryZoneMap report={report} locale={locale} /><DeliveryZonePerformance report={report} locale={locale} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(26rem,.9fr)]"><DeliveryZoneDemand report={report} locale={locale} /><DeliveryZoneAlerts report={report} locale={locale} /></div>
  </div>;
}
