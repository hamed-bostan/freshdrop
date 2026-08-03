import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { DeliveryZoneAlerts, DeliveryZoneDemand, DeliveryZoneMap, DeliveryZoneMetrics, DeliveryZonePerformance } from "./DeliveryZoneDashboard";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Props = { report: DeliveryZonesWire; from: string; to: string; isCustomRange: boolean };

export async function DeliveryZonesScreen({ report, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashDeliveryReport");
  const ta = await getTranslations("dashAnalytics");
  const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground"><Link href="/dashboard/reports" className="hover:text-foreground">{t("reports")}</Link><ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden /><span className="font-medium text-foreground">{t("zonesHeading")}</span></nav>
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-heading-h2">{t("zonesHeading")}</h1><p className="mt-1 text-body-b10 text-muted-foreground">{t("zonesSubtitle")}</p></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><AnalyticsRangePicker presetLabel={ta("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]} fromLabel={ta("rangeFrom")} toLabel={ta("rangeTo")} from={from} to={to} isCustom={isCustomRange} /><div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">{ta("comparisonPeriod", { from: formatMediumDate(report.previousRange.from, locale), to: formatMediumDate(report.previousRange.to, locale) })}</div><AnalyticsExportMenu label={ta("exportHeading")} reports={[{ resource: "orders", label: ta("exportOrdersReport") }]} /></div></header>
    <DeliveryZoneMetrics report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(30rem,1fr)]"><DeliveryZoneMap report={report} /><DeliveryZonePerformance report={report} locale={locale} /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(26rem,.9fr)]"><DeliveryZoneDemand report={report} locale={locale} /><DeliveryZoneAlerts report={report} locale={locale} /></div>
  </div>;
}
