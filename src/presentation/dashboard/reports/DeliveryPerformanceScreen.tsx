import { ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import type { CustomerOrderSummary } from "@/src/domain/entities/CustomerOrderSummary";
import { Link } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { DeliveryMetricGrid } from "./DeliveryMetricGrid";
import { DeliveryOperationsPanels } from "./DeliveryOperationsPanels";
import { DeliveryTrendChart } from "./DeliveryTrendChart";
import type { DeliveryPerformanceWire } from "./delivery-performance-response-schema";
import type { DeliveryZonesWire } from "./delivery-zones-response-schema";

type Props = { report: DeliveryPerformanceWire; zoneReport: DeliveryZonesWire; customers: CustomerOrderSummary[]; from: string; to: string; isCustomRange: boolean };

export async function DeliveryPerformanceScreen({ report, zoneReport, customers, from, to, isCustomRange }: Props) {
  const t = await getTranslations("dashDeliveryReport"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-4">
    <nav aria-label={t("breadcrumbAria")} className="flex items-center gap-2 text-body-b10 text-muted-foreground"><Link href="/dashboard/reports" className="hover:text-foreground">{t("reports")}</Link><ChevronRight className="size-3.5" /><span className="font-medium text-foreground">{t("heading")}</span></nav>
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-heading-h2">{t("heading")}</h1><p className="mt-1 text-body-b10 text-muted-foreground">{t("referenceSubtitle")}</p></div><div className="flex flex-wrap items-center gap-2"><AnalyticsRangePicker presetLabel={ta("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]} fromLabel={ta("rangeFrom")} toLabel={ta("rangeTo")} from={from} to={to} isCustom={isCustomRange} /><div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8">{ta("comparisonPeriod", { from: formatMediumDate(report.previousRange.from, locale), to: formatMediumDate(report.previousRange.to, locale) })}</div><AnalyticsExportMenu label={ta("exportHeading")} reports={[{ resource: "orders", label: ta("exportOrdersReport") }]} /></div></header>
    <DeliveryMetricGrid report={report} locale={locale} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(32rem,1fr)]"><DeliveryTrendChart report={report} title={t("onTimeTrend")} /><DeliveryOperationsPanels report={report} zoneReport={zoneReport} customers={customers} locale={locale} panel="zones" /></div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(32rem,.95fr)_minmax(0,1.35fr)]"><DeliveryOperationsPanels report={report} customers={customers} locale={locale} panel="drivers" /><DeliveryOperationsPanels report={report} customers={customers} locale={locale} panel="issues" /></div>
  </div>;
}
