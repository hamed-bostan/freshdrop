import { getLocale, getTranslations } from "next-intl/server";
import { ChartNoAxesCombined, ClipboardList, CreditCard, FileSpreadsheet, MapPin, PackageX, RefreshCcw, Truck, UserRound, UsersRound } from "lucide-react";
import { ANALYTICS_RANGE_PRESETS } from "@/src/domain/entities/Analytics";
import { formatMediumDate } from "@/src/lib/formatAnalyticsDate";
import type { Locale } from "@/src/i18n/routing";
import { Icon, focusRing } from "@/src/presentation/design-system";
import { cn } from "@/src/lib/utils";
import { AnalyticsExportMenu } from "../analytics/AnalyticsExportMenu";
import { AnalyticsRangePicker, CUSTOM_RANGE_VALUE } from "../analytics/AnalyticsRangePicker";
import { ReportDirectoryCard, type ReportDirectoryItem } from "./ReportDirectoryCard";

type ReportGroup = { id: string; title: string; items: ReportDirectoryItem[] };
type Props = { from: string; to: string; isCustomRange: boolean; comparisonRange: { from: string; to: string } };

export async function ReportsScreen({ from, to, isCustomRange, comparisonRange }: Props) {
  const t = await getTranslations("dashReports"); const ta = await getTranslations("dashAnalytics"); const locale = await getLocale() as Locale;
  const groups: ReportGroup[] = [
    { id: "sales", title: t("sales"), items: [
      { id: "payments", title: t("paymentSummary"), description: t("paymentSummaryDescription"), href: "/dashboard/reports/payments", icon: CreditCard, tone: "green" },
      { id: "sales-report", title: t("salesReport"), description: t("salesReportDescription"), href: "/dashboard/reports/sales", icon: ChartNoAxesCombined, tone: "green" },
    ] },
    { id: "returns", title: t("returnsRefunds"), items: [
      { id: "refunds", title: t("refundsReturns"), description: t("refundsReturnsDescription"), href: "/dashboard/reports/refunds", icon: RefreshCcw, tone: "red" },
      { id: "return-items", title: t("returnItems"), description: t("returnItemsDescription"), href: "/dashboard/reports/refunds", icon: PackageX, tone: "red" },
    ] },
    { id: "delivery", title: t("delivery"), items: [
      { id: "delivery-performance", title: t("deliveryPerformance"), description: t("deliveryPerformanceDescription"), href: "/dashboard/reports/delivery-performance", icon: Truck, tone: "blue" },
      { id: "delivery-zones", title: t("deliveryZones"), description: t("deliveryZonesDescription"), href: "/dashboard/reports/delivery-performance", icon: MapPin, tone: "blue" },
    ] },
    { id: "customers", title: t("customers"), items: [
      { id: "customer-insights", title: t("customerInsights"), description: t("customerInsightsDescription"), href: "/dashboard/reports/customer-insights", icon: UserRound, tone: "violet" },
      { id: "customer-segments", title: t("customerSegments"), description: t("customerSegmentsDescription"), href: "/dashboard/reports/customer-segments", icon: UsersRound, tone: "violet" },
    ] },
    { id: "exports", title: t("exports"), items: [
      { id: "export-reports", title: t("exportReports"), description: t("exportReportsDescription"), href: "/dashboard/reports/exports", icon: FileSpreadsheet, tone: "green" },
    ] },
  ];

  return <div className="mx-auto flex w-full max-w-[1536px] flex-col gap-5">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div><h1 className="text-heading-h2 text-foreground">{t("heading")}</h1><p className="mt-1 text-body-b7 text-muted-foreground">{t("subtitle")}</p></div><div className="flex flex-wrap items-center gap-2 xl:justify-end"><AnalyticsRangePicker presetLabel={ta("rangeLabel")} presetOptions={[...ANALYTICS_RANGE_PRESETS.map((preset) => ({ value: preset, label: ta(`preset.${preset}`) })), { value: CUSTOM_RANGE_VALUE, label: ta("presetCustom") }]} fromLabel={ta("rangeFrom")} toLabel={ta("rangeTo")} from={from} to={to} isCustom={isCustomRange} /><div className="flex h-10 items-center rounded-input border border-border px-4 text-body-b8 text-foreground">{ta("comparisonPeriod", { from: formatMediumDate(comparisonRange.from, locale), to: formatMediumDate(comparisonRange.to, locale) })}</div><AnalyticsExportMenu label={ta("exportHeading")} reports={[{ resource: "orders", label: ta("exportOrdersReport") }, { resource: "products", label: ta("exportProductsReport") }, { resource: "customers", label: ta("exportCustomersReport") }, { resource: "inventory-movements", label: ta("exportInventoryReport") }]} /></div></header>
    <div className="flex flex-col gap-4">{groups.map((group) => <section key={group.id} aria-labelledby={`report-group-${group.id}`}><h2 id={`report-group-${group.id}`} className="mb-2 text-body-b5 text-foreground">{group.title}</h2><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{group.items.map((item) => <ReportDirectoryCard key={item.id} item={item} fullWidth={group.items.length === 1} openAria={t("openReportAria", { report: item.title })} />)}</div></section>)}</div>
    <aside className="flex flex-col gap-4 rounded-card-lg border border-primary/20 bg-accent/60 p-4 sm:flex-row sm:items-center"><span className="flex size-14 shrink-0 rotate-[-6deg] items-center justify-center rounded-card-lg border border-primary/20 bg-background text-primary shadow-card"><Icon icon={ClipboardList} size="md" /></span><div className="min-w-0 flex-1"><h2 className="text-body-b5 text-foreground">{t("needSomethingElse")}</h2><p className="mt-1 text-body-b8 text-muted-foreground">{t("requestDescription")}</p></div><a href="mailto:support@yourapp.com?subject=Report%20request" className={cn(focusRing, "inline-flex h-10 shrink-0 items-center justify-center rounded-input border border-primary/40 bg-background px-6 text-body-b7 font-semibold text-primary hover:bg-accent")}>{t("requestReport")}</a></aside>
  </div>;
}
