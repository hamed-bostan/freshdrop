import { getLocale, getTranslations } from "next-intl/server";

import type { ComparisonMode } from "@/src/lib/api/analytics-params";

import { DeliveryZoneAlerts, DeliveryZoneMap, DeliveryZoneMetrics, DeliveryZonePerformance } from "./DeliveryZoneDashboard";
import { ReportHeader } from "./ReportHeader";

import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Props = { report: DeliveryZonesWire; from: string; to: string; isCustomRange: boolean; compareMode: ComparisonMode };

export async function DeliveryZonesScreen({ report, from, to, isCustomRange, compareMode }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const ta = await getTranslations("dashAnalytics");
  const locale = await getLocale();
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-5 md:gap-6 xl:gap-4">
    <ReportHeader ariaLabel={t("breadcrumbAria")} parentLabel={t("reports")} currentLabel={t("zonesHeading")} title={t("zonesHeading")} subtitle={t("zonesSubtitle")} from={from} to={to} isCustomRange={isCustomRange} comparisonRange={report.previousRange} compareMode={compareMode} exportReports={[{ resource: "orders", label: ta("exportOrdersReport") }]} responsiveActions />
    <DeliveryZoneMetrics report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(24rem,1fr)] xl:grid-rows-2">
      <div className="xl:row-span-2"><DeliveryZoneMap report={report} locale={locale} /></div>
      <DeliveryZonePerformance report={report} locale={locale} />
      <DeliveryZoneAlerts report={report} locale={locale} />
    </div>
  </div>;
}
